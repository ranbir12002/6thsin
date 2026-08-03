import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product } from '../../types/product';
import { products as defaultProducts } from '../../data/products';
import type { FrontpageSettings } from '../types/frontpage';
import type { NavMenuCategory, MenuItem } from '../types/menu';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.sixthsin.com/api';

const DEFAULT_FRONTPAGE: FrontpageSettings = {
  hero: { text: 'BECOME A PART OF THE WORLD' },
  featuredCollections: {
    heading: 'REDEFINING THE BOUNDARIES OF STYLE',
    body: 'Founded on the principle that fashion should be fearless, 6th SIN bridges the gap between luxury craftsmanship and street-level attitude. Every piece is designed to make a statement — bold, unapologetic, and unmistakably yours.',
    ctaText: 'EXPLORE THE COLLECTION',
    images: [
      '/images/collection-editorial-1.jpg',
      '/images/collection-editorial-2.jpg'
    ],
  },
  newArrivals: { title: 'NEW ARRIVALS' },
  lookbook: {
    images: [
      '/images/lookbook-1.jpg', '/images/lookbook-2.jpg', '/images/lookbook-3.jpg', '/images/lookbook-4.jpg',
      '/images/lookbook-5.jpg', '/images/lookbook-6.jpg', '/images/lookbook-7.jpg', '/images/lookbook-8.jpg',
      '/images/lookbook-9.jpg', '/images/lookbook-10.jpg', '/images/lookbook-11.jpg', '/images/lookbook-12.jpg'
    ]
  }
};

const DEFAULT_MENU: NavMenuCategory[] = [
  {
    id: 'menswear',
    label: 'MENSWEAR',
    children: [
      { id: 'mens-new-arrivals', label: 'New Arrivals', href: '/category/menswear/new-arrivals' },
      { id: 'mens-hoodies', label: 'Hoodies', href: '/category/menswear/hoodies' },
      { id: 'mens-t-shirts', label: 'T-Shirts', href: '/category/menswear/t-shirts' },
      { id: 'mens-jackets', label: 'Jackets', href: '/category/menswear/jackets' },
      { id: 'mens-trousers', label: 'Trousers', href: '/category/menswear/trousers' },
    ],
  },
  {
    id: 'womenswear',
    label: 'WOMENSWEAR',
    children: [
      { id: 'womens-new-arrivals', label: 'New Arrivals', href: '/category/womenswear/new-arrivals' },
      { id: 'womens-tops', label: 'Tops', href: '/category/womenswear/tops' },
      { id: 'womens-trousers', label: 'Trousers', href: '/category/womenswear/trousers' },
      { id: 'womens-dresses', label: 'Dresses', href: '/category/womenswear/dresses' },
      { id: 'womens-jackets', label: 'Jackets', href: '/category/womenswear/jackets' },
    ],
  },
];

interface SiteDataContextValue {
  products: Product[];
  frontpage: FrontpageSettings;
  navMenu: NavMenuCategory[];
  token: string | null;
  adminUser: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getRelatedProducts: (product: Product, count?: number) => Product[];
  updateFrontpage: (settings: Partial<FrontpageSettings>) => Promise<void>;
  addCategory: (category: Omit<NavMenuCategory, 'id'>) => Promise<NavMenuCategory>;
  updateCategory: (id: string, updates: Partial<NavMenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (categoryId: string, item: Omit<MenuItem, 'id'>) => Promise<MenuItem>;
  updateMenuItem: (categoryId: string, itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (categoryId: string, itemId: string) => Promise<void>;
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
const STORAGE_KEY_TOKEN = '6thsin_admin_token';
const STORAGE_KEY_USER = '6thsin_admin_user';
const STORAGE_KEY_CACHE_VERSION = '6thsin_admin_cache_version';

// Bump this number whenever the shape of the cached defaults changes
// (e.g. menu hrefs updated, product fields added) so stale localStorage
// entries from older app versions are discarded.
const CACHE_VERSION = 4;

function invalidateStaleCache() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CACHE_VERSION);
    if (stored !== String(CACHE_VERSION)) {
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem(STORAGE_KEY_FRONTPAGE);
      localStorage.removeItem(STORAGE_KEY_MENU);
      localStorage.setItem(STORAGE_KEY_CACHE_VERSION, String(CACHE_VERSION));
    }
  } catch {}
}

function loadProducts(): Product[] {
  invalidateStaleCache();
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
    if (saved) {
      const menu = JSON.parse(saved) as NavMenuCategory[];
      // Safety net: if every item.href is still '#' (very old default),
      // prefer the bundled defaults instead of the stale cache.
      const allStale = menu.every(c => c.children.every(i => i.href === '#'));
      if (allStale) return DEFAULT_MENU;
      return menu;
    }
  } catch {}
  return DEFAULT_MENU;
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [frontpage, setFrontpage] = useState<FrontpageSettings>(loadFrontpage);
  const [navMenu, setNavMenu] = useState<NavMenuCategory[]>(loadMenu);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_TOKEN));
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Fetch initial data from backend API
  const fetchAllData = useCallback(async () => {
    try {
      const [resProducts, resFrontpage, resMenu] = await Promise.all([
        fetch(`${API_BASE}/products`).then(r => r.json()),
        fetch(`${API_BASE}/frontpage`).then(r => r.json()),
        fetch(`${API_BASE}/menu`).then(r => r.json())
      ]);

      if (resProducts.success && resProducts.products) {
        setProducts(resProducts.products);
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(resProducts.products));
      }
      if (resFrontpage.success && resFrontpage.frontpage) {
        setFrontpage(resFrontpage.frontpage);
        localStorage.setItem(STORAGE_KEY_FRONTPAGE, JSON.stringify(resFrontpage.frontpage));
      }
      if (resMenu.success && resMenu.menu) {
        setNavMenu(resMenu.menu);
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(resMenu.menu));
      }
    } catch (error) {
      console.warn('⚠️ Backend not reachable, using offline/localStorage cache.', error);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auth login helper
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token);
        setAdminUser(data.admin);
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.admin));
        // Refresh site data after login to get the latest
        fetchAllData();
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  }, [fetchAllData]);

  // Auth logout helper
  const logout = useCallback(() => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || data.errors?.[0] || 'Failed to add product');
    }
    setProducts(prev => [data.product, ...prev]);
    return data.product;
  }, [token]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<void> => {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update product');
    }
    setProducts(prev => prev.map(p => p.id === id ? data.product : p));
  }, [token]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete product');
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [token]);

  const getProductById = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const getRelatedProducts = useCallback((product: Product, count = 4) => {
    return products.filter(p => p.id !== product.id && p.category === product.category).slice(0, count);
  }, [products]);

  const updateFrontpage = useCallback(async (settings: Partial<FrontpageSettings>): Promise<void> => {
    const response = await fetch(`${API_BASE}/frontpage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update frontpage settings');
    }
    setFrontpage(data.frontpage);
  }, [token]);

  const addCategory = useCallback(async (category: Omit<NavMenuCategory, 'id'>): Promise<NavMenuCategory> => {
    const response = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(category)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to add menu category');
    }
    setNavMenu(prev => [...prev, data.category]);
    return data.category;
  }, [token]);

  const updateCategory = useCallback(async (id: string, updates: Partial<NavMenuCategory>): Promise<void> => {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update category');
    }
    setNavMenu(prev => prev.map(c => c.id === id ? data.category : c));
  }, [token]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete category');
    }
    setNavMenu(prev => prev.filter(c => c.id !== id));
  }, [token]);

  const addMenuItem = useCallback(async (categoryId: string, item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    const response = await fetch(`${API_BASE}/menu/${categoryId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(item)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to add menu item');
    }
    setNavMenu(prev => prev.map(c => c.id === categoryId ? data.category : c));
    
    // Return the newly created item (which will be the last child)
    const updatedCat = data.category as NavMenuCategory;
    return updatedCat.children[updatedCat.children.length - 1];
  }, [token]);

  const updateMenuItem = useCallback(async (categoryId: string, itemId: string, updates: Partial<MenuItem>): Promise<void> => {
    const response = await fetch(`${API_BASE}/menu/${categoryId}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update menu item');
    }
    setNavMenu(prev => prev.map(c => c.id === categoryId ? data.category : c));
  }, [token]);

  const deleteMenuItem = useCallback(async (categoryId: string, itemId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/menu/${categoryId}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete menu item');
    }
    setNavMenu(prev => prev.map(c => c.id === categoryId ? data.category : c));
  }, [token]);

  return (
    <SiteDataContext.Provider value={{
      products, frontpage, navMenu, token, adminUser,
      login, logout,
      addProduct, updateProduct, deleteProduct,
      getProductById, getRelatedProducts, updateFrontpage,
      addCategory, updateCategory, deleteCategory,
      addMenuItem, updateMenuItem, deleteMenuItem,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
}
