import type { APIRoute } from 'astro';

export const prerender = false;

const CHALLENGE_ANSWER: Record<string, string> = { heart: 'heart', truck: 'truck' };

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any)?.runtime?.env ?? {};
  let data: Record<string, string>;

  try {
    const ct = request.headers.get('content-type') ?? '';
    data = ct.includes('application/json')
      ? await request.json()
      : Object.fromEntries((await request.formData()) as any);
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400);
  }

  const required = ['name', 'email', 'mobile', 'organization', 'teamSize'];
  const missing = required.filter((k) => !String(data[k] ?? '').trim());
  if (missing.length) return json({ ok: false, error: 'Please fill in all fields.' }, 422);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(data.email))) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 422);
  }

  const expected = CHALLENGE_ANSWER[String(data.challenge)];
  if (!expected || data.answer !== expected) {
    return json({ ok: false, error: 'Please select the correct icon to prove you are human.' }, 422);
  }

  const lead = {
    name: String(data.name).trim(),
    email: String(data.email).trim(),
    mobile: String(data.mobile).trim(),
    organization: String(data.organization).trim(),
    teamSize: String(data.teamSize).trim(),
    receivedAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') ?? '',
  };

  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL ?? 'no-reply@cargodash.in',
        to: [env.LEAD_TO_EMAIL ?? 'mailus@sgate.in'],
        reply_to: lead.email,
        subject: 'CargoDash demo request - ' + lead.organization,
        text: Object.entries(lead)
          .map(([k, v]) => k + ': ' + v)
          .join('\n'),
      }),
    });
    if (!res.ok) {
      console.error('lead email failed', res.status, await res.text());
      return json({ ok: false, error: 'We could not send your request. Please email mailus@sgate.in.' }, 502);
    }
  } else {
    console.log('DEMO LEAD (no mailer configured)', lead);
  }

  return json({ ok: true, message: 'Thanks! Our team will contact you shortly.' });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
