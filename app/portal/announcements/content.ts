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
    pinned: true,
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
