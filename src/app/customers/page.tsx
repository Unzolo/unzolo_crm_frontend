"use client";

import {
    ArrowLeft,
    Search,
    Phone,
    Calendar,
    Users,
    MessageSquare,
    Loader2,
    Clock,
    UserX,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function CustomerManagementPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    // Fetch Customers
    const { data: customersResponse, isLoading: customersLoading } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/customers");
            return response.data;
        },
    });

    const allCustomers = customersResponse?.data || [];

    const filteredCustomers = allCustomers.filter((c: any) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.contactNumber.includes(searchQuery);

        if (activeFilter === "cancelled") {
            return matchesSearch && c.cancelledTrips > 0;
        }
        if (activeFilter === "repeat") {
            return matchesSearch && c.totalTrips > 1;
        }
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header - Mobile */}
            <div className="p-4 flex items-center justify-between lg:hidden border-b border-white/20 bg-[#E2F1E8]">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-black hover:bg-transparent px-0">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-black flex-1 text-center font-sans tracking-tight">Customers</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-black">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-black">Customer Management</h1>
                            <p className="text-sm text-gray-500 mt-1">Unified view of your previous travelers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-lg lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Search and Filters */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="relative">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or contact number..."
                                className="h-12 bg-gray-50/50 border-gray-100 rounded-xl pr-12 focus-visible:ring-[#219653]"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {[
                                { label: "All Customers", value: "all", icon: <Users className="w-4 h-4" /> },
                                { label: "Repeat Travelers", value: "repeat", icon: <Clock className="w-4 h-4" /> },
                                { label: "Has Cancellations", value: "cancelled", icon: <UserX className="w-4 h-4" /> },
                            ].map((filter) => (
                                <Button
                                    key={filter.value}
                                    onClick={() => setActiveFilter(filter.value)}
                                    variant="ghost"
                                    className={cn(
                                        "rounded-full px-4 h-9 text-xs font-bold capitalize whitespace-nowrap gap-2",
                                        activeFilter === filter.value
                                            ? "bg-[#219653] text-white hover:bg-[#1A7B44]"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {filter.icon}
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Customer List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
                        {customersLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="p-4 rounded-xl border-none ring-1 ring-gray-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-12 h-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer: any) => (
                                <Card key={customer.id} className="p-4 rounded-xl border-none ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden gap-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                                <span className="text-lg font-bold text-[#219653]">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-black truncate text-sm lg:text-base group-hover:text-[#219653] transition-colors">{customer.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {customer.contactNumber}
                                                    </p>
                                                    <span className="text-gray-300">•</span>
                                                    <p className="text-[11px] text-gray-500 font-medium capitalize">{customer.gender}, {customer.age}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {customer.contactNumber !== 'N/A' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `tel:${customer.contactNumber}`;
                                                    }}
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Line */}
                                    <div className="mt-0 flex items-center gap-4 border-t border-gray-50 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Trips</span>
                                            <span className="text-sm font-bold text-black">{customer.totalTrips}</span>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Last Trip</span>
                                            <span className="text-sm font-bold text-black truncate">
                                                {customer.lastTrip?.title}
                                            </span>
                                        </div>
                                        <div className="w-px h-6 bg-gray-100" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                                            <Badge className={cn(
                                                "text-[8px] font-black tracking-tighter px-1.5 py-0 rounded-full border-none h-4",
                                                customer.cancelledTrips > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                            )}>
                                                {customer.cancelledTrips > 0 ? "Has Cancellations" : "All Active"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Quick Info bar */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-[#219653]" />
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            Last trip on {customer.lastTrip ? format(new Date(customer.lastTrip.date), "dd MMM yyyy") : 'N/A'}
                                        </span>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-black">No customers found</h3>
                                <p className="text-sm text-gray-500">History will appear once you have bookings</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(CustomerManagementPage);
