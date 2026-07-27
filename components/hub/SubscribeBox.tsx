"use client";

/**
 * The one subscribe box (2026-07-22). Renders eyebrow + monthly-digest
 * copy + the form, posting to /api/subscribe (server-side Resend). Used
 * in both the feed sidebar and the company aside — the ONLY difference is
 * the wrapper class each context needs (sidebar: a block inside the
 * bordered sidebar card; aside: a standalone rounded box), passed via
 * `className`. No per-page company capture yet — both are the same
 * monthly digest signup.
 */

import { useState } from "react";

const COPY =
  "Monthly intelligence digest — new analysis, signals, and reports delivered to your inbox.";

export function SubscribeBox({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("ok");
      setMsg("You’re subscribed — check your inbox for a confirmation.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const loading = status === "loading";
  return (
    <section className={["ih-subscribe", className].filter(Boolean).join(" ")}>
      <div className="ih-eyebrow ih-eyebrow-on-dark">Subscribe</div>
      {status === "ok" ? (
        <p className="ih-subscribe-copy ih-subscribe-ok">{msg}</p>
      ) : (
        <>
          <p className="ih-subscribe-copy">{COPY}</p>
          <form onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              aria-label="Email address"
            />
            <button className="ih-btn-primary ih-btn-block" disabled={loading}>
              {loading ? "Subscribing…" : "Subscribe →"}
            </button>
            {status === "error" ? (
              <p className="ih-subscribe-error">{msg}</p>
            ) : null}
          </form>
        </>
      )}
    </section>
  );
}
