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
  // Wine+Stone welcome template (2026-07-26). Email-client-safe: table
  // layout, fully inlined styles, Georgia stack, no webfonts or images.
  // SITE_URL: set NEXT_PUBLIC_SITE_URL in env; falls back to the hub path.
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mineralriskanalytics.com";
  const what = company
    ? `updates whenever new intelligence tags <strong style="color:#4A1419">${escapeHtml(company)}</strong>`
    : "one monthly digest — the analysis, signals, and reports that mattered across battery mineral supply chains";
  const subject = company
    ? `You’re tracking ${company} — Mineral Risk Analytics`
    : "Welcome to Mineral Risk Analytics";
  const preheader = company
    ? `We’ll email you when new intelligence tags ${company}.`
    : "One email a month on battery mineral supply-chain risk. No noise.";
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#FAF3EC">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF3EC">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="padding:0 8px 14px">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.16em;color:#9E7B72;text-transform:uppercase">Mineral Risk Analytics</div>
        </td></tr>
        <tr><td style="height:3px;background-color:#4A1419;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td style="background-color:#FFFFFF;border:1px solid #E5D4C5;border-top:none;padding:36px 40px">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:600;color:#4A1419;margin:0 0 16px">You’re on the list.</h1>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#4A1419;margin:0 0 16px">
            Thanks for subscribing. You’ll receive ${what}.
          </p>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#4A1419;margin:0 0 28px">
            We track the materials that move the battery economy — cobalt, lithium, graphite, nickel, rare earths and beyond — scoring where supply concentrates, what governments are doing about it, and what it means for anyone sourcing them.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:#C8623A;border-radius:4px">
              <a href="${site}/intelligence" style="display:inline-block;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#FFFFFF;text-decoration:none;padding:12px 22px">Explore the Intelligence Hub &rarr;</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 8px 0">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.6;color:#9E7B72;margin:0">
            You’re receiving this because this address was subscribed at ${site.replace(/^https?:\/\//, "")}. If this wasn’t you, ignore this email and you won’t be contacted again.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Prefer the Resend-hosted template when configured (Templates feature,
  // 2026): set RESEND_WELCOME_TEMPLATE_ID to the published template's id or
  // alias. The template declares one variable, WHAT_LINE (string, with a
  // digest-copy fallback). If the template send fails for any reason we
  // fall back to the inline HTML above — the subscriber never notices.
  const templateId = process.env.RESEND_WELCOME_TEMPLATE_ID;
  const whatLine = company
    ? `updates whenever new intelligence tags ${escapeHtml(company)}`
    : "one monthly digest — the analysis, signals, and reports that mattered across battery mineral supply chains";
  try {
    let sent = false;
    if (templateId) {
      const tRes = await fetch(`${RESEND}/emails`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          from,
          to: email,
          subject,
          template: { id: templateId, variables: { WHAT_LINE: whatLine } },
        }),
      });
      sent = tRes.ok;
    }
    if (!sent) {
      await fetch(`${RESEND}/emails`, {
        method: "POST",
        headers: auth,
        body: JSON.stringify({ from, to: email, subject, html }),
      });
    }
  } catch {
    /* subscription is saved; welcome email is secondary */
  }

  return NextResponse.json({ ok: true });
}
