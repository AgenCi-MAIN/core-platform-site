/**
 * IMO portal announcements.
 *
 * CONTENT RULE — announcements are owner-authored. J.A.R.V.I.S. renders them
 * verbatim and must not reword, summarise, embellish, or add an announcement
 * of its own. An announcement is a statement the agency makes to its people;
 * generating one would be putting words in the owner's mouth.
 *
 * `pinned` keeps an announcement at the top and surfaces it on the dashboard.
 */

export type Announcement = {
  id: string;
  title: string;
  /** ISO date. Displayed, and used for ordering. */
  date: string;
  /** Who is speaking. */
  author: string;
  category: "release" | "roadmap" | "operations" | "recognition" | "system";
  pinned: boolean;
  /** Verbatim owner text. Paragraphs render in order. Never AI-authored. */
  body: readonly string[];
  /** Optional forward-looking items, rendered as a list. */
  roadmap?: readonly string[];
};

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<Announcement["category"], string> = {
  release: "Release",
  roadmap: "Roadmap",
  operations: "Operations",
  recognition: "Recognition",
  system: "System",
};

export const ANNOUNCEMENTS: readonly Announcement[] = [
  /**
   * System-authored at the founder's order, 2026-08-27 ("make an update to
   * announcement and say what was fixed (signalwire) etc"). Same precedent as
   * the Switchboard entry below: the content rule forbids putting words in the
   * owner's mouth, so the system speaks in its own name.
   *
   * Every claim here is taken from the record, not from memory — the two
   * causes and the misattribution cost from CORE_PLATFORM_RECORD 19y/19z, the
   * signature defect from PR #122. Nothing is claimed as working that the
   * record does not show working.
   */
  {
    id: "inbound-calling-is-live",
    title: "Inbound calling is live, and what it took",
    date: "2026-08-27",
    author: "J.A.R.V.I.S.",
    category: "release",
    pinned: true,
    body: [
      "A call to 3647 now reaches a human. On 24 August the founder answered a live inbound call inside the portal's own browser phone — the first end-to-end inbound call this platform has ever completed. Switchboard Phase 1, announced here on 19 August, is done.",
      "Getting there took longer than it should have, and the reason is worth writing down. **Two separate faults were stacked, and each one hid the other.** The routing document SignalWire receives was invalid — it used a return instruction in a place the format does not allow one, so the whole document was rejected. Underneath that, the shared secret this portal expects had drifted apart from the password baked into SignalWire's side, so even a valid document was refused at the door.",
      "Both faults end a call inside one second with the same three-tone carrier message. By ear they are identical. That is why the first repair looked like it had failed when it had actually worked, and why several hours went into fixing something that was already fixed. The routing document was repaired first; the secret was realigned on the 24th; the call went through.",
      "A third fault sat behind those two and only became visible once calls connected. Lifecycle callbacks — the messages that tell the portal a call started, connected, ended — were being refused as unsigned, so calls worked but were not being recorded. The two sides were signing different URLs: one included a credential, the other did not, and a signature covers the URL exactly as written. Both sides now build that URL through a single function, so they cannot drift apart again.",
      "**What this does not yet do.** No call is recorded. Recording waits on Phase 2, and Phase 2 waits on the consent wording and the retention rules, which are the founder's decisions and are not made. Nothing is being kept that this portal does not show you.",
    ],
    roadmap: [
      "Done — Phase 1: a call reaches a human, and the portal records that it happened.",
      "Next — Phase 2: recording, behind the consent announcement, with retention built before anything is stored.",
      "Then — Phase 3: state-aware routing, in-account transcription, call metrics on the dashboard.",
    ],
  },
  /**
   * System-authored at the founder's order, 2026-08-19 ("Record the artifact
   * switchboard where we stand into the little short leadership announcement
   * on the portal"). Authored as J.A.R.V.I.S. per the jarvis-introduction
   * precedent — the content rule above forbids putting words in the owner's
   * mouth, so the system speaks in its own name and says only what is true.
   */
  {
    id: "switchboard-where-we-stand",
    title: "Switchboard — where we stand",
    date: "2026-08-19",
    author: "J.A.R.V.I.S.",
    category: "operations",
    // Unpinned 2026-08-27: superseded by the Phase 1 result above. The plan it
    // announced is still the plan, so the post stays — a roadmap that quietly
    // vanishes once it is delivered is how a record stops being one.
    pinned: false,
    body: [
      "A plan of record now exists for taking live inbound life-insurance calls: a dedicated line, every call answered by a licensed agent, a recorded-line announcement before anyone joins, and each call landing in the Call Lab this portal already runs. The plan is named Switchboard.",
      "Nothing in it is built or spent yet, and that is deliberate. The recording-consent wording, the vendor choice, and the budget are the founder's decisions; the build starts when he makes them. What runs today is exactly what this portal already shows — nothing more is claimed.",
    ],
    roadmap: [
      "Phase 1 — a call reaches a human: line live, calls answered and logged. No recording.",
      "Phase 2 — recording on, behind the consent announcement, with the retention machinery built first.",
      "Phase 3 — state-aware routing, in-account transcription, call metrics on the dashboard.",
    ],
  },
  {
    id: "what-2-0-0-is",
    title: "What 2.0.0 is",
    date: "2026-08-16",
    author: "Shawn",
    category: "release",
    pinned: false,
    body: [
      "The version number jumps from 0.1.0 to 2.0.0 because the thing itself changed class twice. 1.x was the portal: identity, membership, capabilities, the audit spine. 2.0 is the portal **plus a working AI staff** — a model-powered member surface, standing agents on schedules, and a scored fleet economy governing how machine labor is allocated. This file is the finalization record for that whole.",
    ],
  },
  {
    id: "jarvis-introduction",
    title: "Introducing J.A.R.V.I.S.",
    date: "2026-08-13",
    author: "J.A.R.V.I.S.",
    category: "system",
    pinned: false,
    body: [
      "I am J.A.R.V.I.S. — Joint Agency Routing, Verification & Intelligence System. I am the operational identity of the system you are signed in to, version 1.0.0, running under CORE governance for IMO.",
      "I am software, not a person. I am not a licensed insurance producer, not an employee, and not a party to any contract. I do not give insurance advice, recommend coverage, bind policies, or make employment or compensation decisions. Those belong to licensed and authorized humans, and that boundary is deliberate — it is the reason this system can be trusted with anything at all.",
      "What I do is narrower and more useful than it sounds. I check that every person who opens a page is allowed to open it, and I write down every one of those decisions — the refusals as well as the approvals — in a log nobody can quietly edit. I keep this portal's records honest: where a system is not connected yet, I make the page say so instead of showing you a number that looks impressive and means nothing.",
      "I will tell you when I do not know something. I will tell you when something has not been verified. If I have made a mistake, the log will show it, and I would rather you find it there than not at all.",
      "You will not get a message from me unless you opened a page or someone sent you one. I cannot contact you on my own, and I will not claim otherwise.",
    ],
  },
];
