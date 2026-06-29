import test from 'node:test';
import assert from 'node:assert/strict';

const ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function makeRequest(headers = {}) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value]),
  );

  return {
    headers: {
      get(name) {
        return normalized[String(name).toLowerCase()] ?? null;
      },
    },
  };
}

async function importBalanceModule(t, envOverrides) {
  const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    const nextValue = envOverrides[key];
    if (typeof nextValue === 'string') process.env[key] = nextValue;
    else delete process.env[key];
  }

  t.after(() => {
    for (const key of ENV_KEYS) {
      if (typeof previousEnv[key] === 'string') process.env[key] = previousEnv[key];
      else delete process.env[key];
    }
  });

  const moduleUrl = new URL('../balance.js', import.meta.url);
  moduleUrl.searchParams.set('case', `${Date.now()}-${Math.random()}`);
  return import(moduleUrl.href);
}

function makeJsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

async function readFetchRequest(input, init) {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const method = request.method || 'GET';
  const headers = Object.fromEntries(request.headers.entries());
  const bodyText = method === 'GET' || method === 'HEAD' ? '' : await request.clone().text();

  return {
    url: request.url,
    method,
    headers,
    bodyText,
    bodyJson: bodyText ? JSON.parse(bodyText) : null,
  };
}

test('getUserForGallery использует anon-клиент и читает токен из cookie даже без billing', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);

    assert.strictEqual(new URL(request.url).pathname, '/auth/v1/user');
    assert.strictEqual(request.method, 'GET');
    assert.strictEqual(request.headers.apikey, 'anon-key');
    assert.strictEqual(request.headers.authorization, 'Bearer cookie-token');

    return makeJsonResponse({ id: 'user-1', email: 'cat@example.com' });
  });

  const balanceModule = await importBalanceModule(t, {
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: '',
  });

  const user = await balanceModule.getUserForGallery(
    makeRequest({ cookie: 'foo=1; sb_access_token=cookie-token; bar=2' }),
  );

  assert.deepStrictEqual(user, { id: 'user-1', email: 'cat@example.com' });
  assert.strictEqual(balanceModule.BILLING_ENABLED, false);
  assert.strictEqual(calls.length, 1);
});

test('getBalance получает пользователя по x-sb-token и возвращает округлённый баланс', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const pathname = new URL(request.url).pathname;

    if (pathname === '/auth/v1/user') {
      assert.strictEqual(request.headers.apikey, 'anon-key');
      assert.strictEqual(request.headers.authorization, 'Bearer header-token');
      return makeJsonResponse({ id: 'user-42' });
    }

    assert.strictEqual(pathname, '/rest/v1/profiles');
    assert.strictEqual(request.method, 'GET');
    assert.strictEqual(request.headers.apikey, 'service-key');
    assert.match(request.url, /select=balance/);
    assert.match(request.url, /id=eq\.user-42/);
    return makeJsonResponse({ balance: 123.456 });
  });

  const balanceModule = await importBalanceModule(t, {
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  });

  const balance = await balanceModule.getBalance(
    makeRequest({ 'x-sb-token': 'header-token' }),
  );

  assert.strictEqual(balance, 123.46);
  assert.strictEqual(balanceModule.BILLING_ENABLED, true);
  assert.strictEqual(calls.length, 2);
});

test('deduct делает CAS-списание и пишет отрицательную транзакцию', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const pathname = new URL(request.url).pathname;

    assert.strictEqual(request.headers.apikey, 'service-key');

    if (pathname === '/rest/v1/profiles' && request.method === 'GET') {
      assert.match(request.url, /select=balance/);
      assert.match(request.url, /id=eq\.user-7/);
      return makeJsonResponse({ balance: 10 });
    }

    if (pathname === '/rest/v1/profiles' && request.method === 'PATCH') {
      assert.match(request.url, /id=eq\.user-7/);
      assert.match(request.url, /balance=eq\.10/);
      assert.deepStrictEqual(request.bodyJson, { balance: 6.78 });
      return makeJsonResponse([{ balance: 6.78 }]);
    }

    if (pathname === '/rest/v1/balance_transactions' && request.method === 'POST') {
      assert.deepStrictEqual(request.bodyJson, {
        user_id: 'user-7',
        amount: -3.22,
        reason: 'Генерация',
        meta: { model: 'seedance' },
      });
      return makeJsonResponse({});
    }

    throw new Error(`Неожиданный запрос: ${request.method} ${request.url}`);
  });

  const balanceModule = await importBalanceModule(t, {
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  });

  const result = await balanceModule.deduct('user-7', 3.22, 'Генерация', { model: 'seedance' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepStrictEqual(result, { ok: true, balance: 6.78 });
  assert.strictEqual(calls.length, 3);
});

test('spendBalance создаёт пользовательский anon-клиент с Authorization и вызывает RPC', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);

    assert.strictEqual(new URL(request.url).pathname, '/rest/v1/rpc/spend_balance');
    assert.strictEqual(request.method, 'POST');
    assert.strictEqual(request.headers.apikey, 'anon-key');
    assert.strictEqual(request.headers.authorization, 'Bearer jwt-123');
    assert.deepStrictEqual(request.bodyJson, {
      p_amount: 12.35,
      p_reason: 'Генерация фото',
      p_meta: { source: 'studio' },
    });

    return makeJsonResponse({ ok: true, balance: 77.65 });
  });

  const balanceModule = await importBalanceModule(t, {
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  });

  const result = await balanceModule.spendBalance(
    makeRequest({ 'x-sb-token': 'jwt-123' }),
    12.345,
    'Генерация фото',
    { source: 'studio' },
  );

  assert.deepStrictEqual(result, { ok: true, balance: 77.65 });
  assert.strictEqual(calls.length, 1);
});
