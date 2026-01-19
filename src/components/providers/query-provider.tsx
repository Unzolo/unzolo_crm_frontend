"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                mutationCache: new MutationCache({
                    onError: (error: any) => {
                        if (error.isOffline || error.queued) {
                            toast.warning(error.message || "Action queued for sync when online", {
                                duration: 5000,
                            });
                        }
                    },
                }),
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
