import assert from 'node:assert/strict';
import { test } from 'node:test';
import { syncAccount } from './accountSync.js';

const url = 'https://example.test/api/auth/sync';
const account = { client_id: 'existing-account' };

function mockRequests(t, ...results) {
  const waits = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    waits.push(delay);
    queueMicrotask(callback);
  });
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    const result = results.shift();
    if (result instanceof Error) throw result;
    assert.ok(result, 'Unexpected extra request');
    return result;
  });
  return { waits, fetch };
}

test('retries a cold start and gateway outage with the same Firebase session', async (t) => {
  const { waits, fetch } = mockRequests(t,
    new Response('<html>Starting the service</html>', { status: 200 }),
    new Response('Bad gateway', { status: 502 }),
    new TypeError('Network request failed'),
    Response.json(account),
  );

  assert.deepEqual(await syncAccount(url, 'fixture-token', 'Example'), account);
  assert.deepEqual(waits, [2000, 6000, 16000]);
  for (const { arguments: [target, request] } of fetch.mock.calls) {
    assert.equal(target, url);
    assert.equal(request.headers.Authorization, 'Bearer fixture-token');
    assert.equal(request.body, '{"organization_name":"Example"}');
  }
});

test('reports the Render HTML challenge without rapid retries', async (t) => {
  const { waits } = mockRequests(t, new Response('<html>Just a moment...</html>', {
    status: 429,
    headers: { 'Content-Type': 'text/html' },
  }));

  await assert.rejects(syncAccount(url, 'fixture-token'), /hosting service is blocking/);
  assert.deepEqual(waits, []);
});

test('honors Retry-After on an ordinary rate limit', async (t) => {
  const { waits } = mockRequests(t,
    Response.json({}, { status: 429, headers: { 'Retry-After': '9' } }),
    Response.json(account),
  );

  assert.deepEqual(await syncAccount(url, 'fixture-token'), account);
  assert.deepEqual(waits, [9000]);
});

test('stops on an invalid session and asks the user to sign in again', async (t) => {
  const { waits } = mockRequests(t, Response.json({}, { status: 401 }));

  await assert.rejects(syncAccount(url, 'fixture-token'), /Please sign in again/);
  assert.deepEqual(waits, []);
});

test('asks the user to sign in again after a sustained outage', async (t) => {
  const { fetch } = mockRequests(t, ...Array.from({ length: 4 }, () => new Response('', { status: 503 })));

  await assert.rejects(syncAccount(url, 'fixture-token'), /try signing in again/);
  assert.equal(fetch.mock.callCount(), 4);
});
