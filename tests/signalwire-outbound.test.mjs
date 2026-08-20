import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAL_COOLDOWN_MS,
  buildSignalWireDialRequest,
  dialRateBucket,
  isPlatformNumber,
  maskE164,
  normalizeE164,
  normalizeSignalWireSpace,
} from "../app/portal/dialer/outbound.ts";

test("normalizes E.164 input without accepting extensions or malformed numbers", () => {
  assert.equal(normalizeE164("+1 (205) 555-0123"), "+12055550123");
  assert.equal(normalizeE164("205-555-0123"), null);
  assert.equal(normalizeE164("+1 205 555 0123 x5"), null);
  assert.equal(normalizeE164("+00000000"), null);
  assert.equal(normalizeE164(null), null);
});

test("accepts only a clean HTTPS SignalWire Space host", () => {
  assert.equal(
    normalizeSignalWireSpace("thrive-company.signalwire.com"),
    "thrive-company.signalwire.com",
  );
  assert.equal(
    normalizeSignalWireSpace("https://THRIVE-COMPANY.signalwire.com"),
    "thrive-company.signalwire.com",
  );
  assert.equal(normalizeSignalWireSpace("http://thrive-company.signalwire.com"), null);
  assert.equal(normalizeSignalWireSpace("https://signalwire.example.com"), null);
  assert.equal(normalizeSignalWireSpace("https://user:pass@thrive-company.signalwire.com"), null);
  assert.equal(normalizeSignalWireSpace("https://thrive-company.signalwire.com/path"), null);
});

test("masks destinations and blocks every CORE platform number", () => {
  assert.equal(maskE164("+14095550123"), "***0123");
  const platformNumbers = ["+12053515158", "+12053515118", "+12053513647"];
  assert.equal(isPlatformNumber("+12053515158", platformNumbers), true);
  assert.equal(isPlatformNumber("+12053515118", platformNumbers), true);
  assert.equal(isPlatformNumber("+12053513647", platformNumbers), true);
  assert.equal(isPlatformNumber("+14095550123", platformNumbers), false);
});

test("uses a 30-second global reservation bucket", () => {
  assert.equal(DIAL_COOLDOWN_MS, 30_000);
  assert.equal(dialRateBucket(0), 0);
  assert.equal(dialRateBucket(29_999), 0);
  assert.equal(dialRateBucket(30_000), 1);
});

test("agent test rings only the private destination from the CORE platform line", () => {
  const request = buildSignalWireDialRequest({
    agentNumber: "+14095550123",
    callerId: "+12053515158",
    mode: "agent_test",
  });

  assert.equal(request.command, "dial");
  assert.equal(request.params.from, "+12053515158");
  assert.equal(request.params.caller_id, "+12053515158");
  assert.equal(request.params.to, "+14095550123");
  const [prompt, confirmation] = request.params.swml.sections.main;
  assert.deepEqual(prompt.prompt.play, [
    "say:CORE platform line test. Press 1 to confirm you received this call.",
    "silence:2",
    "say:Press 1 to confirm.",
  ]);
  assert.equal(confirmation.switch.variable, "prompt_value");
  assert.ok(confirmation.switch.case["1"]);
  assert.ok(confirmation.switch.default);
  assert.equal(
    prompt.prompt.play.every((entry) => typeof entry === "string"),
    true,
    "SignalWire prompt.play accepts strings, not {say}/{silence} objects",
  );
  assert.doesNotMatch(JSON.stringify(request), /"connect":/);
  assert.doesNotMatch(JSON.stringify(request), /record|transcrib|ai_agent/i);
});

test("customer mode rings the owner first and connects only after press 1", () => {
  const request = buildSignalWireDialRequest({
    agentNumber: "+14095550123",
    callerId: "+12053515158",
    destination: "+12055550123",
    mode: "customer",
  });
  const document = JSON.stringify(request);
  const [prompt, confirmation] = request.params.swml.sections.main;
  const accepted = confirmation.switch.case["1"];
  const connect = accepted.find((step) => step.connect)?.connect;

  assert.equal(request.params.to, "+14095550123");
  assert.equal(confirmation.switch.variable, "prompt_value");
  assert.deepEqual(prompt.prompt.play, [
    "say:CORE dialer. Press 1 to connect the customer call.",
    "silence:2",
    "say:Press 1 to continue.",
  ]);
  assert.equal(connect.from, "+12053515158");
  assert.equal(connect.to, "+12055550123");
  assert.equal(connect.timeout, 30);
  assert.ok(confirmation.switch.default, "no-input and non-1 input must fail closed");
  assert.doesNotMatch(document, /record|transcrib|ai_agent/i);
});

test("customer mode refuses to build without a destination", () => {
  assert.throws(
    () =>
      buildSignalWireDialRequest({
        agentNumber: "+14095550123",
        callerId: "+12053515158",
        mode: "customer",
      }),
    /destination is required/i,
  );
});
