const getAllowedOrigins = (env) => {
  const configured = env.FRONTEND_URL || 'https://sixthsin.com,https://www.sixthsin.com';
  return configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const getCorsHeaders = (request, env) => {
  const allowedOrigins = getAllowedOrigins(env);
  const origin = request.headers.get('Origin');
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
};

const jsonResponse = (body, init = {}, request, env) => {
  const headers = new Headers(init.headers || {});
  Object.entries(getCorsHeaders(request, env)).forEach(([key, value]) => {
    headers.set(key, value);
  });
  headers.set('content-type', 'application/json');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname === '/api/health') {
      return jsonResponse({
        success: true,
        message: '6th SIN API is running on Cloudflare Workers',
        timestamp: new Date().toISOString(),
      }, {}, request, env);
    }

    if (url.pathname === '/api/products' && request.method === 'GET') {
      return jsonResponse({
        success: true,
        count: 0,
        products: [],
      }, {}, request, env);
    }

    if (url.pathname === '/api/frontpage' && request.method === 'GET') {
      return jsonResponse({
        success: true,
        frontpage: {
          hero: { text: 'BECOME A PART OF THE WORLD' },
          featuredCollections: {
            heading: 'REDEFINING THE BOUNDARIES OF STYLE',
            body: 'Fashion with attitude.',
            ctaText: 'EXPLORE THE COLLECTION',
            images: [],
          },
          newArrivals: { title: 'NEW ARRIVALS' },
          lookbook: { images: [] },
        },
      }, {}, request, env);
    }

    if (url.pathname === '/api/menu' && request.method === 'GET') {
      return jsonResponse({
        success: true,
        menu: [],
      }, {}, request, env);
    }

    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
          return jsonResponse(
            { success: false, message: 'Expected multipart/form-data upload.' },
            { status: 400 },
            request,
            env
          );
        }

        const formData = await request.formData();
        const files = [];
        const bucket = env.ASSETS || env.R2_BUCKET;

        if (!bucket) {
          return jsonResponse(
            { success: false, message: 'R2 bucket binding is not configured.' },
            { status: 500 },
            request,
            env
          );
        }

        for (const [_, value] of formData.entries()) {
          if (value instanceof File) {
            const uniqueId = crypto.randomUUID();
            const key = `products/${Date.now()}-${uniqueId}-${value.name}`;
            await bucket.put(key, value.stream(), {
              httpMetadata: { contentType: value.type || 'application/octet-stream' },
            });

            const publicUrl = `${env.R2_PUBLIC_URL || 'https://assets.sixthsin.com'}/${key}`;
            files.push({ publicUrl, key });
          }
        }

        return jsonResponse({ success: true, files }, {}, request, env);
      } catch (error) {
        return jsonResponse(
          { success: false, message: error.message || 'Upload failed.' },
          { status: 500 },
          request,
          env
        );
      }
    }

    return jsonResponse(
      { success: false, message: `Route not found: ${request.method} ${url.pathname}` },
      { status: 404 },
      request,
      env
    );
  },
};
