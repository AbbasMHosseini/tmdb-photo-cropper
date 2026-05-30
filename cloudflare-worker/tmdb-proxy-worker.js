const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/whoami') {
      const country = request.cf?.country || request.headers.get('CF-IPCountry') || 'XX';
      return json({ country, useProxy: country === 'IR' });
    }

    if (url.pathname.startsWith('/tmdb/')) {
      return proxyTmdbApi(request, env, url);
    }

    if (url.pathname.startsWith('/image/')) {
      return proxyTmdbImage(request, url);
    }

    return json({ error: 'Not found' }, 404);
  },
};

async function proxyTmdbApi(request, env, url) {
  const allowedPrefixes = [
    '/tmdb/search/movie',
    '/tmdb/search/person',
    '/tmdb/movie/',
    '/tmdb/person/',
    '/tmdb/find/',
  ];

  if (!allowedPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
    return json({ error: 'Route is not allowed' }, 403);
  }

  const token = env.TMDB_READ_ACCESS_TOKEN || env.TMDB_API_KEY;
  if (!token) return json({ error: 'TMDB credential is not configured in Cloudflare Worker secrets' }, 500);

  const tmdbPath = url.pathname.replace(/^\/tmdb/, '');
  const tmdbUrl = new URL(`${TMDB_API_BASE}${tmdbPath}`);
  url.searchParams.forEach((value, key) => {
    if (key !== '_') tmdbUrl.searchParams.set(key, value);
  });

  const headers = token.startsWith('eyJ')
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json;charset=utf-8' }
    : {};

  if (!token.startsWith('eyJ')) {
    tmdbUrl.searchParams.set('api_key', token);
  }

  const response = await fetch(tmdbUrl.toString(), { headers });
  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    headers: {
      ...corsHeaders,
      'Content-Type': response.headers.get('Content-Type') || 'application/json;charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

async function proxyTmdbImage(request, url) {
  const match = url.pathname.match(/^\/image\/(w\d+|original)\/(.+)$/);
  if (!match) return json({ error: 'Invalid image path' }, 400);

  const size = match[1];
  const filePath = match[2].replace(/^\/+/, '');
  const response = await fetch(`${TMDB_IMAGE_BASE}/${size}/${filePath}`);
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: response.status,
    headers: {
      ...corsHeaders,
      'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
}
