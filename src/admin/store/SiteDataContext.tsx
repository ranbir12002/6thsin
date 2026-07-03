import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product } from '../../types/product';
import { products as defaultProducts } from '../../data/products';
import type { FrontpageSettings } from '../types/frontpage';
import type { NavMenuCategory, MenuItem } from '../types/menu';

const DEFAULT_FRONTPAGE: FrontpageSettings = {
  hero: { text: 'BECOME A PART OF THE WORLD' },
  featuredCollections: {
    heading: 'REDEFINING THE BOUNDARIES OF STYLE',
    body: 'Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours.',
    ctaText: 'EXPLORE THE COLLECTION',
  },
  newArrivals: { title: 'NEW ARRIVALS' },
};

const DEFAULT_MENU: NavMenuCategory[] = [
  {
    id: 'menswear',
    label: 'MENSWEAR',
    children: [
      { id: 'mens-new-arrivals', label: 'New Arrivals', href: '#' },
      { id: 'mens-hoodies', label: 'Hoodies', href: '#' },
      { id: 'mens-t-shirts', label: 'T-Shirts', href: '#' },
      { id: 'mens-jackets', label: 'Jackets', href: '#' },
      { id: 'mens-trousers', label: 'Trousers', href: '#' },
    ],
  },
  {
    id: 'womenswear',
    label: 'WOMENSWEAR',
    children: [
      { id: 'womens-new-arrivals', label: 'New Arrivals', href: '#' },
      { id: 'womens-tops', label: 'Tops', href: '#' },
      { id: 'womens-trousers', label: 'Trousers', href: '#' },
      { id: 'womens-dresses', label: 'Dresses', href: '#' },
      { id: 'womens-jackets', label: 'Jackets', href: '#' },
    ],
  },
  {
    id: 'home',
    label: 'HOME',
    children: [
      { id: 'home-fragrance', label: 'Fragrance', href: '#' },
      { id: 'home-decor', label: 'Decor', href: '#' },
    ],
  },
  {
    id: 'accessories',
    label: 'ACCESSORIES',
    children: [
      { id: 'acc-bags', label: 'Bags', href: '#' },
      { id: 'acc-shoes', label: 'Shoes', href: '#' },
    ],
  },
  {
    id: 'activewear',
    label: 'ACTIVEWEAR',
    children: [
      { id: 'active-tops', label: 'Tops', href: '#' },
      { id: 'active-bottoms', label: 'Bottoms', href: '#' },
    ],
  },
  {
    id: 'lookbook',
    label: 'LOOKBOOK',
    children: [
      { id: 'lookbook-ss25', label: 'SS25 Collection', href: '#' },
      { id: 'lookbook-aw24', label: 'AW24 Archive', href: '#' },
    ],
  },
];

interface SiteDataContextValue {
  products: Product[];
  frontpage: FrontpageSettings;
  navMenu: NavMenuCategory[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getRelatedProducts: (product: Product, count?: number) => Product[];
  updateFrontpage: (settings: Partial<FrontpageSettings>) => void;
  addCategory: (category: Omit<NavMenuCategory, 'id'>) => NavMenuCategory;
  updateCategory: (id: string, updates: Partial<NavMenuCategory>) => void;
  deleteCategory: (id: string) => void;
  addMenuItem: (categoryId: string, item: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (categoryId: string, itemId: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (categoryId: string, itemId: string) => void;
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider');
  return ctx;
}

const STORAGE_KEY_PRODUCTS = '6thsin_admin_products';
const STORAGE_KEY_FRONTPAGE = '6thsin_admin_frontpage';
const STORAGE_KEY_MENU = '6thsin_admin_menu';

function loadProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultProducts;
}

function loadFrontpage(): FrontpageSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FRONTPAGE);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_FRONTPAGE;
}

function loadMenu(): NavMenuCategory[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MENU);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_MENU;
}

function generateId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [frontpage, setFrontpage] = useState<FrontpageSettings>(loadFrontpage);
  const [navMenu, setNavMenu] = useState<NavMenuCategory[]>(loadMenu);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FRONTPAGE, JSON.stringify(frontpage));
  }, [frontpage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(navMenu));
  }, [navMenu]);

  const addProduct = useCallback((product: Omit<Product, 'id'>): Product => {
    const id = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProduct: Product = { ...product, id };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const getRelatedProducts = useCallback((product: Product, count = 4) => {
    return products.filter(p => p.id !== product.id && p.category === product.category).slice(0, count);
  }, [products]);

  const updateFrontpage = useCallback((settings: Partial<FrontpageSettings>) => {
    setFrontpage(prev => ({ ...prev, ...settings }));
  }, []);

  const addCategory = useCallback((category: Omit<NavMenuCategory, 'id'>): NavMenuCategory => {
    const id = generateId(category.label);
    const newCategory: NavMenuCategory = { ...category, id };
    setNavMenu(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<NavMenuCategory>) => {
    setNavMenu(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setNavMenu(prev => prev.filter(c => c.id !== id));
  }, []);

  const addMenuItem = useCallback((categoryId: string, item: Omit<MenuItem, 'id'>): MenuItem => {
    const id = generateId(item.label);
    const newItem: MenuItem = { ...item, id };
    setNavMenu(prev => prev.map(c =>
      c.id === categoryId ? { ...c, children: [...c.children, newItem] } : c
    ));
    return newItem;
  }, []);

  const updateMenuItem = useCallback((categoryId: string, itemId: string, updates: Partial<MenuItem>) => {
    setNavMenu(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, children: c.children.map(i => i.id === itemId ? { ...i, ...updates } : i) }
        : c
    ));
  }, []);

  const deleteMenuItem = useCallback((categoryId: string, itemId: string) => {
    setNavMenu(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, children: c.children.filter(i => i.id !== itemId) }
        : c
    ));
  }, []);

  return (
    <SiteDataContext.Provider value={{
      products, frontpage, navMenu,
      addProduct, updateProduct, deleteProduct,
      getProductById, getRelatedProducts, updateFrontpage,
      addCategory, updateCategory, deleteCategory,
      addMenuItem, updateMenuItem, deleteMenuItem,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
}
