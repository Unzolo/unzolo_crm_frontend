"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/login") ||
        pathname?.startsWith("/signup") ||
        pathname?.startsWith("/otp") ||
        pathname?.startsWith("/forgot-password") ||
        pathname?.startsWith("/reset-password");

    return (
        <>
            <Sidebar />
            <main className={cn(!isAuthPage && "lg:pl-64")}>
                {children}
            </main>
        </>
    );
}
