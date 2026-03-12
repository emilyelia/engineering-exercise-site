import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ?? 'https://your-domain.com';
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Block CMS admin from indexing',
    'Disallow: /admin/',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', siteUrl)}`,
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
