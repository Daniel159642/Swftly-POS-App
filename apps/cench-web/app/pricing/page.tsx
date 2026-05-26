'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowUpRight, 
  Instagram, 
  Linkedin,
  Github, 
  Menu, 
  X
} from 'lucide-react';
import { useTransition } from '../TransitionContext';
import ThreeLogo from '../components/ThreeLogo';

const PRICING_PLANS = {
  monthly: [
    {
      name: 'Beta Case Study',
      price: 'Free',
      period: '',
      cta: 'Get Started',
      description: 'All essential features.',
      features: [
        '3 months on us',
        'Automated Accounting',
        'Inventory & Shipment Management',
        '24/7 support'
      ]
    },
    {
      name: 'Pro',
      price: '$35',
      period: '/ month',
      cta: 'Coming Soon',
      description: 'Unlimited access.',
      features: [
        'Everything from Beta, plus...',
        'Mobile app',
        'Payroll integration',
        'Automated Marketing Campaigns',
        'DoorDash, Uber Eats & more +'
      ],
      popular: true,
      comingSoon: true
    },
    {
      name: 'Enterprise',
      price: 'Contact Sales',
      period: '',
      cta: 'Coming Soon',
      description: 'For stores with multiple locations.',
      features: [
        'Everything in Pro, plus...',
        'Custom AI training',
        'Multi-store inventory management'
      ],
      comingSoon: true
    }
  ],
  annually: [
    {
      name: 'Beta Case Study',
      price: 'Free',
      period: '',
      cta: 'Get Started',
      description: 'All essential features.',
      features: [
        '3 months on us',
        'Automated Accounting',
        'Inventory & Shipment Management',
        '24/7 support'
      ]
    },
    {
      name: 'Pro',
      price: '$30',
      period: '/ month',
      cta: 'Coming Soon',
      description: 'Unlimited access.',
      features: [
        'Everything from Beta, plus...',
        'Mobile app',
        'Payroll integration',
        'Automated Marketing Campaigns',
        'DoorDash, Uber Eats & more +'
      ],
      popular: true,
      comingSoon: true
    },
    {
      name: 'Enterprise',
      price: 'Contact Sales',
      period: '',
      cta: 'Coming Soon',
      description: 'For stores with multiple locations.',
      features: [
        'Everything in Pro, plus...',
        'Custom AI training',
        'Multi-store inventory management'
      ],
      comingSoon: true
    }
  ]
};

export default function PricingPage() {
  const { navigate } = useTransition();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavButton = ({ children, className, isBold = false, onClick }: { children: React.ReactNode; className?: string; isBold?: boolean; onClick?: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [entrySide, setEntrySide] = useState<'left' | 'right'>('left');

    return (
      <motion.button
        className={`relative group py-1 text-[11px] md:text-sm ${isBold ? 'font-semibold' : 'font-medium'} text-black overflow-hidden flex items-center gap-1 ${className || ''}`}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setEntrySide(x < rect.width / 2 ? 'left' : 'right');
          setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(44,25,252,0.15)]">{children}</span>
        <motion.span
          className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black"
          initial={false}
          animate={{
            x: isHovered ? "0%" : (entrySide === 'left' ? "-105%" : "105%"),
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.button>
    );
  };

  const AnimatedPrice = ({ price }: { price: string }) => {
    return (
      <div className="overflow-hidden relative flex items-baseline h-full">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={price}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-baseline"
          >
            {price}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans selection:bg-[#2c19fc]/10" 
      style={{ 
        background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)',
        fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
      }}
    >
      <style jsx global>{`
        .button-49 {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 22px;
          border: 0;
          font-size: 14px;
          transition: all 150ms ease-in-out;
          border-radius: 8px;
          font-weight: 600;
          color: #fff;
          box-shadow: rgba(0, 0, 0, 0.8) 0px 0px 0px 1px, 
                      rgba(255, 255, 255, 0.1) 0 0 3px 0 inset, 
                      0 1px 2px 0 rgba(0, 0, 0, .5);
          background-image: radial-gradient(53% 87% at 44% 90%, rgba(255, 255, 255, 0.1) 0%, transparent 100%), 
                            linear-gradient(80deg, #1a1a1a 0%, #000000 100%);
          cursor: pointer;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        .button-49:hover {
          /* Hover effect removed per user request */
        }

        .button-49:active {
          transform: scale(.95);
        }
      `}</style>

      <ThreeLogo forceDock={true} disableScrollSpin={true} />

      {/* Header */}
      <header
        className={`fixed top-4 left-4 right-4 z-[1001] transition-all duration-300 ${isScrolled ? 'bg-gradient-to-b from-white/60 to-white/10 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]' : 'bg-transparent border-transparent'}`}
      >
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
                    navigate('/docs');
                  } else if (item === 'Pricing') {
                    // Already here or scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else if (item === 'Book A Demo') {
                    navigate('/book-a-demo');
                  }
                };

                return (
                  <div key={item}>
                    <NavButton onClick={handleNav} className={item === 'Pricing' ? 'text-[#2c19fc]' : ''}>
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

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[2000] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/10 backdrop-blur-sm"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-6 right-6 left-6 rounded-[24px] bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_22px_70px_rgba(0,0,0,0.15)] overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-black/5">
                <span className="text-[12px] font-bold text-black/40 uppercase tracking-widest">Pricing</span>
                <button onClick={() => setIsMobileNavOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {['Docs', 'Pricing', 'Book A Demo', 'Get Started'].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-bold text-black hover:bg-black/5 transition-colors"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      if (item === 'Docs') navigate('/docs');
                      if (item === 'Book A Demo') navigate('/book-a-demo');
                      if (item === 'Get Started') navigate('/waitlist');
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-32 pb-24 px-4 overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-[52px] md:text-[84px] font-bold tracking-tight text-black leading-[0.95] mb-6">
              Join the beta <span className="text-black/40">for free.</span>
            </h1>
            <p className="text-[16px] md:text-[20px] text-black/60 font-medium max-w-xl mx-auto leading-relaxed mb-12">
              For a limited time, join our open beta program at no cost. Whether you're using Swftly for your shop, inventory, or just getting started, it's free to start.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-[13px] font-bold transition-colors ${billingCycle === 'monthly' ? 'text-black' : 'text-black/40'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                className="w-12 h-6 rounded-full bg-white/40 border border-white/60 relative transition-colors shadow-inner backdrop-blur-md"
              >
                <motion.div
                  className="absolute top-1 left-1 bottom-1 w-4 h-4 rounded-full bg-black shadow-lg"
                  animate={{ x: billingCycle === 'monthly' ? 0 : 24 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-bold transition-colors ${billingCycle === 'annually' ? 'text-black' : 'text-black/40'}`}>Annually</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {PRICING_PLANS[billingCycle].map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
              className="relative bg-white/80 backdrop-blur-3xl rounded-[24px] border border-white/60 shadow-[0_12px_45px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col transition-all duration-300"
            >
              <div className="min-h-[80px] mb-2">
                <span className="text-[14px] font-bold text-black opacity-80 block mb-2">{plan.name}</span>
                <div className="flex items-baseline gap-1">
                  <h2 className={`${plan.price === 'Contact Sales' ? 'text-[36px]' : 'text-[44px]'} font-bold text-black tracking-tight leading-none`}>
                    <AnimatedPrice price={plan.price} />
                  </h2>
                  <div className="flex items-baseline translate-y-[2px]">
                    {plan.period && <span className="text-[16px] font-medium text-black/30 ml-1 whitespace-nowrap">{plan.period}</span>}
                    <AnimatePresence>
                      {billingCycle === 'annually' && plan.price.startsWith('$') && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          className="text-[16px] font-medium text-black/30 ml-1 whitespace-nowrap"
                        >
                          billed annually
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

                <div className="min-h-[96px] mb-0">
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/waitlist')}
                      className="button-49 w-full"
                    >
                      <span className="text">{plan.cta}</span>
                    </button>
                    <p className="text-[15px] font-medium text-black/50 px-1 leading-snug">{plan.description}</p>
                  </div>
                </div>

              <div className="flex-1 space-y-3">
                <div className="h-px bg-black/5 w-full mb-4" />
                {plan.features.map((feature, fIdx) => {
                  const isTitle = feature.startsWith('Everything from') || feature.startsWith('Everything in');
                  return (
                    <div key={fIdx} className={`flex gap-3 items-center group/item ${isTitle ? 'mt-2 mb-1' : ''}`}>
                      {!isTitle && (
                        <div className="shrink-0">
                          <Check size={14} className="text-[#2c19fc]" strokeWidth={1.5} />
                        </div>
                      )}
                      <span className={`text-[13px] leading-[1.3] font-medium transition-colors ${isTitle ? 'text-black font-extrabold tracking-tight' : 'text-black/70 group-hover/item:text-black'}`}>
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <section 
        className="w-full px-4 py-14 md:py-16 relative z-10"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
        }}
      >
        <footer className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10 md:gap-8 pb-10 border-b border-black/5">
            {/* Left: brand + status */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <img src="/Swftly.svg" alt="Swftly" className="w-5 h-5 object-contain brightness-0" />
                <span className="text-[14px] font-semibold text-black tracking-tight">Swftly</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/5 w-fit">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-medium text-black/70">All systems operational</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Resources</div>
              <div className="space-y-2">
                {[
                  { label: 'Mobile', onClick: () => navigate('/') },
                  { label: 'About Us', onClick: () => navigate('/') },
                  { label: 'Docs', onClick: () => navigate('/docs') }
                ].map((item) => (
                  <button 
                    key={item.label} 
                    type="button" 
                    className="block text-[13px] text-black/55 hover:text-black/75 transition-colors"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Support</div>
              <div className="space-y-2">
                {[
                  { label: 'Help Center', onClick: () => navigate('/docs') },
                  { label: 'Contact Us', onClick: () => navigate('/waitlist') }
                ].map((item) => (
                  <button 
                    key={item.label} 
                    type="button" 
                    className="block text-[13px] text-black/55 hover:text-black/75 transition-colors"
                    onClick={item.onClick}
                  >
                    {item.label}
                   </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-black/80">Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'Data Processing Agreement'].map((t) => (
                  <button key={t} type="button" className="block text-[13px] text-black/55 hover:text-black/75 transition-colors" onClick={() => navigate('/docs')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[12px] text-black/45">
              © 2026 Swftly. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-black/55">
              <button type="button" onClick={() => window.open('https://instagram.com/getswftly', '_blank')} className="hover:text-black/75 transition-colors">
                <Instagram size={18} />
              </button>
              <button type="button" onClick={() => window.open('https://linkedin.com/company/swftly', '_blank')} className="hover:text-black/75 transition-colors">
                <Linkedin size={18} />
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
