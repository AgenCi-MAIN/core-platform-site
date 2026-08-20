import "server-only";

const REQUEST_TIMEOUT_MS = 70_000;

function configuration() {
  const baseUrl = process.env.CORE_AGENT_FLEET_URL?.replace(/\/$/, "");
  const token = process.env.CORE_AGENT_FLEET_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Fleet bridge is not configured.");
  }

  return { baseUrl, token };
}

export async function fleetRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { baseUrl, token } = configuration();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });

    const payload = (await response.json().catch(() => null)) as T | null;
    if (!response.ok || payload === null) {
      throw new Error(`Fleet request failed with status ${response.status}.`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}
