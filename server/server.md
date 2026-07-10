# Server — 6th SIN API

> Backend API for the **6th SIN** fashion brand admin panel.
> Serves the storefront data (products, frontpage, menu) and admin authentication.
> Lives in the `server/` subdirectory of the project.

> Package metadata: `name: "6thsin-server"`, `version: "1.0.0"`,
> `"description": "Backend API for 6th SIN fashion brand admin panel"`.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start](#quick-start)
3. [NPM Scripts](#npm-scripts)
4. [Environment Files](#environment-files)
5. [Docker (MongoDB)](#docker-mongodb)
6. [Project Structure](#project-structure)
7. [Application Bootstrap](#application-bootstrap)
8. [API Reference](#api-reference)
   - [Health](#health)
   - [Auth](#auth)
   - [Products](#products)
   - [Frontpage](#frontpage)
   - [Menu](#menu)
   - [Upload](#upload)
9. [Middleware](#middleware)
10. [Models](#models)
11. [Database (MongoDB)](#database-mongodb)
12. [Storage (Cloudflare R2)](#storage-cloudflare-r2)
13. [Seed Script](#seed-script)
14. [Response Format](#response-format)
15. [Commands Reference](#commands-reference)

---

## Tech Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express `4.21` |
| Database | MongoDB via Mongoose `8.9` |
| Auth | JWT (`jsonwebtoken` `9.0`) |
| Password hashing | bcryptjs `2.4` |
| Validation | express-validator `7.2` |
| CORS | cors `2.8` |
| Env config | dotenv `16.4` |
| Object storage | Cloudflare R2 (S3-compatible) via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` |

---

## Quick Start

```bash
# from server/ directory
npm install

# 1. Make sure MongoDB is running (local or via Docker Compose):
docker compose up -d        # starts a local MongoDB on :27017

# 2. Copy env file and fill in real values:
cp .env.example .env        # (Windows: copy .env.example .env)

# 3. Seed the database with default data + admin user:
npm run seed

# 4. Start the API server:
npm run dev                 # or: npm start
```

The API then runs at **http://localhost:5000** and is consumed by the frontend
admin panel at `http://localhost:5000/api` (see `frontend.md`).

---

## NPM Scripts

Defined in `server/package.json`:

| Script | Command | Description |
|---|---|---|
| `start` | `node src/index.js` | Run the production server |
| `dev` | `node --watch src/index.js` | Run with auto-restart on file changes (Node's built-in `--watch`) |
| `seed` | `node src/scripts/seed.js` | Seed DB with admin user, frontpage settings, menu categories, and 8 products |

> There is **no TypeScript, no lint, no build step** on the server — it is plain
> CommonJS JavaScript.

---

## Environment Files

The server reads environment variables via `dotenv` in `src/index.js`
(`require('dotenv').config()`). Values are loaded **before** the app boots.

### Files present

```
server/
├── .env             # actual local config (gitignored, has placeholder/dev values)
├── .env.example     # template — copy this to .env and fill in real values
└── .gitignore       # ignores node_modules/ and .env
```

> ⚠️ `server/.gitignore` ignores both `node_modules/` and `.env`, so the real
> `.env` is **never** committed. Only `.env.example` is tracked.

### `.env.example` (template)

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/6thsin

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=6thsin-assets
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# Auth
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Current local `.env` (DO NOT COMMIT — dev/placeholder values)

```env
# MongoDB
MONGODB_URI=mongodb://root:password123@localhost:27017/6thsin?authSource=admin

# Cloudflare R2
R2_ACCOUNT_ID=placeholder_r2_account_id
R2_ACCESS_KEY_ID=placeholder_r2_access_key
R2_SECRET_ACCESS_KEY=placeholder_r2_secret_key
R2_BUCKET_NAME=6thsin-assets
R2_PUBLIC_URL=https://placeholder-r2-public-url.dev

# Auth
JWT_SECRET=super_secret_dev_key_for_6thsin
JWT_EXPIRES_IN=7d

# Server
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Environment variables reference

| Variable | Required | Default | Used in | Description |
|---|---|---|---|---|
| `MONGODB_URI` | Yes | — | `src/config/db.js` | MongoDB connection string. Local dev: `mongodb://root:password123@localhost:27017/6thsin?authSource=admin` (matches `docker-compose.yml`). |
| `R2_ACCOUNT_ID` | Yes¹ | — | `src/config/r2.js` | Cloudflare R2 account ID. Endpoint is built as `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. |
| `R2_ACCESS_KEY_ID` | Yes¹ | — | `src/config/r2.js` | R2 access key (S3 credential). |
| `R2_SECRET_ACCESS_KEY` | Yes¹ | — | `src/config/r2.js` | R2 secret key (S3 credential). |
| `R2_BUCKET_NAME` | Yes¹ | `6thsin-assets` (in example) | `src/routes/upload.js` | R2 bucket name. |
| `R2_PUBLIC_URL` | Yes¹ | — | `src/routes/upload.js` | Public base URL of the R2 bucket (where uploaded files are served). |
| `JWT_SECRET` | Yes | — | `src/routes/auth.js`, `src/middleware/auth.js` | Secret used to sign/verify JWTs. **Must be changed for production.** |
| `JWT_EXPIRES_IN` | No | `7d` | `src/routes/auth.js` | JWT lifetime. Falls back to `7d` if unset. |
| `PORT` | No | `5000` | `src/index.js` | HTTP port the Express server listens on. |
| `FRONTEND_URL` | No | `http://localhost:5173` | `src/index.js` | Allowed origin for CORS. The frontend dev server actually runs on `:3000` (see `frontend.md`), so this may need updating to `http://localhost:3000` for local dev. |

¹ Required only if you intend to use the image-upload feature. The rest of the
API works with placeholders present (the R2 routes simply won't be able to
talk to a real bucket).

> **CORS note**: `src/index.js` enables `cors({ origin: FRONTEND_URL, credentials: true })`.
> The frontend (per `frontend.md`) runs on **port 3000** in dev, but the env
> default is `5173`. Update `FRONTEND_URL` to `http://localhost:3000` if you
> want the admin panel to be allowed through CORS during local development.

---

## Docker (MongoDB)

`server/docker-compose.yml` spins up a local MongoDB for development:

```yaml
services:
  sin-db:
    image: mongo:latest
    container_name: sin-db
    restart: always
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

This matches the local `MONGODB_URI` in `.env`:
`mongodb://root:password123@localhost:27017/6thsin?authSource=admin`.

```bash
# Start MongoDB
docker compose up -d

# Stop it
docker compose down

# Wipe the volume (full reset)
docker compose down -v
```

---

## Project Structure

```
server/
├── package.json              Dependencies + scripts
├── .env                       Local env (gitignored)
├── .env.example               Env template (committed)
├── .gitignore                 Ignores node_modules/ + .env
├── docker-compose.yml         Local MongoDB (mongo:latest, root/password123)
└── src/
    ├── index.js               App entry — Express setup, middleware, routes, start
    ├── config/
    │   ├── db.js              Mongoose connection helper (connectDB)
    │   └── r2.js              Cloudflare R2 S3Client (S3-compatible)
    ├── middleware/
    │   ├── auth.js            JWT Bearer auth → attaches req.admin
    │   └── errorHandler.js    Global error handler (validation, dup-key, cast, 500)
    ├── models/
    │   ├── Admin.js           Admin user (bcrypt-hashed password, JWT)
    │   ├── Product.js         Product (slug auto-gen, full catalog fields)
    │   ├── Frontpage.js       Singleton frontpage settings
    │   └── Menu.js            MenuCategory (with nested MenuItem subdocs)
    ├── routes/
    │   ├── auth.js            /api/auth   — login, me
    │   ├── products.js        /api/products — CRUD + filters
    │   ├── frontpage.js       /api/frontpage — get/update singleton
    │   ├── menu.js            /api/menu — categories + nested items CRUD
    │   └── upload.js          /api/upload — R2 presigned URLs + delete
    └── scripts/
        └── seed.js            npm run seed — seeds admin + frontpage + menu + 8 products
```

---

## Application Bootstrap

`src/index.js`:

1. Loads `.env` via `dotenv`.
2. Creates the Express app.
3. Reads `PORT` (default `5000`).
4. Registers middleware:
   - `cors({ origin: FRONTEND_URL || http://localhost:5173, credentials: true })`
   - `express.json({ limit: '10mb' })` (10 MB body limit — needed for base64 product images)
5. Mounts routes under `/api/*`.
6. Registers a 404 fallback.
7. Registers the global error handler.
8. `start()` async: connects to MongoDB (`connectDB()`) then `app.listen(PORT)`.

Healthcheck endpoint:

```http
GET /api/health
→ { success: true, message: "6th SIN API is running", timestamp: <ISO> }
```

---

## API Reference

Base URL: `http://localhost:5000/api`

All responses are JSON with a `success: boolean` field (see
[Response Format](#response-format)).

### Conventions

- Product routes use the **slug** as the identifier (not `_id`), matching the
  frontend `Product.id` virtual.
- Write routes (POST/PUT/DELETE) require a `Authorization: Bearer <jwt>` header.
- Validation errors come from `express-validator` and return `400` with
  `{ success: false, errors: [...] }`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Liveness check |

---

### Auth

Mounted at `/api/auth` (`src/routes/auth.js`).

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | `{ email, password }` | Validate credentials, return `{ token, admin: { id, email, name } }`. JWT signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN` (default `7d`). |
| GET | `/api/auth/me` | Yes | — | Returns the authenticated admin from `req.admin`. |

Login validation: `email` must be a valid email, `password` non-empty.

---

### Products

Mounted at `/api/products` (`src/routes/products.js`). Products are identified
by their **slug**.

| Method | Path | Auth | Query / Body | Description |
|---|---|---|---|---|
| GET | `/api/products` | No | `?category=`, `?published=true\|false`, `?search=` | List products, sorted by `createdAt` desc. `category` is uppercased; `search` is a case-insensitive regex on `name`. |
| GET | `/api/products/:slug` | No | — | Get a single product by slug. |
| POST | `/api/products` | Yes | Product body | Create a product. Validates `name`, `price`, `description`, and `category` ∈ `MENSWEAR \| WOMENSWEAR \| ACCESSORIES \| ACTIVEWEAR \| HOME`. Slug auto-generated from `name`. |
| PUT | `/api/products/:slug` | Yes | Partial product | Update allowed fields only (see below). |
| DELETE | `/api/products/:slug` | Yes | — | Delete a product. |

**Allowed update fields** (PUT): `name, price, description, images, category,
subcategory, color, colors, sizes, material, careInstructions, fit,
articleNumber, supplierInfo, countryOfProduction, isPublished`.

**Example — create**:
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Oversized Logo Hoodie",
  "price": "£89.00",
  "description": "...",
  "category": "MENSWEAR",
  "sizes": ["S", "M", "L"],
  "images": ["https://.../product-1.jpg"]
}
→ 201 { success: true, product: { ... } }
```

---

### Frontpage

Mounted at `/api/frontpage` (`src/routes/frontpage.js`). A **singleton** document
pattern — there is only ever one frontpage settings record (auto-created with
defaults if missing via `Frontpage.getSettings()`).

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/frontpage` | No | — | Get (or auto-create) the singleton frontpage settings. Returns `{ hero, featuredCollections, newArrivals }`. |
| PUT | `/api/frontpage` | Yes | Partial `{ hero, featuredCollections, newArrivals }` | Update any subset of the fields. |

Supports partial/nested updates:
- `hero.text`
- `featuredCollections.heading`, `.body`, `.ctaText`
- `newArrivals.title`

---

### Menu

Mounted at `/api/menu` (`src/routes/menu.js`). Models a two-level navigation:
**categories** containing **items (children)**. Categories have an `order` for
sorting; items have `label` + `href`.

#### Categories

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/api/menu` | No | — | List all categories sorted by `order` ascending. |
| POST | `/api/menu` | Yes | `{ label, children?: [{ label, href }] }` | Add a category. `order` is auto-set to last+1. |
| PUT | `/api/menu/:id` | Yes | Partial `{ label?, order?, children? }` | Update a category. |
| DELETE | `/api/menu/:id` | Yes | — | Delete a category (and its items). |

#### Items (children of a category)

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/menu/:id/items` | Yes | `{ label, href? }` | Add an item to category `:id`. `href` defaults to `#`. |
| PUT | `/api/menu/:id/items/:itemId` | Yes | Partial `{ label?, href? }` | Update an item. |
| DELETE | `/api/menu/:id/items/:itemId` | Yes | — | Remove an item. |

Item validation: `label` is required (non-empty).

---

### Upload

Mounted at `/api/upload` (`src/routes/upload.js`). Handles direct browser-to-R2
uploads via **presigned PUT URLs**, plus R2 deletions. All routes require auth.

| Method | Path | Auth | Body / Param | Description |
|---|---|---|---|---|
| POST | `/api/upload/presign` | Yes | `{ filename, contentType }` | Generate a presigned PUT URL (valid 10 min) for direct upload. Returns `{ uploadUrl, publicUrl, key }`. The object key is `products/<timestamp>-<uuid>-<sanitized-name>`. `contentType` must match `image/(jpeg\|png\|webp\|gif\|svg+xml\|avif)`. |
| DELETE | `/api/upload/:key(*)` | Yes | `:key` = object key (URL-encoded if it has slashes) | Delete an object from the R2 bucket. |

**Example — presign**:
```http
POST /api/upload/presign
Authorization: Bearer <token>
Content-Type: application/json

{ "filename": "hoodie-front.jpg", "contentType": "image/jpeg" }
→ 200 {
    success: true,
    uploadUrl: "https://<account>.r2.cloudflarestorage.com/6thsin-assets/products/...-hoodie-front.jpg?X-Amz-...",
    publicUrl: "https://<R2_PUBLIC_URL>/products/...-hoodie-front.jpg",
    key: "products/...-hoodie-front.jpg"
  }
```
The browser then does a `PUT` directly to `uploadUrl` with the file bytes.

---

## Middleware

### `src/middleware/auth.js` — JWT auth

- Reads `Authorization: Bearer <token>` header.
- Verifies the JWT with `JWT_SECRET`.
- Loads the `Admin` by `decoded.id` and attaches it to `req.admin`.
- Returns `401` for: missing header, invalid token (`JsonWebTokenError`), expired
  token (`TokenExpiredError`), or admin-not-found.

Used by all write routes: products POST/PUT/DELETE, frontpage PUT, menu write
routes, upload routes.

### `src/middleware/errorHandler.js` — global error handler

Connected as the final middleware. Translates common errors into consistent
JSON:

| Error | Status | Behavior |
|---|---|---|
| Mongoose `ValidationError` | 400 | `{ success:false, message:"Validation error", errors:[...] }` |
| Duplicate key (code 11000) | 409 | `{ success:false, message:"A record with this <field> already exists." }` |
| `CastError` | 400 | `{ success:false, message:"Invalid <path>: <value>" }` |
| Other | `err.statusCode` or 500 | `{ success:false, message: err.message \| "Internal server error" }` |

---

## Models

### `Admin` — `src/models/Admin.js`

| Field | Type | Notes |
|---|---|---|
| `email` | String | required, unique, lowercase, trimmed |
| `password` | String | required, min 6, `select: false` (excluded by default) |
| `name` | String | default `"Admin"` |

- **bcryptjs** hashing: `pre('save')` hashes the password (cost factor 12) if it
  has been modified.
- `comparePassword(candidate)` → `bcrypt.compare`.
- `toJSON` transform strips `password` and `__v`, maps `_id` → `id`.

### `Product` — `src/models/Product.js`

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, trimmed |
| `slug` | String | unique, indexed; auto-generated from `name` |
| `price` | String | required (stored as string, e.g. "£89.00") |
| `description` | String | required |
| `images` | [String] | default `[]` (URLs to R2 or local images) |
| `category` | String | required; enum: `MENSWEAR \| WOMENSWEAR \| ACCESSORIES \| ACTIVEWEAR \| HOME`; indexed |
| `subcategory` | String | default `""` |
| `color` | String | default `""` (the primary color name) |
| `colors` | `[{ name, hex }]` | available color variants |
| `sizes` | [String] | default `[]` |
| `material` | String | default `""` |
| `careInstructions` | [String] | default `[]` |
| `fit` | String | default `""` |
| `articleNumber` | String | default `""` |
| `supplierInfo` | String | default `""` |
| `countryOfProduction` | String | default `""` |
| `isPublished` | Boolean | default `true` |

- `timestamps: true` → adds `createdAt`, `updatedAt`.
- **Slug generation** (`pre('validate')`): lowercases `name`, replaces non
  `a-z0-9` runs with `-`, trims leading/trailing dashes. Regenerated when `name`
  changes or `slug` is missing.
- **Virtual `id`** → equals the `slug` (so the frontend's `id` concept maps to
  the slug, matching `/api/products/:slug` and the frontend `/product/:id` route).
- `toJSON` includes virtuals, strips `_id` and `__v`.

### `Frontpage` — `src/models/Frontpage.js`

Singleton settings document (there should only ever be one).

| Field | Default |
|---|---|
| `hero.text` | `"BECOME A PART OF THE WORLD"` |
| `featuredCollections.heading` | `"REDEFINING THE BOUNDARIES OF STYLE"` |
| `featuredCollections.body` | `"Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours."` |
| `featuredCollections.ctaText` | `"EXPLORE THE COLLECTION"` |
| `newArrivals.title` | `"NEW ARRIVALS"` |

- `statics.getSettings()`: returns the first document or creates one with
  defaults if none exists.
- `toJSON` strips `_id` and `__v`.

### `Menu` (`MenuCategory`) — `src/models/Menu.js`

Two-level model: a `MenuCategory` has nested `MenuItem` subdocuments.

**`MenuItem` subdoc**: `{ label (required, trimmed), href (default "#") }`

**`MenuCategory`**:

| Field | Type | Notes |
|---|---|---|
| `label` | String | required, trimmed |
| `order` | Number | default `0`; used for sort order |
| `children` | [MenuItem] | default `[]` |

- `timestamps: true`.
- `toJSON` maps `_id` → `id` (and each child `_id` → `id`), strips `__v`.

---

## Database (MongoDB)

- Connection helper: `src/config/db.js` → `connectDB()`.
- `mongoose.connect(process.env.MONGODB_URI)` then logs success or exits (`1`).
- Called from `src/index.js` before `app.listen`.

### Local dev

Run via `docker compose up -d` (uses `server/docker-compose.yml`):

- Image: `mongo:latest`
- Container: `sin-db`
- Port: `27017:27017`
- Root user: `root` / `password123`
- Persisted to the `mongodb_data` Docker volume.

URI: `mongodb://root:password123@localhost:27017/6thsin?authSource=admin`

### Production

Use a hosted MongoDB (e.g. MongoDB Atlas). Set `MONGODB_URI` in `.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/6thsin
```

---

## Storage (Cloudflare R2)

`src/config/r2.js` builds an AWS S3 SDK `S3Client` pointed at Cloudflare R2
(S3-compatible):

```js
new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

Used by `src/routes/upload.js` for:
- **Presigned PUT URLs** via `@aws-sdk/s3-request-presigner`'s `getSignedUrl`
  (10-minute expiry) so the browser uploads directly to R2.
- **Deletes** via `DeleteObjectCommand`.

The bucket name comes from `R2_BUCKET_NAME`; the public URL returned to clients
is `${R2_PUBLIC_URL}/${key}`. Uploaded product images are keyed under the
`products/` prefix.

---

## Seed Script

`src/scripts/seed.js` — run with `npm run seed`.

Creates (idempotent — skips if data already exists):

1. **Admin user** — `admin@6thsin.com` / `admin123` (name: `"Admin"`).
   - ⚠️ **Change this password after first login** (the script prints a warning).
2. **Frontpage settings** — default singleton (hero/featured/new arrivals copy).
3. **Menu categories** — 6 top-level categories with children:
   - `MENSWEAR` (New Arrivals, Hoodies, T-Shirts, Jackets, Trousers)
   - `WOMENSWEAR` (New Arrivals, Tops, Trousers, Dresses, Jackets)
   - `HOME` (Fragrance, Decor)
   - `ACCESSORIES` (Bags, Shoes)
   - `ACTIVEWEAR` (Tops, Bottoms)
   - `LOOKBOOK` (SS25 Collection, AW24 Archive)
4. **Products** — 8 default products (Oversized Logo Hoodie, Structured Blazer,
   Wide-Leg Trousers, Technical Fitted Top, Essential Oversized Tee, Distressed
   Denim Jacket, Structured Tote Bag, High-Top Sneakers). Each has full catalog
   fields (colors, sizes, material, care, fit, article number, country).

The script exits `0` on success or `1` on failure.

---

## Response Format

All routes return JSON with this envelope shape:

**Success** (any 2xx):
```json
{ "success": true, ...payload }
```
e.g. products list → `{ success, count, products }`; single product →
`{ success, product }`.

**Error** (4xx/5xx):
```json
{ "success": false, "message": "...", "errors"?: [...] }
```

The global `errorHandler` centralizes Mongoose validation / duplicate-key /
cast errors and fallback 500s into this shape (see [Middleware](#middleware)).

A **404 fallback** in `src/index.js` returns:
```json
{ "success": false, "message": "Route not found: <METHOD> <URL>" }
```

---

## Commands Reference

```bash
# --- from server/ ---

# Install dependencies
npm install

# Run local MongoDB (port 27017, root/password123)
docker compose up -d

# Seed database (admin + frontpage + menu + 8 products)
npm run seed

# Start dev server (auto-reload on change)
npm run dev

# Start production server
npm start

# Health check
curl http://localhost:5000/api/health
```

### Typical fresh setup

```bash
cd server
cp .env.example .env          # then edit MONGODB_URI / JWT_SECRET / R2_* as needed
npm install
docker compose up -d         # local MongoDB
npm run seed                 # create admin@6thsin.com / admin123 + default data
npm run dev                  # API on http://localhost:5000
```

Then start the frontend (from the project root):
```bash
npm run dev                  # storefront on http://localhost:3000
```
