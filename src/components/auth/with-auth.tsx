"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const router = useRouter();
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

        useEffect(() => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                router.push("/login");
            } else {
                setIsAuthenticated(true);
            }
        }, [router]);

        if (isAuthenticated === null) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#E2F1E8]">
                    <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
                </div>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
