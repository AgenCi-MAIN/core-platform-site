/**
 * Public, non-secret telephony identifiers of record.
 *
 * SignalWire remains the live source of truth for number ownership and call
 * routing. These roles were inspected in the signed-in Space on 2026-08-20;
 * the constants let CORE describe them without holding carrier credentials.
 */
export const TELEPHONY_CONFIG = {
  carrier: "SignalWire",
  spaceName: "Thrive Company",
  platformLine: {
    e164: "+12053515158",
    display: "+1 (205) 351-5158",
    role: "CORE website outbound caller ID",
  },
  mainNumber: {
    e164: "+12053515118",
    display: "+1 (205) 351-5118",
    role: "Main inbound and customer-transfer line",
  },
  bridgeLine: {
    e164: "+12053513647",
    display: "+1 (205) 351-3647",
    role: "Inbound queue bridge caller ID",
  },
  // Never put the private destination itself here. At runtime the full E.164
  // value is read from the SIGNALWIRE_DIALER_AGENT_NUMBER Worker secret and
  // from nothing else — which is the property this hint exists to preserve,
  // and is not the same as the number being unwritten anywhere: several
  // strategy documents in this repository still carry it. Keeping it out of
  // THIS module is what stops it reaching a bundle a browser can read.
  privateAgentHint: "(***) ***-2092",
  inboundResource: "thrive-life-queue",
  get platformNumbers() {
    return [this.platformLine, this.mainNumber, this.bridgeLine] as const;
  },
} as const;
