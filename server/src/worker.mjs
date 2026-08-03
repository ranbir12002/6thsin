import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getAdminsCollection } from './lib/mongo.mjs';
import { signJwt, verifyJwt } from './lib/jwt.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        const errors = [];
        if (!EMAIL_RE.test(email)) errors.push('Please provide a valid email');
        if (!password) errors.push('Password is required');
        if (errors.length) {
          return jsonResponse({ success: false, errors }, { status: 400 }, request, env);
        }

        const admins = await getAdminsCollection(env);
        const admin = await admins.findOne({ email });
        if (!admin) {
          return jsonResponse(
            { success: false, message: 'Invalid email or password.' },
            { status: 401 },
            request,
            env
          );
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          return jsonResponse(
            { success: false, message: 'Invalid email or password.' },
            { status: 401 },
            request,
            env
          );
        }

        const token = await signJwt({ id: admin._id.toString() }, env.JWT_SECRET, env.JWT_EXPIRES_IN);

        return jsonResponse(
          {
            success: true,
            token,
            admin: { id: admin._id, email: admin.email, name: admin.name },
          },
          {},
          request,
          env
        );
      } catch (error) {
        return jsonResponse(
          { success: false, message: error.message || 'Login failed.' },
          { status: 500 },
          request,
          env
        );
      }
    }

    if (url.pathname === '/api/auth/register-admin' && request.method === 'POST') {
      try {
        const secret = request.headers.get('X-Admin-Secret');
        if (!secret || secret !== env.JWT_SECRET) {
          return jsonResponse(
            { success: false, message: 'Unauthorized: Invalid registration secret.' },
            { status: 401 },
            request,
            env
          );
        }

        const body = await request.json().catch(() => ({}));
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const name = typeof body.name === 'string' ? body.name.trim() : '';

        const errors = [];
        if (!EMAIL_RE.test(email)) errors.push('Please provide a valid email');
        if (password.length < 8) errors.push('Password must be at least 8 characters long');
        if (!name) errors.push('Name is required');
        if (errors.length) {
          return jsonResponse({ success: false, errors }, { status: 400 }, request, env);
        }

        const admins = await getAdminsCollection(env);
        const existingAdmin = await admins.findOne({ email });
        if (existingAdmin) {
          return jsonResponse(
            { success: false, message: 'Admin with this email already exists.' },
            { status: 400 },
            request,
            env
          );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const { insertedId } = await admins.insertOne({
          email,
          password: hashedPassword,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return jsonResponse(
          { success: true, admin: { id: insertedId, email, name } },
          { status: 201 },
          request,
          env
        );
      } catch (error) {
        return jsonResponse(
          { success: false, message: error.message || 'Registration failed.' },
          { status: 500 },
          request,
          env
        );
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return jsonResponse(
            { success: false, message: 'Access denied. No token provided.' },
            { status: 401 },
            request,
            env
          );
        }

        const token = authHeader.slice('Bearer '.length);
        let decoded;
        try {
          decoded = await verifyJwt(token, env.JWT_SECRET);
        } catch (error) {
          const message =
            error.name === 'TokenExpiredError' ? 'Token expired. Please login again.' : 'Invalid token.';
          return jsonResponse({ success: false, message }, { status: 401 }, request, env);
        }

        const admins = await getAdminsCollection(env);
        const admin = await admins.findOne(
          { _id: new ObjectId(decoded.id) },
          { projection: { password: 0 } }
        );
        if (!admin) {
          return jsonResponse(
            { success: false, message: 'Invalid token. Admin not found.' },
            { status: 401 },
            request,
            env
          );
        }

        return jsonResponse({ success: true, admin }, {}, request, env);
      } catch (error) {
        return jsonResponse(
          { success: false, message: error.message || 'Request failed.' },
          { status: 500 },
          request,
          env
        );
      }
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
