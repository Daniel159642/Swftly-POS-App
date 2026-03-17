'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, ArrowUpRight, ChevronDown, Instagram, Github, Menu, X } from 'lucide-react';
import ThreeLogo from '../components/ThreeLogo';
import { useTransition } from '../TransitionContext';

export default function WaitlistPage() {
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
        name: '',
        email: '',
        businessName: '',
        businessType: '',
        currentPos: '',
        otherPos: '',
        painPoints: '',
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
                body: JSON.stringify({
                    firstName: formData.name,
                    email: formData.email,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    currentPos: formData.currentPos === 'Other' ? formData.otherPos : formData.currentPos,
                    painPoints: formData.painPoints,
                    message: 'WAITLIST SIGNUP'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to join waitlist');
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
                // Footer gradient is the base; main uses a radial overlay that fades out.
                background: 'linear-gradient(145deg, #eaeff8 0%, #dce6f2 40%, #cfd9ed 100%)'
            }}
        >
            {/* Header */}
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
                                        navigate('/book-a-demo');
                                    }
                                };

                                return (
                                    <div key={item}>
                                        <NavButton onClick={handleNav}>
                                            {item}
                                        </NavButton>
                                    </div>
                                );
                            })}
                            <NavButton isBold className="text-[#2c19fc]" onClick={() => navigate('/waitlist')}>
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
                {/* Main background (soft_blue_gray_bg.html) that fades into footer gradient */}
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, #d6e8f7 0%, #e2edf5 40%, #e8eef4 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                    }}
                />

                <div className="relative z-10 w-full max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-6 md:mb-8"
                        style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                    >
                        <h1 className="text-[44px] md:text-[64px] font-semibold tracking-tight text-black leading-[1.05] mb-3">
                            Join the waitlist
                        </h1>
                        <p className="text-gray-500 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                            We're rolling out access to a limited number of businesses. Secure your spot in line.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="relative"
                    >
                        {!isSubmitted ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                            placeholder="you@company.com"
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
                                                placeholder="Company Name"
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

                                    <div className="space-y-2 relative">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                            >
                                                <span className={formData.currentPos ? 'text-black' : 'text-gray-400'}>
                                                    {formData.currentPos || 'Select your current system'}
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                </motion.div>
                                            </button>

                                            {isDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[1001]"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        className="absolute z-[1002] w-full mt-2 bg-white/90 backdrop-blur-xl border border-white/70 rounded-2xl shadow-2xl overflow-hidden py-2"
                                                    >
                                                        {['Square', 'Clover', 'Toast', 'Revel', 'Other'].map((pos) => (
                                                            <button
                                                                key={pos}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, currentPos: pos });
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="w-full px-5 py-3 text-left hover:bg-[#2c19fc]/5 text-black font-medium transition-colors flex items-center justify-between"
                                                            >
                                                                {pos}
                                                                {formData.currentPos === pos && <Check className="w-4 h-4 text-[#2c19fc]" />}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                </>
                                            )}
                                        </div>

                                        {formData.currentPos === 'Other' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3"
                                            >
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData.otherPos}
                                                    onChange={(e) => setFormData({ ...formData, otherPos: e.target.value })}
                                                    className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium"
                                                    placeholder="Enter your POS system name"
                                                />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <textarea
                                            value={formData.painPoints}
                                            onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                                            className="w-full bg-[#eaf2fb]/70 border border-[#c9d9ef] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c19fc]/12 focus:border-[#2c19fc]/55 transition-all text-black font-medium min-h-[90px] resize-none"
                                            placeholder="What would you like to see improved in your current system?"
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
                                            <span className="text">Request a spot</span>
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
                                    <h2 className="text-3xl font-bold text-black mb-4 tracking-tight">You're on the list!</h2>
                                    <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto">
                                        Thank you for your interest in Swftly. We'll reach out as soon as a spot opens up for your business.
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
                        {/* Left: brand + status */}
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
