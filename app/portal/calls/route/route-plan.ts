export type SwmlDocument = {
  version: "1.0.0";
  sections: { main: Array<Record<string, unknown>> };
};

export type HuntTarget = {
  address: string;
  memberId: number;
};

export type InboundRoutePlan = {
  callId: string;
  callerId: string;
  callerMasked: string;
  calledLineMasked: string;
  personalTarget?: HuntTarget | null;
  personalAttempt?: number;
  teamTargets: HuntTarget[];
  teamAttempt: number;
  fallbackNumber: string;
  lifecycleUrl: string;
  voicemailStatusUrl: string;
};

/**
 * Deterministic, recording-free hunt. Each failed connect falls through to the
 * next stage; once a peer actually connected and later leaves, the result
 * branch hangs up the caller instead of accidentally starting the next hunt.
 */
export function buildInboundRoutePlan(input: InboundRoutePlan): SwmlDocument {
  const main: Array<Record<string, unknown>> = [];

  if (input.personalTarget) {
    main.push(
      connectStage(
        [input.personalTarget.address],
        input.callerId,
        8,
        input.lifecycleUrl,
        input.personalAttempt ?? 1,
        input,
        "personal",
      ),
    );
  }

  if (input.teamTargets.length > 0) {
    main.push(
      connectStage(
        input.teamTargets.map((target) => target.address),
        input.callerId,
        8,
        input.lifecycleUrl,
        input.teamAttempt,
        input,
        "team",
      ),
    );
  }

  main.push(
    {
      connect: {
        to: input.fallbackNumber,
        from: input.callerId,
        timeout: 20,
        answer_on_bridge: true,
        confirm_timeout: 8,
        confirm: [
          {
            prompt: {
              play: "say:THRIVE incoming call. Press 1 to accept.",
              max_digits: 1,
              initial_timeout: 5,
              digit_timeout: 2,
            },
          },
          {
            cond: [
              { when: "prompt_value == '1'", then: [{ return: 1 }] },
              { else: [{ return: 0 }] },
            ],
          },
        ],
        status_url: input.lifecycleUrl,
        call_state_url: input.lifecycleUrl,
        call_state_events: ["created", "ringing", "answered", "ended"],
        result: connectedResult(),
      },
    },
    { answer: {} },
    {
      play: {
        url: "say:No one is available right now. Please leave your name, phone number, and a short message after the beep. Press pound when finished.",
      },
    },
    {
      record: {
        beep: true,
        format: "mp3",
        direction: "speak",
        terminators: "#",
        initial_timeout: 8,
        end_silence_timeout: 4,
        max_length: 120,
        status_url: input.voicemailStatusUrl,
      },
    },
    {
      play: {
        url: "say:Thank you. A member of the THRIVE team will return your call.",
      },
    },
    { hangup: {} },
  );

  return { version: "1.0.0", sections: { main } };
}

function connectStage(
  targets: string[],
  from: string,
  timeout: number,
  lifecycleUrl: string,
  attempt: number,
  input: InboundRoutePlan,
  stage: "personal" | "team",
): Record<string, unknown> {
  const destinations = targets.map((to) => ({ to: withContext(to, input, stage, attempt) }));
  return {
    connect: {
      ...(destinations.length === 1 ? { to: destinations[0].to } : { parallel: destinations }),
      from,
      timeout,
      answer_on_bridge: true,
      status_url: lifecycleUrl,
      call_state_url: lifecycleUrl,
      call_state_events: ["created", "ringing", "answered", "ended"],
      result: connectedResult(),
    },
  };
}

function connectedResult(): Array<Record<string, unknown>> {
  return [
    {
      when: "return_value == 'connected'",
      then: [{ hangup: {} }],
    },
  ];
}

function withContext(
  address: string,
  input: InboundRoutePlan,
  stage: "personal" | "team",
  attempt: number,
) {
  const separator = address.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    core_call_id: input.callId,
    core_stage: stage,
    core_attempt: String(attempt),
    core_line: input.calledLineMasked,
    core_caller: input.callerMasked,
  });
  return `${address}${separator}${params.toString()}`;
}
