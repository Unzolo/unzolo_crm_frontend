import Image from "next/image";
import React from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F5F9F7] flex flex-col">
            {/* Top Section with Logo */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="relative w-24 h-24 mb-4">
                    <Image
                        src="/icon-512x512.png"
                        alt="Unzolo Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Auth Card */}
            <div className="bg-white rounded-t-[40px] shadow-2xl px-8 pt-6 pb-12 w-full max-w-md mx-auto min-h-[70vh]">
                {children}
            </div>
        </div>
    );
}
