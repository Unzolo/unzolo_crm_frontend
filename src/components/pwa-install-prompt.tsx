'use client';

import { useState, useEffect } from 'react';
import { Share, X, PlusSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

export function PwaInstallBanner() {
    const [showFAB, setShowFAB] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Detect if the app is already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const android = /android/.test(userAgent);
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const mobile = android || ios;

        setIsAndroid(android);

        // Listen for the beforeinstallprompt event (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show FAB if it's explicitly a mobile device
            if (mobile) {
                setShowFAB(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS devices where beforeinstallprompt doesn't fire
        if (ios) {
            setShowFAB(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleFABClick = async () => {
        if (isAndroid && deferredPrompt) {
            // For Android, use the native prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
            if (outcome === 'accepted') {
                setShowFAB(false);
            }
        } else {
            // For iOS/Other, show our custom drawer
            setShowDrawer(true);
        }
    };

    if (!showFAB) return null;

    return (
        <>
            {/* Install FAB */}
            <div className="fixed bottom-6 right-6 z-50 animate-in zoom-in-50 duration-300">
                <Button
                    onClick={handleFABClick}
                    className="w-14 h-14 rounded-full bg-[#219653] hover:bg-[#1A7B44] text-white shadow-2xl flex items-center justify-center p-0 active:scale-95 transition-all group"
                >
                    <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                </Button>
            </div>

            {/* iOS/Generic Install Instructions Drawer */}
            <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
                <DrawerContent className="bg-white rounded-t-[32px] p-0 border-none shadow-2xl">
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-gray-200 mt-3 mb-2" />
                    <div className="px-6 py-6 relative overflow-hidden">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-[#E2F1E8] flex items-center justify-center shrink-0 shadow-inner ring-1 ring-[#219653]/10">
                                    <img src="/favicon.png" alt="App Icon" className="w-12 h-12 object-contain" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-black leading-tight">Install Unzolo CRM</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Get the app on your home screen for the best experience.</p>
                                </div>
                            </div>

                            <div className="bg-[#F8FBF9] rounded-[24px] p-5 space-y-4 ring-1 ring-[#219653]/5">
                                <p className="text-xs font-bold text-[#219653] uppercase tracking-widest text-center">Follow these steps:</p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                            <Share className="w-5 h-5 text-[#219653]" />
                                        </div>
                                        <p className="text-[15px] font-medium text-gray-700">Tap the <span className="font-bold text-black">'Share'</span> button in your browser</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                            <PlusSquare className="w-5 h-5 text-[#219653]" />
                                        </div>
                                        <p className="text-[15px] font-medium text-gray-700">Scroll down and select <span className="font-bold text-black">'Add to Home Screen'</span></p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowDrawer(false)}
                                className="w-full bg-[#219653] hover:bg-[#1A7B44] text-white rounded-2xl py-7 text-base font-bold shadow-lg shadow-[#219653]/20 active:scale-[0.98] transition-all"
                            >
                                Got it!
                            </Button>
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#219653]/5 rounded-full blur-3xl" />
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
}
