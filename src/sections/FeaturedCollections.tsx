import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../admin/store/SiteDataContext';

gsap.registerPlugin(ScrollTrigger);

export default function FeaturedCollections() {
  const { frontpage } = useSiteData();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);

  const dbImages = frontpage.featuredCollections.images || [];
  const image1 = dbImages[0] || '/images/collection-editorial-1.jpg';
  const image2 = dbImages[1] || '/images/collection-editorial-2.jpg';

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        bodyRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.4,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      const images = imagesRef.current?.querySelectorAll('img');
      if (images) {
        gsap.fromTo(
          images,
          { y: 80, opacity: 0, scale: 1.05 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.2,
            scrollTrigger: {
              trigger: imagesRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [image1, image2]); // Re-run effect if images change

  return (
    <section
      ref={sectionRef}
      id="featured"
      style={{
        background: '#FAF5EF',
        padding: 'clamp(80px, 10vh, 140px) clamp(20px, 3vw, 48px)',
      }}
    >
      {/* Text Block */}
      <div className="max-w-[800px] mx-auto text-center mb-16 overflow-hidden">
        <h2
          ref={headingRef}
          className="font-anton text-[clamp(24px,4.5vw,56px)] text-[#050505] leading-none tracking-[-0.02em] mb-8 whitespace-nowrap overflow-hidden text-ellipsis uppercase"
          style={{ opacity: 0 }}
        >
          {frontpage.featuredCollections.heading}
        </h2>
        <p
          ref={bodyRef}
          className="font-inter text-[15px] leading-[1.6] tracking-[0.01em] text-[#050505] mx-auto max-w-[560px] mb-8"
          style={{ opacity: 0 }}
        >
          {frontpage.featuredCollections.body}
        </p>
        <a
          ref={ctaRef}
          href="#"
          className="inline-block font-inter text-sm font-medium tracking-[0.06em] text-crimson uppercase relative group"
          style={{ opacity: 0 }}
        >
          {frontpage.featuredCollections.ctaText} &rarr;
          <span className="absolute bottom-0 left-0 w-full h-[1px] bg-crimson transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300" />
        </a>
      </div>

      {/* Side by Side Images */}
      <div
        ref={imagesRef}
        className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2"
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img
            src={image1}
            alt="Collection editorial"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div
          className="relative overflow-hidden border-t md:border-t-0 md:border-l border-[rgba(246,246,246,0.15)]"
          style={{ aspectRatio: '4/3' }}
        >
          <img
            src={image2}
            alt="Collection detail"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}