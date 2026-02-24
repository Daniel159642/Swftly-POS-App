'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, usePathname } from 'next/navigation';

interface TransitionContextType {
    navigate: (url: string) => void;
    isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const useTransition = () => {
    const context = useContext(TransitionContext);
    if (!context) throw new Error('useTransition must be used within TransitionProvider');
    return context;
};

export function TransitionProvider({ children }: { children: React.ReactNode }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingUrl, setPendingUrl] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Initial fade in from white
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        setIsInitialLoad(false);
    }, []);

    // When pathname changes, we ensure we fade in
    useEffect(() => {
        setIsTransitioning(false);
        setPendingUrl(null);
    }, [pathname]);

    const navigate = (url: string) => {
        if (url === pathname) return;
        setIsTransitioning(true);
        setPendingUrl(url);

        // Wait for fade to white
        setTimeout(() => {
            router.push(url);
        }, 500);
    };

    return (
        <TransitionContext.Provider value={{ navigate, isTransitioning }}>
            {children}
            <AnimatePresence>
                {(isInitialLoad || isTransitioning) && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] bg-white pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </TransitionContext.Provider>
    );
}
