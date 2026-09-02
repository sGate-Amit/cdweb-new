import type { APIRoute } from 'astro';

export const prerender = false;

const UPLOADS_BASE = 'https://web-api.cargodash.in/wp-content/uploads';

export const GET: APIRoute = async ({ params, request }) => {
  const path = params.path;
  if (!path || path.includes('..')) return new Response('Not found', { status: 404 });

  const upstream = `${UPLOADS_BASE}/${path}`;

  try {
    const res = await fetch(upstream, {
      cf: { cacheTtl: 86400, cacheEverything: true },
      headers: { 'User-Agent': request.headers.get('user-agent') ?? 'CargoDash-Site/1.0' },
    } as RequestInit);

    if (!res.ok || !res.body) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    const contentType = res.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    headers.set('cache-control', 'public, max-age=86400, s-maxage=604800, immutable');

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    console.error('Media proxy failed for', path, err);
    return new Response('Not found', { status: 404 });
  }
};
