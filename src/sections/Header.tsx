import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useSiteData } from '../admin/store/SiteDataContext';

export default function Header() {
  const { navMenu } = useSiteData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const submenuRef = useRef<HTMLDivElement>(null);
  const subItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;
    setActiveCategory(null);
    gsap.fromTo(
      menuRef.current,
      { x: '-100%' },
      { x: '0%', duration: 0.6, ease: 'power3.out' }
    );
    menuItemsRef.current.forEach((item, i) => {
      if (item) {
        gsap.fromTo(
          item,
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, delay: 0.2 + i * 0.08, ease: 'power3.out' }
        );
      }
    });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !activeCategory) return;
    if (submenuRef.current) {
      gsap.fromTo(
        submenuRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
    subItemsRef.current.forEach((item, i) => {
      if (item) {
        gsap.fromTo(
          item,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, delay: 0.08 + i * 0.04, ease: 'power2.out' }
        );
      }
    });
  }, [activeCategory, menuOpen]);

  const closeMenu = useCallback(() => {
    if (menuRef.current) {
      gsap.to(menuRef.current, {
        x: '-100%',
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => {
          setMenuOpen(false);
          setActiveCategory(null);
        },
      });
    }
  }, []);

  const activeCategoryData = navMenu.find(c => c.id === activeCategory);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 64,
          backgroundColor: '#050505',
          borderBottom: '1px solid rgba(246,246,246,0.08)',
        }}
      >
        <div className="flex items-center justify-between h-full px-6 max-w-[1440px] mx-auto">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-[6px] cursor-pointer group"
            aria-label="Open menu"
          >
            <span className="block w-6 h-[1.5px] bg-[#F6F6F6] transition-all duration-300 group-hover:w-5" />
            <span className="block w-6 h-[1.5px] bg-[#F6F6F6] transition-all duration-300 group-hover:w-4" />
          </button>

          <a href="#" className="absolute left-1/2 -translate-x-1/2">
            <img src="/6thsinlogo.png" alt="6th SIN" className="h-10 w-auto" />
          </a>

          <div className="flex items-center gap-6">
            <a href="#" className="font-inter text-xs font-medium tracking-[0.08em] text-[#F6F6F6] uppercase hidden sm:block hover:text-crimson transition-colors duration-300">
              SEARCH
            </a>
            <a href="#" className="font-inter text-xs font-medium tracking-[0.08em] text-[#F6F6F6] uppercase hover:text-crimson transition-colors duration-300">
              BAG (0)
            </a>
          </div>
        </div>
      </header>

      {/* Fullscreen Menu Overlay */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-y-auto"
          style={{ transform: 'translateX(-100%)' }}
        >
          {/* Close Button */}
          <button
            onClick={closeMenu}
            className="fixed top-6 right-6 text-[#F6F6F6] hover:text-crimson transition-colors duration-300 cursor-pointer z-20"
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* Left Column — Main Categories */}
            <div className="flex flex-col justify-center px-6 sm:px-16 py-28 md:py-0 flex-1">
              <nav className="flex flex-col gap-3 sm:gap-6">
                {navMenu.map((category, index) => (
                  <button
                    key={category.id}
                    ref={(el) => { menuItemsRef.current[index] = el; }}
                    onClick={() => setActiveCategory(
                      activeCategory === category.id ? null : category.id
                    )}
                    className="font-anton text-[clamp(32px,6vw,120px)] leading-[0.9] tracking-[-0.02em] transition-all duration-300 block text-left cursor-pointer"
                    style={{
                      opacity: 0,
                      color: activeCategory === category.id ? '#E30614' : '#F6F6F6',
                      transform: activeCategory === category.id ? 'translateX(20px)' : 'translateX(0)',
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory !== category.id) {
                        gsap.to(e.currentTarget, { x: 10, duration: 0.3, ease: 'power2.out' });
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== category.id) {
                        gsap.to(e.currentTarget, { x: 0, duration: 0.3, ease: 'power2.out' });
                      }
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </nav>

              {/* Mobile submenu — inline below categories */}
              {activeCategoryData && (
                <div
                  ref={submenuRef}
                  className="mt-8 pt-8 border-t border-[rgba(246,246,246,0.08)] md:hidden"
                  style={{ opacity: 0 }}
                >
                  <span className="font-inter text-[11px] tracking-[0.15em] text-[rgba(246,246,246,0.4)] uppercase block mb-5">
                    {activeCategoryData.label}
                  </span>
                  <div className="flex flex-col gap-3">
                    {activeCategoryData.children.map((item, i) => (
                      <a
                        key={item.id}
                        ref={(el) => { subItemsRef.current[i] = el; }}
                        href={item.href}
                        className="font-inter text-base sm:text-lg text-[rgba(246,246,246,0.8)] hover:text-crimson transition-colors duration-300"
                        style={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenu();
                        }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-8 mt-12 md:mt-16 pb-4">
                <a href="#" className="font-inter text-xs tracking-[0.08em] text-[rgba(246,246,246,0.6)] uppercase hover:text-[#F6F6F6] transition-colors">
                  Instagram
                </a>
                <a href="#" className="font-inter text-xs tracking-[0.08em] text-[rgba(246,246,246,0.6)] uppercase hover:text-[#F6F6F6] transition-colors">
                  TikTok
                </a>
                <a href="#" className="font-inter text-xs tracking-[0.08em] text-[rgba(246,246,246,0.6)] uppercase hover:text-[#F6F6F6] transition-colors">
                  X
                </a>
              </div>
            </div>

            {/* Desktop Right Column — Submenu */}
            <div className="hidden md:flex flex-1 items-center justify-center border-l border-[rgba(246,246,246,0.08)] sticky top-0 h-screen">
              {activeCategoryData ? (
                <div className="flex flex-col items-center px-8">
                  <span className="font-anton text-sm tracking-[0.15em] text-[rgba(246,246,246,0.3)] uppercase mb-10">
                    {activeCategoryData.label}
                  </span>
                  <div className="flex flex-col items-center gap-5">
                    {activeCategoryData.children.map((item, i) => (
                      <a
                        key={item.id}
                        ref={(el) => { subItemsRef.current[i] = el; }}
                        href={item.href}
                        className="font-anton text-[clamp(28px,3vw,48px)] text-[#F6F6F6] leading-[1.1] tracking-[-0.02em] hover:text-crimson transition-colors duration-300 text-center"
                        style={{ opacity: 0 }}
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenu();
                        }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="font-inter text-base text-[rgba(246,246,246,0.2)]">
                  Select a category
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
