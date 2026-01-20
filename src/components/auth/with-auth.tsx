"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const router = useRouter();
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
        const [isMounted, setIsMounted] = useState(false);

        useEffect(() => {
            setIsMounted(true);
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                router.push("/login");
            } else {
                setIsAuthenticated(true);
            }
        }, [router]);

        if (!isMounted || isAuthenticated === null || !isAuthenticated) {
            return (
                <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
                </div>
            );
        }

        return <Component {...props} />;
    };
}
