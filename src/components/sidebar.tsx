"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Package,
    ClipboardCheck,
    PlusSquare,
    User,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Create Trip", href: "/create-trip", icon: PlusSquare },
    { name: "Manage Bookings", href: "/select-trip", icon: ClipboardCheck },
    { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    // Don't show sidebar on auth pages
    if (pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/otp") || pathname?.startsWith("/forgot-password") || pathname?.startsWith("/reset-password")) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-[#219653]">Koodam</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Button
                            key={item.name}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-12 rounded-xl font-semibold transition-all",
                                isActive
                                    ? "bg-[#E2F1E8] text-[#219653] hover:bg-[#d5e9dc]"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => router.push(item.href)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 rounded-xl font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </Button>
            </div>
        </aside>
    );
}
