'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, ArrowUpRight, Instagram, Github, Menu, X } from 'lucide-react';
import ThreeLogo from '../components/ThreeLogo';
import { useTransition } from '../TransitionContext';

export default function BookADemo() {
    const { navigate } = useTransition();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
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

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        businessName: '',
        businessType: '',
        message: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to send request');
            }

            setIsSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen font-sans overflow-hidden"
            style={{
                background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)'
            }}
        >
            {/* Header - Matching main page */}
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
                                        navigate('/docs');
                                    } else if (item === 'Pricing') {
                                        navigate('/#pricing-section');
                                    } else if (item === 'Book A Demo') {
                                        // Already on demo page
                                    }
                                };

                                return (
                                    <div key={item}>
                                        <NavButton onClick={handleNav} className={item === 'Book A Demo' ? 'text-[#2c19fc]' : ''}>
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

            {/* Reuse the 3D Logo - It will naturally stay in the header if we don't scroll */}
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

                <div className="relative z-10 w-full max-w-2xl">
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1
                            className="text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4"
                            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif' }}
                        >
                            Book a demo
                        </h1>
                        <p className="text-[15px] md:text-[16px] text-black/55 font-medium max-w-lg mx-auto leading-relaxed">
                            Tell us a bit about your business — we’ll reach out to schedule a walkthrough.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium animate-shake">
                                            {error}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <input
                                                required
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                                placeholder="First name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                required
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                                placeholder="Last name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                            placeholder="Work email"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <input
                                                required
                                                type="text"
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                                placeholder="Business name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                required
                                                type="text"
                                                value={formData.businessType}
                                                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                                placeholder="Business type"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium min-h-[90px] resize-none"
                                            placeholder="Anything we should know?"
                                        ></textarea>
                                    </div>

                                    {/* Honeypot field for bot protection */}
                                    <div className="hidden" aria-hidden="true">
                                        <input
                                            type="text"
                                            name="website"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={(formData as any).website || ''}
                                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        disabled={isLoading}
                                        type="submit"
                                        className="button-24 button-24--blue w-full !mx-0 !mt-8 flex justify-center items-center"
                                    >
                                        {isLoading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            >
                                                <Loader2 className="w-5 h-5 text-white" />
                                            </motion.div>
                                        ) : (
                                            <span className="text">Request a demo</span>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 flex flex-col items-center text-center"
                                >
                                    <div className="w-20 h-20 bg-[#2c19fc] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#2c19fc]/20">
                                        <Check className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-black mb-4 tracking-tight">Request Received!</h2>
                                    <p className="text-gray-500 font-medium mb-8 max-w-xs">
                                        We've sent a confirmation to your email. One of our specialists will be in touch shortly.
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="flex items-center gap-2 text-[#2c19fc] font-bold hover:gap-3 transition-all underline underline-offset-4"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Return Home
                                    </button>
                                </motion.div>
                            )}
                    </motion.div>
                </div>
            </main>

            {/* Footer (same as main page) */}
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
                        <div className="text-[12px] text-black/45">
                            © 2026 Swftly. All rights reserved.
                        </div>
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
