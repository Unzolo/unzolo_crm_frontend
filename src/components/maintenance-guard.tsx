"use client";

import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Wrench } from "lucide-react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const { data: maintenanceData, isLoading } = useQuery({
        queryKey: ["maintenance-mode-public"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/system/maintenance");
            return response.data;
        },
        refetchInterval: 30000, // Check every 30 seconds
    });

    const { data: profileResponse } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
    });

    const userEmail = profileResponse?.data?.email || "";
    const isAdmin = userEmail === "unzoloapp@gmail.com";
    const isMaintenanceOn = maintenanceData?.data?.maintenanceMode || false;
    const isAdminPath = pathname.startsWith("/admin");
    const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify-otp") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

    if (isLoading && !isMaintenanceOn) {
        return null;
    }

    if (isMaintenanceOn && !isAdmin && !isAdminPath && !isAuthPath) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl animate-bounce">
                    <Wrench className="w-12 h-12 text-[#219653]" />
                </div>
                <h1 className="text-4xl font-black text-black mb-4 tracking-tight">Under Maintenance</h1>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
                    We're currently performing some scheduled maintenance to improve your experience.
                    We'll be back online shortly!
                </p>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white rounded-full text-[#219653] font-bold text-sm shadow-sm ring-1 ring-gray-100">
                        Coming back soon
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
