import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import gsap from 'gsap';
import type { Product } from '../types/product';
import { useSiteData } from '../admin/store/SiteDataContext';
import Footer from '../sections/Footer';

function ImageGallery({ product }: { product: Product }) {
  const images = product.images.length > 0
    ? product.images
    : Array(6).fill('/images/product-1.jpg');

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groups: { big: string; small: string[] }[] = [];
  for (let i = 0; i < images.length; i += 3) {
    groups.push({
      big: images[i],
      small: images.slice(i + 1, i + 3),
    });
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentSlide(index);
  }, []);

  return (
    <>
      {/* Mobile: Horizontal scroll carousel */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((src, i) => (
            <div key={i} className="snap-center shrink-0 w-full">
              <div className="relative overflow-hidden bg-[#f5f5f5]">
                <img
                  src={src}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full object-cover"
                  style={{ aspectRatio: '3/4' }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-1.5 py-3 bg-white">
          {images.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-2 h-2 bg-black'
                  : 'w-1.5 h-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid gallery (unchanged) */}
      <div className="hidden md:flex flex-col">
        {groups.map((group, gi) => (
          <div key={gi} className="flex flex-col">
            <div className="relative overflow-hidden bg-[#111]">
              <img
                src={group.big}
                alt={`${product.name} view ${gi * 3 + 1}`}
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '3/4' }}
              />
            </div>
            {group.small.length > 0 && (
              <div className="grid grid-cols-2">
                {group.small.map((src, si) => (
                  <div key={si} className="relative overflow-hidden bg-[#111]">
                    <img
                      src={src}
                      alt={`${product.name} view ${gi * 3 + si + 2}`}
                      className="w-full h-auto object-cover"
                      style={{ aspectRatio: '3/4' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ColorSelector({ colors, selected, onSelect }: {
  colors: { name: string; hex: string }[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-inter text-[13px] text-black uppercase">
            Colour:
          </span>
          <span className="font-inter text-[13px] text-black">{selected}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className={`shrink-0 w-[60px] h-[72px] border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                c.name === selected
                  ? 'border-black'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            >
              {c.name === selected && (
                <svg className="w-4 h-4 text-white drop-shadow-md" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 8 7 12 13 4" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-3">
          <span className="font-inter text-[13px] tracking-[0.06em] text-[rgba(246,246,246,0.6)] uppercase">
            Colour
          </span>
          <span className="font-inter text-[13px] text-[#F6F6F6]">{selected}</span>
        </div>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                c.name === selected
                  ? 'border-[#F6F6F6] scale-110'
                  : 'border-[rgba(246,246,246,0.2)] hover:border-[rgba(246,246,246,0.5)]'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SizeSelector({ sizes, selected, onSelect }: {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
}) {
  return (
    <div>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="font-inter text-[13px] text-black uppercase">
            Size
          </span>
          <button className="font-inter text-[13px] text-black underline underline-offset-4 cursor-pointer hover:opacity-70 transition-opacity">
            SIZE GUIDE
          </button>
        </div>
        <div className="flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSelect(size)}
              className={`flex-1 font-inter text-[13px] py-3 border transition-all duration-200 cursor-pointer ${
                size === selected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 text-black hover:border-black bg-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-3">
          <span className="font-inter text-[13px] tracking-[0.06em] text-[rgba(246,246,246,0.6)] uppercase">
            Size
          </span>
          <button className="font-inter text-[12px] text-crimson underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity">
            Size Guide
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onSelect(size)}
              className={`font-inter text-[13px] py-3 border transition-all duration-200 cursor-pointer ${
                size === selected
                  ? 'border-[#F6F6F6] bg-[#F6F6F6] text-[#050505]'
                  : 'border-[rgba(246,246,246,0.2)] text-[#F6F6F6] hover:border-[rgba(246,246,246,0.5)] bg-transparent'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Accordion({ items, variant = 'dark' }: {
  items: { title: string; content: string }[];
  variant?: 'dark' | 'light';
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const isLight = variant === 'light';
  const borderColor = isLight ? 'border-gray-200' : 'border-[rgba(246,246,246,0.15)]';
  const textColor = isLight ? 'text-black' : 'text-[#F6F6F6]';
  const contentColor = isLight ? 'text-gray-600' : 'text-[rgba(246,246,246,0.7)]';
  const iconColor = isLight ? 'text-black' : 'text-[#F6F6F6]';

  return (
    <div className={`border-t ${borderColor}`}>
      {items.map((item, i) => (
        <div key={i} className={`border-b ${borderColor}`}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 cursor-pointer group"
          >
            <span className={`font-inter text-[13px] tracking-[0.06em] ${textColor} uppercase`}>
              {item.title}
            </span>
            <svg
              className={`w-4 h-4 ${iconColor} transition-transform duration-300 ${
                openIndex === i ? 'rotate-45' : ''
              }`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: openIndex === i ? '500px' : '0',
              opacity: openIndex === i ? 1 : 0,
            }}
          >
            <p className={`font-inter text-[14px] ${contentColor} leading-[1.8] pb-4`}>
              {item.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, variant = 'dark' }: { product: Product; variant?: 'dark' | 'light' }) {
  const [hovered, setHovered] = useState(false);
  const isLight = variant === 'light';

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block shrink-0 w-[321.703px] md:w-auto md:shrink"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden bg-[#f5f5f5] w-[321.703px] h-[482.547px] md:w-full md:h-auto md:aspect-[3/4]">
        <img
          src={product.images[0] || '/images/product-1.jpg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
          style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          loading="lazy"
        />
        {/* Heart icon */}
        <button
          className={`absolute bottom-3 left-3 p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            isLight
              ? 'bg-white/80 hover:bg-white text-gray-700'
              : 'bg-black/30 hover:bg-black/50 text-white'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {/* Quick Add overlay (desktop) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
            isLight ? 'hidden' : ''
          }`}
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
      <h3 className={`font-inter text-[13px] mt-2 leading-[1.4] truncate ${
        isLight ? 'text-black' : 'text-[#F6F6F6]'
      }`}>{product.name}</h3>
      <p className={`font-inter text-[12px] mt-0.5 ${
        isLight ? 'text-gray-500' : 'text-[rgba(246,246,246,0.6)]'
      }`}>
        {product.price}
      </p>
      {product.colors && product.colors.length > 0 && (
        <div className="flex gap-1 mt-1.5">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c.name}
              className={`block w-3 h-3 rounded-sm border ${
                isLight ? 'border-gray-300' : 'border-[rgba(246,246,246,0.2)]'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      )}
    </Link>
  );
}

function HorizontalProductScroll({ products, variant = 'dark' }: {
  products: Product[];
  variant?: 'dark' | 'light';
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} variant={variant} />
      ))}
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <span className="font-inter text-[13px] text-black uppercase tracking-wide">
          REVIEWS [7]
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4].map((star) => (
            <svg key={star} className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
          <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="font-inter text-[13px] text-black ml-1">4</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProductById, getRelatedProducts } = useSiteData();
  const product = getProductById(id || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const desktopContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const ref = isMobile ? mobileContentRef.current : desktopContentRef.current;
    if (ref) {
      window.scrollTo(0, 0);
      gsap.fromTo(
        ref,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [id]);

  useEffect(() => {
    if (product && !selectedColor && product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
  }, [product, selectedColor]);

  if (!product) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: '#050505' }}
      >
        <h1 className="font-anton text-[clamp(32px,6vw,80px)] text-[#F6F6F6] mb-6">
          Product Not Found
        </h1>
        <Link
          to="/"
          className="font-inter text-sm tracking-[0.06em] text-crimson uppercase underline underline-offset-4"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts(product);
  const styleWithProducts = relatedProducts.slice(0, 4);
  const similarProducts = relatedProducts.slice(0, 4);

  const accordionItems = [
    {
      title: 'Description & Fit',
      content: `${product.description}\n\nFit: ${product.fit}`,
    },
    {
      title: 'Materials',
      content: `${product.material}\n\nMade in ${product.countryOfProduction}\nArticle Number: ${product.articleNumber}`,
    },
    {
      title: 'Care Guide',
      content: product.careInstructions.join('\n'),
    },
  ];

  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden" style={{ background: '#ffffff', minHeight: '100vh' }}>
        <div ref={mobileContentRef} className="pt-16">
          {/* Image Carousel */}
          <ImageGallery product={product} />

          <div className="px-4 pb-6">
            {/* Product Name & Price */}
            <div className="pt-4 pb-3">
              <h1 className="font-inter text-[16px] font-semibold text-black uppercase leading-tight">
                {product.name}
              </h1>
              <p className="font-inter text-[15px] text-black mt-2">{product.price}</p>
              <p className="font-inter text-[12px] text-gray-500 mt-1">MRP inclusive of all taxes</p>
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="py-3 border-t border-gray-200">
                <ColorSelector
                  colors={product.colors}
                  selected={selectedColor || product.colors[0].name}
                  onSelect={setSelectedColor}
                />
              </div>
            )}

            {/* Size Selector */}
            <div className="py-3 border-t border-gray-200">
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
              />
            </div>

            {/* Add to Bag */}
            <div className="pt-3 pb-2">
              <button
                className={`w-full font-inter text-[14px] font-medium tracking-[0.06em] uppercase py-4 transition-all duration-300 cursor-pointer ${
                  selectedSize
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!selectedSize}
              >
                {selectedSize ? 'ADD TO BAG' : 'SELECT A SIZE'}
              </button>
            </div>

            {/* Find in store */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="font-inter text-[13px] text-black">Find in store</span>
              <button className="font-inter text-[13px] text-black font-medium underline underline-offset-4 cursor-pointer hover:opacity-70 transition-opacity">
                CHECK AVAILABILITY
              </button>
            </div>

            {/* Reviews */}
            <ReviewsSection />

            {/* Accordion */}
            <Accordion items={accordionItems} variant="light" />
          </div>

          {/* Style With */}
          {styleWithProducts.length > 0 && (
            <div className="px-4 py-6 border-t border-gray-200">
              <h2 className="font-inter text-[14px] font-semibold text-black uppercase tracking-wide mb-4">
                STYLE WITH
              </h2>
              <HorizontalProductScroll products={styleWithProducts} variant="light" />
            </div>
          )}

          {/* Similar Items */}
          {similarProducts.length > 0 && (
            <div className="px-4 py-6 border-t border-gray-200">
              <h2 className="font-inter text-[14px] font-semibold text-black uppercase tracking-wide mb-4">
                SIMILAR ITEMS
              </h2>
              <HorizontalProductScroll products={similarProducts} variant="light" />
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* ===== DESKTOP LAYOUT (UNCHANGED) ===== */}
      <div className="hidden md:block" style={{ background: '#050505', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-24 pb-4">
          <nav className="flex items-center gap-2 text-[11px] tracking-[0.05em]">
            <Link to="/" className="text-[rgba(246,246,246,0.5)] hover:text-crimson transition-colors uppercase">
              Home
            </Link>
            <span className="text-[rgba(246,246,246,0.3)]">/</span>
            <span className="text-[rgba(246,246,246,0.5)] uppercase">{product.category}</span>
            <span className="text-[rgba(246,246,246,0.3)]">/</span>
            <span className="text-[rgba(246,246,246,0.5)] uppercase">{product.subcategory}</span>
            <span className="text-[rgba(246,246,246,0.3)]">/</span>
            <span className="text-[#F6F6F6] uppercase truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        {/* Main Content */}
        <div ref={desktopContentRef} className="max-w-[1440px] mx-auto px-6 md:px-12 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Left — Image Gallery */}
            <ImageGallery product={product} />

            {/* Right — Product Info */}
            <div className="flex flex-col gap-8 md:sticky md:top-28 self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
              {/* Title & Price */}
              <div>
                <h1 className="font-anton text-[clamp(36px,5vw,64px)] text-[#F6F6F6] leading-[0.9] tracking-[-0.02em]">
                  {product.name}
                </h1>
                <p className="font-inter text-[20px] text-[#F6F6F6] mt-4">{product.price}</p>
              </div>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <ColorSelector
                  colors={product.colors}
                  selected={selectedColor || product.colors[0].name}
                  onSelect={setSelectedColor}
                />
              )}

              {/* Size Selector */}
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
              />

              {/* Add to Bag */}
              <button
                className={`w-full font-inter text-sm font-medium tracking-[0.06em] uppercase py-4 transition-all duration-300 cursor-pointer ${
                  selectedSize
                    ? 'bg-crimson text-[#F6F6F6] hover:brightness-90'
                    : 'bg-[rgba(246,246,246,0.1)] text-[rgba(246,246,246,0.4)] cursor-not-allowed'
                }`}
                disabled={!selectedSize}
              >
                {selectedSize ? `Add to Bag — ${product.price}` : 'Select a Size'}
              </button>

              {/* Delivery Info */}
              <div className="flex flex-col gap-3 py-4 border-t border-b border-[rgba(246,246,246,0.15)]">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[rgba(246,246,246,0.5)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M8 1L1 4v4c0 4 3 7 7 8 4-1 7-4 7-8V4L8 1z" />
                  </svg>
                  <span className="font-inter text-[12px] text-[rgba(246,246,246,0.6)]">
                    Free standard delivery on orders over £100
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[rgba(246,246,246,0.5)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="1" y="4" width="14" height="10" rx="1" />
                    <path d="M4 11h8" />
                  </svg>
                  <span className="font-inter text-[12px] text-[rgba(246,246,246,0.6)]">
                    Free 30-day returns — no questions asked
                  </span>
                </div>
              </div>

              {/* Accordion Details */}
              <Accordion items={accordionItems} />
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="font-anton text-[clamp(32px,5vw,56px)] text-[#F6F6F6] leading-[0.9] tracking-[-0.02em] mb-10">
                YOU MAY ALSO LIKE
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
