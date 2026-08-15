"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Membership controls.
 *
 * This component decides nothing. Every button posts to /portal/members/manage,
 * which re-resolves the session and asserts `members.manage` before it writes.
 * Hiding a control here is a courtesy to the person using the page, never a
 * security boundary — the server refuses regardless of what the interface shows.
 */

const ROLES = ["owner", "admin", "manager", "reviewer", "agent", "support"] as const;
const STATUSES = ["active", "suspended", "revoked"] as const;

export type ManagedMember = {
  email: string;
  displayName: string | null;
  role: string;
  status: string;
};

type Note = { kind: "ok" | "error"; text: string } | null;

async function post(body: Record<string, unknown>): Promise<string | null> {
  const res = await fetch("/portal/members/manage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let parsed: { error?: string } = {};
  try {
    parsed = (await res.json()) as { error?: string };
  } catch {
    return "The server returned an unreadable response.";
  }
  return res.ok ? null : (parsed.error ?? `Refused (${res.status}).`);
}

export function MemberControls({
  members,
  selfEmail,
}: {
  members: ManagedMember[];
  selfEmail: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState<string | null>(null);
  /**
   * The selects are controlled by server data, so a change the server has not
   * accepted yet snaps back to the old value mid-request and then jumps again
   * on refresh. Holding the chosen value here keeps the control showing what
   * the person picked until the answer arrives — and drops it on refusal, so
   * the interface never displays a change that did not happen.
   */
  const [pendingValue, setPendingValue] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("agent");

  /**
   * Picking a value and committing it are separate acts, deliberately.
   *
   * These selects used to write from `onChange`. On Windows a closed `<select>`
   * fires `change` on every arrow keypress rather than on commit, so an
   * administrator moving from owner to support with the keyboard fired five
   * POSTs and walked the member through every intermediate role — each one
   * effective on the server the instant it landed, each one written to the
   * audit log, and the status column popping a confirm dialog mid-traversal.
   * A membership change is a governance decision; it must not be a side effect
   * of navigating a list.
   */
  const pick = (key: string, current: string) => pendingValue[key] ?? current;

  function choose(key: string, next: string) {
    setPendingValue((prev) => ({ ...prev, [key]: next }));
  }

  function clear(key: string) {
    setPendingValue((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function run(key: string, body: Record<string, unknown>, success: string) {
    setBusy(key);
    setNote(null);
    void post(body).then((error) => {
      setBusy(null);
      clear(key);
      if (error) {
        setNote({ kind: "error", text: error });
        return;
      }
      setNote({ kind: "ok", text: success });
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="member-controls">
      {note ? (
        <p
          className={note.kind === "ok" ? "member-note member-note-ok" : "member-note member-note-error"}
          role="status"
        >
          {note.text}
        </p>
      ) : null}

      <form
        className="member-grant"
        onSubmit={(event) => {
          event.preventDefault();
          if (!email.trim()) {
            setNote({ kind: "error", text: "Enter the address they sign in with." });
            return;
          }
          run(
            "grant",
            { action: "grant", email, displayName, role },
            `${email.trim().toLowerCase()} now holds ${role}.`,
          );
          setEmail("");
          setDisplayName("");
        }}
      >
        <div className="member-field">
          <label htmlFor="grant-email">Google sign-in address</label>
          <input
            id="grant-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            spellCheck={false}
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="member-field">
          <label htmlFor="grant-name">Name</label>
          <input
            id="grant-name"
            type="text"
            autoComplete="off"
            placeholder="Optional"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="member-field">
          <label htmlFor="grant-role">Role</label>
          <select id="grant-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={busy === "grant" || pending}>
          {busy === "grant" ? "Granting…" : "Grant access"}
        </button>
      </form>

      <p className="portal-fine">
        The address must be the one they actually sign in to Google with. A
        different address grants nothing and looks like a broken portal rather
        than a wrong entry.
      </p>

      <div className="portal-table-scroll">
        <table className="portal-table member-table">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isSelf = m.email === selfEmail;
              // Owner rows are peer-protected — the route refuses these
              // changes regardless, the disabled control just says so up
              // front. See /portal/members/manage governance note 4.
              const locked = isSelf || m.role === "owner";
              return (
                <tr key={m.email}>
                  <td>
                    <strong>{m.displayName ?? "—"}</strong>
                    <span className="portal-cell-sub">
                      {m.email}
                      {isSelf ? " · you" : ""}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Role for ${m.email}`}
                      value={pick(`role:${m.email}`, m.role)}
                      disabled={locked}
                      onChange={(e) => choose(`role:${m.email}`, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      {/* A role the app no longer recognises still renders,
                          rather than showing an empty control over real data. */}
                      {ROLES.includes(m.role as (typeof ROLES)[number]) ? null : (
                        <option value={m.role}>{m.role} (unrecognised)</option>
                      )}
                    </select>
                    {pick(`role:${m.email}`, m.role) !== m.role ? (
                      <button
                        type="button"
                        className="member-apply"
                        disabled={busy !== null || pending}
                        onClick={() => {
                          const key = `role:${m.email}`;
                          const next = pick(key, m.role);
                          run(
                            key,
                            { action: "role", email: m.email, role: next },
                            `${m.email} is now ${next}.`,
                          );
                        }}
                      >
                        {busy === `role:${m.email}`
                          ? "Saving…"
                          : `Save ${pick(`role:${m.email}`, m.role)}`}
                      </button>
                    ) : null}
                  </td>
                  <td>
                    <select
                      aria-label={`Status for ${m.email}`}
                      value={pick(`status:${m.email}`, m.status)}
                      disabled={locked}
                      onChange={(e) => choose(`status:${m.email}`, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {pick(`status:${m.email}`, m.status) !== m.status ? (
                      <button
                        type="button"
                        className="member-apply"
                        disabled={busy !== null || pending}
                        onClick={() => {
                          const key = `status:${m.email}`;
                          const next = pick(key, m.status);
                          // Revoking is one click from an accident, and the
                          // person it affects is not in the room to notice.
                          if (
                            next !== "active" &&
                            !window.confirm(
                              `Set ${m.email} to ${next}? They lose portal access immediately.`,
                            )
                          ) {
                            clear(key);
                            return;
                          }
                          run(
                            key,
                            { action: "status", email: m.email, status: next },
                            `${m.email} is now ${next}.`,
                          );
                        }}
                      >
                        {busy === `status:${m.email}`
                          ? "Saving…"
                          : `Save ${pick(`status:${m.email}`, m.status)}`}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="portal-fine">
        Your own row cannot be changed here, and neither can any owner&apos;s:
        nobody changes their own role or status, and owner rows cannot be
        changed from the portal at all — changing an owner is a
        database-console operation. Every change is written to the audit log
        under your name.
      </p>
    </div>
  );
}
