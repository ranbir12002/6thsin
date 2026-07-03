import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lookbookImages = [
  ['/images/lookbook-1.jpg', '/images/lookbook-2.jpg', '/images/lookbook-3.jpg', '/images/lookbook-4.jpg'],
  ['/images/lookbook-5.jpg', '/images/lookbook-6.jpg', '/images/lookbook-7.jpg', '/images/lookbook-8.jpg'],
  ['/images/lookbook-9.jpg', '/images/lookbook-10.jpg', '/images/lookbook-11.jpg', '/images/lookbook-12.jpg'],
];

export default function Lookbook() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Title animation
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

      // Column scroll animations
      const columns = columnsRef.current.filter(Boolean) as HTMLDivElement[];
      const scrollInstances: gsap.core.Tween[] = [];

      columns.forEach((column, pos) => {
        const isOdd = pos % 2 !== 0;
        const direction = isOdd ? -1 : 1;

        // Main column parallax
        const tween = gsap.to(column, {
          ease: 'none',
          startAt: { y: direction * 100 },
          y: direction * -100,
          scrollTrigger: {
            trigger: column,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
        scrollInstances.push(tween);

        // Per-item parallax
        const items = column.querySelectorAll<HTMLElement>('.gallery__item');
        items.forEach((item) => {
          const itemTween = gsap.fromTo(
            item,
            { y: -30 * direction },
            {
              y: 30 * direction,
              ease: 'none',
              scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
          scrollInstances.push(itemTween);
        });
      });

      // Hover state delegation
      const galleryEl = section.querySelector('.gallery__columns');
      if (galleryEl) {
        const handleMouseEnter = (e: Event) => {
          const target = (e as MouseEvent).target as HTMLElement;
          if (target.closest('.gallery__item')) {
            columns.forEach((col) => col.classList.add('is-active'));
          }
        };
        const handleMouseLeave = (e: Event) => {
          const target = (e as MouseEvent).target as HTMLElement;
          if (target.closest('.gallery__item')) {
            columns.forEach((col) => col.classList.remove('is-active'));
          }
        };
        galleryEl.addEventListener('mouseenter', handleMouseEnter);
        galleryEl.addEventListener('mouseleave', handleMouseLeave);
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="lookbook"
      className="relative w-full"
      style={{
        background: '#050505',
        paddingTop: 'clamp(80px, 10vh, 140px)',
      }}
    >
      <h2
        ref={titleRef}
        className="font-anton text-[clamp(48px,8vw,120px)] text-[#F6F6F6] leading-[0.9] tracking-[-0.02em] mb-12 px-[clamp(20px,3vw,48px)]"
        style={{ opacity: 0 }}
      >
        LOOKBOOK
      </h2>

      <div
        className="gallery__columns relative w-full flex justify-center overflow-hidden"
        style={{ padding: '10vh 0' }}
      >
        {lookbookImages.map((colImages, colIndex) => (
          <div
            key={colIndex}
            ref={(el) => { columnsRef.current[colIndex] = el; }}
            className="gallery__column flex-none px-[2.5vw] transition-all duration-500"
            style={{
              width: '22vw',
            }}
            data-scroll-speed={colIndex % 2 !== 0 ? '-1' : '1'}
          >
            {colImages.map((img, imgIndex) => (
              <div
                key={imgIndex}
                className="gallery__item relative transition-all duration-500 hover:scale-105 hover:z-10"
                style={{ margin: '10vh 0' }}
              >
                <div
                  className="gallery__item-img w-full overflow-hidden relative"
                  style={{
                    aspectRatio: '3/4',
                    willChange: 'transform',
                  }}
                >
                  <div
                    className="gallery__item-imginner w-full h-full bg-cover bg-center transition-all duration-500"
                    style={{
                      backgroundImage: `url(${img})`,
                      willChange: 'transform',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* View Full Lookbook Link */}
      <div className="text-center pb-12">
        <a
          href="#"
          className="inline-block font-inter text-sm font-medium tracking-[0.06em] text-crimson uppercase relative group"
        >
          VIEW FULL LOOKBOOK &rarr;
          <span className="absolute bottom-0 left-0 w-full h-[1px] bg-crimson transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300" />
        </a>
      </div>

      <style>{`
        .gallery__column.is-active .gallery__item {
          filter: grayscale(100%) blur(4px);
          opacity: 0.4;
        }
        .gallery__column.is-active .gallery__item:hover {
          filter: none;
          opacity: 1;
        }
        @media screen and (max-width: 768px) {
          .gallery__column {
            width: 80vw !important;
            padding: 0 !important;
          }
          .gallery__item {
            margin: 5vh 0 !important;
          }
          .gallery__columns {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
}