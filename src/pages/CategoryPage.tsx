import { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import gsap from 'gsap';
import type { Product } from '../types/product';
import { useSiteData } from '../admin/store/SiteDataContext';
import { slugify } from '../lib/utils';
import Footer from '../sections/Footer';

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <img
          src={product.images[0] || '/images/product-1.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
          style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          loading="lazy"
        />
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(10px)',
          }}
        >
          <span className="block bg-[#F6F6F6] text-[#050505] font-inter text-sm font-medium tracking-[0.06em] px-6 py-2.5 rounded-full uppercase whitespace-nowrap">
            Quick Add
          </span>
        </div>
      </div>
      <h3 className="font-inter text-[15px] text-[#F6F6F6] mt-3 leading-[1.6]">{product.name}</h3>
      <p className="font-inter text-[11px] tracking-[0.05em] text-[rgba(246,246,246,0.6)] mt-1">
        {product.price}
      </p>
    </Link>
  );
}

function FilterTag({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-inter text-[12px] tracking-[0.06em] uppercase px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-[#F6F6F6] text-[#050505] border-[#F6F6F6]'
          : 'bg-transparent text-[rgba(246,246,246,0.6)] border-[rgba(246,246,246,0.2)] hover:border-[rgba(246,246,246,0.5)] hover:text-[#F6F6F6]'
      }`}
    >
      {label}
    </button>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-inter text-[11px] tracking-[0.06em] uppercase bg-crimson/20 text-crimson px-3 py-1.5 rounded-full border border-crimson/30">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors cursor-pointer">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="3" x2="9" y2="9" />
          <line x1="9" y1="3" x2="3" y2="9" />
        </svg>
      </button>
    </span>
  );
}

export default function CategoryPage() {
  const { category: categorySlug, subcategory: subcategorySlug } = useParams();
  const { products, navMenu } = useSiteData();
  const contentRef = useRef<HTMLDivElement>(null);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const matchedCategory = navMenu.find(c => slugify(c.label) === categorySlug);
  const matchedItem = matchedCategory?.children.find(
    item => slugify(item.label) === subcategorySlug
  );

  const categoryFilter = matchedCategory?.label ?? (
    products.find(p => slugify(p.category) === categorySlug)?.category ?? ''
  );

  const isNewArrivals = subcategorySlug === 'new-arrivals';

  const baseProducts = useMemo(() => {
    let result = products;

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (subcategorySlug && !isNewArrivals) {
      if (matchedItem) {
        result = result.filter(p => p.subcategory === matchedItem.label);
      } else {
        result = result.filter(p => slugify(p.subcategory) === subcategorySlug);
      }
    }

    return result;
  }, [products, categoryFilter, subcategorySlug, isNewArrivals, matchedItem]);

  const availableSizes = useMemo(() => {
    const all = baseProducts.flatMap(p => p.sizes);
    return [...new Set(all)].sort();
  }, [baseProducts]);

  const availableColors = useMemo(() => {
    const all = baseProducts.flatMap(p => p.colors ?? []);
    const seen = new Set<string>();
    return all.filter(c => {
      const dup = seen.has(c.name);
      seen.add(c.name);
      return !dup;
    });
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
    let result = baseProducts;

    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes.some(s => selectedSizes.includes(s)));
    }

    if (selectedColors.length > 0) {
      result = result.filter(p => p.colors?.some(c => selectedColors.includes(c.name)));
    }

    return result;
  }, [baseProducts, selectedSizes, selectedColors]);

  const pageTitle = matchedItem?.label ?? matchedCategory?.label ?? categorySlug ?? '';
  const pageSubtitle = matchedCategory?.label && matchedItem?.label
    ? matchedCategory.label
    : '';

  useEffect(() => {
    if (contentRef.current) {
      window.scrollTo(0, 0);
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    setSelectedSizes([]);
    setSelectedColors([]);
  }, [categorySlug, subcategorySlug]);

  const isEditorialCategory = matchedCategory && baseProducts.length === 0 &&
    !products.some(p => p.category === categoryFilter);

  function toggleSize(size: string) {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  }

  function toggleColor(color: string) {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  }

  function clearAllFilters() {
    setSelectedSizes([]);
    setSelectedColors([]);
  }

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0;

  return (
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-28 pb-2">
        <nav className="flex items-center gap-2 text-[11px] tracking-[0.05em]">
          <Link to="/" className="text-[rgba(246,246,246,0.5)] hover:text-crimson transition-colors uppercase">
            Home
          </Link>
          {matchedCategory && (
            <>
              <span className="text-[rgba(246,246,246,0.3)]">/</span>
              <span className="text-[rgba(246,246,246,0.5)] uppercase">{matchedCategory.label}</span>
            </>
          )}
          {matchedItem && (
            <>
              <span className="text-[rgba(246,246,246,0.3)]">/</span>
              <span className="text-[#F6F6F6] uppercase">{matchedItem.label}</span>
            </>
          )}
        </nav>
      </div>

      <div ref={contentRef} className="max-w-[1440px] mx-auto px-6 md:px-12 pb-20">
        <div className="py-8 md:py-12">
          <h1 className="font-anton text-[clamp(48px,8vw,120px)] text-[#F6F6F6] leading-[0.9] tracking-[-0.02em]">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="font-inter text-[13px] tracking-[0.06em] text-[rgba(246,246,246,0.5)] uppercase mt-2">
              {pageSubtitle}
            </p>
          )}
          {!isEditorialCategory && (
            <p className="font-inter text-[14px] text-[rgba(246,246,246,0.5)] mt-4">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>

        {isEditorialCategory && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full border border-[rgba(246,246,246,0.1)] flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[rgba(246,246,246,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M16 8h.01" />
              </svg>
            </div>
            <h2 className="font-anton text-[clamp(28px,4vw,48px)] text-[rgba(246,246,246,0.6)] leading-[1.1] mb-4">
              Coming Soon
            </h2>
            <p className="font-inter text-[14px] text-[rgba(246,246,246,0.4)] max-w-md">
              We are curating something special for this collection. Sign up to be notified when it drops.
            </p>
          </div>
        )}

        {!isEditorialCategory && baseProducts.length > 0 && (
          <div className="flex flex-col gap-6 py-6 border-t border-b border-[rgba(246,246,246,0.08)] mb-8">
            {hasActiveFilters && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-inter text-[11px] tracking-[0.06em] text-[rgba(246,246,246,0.4)] uppercase mr-1">
                  Filters:
                </span>
                {selectedSizes.map(size => (
                  <ActiveFilterChip
                    key={size}
                    label={`Size: ${size}`}
                    onRemove={() => toggleSize(size)}
                  />
                ))}
                {selectedColors.map(color => (
                  <ActiveFilterChip
                    key={color}
                    label={`Color: ${color}`}
                    onRemove={() => toggleColor(color)}
                  />
                ))}
                <button
                  onClick={clearAllFilters}
                  className="font-inter text-[11px] tracking-[0.06em] text-[rgba(246,246,246,0.4)] underline underline-offset-2 hover:text-[#F6F6F6] transition-colors ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-inter text-[11px] tracking-[0.06em] text-[rgba(246,246,246,0.4)] uppercase mr-2 w-10 shrink-0">
                  Size
                </span>
                {availableSizes.map(size => (
                  <FilterTag
                    key={size}
                    label={size}
                    active={selectedSizes.includes(size)}
                    onClick={() => toggleSize(size)}
                  />
                ))}
              </div>
            )}

            {availableColors.length > 0 && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-inter text-[11px] tracking-[0.06em] text-[rgba(246,246,246,0.4)] uppercase mr-2 w-10 shrink-0">
                  Color
                </span>
                {availableColors.map(c => (
                  <button
                    key={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                      selectedColors.includes(c.name)
                        ? 'border-[#F6F6F6] scale-110'
                        : 'border-[rgba(246,246,246,0.2)] hover:border-[rgba(246,246,246,0.5)]'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!isEditorialCategory && (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="font-inter text-[15px] text-[rgba(246,246,246,0.5)] mb-4">
                  {baseProducts.length === 0
                    ? 'No products found in this category.'
                    : 'No products match your filters.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="font-inter text-[13px] tracking-[0.06em] text-crimson uppercase underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
                {baseProducts.length === 0 && (
                  <Link
                    to="/"
                    className="font-inter text-[13px] tracking-[0.06em] text-crimson uppercase underline underline-offset-4 hover:opacity-80 transition-opacity mt-2"
                  >
                    Return to Home
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
