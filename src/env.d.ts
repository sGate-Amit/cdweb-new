type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
}
