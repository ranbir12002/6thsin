import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router';
import gsap from 'gsap';
import type { Product } from '../types/product';
import { useSiteData } from '../admin/store/SiteDataContext';
import Footer from '../sections/Footer';

function ImageGallery({ product }: { product: Product }) {
  const images = product.images.length > 0
    ? product.images
    : Array(6).fill('/images/product-1.jpg');

  const groups: { big: string; small: string[] }[] = [];
  for (let i = 0; i < images.length; i += 3) {
    groups.push({
      big: images[i],
      small: images.slice(i + 1, i + 3),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-4">
          <div className="relative overflow-hidden bg-[#111]">
            <img
              src={group.big}
              alt={`${product.name} view ${gi * 3 + 1}`}
              className="w-full h-auto object-cover"
              style={{ aspectRatio: '3/4' }}
            />
          </div>
          {group.small.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
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
  );
}

function ColorSelector({ colors, selected, onSelect }: {
  colors: { name: string; hex: string }[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div>
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
  );
}

function SizeSelector({ sizes, selected, onSelect }: {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
}) {
  return (
    <div>
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
  );
}

function Accordion({ items }: {
  items: { title: string; content: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-t border-[rgba(246,246,246,0.15)]">
      {items.map((item, i) => (
        <div key={i} className="border-b border-[rgba(246,246,246,0.15)]">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 cursor-pointer group"
          >
            <span className="font-inter text-[13px] tracking-[0.06em] text-[#F6F6F6] uppercase">
              {item.title}
            </span>
            <svg
              className={`w-3 h-3 text-[#F6F6F6] transition-transform duration-300 ${
                openIndex === i ? 'rotate-180' : ''
              }`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: openIndex === i ? '500px' : '0',
              opacity: openIndex === i ? 1 : 0,
            }}
          >
            <p className="font-inter text-[14px] text-[rgba(246,246,246,0.7)] leading-[1.8] pb-4">
              {item.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProductById, getRelatedProducts } = useSiteData();
  const product = getProductById(id || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      window.scrollTo(0, 0);
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [id]);

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

  useEffect(() => {
    if (!selectedColor && product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
  }, [product, selectedColor]);

  const relatedProducts = getRelatedProducts(product);

  const accordionItems = [
    {
      title: 'Description & Fit',
      content: `${product.description}\n\nFit: ${product.fit}`,
    },
    {
      title: 'Materials & Suppliers',
      content: `${product.material}\n\nMade in ${product.countryOfProduction}\nArticle Number: ${product.articleNumber}`,
    },
    {
      title: 'Care Guide',
      content: product.careInstructions.join('\n'),
    },
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh' }}>
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
      <div ref={contentRef} className="max-w-[1440px] mx-auto px-6 md:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left — Image Gallery */}
          <ImageGallery product={product} />

          {/* Right — Product Info */}
          <div className="flex flex-col gap-8 md:sticky md:top-28">
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
  );
}
