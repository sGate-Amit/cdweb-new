import type { APIRoute } from 'astro';

export const prerender = false;

const CHALLENGE_ANSWER: Record<string, string> = { heart: 'heart', truck: 'truck' };

const CF7_ENDPOINT = 'https://web-api.cargodash.in/wp-json/contact-form-7/v1/contact-forms/12/feedback';

export const POST: APIRoute = async ({ request }) => {
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
  };

  // Hidden fields mirror the "Book a Demo" Contact Form 7 form (id 12, container post 13)
  // on web-api.cargodash.in — update these if that WP form/post or the CF7 plugin version changes.
  const cf7Body = new FormData();
  cf7Body.set('_wpcf7', '12');
  cf7Body.set('_wpcf7_version', '6.1.7');
  cf7Body.set('_wpcf7_locale', 'en_US');
  cf7Body.set('_wpcf7_unit_tag', 'wpcf7-f12-p13-o1');
  cf7Body.set('_wpcf7_container_post', '13');
  cf7Body.set('_wpcf7_posted_data_hash', '');
  cf7Body.set('your-name', lead.name);
  cf7Body.set('your-email', lead.email);
  cf7Body.set('mobile', lead.mobile);
  cf7Body.set('organization', lead.organization);
  cf7Body.set('teamsize', lead.teamSize);

  try {
    const res = await fetch(CF7_ENDPOINT, { method: 'POST', body: cf7Body });
    const result: { status?: string; message?: string } = await res.json();
    if (result.status !== 'mail_sent') {
      console.error('CF7 feedback rejected', res.status, result);
      return json({ ok: false, error: 'We could not send your request. Please email mailus@sgate.in.' }, 502);
    }
  } catch (err) {
    console.error('CF7 feedback request failed', err);
    return json({ ok: false, error: 'We could not send your request. Please email mailus@sgate.in.' }, 502);
  }

  return json({ ok: true, message: 'Thanks! Our team will contact you shortly.' });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
