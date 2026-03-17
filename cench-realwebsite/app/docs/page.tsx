'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Instagram, Github, Menu, X } from 'lucide-react';
import ThreeLogo from '../components/ThreeLogo';
import { useTransition } from '../TransitionContext';

export default function DocsPage() {
  const { navigate } = useTransition();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const NavButton = ({
    children,
    className,
    isBold = false,
    onClick
  }: {
    children: React.ReactNode;
    className?: string;
    isBold?: boolean;
    onClick?: () => void;
  }) => {
    return (
      <motion.button
        className={`relative group py-1 text-[11px] md:text-sm ${isBold ? 'font-semibold' : 'font-medium'} text-black overflow-hidden flex items-center gap-1 ${className || ''}`}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(44,25,252,0.15)]">{children}</span>
        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black opacity-20" />
      </motion.button>
    );
  };

  return (
    <div
      className="min-h-screen font-sans overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)'
      }}
    >
      <header className="fixed top-4 left-4 right-4 z-[1001] bg-gradient-to-b from-white/60 to-white/10 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]">
        <div className="w-full pl-0 pr-4 py-1.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 relative w-12 h-12">
            <button onClick={() => navigate('/')} className="flex items-center gap-4 relative w-full h-full group focus:outline-none">
              <span className="absolute left-[74px] sm:left-[86px] md:left-[100px] lg:left-[124px] text-[12px] md:text-sm font-bold text-black py-1 drop-shadow-[0_0_8px_rgba(44,25,252,0.15)] block whitespace-nowrap">
                Swftly
              </span>
            </button>
          </div>
          <div className="flex items-center gap-4 md:gap-10">
            <div className="hidden md:flex items-center gap-10">
              {['Docs', 'Pricing', 'Book A Demo'].map((item) => {
              const handleNav = () => {
                if (item === 'Docs') {
                  // Already here
                } else if (item === 'Pricing') {
                  navigate('/#pricing-section');
                } else if (item === 'Book A Demo') {
                  navigate('/book-a-demo');
                }
              };

              return (
                <div key={item}>
                  <NavButton onClick={handleNav} className={item === 'Docs' ? 'text-[#2c19fc]' : ''}>
                    {item}
                  </NavButton>
                </div>
              );
              })}
              <NavButton isBold onClick={() => navigate('/waitlist')}>
                Get Started
                <ArrowUpRight className="w-4 h-4 relative z-10" />
              </NavButton>
            </div>

            <button
              type="button"
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-black/70 hover:text-black transition-colors"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/10"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute top-6 right-6 left-6 rounded-[20px] bg-white/55 backdrop-blur-2xl border border-white/60 shadow-[0_22px_70px_rgba(15,23,42,0.14)] overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/55 via-white/20 to-transparent" />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-white/50 rounded-[20px]" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <div className="text-[12px] font-semibold text-black/70 tracking-wide">Menu</div>
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center text-black/60 hover:text-black"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative p-2">
              {[
                { label: 'Docs', onClick: () => navigate('/docs') },
                { label: 'Pricing', onClick: () => navigate('/#pricing-section') },
                { label: 'Book a demo', onClick: () => navigate('/book-a-demo') },
                { label: 'Get started', onClick: () => navigate('/waitlist') }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-[14px] text-[14px] font-semibold text-black/80 hover:bg-white/40 transition-colors"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ThreeLogo forceDock={true} disableScrollSpin={true} />

      <main className="relative pt-28 md:pt-32 pb-14 px-4 min-h-screen flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #d6e8f7 0%, #e2edf5 40%, #e8eef4 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
          }}
        />

        <div className="relative z-10 w-full max-w-2xl text-center">
          <h1
            className="text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
          >
            Docs
          </h1>
          <p className="text-[15px] md:text-[16px] text-black/55 font-medium max-w-xl mx-auto leading-relaxed">
            We’re polishing documentation for launch. For now, book a demo or join the waitlist.
          </p>
        </div>
      </main>

      <section
        className="w-full px-4 py-14 md:py-16 relative z-10 mt-auto"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
        }}
      >
        <footer className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 md:gap-8 pb-10 border-b border-black/5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <img src="/Swftly.svg" alt="Swftly" className="w-5 h-5 object-contain brightness-0" />
                <span className="text-[14px] font-semibold text-black tracking-tight">Swftly</span>
              </div>

              <button type="button" className="button-42">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text text-[12px] font-medium text-black/70">All systems operational</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Resources</div>
              <div className="space-y-2">
                {['Mobile', 'Manifesto', 'Bug Bounty'].map((t) => (
                  <button key={t} type="button" className="block text-[13px] text-black/55 hover:text-black/75 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Support</div>
              <div className="space-y-2">
                {['Help Center', 'Contact Us'].map((t) => (
                  <button key={t} type="button" className="block text-[13px] text-black/55 hover:text-black/75 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Data Processing Agreement'].map((t) => (
                  <button key={t} type="button" className="block text-[13px] text-black/55 hover:text-black/75 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-[12px] text-black/45">© 2026 Swftly. All rights reserved.</div>
            <div className="flex items-center gap-4 text-black/55">
              <button type="button" onClick={() => window.open('https://instagram.com/getswftly', '_blank')} className="hover:text-black/75 transition-colors">
                <Instagram size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://github.com', '_blank')} className="hover:text-black/75 transition-colors">
                <Github size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://x.com', '_blank')} className="hover:text-black/75 transition-colors">
                <img src="/x-logo.svg" alt="X" className="w-[18px] h-[18px] object-contain opacity-70 hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

