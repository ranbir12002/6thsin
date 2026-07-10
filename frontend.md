# Frontend — 6th SIN

> The customer-facing storefront + admin panel for the **6th SIN** fashion brand.
> Single-page application built with **React 19 + Vite 7 + TypeScript**.

This frontend lives at the **project root** (`app/`) — the server backend lives in
the `server/` subdirectory (see `server.md`).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start](#quick-start)
3. [NPM Scripts](#npm-scripts)
4. [Project Structure](#project-structure)
5. [Routing](#routing)
6. [Public Storefront](#public-storefront)
7. [Admin Panel](#admin-panel)
8. [State Management](#state-management)
9. [Styling System](#styling-system)
10. [Animation & Smooth Scroll](#animation--smooth-scroll)
11. [Path Aliases](#path-aliases)
12. [Environment Files](#environment-files)
13. [Public Assets](#public-assets)
14. [Type Definitions](#type-definitions)
15. [Commands Reference](#commands-reference)

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React `19.2` |
| Build tool | Vite `7.2` |
| Language | TypeScript `~5.9` |
| Routing | react-router `7.6` |
| Styling | Tailwind CSS `3.4.19` + `tailwindcss-animate` |
| UI primitives | Radix UI (36+ components) + shadcn/ui (`new-york` style) |
| Icons | lucide-react |
| Animation | GSAP `3.15` + `@gsap/react` |
| Smooth scroll | Lenis `1.3` |
| 3D | three `0.184` (available, used for visual effects) |
| Image loading | imagesloaded |
| Forms | react-hook-form `7.70` + zod `4.3` + `@hookform/resolvers` |
| Carousels | embla-carousel-react |
| Charts | recharts |
| Toasts | sonner |
| Drawers | vaul |
| Date utils | date-fns `4.1` |
| Themes | next-themes |
| Linting | ESLint `9` + eslint-plugin-react-hooks + react-refresh |

> Node.js 20 is the recommended runtime (see `info.md`).

---

## Quick Start

```bash
# from the project root (app/)
npm install        # install frontend dependencies
npm run dev        # start Vite dev server → http://localhost:3000
```

The dev server runs on **port 3000** (configured in `vite.config.ts`).

> The admin panel talks to the backend API at `http://localhost:5000/api`
> (hardcoded in `src/admin/store/SiteDataContext.tsx`). Make sure the
> backend is running first — see `server.md`.

---

## NPM Scripts

Defined in `package.json`:

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start the Vite dev server with HMR (port 3000) |
| `build` | `tsc -b && vite build` | Type-check, then build to `dist/` |
| `lint` | `eslint .` | Run ESLint across the project |
| `preview` | `vite preview` | Preview the production build locally |

---

## Project Structure

```
app/                          (frontend root)
├── index.html                Entry HTML
├── vite.config.ts            Vite config (base: './', port 3000, @ alias)
├── tsconfig.json             TS project references + path aliases
├── tsconfig.app.json         App-level TS settings
├── tsconfig.node.json        Node/Vite-config TS settings
├── tailwind.config.cjs        Tailwind theme (brand colors, fonts, animations)
├── postcss.config.js         PostCSS config
├── eslint.config.js          ESLint flat config
├── components.json           shadcn/ui CLI config (style: new-york)
├── package.json              Frontend dependencies + scripts
├── info.md                   Setup notes (Node 20, component list)
├── README.md                 Default Vite template readme
├── public/
│   ├── 6thsinlogo.png        Brand logo (used by Header + loading screen)
│   ├── images/               Category, collection, lookbook + product images
│   └── videos/
│       └── hero-campaign-film.mp4   Hero background video
├── src/
│   ├── main.tsx              Entry point — wraps <App/> in <BrowserRouter>
│   ├── App.tsx               Root component — routing, Lenis, loading screen
│   ├── index.css             Global styles (Tailwind directives + CSS vars)
│   ├── App.css               (legacy) section-specific styles
│   ├── components/
│   │   └── ui/               56 shadcn/ui Radix-based components
│   ├── sections/             Public storefront page sections
│   │   ├── Header.tsx        Fixed nav + fullscreen GSAP animated menu
│   │   ├── Hero.tsx          Hero section (uses campaign film video)
│   │   ├── CategorySlider.tsx
│   │   ├── FeaturedCollections.tsx
│   │   ├── NewArrivals.tsx
│   │   ├── Lookbook.tsx
│   │   └── Footer.tsx
│   ├── pages/                Public route-level pages
│   │   ├── Home.tsx          (placeholder — actual home is the section combo)
│   │   └── ProductDetail.tsx Single product page (/product/:id)
│   ├── admin/                Admin panel
│   │   ├── AdminLayout.tsx   Auth-gated layout with sidebar (renders <Login/> if no token)
│   │   ├── AdminSidebar.tsx  Nav links: Dashboard, Frontpage, Menu, Products, Add Product
│   │   ├── pages/
│   │   │   ├── Login.tsx          Email/password login → POST /api/auth/login
│   │   │   ├── Dashboard.tsx     Stats overview (product count, categories, hero text)
│   │   │   ├── ProductsList.tsx   List + delete products
│   │   │   ├── ProductForm.tsx    Create/edit product (new + :id/edit)
│   │   │   ├── FrontpageEditor.tsx Edit hero/featured/new arrivals copy
│   │   │   └── MenuEditor.tsx     Manage nav categories + menu items
│   │   ├── store/
│   │   │   └── SiteDataContext.tsx  React Context: API client + auth + cache
│   │   └── types/
│   │       ├── frontpage.ts   FrontpageSettings interface
│   │       └── menu.ts        MenuItem + NavMenuCategory interfaces
│   ├── data/
│   │   └── products.ts       8 hardcoded fallback products (offline seed)
│   ├── hooks/
│   │   └── use-mobile.ts     Mobile detection hook (shadcn)
│   ├── lib/
│   │   └── utils.ts          cn() className merge helper (clsx + tailwind-merge)
│   └── types/
│       └── product.ts        Product interface (shared storefront + admin)
└── dist/                     (generated) production build output
```

---

## Routing

All routing is handled by `react-router@7` inside `src/App.tsx`. The app uses
a **single `<BrowserRouter>`** (set up in `src/main.tsx`) and branches between
the public storefront and the admin panel based on the current path.

### Public storefront routes

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` (combo of sections) | Hero → CategorySlider → FeaturedCollections → NewArrivals → Lookbook → Footer |
| `/product/:id` | `ProductDetail` | Single product detail page (`:id` is the product **slug**) |

### Admin panel routes

The admin area is mounted when `location.pathname` starts with `/admin`. It is
**auth-gated**: if no JWT token is present, `AdminLayout` renders `<Login/>`
instead of the sidebar layout.

| Path | Component | Description |
|---|---|---|
| `/admin` | `Dashboard` | Overview stats (index route) |
| `/admin/frontpage` | `FrontpageEditor` | Edit frontpage hero/featured/new arrivals copy |
| `/admin/menu` | `MenuEditor` | Manage nav categories + items |
| `/admin/products` | `ProductsList` | Product list + delete |
| `/admin/products/new` | `ProductForm` | Create new product |
| `/admin/products/:id/edit` | `ProductForm` | Edit product (`:id` = slug) |

Admin routes are nested under `<Route path="/admin" element={<AdminLayout/>}>`
which provides the sidebar `Outlet`.

---

## Public Storefront

The storefront is a cinematic, dark-themed, animated single-page experience.

- **Loading screen** — On first visit to `/`, a full-screen black overlay with the
  6th SIN logo fades out after 1.5s (GSAP tween) in `App.tsx`.
- **Header** (`sections/Header.tsx`) — Fixed top bar with logo, hamburger menu,
  SEARCH and BAG (0). Opens a full-screen GSAP-animated overlay menu that pulls
  categories in from the left; clicking a category reveals its submenu (children)
  on the right (desktop) or inline below (mobile). The menu is driven by the
  `navMenu` data from `SiteDataContext`.
- **Hero** (`sections/Hero.tsx`) — Uses `public/videos/hero-campaign-film.mp4`.
- **CategorySlider** / **FeaturedCollections** / **NewArrivals** / **Lookbook** —
  ScrollTrigger-revealed sections using imagery from `public/images/`.
- **Footer** (`sections/Footer.tsx`).
- **ProductDetail** (`pages/ProductDetail.tsx`) — Loads a product by `:id` (slug)
  from context, shows images, colors, sizes, material, care, fit, article number,
  and related products from the same category.

Smooth scrolling is provided by **Lenis** (`src/App.tsx`), integrated with GSAP's
ticker and `ScrollTrigger`. Lenis is **disabled** in the admin area and during the
loading screen.

---

## Admin Panel

A dark, internal CMS for managing storefront content. Lives under `src/admin/`.

### Authentication

- Login page: `src/admin/pages/Login.tsx` — posts to `POST /api/auth/login`.
- On success the JWT token + admin user object are stored in `localStorage`
  (`6thsin_admin_token`, `6thsin_admin_user`) via `SiteDataContext`.
- `AdminLayout` reads `token` from context; if absent it renders `<Login/>`.
- Logout clears the token/user (handled in `AdminSidebar`'s footer button).

### Pages

1. **Dashboard** (`Dashboard.tsx`) — Stat cards: total products, category count,
   frontpage section count, and current hero text. Shows a "Products by Category"
   bar breakdown and quick-info panel.
2. **Frontpage Editor** (`FrontpageEditor.tsx`) — Edit the singleton frontpage
   content (hero text, featured collections heading/body/CTA, new arrivals
   title). Persists via `PUT /api/frontpage`.
3. **Menu Editor** (`MenuEditor.tsx`) — Add/update/delete top-level nav categories
   and their child menu items. Uses the `/api/menu` endpoints.
4. **Products List** (`ProductsList.tsx`) — Table of products with delete.
5. **Product Form** (`ProductForm.tsx`) — Create/edit a product with all fields
   (name, price, description, images, category, colors, sizes, material, care,
   fit, article number, supplier, country of production, published flag).

### Sidebar

`AdminSidebar.tsx` (collapsible icon sidebar using shadcn `sidebar` component):

- Dashboard → `/admin`
- Frontpage → `/admin/frontpage`
- Menu → `/admin/menu`
- Products → `/admin/products`
- Add Product → `/admin/products/new`
- Footer: Sign Out (clears token), Back to site (`/`).

---

## State Management

State is centralized in **a single React Context**:
`src/admin/store/SiteDataContext.tsx`.

### `SiteDataProvider` + `useSiteData()`

Wraps the entire app (both storefront and admin) in `App.tsx`. It exposes:

```ts
interface SiteDataContextValue {
  // data
  products: Product[];
  frontpage: FrontpageSettings;
  navMenu: NavMenuCategory[];
  // auth
  token: string | null;
  adminUser: { email: string; name: string } | null;
  login(email, password): Promise<boolean>;
  logout(): void;
  // products CRUD
  addProduct(product): Promise<Product>;
  updateProduct(id, updates: Partial<Product>): Promise<void>;
  deleteProduct(id): Promise<void>;
  getProductById(id): Product | undefined;
  getRelatedProducts(product, count?): Product[];
  // frontpage
  updateFrontpage(settings: Partial<FrontpageSettings>): Promise<void>;
  // menu
  addCategory(category): Promise<NavMenuCategory>;
  updateCategory(id, updates): Promise<void>;
  deleteCategory(id): Promise<void>;
  addMenuItem(categoryId, item): Promise<MenuItem>;
  updateMenuItem(categoryId, itemId, updates): Promise<void>;
  deleteMenuItem(categoryId, itemId): Promise<void>;
}
```

### Behavior

- **API base** is hardcoded: `http://localhost:5000/api` (`API_BASE`).
- On mount it calls `fetchAllData()` which fires three parallel `fetch` calls
  (`/products`, `/frontpage`, `/menu`) and caches results to `localStorage`.
  If the backend is unreachable it logs a warning and keeps the cached/
  fallback data (offline-friendly).
- Authenticated mutations attach `Authorization: Bearer <token>`.
- After successful login it re-runs `fetchAllData()` to refresh.
- localStorage keys used (with the `6thsin_admin_` prefix):
  - `6thsin_admin_products`
  - `6thsin_admin_frontpage`
  - `6thsin_admin_menu`
  - `6thsin_admin_token`
  - `6thsin_admin_user`

### Fallback data

When no backend/cache is present, `src/data/products.ts` provides **8 hardcoded
products** used as the initial state for `products`.

---

## Styling System

### Tailwind CSS (3.4.19)

Config in `tailwind.config.cjs`. Content paths: `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`.

#### Brand palette (custom colors)

| Token | Value | Usage |
|---|---|---|
| `crimson` | `#E30614` | Primary brand accent (CTAs, active states, highlights) |
| `deep-black` | `#050505` | App background |
| `dark-charcoal` | `#1C1C1C` | Surfaces |
| `warm-cream` | `#FAF5EF` | Light accents |

The standard shadcn HSL-CSS-variable theme (`background`, `foreground`,
`primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`, `card`,
`popover`, `destructive`) is also wired up for the Radix UI components.

#### Fonts

| Token | Family |
|---|---|
| `font-anton` | Anton (display/headings) |
| `font-inter` | Inter (body/ui) |

#### Custom keyframes & animations

- `accordion-down` / `accordion-up` (Radix accordion)
- `caret-blink` (input-otp caret)
- `scroll-dot` (scroll indicator)

Plugin: `tailwindcss-animate`.

### shadcn/ui

Config in `components.json`:

- **Style**: `new-york`
- **Icon library**: `lucide`
- **Base color**: slate
- **CSS variables**: enabled
- **Aliases**:
  - `@/components` → `src/components`
  - `@/components/ui` → `src/components/ui`
  - `@/lib` → `src/lib`
  - `@/lib/utils` → `src/lib/utils.ts` (the `cn()` helper)
  - `@/hooks` → `src/hooks`

56 UI components are installed under `src/components/ui/` (accordion, alert,
alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group,
calendar, card, carousel, chart, checkbox, collapsible, command, context-menu,
dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group,
input-otp, input, item, kbd, label, menubar, navigation-menu, pagination,
popover, progress, radio-group, resizable, scroll-area, select, separator,
sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs,
textarea, toggle, toggle-group, tooltip).

### PostCSS

`postcss.config.js` wires Tailwind + `autoprefixer`.

---

## Animation & Smooth Scroll

- **GSAP** (`gsap` + `@gsap/react`) with the **ScrollTrigger** plugin
  (registered in `App.tsx`) drives the scroll-reveal and menu transitions.
- **Lenis** smooth scrolling is initialized in `App.tsx`:
  - `lerp: 0.1`, `smoothWheel: true`
  - `lenis.on('scroll', ScrollTrigger.update)` keeps ScrollTrigger in sync.
  - Driven by `gsap.ticker`.
  - **Disabled** on the admin area and during the loading screen (returns early).
- Header menu uses GSAP `fromTo` tweens for the slide-in panel and staggered
  menu-item reveals.

---

## Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

```ts
"@/*": ["./src/*"]
```

Usage example:
```ts
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/product';
```

---

## Environment Files

The **frontend has no `.env` files** of its own — there is no Vite env
configuration. All environment configuration lives on the **server** side
(see `server.md` → Environment Files).

### Important runtime configuration that lives in code (NOT env)

| What | Where | Value |
|---|---|---|
| Frontend dev port | `vite.config.ts` → `server.port` | `3000` |
| Backend API base URL | `src/admin/store/SiteDataContext.tsx` → `API_BASE` | `http://localhost:5000/api` |

> To point the frontend at a different backend, edit the `API_BASE` constant in
> `src/admin/store/SiteDataContext.tsx:7`.

### `.gitignore` (frontend root)

Ignores `node_modules`, `dist`, `dist-ssr`, `*.local`, logs, and editor config.
No `.env` patterns are listed on the frontend because there are none.

---

## Public Assets

Located in `public/`:

| Asset | Path | Used by |
|---|---|---|
| Logo | `public/6thsinlogo.png` | `Header.tsx`, `App.tsx` loading screen |
| Hero video | `public/videos/hero-campaign-film.mp4` | `sections/Hero.tsx` |
| Category images | `public/images/category-*.jpg` | `CategorySlider.tsx` |
| Collection images | `public/images/collection-editorial-1|2.jpg` | `FeaturedCollections.tsx` |
| Lookbook images | `public/images/lookbook-1..12.jpg` | `Lookbook.tsx` |
| Product images | `public/images/product-1..8.jpg` | `ProductDetail.tsx`, product cards |

> `vite.config.ts` sets `base: './'`, so built assets use relative paths.

---

## Type Definitions

Shared by both the storefront and admin.

### `src/types/product.ts`

```ts
export interface Product {
  id: string;              // the product slug
  name: string;
  price: string;           // e.g. "£89.00"
  description: string;
  images: string[];
  category: string;        // MENSWEAR | WOMENSWEAR | ACCESSORIES | ACTIVEWEAR | HOME
  subcategory: string;
  color: string;
  colors?: { name: string; hex: string }[];
  sizes: string[];
  material: string;
  careInstructions: string[];
  fit: string;
  articleNumber: string;
  supplierInfo?: string;
  countryOfProduction?: string;
}
```

### `src/admin/types/frontpage.ts`

```ts
export interface FrontpageSettings {
  hero: { text: string };
  featuredCollections: { heading: string; body: string; ctaText: string };
  newArrivals: { title: string };
}
```

### `src/admin/types/menu.ts`

```ts
export interface MenuItem { id: string; label: string; href: string }
export interface NavMenuCategory { id: string; label: string; children: MenuItem[] }
```

---

## Commands Reference

```bash
# Install dependencies
npm install

# Develop (port 3000)
npm run dev

# Type-check + production build → dist/
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint
```

---

### Notes

- The `Home.tsx` page in `src/pages/` is leftover from the Vite template and is
  **not** used by the current routes — the real homepage is the inlined
  `HomePage` component defined in `src/App.tsx`.
- The data layer is offline-tolerant: if the backend is down, the app falls
  back to `localStorage` cached data, and ultimately to the hardcoded products
  in `src/data/products.ts`.
- `kimi-plugin-inspect-react` is registered as a Vite plugin (`inspectAttr()`)
  in `vite.config.ts` — used for dev-time React inspection.
