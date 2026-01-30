"use client";

import {
    ArrowLeft,
    Plus,
    Search,
    MessageSquare,
    Phone,
    Calendar,
    Filter,
    MoreVertical,
    Construction,
    Clock,
    UserPlus,
    Loader2
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

function EnquiriesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Check profile for access control
    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
    });

    const hasAccess = !!profileResponse?.data;

    // Fetch Enquiries
    const { data: enquiriesResponse, isLoading: enquiriesLoading } = useQuery({
        queryKey: ["enquiries"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/enquiries");
            return response.data;
        },
        enabled: hasAccess,
    });

    const allEnquiries = enquiriesResponse?.data || [];
    const filteredEnquiries = allEnquiries.filter((e: any) => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.phone.includes(searchQuery);
        const matchesTab = activeTab === "all" || e.status?.toLowerCase() === activeTab;
        return matchesSearch && matchesTab;
    });

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-black hover:bg-transparent px-0">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-black flex-1 text-center font-sans tracking-tight">Enquiries</h1>
                <Button
                    onClick={() => router.push("/enquiries/new")}
                    variant="ghost"
                    size="icon"
                    className="text-[#219653]"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Enquiry Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Track and nurture your travel leads</p>
                    </div>
                    <Button
                        onClick={() => router.push("/enquiries/new")}
                        className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-full px-6 h-12 gap-2 font-semibold"
                    >
                        <Plus className="w-5 h-5" /> New Enquiry
                    </Button>
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
                                placeholder="Search leads by name or phone..."
                                className="h-12 bg-gray-50/50 border-gray-200 rounded-lg pr-12 focus-visible:ring-[#219653]"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {["all", "hot", "warm", "cold", "converted", "cancelled"].map((tab) => (
                                <Button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    variant="ghost"
                                    className={cn(
                                        "rounded-full px-4 h-9 text-sm font-semibold capitalize whitespace-nowrap",
                                        activeTab === tab
                                            ? "bg-[#219653] text-white hover:bg-[#1A7B44]"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    )}
                                >
                                    {tab}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Enquiry List */}
                    <div className="space-y-4 pb-8">
                        {enquiriesLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <Card key={i} className="p-4 rounded-lg border-none ring-1 ring-gray-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-12 h-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : filteredEnquiries.length > 0 ? (
                            filteredEnquiries.map((enquiry: any) => (
                                <Card key={enquiry._id} className="p-4 rounded-lg border-none ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0">
                                                <span className="text-lg font-bold text-[#219653]">
                                                    {enquiry.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="font-bold text-black truncate">{enquiry.name}</h3>
                                                    <Badge className={cn(
                                                        "text-[8px] uppercase px-1.5 py-0 rounded-full border-none",
                                                        enquiry.status === "hot" ? "bg-red-500" :
                                                            enquiry.status === "warm" ? "bg-orange-500" :
                                                                enquiry.status === "converted" ? "bg-[#219653]" : "bg-gray-400"
                                                    )}>
                                                        {enquiry.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-gray-400" /> {enquiry.phone}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                                                <Phone className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-green-50 text-green-600 hover:bg-green-100">
                                                <MessageSquare className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {enquiry.followUpDate ? format(new Date(enquiry.followUpDate), "dd MMM") : "No Follow-up"}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" className="text-[10px] font-black uppercase text-[#219653] hover:bg-[#E2F1E8] rounded-full px-3 h-7 gap-1">
                                            Convert <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20 animate-in fade-in duration-500">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-10 h-10 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-bold text-black mb-1">No enquiries found</h3>
                                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(EnquiriesPage);
