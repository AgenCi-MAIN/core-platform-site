"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  AuthenticateContext,
  Call,
  CredentialProvider,
  SDKCredential,
  SignalWire as SignalWireClient,
} from "@signalwire/js";

type PhonePhase =
  | "loading"
  | "setup_pending"
  | "offline"
  | "registering"
  | "secondary"
  | "available"
  | "ringing"
  | "connecting"
  | "connected"
  | "answered_elsewhere"
  | "error";

type Bootstrap = {
  phoneEnabled: boolean;
  setupState: string;
  personalNumber?: string | null;
  heartbeatMs?: number;
  presence?: { state?: string };
  error?: string;
};

type CallContext = {
  providerCallId: string;
  stage: "personal" | "team";
  attempt: number;
  calledLine: string;
  callerMasked: string;
};

type Snapshot = {
  phase: PhonePhase;
  calledLine?: string;
  callerMasked?: string;
  stage?: string;
};

const CHANNEL = "core-browser-phone-v1";
const LOCK_NAME = "core-browser-phone-primary-v1";
const CALL_ACTIVITY_EVENT = "thrive:call-activity";
const PHONE_PANEL_EVENT = "thrive:phone-panel";

export function BrowserPhone({
  onPhase,
  panelActive,
}: {
  onPhase?: (phase: PhonePhase) => void;
  panelActive: boolean;
}) {
  const [phase, setPhaseState] = useState<PhonePhase>("loading");
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [message, setMessage] = useState("Checking your phone assignment…");
  const [context, setContext] = useState<CallContext | null>(null);
  const [seconds, setSeconds] = useState(8);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const phaseRef = useRef<PhonePhase>("loading");
  const contextRef = useRef<CallContext | null>(null);
  const callRef = useRef<Call | null>(null);
  const clientRef = useRef<SignalWireClient | null>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const releaseLockRef = useRef<(() => void) | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const connectedRef = useRef(false);
  const transferringRef = useRef(false);
  const callStatusCleanupRef = useRef<(() => void) | null>(null);
  const heartbeatFailuresRef = useRef(0);

  const setPhase = useCallback((next: PhonePhase, nextMessage?: string) => {
    phaseRef.current = next;
    setPhaseState(next);
    if (nextMessage) setMessage(nextMessage);
    onPhase?.(next);
    document.documentElement.dataset.thrivePhonePhase = next;
    window.dispatchEvent(new CustomEvent("thrive:phone-state", { detail: { phase: next } }));
    const snapshot: Snapshot = {
      phase: next,
      calledLine: contextRef.current?.calledLine,
      callerMasked: contextRef.current?.callerMasked,
      stage: contextRef.current?.stage,
    };
    channelRef.current?.postMessage({ type: "snapshot", snapshot });
  }, [onPhase]);

  const loadBootstrap = useCallback(async () => {
    try {
      const response = await fetch("/portal/calls/bootstrap", {
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as Bootstrap;
      if (!response.ok) throw new Error(body.error ?? "Call setup could not be read.");
      setBootstrap(body);
      if (!body.phoneEnabled) {
        setPhase("setup_pending", body.setupState === "not_provisioned"
          ? "The inbound-call migration has not been applied yet."
          : "Your personal line and subscriber assignment are still pending.");
      } else {
        setPhase("offline", "Press Available after your headset and microphone are ready.");
      }
    } catch (error) {
      setPhase("error", friendlyError(error, "Call setup could not be loaded."));
    }
  }, [setPhase]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<{ type?: string; snapshot?: Snapshot }>) => {
      if (releaseLockRef.current || event.data?.type !== "snapshot" || !event.data.snapshot) return;
      const snapshot = event.data.snapshot;
      if (["available", "ringing", "connecting", "connected"].includes(snapshot.phase)) {
        setPhaseState("secondary");
        phaseRef.current = "secondary";
        setMessage(
          snapshot.phase === "ringing" || snapshot.phase === "connected"
            ? `${snapshot.callerMasked ?? "Incoming caller"} is active in the primary CORE tab.`
            : "Calls are registered in another primary CORE tab on this computer.",
        );
      }
    };
    const bootstrapTimer = window.setTimeout(() => void loadBootstrap(), 0);
    return () => {
      window.clearTimeout(bootstrapTimer);
      channel.close();
      channelRef.current = null;
    };
  }, [loadBootstrap]);

  const postPresence = useCallback(async (action: "available" | "heartbeat" | "offline") => {
    const response = await fetch("/portal/calls/presence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, browserSessionId: sessionIdRef.current }),
      keepalive: action === "offline",
    });
    if (!response.ok) {
      const body = (await safeJson(response)) as { error?: string };
      throw new Error(body.error ?? "Presence update failed.");
    }
  }, []);

  const stopPhone = useCallback(async (reason = "Phone is offline.") => {
    const call = callRef.current;
    callRef.current = null;
    callStatusCleanupRef.current?.();
    callStatusCleanupRef.current = null;
    if (call && !["disconnected", "destroyed", "failed"].includes(call.status)) {
      try { await call.hangup(); } catch { /* provider already closed it */ }
    }
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      try { await client.unregister(); } catch { /* already unregistered */ }
      try { await client.disconnect(); } catch { /* already disconnected */ }
      try { client.destroy(); } catch { /* partially initialized clients can have no session to destroy */ }
    }
    try { await postPresence("offline"); } catch { /* expiry is the second fail-closed path */ }
    releaseLockRef.current?.();
    releaseLockRef.current = null;
    connectedRef.current = false;
    transferringRef.current = false;
    contextRef.current = null;
    setContext(null);
    setMuted(false);
    setHeld(false);
    setKeypad(false);
    dispatchCallActivity(false);
    if (phaseRef.current !== "setup_pending") setPhase("offline", reason);
  }, [postPresence, setPhase]);

  useEffect(() => {
    const handleOffline = () => void stopPhone("Network lost. Press Available after the connection returns.");
    const handlePageHide = () => {
      if (releaseLockRef.current) {
        void fetch("/portal/calls/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "offline", browserSessionId: sessionIdRef.current }),
          keepalive: true,
        });
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pagehide", handlePageHide);
      void stopPhone();
    };
  }, [stopPhone]);

  useEffect(() => {
    if (!releaseLockRef.current || !bootstrap?.heartbeatMs) return;
    const timer = window.setInterval(async () => {
      if (!["available", "ringing", "connecting", "connected"].includes(phaseRef.current)) return;
      try {
        await postPresence("heartbeat");
        heartbeatFailuresRef.current = 0;
      } catch {
        heartbeatFailuresRef.current += 1;
        if (heartbeatFailuresRef.current >= 2) {
          void stopPhone("The ready heartbeat expired. Press Available to register again.");
        }
      }
    }, bootstrap.heartbeatMs);
    return () => window.clearInterval(timer);
  }, [bootstrap?.heartbeatMs, postPresence, stopPhone]);

  useEffect(() => {
    if (phase !== "ringing") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const offerEvent = useCallback(async (
    action: "ringing" | "answered" | "missed" | "ended",
    callContext: CallContext,
  ) => {
    const response = await fetch("/portal/calls/offer-event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        providerCallId: callContext.providerCallId,
        stage: callContext.stage,
        attempt: callContext.attempt,
        browserSessionId: sessionIdRef.current,
      }),
    });
    const body = (await safeJson(response)) as { answeredElsewhere?: boolean; error?: string };
    if (!response.ok) {
      if (body.answeredElsewhere) return { answeredElsewhere: true };
      throw new Error(body.error ?? "Call state could not be stored.");
    }
    return { answeredElsewhere: false };
  }, []);

  const receiveCall = useCallback((call: Call) => {
    if (callRef.current && callRef.current.id === call.id) return;
    const variables = call.userVariables ?? {};
    const addressContext = addressVariables(call.to);
    const providerCallId = stringVariable(variables.core_call_id)
      ?? addressContext.get("core_call_id")
      ?? call.id;
    const stageValue = stringVariable(variables.core_stage) ?? addressContext.get("core_stage");
    const stage = stageValue === "personal" ? "personal" : "team";
    const rawAttempt = stringVariable(variables.core_attempt) ?? addressContext.get("core_attempt");
    const attempt = rawAttempt && /^\d{1,4}$/.test(rawAttempt)
      ? Math.max(1, Number.parseInt(rawAttempt, 10))
      : 1;
    const calledLine = stringVariable(variables.core_line)
      ?? addressContext.get("core_line")
      ?? "THRIVE line";
    const callerMasked = stringVariable(variables.core_caller)
      ?? addressContext.get("core_caller")
      ?? "Caller number unavailable";
    const nextContext: CallContext = {
      providerCallId,
      stage,
      attempt,
      calledLine,
      callerMasked,
    };
    callRef.current = call;
    connectedRef.current = false;
    contextRef.current = nextContext;
    setContext(nextContext);
    setSeconds(8);
    setPhase("ringing", `${stage === "personal" ? "Your line" : "Team hunt"} · press 1 or Answer.`);
    dispatchCallActivity(true);
    window.dispatchEvent(new CustomEvent(PHONE_PANEL_EVENT, { detail: { open: true } }));
    void offerEvent("ringing", nextContext).catch(() => {
      // Provider delivery remains live; an unrecorded offer is surfaced in the
      // Calls workspace by the provider lifecycle callback if it arrives.
    });

    const statusSubscription = call.status$.subscribe(async (status) => {
      if (status === "connected") {
        connectedRef.current = true;
        const remote = call.remoteStream;
        if (remote && audioRef.current) {
          audioRef.current.srcObject = remote;
          void audioRef.current.play().catch(() => setMessage("Click the page once to allow call audio."));
        }
        try {
          const result = await offerEvent("answered", nextContext);
          if (result.answeredElsewhere) {
            await call.hangup();
            setPhase("answered_elsewhere", "Another employee answered first.");
            return;
          }
        } catch {
          await call.hangup().catch(() => undefined);
          setPhase("error", "The answer could not be authorized, so the call was closed safely.");
          return;
        }
        setPhase("connected", "Connected · live conversation recording is off.");
      }
      if (["disconnected", "failed", "destroyed"].includes(status)) {
        const wasConnected = connectedRef.current;
        const wasTransferring = transferringRef.current;
        if (!wasTransferring) {
          try { await offerEvent(wasConnected ? "ended" : "missed", nextContext); } catch { /* callback may fill it */ }
        }
        callRef.current = null;
        connectedRef.current = false;
        transferringRef.current = false;
        contextRef.current = null;
        setContext(null);
        dispatchCallActivity(false);
        if (phaseRef.current !== "answered_elsewhere") setPhase("available", "Available for the next call.");
      }
    });
    const streamSubscription = call.remoteStream$.subscribe((stream) => {
      if (!audioRef.current) return;
      audioRef.current.srcObject = stream;
      void audioRef.current.play().catch(() => undefined);
    });
    callStatusCleanupRef.current = () => {
      statusSubscription.unsubscribe();
      streamSubscription.unsubscribe();
    };
  }, [offerEvent, setPhase]);

  const becomeAvailable = useCallback(async () => {
    if (!bootstrap?.phoneEnabled || busyAction) return;
    setBusyAction(true);
    setPhase("registering", "Checking microphone and reserving the primary phone tab…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      const release = await acquirePrimaryLock();
      if (!release) {
        setPhase("secondary", "Calls are already registered in another CORE tab on this computer.");
        return;
      }
      releaseLockRef.current = release;

      let lastFingerprint = "";
      const credentials: CredentialProvider = {
        authenticate: async (authContext?: AuthenticateContext): Promise<SDKCredential> => {
          if (!authContext?.fingerprint) throw new Error("Device binding is unavailable.");
          lastFingerprint = authContext.fingerprint;
          return requestCredential(lastFingerprint, sessionIdRef.current, "register");
        },
        refresh: async (): Promise<SDKCredential> => {
          if (!lastFingerprint) throw new Error("Device binding was lost.");
          return requestCredential(lastFingerprint, sessionIdRef.current, "refresh");
        },
      };
      const { SignalWire } = await import("@signalwire/js");
      const client = new SignalWire(credentials, {
        skipConnection: true,
        skipRegister: true,
        persistSession: false,
        savePreferences: false,
        logLevel: "error",
      });
      clientRef.current = client;
      const subscriptionCleanups: Array<() => void> = [];
      const connectionSubscription = client.isConnected$.subscribe((connected) => {
        if (!connected && ["available", "ringing", "connecting", "connected"].includes(phaseRef.current)) {
          void stopPhone("SignalWire disconnected. Press Available to register again.");
        }
      });
      subscriptionCleanups.push(() => connectionSubscription.unsubscribe());
      const previousRelease = releaseLockRef.current;
      releaseLockRef.current = () => {
        subscriptionCleanups.forEach((cleanup) => cleanup());
        previousRelease?.();
      };
      await waitForSignalWireUser(client);
      await client.connect();
      const incomingSubscription = client.session.incomingCalls$.subscribe((calls) => {
        const incoming = calls.find((item) => item.status === "ringing" || item.status === "new") ?? calls[0];
        if (incoming) receiveCall(incoming);
      });
      subscriptionCleanups.push(() => incomingSubscription.unsubscribe());
      await client.register();
      await postPresence("available");
      heartbeatFailuresRef.current = 0;
      setPhase("available", `Ready on ${bootstrap.personalNumber ?? "your THRIVE line"}. Keep this tab open.`);
    } catch (error) {
      await stopPhone(friendlyError(error, "Browser phone registration failed."));
      setPhase("error", friendlyError(error, "Browser phone registration failed."));
    } finally {
      setBusyAction(false);
    }
  }, [bootstrap, busyAction, postPresence, receiveCall, setPhase, stopPhone]);

  const answer = useCallback(() => {
    const call = callRef.current;
    if (!call || phaseRef.current !== "ringing") return;
    setPhase("connecting", "Claiming the call…");
    try {
      call.answer({ audio: true, video: false });
    } catch {
      setPhase("error", "The browser could not answer this offer.");
    }
  }, [setPhase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== "1"
        || phaseRef.current !== "ringing"
        || !panelActive
        || isEditingTarget(event.target)
      ) return;
      event.preventDefault();
      answer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, panelActive]);

  async function sendToTeam() {
    const call = callRef.current;
    if (!call || !context || phase !== "connected" || busyAction) return;
    if (!window.confirm("Return this live call to the available-team hunt? You will not be offered this attempt again.")) return;
    setBusyAction(true);
    try {
      const transferBody = {
        providerCallId: context.providerCallId,
        browserSessionId: sessionIdRef.current,
      };
      const response = await fetch("/portal/calls/team-transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...transferBody, action: "prepare" }),
      });
      const body = (await safeJson(response)) as { destination?: string; alreadyTransferred?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Team transfer was refused.");
      if (body.alreadyTransferred) {
        setMessage("This call was already returned to the team.");
        return;
      }
      if (!body.destination) throw new Error("The team hunt address is unavailable.");
      transferringRef.current = true;
      try {
        await call.transfer({ destination: body.destination });
      } catch (error) {
        transferringRef.current = false;
        await fetch("/portal/calls/team-transfer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...transferBody, action: "cancel" }),
        }).catch(() => undefined);
        throw error;
      }
      const committed = await fetch("/portal/calls/team-transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...transferBody, action: "commit" }),
      }).catch(() => null);
      callStatusCleanupRef.current?.();
      callStatusCleanupRef.current = null;
      callRef.current = null;
      connectedRef.current = false;
      transferringRef.current = false;
      contextRef.current = null;
      setContext(null);
      dispatchCallActivity(false);
      setPhase(
        "available",
        committed?.ok
          ? "Call returned to the team hunt."
          : "Call returned to the team; routing confirmation is completing in the background.",
      );
    } catch (error) {
      setMessage(friendlyError(error, "The call stayed connected; team transfer failed."));
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <div className={`browser-phone browser-phone-${phase}`} aria-live="polite">
      <audio ref={audioRef} autoPlay playsInline aria-hidden="true" />
      <div className="browser-phone-status-row">
        <span className="browser-phone-dot" aria-hidden="true" />
        <strong>{phaseLabel(phase)}</strong>
        {bootstrap?.personalNumber ? <small>{bootstrap.personalNumber}</small> : null}
      </div>

      {context && ["ringing", "connecting", "connected"].includes(phase) ? (
        <section className="browser-phone-call" aria-label={phase === "ringing" ? "Incoming call" : "Active call"}>
          <span className="browser-phone-kicker">{context.stage === "personal" ? "Your business line" : "Available-team hunt"}</span>
          <strong className="browser-phone-caller">{context.callerMasked}</strong>
          <span className="browser-phone-line">Called {context.calledLine}</span>
          {phase === "ringing" ? (
            <>
              <span className="browser-phone-timer" aria-label={`${seconds} seconds remaining`}>{seconds}</span>
              <button className="browser-phone-answer" type="button" onClick={answer}>
                <span>1</span> Answer
              </button>
              <small>Press keyboard 1 while this panel is active, or click Answer.</small>
            </>
          ) : null}
          {phase === "connected" ? (
            <div className="browser-phone-controls" aria-label="Active call controls">
              <button type="button" aria-pressed={muted} onClick={async () => {
                await callRef.current?.self?.toggleMute();
                setMuted((value) => !value);
              }}>{muted ? "Unmute" : "Mute"}</button>
              <button type="button" aria-pressed={held} onClick={async () => {
                await callRef.current?.toggleHold();
                setHeld((value) => !value);
              }}>{held ? "Resume" : "Hold"}</button>
              <button type="button" aria-expanded={keypad} onClick={() => setKeypad((value) => !value)}>Keypad</button>
              <button type="button" disabled={busyAction} onClick={() => void sendToTeam()}>Send to Team</button>
              <button className="browser-phone-end" type="button" onClick={() => void callRef.current?.hangup()}>End Call</button>
            </div>
          ) : null}
          {phase === "connected" && keypad ? (
            <div className="browser-phone-keypad" aria-label="Call keypad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                <button key={digit} type="button" onClick={() => void callRef.current?.sendDigits(digit)}>{digit}</button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="browser-phone-message">{message}</p>
      {phase === "offline" || phase === "error" || phase === "answered_elsewhere" ? (
        <button className="browser-phone-available" type="button" disabled={!bootstrap?.phoneEnabled || busyAction} onClick={() => void becomeAvailable()}>
          Available
        </button>
      ) : null}
      {["available", "secondary"].includes(phase) ? (
        <button className="browser-phone-offline" type="button" disabled={phase === "secondary"} onClick={() => void stopPhone()}>
          Go Offline
        </button>
      ) : null}
      <p className="browser-phone-boundary" id="browser-phone-boundary">Headset audio only. Live calls are not recorded, transcribed, or joined by AI.</p>
    </div>
  );
}

async function requestCredential(
  fingerprint: string,
  browserSessionId: string,
  purpose: "register" | "refresh",
): Promise<SDKCredential> {
  const response = await fetch("/portal/calls/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fingerprint, browserSessionId, purpose }),
  });
  const body = (await safeJson(response)) as { token?: string; expiresAt?: number; error?: string };
  if (!response.ok || !body.token || !body.expiresAt) {
    throw new Error(body.error ?? "A device-bound SignalWire token was not issued.");
  }
  return { token: body.token, expiry_at: body.expiresAt };
}

async function waitForSignalWireUser(
  client: SignalWireClient,
  timeoutMs = 10_000,
): Promise<void> {
  if (client.user) return;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let userSubscription: { unsubscribe(): void } | null = null;
    let errorSubscription: { unsubscribe(): void } | null = null;

    const cleanup = () => {
      window.clearTimeout(timeout);
      queueMicrotask(() => {
        userSubscription?.unsubscribe();
        errorSubscription?.unsubscribe();
      });
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("SignalWire browser phone initialization timed out.")));
    }, timeoutMs);

    userSubscription = client.user$.subscribe((user) => {
      if (user) finish(resolve);
    });
    errorSubscription = client.errors$.subscribe((error) => {
      finish(() => reject(error));
    });
  });
}

async function acquirePrimaryLock(): Promise<(() => void) | null> {
  if (!navigator.locks?.request) return acquireLeaseLock();
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  return new Promise((resolve) => {
    void navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
      if (!lock) {
        resolve(null);
        return;
      }
      resolve(release);
      await hold;
    });
  });
}

function acquireLeaseLock(): (() => void) | null {
  const key = `${LOCK_NAME}:lease`;
  const owner = crypto.randomUUID();
  const now = Date.now();
  try {
    const current = JSON.parse(localStorage.getItem(key) ?? "null") as { owner?: string; expires?: number } | null;
    if (current?.owner && (current.expires ?? 0) > now) return null;
    localStorage.setItem(key, JSON.stringify({ owner, expires: now + 15_000 }));
    const verify = JSON.parse(localStorage.getItem(key) ?? "null") as { owner?: string } | null;
    if (verify?.owner !== owner) return null;
    const timer = window.setInterval(() => {
      localStorage.setItem(key, JSON.stringify({ owner, expires: Date.now() + 15_000 }));
    }, 5_000);
    return () => {
      window.clearInterval(timer);
      const active = JSON.parse(localStorage.getItem(key) ?? "null") as { owner?: string } | null;
      if (active?.owner === owner) localStorage.removeItem(key);
    };
  } catch {
    return null;
  }
}

function dispatchCallActivity(active: boolean) {
  window.dispatchEvent(new CustomEvent(CALL_ACTIVITY_EVENT, { detail: { active } }));
}

function stringVariable(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;
}

function addressVariables(address: string | undefined): URLSearchParams {
  if (!address) return new URLSearchParams();
  try {
    const parsed = new URL(address, "https://fabric.invalid");
    return parsed.origin === "https://fabric.invalid"
      ? parsed.searchParams
      : new URLSearchParams();
  } catch {
    return new URLSearchParams();
  }
}

function isEditingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function phaseLabel(phase: PhonePhase): string {
  const labels: Record<PhonePhase, string> = {
    loading: "Checking",
    setup_pending: "Setup pending",
    offline: "Offline",
    registering: "Registering",
    secondary: "Secondary tab",
    available: "Available",
    ringing: "Incoming call",
    connecting: "Connecting",
    connected: "On call",
    answered_elsewhere: "Answered elsewhere",
    error: "Needs attention",
  };
  return labels[phase];
}

async function safeJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return {}; }
}

function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone permission was denied. Allow microphone access, then press Available.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found. Connect a headset, then press Available.";
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
