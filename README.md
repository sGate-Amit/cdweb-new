# CargoDash - Astro on Cloudflare

Marketing site for CargoDash (sGate Tech Solutions), converted to Astro with the
Cloudflare adapter and deployed as a Cloudflare Worker with static assets.

## Stack

- Astro 5, `output: 'server'` + `@astrojs/cloudflare` - pages render at the edge, `public/` is served as static assets.
- No UI framework: plain `.astro` components, one global stylesheet, ~1 KB of vanilla JS for the forms.
- Demo-request form posts to `/api/demo` (a Worker route) with server-side validation and the human-check.

## Run locally

    npm install
    npm run dev            # http://localhost:4321
    npm run build && npm run preview   # build, then run on the real workerd runtime

## Deploy

    npx wrangler login
    npm run deploy

Set the mailer secret once (leads are logged to the Worker console until it is set):

    npx wrangler secret put RESEND_API_KEY

`LEAD_TO_EMAIL` / `LEAD_FROM_EMAIL` live in `wrangler.jsonc` vars. For local dev copy
`.dev.vars.example` to `.dev.vars`.

## Structure

    src/layouts/Base.astro       document shell, meta, fonts
    src/components/              Header, Hero, Band, Discover, Specs, Contact, Features, Footer, DemoForm, Logo
    src/data/site.ts             all page copy - edit content here, not in markup
    src/pages/index.astro        the landing page
    src/pages/api/demo.ts        POST endpoint for demo requests
    src/styles/global.css        design tokens + all page styles
    public/                      images, favicon, forms.js

## To do before launch

1. Add the real artwork - see `public/images/README.md`.
2. Add `/privacy-policy` and `/terms` pages (footer links are in place).
3. Fill in the real social URLs in `src/components/Footer.astro`.
4. Point the custom domain at the Worker in the Cloudflare dashboard, and update `site` in `astro.config.mjs`.
