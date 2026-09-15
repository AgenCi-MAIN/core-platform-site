import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSON_RPC_ERRORS } from '../../../../packages/shared/src/index.ts'
import type { JsonRpcRequest, JsonRpcResponse } from '../../../../packages/shared/src/index.ts'
import { createChannelTransport, createFlakyTransport, createOfflineTransport } from '../../src/runtime/a2a/transport.ts'

function echoRequest(id: string | number, method: string, params: unknown): JsonRpcRequest {
  return { jsonrpc: '2.0', id, method: method as JsonRpcRequest['method'], params }
}

test('createChannelTransport round-trips a request over a real MessageChannel', async () => {
  const { client, server } = createChannelTransport()
  server.onRequest((request) => ({ jsonrpc: '2.0', id: request.id, result: { echoed: request.params } }))
  const response = await client.send(echoRequest(1, 'agent/card', { hello: 'world' }))
  assert.equal('error' in response, false)
  if ('result' in response) {
    assert.deepEqual(response.result, { echoed: { hello: 'world' } })
  }
  client.close()
  server.close()
})

test('client.send rejects with a timeout JsonRpcError when nothing answers in time', async () => {
  const { client, server } = createChannelTransport()
  // no onRequest registered — the request is received but never answered
  await assert.rejects(
    client.send(echoRequest(2, 'tasks/get', {}), 20),
    (e: unknown) => {
      const err = e as { code: number }
      return err.code === JSON_RPC_ERRORS.timeout
    },
  )
  client.close()
  server.close()
})

test('createFlakyTransport drops the first N requests, making a timeout observable', async () => {
  const inner = createChannelTransport()
  inner.server.onRequest((request) => ({ jsonrpc: '2.0', id: request.id, result: { ok: true } }))
  const flaky = createFlakyTransport(inner, { dropFirst: 1 })

  await assert.rejects(
    flaky.client.send(echoRequest(3, 'tasks/get', {}), 20),
    (e: unknown) => (e as { code: number }).code === JSON_RPC_ERRORS.timeout,
  )

  const second = await flaky.client.send(echoRequest(4, 'tasks/get', {}), 200)
  assert.equal('error' in second, false)
  if ('result' in second) assert.deepEqual(second.result, { ok: true })

  flaky.client.close()
  inner.server.close()
})

test('createOfflineTransport rejects every send immediately', async () => {
  const offline = createOfflineTransport()
  await assert.rejects(
    offline.send(echoRequest(5, 'agent/card', {})),
    (e: unknown) => {
      const err = e as { code: number; message: string }
      return err.code === JSON_RPC_ERRORS.transportUnavailable && /network transport not available/.test(err.message)
    },
  )
})
