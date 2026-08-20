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
        // SWML `confirm` semantics: the callee leg is ACCEPTED when the confirm
        // script runs to completion and REJECTED when it hangs up. There is no
        // `return` method inside confirm — SignalWire logs
        // `Unknown method "confirm.return"` and drops the leg after ~1s.
        confirm_timeout: 30,
        confirm: [
          {
            prompt: {
              play: "say:THRIVE incoming call. Press 1 to accept.",
              max_digits: 1,
              initial_timeout: 8,
              digit_timeout: 3,
            },
          },
          {
            cond: [{ when: "prompt_value != '1'", then: [{ hangup: {} }] }],
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
): Record<string, unknown> {
  // A Fabric Resource Address is an opaque provider identifier. SignalWire can
  // ring an address that carries a query string, but the Browser SDK does not
  // promise to preserve those parameters on the incoming Call. CORE resolves
  // the offer context from its authenticated D1 offer row instead (see
  // /portal/calls/offer-event action=resolve), so the provider receives the
  // exact address it issued for the Subscriber.
  const destinations = targets.map((to) => ({ to }));
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
