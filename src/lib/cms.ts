import { discover as discoverFallback, specs as specsFallback, features as featuresFallback } from '../data/site';

const API_BASE = 'https://web-api.cargodash.in/wp-json/wp/v2';

const CATEGORY_SLUGS = {
  discover: 'discover',
  specifications: 'specifications',
  features: 'features',
} as const;

// Known IDs as of writing, used only if the slug lookup below fails.
const CATEGORY_ID_FALLBACK: Record<keyof typeof CATEGORY_SLUGS, number> = {
  discover: 1,
  specifications: 2,
  features: 3,
};

const categoryIdCache = new Map<string, number>();

interface WPMedia {
  source_url?: string;
}

interface WPPost {
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: WPMedia[] };
}

interface WPCategory {
  id: number;
}

async function resolveCategoryId(key: keyof typeof CATEGORY_SLUGS): Promise<number> {
  const cached = categoryIdCache.get(key);
  if (cached !== undefined) return cached;

  const slug = CATEGORY_SLUGS[key];
  try {
    const res = await fetch(`${API_BASE}/categories?slug=${slug}`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`WP API categories?slug=${slug} responded ${res.status}`);
    const categories: WPCategory[] = await res.json();
    const id = categories[0]?.id ?? CATEGORY_ID_FALLBACK[key];
    categoryIdCache.set(key, id);
    return id;
  } catch (err) {
    console.error('CMS category lookup failed for slug', slug, err);
    return CATEGORY_ID_FALLBACK[key];
  }
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractPoints(html: string): string[] {
  const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  if (items.length) return items;
  const text = stripTags(html);
  return text ? [text] : [];
}

const UPLOADS_PREFIX = 'https://web-api.cargodash.in/wp-content/uploads/';

function featuredImage(post: WPPost): string {
  const url = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
  return url.startsWith(UPLOADS_PREFIX) ? `/api/media/${url.slice(UPLOADS_PREFIX.length)}` : url;
}

async function fetchCategoryPosts(key: keyof typeof CATEGORY_SLUGS): Promise<WPPost[]> {
  const categoryId = await resolveCategoryId(key);
  try {
    const res = await fetch(`${API_BASE}/posts?categories=${categoryId}&_embed&order=asc`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`WP API category ${categoryId} responded ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('CMS fetch failed for category', categoryId, err);
    return [];
  }
}

export async function getDiscover() {
  const posts = await fetchCategoryPosts('discover');
  if (!posts.length) return discoverFallback;
  return posts.map((p) => ({
    title: stripTags(p.title.rendered),
    icon: featuredImage(p),
    points: extractPoints(p.content.rendered),
  }));
}

export async function getSpecs() {
  const posts = await fetchCategoryPosts('specifications');
  if (!posts.length) return specsFallback;
  return posts.map((p) => {
    const title = stripTags(p.title.rendered);
    return {
      title: /[:：]$/.test(title) ? title : `${title}:`,
      body: stripTags(p.content.rendered),
    };
  });
}

export async function getFeatures() {
  const posts = await fetchCategoryPosts('features');
  if (!posts.length) return featuresFallback;
  return posts.map((p) => ({
    label: stripTags(p.title.rendered),
    icon: featuredImage(p),
  }));
}
