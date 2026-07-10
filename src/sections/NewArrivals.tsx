import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../admin/store/SiteDataContext';

gsap.registerPlugin(ScrollTrigger);

function ProductCard({ id, name, price, image }: {
  id: string;
  name: string;
  price: string;
  image: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/product/${id}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
          style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          loading="lazy"
        />
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
          }}
        >
          <span className="block bg-[#F6F6F6] text-[#050505] font-inter text-sm font-medium tracking-[0.06em] px-6 py-2.5 rounded-full uppercase whitespace-nowrap">
            Quick Add
          </span>
        </div>
      </div>
      <h3 className="font-inter text-[14px] text-[#F6F6F6] mt-3 leading-[1.5] truncate">{name}</h3>
      <p className="font-inter text-[11px] tracking-[0.05em] text-[rgba(246,246,246,0.6)] mt-1">
        {price}
      </p>
    </Link>
  );
}

export default function NewArrivals() {
  const { products, frontpage } = useSiteData();
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      const cards = gridRef.current?.querySelectorAll('.group');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="new-arrivals"
      style={{
        background: '#050505',
        padding: 'clamp(80px, 10vh, 140px) clamp(20px, 3vw, 48px)',
      }}
    >
      <h2
        ref={titleRef}
        className="font-anton text-[clamp(48px,8vw,120px)] text-[#F6F6F6] leading-[0.9] tracking-[-0.02em] mb-12"
        style={{ opacity: 0 }}
      >
        {frontpage.newArrivals.title}
      </h2>

      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.images[0]}
          />
        ))}
      </div>
    </section>
  );
}
