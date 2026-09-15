/**
 * HONESTY LABEL: this is an in-page simulated wire. It carries JSON-RPC
 * requests and responses over a real MessageChannel — real async message
 * passing, real correlation ids, real timeouts and errors — but both ends
 * live in the same JS process. There is no network, no model call, and no
 * credential anywhere near it.
 */
import type { JsonRpcError, JsonRpcRequest, JsonRpcResponse } from '../../../../../packages/shared/src/index.ts'
import { JSON_RPC_ERRORS } from '../../../../../packages/shared/src/index.ts'

/** One end of a JSON-RPC wire. The server side registers a request handler
 * with onRequest; either side may call send() to make an outbound call. */
export interface Endpoint {
  send(request: JsonRpcRequest, timeoutMs?: number): Promise<JsonRpcResponse>
  onRequest(handler: (request: JsonRpcRequest) => Promise<JsonRpcResponse> | JsonRpcResponse): void
  close(): void
}

export interface ChannelTransport {
  client: Endpoint
  server: Endpoint
}

function isRequest(data: JsonRpcRequest | JsonRpcResponse): data is JsonRpcRequest {
  return typeof (data as { method?: unknown }).method === 'string'
}

function wrapPort(port: MessagePort): Endpoint {
  interface Pending {
    resolve(response: JsonRpcResponse): void
    reject(error: JsonRpcError): void
    timer?: ReturnType<typeof setTimeout>
  }
  const pending = new Map<string | number, Pending>()
  let handler: ((request: JsonRpcRequest) => Promise<JsonRpcResponse> | JsonRpcResponse) | null = null
  let closed = false

  port.onmessage = (ev: MessageEvent) => {
    const data = ev.data as JsonRpcRequest | JsonRpcResponse
    if (isRequest(data)) {
      if (!handler) return
      Promise.resolve(handler(data)).then((response) => {
        if (!closed) port.postMessage(response)
      })
      return
    }
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    if ('error' in data) entry.reject(data.error)
    else entry.resolve(data)
  }

  return {
    send(request, timeoutMs) {
      return new Promise<JsonRpcResponse>((resolve, reject) => {
        if (closed) {
          reject({ code: JSON_RPC_ERRORS.transportUnavailable, message: 'network transport not available in this build' })
          return
        }
        const entry: Pending = { resolve, reject }
        if (timeoutMs !== undefined) {
          entry.timer = setTimeout(() => {
            pending.delete(request.id)
            reject({ code: JSON_RPC_ERRORS.timeout, message: `A2A request timed out after ${timeoutMs}ms` })
          }, timeoutMs)
        }
        pending.set(request.id, entry)
        port.postMessage(request)
      })
    },
    onRequest(h) {
      handler = h
    },
    close() {
      if (closed) return
      closed = true
      for (const entry of pending.values()) {
        if (entry.timer !== undefined) clearTimeout(entry.timer)
        entry.reject({ code: JSON_RPC_ERRORS.internal, message: 'transport closed' })
      }
      pending.clear()
      handler = null
      port.close()
    },
  }
}

/** A real MessageChannel with each port wrapped as a correlated JSON-RPC
 * Endpoint. client and server are peers — either can send or serve — but by
 * convention the client calls send() and the server calls onRequest(). */
export function createChannelTransport(): ChannelTransport {
  const channel = new MessageChannel()
  return {
    client: wrapPort(channel.port1),
    server: wrapPort(channel.port2),
  }
}

/** Wraps a transport's client endpoint so the first `dropFirst` requests are
 * silently dropped (never reach the server), so a caller's timeout fires and
 * becomes observable. Requests after that pass through untouched. */
export function createFlakyTransport(inner: ChannelTransport, opts: { dropFirst: number }): ChannelTransport {
  let dropped = 0
  const client: Endpoint = {
    send(request, timeoutMs) {
      if (dropped < opts.dropFirst) {
        dropped += 1
        return new Promise<JsonRpcResponse>((_resolve, reject) => {
          if (timeoutMs === undefined) return // dropped with nothing to time it out — never settles, like a real lost message
          setTimeout(() => {
            reject({ code: JSON_RPC_ERRORS.timeout, message: `A2A request timed out after ${timeoutMs}ms` })
          }, timeoutMs)
        })
      }
      return inner.client.send(request, timeoutMs)
    },
    onRequest: (h) => inner.client.onRequest(h),
    close: () => inner.client.close(),
  }
  return { client, server: inner.server }
}

/** A client endpoint that rejects every send() immediately — simulates a
 * build/environment with no A2A transport available at all. */
export function createOfflineTransport(): Endpoint {
  return {
    send() {
      return Promise.reject({ code: JSON_RPC_ERRORS.transportUnavailable, message: 'network transport not available in this build' })
    },
    onRequest() {
      // nothing to serve — offline.
    },
    close() {
      // nothing to close.
    },
  }
}
