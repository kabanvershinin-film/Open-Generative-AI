import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';

const ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TOCHKA_TOKEN',
  'TOCHKA_CUSTOMER_CODE',
  'TOCHKA_TAX_SYSTEM_CODE',
  'PUBLIC_BASE_URL',
  'CRON_SECRET',
  'TOCHKA_WEBHOOK_SECRET',
];

const DEFAULT_ENV = {
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  TOCHKA_TOKEN: 'tochka-token',
  TOCHKA_CUSTOMER_CODE: 'customer-42',
  TOCHKA_TAX_SYSTEM_CODE: 'usn',
  PUBLIC_BASE_URL: 'https://memefast.example',
  CRON_SECRET: 'cron-secret',
  TOCHKA_WEBHOOK_SECRET: 'webhook-secret',
};

async function importRouteModule(t, envOverrides = {}) {
  const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  for (const key of ENV_KEYS) {
    const nextValue = envOverrides[key] ?? DEFAULT_ENV[key];
    if (typeof nextValue === 'string') process.env[key] = nextValue;
    else delete process.env[key];
  }

  const sourceUrl = new URL('./route.js', import.meta.url);
  const tempUrl = new URL(`./.route.runtime.${Date.now()}.${Math.random().toString(16).slice(2)}.mjs`, import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  const patchedSource = source
    .replace("from 'next/server';", "from 'next/server.js';")
    .replace("from '../../_lib/balance';", "from '../../_lib/balance.js';");
  await writeFile(tempUrl, patchedSource, 'utf8');

  t.after(async () => {
    await rm(tempUrl, { force: true });
    for (const key of ENV_KEYS) {
      if (typeof previousEnv[key] === 'string') process.env[key] = previousEnv[key];
      else delete process.env[key];
    }
  });

  tempUrl.searchParams.set('case', `${Date.now()}-${Math.random()}`);
  return import(tempUrl.href);
}

function makeRequest({
  url = 'https://memefast.example/api/payments',
  headers = {},
  jsonBody,
  textBody,
} = {}) {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Headers(headers),
    async json() {
      if (jsonBody === undefined) throw new Error('Нет JSON');
      return jsonBody;
    },
    async text() {
      if (typeof textBody === 'string') return textBody;
      if (jsonBody === undefined) return '';
      return JSON.stringify(jsonBody);
    },
  };
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

async function callPost(module, action, request) {
  return module.POST(request, { params: Promise.resolve({ action: [action] }) });
}

async function callGet(module, action, request) {
  return module.GET(request, { params: Promise.resolve({ action: [action] }) });
}

test('POST create создаёт платёж, запись в базе и возвращает ссылку оплаты', { concurrency: false }, async (t) => {
  t.mock.method(Date, 'now', () => 1712345678901);

  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const url = new URL(request.url);

    if (url.pathname === '/auth/v1/user') {
      assert.strictEqual(request.method, 'GET');
      assert.strictEqual(request.headers.apikey, 'anon-key');
      assert.strictEqual(request.headers.authorization, 'Bearer jwt-create');
      return makeJsonResponse({
        id: 'user-12345678',
        email: 'cat@example.com',
        user_metadata: { full_name: 'Кот Тестовый' },
      });
    }

    if (url.pathname === '/uapi/acquiring/v1.0/retailers') {
      assert.strictEqual(request.headers.authorization, 'Bearer tochka-token');
      assert.strictEqual(url.searchParams.get('customerCode'), 'customer-42');
      return makeJsonResponse({
        Data: {
          Retailer: [
            { merchantId: 'merchant-inactive', isActive: false },
            { merchantId: 'merchant-active', isActive: true },
          ],
        },
      });
    }

    if (url.pathname === '/rest/v1/payments' && request.method === 'POST') {
      assert.strictEqual(request.headers.apikey, 'service-key');
      assert.deepStrictEqual(request.bodyJson, {
        id: 'cc-user-123-1712345678901',
        user_id: 'user-12345678',
        amount: 250,
        status: 'pending',
      });
      return makeJsonResponse({});
    }

    if (url.pathname === '/uapi/acquiring/v1.0/payments_with_receipt') {
      assert.strictEqual(request.method, 'POST');
      assert.strictEqual(request.headers.authorization, 'Bearer tochka-token');
      assert.strictEqual(request.bodyJson.Data.customerCode, 'customer-42');
      assert.strictEqual(request.bodyJson.Data.amount, 250);
      assert.strictEqual(request.bodyJson.Data.merchantId, 'merchant-active');
      assert.strictEqual(request.bodyJson.Data.paymentLinkId, 'cc-user-123-1712345678901');
      assert.strictEqual(
        request.bodyJson.Data.redirectUrl,
        'https://memefast.example/?payment=success&order=cc-user-123-1712345678901',
      );
      assert.strictEqual(
        request.bodyJson.Data.failRedirectUrl,
        'https://memefast.example/?payment=fail&order=cc-user-123-1712345678901',
      );
      assert.deepStrictEqual(request.bodyJson.Data.Client, {
        name: 'Кот Тестовый',
        email: 'cat@example.com',
      });
      return makeJsonResponse({
        Data: {
          paymentLink: 'https://pay.tochka.example/checkout',
          operationId: 'operation-1',
        },
      });
    }

    if (url.pathname === '/rest/v1/payments' && request.method === 'PATCH') {
      assert.match(request.url, /id=eq\.cc-user-123-1712345678901/);
      assert.deepStrictEqual(request.bodyJson, { operation_id: 'operation-1' });
      return makeJsonResponse([]);
    }

    throw new Error(`Неожиданный запрос: ${request.method} ${request.url}`);
  });

  const routeModule = await importRouteModule(t);
  const response = await callPost(routeModule, 'create', makeRequest({
    url: 'https://memefast.example/api/payments/create',
    headers: { authorization: 'Bearer jwt-create' },
    jsonBody: { amount: 250 },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(data, {
    paymentUrl: 'https://pay.tochka.example/checkout',
    orderId: 'cc-user-123-1712345678901',
  });
  assert.strictEqual(calls.length, 5);
});

test('POST verify подтверждает оплату и зачисляет баланс пользователю', { concurrency: false }, async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const url = new URL(request.url);

    if (url.pathname === '/auth/v1/user') {
      assert.strictEqual(request.headers.authorization, 'Bearer jwt-verify');
      return makeJsonResponse({ id: 'user-1', email: 'cat@example.com' });
    }

    if (url.pathname === '/rest/v1/payments' && request.method === 'GET') {
      assert.match(request.url, /id=eq\.order-1/);
      return makeJsonResponse({
        id: 'order-1',
        user_id: 'user-1',
        amount: 200,
        operation_id: 'op-verify',
        status: 'pending',
      });
    }

    if (url.pathname === '/uapi/acquiring/v1.0/payments/op-verify') {
      assert.strictEqual(request.method, 'GET');
      assert.strictEqual(request.headers.authorization, 'Bearer tochka-token');
      return makeJsonResponse({ Data: { status: 'PAID' } });
    }

    if (url.pathname === '/rest/v1/payments' && request.method === 'PATCH') {
      if (request.url.includes('status=neq.paid')) {
        assert.match(request.url, /id=eq\.order-1/);
        assert.strictEqual(request.bodyJson.status, 'paid');
        assert.ok(typeof request.bodyJson.paid_at === 'string');
        return makeJsonResponse([{ id: 'order-1' }]);
      }
      throw new Error(`Неожиданное обновление payments: ${request.url}`);
    }

    if (url.pathname === '/rest/v1/profiles' && request.method === 'GET') {
      assert.match(request.url, /id=eq\.user-1/);
      assert.match(request.url, /select=balance/);
      return makeJsonResponse({ balance: 50 });
    }

    if (url.pathname === '/rest/v1/profiles' && request.method === 'PATCH') {
      assert.match(request.url, /id=eq\.user-1/);
      assert.match(request.url, /balance=eq\.50/);
      assert.deepStrictEqual(request.bodyJson, { balance: 250 });
      return makeJsonResponse([{ balance: 250 }]);
    }

    if (url.pathname === '/rest/v1/balance_transactions' && request.method === 'POST') {
      assert.deepStrictEqual(request.bodyJson, {
        user_id: 'user-1',
        amount: 200,
        reason: 'payment',
        meta: {
          orderId: 'order-1',
          operationId: 'op-verify',
          source: 'verify',
        },
      });
      return makeJsonResponse({});
    }

    throw new Error(`Неожиданный запрос: ${request.method} ${request.url}`);
  });

  const routeModule = await importRouteModule(t);
  const response = await callPost(routeModule, 'verify', makeRequest({
    url: 'https://memefast.example/api/payments/verify',
    headers: { authorization: 'Bearer jwt-verify' },
    jsonBody: { orderId: 'order-1' },
  }));
  const data = await response.json();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(data, {
    status: 'paid',
    credited: true,
    balance: 250,
  });
  assert.strictEqual(calls.length, 7);
});

test('POST webhook отклоняет запрос без секрета', { concurrency: false }, async (t) => {
  const routeModule = await importRouteModule(t);
  const response = await callPost(routeModule, 'webhook', makeRequest({
    url: 'https://memefast.example/api/payments/webhook',
    textBody: 'orderId=order-1',
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 401);
  assert.deepStrictEqual(data, { error: 'Unauthorized' });
});

test('GET poll-pending обрабатывает pending-платежи и считает только реально зачисленные', { concurrency: false }, async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const url = new URL(request.url);

    if (url.pathname === '/rest/v1/payments' && request.method === 'GET') {
      return makeJsonResponse([
        { id: 'order-paid', user_id: 'user-1', amount: 100, operation_id: 'op-paid' },
        { id: 'order-pending', user_id: 'user-2', amount: 150, operation_id: 'op-pending' },
      ]);
    }

    if (url.pathname === '/uapi/acquiring/v1.0/payments/op-paid') {
      return makeJsonResponse({ Data: { status: 'APPROVED' } });
    }

    if (url.pathname === '/uapi/acquiring/v1.0/payments/op-pending') {
      return makeJsonResponse({ Data: { status: 'CREATED' } });
    }

    if (url.pathname === '/rest/v1/payments' && request.method === 'PATCH') {
      assert.match(request.url, /id=eq\.order-paid/);
      assert.match(request.url, /status=neq.paid/);
      assert.strictEqual(request.bodyJson.status, 'paid');
      assert.ok(typeof request.bodyJson.paid_at === 'string');
      return makeJsonResponse([{ id: 'order-paid' }]);
    }

    if (url.pathname === '/rest/v1/profiles' && request.method === 'GET') {
      assert.match(request.url, /id=eq\.user-1/);
      return makeJsonResponse({ balance: 20 });
    }

    if (url.pathname === '/rest/v1/profiles' && request.method === 'PATCH') {
      assert.match(request.url, /id=eq\.user-1/);
      assert.match(request.url, /balance=eq\.20/);
      assert.deepStrictEqual(request.bodyJson, { balance: 120 });
      return makeJsonResponse([{ balance: 120 }]);
    }

    if (url.pathname === '/rest/v1/balance_transactions' && request.method === 'POST') {
      assert.deepStrictEqual(request.bodyJson, {
        user_id: 'user-1',
        amount: 100,
        reason: 'payment',
        meta: {
          orderId: 'order-paid',
          operationId: 'op-paid',
          source: 'cron',
        },
      });
      return makeJsonResponse({});
    }

    throw new Error(`Неожиданный запрос: ${request.method} ${request.url}`);
  });

  const routeModule = await importRouteModule(t);
  const response = await callGet(routeModule, 'poll-pending', makeRequest({
    url: 'https://memefast.example/api/payments/poll-pending',
    headers: { authorization: 'Bearer cron-secret' },
  }));
  const data = await response.json();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(data, { checked: 2, credited: 1 });
  assert.strictEqual(calls.length, 7);
});

test('GET balance возвращает текущий баланс через общий balance helper', { concurrency: false }, async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const request = await readFetchRequest(input, init);
    calls.push(request);
    const url = new URL(request.url);

    if (url.pathname === '/auth/v1/user') {
      assert.strictEqual(request.headers.authorization, 'Bearer jwt-balance');
      return makeJsonResponse({ id: 'user-balance' });
    }

    if (url.pathname === '/rest/v1/profiles') {
      assert.match(request.url, /id=eq\.user-balance/);
      assert.match(request.url, /select=balance/);
      return makeJsonResponse({ balance: 33.335 });
    }

    throw new Error(`Неожиданный запрос: ${request.method} ${request.url}`);
  });

  const routeModule = await importRouteModule(t);
  const response = await callGet(routeModule, 'balance', makeRequest({
    url: 'https://memefast.example/api/payments/balance',
    headers: { 'x-sb-token': 'jwt-balance' },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(data, { balance: 33.34 });
  assert.strictEqual(calls.length, 2);
});
