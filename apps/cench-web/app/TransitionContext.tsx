'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const router = useRouter();
    const pathname = usePathname();

    const navigate = (url: string) => {
        if (url === pathname) return;
        router.push(url);
    };

    return (
        <TransitionContext.Provider value={{ navigate, isTransitioning: false }}>
            {children}
        </TransitionContext.Provider>
    );
}
