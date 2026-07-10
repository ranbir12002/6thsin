import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { useSiteData } from '../admin/store/SiteDataContext';

export default function Header() {
  const { navMenu, products = [] } = useSiteData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Desktop dropdown state
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile menu refs
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

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Handle Escape key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scrolling when search overlay or mobile menu is active
  useEffect(() => {
    if (searchOpen || menuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [searchOpen, menuOpen]);

  // --- Mobile menu GSAP animations ---
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

  // --- Desktop dropdown handlers ---
  const handleCategoryEnter = (categoryId: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setHoveredCategory(categoryId);
  };

  const handleCategoryLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const activeCategoryData = navMenu.find(c => c.id === activeCategory);
  const hoveredCategoryData = navMenu.find(c => c.id === hoveredCategory);

  const filteredProducts = searchQuery.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: '#050505',
          borderBottom: '1px solid rgba(246,246,246,0.08)',
        }}
      >
        {/* Main bar — nav flush left, logo absolute center, actions right */}
        <div className="relative flex items-center justify-between h-16 px-8">
          {/* Left: Mobile hamburger OR Desktop nav */}
          <div className="flex items-center">
            {/* Mobile hamburger — hidden on md+ */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col gap-[6px] cursor-pointer group md:hidden"
              aria-label="Open menu"
            >
              <span className="block w-6 h-[1.5px] bg-[#F6F6F6] transition-all duration-300 group-hover:w-5" />
              <span className="block w-6 h-[1.5px] bg-[#F6F6F6] transition-all duration-300 group-hover:w-4" />
            </button>

            {/* Desktop inline nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navMenu.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleCategoryEnter(category.id)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <button
                    className={`font-inter text-[11px] font-medium tracking-[0.1em] uppercase px-3 py-5 transition-colors duration-300 cursor-pointer ${
                      hoveredCategory === category.id
                        ? 'text-crimson'
                        : 'text-[#F6F6F6] hover:text-crimson'
                    }`}
                  >
                    {category.label}
                  </button>
                </div>
              ))}
            </nav>
          </div>

          {/* Center: Logo — absolutely centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link to="/">
              <img src="/6thsinlogo.png" alt="6th SIN" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Right: Search & Bag */}
          <div className="flex items-center justify-end gap-4 md:gap-6">
            {/* Search Button (Text on Desktop, Icon on Mobile) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="font-inter text-xs font-medium tracking-[0.08em] text-[#F6F6F6] uppercase hover:text-crimson transition-colors duration-300 cursor-pointer flex items-center gap-1.5 bg-transparent border-none outline-none"
              aria-label="Search products"
            >
              <span className="hidden sm:inline">SEARCH</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <a href="#" className="font-inter text-xs font-medium tracking-[0.08em] text-[#F6F6F6] uppercase hover:text-crimson transition-colors duration-300">
              BAG (0)
            </a>
          </div>
        </div>

        {/* Desktop dropdown panel */}
        <div
          className={`hidden md:block absolute left-0 right-0 bg-[#0a0a0a] border-t border-[rgba(246,246,246,0.08)] overflow-hidden transition-all duration-300 ease-out ${
            hoveredCategoryData ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          }`}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          {hoveredCategoryData && (
            <div className="max-w-[1440px] mx-auto px-6 py-6">
              <span className="font-inter text-[10px] tracking-[0.15em] text-[rgba(246,246,246,0.3)] uppercase block mb-4">
                {hoveredCategoryData.label}
              </span>
              <div className="flex items-start gap-8">
                {hoveredCategoryData.children.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="font-inter text-sm text-[rgba(246,246,246,0.7)] hover:text-crimson transition-colors duration-200"
                    onClick={() => setHoveredCategory(null)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===== Mobile Fullscreen Menu Overlay ===== */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-y-auto md:hidden"
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

          <div className="flex flex-col flex-1 min-h-0">
            {/* Main Categories */}
            <div className="flex flex-col justify-center px-6 sm:px-16 py-28 flex-1">
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
                  className="mt-8 pt-8 border-t border-[rgba(246,246,246,0.08)]"
                  style={{ opacity: 0 }}
                >
                  <span className="font-inter text-[11px] tracking-[0.15em] text-[rgba(246,246,246,0.4)] uppercase block mb-5">
                    {activeCategoryData.label}
                  </span>
                  <div className="flex flex-col gap-3">
                    {activeCategoryData.children.map((item, i) => (
                      <Link
                        key={item.id}
                        ref={(el) => { subItemsRef.current[i] = el; }}
                        to={item.href}
                        className="font-inter text-base sm:text-lg text-[rgba(246,246,246,0.8)] hover:text-crimson transition-colors duration-300"
                        style={{ opacity: 0 }}
                        onClick={() => closeMenu()}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-8 mt-12 pb-4">
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
          </div>
        </div>
      )}

      {/* ===== Search Overlay Modal ===== */}
      {searchOpen && (
        <div className="fixed inset-0 z-[110] bg-[#050505] flex flex-col pt-24 px-6 md:px-16 overflow-y-auto">
          {/* Header containing Close button */}
          <div className="absolute top-6 right-8 flex items-center gap-4">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="text-[#F6F6F6] hover:text-crimson transition-colors duration-300 cursor-pointer font-inter text-xs tracking-widest uppercase flex items-center gap-2 bg-transparent border-none outline-none"
              aria-label="Close search"
            >
              <span>Close</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="4" x2="20" y2="20" />
                <line x1="20" y1="4" x2="4" y2="20" />
              </svg>
            </button>
          </div>

          <div className="max-w-[1200px] w-full mx-auto flex flex-col flex-1 min-h-0 pb-16">
            {/* Search Input Box */}
            <div className="relative border-b border-[rgba(246,246,246,0.15)] pb-4 mb-12 flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PRODUCTS..."
                className="w-full bg-transparent text-[#F6F6F6] font-anton text-3xl md:text-5xl uppercase tracking-wider outline-none placeholder-[rgba(246,246,246,0.2)] border-none focus:ring-0 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[rgba(246,246,246,0.4)] hover:text-[#F6F6F6] text-xs uppercase tracking-widest transition-colors duration-200 bg-transparent border-none outline-none cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Content area: results or suggestions */}
            <div className="flex-1 overflow-y-auto pr-2">
              {searchQuery.trim() === '' ? (
                /* Suggestion lists / Quick links */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="font-anton text-sm tracking-[0.15em] text-[rgba(246,246,246,0.3)] uppercase mb-6">
                      Suggested Categories
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {navMenu.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSearchQuery(cat.label)}
                          className="px-5 py-2.5 border border-[rgba(246,246,246,0.1)] text-[#F6F6F6] hover:border-crimson hover:text-crimson text-xs uppercase tracking-widest font-medium rounded-none bg-[rgba(246,246,246,0.02)] transition-all duration-300 cursor-pointer"
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-anton text-sm tracking-[0.15em] text-[rgba(246,246,246,0.3)] uppercase mb-6">
                      Popular Items
                    </h3>
                    <div className="flex flex-col gap-3">
                      {products.slice(0, 4).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => setSearchQuery(prod.name)}
                          className="text-left text-[rgba(246,246,246,0.7)] hover:text-crimson font-inter text-sm uppercase tracking-wider transition-colors duration-200 cursor-pointer bg-transparent border-none outline-none"
                        >
                          {prod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Results Grid */
                <div>
                  <div className="flex justify-between items-center mb-8 border-b border-[rgba(246,246,246,0.05)] pb-3">
                    <span className="font-inter text-xs tracking-widest text-[rgba(246,246,246,0.4)] uppercase">
                      Results ({filteredProducts.length})
                    </span>
                  </div>

                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                      {filteredProducts.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="group flex flex-col"
                        >
                          <div className="relative aspect-[3/4] bg-[rgba(246,246,246,0.02)] overflow-hidden mb-4 border border-[rgba(246,246,246,0.05)]">
                            <img
                              src={product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Overlay element to dim on hover */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
                          </div>
                          <span className="font-anton text-xs tracking-[0.1em] text-[rgba(246,246,246,0.4)] uppercase mb-1">
                            {product.category}
                          </span>
                          <h4 className="font-anton text-sm text-[#F6F6F6] group-hover:text-crimson transition-colors duration-300 truncate">
                            {product.name}
                          </h4>
                          <span className="font-inter text-xs text-[rgba(246,246,246,0.6)] mt-1">
                            {product.price}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="font-anton text-lg text-[rgba(246,246,246,0.3)] uppercase mb-3">
                        No results found
                      </span>
                      <p className="font-inter text-xs text-[rgba(246,246,246,0.5)] max-w-sm">
                        We couldn't find anything matching "{searchQuery}". Double-check spelling or try searching categories like "menswear".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
