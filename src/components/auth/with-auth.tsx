"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedRoute(props: P) {
        const router = useRouter();
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
            if (typeof window !== "undefined") {
                const token = localStorage.getItem("token");
                return !!token;
            }
            return null;
        });

        useEffect(() => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                router.push("/login");
            } else {
                setIsAuthenticated(true);
            }
        }, [router]);

        if (isAuthenticated === null || !isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
