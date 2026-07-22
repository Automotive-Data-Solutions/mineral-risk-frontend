import { NextRequest, NextResponse } from "next/server";

/**
 * Newsletter / company-tracking subscribe (2026-07-22). Server-side so the
 * Resend key never reaches the browser. Single opt-in: add the email to a
 * Resend Audience, then send one welcome email.
 *
 * Env (frontend .env.local + Vercel):
 *   RESEND_API_KEY      — Resend secret
 *   RESEND_AUDIENCE_ID  — the audience contacts land in
 *   RESEND_FROM         — verified sender, e.g. "Mineral Risk Analytics <hello@yourdomain.com>"
 *
 * NOTE: Resend contacts have no arbitrary metadata field, so the
 * `company` a user tracks is NOT durably stored here — it only
 * personalizes the welcome email. Real per-company alerting (remember
 * who tracks what, email on matching post publish) needs the DB-backed
 * subscribers table + a publish hook; that's a separate build.
 */

const RESEND = "https://api.resend.com";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

export async function POST(req: NextRequest) {
  let email = "";
  let company: string | undefined;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    company = body.company ? String(body.company).trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const from = process.env.RESEND_FROM;
  if (!key || !audienceId || !from) {
    // Loud, not silent — a misconfigured deploy shouldn't look "subscribed".
    return NextResponse.json(
      { error: "Subscriptions aren’t configured yet — check back soon." },
      { status: 503 },
    );
  }

  const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // 1) Add to audience. Treat an already-existing contact as success.
  const contactRes = await fetch(`${RESEND}/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!contactRes.ok) {
    const txt = (await contactRes.text()).toLowerCase();
    const duplicate =
      contactRes.status === 409 ||
      contactRes.status === 422 ||
      txt.includes("already");
    if (!duplicate) {
      return NextResponse.json(
        { error: "Couldn’t save your subscription — please try again." },
        { status: 502 },
      );
    }
  }

  // 2) Welcome email (best-effort — the subscription already succeeded).
  const what = company
    ? `updates whenever new intelligence tags <strong>${escapeHtml(company)}</strong>`
    : "the monthly intelligence digest — new analysis, signals, and reports";
  const subject = company
    ? `You’re tracking ${company} — Mineral Risk Analytics`
    : "You’re subscribed — Mineral Risk Analytics";
  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2E0E0E">
      <div style="height:4px;background:linear-gradient(to right,#2E0E0E,#5C1A1A,#F0D4C4,#C8623A);border-radius:2px"></div>
      <h1 style="font-size:20px;margin:24px 0 8px">Mineral Risk Analytics</h1>
      <p style="font-size:15px;line-height:1.6;color:#4A1419">
        You’re on the list. You’ll receive ${what}.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6B544D;margin-top:20px">
        If this wasn’t you, ignore this email and you won’t be contacted again.
      </p>
    </div>`;

  try {
    await fetch(`${RESEND}/emails`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ from, to: email, subject, html }),
    });
  } catch {
    /* subscription is saved; welcome email is secondary */
  }

  return NextResponse.json({ ok: true });
}
