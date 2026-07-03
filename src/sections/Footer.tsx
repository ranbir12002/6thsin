import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const footer = footerRef.current;
    const grid = gridRef.current;
    if (!footer || !grid) return;

    const blocks = blocksRef.current.filter(Boolean) as HTMLDivElement[];
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // Grid entrance with 3D rotation
      tl.fromTo(
        grid,
        { rotateX: 15, transformOrigin: 'center bottom' },
        { rotateX: 0, duration: 1.2, ease: 'power3.out' },
        0
      );

      // Blocks entrance
      tl.fromTo(
        blocks,
        { y: 120, rotateX: -45, opacity: 0, transformOrigin: 'center bottom' },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          stagger: { amount: 0.6, from: 'start' },
        },
        '-=0.9'
      );

      // Links fade in
      tl.fromTo(
        '.footer__block a',
        { opacity: 0 },
        { opacity: 1, duration: 0.6, stagger: 0.03 },
        '-=0.4'
      );

      // Mouse tilt (desktop only)
      if (!isTouch) {
        const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let rafId: number;

        const handleMouseMove = (e: MouseEvent) => {
          targetX = (e.clientY / window.innerHeight - 0.5) * 4;
          targetY = (e.clientX / window.innerWidth - 0.5) * -4;
        };

        const animateTilt = () => {
          currentX = lerp(currentX, targetX, 0.08);
          currentY = lerp(currentY, targetY, 0.08);
          grid.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
          rafId = requestAnimationFrame(animateTilt);
        };

        footer.addEventListener('mousemove', handleMouseMove);
        rafId = requestAnimationFrame(animateTilt);

        return () => {
          footer.removeEventListener('mousemove', handleMouseMove);
          cancelAnimationFrame(rafId);
        };
      }
    }, footer);

    return () => ctx.revert();
  }, []);

  const setBlockRef = (index: number) => (el: HTMLDivElement | null) => {
    blocksRef.current[index] = el;
  };

  return (
    <footer
      ref={footerRef}
      className="footer relative overflow-hidden"
      style={{ background: '#050505', minHeight: '80vh' }}
    >
      {/* Grid */}
      <div
        ref={gridRef}
        className="footer__grid relative max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3"
        style={{
          perspective: '1500px',
        }}
      >
        {/* Column 1 */}
        <div className="flex flex-col">
          {/* Menswear */}
          <div
            ref={setBlockRef(0)}
            className="footer__block border-b border-r border-[rgba(246,246,246,0.15)] p-8 md:p-12"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <h3 className="font-inter text-[clamp(20px,2.5vw,32px)] font-medium text-[#F6F6F6] mb-6 tracking-[-0.02em]">
                MENSWEAR
              </h3>
              <nav className="flex flex-col gap-1">
                {['T-Shirts', 'Hoodies', 'Jackets', 'Trousers', 'Accessories'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-inter text-[15px] leading-8 text-[rgba(246,246,246,0.6)] no-underline hover:text-crimson hover:translate-x-1 transition-all duration-300"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          {/* Womenswear */}
          <div
            ref={setBlockRef(1)}
            className="footer__block border-b border-r border-[rgba(246,246,246,0.15)] p-8 md:p-12"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <h3 className="font-inter text-[clamp(20px,2.5vw,32px)] font-medium text-[#F6F6F6] mb-6 tracking-[-0.02em]">
                WOMENSWEAR
              </h3>
              <nav className="flex flex-col gap-1">
                {['Tops', 'Dresses', 'Outerwear', 'Bottoms', 'Accessories'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-inter text-[15px] leading-8 text-[rgba(246,246,246,0.6)] no-underline hover:text-crimson hover:translate-x-1 transition-all duration-300"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col">
          {/* Brand */}
          <div
            ref={setBlockRef(2)}
            className="footer__block border-b border-r border-[rgba(246,246,246,0.15)] p-8 md:p-12 flex flex-col justify-center items-center text-center"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <img
                src="/6thsinlogo.png"
                alt="6th SIN"
                className="w-auto max-w-[200px] md:max-w-[280px] h-auto mb-4"
              />
              <p className="font-inter text-xs tracking-[0.08em] text-[rgba(246,246,246,0.6)] uppercase">
                London, UK
              </p>
            </div>
          </div>
          {/* Newsletter */}
          <div
            ref={setBlockRef(3)}
            className="footer__block border-b border-r border-[rgba(246,246,246,0.15)] p-8 md:p-12"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <h3 className="font-inter text-[clamp(20px,2.5vw,32px)] font-medium text-[#F6F6F6] mb-6 tracking-[-0.02em]">
                JOIN THE INNER CIRCLE
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border-b border-[rgba(246,246,246,0.15)] text-[#F6F6F6] font-inter text-[15px] py-2 outline-none focus:border-crimson transition-colors placeholder:text-[rgba(246,246,246,0.4)]"
                />
                <button className="bg-crimson text-[#F6F6F6] font-inter text-sm font-medium tracking-[0.06em] px-6 py-2.5 uppercase hover:brightness-90 transition-all duration-200 cursor-pointer whitespace-nowrap">
                  SUBSCRIBE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col">
          {/* Company */}
          <div
            ref={setBlockRef(4)}
            className="footer__block border-b border-[rgba(246,246,246,0.15)] p-8 md:p-12"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <h3 className="font-inter text-[clamp(20px,2.5vw,32px)] font-medium text-[#F6F6F6] mb-6 tracking-[-0.02em]">
                COMPANY
              </h3>
              <nav className="flex flex-col gap-1">
                {['About Us', 'Sustainability', 'Careers', 'Press'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-inter text-[15px] leading-8 text-[rgba(246,246,246,0.6)] no-underline hover:text-crimson hover:translate-x-1 transition-all duration-300"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          {/* Support */}
          <div
            ref={setBlockRef(5)}
            className="footer__block border-b border-[rgba(246,246,246,0.15)] p-8 md:p-12"
            style={{ transformStyle: 'preserve-3d', opacity: 0 }}
          >
            <div className="footer__content">
              <h3 className="font-inter text-[clamp(20px,2.5vw,32px)] font-medium text-[#F6F6F6] mb-6 tracking-[-0.02em]">
                SUPPORT
              </h3>
              <nav className="flex flex-col gap-1">
                {['Contact', 'Shipping', 'Returns', 'Size Guide', 'FAQ'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="font-inter text-[15px] leading-8 text-[rgba(246,246,246,0.6)] no-underline hover:text-crimson hover:translate-x-1 transition-all duration-300"
                  >
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-8 md:px-12 py-6 border-t border-[rgba(246,246,246,0.15)]"
      >
        <p className="font-inter text-[11px] tracking-[0.05em] text-[rgba(246,246,246,0.6)]">
          &copy; 2025 6th SIN. All Rights Reserved.
        </p>
        <div className="flex items-center gap-4">
          {/* Instagram */}
          <a href="#" className="text-[#F6F6F6] hover:text-crimson transition-colors duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          {/* TikTok */}
          <a href="#" className="text-[#F6F6F6] hover:text-crimson transition-colors duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.83a8.23 8.23 0 0 0 4.83 1.55v-3.5a4.85 4.85 0 0 1-1.07-.19z" />
            </svg>
          </a>
          {/* X */}
          <a href="#" className="text-[#F6F6F6] hover:text-crimson transition-colors duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @media screen and (max-width: 768px) {
          .footer__grid {
            grid-template-columns: 1fr !important;
            perspective: none !important;
          }
          .footer__block {
            border-right: none !important;
            opacity: 1 !important;
            padding: 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
}