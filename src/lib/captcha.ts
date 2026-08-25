const CAPTCHA_SOURCE_URL = 'https://web-api.cargodash.in/book-a-demo/';

export interface DemoCaptcha {
  word: string;
  options: { value: string; viewBox: string; path: string }[];
}

const WORD_RE = /cf7ic_instructions">[^<]*<span>\s*([a-zA-Z]+)\s*<\/span>/;
const OPTION_RE = /name="kc_captcha"\s+value="([^"]+)"\s*\/><svg[^>]*viewBox="([^"]+)"[^>]*><path[^>]*\bd="([^"]+)"/g;

// Scrapes the live "Book a Demo" WP page for its Contact Form 7 Image Captcha markup —
// there's no REST route for this, the challenge only exists once the shortcode is rendered.
// Fragile to markup/plugin changes, same class of risk as the hidden CF7 fields in demo.ts.
export async function getDemoCaptcha(): Promise<DemoCaptcha | null> {
  try {
    const res = await fetch(CAPTCHA_SOURCE_URL);
    if (!res.ok) throw new Error(`captcha source responded ${res.status}`);
    const html = await res.text();

    const wordMatch = html.match(WORD_RE);
    const options = [...html.matchAll(OPTION_RE)].map((m) => ({
      value: m[1],
      viewBox: m[2],
      path: m[3],
    }));

    if (!wordMatch || options.length < 2) throw new Error('captcha markup not found');
    return { word: wordMatch[1], options };
  } catch (err) {
    console.error('getDemoCaptcha failed', err);
    return null;
  }
}
