import type { APIRoute } from 'astro';
import { statusCodes } from '../data/statusCodes';

export const prerender = true;

export const GET: APIRoute = () => {
  const index = statusCodes.map((s) => ({
    code: s.code,
    name: s.name,
    category: s.category,
    summary: s.summary,
    keywords: [s.name, ...s.keywords, ...s.scenarios].join(' · '),
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
