import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { withMongo } from './lib/mongo.mjs';
import { signJwt, verifyJwt } from './lib/jwt.mjs';
import { presignR2PutUrl } from './lib/r2sign.mjs';

const UPLOAD_CONTENT_TYPE_RE = /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

// Verifies the Authorization header and loads the admin, mirroring middleware/auth.js.
async function requireAdmin(request, env, db) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: { status: 401, message: 'Access denied. No token provided.' } };
  }

  const token = authHeader.slice('Bearer '.length);
  let decoded;
  try {
    decoded = await verifyJwt(token, env.JWT_SECRET);
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError' ? 'Token expired. Please login again.' : 'Invalid token.';
    return { error: { status: 401, message } };
  }

  const adminId = toObjectId(decoded.id);
  if (!adminId) {
    return { error: { status: 401, message: 'Invalid token.' } };
  }

  const admin = await db.collection('admins').findOne({ _id: adminId }, { projection: { password: 0 } });
  if (!admin) {
    return { error: { status: 401, message: 'Invalid token. Admin not found.' } };
  }

  return { admin };
}

// Mirrors models/Menu.js's toJSON transform (_id -> id, same for nested children).
function serializeCategory(doc) {
  return {
    id: doc._id.toString(),
    label: doc.label,
    order: doc.order,
    children: (doc.children || []).map((child) => ({
      id: child._id.toString(),
      label: child.label,
      href: child.href,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const PRODUCT_CATEGORIES = ['MENSWEAR', 'WOMENSWEAR', 'ACCESSORIES', 'ACTIVEWEAR', 'HOME'];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Mirrors models/Product.js's toJSON transform: drops _id, exposes the
// `id` virtual as the slug (frontend routes/looks up products by slug).
function serializeProduct(doc) {
  const { _id, ...rest } = doc;
  return { ...rest, id: doc.slug };
}

async function findProduct(db, identifier) {
  const products = db.collection('products');
  let product = await products.findOne({ slug: identifier });
  if (!product) {
    const id = toObjectId(identifier);
    if (id) product = await products.findOne({ _id: id });
  }
  return product;
}

function defaultFrontpageSettings() {
  return {
    hero: { text: 'BECOME A PART OF THE WORLD' },
    featuredCollections: {
      heading: 'REDEFINING THE BOUNDARIES OF STYLE',
      body:
        'Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours.',
      ctaText: 'EXPLORE THE COLLECTION',
      images: ['/images/collection-editorial-1.jpg', '/images/collection-editorial-2.jpg'],
    },
    newArrivals: { title: 'NEW ARRIVALS' },
    lookbook: {
      images: [
        '/images/lookbook-1.jpg', '/images/lookbook-2.jpg', '/images/lookbook-3.jpg', '/images/lookbook-4.jpg',
        '/images/lookbook-5.jpg', '/images/lookbook-6.jpg', '/images/lookbook-7.jpg', '/images/lookbook-8.jpg',
        '/images/lookbook-9.jpg', '/images/lookbook-10.jpg', '/images/lookbook-11.jpg', '/images/lookbook-12.jpg',
      ],
    },
  };
}

// Mirrors Frontpage.getSettings(): singleton document, created with
// defaults on first read.
async function getFrontpageSettings(db) {
  const frontpage = db.collection('frontpages');
  let settings = await frontpage.findOne();
  if (!settings) {
    const now = new Date();
    const doc = { ...defaultFrontpageSettings(), createdAt: now, updatedAt: now };
    const { insertedId } = await frontpage.insertOne(doc);
    settings = { ...doc, _id: insertedId };
  }
  return settings;
}

function serializeFrontpage(doc) {
  const { _id, ...rest } = doc;
  return rest;
}

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

const errorResponse = (error, fallbackMessage, request, env) =>
  jsonResponse({ success: false, message: error.message || fallbackMessage }, { status: 500 }, request, env);

const authErrorResponse = (authResult, request, env) =>
  jsonResponse(
    { success: false, message: authResult.error.message },
    { status: authResult.error.status },
    request,
    env
  );

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);
    const menuItemIdMatch = url.pathname.match(/^\/api\/menu\/([^/]+)\/items\/([^/]+)$/);
    const menuItemsMatch = url.pathname.match(/^\/api\/menu\/([^/]+)\/items$/);
    const menuIdMatch = url.pathname.match(/^\/api\/menu\/([^/]+)$/);
    const productIdentifierMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    const uploadKeyMatch = url.pathname.match(/^\/api\/upload\/(.+)$/);

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
        return await withMongo(env, async (db) => {
          const body = await request.json().catch(() => ({}));
          const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
          const password = typeof body.password === 'string' ? body.password : '';

          const errors = [];
          if (!EMAIL_RE.test(email)) errors.push('Please provide a valid email');
          if (!password) errors.push('Password is required');
          if (errors.length) {
            return jsonResponse({ success: false, errors }, { status: 400 }, request, env);
          }

          const admin = await db.collection('admins').findOne({ email });
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
        });
      } catch (error) {
        return errorResponse(error, 'Login failed.', request, env);
      }
    }

    if (url.pathname === '/api/auth/register-admin' && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
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

          const admins = db.collection('admins');
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
        });
      } catch (error) {
        return errorResponse(error, 'Registration failed.', request, env);
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          return jsonResponse({ success: true, admin: authResult.admin }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Request failed.', request, env);
      }
    }

    if (url.pathname === '/api/products' && request.method === 'GET') {
      try {
        return await withMongo(env, async (db) => {
          const filter = {};
          const category = url.searchParams.get('category');
          if (category) filter.category = category.toUpperCase();
          const published = url.searchParams.get('published');
          if (published !== null) filter.isPublished = published === 'true';
          const search = url.searchParams.get('search');
          if (search) filter.name = { $regex: search, $options: 'i' };

          const products = await db.collection('products').find(filter).sort({ createdAt: -1 }).toArray();
          return jsonResponse(
            { success: true, count: products.length, products: products.map(serializeProduct) },
            {},
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to load products.', request, env);
      }
    }

    if (url.pathname === '/api/products' && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const body = await request.json().catch(() => ({}));
          const name = typeof body.name === 'string' ? body.name.trim() : '';
          const price = typeof body.price === 'string' ? body.price.trim() : '';
          const description = typeof body.description === 'string' ? body.description.trim() : '';
          const category = typeof body.category === 'string' ? body.category : '';

          const errors = [];
          if (!name) errors.push('Product name is required');
          if (!price) errors.push('Price is required');
          if (!description) errors.push('Description is required');
          if (!PRODUCT_CATEGORIES.includes(category)) errors.push('Invalid category');
          if (errors.length) {
            return jsonResponse({ success: false, errors }, { status: 400 }, request, env);
          }

          const products = db.collection('products');
          await products.createIndex({ slug: 1 }, { unique: true }).catch(() => {});

          const now = new Date();
          const doc = {
            name,
            slug: slugify(name),
            price,
            description,
            images: Array.isArray(body.images) ? body.images : [],
            category,
            subcategory: typeof body.subcategory === 'string' ? body.subcategory : '',
            color: typeof body.color === 'string' ? body.color : '',
            colors: Array.isArray(body.colors)
              ? body.colors.filter((c) => c?.name && c?.hex).map((c) => ({ name: c.name, hex: c.hex }))
              : [],
            sizes: Array.isArray(body.sizes) ? body.sizes : [],
            material: typeof body.material === 'string' ? body.material : '',
            careInstructions: Array.isArray(body.careInstructions) ? body.careInstructions : [],
            fit: typeof body.fit === 'string' ? body.fit : '',
            articleNumber: typeof body.articleNumber === 'string' ? body.articleNumber : '',
            supplierInfo: typeof body.supplierInfo === 'string' ? body.supplierInfo : '',
            countryOfProduction: typeof body.countryOfProduction === 'string' ? body.countryOfProduction : '',
            isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : true,
            createdAt: now,
            updatedAt: now,
          };

          try {
            const { insertedId } = await products.insertOne(doc);
            return jsonResponse(
              { success: true, product: serializeProduct({ ...doc, _id: insertedId }) },
              { status: 201 },
              request,
              env
            );
          } catch (insertError) {
            if (insertError.code === 11000) {
              return jsonResponse(
                { success: false, message: 'A product with this name already exists.' },
                { status: 400 },
                request,
                env
              );
            }
            throw insertError;
          }
        });
      } catch (error) {
        return errorResponse(error, 'Failed to create product.', request, env);
      }
    }

    if (productIdentifierMatch && request.method === 'GET') {
      try {
        return await withMongo(env, async (db) => {
          const product = await findProduct(db, decodeURIComponent(productIdentifierMatch[1]));
          if (!product) {
            return jsonResponse(
              { success: false, message: 'Product not found.' },
              { status: 404 },
              request,
              env
            );
          }
          return jsonResponse({ success: true, product: serializeProduct(product) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to load product.', request, env);
      }
    }

    if (productIdentifierMatch && request.method === 'PUT') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const existing = await findProduct(db, decodeURIComponent(productIdentifierMatch[1]));
          if (!existing) {
            return jsonResponse(
              { success: false, message: 'Product not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const body = await request.json().catch(() => ({}));
          const set = { updatedAt: new Date() };

          if (typeof body.name === 'string' && body.name.trim()) {
            set.name = body.name.trim();
            set.slug = slugify(set.name);
          }
          ['price', 'description', 'category', 'subcategory', 'color', 'material', 'fit', 'articleNumber', 'supplierInfo', 'countryOfProduction']
            .forEach((field) => {
              if (typeof body[field] === 'string') set[field] = body[field];
            });
          if (Array.isArray(body.images)) set.images = body.images;
          if (Array.isArray(body.colors)) {
            set.colors = body.colors.filter((c) => c?.name && c?.hex).map((c) => ({ name: c.name, hex: c.hex }));
          }
          if (Array.isArray(body.sizes)) set.sizes = body.sizes;
          if (Array.isArray(body.careInstructions)) set.careInstructions = body.careInstructions;
          if (typeof body.isPublished === 'boolean') set.isPublished = body.isPublished;

          const result = await db.collection('products').findOneAndUpdate(
            { _id: existing._id },
            { $set: set },
            { returnDocument: 'after' }
          );

          return jsonResponse({ success: true, product: serializeProduct(result) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to update product.', request, env);
      }
    }

    if (productIdentifierMatch && request.method === 'DELETE') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const identifier = decodeURIComponent(productIdentifierMatch[1]);
          const products = db.collection('products');
          let result = await products.findOneAndDelete({ slug: identifier });
          if (!result) {
            const id = toObjectId(identifier);
            if (id) result = await products.findOneAndDelete({ _id: id });
          }
          if (!result) {
            return jsonResponse(
              { success: false, message: 'Product not found.' },
              { status: 404 },
              request,
              env
            );
          }

          return jsonResponse(
            { success: true, message: 'Product deleted successfully.' },
            {},
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to delete product.', request, env);
      }
    }

    if (url.pathname === '/api/frontpage' && request.method === 'GET') {
      try {
        return await withMongo(env, async (db) => {
          const settings = await getFrontpageSettings(db);
          return jsonResponse({ success: true, frontpage: serializeFrontpage(settings) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to load frontpage settings.', request, env);
      }
    }

    if (url.pathname === '/api/frontpage' && request.method === 'PUT') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const settings = await getFrontpageSettings(db);
          const body = await request.json().catch(() => ({}));
          const set = { updatedAt: new Date() };

          if (body.hero && typeof body.hero.text === 'string') {
            set['hero.text'] = body.hero.text;
          }
          if (body.featuredCollections) {
            const fc = body.featuredCollections;
            if (typeof fc.heading === 'string') set['featuredCollections.heading'] = fc.heading;
            if (typeof fc.body === 'string') set['featuredCollections.body'] = fc.body;
            if (typeof fc.ctaText === 'string') set['featuredCollections.ctaText'] = fc.ctaText;
            if (Array.isArray(fc.images)) set['featuredCollections.images'] = fc.images;
          }
          if (body.newArrivals && typeof body.newArrivals.title === 'string') {
            set['newArrivals.title'] = body.newArrivals.title;
          }
          if (body.lookbook && Array.isArray(body.lookbook.images)) {
            set['lookbook.images'] = body.lookbook.images;
          }

          const result = await db.collection('frontpages').findOneAndUpdate(
            { _id: settings._id },
            { $set: set },
            { returnDocument: 'after' }
          );

          return jsonResponse({ success: true, frontpage: serializeFrontpage(result) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to update frontpage settings.', request, env);
      }
    }

    if (url.pathname === '/api/menu' && request.method === 'GET') {
      try {
        return await withMongo(env, async (db) => {
          const categories = await db.collection('menucategories').find().sort({ order: 1 }).toArray();
          return jsonResponse(
            { success: true, menu: categories.map(serializeCategory) },
            {},
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to load menu.', request, env);
      }
    }

    if (url.pathname === '/api/menu' && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const body = await request.json().catch(() => ({}));
          const label = typeof body.label === 'string' ? body.label.trim() : '';
          if (!label) {
            return jsonResponse(
              { success: false, errors: ['Category label is required'] },
              { status: 400 },
              request,
              env
            );
          }

          const children = Array.isArray(body.children)
            ? body.children.map((child) => ({
                _id: new ObjectId(),
                label: typeof child?.label === 'string' ? child.label : '',
                href: typeof child?.href === 'string' && child.href ? child.href : '#',
              }))
            : [];

          const menu = db.collection('menucategories');
          const lastCategory = await menu.find().sort({ order: -1 }).limit(1).next();
          const order = lastCategory ? lastCategory.order + 1 : 0;
          const now = new Date();
          const doc = { label, order, children, createdAt: now, updatedAt: now };
          const { insertedId } = await menu.insertOne(doc);

          return jsonResponse(
            { success: true, category: serializeCategory({ ...doc, _id: insertedId }) },
            { status: 201 },
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to create category.', request, env);
      }
    }

    if (menuIdMatch && request.method === 'PUT') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const categoryId = toObjectId(menuIdMatch[1]);
          if (!categoryId) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const body = await request.json().catch(() => ({}));
          const set = { updatedAt: new Date() };
          if (typeof body.label === 'string') set.label = body.label;
          if (typeof body.order === 'number') set.order = body.order;
          if (Array.isArray(body.children)) {
            set.children = body.children.map((child) => ({
              _id: (child?.id && toObjectId(child.id)) || new ObjectId(),
              label: typeof child?.label === 'string' ? child.label : '',
              href: typeof child?.href === 'string' && child.href ? child.href : '#',
            }));
          }

          const result = await db.collection('menucategories').findOneAndUpdate(
            { _id: categoryId },
            { $set: set },
            { returnDocument: 'after' }
          );

          if (!result) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          return jsonResponse({ success: true, category: serializeCategory(result) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to update category.', request, env);
      }
    }

    if (menuIdMatch && request.method === 'DELETE') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const categoryId = toObjectId(menuIdMatch[1]);
          if (!categoryId) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const result = await db.collection('menucategories').findOneAndDelete({ _id: categoryId });
          if (!result) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          return jsonResponse(
            { success: true, message: 'Category deleted successfully.' },
            {},
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to delete category.', request, env);
      }
    }

    if (menuItemsMatch && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const categoryId = toObjectId(menuItemsMatch[1]);
          if (!categoryId) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const body = await request.json().catch(() => ({}));
          const label = typeof body.label === 'string' ? body.label.trim() : '';
          if (!label) {
            return jsonResponse(
              { success: false, errors: ['Item label is required'] },
              { status: 400 },
              request,
              env
            );
          }
          const href = typeof body.href === 'string' && body.href ? body.href : '#';

          const newItem = { _id: new ObjectId(), label, href };
          const result = await db.collection('menucategories').findOneAndUpdate(
            { _id: categoryId },
            { $push: { children: newItem }, $set: { updatedAt: new Date() } },
            { returnDocument: 'after' }
          );

          if (!result) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          return jsonResponse(
            { success: true, category: serializeCategory(result) },
            { status: 201 },
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to add menu item.', request, env);
      }
    }

    if (menuItemIdMatch && request.method === 'PUT') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const categoryId = toObjectId(menuItemIdMatch[1]);
          const itemId = toObjectId(menuItemIdMatch[2]);
          if (!categoryId || !itemId) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const menu = db.collection('menucategories');
          const category = await menu.findOne({ _id: categoryId });
          if (!category) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }
          if (!(category.children || []).some((child) => child._id.equals(itemId))) {
            return jsonResponse(
              { success: false, message: 'Menu item not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const body = await request.json().catch(() => ({}));
          const set = { updatedAt: new Date() };
          if (typeof body.label === 'string') set['children.$[item].label'] = body.label;
          if (typeof body.href === 'string') set['children.$[item].href'] = body.href;

          const result = await menu.findOneAndUpdate(
            { _id: categoryId },
            { $set: set },
            { arrayFilters: [{ 'item._id': itemId }], returnDocument: 'after' }
          );

          return jsonResponse({ success: true, category: serializeCategory(result) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to update menu item.', request, env);
      }
    }

    if (menuItemIdMatch && request.method === 'DELETE') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const categoryId = toObjectId(menuItemIdMatch[1]);
          const itemId = toObjectId(menuItemIdMatch[2]);
          if (!categoryId || !itemId) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const menu = db.collection('menucategories');
          const category = await menu.findOne({ _id: categoryId });
          if (!category) {
            return jsonResponse(
              { success: false, message: 'Category not found.' },
              { status: 404 },
              request,
              env
            );
          }
          if (!(category.children || []).some((child) => child._id.equals(itemId))) {
            return jsonResponse(
              { success: false, message: 'Menu item not found.' },
              { status: 404 },
              request,
              env
            );
          }

          const result = await menu.findOneAndUpdate(
            { _id: categoryId },
            { $pull: { children: { _id: itemId } }, $set: { updatedAt: new Date() } },
            { returnDocument: 'after' }
          );

          return jsonResponse({ success: true, category: serializeCategory(result) }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to remove menu item.', request, env);
      }
    }

    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

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
        });
      } catch (error) {
        return errorResponse(error, 'Upload failed.', request, env);
      }
    }

    if (url.pathname === '/api/upload/presign' && request.method === 'POST') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const body = await request.json().catch(() => ({}));
          const filename = typeof body.filename === 'string' ? body.filename : '';
          const contentType = typeof body.contentType === 'string' ? body.contentType : '';

          const errors = [];
          if (!filename) errors.push('Filename is required');
          if (!UPLOAD_CONTENT_TYPE_RE.test(contentType)) {
            errors.push('Content type must be a valid image type (jpeg, png, webp, gif, svg, avif)');
          }
          if (errors.length) {
            return jsonResponse({ success: false, errors }, { status: 400 }, request, env);
          }

          if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
            return jsonResponse(
              { success: false, message: 'R2 credentials are not configured on the Worker.' },
              { status: 500 },
              request,
              env
            );
          }

          const sanitizedName = filename.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
          const uniqueId = crypto.randomUUID();
          const key = `products/${Date.now()}-${uniqueId}-${sanitizedName}`;

          const uploadUrl = await presignR2PutUrl({
            accountId: env.R2_ACCOUNT_ID,
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            bucket: env.R2_BUCKET_NAME,
            key,
            contentType,
            expiresIn: 600,
          });

          const publicUrl = `${env.R2_PUBLIC_URL || 'https://assets.sixthsin.com'}/${key}`;

          return jsonResponse({ success: true, uploadUrl, publicUrl, key }, {}, request, env);
        });
      } catch (error) {
        return errorResponse(error, 'Failed to create upload URL.', request, env);
      }
    }

    if (uploadKeyMatch && request.method === 'DELETE') {
      try {
        return await withMongo(env, async (db) => {
          const authResult = await requireAdmin(request, env, db);
          if (authResult.error) return authErrorResponse(authResult, request, env);

          const bucket = env.ASSETS || env.R2_BUCKET;
          if (!bucket) {
            return jsonResponse(
              { success: false, message: 'R2 bucket binding is not configured.' },
              { status: 500 },
              request,
              env
            );
          }

          const key = decodeURIComponent(uploadKeyMatch[1]);
          await bucket.delete(key);

          return jsonResponse(
            { success: true, message: 'File deleted successfully.' },
            {},
            request,
            env
          );
        });
      } catch (error) {
        return errorResponse(error, 'Failed to delete file.', request, env);
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
