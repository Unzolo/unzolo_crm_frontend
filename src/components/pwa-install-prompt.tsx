'use client';

import { useState, useEffect } from 'react';
import { Share, X, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PwaInstallBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect if the app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // More aggressive check for iOS Safari
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        // Show banner only on iOS Safari if not installed
        if (ios && isSafari) {
            // Wait a few seconds to not annoy the user immediately
            const timer = setTimeout(() => {
                // Check local storage to see if user dismissed it
                const dismissed = localStorage.getItem('pwa-install-dismissed');
                if (!dismissed) {
                    setShowBanner(true);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismissBanner = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white rounded-[24px] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-5 relative overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={dismissBanner}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#E2F1E8] flex items-center justify-center shrink-0 shadow-inner">
                            <img src="/favicon.png" alt="App Icon" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-black leading-tight">Install Unzolo CRM</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">Add to home screen for a premium experience and offline access.</p>
                        </div>
                    </div>

                    <div className="bg-[#F8FBF9] rounded-xl p-4 space-y-3">
                        <p className="text-xs font-bold text-[#219653] uppercase tracking-wider text-center">Follow these steps:</p>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                    <Share className="w-4 h-4 text-[#219653]" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">Tap the <span className="font-bold text-black">'Share'</span> button in Safari</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                    <PlusSquare className="w-4 h-4 text-[#219653]" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">Scroll down and select <span className="font-bold text-black">'Add to Home Screen'</span></p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={dismissBanner}
                        className="w-full bg-[#219653] hover:bg-[#1A7B44] text-white rounded-xl py-6 font-bold"
                    >
                        Got it!
                    </Button>
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#E2F1E8]/30 rounded-full blur-2xl" />
            </div>
        </div>
    );
}
