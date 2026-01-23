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
    IndianRupee,
    MessageSquare,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";

const defaultNavigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Create Trip", href: "/create-trip", icon: PlusSquare },
    { name: "Manage Bookings", href: "/select-trip", icon: ClipboardCheck },
    { name: "Manage Expenses", href: "/expenses", icon: IndianRupee },
    { name: "Enquiries", href: "/enquiries", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
        retry: false,
    });

    const userEmail = profile?.data?.email || "";
    const isAdmin = userEmail === "unzoloapp@gmail.com";

    let navigation = [];
    if (isAdmin) {
        navigation = [
            { name: "Admin Dashboard", href: "/admin", icon: ShieldCheck },
            { name: "Manage Trips", href: "/admin/trips", icon: Package },
            { name: "Profile", href: "/profile", icon: User },
        ];
    } else {
        navigation = [...defaultNavigation];
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    // Don't show sidebar on auth pages
    if (pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/otp") || pathname?.startsWith("/forgot-password") || pathname?.startsWith("/reset-password")) {
        return null;
    }

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-[#219653] truncate">
                    {profile?.data?.name ? `${profile.data.name} CRM` : "CRM Portal"}
                </h1>
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
                                "w-full justify-start gap-3 h-12 rounded-lg font-semibold transition-all",
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
