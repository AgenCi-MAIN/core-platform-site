export const DIAL_COOLDOWN_MS = 30_000;
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export type DialMode = "agent_test" | "customer";

export type SignalWireDialInput = {
  agentNumber: string;
  callerId: string;
  destination?: string;
  mode: DialMode;
};

export type SignalWireDialRequest = {
  command: "dial";
  params: {
    from: string;
    to: string;
    caller_id: string;
    timeout: number;
    swml: {
      version: "1.0.0";
      sections: { main: Array<Record<string, unknown>> };
    };
  };
};

export function normalizeE164(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/[\s().-]/g, "");
  return E164_PATTERN.test(normalized) ? normalized : null;
}

export function maskE164(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***${digits.slice(-4)}`;
}

export function normalizeSignalWireSpace(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const candidate = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    if (candidate.protocol !== "https:") return null;
    if (!candidate.hostname.toLowerCase().endsWith(".signalwire.com")) return null;
    if (candidate.username || candidate.password || candidate.port) return null;
    if (candidate.pathname !== "/" || candidate.search || candidate.hash) return null;
    return candidate.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function dialRateBucket(nowMs: number): number {
  return Math.floor(nowMs / DIAL_COOLDOWN_MS);
}

export function isPlatformNumber(value: string, platformNumbers: readonly string[]): boolean {
  return platformNumbers.includes(value);
}

export function buildSignalWireDialRequest({
  agentNumber,
  callerId,
  destination,
  mode,
}: SignalWireDialInput): SignalWireDialRequest {
  const main =
    mode === "agent_test"
      ? buildAgentTestPlan()
      : buildCustomerPlan(requiredDestination(destination), callerId);

  return {
    command: "dial",
    params: {
      // SignalWire first rings the private owner destination. Both `from` and
      // `caller_id` are the owned CORE platform line so the mobile and later
      // customer leg see the same stable business identity.
      from: callerId,
      to: agentNumber,
      caller_id: callerId,
      timeout: 30,
      swml: {
        version: "1.0.0",
        sections: { main },
      },
    },
  };
}

function buildAgentTestPlan(): Array<Record<string, unknown>> {
  return [
    {
      prompt: {
        play: [
          "say:CORE platform line test. Press 1 to confirm you received this call.",
          "silence:2",
          "say:Press 1 to confirm.",
        ],
        max_digits: 1,
        initial_timeout: 7,
      },
    },
    {
      switch: {
        variable: "prompt_value",
        case: {
          "1": [
            {
              play: {
                url: "say:The CORE platform line is connected correctly.",
              },
            },
          ],
        },
        default: [
          {
            play: {
              url: "say:I did not receive one. This test will now end.",
            },
          },
        ],
      },
    },
    { hangup: {} },
  ];
}

function buildCustomerPlan(destination: string, callerId: string): Array<Record<string, unknown>> {
  return [
    {
      prompt: {
        play: [
          "say:CORE dialer. Press 1 to connect the customer call.",
          "silence:2",
          "say:Press 1 to continue.",
        ],
        max_digits: 1,
        initial_timeout: 7,
      },
    },
    {
      switch: {
        variable: "prompt_value",
        case: {
          "1": [
            {
              play: {
                url: "say:Connecting the customer now.",
              },
            },
            {
              connect: {
                from: callerId,
                to: destination,
                timeout: 30,
              },
            },
          ],
        },
        default: [
          {
            play: {
              url: "say:I did not receive one. The customer was not called.",
            },
          },
        ],
      },
    },
    { hangup: {} },
  ];
}

function requiredDestination(value: string | undefined): string {
  if (!value) throw new Error("A destination is required for a customer call.");
  return value;
}
