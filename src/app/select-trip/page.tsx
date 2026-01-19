"use client";

import {
    ArrowLeft,
    Search,
    SlidersHorizontal,
    MapPin,
    Calendar,
    Pencil,
    Loader2,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
                    comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                } else if (sortBy === "price") {
                    comparison = parseFloat(a.price) - parseFloat(b.price);
                } else if (sortBy === "title") {
                    comparison = a.title.localeCompare(b.title);
                }
                return sortOrder === "desc" ? -comparison : comparison;
            });
    };

    const camps = useMemo(() => processTrips(allTrips.filter((t: any) => t.type === "camp")), [allTrips, searchQuery, sortBy, sortOrder]);
    const packages = useMemo(() => processTrips(allTrips.filter((t: any) => t.type === "package")), [allTrips, searchQuery, sortBy, sortOrder]);

    const formatTripDate = (start: string, end: string) => {
        try {
            return `${format(new Date(start), "MMM dd")} - ${format(new Date(end), "dd, yyyy")}`;
        } catch {
            return "Date TBD";
        }
    };

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
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

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] p-4 shadow-2xl overflow-y-auto pb-10">
                <div className="mb-6 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                        <h2 className="text-lg font-bold text-black">Select Trip</h2>
                    </div>
                    <p className="text-xs text-gray-400 font-medium ml-3">Choose a camp or package to manage its bookings</p>
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSortOrder("asc")}
                                            className={cn(
                                                "flex-1 rounded-lg text-sm",
                                                sortOrder === "asc" ? "bg-[#E2F1E8] text-[#219653] font-bold" : "text-gray-600"
                                            )}
                                        >
                                            Asc
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSortOrder("desc")}
                                            className={cn(
                                                "flex-1 rounded-lg text-sm",
                                                sortOrder === "desc" ? "bg-[#E2F1E8] text-[#219653] font-bold" : "text-gray-600"
                                            )}
                                        >
                                            Desc
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <Tabs defaultValue="camps" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#E2F1E8] rounded-xl p-1 h-11 mb-6">
                        <TabsTrigger
                            value="camps"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-bold"
                        >
                            Camps ({camps.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="packages"
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-bold"
                        >
                            Packages ({packages.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-2">
                        <TabsContent value="camps" className="space-y-4 outline-none">
                            {tripsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
                                    <p className="text-gray-400 font-medium">Loading camps...</p>
                                </div>
                            ) : camps.length > 0 ? (
                                camps.map((trip: any) => (
                                    <TripCard
                                        key={trip._id || trip.id}
                                        trip={trip}
                                        onEdit={() => router.push(`/edit-trip/${trip._id || trip.id}`)}
                                        onDelete={() => deleteTripMutation.mutate(trip._id || trip.id)}
                                        onClick={() => router.push(`/manage-bookings/${trip._id || trip.id}`)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20 px-10">
                                    <p className="text-gray-400 font-medium">No camps found matching your search.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="packages" className="space-y-4 outline-none">
                            {tripsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
                                    <p className="text-gray-400 font-medium">Loading packages...</p>
                                </div>
                            ) : packages.length > 0 ? (
                                packages.map((trip: any) => (
                                    <TripCard
                                        key={trip.id}
                                        trip={trip}
                                        onEdit={() => router.push(`/edit-trip/${trip.id}`)}
                                        onDelete={() => deleteTripMutation.mutate(trip.id)}
                                        onClick={() => router.push(`/manage-bookings/${trip.id}`)}
                                    />
                                ))
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
    );
}

function TripCard({ trip, onClick, onEdit, onDelete }: { trip: any, onClick: () => void, onEdit: () => void, onDelete: () => void }) {
    const formatTripDate = (start: string, end: string) => {
        try {
            return `${format(new Date(start), "MMM dd")} - ${format(new Date(end), "dd, yyyy")}`;
        } catch {
            return "Date TBD";
        }
    };

    return (
        <Card
            onClick={onClick}
            className="p-3 rounded-[16px] shadow-none border-none ring-1 ring-gray-100 shadow-sm hover:shadow-md hover:ring-[#219653]/30 transition-all cursor-pointer group active:scale-[0.99] gap-2 space-y-2"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1 pr-4">
                    <h3 className="text-base font-bold text-black group-hover:text-[#219653] transition-colors truncate">{trip.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium truncate">{trip.destination}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[#219653] bg-[#E2F1E8]/50 hover:bg-[#E2F1E8] rounded-xl"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="h-px bg-gray-50 my-0" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E2F1E8] flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#219653]" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                        {formatTripDate(trip.startDate, trip.endDate)}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block -mb-1 tracking-wider">Total Price</span>
                    <span className="text-base font-extrabold text-[#219653]">₹{parseFloat(trip.price).toLocaleString()}</span>
                </div>
            </div>
        </Card>
    );
}

export default withAuth(SelectTripPage);
