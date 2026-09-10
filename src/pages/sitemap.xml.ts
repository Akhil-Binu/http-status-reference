import type { APIRoute } from 'astro';
import { statusCodes } from '../data/statusCodes';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? 'https://http.dev';
  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/guide`, priority: '0.9' },
    ...statusCodes.map((s) => ({ loc: `${base}/${s.code}`, priority: '0.8' })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
