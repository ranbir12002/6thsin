/**
 * Seed script — populates the database with initial data.
 * Run with: npm run seed
 *
 * Creates:
 *   - Admin user (admin@6thsin.com / admin123)
 *   - Default frontpage settings
 *   - Default navigation menu categories
 *   - 8 default products from the frontend
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Frontpage = require('../models/Frontpage');
const MenuCategory = require('../models/Menu');

const DEFAULT_ADMIN = {
  email: 'admin@admin.com',
  password: 'admin123',
  name: 'Admin',
};

const DEFAULT_FRONTPAGE = {
  hero: { text: 'BECOME A PART OF THE WORLD' },
  featuredCollections: {
    heading: 'REDEFINING THE BOUNDARIES OF STYLE',
    body: 'Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours.',
    ctaText: 'EXPLORE THE COLLECTION',
    images: [
      '/images/collection-editorial-1.jpg',
      '/images/collection-editorial-2.jpg',
    ],
  },
  newArrivals: { title: 'NEW ARRIVALS' },
  lookbook: {
    images: [
      '/images/lookbook-1.jpg',
      '/images/lookbook-2.jpg',
      '/images/lookbook-3.jpg',
      '/images/lookbook-4.jpg',
      '/images/lookbook-5.jpg',
      '/images/lookbook-6.jpg',
      '/images/lookbook-7.jpg',
      '/images/lookbook-8.jpg',
      '/images/lookbook-9.jpg',
      '/images/lookbook-10.jpg',
      '/images/lookbook-11.jpg',
      '/images/lookbook-12.jpg',
    ],
  },
};

const DEFAULT_MENU = [
  {
    label: 'MENSWEAR',
    order: 0,
    children: [
      { label: 'New Arrivals', href: '/category/menswear/new-arrivals' },
      { label: 'Hoodies', href: '/category/menswear/hoodies' },
      { label: 'T-Shirts', href: '/category/menswear/t-shirts' },
      { label: 'Jackets', href: '/category/menswear/jackets' },
      { label: 'Trousers', href: '/category/menswear/trousers' },
    ],
  },
  {
    label: 'WOMENSWEAR',
    order: 1,
    children: [
      { label: 'New Arrivals', href: '/category/womenswear/new-arrivals' },
      { label: 'Tops', href: '/category/womenswear/tops' },
      { label: 'Trousers', href: '/category/womenswear/trousers' },
      { label: 'Dresses', href: '/category/womenswear/dresses' },
      { label: 'Jackets', href: '/category/womenswear/jackets' },
    ],
  },
  {
    label: 'HOME',
    order: 2,
    children: [
      { label: 'Fragrance', href: '/category/home/fragrance' },
      { label: 'Decor', href: '/category/home/decor' },
    ],
  },
  {
    label: 'ACCESSORIES',
    order: 3,
    children: [
      { label: 'Bags', href: '/category/accessories/bags' },
      { label: 'Shoes', href: '/category/accessories/shoes' },
    ],
  },
  {
    label: 'ACTIVEWEAR',
    order: 4,
    children: [
      { label: 'Tops', href: '/category/activewear/tops' },
      { label: 'Bottoms', href: '/category/activewear/bottoms' },
    ],
  },
  {
    label: 'LOOKBOOK',
    order: 5,
    children: [
      { label: 'SS25 Collection', href: '/category/lookbook/ss25-collection' },
      { label: 'AW24 Archive', href: '/category/lookbook/aw24-archive' },
    ],
  },
];

const DEFAULT_PRODUCTS = [
  {
    name: 'Oversized Logo Hoodie',
    price: '£89.00',
    description:
      'Relaxed-fit hoodie in heavyweight cotton-blend fleece with a casual oversized silhouette. Featuring a drawstring hood, ribbed cuffs and hem, and a bold logo print across the chest.',
    images: ['/images/product-1.jpg'],
    category: 'MENSWEAR',
    subcategory: 'Hoodies',
    color: 'Black',
    colors: [
      { name: 'Black', hex: '#050505' },
      { name: 'Grey', hex: '#808080' },
      { name: 'Cream', hex: '#F5F0E8' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    material: '80% Cotton, 20% Polyester',
    careInstructions: [
      'Machine wash cold',
      'Do not bleach',
      'Tumble dry low',
      'Iron on low heat',
      'Do not dry clean',
    ],
    fit: 'Oversized fit — we recommend sizing down for a regular fit',
    articleNumber: '1325309001',
    countryOfProduction: 'Bangladesh',
  },
  {
    name: 'Structured Blazer',
    price: '£245.00',
    description:
      'Sharp tailored blazer in a structured wool-blend fabrication. Features a notched lapel, two-button closure, flap pockets, and a single back vent. Fully lined for a refined finish.',
    images: ['/images/product-2.jpg'],
    category: 'MENSWEAR',
    subcategory: 'Jackets',
    color: 'Charcoal',
    colors: [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Black', hex: '#050505' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: '65% Polyester, 35% Viscose',
    careInstructions: ['Dry clean only', 'Cool iron', 'Store on padded hanger'],
    fit: 'Regular fit — take your usual size',
    articleNumber: '1325309002',
    countryOfProduction: 'Vietnam',
  },
  {
    name: 'Wide-Leg Trousers',
    price: '£120.00',
    description:
      'Flowy wide-leg trousers in a lightweight woven fabric. High-waisted with a concealed zip fly and hook-and-bar closure. Side pockets and a relaxed drape through the leg.',
    images: ['/images/product-3.jpg'],
    category: 'WOMENSWEAR',
    subcategory: 'Trousers',
    color: 'Cream',
    colors: [
      { name: 'Cream', hex: '#F5F0E8' },
      { name: 'Black', hex: '#050505' },
      { name: 'Olive', hex: '#556B2F' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    material: '100% Polyester',
    careInstructions: [
      'Machine wash cold',
      'Do not bleach',
      'Hang to dry',
      'Iron on low heat',
    ],
    fit: 'Relaxed fit — true to size',
    articleNumber: '1325309003',
    countryOfProduction: 'China',
  },
  {
    name: 'Technical Fitted Top',
    price: '£65.00',
    description:
      'Performance-driven fitted top in moisture-wicking technical fabric. Flatlock seams for chafe-free movement, reflective detailing for visibility, and a mock neck for added coverage.',
    images: ['/images/product-4.jpg'],
    category: 'ACTIVEWEAR',
    subcategory: 'Tops',
    color: 'Black',
    colors: [
      { name: 'Black', hex: '#050505' },
      { name: 'White', hex: '#F6F6F6' },
      { name: 'Neon Green', hex: '#39FF14' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    material: '88% Polyester, 12% Elastane',
    careInstructions: [
      'Machine wash cold',
      'Do not use fabric softener',
      'Do not bleach',
      'Hang to dry',
      'Do not iron',
    ],
    fit: 'Compression fit — take your usual size for a snug feel',
    articleNumber: '1325309004',
    countryOfProduction: 'Vietnam',
  },
  {
    name: 'Essential Oversized Tee',
    price: '£45.00',
    description:
      'Everyday essential t-shirt in heavyweight jersey cotton with an oversized, boxy fit. Ribbed crew neckline, dropped shoulders, and a curved hem. A wardrobe staple.',
    images: ['/images/product-5.jpg'],
    category: 'MENSWEAR',
    subcategory: 'T-Shirts',
    color: 'White',
    colors: [
      { name: 'White', hex: '#F6F6F6' },
      { name: 'Black', hex: '#050505' },
      { name: 'Grey', hex: '#808080' },
      { name: 'Crimson', hex: '#E30614' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    material: '100% Organic Cotton',
    careInstructions: [
      'Machine wash warm',
      'Do not bleach',
      'Tumble dry medium',
      'Iron on medium heat',
    ],
    fit: 'Oversized fit — size down for a regular fit',
    articleNumber: '1325309005',
    countryOfProduction: 'India',
  },
  {
    name: 'Distressed Denim Jacket',
    price: '£175.00',
    description:
      'Classic denim jacket with a worn-in look featuring intentional distressing and fade details. Button front closure, chest pockets with flap, and adjustable waist tabs.',
    images: ['/images/product-6.jpg'],
    category: 'MENSWEAR',
    subcategory: 'Jackets',
    color: 'Light Wash',
    colors: [
      { name: 'Light Wash', hex: '#6D8BA6' },
      { name: 'Medium Wash', hex: '#4A6B8A' },
      { name: 'Black', hex: '#050505' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    material: '100% Cotton Denim',
    careInstructions: [
      'Machine wash cold inside out',
      'Do not bleach',
      'Hang to dry',
      'Iron on medium heat',
      'Wash with similar colors',
    ],
    fit: 'Regular fit — take your usual size',
    articleNumber: '1325309006',
    countryOfProduction: 'Turkey',
  },
  {
    name: 'Structured Tote Bag',
    price: '£195.00',
    description:
      'Minimalist structured tote bag in smooth vegan leather. Top handles with an optional detachable shoulder strap, interior zip pocket, and magnetic snap closure.',
    images: ['/images/product-7.jpg'],
    category: 'ACCESSORIES',
    subcategory: 'Bags',
    color: 'Black',
    colors: [
      { name: 'Black', hex: '#050505' },
      { name: 'Cream', hex: '#F5F0E8' },
      { name: 'Tan', hex: '#D2B48C' },
    ],
    sizes: ['One Size'],
    material: '100% Polyurethane (Vegan Leather)',
    careInstructions: [
      'Wipe clean with damp cloth',
      'Store in dust bag',
      'Avoid direct sunlight',
      'Do not machine wash',
    ],
    fit: 'Dimensions: 38 x 32 x 12 cm',
    articleNumber: '1325309007',
    countryOfProduction: 'Italy',
  },
  {
    name: 'High-Top Sneakers',
    price: '£155.00',
    description:
      'Premium high-top sneakers in smooth leather and suede mix. Cushioned collar, padded insole for all-day comfort, and a chunky rubber sole with tread pattern.',
    images: ['/images/product-8.jpg'],
    category: 'ACCESSORIES',
    subcategory: 'Shoes',
    color: 'White',
    colors: [
      { name: 'White', hex: '#F6F6F6' },
      { name: 'Black', hex: '#050505' },
      { name: 'Navy', hex: '#000080' },
    ],
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'],
    material: 'Upper: 60% Leather, 40% Suede; Sole: Rubber',
    careInstructions: [
      'Wipe with damp cloth',
      'Use leather cleaner',
      'Avoid machine washing',
      'Air dry away from heat',
    ],
    fit: 'True to size — take your usual UK size',
    articleNumber: '1325309008',
    countryOfProduction: 'Portugal',
  },
];

async function seed() {
  try {
    await connectDB();

    console.log('\n🌱 Starting database seed...\n');

    // --- Admin ---
    const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN.email });
    if (existingAdmin) {
      console.log(`  ⏭  Admin user already exists (${DEFAULT_ADMIN.email})`);
    } else {
      await Admin.create(DEFAULT_ADMIN);
      console.log(`  ✅ Admin user created: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    }

    // --- Frontpage ---
    const existingFrontpage = await Frontpage.findOne();
    if (existingFrontpage) {
      console.log('  ⏭  Frontpage settings already exist');
    } else {
      await Frontpage.create(DEFAULT_FRONTPAGE);
      console.log('  ✅ Frontpage settings created');
    }

    // --- Menu ---
    console.log('  🧹 Clearing existing menu categories...');
    await MenuCategory.deleteMany({});
    await MenuCategory.insertMany(DEFAULT_MENU);
    console.log(`  ✅ ${DEFAULT_MENU.length} menu categories created/reset`);

    // --- Products ---
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log(`  ⏭  Products already exist (${existingProducts} found)`);
    } else {
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log(`  ✅ ${DEFAULT_PRODUCTS.length} products created`);
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('  Admin login credentials:');
    console.log(`    Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`    Password: ${DEFAULT_ADMIN.password}`);
    console.log('\n  ⚠  Change the admin password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
