import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from './sections/Header';
import Hero from './sections/Hero';
import FeaturedCollections from './sections/FeaturedCollections';
import NewArrivals from './sections/NewArrivals';
import Lookbook from './sections/Lookbook';
import Footer from './sections/Footer';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import { SiteDataProvider } from './admin/store/SiteDataContext';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import ProductsList from './admin/pages/ProductsList';
import ProductForm from './admin/pages/ProductForm';
import FrontpageEditor from './admin/pages/FrontpageEditor';
import MenuEditor from './admin/pages/MenuEditor';

gsap.registerPlugin(ScrollTrigger);

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (screenRef.current) {
        gsap.to(screenRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete,
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      ref={screenRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: '#050505' }}
    >
      <img
        src="/6thsinlogo.png"
        alt="6th SIN"
        className="w-auto max-w-[60vw] md:max-w-[400px] h-auto"
      />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <main>
        <Hero />
        {/* <CategorySlider /> */}
        <FeaturedCollections />
        <NewArrivals />
        <Lookbook />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (loading || isAdmin) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf as unknown as gsap.TickerCallback);
    };
  }, [loading, isAdmin]);

  return (
    <SiteDataProvider>
      {isAdmin ? (
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="frontpage" element={<FrontpageEditor />} />
            <Route path="menu" element={<MenuEditor />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
          </Route>
        </Routes>
      ) : (
        <>
          {loading && isHome && <LoadingScreen onComplete={() => setLoading(false)} />}
          <Header />
          <div
            style={{
              opacity: loading && isHome ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/category/:category/:subcategory?" element={<CategoryPage />} />
            </Routes>
          </div>
        </>
      )}
    </SiteDataProvider>
  );
}