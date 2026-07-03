import { useEffect, useRef } from 'react';

const categories = [
  { name: 'MENSWEAR', image: '/images/category-menswear.jpg' },
  { name: 'WOMENSWEAR', image: '/images/category-womenswear.jpg' },
  { name: 'HOME', image: '/images/category-home.jpg' },
  { name: 'ACCESSORIES', image: '/images/category-accessories.jpg' },
  { name: 'ACTIVEWEAR', image: '/images/category-activewear.jpg' },
  { name: 'LOOKBOOK', image: '/images/category-lookbook.jpg' },
];

const filterConfig = {
  brightness: { min: 0.2, max: 1.2, pow: 1 },
  saturate: { min: 0.2, max: 1.2, pow: 1 },
  contrast: { min: 0.8, max: 1.5, pow: 1 },
};

function clamp(val: number, min: number, max: number) {
  return val < min ? min : val > max ? max : val;
}

function map(x: number, a: number, b: number, c: number, d: number) {
  return clamp((x - a) * (d - c) / (b - a) + c, Math.min(c, d), Math.max(c, d));
}

export default function CategorySlider() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef({ current: 0, target: 0, ease: 0.1 });
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !track || cards.length === 0) return;

    const scroll = scrollRef.current;
    const maxScroll = 3000;

    function updateCards(_progress: number) {
      cards.forEach((card) => {
        const cardWidth = card.offsetWidth;
        const cardCenter = card.offsetLeft + cardWidth / 2 - scroll.current;
        const viewportCenter = window.innerWidth / 2;
        const distance = (cardCenter - viewportCenter) / viewportCenter;

        const imageOffset = -distance * 100 * 0.2;
        const titleOffset = distance * 100 * 0.1;
        const titleScale = 1 + Math.abs(distance) * 0.1;

        const imageEl = card.querySelector('.card__image') as HTMLElement;
        const titleEl = card.querySelector('.card__title') as HTMLElement;
        const imgEl = card.querySelector('img') as HTMLElement;

        if (imageEl) imageEl.style.transform = `translate3d(${imageOffset}px, 0, 0)`;
        if (titleEl) titleEl.style.transform = `translate3d(${titleOffset}px, 0, 0) scale(${titleScale})`;

        const normalizedPos = 1 - Math.abs(distance);
        const filters = Object.entries(filterConfig).map(([key, config]) => {
          return `${key}(${map(normalizedPos, 0, 1, config.min, config.max)})`;
        });
        if (imgEl) imgEl.style.filter = filters.join(' ');
      });
    }

    function updateEngine() {
      if (!isDraggingRef.current) {
        scroll.target *= 1 - scroll.ease;
      }
      scroll.current += scroll.target;
      scroll.current = clamp(scroll.current, -maxScroll, maxScroll);

      const progress = clamp(scroll.current / maxScroll, -1, 1);

      if (track) {
        track.style.transform = `translate3d(${-scroll.current}px, -50%, 0)`;
      }

      updateCards(progress);
      rafRef.current = requestAnimationFrame(updateEngine);
    }

    // Wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scroll.target += e.deltaY;
    };
    section.addEventListener('wheel', handleWheel, { passive: false });

    // Mouse drag
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.pageX;
      scrollLeftRef.current = scroll.current;
      section.style.cursor = 'grabbing';
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const x = e.pageX;
      const walk = (x - startXRef.current) * 2;
      scroll.target = scrollLeftRef.current + walk - scroll.current;
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      section.style.cursor = 'grab';
    };
    section.addEventListener('mousedown', handleMouseDown);
    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseup', handleMouseUp);

    // Touch
    const handleTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].pageX;
      scrollLeftRef.current = scroll.current;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const x = e.touches[0].pageX;
      const walk = (x - startXRef.current) * 2;
      scroll.target = scrollLeftRef.current + walk - scroll.current;
    };
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };
    section.addEventListener('touchstart', handleTouchStart, { passive: true });
    section.addEventListener('touchmove', handleTouchMove, { passive: true });
    section.addEventListener('touchend', handleTouchEnd);

    rafRef.current = requestAnimationFrame(updateEngine);

    return () => {
      cancelAnimationFrame(rafRef.current);
      section.removeEventListener('wheel', handleWheel);
      section.removeEventListener('mousedown', handleMouseDown);
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseup', handleMouseUp);
      section.removeEventListener('touchstart', handleTouchStart);
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="relative w-full overflow-hidden cursor-grab select-none"
      style={{
        height: '100vh',
        background: '#050505',
        '--carousel-width': '100vw',
        '--card-width': window.innerWidth < 768 ? '260px' : '320px',
        '--card-height': window.innerWidth < 768 ? '390px' : '480px',
      } as React.CSSProperties}
    >
      {/* Track */}
      <div
        ref={trackRef}
        className="absolute top-1/2 left-0 flex gap-8"
        style={{
          transform: 'translateY(-50%)',
          willChange: 'transform',
          padding: '0 calc((100vw - var(--card-width)) / 2)',
        }}
      >
        {categories.map((cat, index) => (
          <div
            key={cat.name}
            ref={(el) => { cardsRef.current[index] = el; }}
            className="relative overflow-hidden rounded flex-shrink-0"
            style={{
              width: 'var(--card-width)',
              height: 'var(--card-height)',
            }}
          >
            {/* Image */}
            <div
              className="card__image absolute inset-0 overflow-hidden"
              style={{ willChange: 'transform' }}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover"
                style={{ willChange: 'transform' }}
                loading="lazy"
              />
            </div>

            {/* Title */}
            <div
              className="card__title absolute z-10 text-[#F6F6F6]"
              style={{
                bottom: '2rem',
                left: '2rem',
                willChange: 'transform',
              }}
            >
              <h2
                className="font-inter font-medium tracking-[-0.02em] leading-[1.05]"
                style={{ fontSize: 'clamp(28px, 4vw, 56px)' }}
              >
                {cat.name}
              </h2>
              <a
                href="#"
                className="inline-block mt-3 font-inter text-sm font-medium tracking-[0.06em] text-crimson uppercase hover:underline transition-all"
              >
                Shop Now &rarr;
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}