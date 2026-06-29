import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';

const ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'TOS_ENDPOINT',
  'TOS_BUCKET',
  'TOS_REGION',
  'TOS_ACCESS_KEY',
  'TOS_SECRET_KEY',
  'ARK_API_KEY',
];

const DEFAULT_ENV = {
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  SUPABASE_ANON_KEY: '',
  TOS_ENDPOINT: '',
  TOS_BUCKET: '',
  TOS_REGION: 'cn-beijing',
  TOS_ACCESS_KEY: '',
  TOS_SECRET_KEY: '',
  ARK_API_KEY: '',
};

function createBalanceState(overrides = {}) {
  return {
    BILLING_ENABLED: false,
    getUser: async () => null,
    getUserForGallery: async () => null,
    getBalance: async () => null,
    deduct: async () => ({ ok: true, balance: null }),
    refund: async () => undefined,
    isAdminUser: () => false,
    getEmailsForIds: async () => ({}),
    calls: {
      getUser: [],
      getUserForGallery: [],
      getBalance: [],
      deduct: [],
      refund: [],
      isAdminUser: [],
      getEmailsForIds: [],
    },
    ...overrides,
  };
}

function createPricingState(overrides = {}) {
  return {
    priceRub: async () => 0,
    seedance2RateCny: () => 0,
    rubFromTokens: async () => 0,
    ensureCnyRate: async () => undefined,
    calls: {
      priceRub: [],
      seedance2RateCny: [],
      rubFromTokens: [],
      ensureCnyRate: [],
    },
    ...overrides,
  };
}

function makeRequest({
  url = 'https://memefast.example/api/workflow',
  headers = {},
  jsonBody,
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
      return jsonBody === undefined ? '' : JSON.stringify(jsonBody);
    },
  };
}

async function importWorkflowModule(t, {
  envOverrides = {},
  balanceOverrides = {},
  pricingOverrides = {},
} = {}) {
  const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  const previousState = globalThis.__workflowRouteTestState;
  const previousWorkflows = globalThis._mf_workflows;
  const previousRuns = globalThis._mf_runs;
  const previousShareInit = globalThis._workflow_shares_table_init;

  for (const key of ENV_KEYS) {
    const nextValue = envOverrides[key] ?? DEFAULT_ENV[key];
    if (typeof nextValue === 'string') process.env[key] = nextValue;
    else delete process.env[key];
  }

  globalThis._mf_workflows = new Map();
  globalThis._mf_runs = new Map();
  globalThis._workflow_shares_table_init = true;

  const balanceState = createBalanceState(balanceOverrides);
  const pricingState = createPricingState(pricingOverrides);

  globalThis.__workflowRouteTestState = {
    balance: balanceState,
    pricing: pricingState,
  };

  const baseUrl = new URL('./', import.meta.url);
  const routeSourceUrl = new URL('./route.js', import.meta.url);
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tempRouteUrl = new URL(`./.route.runtime.${unique}.mjs`, import.meta.url);
  const nextStubUrl = new URL(`./.route.stub.next.${unique}.mjs`, import.meta.url);
  const balanceStubUrl = new URL(`./.route.stub.balance.${unique}.mjs`, import.meta.url);
  const pricingStubUrl = new URL(`./.route.stub.pricing.${unique}.mjs`, import.meta.url);
  const tosPathsStubUrl = new URL(`./.route.stub.tosPaths.${unique}.mjs`, import.meta.url);
  const logicStubUrl = new URL(`./.route.stub.logic.${unique}.mjs`, import.meta.url);

  const stateAccess = 'globalThis.__workflowRouteTestState';

  const nextStub = `export const NextResponse = {
  json(body, init = {}) {
    return new Response(JSON.stringify(body), {
      status: init.status || 200,
      headers: { 'content-type': 'application/json' },
    });
  },
};
`;

  const balanceStub = `const state = ${stateAccess}.balance;
export const BILLING_ENABLED = state.BILLING_ENABLED;
export async function getUser(...args) {
  state.calls.getUser.push(args);
  return state.getUser(...args);
}
export async function getUserForGallery(...args) {
  state.calls.getUserForGallery.push(args);
  return state.getUserForGallery(...args);
}
export async function getBalance(...args) {
  state.calls.getBalance.push(args);
  return state.getBalance(...args);
}
export async function deduct(...args) {
  state.calls.deduct.push(args);
  return state.deduct(...args);
}
export async function refund(...args) {
  state.calls.refund.push(args);
  return state.refund(...args);
}
export function isAdminUser(...args) {
  state.calls.isAdminUser.push(args);
  return state.isAdminUser(...args);
}
export async function getEmailsForIds(...args) {
  state.calls.getEmailsForIds.push(args);
  return state.getEmailsForIds(...args);
}
`;

  const pricingStub = `const state = ${stateAccess}.pricing;
export async function priceRub(...args) {
  state.calls.priceRub.push(args);
  return state.priceRub(...args);
}
export function seedance2RateCny(...args) {
  state.calls.seedance2RateCny.push(args);
  return state.seedance2RateCny(...args);
}
export async function rubFromTokens(...args) {
  state.calls.rubFromTokens.push(args);
  return state.rubFromTokens(...args);
}
export async function ensureCnyRate(...args) {
  state.calls.ensureCnyRate.push(args);
  return state.ensureCnyRate(...args);
}
`;

  const tosPathsStub = `export function buildLegacyWorkflowStorageKey(id) {
  return \`workflows/\${id}.json\`;
}
export function buildUserMediaKey(userId, kind, ext) {
  return \`users/\${userId || 'anonymous'}/\${kind}/file.\${ext}\`;
}
export function buildWorkflowStorageKey(userId, id) {
  return \`users/\${userId || 'anonymous'}/workflows/\${id}.json\`;
}
export function buildUserTosRoot(userId) {
  return \`users/\${userId || 'anonymous'}\`;
}
`;

  const logicStub = `export function buildContent() { return []; }
`;

  const routeSource = await readFile(routeSourceUrl, 'utf8');
  const routePatched = routeSource
    .replace("from 'next/server';", `from './${nextStubUrl.pathname.split('/').pop()}';`)
    .replace("from '../../_lib/pricing';", `from './${pricingStubUrl.pathname.split('/').pop()}';`)
    .replace("from '../../_lib/balance';", `from './${balanceStubUrl.pathname.split('/').pop()}';`)
    .replace("from '../../_lib/tosPaths';", `from './${tosPathsStubUrl.pathname.split('/').pop()}';`)
    .replace("from '../../ark/seedance/logic';", `from './${logicStubUrl.pathname.split('/').pop()}';`);

  await writeFile(nextStubUrl, nextStub, 'utf8');
  await writeFile(balanceStubUrl, balanceStub, 'utf8');
  await writeFile(pricingStubUrl, pricingStub, 'utf8');
  await writeFile(tosPathsStubUrl, tosPathsStub, 'utf8');
  await writeFile(logicStubUrl, logicStub, 'utf8');
  await writeFile(tempRouteUrl, routePatched, 'utf8');

  t.after(async () => {
    await Promise.all([
      rm(tempRouteUrl, { force: true }),
      rm(nextStubUrl, { force: true }),
      rm(balanceStubUrl, { force: true }),
      rm(pricingStubUrl, { force: true }),
      rm(tosPathsStubUrl, { force: true }),
      rm(logicStubUrl, { force: true }),
    ]);

    for (const key of ENV_KEYS) {
      if (typeof previousEnv[key] === 'string') process.env[key] = previousEnv[key];
      else delete process.env[key];
    }

    globalThis.__workflowRouteTestState = previousState;
    globalThis._mf_workflows = previousWorkflows;
    globalThis._mf_runs = previousRuns;
    globalThis._workflow_shares_table_init = previousShareInit;
  });

  tempRouteUrl.searchParams.set('case', unique);
  const module = await import(tempRouteUrl.href);
  return {
    module,
    balanceState,
    pricingState,
    store: globalThis._mf_workflows,
    runStore: globalThis._mf_runs,
    baseUrl,
  };
}

async function callPost(module, path, request) {
  return module.POST(request, { params: Promise.resolve({ path }) });
}

test('POST create назначает owner и вырезает длинные base64 из нод', { concurrency: false }, async (t) => {
  const { module, store } = await importWorkflowModule(t, {
    balanceOverrides: {
      getUserForGallery: async () => ({ id: 'user-1', email: 'cat@example.com' }),
    },
  });

  const longBase64 = `data:image/png;base64,${'a'.repeat(700)}`;
  const response = await callPost(module, ['create'], makeRequest({
    url: 'https://memefast.example/api/workflow/create',
    jsonBody: {
      workflow_id: 'wf-create',
      name: 'Мой воркфлоу',
      data: {
        nodes: [
          {
            id: 'node-1',
            model: 'image-passthrough',
            input_params: {
              prompt: 'кот',
              image_url: longBase64,
            },
          },
        ],
      },
      edges: [],
    },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.id, 'wf-create');
  assert.strictEqual(data.owner_id, 'user-1');
  assert.strictEqual(data.name, 'Мой воркфлоу');
  assert.strictEqual(data.nodes[0].input_params.image_url, '');
  assert.ok(store.has('wf-create'));
});

test('POST workflow run возвращает 402 при нехватке средств для обычной модели', { concurrency: false }, async (t) => {
  const { module, balanceState, pricingState } = await importWorkflowModule(t, {
    balanceOverrides: {
      BILLING_ENABLED: true,
      getUserForGallery: async () => ({ id: 'user-1', email: 'cat@example.com' }),
      deduct: async () => ({ ok: false, reason: 'insufficient', balance: 10 }),
    },
    pricingOverrides: {
      priceRub: async () => 123.45,
    },
  });

  await callPost(module, ['create'], makeRequest({
    url: 'https://memefast.example/api/workflow/create',
    jsonBody: {
      workflow_id: 'wf-money',
      name: 'Платный воркфлоу',
      data: {
        nodes: [
          {
            id: 'node-paid',
            model: 'gpt-image-1',
            input_params: { prompt: 'рыжий кот' },
          },
        ],
      },
      edges: [],
    },
  }));

  const response = await callPost(module, ['wf-money', 'run'], makeRequest({
    url: 'https://memefast.example/api/workflow/wf-money/run',
    jsonBody: { inputs: {} },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 402);
  assert.deepStrictEqual(data, {
    error: 'insufficient_funds',
    node: 'node-paid',
    required: 123.45,
    balance: 10,
  });
  assert.strictEqual(pricingState.calls.priceRub.length, 1);
  assert.strictEqual(balanceState.calls.deduct.length, 1);
  assert.deepStrictEqual(balanceState.calls.deduct[0], [
    'user-1',
    123.45,
    'gpt-image-1',
    { model: 'gpt-image-1' },
  ]);
});

test('POST node run выполняет passthrough-ноду без списания и возвращает output', { concurrency: false }, async (t) => {
  const { module, balanceState, pricingState } = await importWorkflowModule(t, {
    balanceOverrides: {
      BILLING_ENABLED: true,
      getUserForGallery: async () => ({ id: 'user-1', email: 'cat@example.com' }),
    },
    pricingOverrides: {
      priceRub: async () => 0,
    },
  });

  await callPost(module, ['create'], makeRequest({
    url: 'https://memefast.example/api/workflow/create',
    jsonBody: {
      workflow_id: 'wf-pass',
      name: 'Passthrough',
      data: {
        nodes: [
          {
            id: 'node-pass',
            model: 'image-passthrough',
            input_params: { image_url: 'https://cdn.example/image.png' },
          },
        ],
      },
      edges: [],
    },
  }));

  const response = await callPost(module, ['wf-pass', 'node', 'node-pass', 'run'], makeRequest({
    url: 'https://memefast.example/api/workflow/wf-pass/node/node-pass/run',
    jsonBody: {
      run_id: 'run-pass',
      model: 'image-passthrough',
      params: { image_url: 'https://cdn.example/image.png' },
    },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.run_id, 'run-pass');
  assert.strictEqual(data.cost, 0);
  assert.strictEqual(data.status, 'completed');
  assert.deepStrictEqual(data.nodes['node-pass'][0].result.outputs, [
    { type: 'image_url', value: 'https://cdn.example/image.png' },
  ]);
  assert.strictEqual(pricingState.calls.priceRub.length, 1);
  assert.strictEqual(balanceState.calls.deduct.length, 0);
  assert.strictEqual(balanceState.calls.refund.length, 0);
});

test('POST node run для Seedance 2.0 останавливается на estimate gate без списания', { concurrency: false }, async (t) => {
  const { module, balanceState, pricingState } = await importWorkflowModule(t, {
    balanceOverrides: {
      BILLING_ENABLED: true,
      getUserForGallery: async () => ({ id: 'user-1', email: 'cat@example.com' }),
      getBalance: async () => 10,
    },
    pricingOverrides: {
      priceRub: async () => 55,
      ensureCnyRate: async () => undefined,
    },
  });

  await callPost(module, ['create'], makeRequest({
    url: 'https://memefast.example/api/workflow/create',
    jsonBody: {
      workflow_id: 'wf-seedance',
      name: 'Seedance',
      data: {
        nodes: [
          {
            id: 'node-seed',
            model: 'doubao-seedance-2-0-260128',
            input_params: { prompt: 'кот в очках' },
          },
        ],
      },
      edges: [],
    },
  }));

  const response = await callPost(module, ['wf-seedance', 'node', 'node-seed', 'run'], makeRequest({
    url: 'https://memefast.example/api/workflow/wf-seedance/node/node-seed/run',
    jsonBody: {
      run_id: 'run-seed',
      model: 'doubao-seedance-2-0-260128',
      params: { prompt: 'кот в очках' },
    },
  }));
  const data = await response.json();

  assert.strictEqual(response.status, 402);
  assert.deepStrictEqual(data, {
    error: 'insufficient_funds',
    required: 55,
    balance: 10,
  });
  assert.strictEqual(pricingState.calls.priceRub.length, 1);
  assert.strictEqual(balanceState.calls.getBalance.length, 1);
  assert.strictEqual(balanceState.calls.deduct.length, 0);
  assert.strictEqual(pricingState.calls.ensureCnyRate.length, 0);
});
