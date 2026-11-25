/**
 * Cloudflare Pages Function: POST /api/inquiry
 * Receives Q1 2027 Technical Audit & consulting inquiries without exposing
 * a plaintext email address in the frontend HTML or repository.
 *
 * Configure in Cloudflare Pages -> Settings -> Environment variables:
 *   - CONTACT_TO_EMAIL    (required for Resend delivery, e.g. your inbox)
 *   - RESEND_API_KEY      (optional: send directly via Resend API)
 *   - CONTACT_FROM_EMAIL  (optional: verified Resend sender, defaults to inquiries@dietrichschmidt.com)
 *   - INQUIRY_WEBHOOK_URL (optional alternative: Slack / n8n / Make / custom webhook URL)
 */

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function cleanText(value, maxLen = 2000) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLen);
}

function formatInquiryText(data) {
  const prioritized =
    Array.isArray(data.prioritized) && data.prioritized.length > 0
      ? data.prioritized.map((item) => `  - ${cleanText(item, 140)}`).join('\n')
      : '  - Full 10-Point Q1 2027 Technical Audit (Drupal · AWS · Content/AI)';

  const stack =
    Array.isArray(data.stack) && data.stack.length > 0
      ? data.stack.map((s) => cleanText(s, 80)).join(', ')
      : 'Not specified';

  return [
    'Q1 2027 TECHNICAL AUDIT INQUIRY — dietrichschmidt.com',
    '======================================================',
    `From:         ${data.name} <${data.email}>`,
    `Organization: ${data.organization || 'Not specified'}`,
    `Window:       ${data.window || 'Not specified'}`,
    `Stack:        ${stack}`,
    '',
    'Prioritized Audit Focus:',
    prioritized,
    '',
    'Project Context & Goals:',
    data.notes || '  (No additional notes provided.)',
  ].join('\n');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON payload.' }, 400);
  }

  // Honeypot & timing bot filter: silently accept without sending
  const honeypot = cleanText(body.website, 200);
  const elapsedMs = Number(body.elapsedMs ?? 5000);
  if (honeypot.length > 0 || (Number.isFinite(elapsedMs) && elapsedMs < 1200)) {
    return jsonResponse({ ok: true, mode: 'sent' }, 200);
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160);
  const organization = cleanText(body.organization, 160);
  const windowChoice = cleanText(body.window, 120);
  const notes = cleanText(body.notes, 4000);
  const stack = Array.isArray(body.stack) ? body.stack.slice(0, 12) : [];
  const prioritized = Array.isArray(body.prioritized)
    ? body.prioritized.slice(0, 10)
    : [];

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(
      { ok: false, error: 'Please provide your name and a valid work email.' },
      400
    );
  }

  const subject = `Q1 2027 Technical Audit Inquiry${organization ? ` — ${organization}` : ''}`;
  const textBody = formatInquiryText({
    name,
    email,
    organization,
    window: windowChoice,
    stack,
    prioritized,
    notes,
  });

  // Delivery Path 1: Resend API (recommended for direct inbox delivery)
  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) {
    const fromAddress =
      env.CONTACT_FROM_EMAIL ||
      'Dietrich Gottfried Schmidt <inquiries@dietrichschmidt.com>';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject,
        text: textBody,
      }),
    });

    if (!res.ok) {
      return jsonResponse(
        { ok: false, mode: 'provider_error', error: 'Delivery service error.' },
        502
      );
    }

    return jsonResponse({ ok: true, mode: 'sent' }, 200);
  }

  // Delivery Path 2: Generic Webhook (Slack / Discord / n8n / Make / Formspree)
  if (env.INQUIRY_WEBHOOK_URL) {
    const res = await fetch(env.INQUIRY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        text: textBody,
        name,
        email,
        organization,
        window: windowChoice,
        stack,
        prioritized,
        notes,
        source: 'dietrichschmidt.com',
      }),
    });

    if (!res.ok) {
      return jsonResponse(
        { ok: false, mode: 'provider_error', error: 'Webhook delivery failed.' },
        502
      );
    }

    return jsonResponse({ ok: true, mode: 'sent' }, 200);
  }

  // Fallback signal when server-side delivery env vars are not yet configured
  return jsonResponse(
    {
      ok: false,
      mode: 'unconfigured',
      error: 'Server-side email delivery is not yet configured.',
    },
    503
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}
