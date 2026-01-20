"use client";

import {
    ArrowLeft,
    Search,
    SlidersHorizontal,
    MapPin,
    Calendar,
    Pencil,
    Loader2,
    Trash2,
    Tent,
    Package,
    Tag
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
    budget_friendly: "Budget Friendly",
    heritage_culture: "Heritage & Culture",
    spiritual: "Spiritual",
    international: "International",
    honeymoon: "Honeymoon",
    group_trips: "Group Trips",
};
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { withAuth } from "@/components/auth/with-auth";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

function SelectTripPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "price" | "title">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const queryClient = useQueryClient();

    const { data: tripsResponse, isLoading: tripsLoading } = useQuery({
        queryKey: ["trips"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/trips");
            return response.data;
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiWithOffline.delete(`/trips/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Trip deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete trip");
        }
    });

    const allTrips = tripsResponse?.data || [];

    const isTripCompleted = (trip: any) => {
        if (!trip.startDate) return false;
        return new Date(trip.startDate) < new Date(new Date().setHours(0, 0, 0, 0));
    };

    const processTrips = (trips: any[]) => {
        return trips
            .filter((trip) => {
                const query = searchQuery.toLowerCase();
                return (
                    trip.title.toLowerCase().includes(query) ||
                    trip.destination.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === "date") {
                    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                    comparison = dateA - dateB;
                } else if (sortBy === "price") {
                    comparison = parseFloat(a.price) - parseFloat(b.price);
                } else if (sortBy === "title") {
                    comparison = a.title.localeCompare(b.title);
                }
                return sortOrder === "desc" ? -comparison : comparison;
            });
    };

    const camps = useMemo(() => {
        const filtered = allTrips.filter((t: any) => t.type === "camp");
        const processed = processTrips(filtered);
        return {
            upcoming: processed.filter(t => !isTripCompleted(t)),
            completed: processed.filter(t => isTripCompleted(t))
        };
    }, [allTrips, searchQuery, sortBy, sortOrder]);

    const packages = useMemo(() => {
        const filtered = allTrips.filter((t: any) => t.type === "package");
        const processed = processTrips(filtered);
        return {
            upcoming: processed.filter(t => !isTripCompleted(t)),
            completed: processed.filter(t => isTripCompleted(t))
        };
    }, [allTrips, searchQuery, sortBy, sortOrder]);

    const formatTripDate = (start: string, end: string) => {
        try {
            return `${format(new Date(start), "do MMM")} - ${format(new Date(end), "do MMM")}`;
        } catch {
            return "Date TBD";
        }
    };

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header - Mobile Only */}
            <div className="p-4 flex items-center justify-between lg:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/")}
                    className="text-black hover:bg-transparent px-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-black flex-1 text-center">Manage Bookings</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-black">Manage Bookings</h1>
                    <p className="text-sm text-gray-500 mt-1">Select a trip to view and manage its bookings</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none overflow-hidden flex flex-col">
                <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
                    <div className="shrink-0">
                        <div className="mb-6 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                <h2 className="text-lg lg:text-xl font-bold text-black">Select Trip</h2>
                            </div>
                            <p className="text-xs lg:text-sm text-gray-400 font-medium ml-3">Choose a camp or package to manage its bookings</p>
                        </div>

                        {/* Search and Sort */}
                        <div className="flex gap-2 mb-6 px-1">
                            <div className="relative flex-1">
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by title or destination"
                                    className="h-12 bg-gray-50/50 border-gray-100 rounded-xl pr-10 focus-visible:ring-[#219653] placeholder:text-sm"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#219653]" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-none bg-gray-50/50">
                                        <SlidersHorizontal className="w-5 h-5 text-[#219653]" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 rounded-2xl border-none shadow-xl bg-white" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</p>
                                            <div className="grid grid-cols-1 gap-1">
                                                {[
                                                    { label: "Trip Date", value: "date" },
                                                    { label: "Price", value: "price" },
                                                    { label: "Title", value: "title" },
                                                ].map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSortBy(option.value as any)}
                                                        className={cn(
                                                            "w-full justify-start rounded-lg text-sm",
                                                            sortBy === option.value ? "bg-[#E2F1E8] text-[#219653] font-bold" : "text-gray-600"
                                                        )}
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="h-px bg-gray-100" />
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSortOrder("asc")}
                                                    className={cn(
                                                        "flex-1 rounded-lg text-sm py-2 px-3 transition-colors",
                                                        sortOrder === "asc" ? "bg-[#E2F1E8] text-[#219653] font-bold" : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {sortBy === "date" ? "Oldest" : "Asc"}
                                                </button>
                                                <button
                                                    onClick={() => setSortOrder("desc")}
                                                    className={cn(
                                                        "flex-1 rounded-lg text-sm py-2 px-3 transition-colors",
                                                        sortOrder === "desc" ? "bg-[#E2F1E8] text-[#219653] font-bold" : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {sortBy === "date" ? "Latest" : "Desc"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <Tabs defaultValue="camps" className="w-full flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2 bg-[#E2F1E8] rounded-xl p-1 h-11 shrink-0 mb-4">
                            <TabsTrigger
                                value="camps"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-bold"
                            >
                                Camps ({camps.upcoming.length + camps.completed.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="packages"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-bold"
                            >
                                Packages ({packages.upcoming.length + packages.completed.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto pb-4 pr-1 -mr-1">
                            <TabsContent value="camps" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 outline-none m-0">
                                {tripsLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <Card key={i} className="p-4 rounded-[20px] bg-white border-none shadow-sm ring-1 ring-gray-100 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <Skeleton className="w-16 h-6 rounded-lg" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-3/4 rounded-md" />
                                                <Skeleton className="h-4 w-1/2 rounded-md" />
                                            </div>
                                            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                                <Skeleton className="h-6 w-24 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                            </div>
                                        </Card>
                                    ))
                                ) : (camps.upcoming.length > 0 || camps.completed.length > 0) ? (
                                    <div className="space-y-6">
                                        {camps.upcoming.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-wider">Upcoming Camps</h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {camps.upcoming.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            onEdit={() => router.push(`/edit-trip/${trip._id || trip.id}`)}
                                                            onDelete={() => deleteTripMutation.mutate(trip._id || trip.id)}
                                                            onClick={() => router.push(`/manage-bookings/${trip._id || trip.id}`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {camps.completed.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-wider">Completed Camps</h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75">
                                                    {camps.completed.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            onEdit={() => router.push(`/edit-trip/${trip._id || trip.id}`)}
                                                            onDelete={() => deleteTripMutation.mutate(trip._id || trip.id)}
                                                            onClick={() => router.push(`/manage-bookings/${trip._id || trip.id}`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 px-10">
                                        <p className="text-gray-400 font-medium">No camps found matching your search.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="packages" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 outline-none m-0">
                                {tripsLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <Card key={i} className="p-4 rounded-[20px] bg-white border-none shadow-sm ring-1 ring-gray-100 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <Skeleton className="w-10 h-10 rounded-xl" />
                                                <Skeleton className="w-16 h-6 rounded-lg" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-3/4 rounded-md" />
                                                <Skeleton className="h-4 w-1/2 rounded-md" />
                                            </div>
                                            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                                <Skeleton className="h-6 w-24 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                            </div>
                                        </Card>
                                    ))
                                ) : (packages.upcoming.length > 0 || packages.completed.length > 0) ? (
                                    <div className="space-y-6">
                                        {packages.upcoming.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-wider">Upcoming Packages</h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {packages.upcoming.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            onEdit={() => router.push(`/edit-trip/${trip._id || trip.id}`)}
                                                            onDelete={() => deleteTripMutation.mutate(trip._id || trip.id)}
                                                            onClick={() => router.push(`/manage-bookings/${trip._id || trip.id}`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {packages.completed.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-gray-400 ml-1 uppercase tracking-wider">Completed Packages</h3>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75">
                                                    {packages.completed.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            onEdit={() => router.push(`/edit-trip/${trip._id || trip.id}`)}
                                                            onDelete={() => deleteTripMutation.mutate(trip._id || trip.id)}
                                                            onClick={() => router.push(`/manage-bookings/${trip._id || trip.id}`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 px-10">
                                        <p className="text-gray-400 font-medium">No packages found matching your search.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function TripCard({ trip, onClick, onEdit, onDelete }: { trip: any, onClick: () => void, onEdit: () => void, onDelete: () => void }) {
    const isCompleted = trip.endDate ? new Date(trip.endDate) < new Date(new Date().setHours(0, 0, 0, 0)) : (trip.startDate ? new Date(trip.startDate) < new Date(new Date().setHours(0, 0, 0, 0)) : false);

    const formatTripDate = (start: string, end: string) => {
        try {
            return `${format(new Date(start), "do MMM")} - ${format(new Date(end), "do MMM")}`;
        } catch {
            return "Date TBD";
        }
    };

    return (
        <Card
            onClick={onClick}
            className={cn(
                "p-2.5 px-3 rounded-[16px] shadow-none border-[1px] ring-1 ring-gray-100 transition-all cursor-pointer group active:scale-[0.99] space-y-1.5 relative overflow-hidden",
                isCompleted ? "bg-gray-50/50 hover:ring-gray-300" : "bg-white hover:shadow-md hover:ring-[#219653]/30"
            )}
        >
            {isCompleted && (
                <div className="absolute top-0 right-0">
                    <div className="bg-gray-400 text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-tighter">
                        Completed
                    </div>
                </div>
            )}
            <div className="flex justify-between items-start ">
                <div className="min-w-0 flex-1 pr-2 flex flex-row gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0 group-hover:bg-[#219653] transition-colors">
                        {trip.type === "package" ? (
                            <Package className="w-5 h-5 text-[#219653] group-hover:text-white transition-colors" />
                        ) : (
                            <Tent className="w-5 h-5 text-[#219653] group-hover:text-white transition-colors" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-black group-hover:text-[#219653] transition-colors truncate">
                            {trip.title}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                            {trip.type === "package" ? (
                                <>
                                    <Tag className="w-3 h-3 text-gray-400" />
                                    <span className="text-[11px] font-medium text-gray-500 truncate max-w-[150px]">
                                        {CATEGORY_LABELS[trip.category] || trip.category || "Package"}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span className="text-[11px] font-medium text-gray-500">
                                        {formatTripDate(trip.startDate, trip.endDate)}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-[11px] text-gray-400 font-medium truncate">{trip.destination}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#219653] bg-[#E2F1E8]/50 hover:bg-[#E2F1E8] rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between -mt-3">
                <div className="text-left">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block -mb-0.5 tracking-wider">
                        {trip.type === "package" ? "From Price" : "Total Price"}
                    </span>
                    <span className="text-sm font-extrabold text-[#219653]">₹{parseFloat(trip.price).toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
}

export default withAuth(SelectTripPage);
