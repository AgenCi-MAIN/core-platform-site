"use client";

import { useState } from "react";

const JARVIS_PROMPT_EVENT = "thrive:jarvis-prompt";

/**
 * Prepares a question for the already-protected Presence surface.
 * Submitting here opens the text console and moves the draft into its input;
 * the member must still select Ask before any network request occurs.
 */
export function JarvisCommandPrompt() {
  const [prompt, setPrompt] = useState("");

  return (
    <form
      className="portal-command-prompt"
      onSubmit={(event) => {
        event.preventDefault();
        const question = prompt.trim().slice(0, 400);
        window.dispatchEvent(
          new CustomEvent(JARVIS_PROMPT_EVENT, { detail: { question } }),
        );
        setPrompt("");
      }}
    >
      <label className="sr-only" htmlFor="jarvis-command-question">
        Prepare a question for the J.A.R.V.I.S. text console
      </label>
      <input
        id="jarvis-command-question"
        type="text"
        value={prompt}
        maxLength={400}
        autoComplete="off"
        placeholder="Ask about this workspace…"
        onChange={(event) => setPrompt(event.target.value)}
        aria-describedby="jarvis-command-help"
      />
      <button type="submit">Open text console</button>
      <small id="jarvis-command-help">
        Text only · no microphone · no external action. Nothing is sent until
        you select Ask in the protected console.
      </small>
    </form>
  );
}
