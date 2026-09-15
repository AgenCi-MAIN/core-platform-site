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

/** MessagePort.ref()/unref() are a Node (worker_threads) extension, not part
 * of the Web MessagePort API — guard every call so this still runs unchanged
 * in a browser, where these are simply absent and the port has no notion of
 * "keeping the process alive" to begin with. */
function refControls(port: MessagePort): { ref(): void; unref(): void } {
  const maybeRef = (port as unknown as { ref?: () => void }).ref
  const maybeUnref = (port as unknown as { unref?: () => void }).unref
  return {
    ref: () => maybeRef?.call(port),
    unref: () => maybeUnref?.call(port),
  }
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

  // In Node, an open MessagePort keeps the process alive even while wholly
  // idle. A runtime has no explicit shutdown (Runtime carries no dispose
  // method), so without this a Node host — including these very tests —
  // would never exit once a runtime has been created. `busy` counts every
  // outstanding reason to stay alive (a send() awaiting its reply, a request
  // being handled); the port is ref()'d while busy>0 and unref()'d at 0.
  const { ref, unref } = refControls(port)
  let busy = 0
  unref()
  function enter(): void {
    busy += 1
    ref()
  }
  function leave(): void {
    busy = Math.max(0, busy - 1)
    if (busy === 0) unref()
  }

  port.onmessage = (ev: MessageEvent) => {
    const data = ev.data as JsonRpcRequest | JsonRpcResponse
    if (isRequest(data)) {
      if (!handler) return
      enter()
      Promise.resolve(handler(data)).then((response) => {
        if (!closed) port.postMessage(response)
        leave()
      })
      return
    }
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    leave()
    // A response — even one carrying a business-level JSON-RPC `error` — is
    // a successful round trip and resolves send(); reject() is reserved for
    // transport-level failure (timeout, closed transport). Callers check
    // `'error' in response`, matching JsonRpcResponse's own {result}|{error}
    // shape.
    entry.resolve(data)
  }

  return {
    send(request, timeoutMs) {
      return new Promise<JsonRpcResponse>((resolve, reject) => {
        if (closed) {
          reject({ code: JSON_RPC_ERRORS.transportUnavailable, message: 'network transport not available in this build' })
          return
        }
        enter()
        const entry: Pending = { resolve, reject }
        if (timeoutMs !== undefined) {
          entry.timer = setTimeout(() => {
            pending.delete(request.id)
            leave()
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
      busy = 0
      handler = null
      unref()
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
