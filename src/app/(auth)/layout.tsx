import Image from "next/image";
import React from "react";
import { OnlineStatusBadge } from "@/components/offline-indicator";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F5F9F7] flex flex-col">
            {/* Top Section with Logo and Online Status */}
            <div className="p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-10 lg:relative lg:p-6 lg:justify-center lg:gap-4 lg:flex-col">
                <div className="lg:hidden">
                    <OnlineStatusBadge />
                </div>
                <div className="hidden lg:block">
                    {/* Placeholder to balance layout if needed, or just status badge */}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-8">
                
                <div className="relative w-36 h-36 mb-2">
                    <Image
                        src="/logo-text.png"
                        alt="Unzolo Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <p className="text-[#219653] text-[20px] font-bold tracking-[0.2em] uppercase mb-4">
                    CRM Portal
                </p>
            </div>

            {/* Auth Card */}
            <div className="bg-white rounded-t-[40px] shadow-2xl px-8 pt-6 pb-12 w-full max-w-md mx-auto min-h-[70vh]">
                {children}
            </div>
        </div>
    );
}
