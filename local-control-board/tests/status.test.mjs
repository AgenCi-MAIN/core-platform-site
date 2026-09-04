import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
function harness(fetch) {
  const elements = new Map();
  const context = vm.createContext({
    document: {
      addEventListener() {},
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, { textContent: 'OLD READING' });
        return elements.get(id);
      },
    }, fetch, AbortSignal, setTimeout() {}, Date,
  });
  vm.runInContext(source, context);
  return { context, elements };
}

test('failed refresh clears prior health, usage and inventory', async () => {
  const { context, elements } = harness(async () => { throw new Error('offline'); });
  await vm.runInContext('refreshStatus()', context);
  for (const id of ['runtime-state', 'relay-state', 'worker-state', 'codex-row-state', 'inventory-freshness']) {
    assert.equal(elements.get(id).textContent, 'UNAVAILABLE');
  }
  assert.equal(elements.get('inventory-hash').textContent, '');
  assert.equal(elements.get('usage-state').textContent, 'Usage unavailable');
});

test('non-success responses clear readings and requests have a timeout', async () => {
  let signal;
  const { context, elements } = harness(async (_url, options) => {
    signal = options.signal;
    return { ok: false, status: 500 };
  });
  await vm.runInContext('refreshStatus()', context);
  assert.ok(signal instanceof AbortSignal);
  assert.equal(elements.get('runtime-chip').textContent, 'STATUS ERROR');
});

test('observation labels reject future dates and mark old dates stale', () => {
  const { context } = harness(async () => { throw new Error('offline'); });
  assert.match(vm.runInContext('observationLabel({observed_at: "2020-01-01T00:00:00Z"})', context), /^stale/);
  assert.equal(vm.runInContext('observationLabel({observed_at: "2999-01-01T00:00:00Z"})', context), 'Observation time unavailable');
});
