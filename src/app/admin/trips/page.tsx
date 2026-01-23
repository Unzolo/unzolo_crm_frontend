"use client";

import {
    ArrowLeft,
    Search,
    SlidersHorizontal,
    MapPin,
    Calendar,
    Loader2,
    Package,
    Tag,
    ChevronRight,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { withAuth } from "@/components/auth/with-auth";
import { cn } from "@/lib/utils";

function AdminTripsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"date" | "price" | "title">("date");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const { data: response, isLoading } = useQuery({
        queryKey: ["admin-all-trips"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/trips");
            return response.data;
        },
    });

    const allTrips = response?.data || [];

    const filteredAndSortedTrips = allTrips
        .filter((trip: any) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = trip.title.toLowerCase().includes(query) ||
                trip.destination.toLowerCase().includes(query) ||
                trip.Partner?.name?.toLowerCase().includes(query);
            const matchesType = typeFilter === "all" || trip.type === typeFilter;
            return matchesSearch && matchesType;
        })
        .sort((a: any, b: any) => {
            let comp = 0;
            if (sortBy === "date") {
                comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === "price") {
                comp = parseFloat(a.price) - parseFloat(b.price);
            } else if (sortBy === "title") {
                comp = a.title.localeCompare(b.title);
            }
            return sortOrder === "desc" ? -comp : comp;
        });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header - Mobile Only */}
            <div className="p-4 flex items-center justify-between lg:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-black hover:bg-transparent px-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-black flex-1 text-center">Manage All Trips</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-black hover:bg-transparent px-0"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-black">Manage All Trips</h1>
                            <p className="text-sm text-gray-500 mt-1">Review and monitor trips from all registered partners</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-8 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-6xl mx-auto pb-10">

                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search trip title, destination, or partner name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 bg-gray-50 border-none rounded-lg pr-12 focus-visible:ring-[#219653]"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex bg-gray-50 p-1 rounded-lg">
                                {['all', 'package', 'camp'].map((type) => (
                                    <Button
                                        key={type}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setTypeFilter(type)}
                                        className={cn(
                                            "h-10 rounded-lg text-xs font-bold capitalize px-4",
                                            typeFilter === type ? "bg-white text-[#219653] shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        {type}s
                                    </Button>
                                ))}
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg border-none bg-gray-50">
                                        <SlidersHorizontal className="w-5 h-5 text-[#219653]" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 rounded-lg border-none shadow-xl bg-white" align="end">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sort By</p>
                                            <div className="space-y-1">
                                                {['date', 'price', 'title'].map(s => (
                                                    <Button
                                                        key={s}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSortBy(s as any)}
                                                        className={cn(
                                                            "w-full justify-start rounded-md text-xs font-bold capitalize",
                                                            sortBy === s ? "bg-[#E2F1E8] text-[#219653]" : "text-gray-500"
                                                        )}
                                                    >
                                                        {s}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Trip Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedTrips.length > 0 ? (
                            filteredAndSortedTrips.map((trip: any) => (
                                <Card
                                    key={trip.id}
                                    className="p-5 border-none ring-1 ring-gray-100 shadow-sm rounded-lg hover:shadow-md transition-all group cursor-pointer relative"
                                    onClick={() => router.push(`/admin/trip/${trip.id}/bookings`)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#E2F1E8] flex items-center justify-center shrink-0">
                                                {trip.type === 'package' ? <Package className="w-5 h-5 text-[#219653]" /> : <Tag className="w-5 h-5 text-[#219653]" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-black group-hover:text-[#219653] transition-colors line-clamp-1">{trip.title}</h3>
                                                <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {trip.destination}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter rounded-full border-gray-100 text-gray-400">
                                            {trip.type}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 font-medium">Partner</span>
                                            <span className="font-bold text-black">{trip.Partner?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 font-medium">Bookings</span>
                                            <span className="font-black text-black">{trip.Bookings?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400 font-medium">Created On</span>
                                            <span className="font-bold text-black">{format(new Date(trip.createdAt), "dd MMM yyyy")}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-[8px] font-black text-gray-300 uppercase leading-none mb-1">Price</p>
                                            <span className="text-lg font-black text-[#219653]">₹{parseFloat(trip.price).toLocaleString()}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#E2F1E8] group-hover:text-[#219653]">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center">
                                <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-black">No trips found</h3>
                                <p className="text-sm text-gray-400">Adjust your search or filters to see more results</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(AdminTripsPage);
