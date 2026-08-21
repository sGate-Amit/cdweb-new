# Image assets

Drop the production artwork here, keeping these exact paths (referenced from `src/data/site.ts`
and `src/components/*`):

    hero-laptop.png              hero laptop mockup
    icons/cloud.svg              Discover: Cloud based SaaS product
    icons/pricing.svg            Discover: Commercially suitable for everyone
    icons/control.svg            Discover: Centralized control
    icons/tally.svg              Discover: Integration with Tally
    icons/hr.svg                 Discover: Robust HR module
    features/air-exports.svg     Features strip
    features/air-imports.svg
    features/sea-exports.svg
    features/sea-imports.svg
    features/hr-payroll.svg
    features/tally.svg
    logo.svg                     optional: swap the text logo in src/components/Logo.astro

Everything in `public/` is served from the site root and cached on Cloudflare's edge.
