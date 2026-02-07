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
    Tag,
    IndianRupee,
    RotateCcw,
    History
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
import { Badge } from "@/components/ui/badge";
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
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

function SelectTripPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date" | "price" | "title">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [isDeletedTripsOpen, setIsDeletedTripsOpen] = useState(false);
    const queryClient = useQueryClient();
    const isDesktop = useMediaQuery("(min-width: 1024px)");

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
            queryClient.invalidateQueries({ queryKey: ["deleted-trips"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete trip");
        }
    });

    const { data: deletedTripsResponse, isLoading: deletedTripsLoading } = useQuery({
        queryKey: ["deleted-trips"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/trips/deleted");
            return response.data;
        },
        enabled: isDeletedTripsOpen
    });

    const recoverTripMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiWithOffline.patch(`/trips/${id}/recover`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Trip recovered successfully");
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            queryClient.invalidateQueries({ queryKey: ["deleted-trips"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to recover trip");
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

    const DeletedTripsContent = () => (
        <div className="flex-1 overflow-y-auto px-6 pb-12">
            {deletedTripsLoading ? (
                <div className="space-y-3 mt-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
            ) : deletedTripsResponse?.data?.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No deleted trips found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 mt-4">
                    {deletedTripsResponse?.data?.map((trip: any) => (
                        <Card key={trip.id} className="p-4 border border-gray-100 bg-white hover:bg-[#F9FAFB] transition-all rounded-[16px] flex flex-row items-center justify-between group shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-white transition-colors">
                                    {trip.type === "package" ? (
                                        <Package className="w-5 h-5 text-gray-400 group-hover:text-[#219653] transition-colors" />
                                    ) : (
                                        <Tent className="w-5 h-5 text-gray-400 group-hover:text-[#219653] transition-colors" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h4 className="text-[14px] font-bold text-black truncate max-w-[110px] leading-tight mb-0.5">
                                        {trip.title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[8px] bg-gray-100/50 text-gray-500 border-none px-1.5 h-3.5 flex items-center uppercase font-bold tracking-tighter shrink-0">
                                            {trip.type === "package" ? "Pkg" : "Camp"}
                                        </Badge>
                                        <div className="flex items-center gap-1 min-w-0">
                                            <MapPin className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[60px]">{trip.destination}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => recoverTripMutation.mutate(trip.id)}
                                disabled={recoverTripMutation.isPending}
                                className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-[10px] text-xs h-10 px-3 shadow-lg shadow-[#219653]/20 hover:shadow-[#219653]/40 transition-all active:scale-95"
                            >
                                {recoverTripMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Recover</span>
                                    </div>
                                )}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );


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
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Manage Bookings</h1>
                        <p className="text-sm text-gray-500 mt-1">Select a trip to view and manage its bookings</p>
                    </div>
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
                            <TabsContent value="camps" className="outline-none w-full">
                                {tripsLoading ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {Array.from({ length: 6 }).map((_, i) => (
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
                                        ))}
                                    </div>
                                ) : (camps.upcoming.length > 0 || camps.completed.length > 0) ? (
                                    <div className="space-y-6">
                                        {camps.upcoming.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between ml-1 pr-1">
                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Upcoming Camps</h3>
                                                    <button
                                                        onClick={() => setIsDeletedTripsOpen(true)}
                                                        className="flex items-center gap-1.5 text-gray-400 hover:text-[#219653] transition-colors group px-2 py-1 rounded-lg hover:bg-[#E2F1E8]/50"
                                                    >
                                                        <History className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Trash</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {camps.upcoming.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            router={router}
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
                                                            router={router}
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

                            <TabsContent value="packages" className="outline-none m-0">
                                {tripsLoading ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {Array.from({ length: 6 }).map((_, i) => (
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
                                        ))}
                                    </div>
                                ) : (packages.upcoming.length > 0 || packages.completed.length > 0) ? (
                                    <div className="space-y-6">
                                        {packages.upcoming.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between ml-1 pr-1">
                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Upcoming Packages</h3>
                                                    <button
                                                        onClick={() => setIsDeletedTripsOpen(true)}
                                                        className="flex items-center gap-1.5 text-gray-400 hover:text-[#219653] transition-colors group px-2 py-1 rounded-lg hover:bg-[#E2F1E8]/50"
                                                    >
                                                        <History className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Trash</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {packages.upcoming.map((trip: any) => (
                                                        <TripCard
                                                            key={trip._id || trip.id}
                                                            trip={trip}
                                                            router={router}
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
                                                            router={router}
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


            {/* Recovery Drawer/Sheet */}
            {/* Recovery Drawer/Sheet */}
            {isDesktop ? (
                <Sheet open={isDeletedTripsOpen} onOpenChange={setIsDeletedTripsOpen}>
                    <SheetContent className="bg-white p-0 flex flex-col h-full">
                        <SheetHeader className="text-center shrink-0 pt-6 pb-4">
                            <SheetTitle className="text-xl font-bold flex items-center justify-center gap-2">
                                <History className="w-6 h-6 text-[#219653]" />
                                Recover Deleted Trips
                            </SheetTitle>
                        </SheetHeader>
                        <DeletedTripsContent />
                    </SheetContent>
                </Sheet>
            ) : (
                <Drawer open={isDeletedTripsOpen} onOpenChange={setIsDeletedTripsOpen}>
                    <DrawerContent className="bg-white rounded-t-[32px] outline-none max-h-[85vh] flex flex-col">
                        <DrawerHeader className="text-center shrink-0 pt-6 pb-4">
                            <DrawerTitle className="text-xl font-bold flex items-center justify-center gap-2">
                                <History className="w-6 h-6 text-[#219653]" />
                                Recover Deleted Trips
                            </DrawerTitle>
                        </DrawerHeader>
                        <DeletedTripsContent />
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
}

function TripCard({ trip, onClick, onEdit, onDelete, router }: { trip: any, onClick: () => void, onEdit: () => void, onDelete: () => void, router: any }) {
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
                "p-2.5 px-3 rounded-[16px] shadow-none border ring-1 ring-gray-100 transition-all cursor-pointer group active:scale-[0.99] space-y-1.5 relative overflow-hidden",
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
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/expenses/${trip._id || trip.id}`);
                        }}
                        title="Manage Expenses"
                    >
                        <IndianRupee className="w-3.5 h-3.5" />
                    </Button> */}
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            const bookingCount = trip.bookingCount || 0;
                            const message = bookingCount > 0
                                ? `This trip has ${bookingCount} active booking(s). Deleting it will hide it from new bookings, but existing bookings will remain. Are you sure?`
                                : "Are you sure you want to delete this trip?";

                            if (window.confirm(message)) {
                                onDelete();
                            }
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            <div className="flex items-end justify-between pt-1">
                <div className="text-left">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider mb-0.5">
                        {trip.type === "package" ? "From Price" : "Trip Price"}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <span className="text-sm font-black text-[#219653]">₹{parseFloat(trip.price).toLocaleString()}</span>
                    </div>
                </div>
                {trip.totalExpenses > 0 && (
                    <div className="bg-[#EE5A6F]/5 border border-[#EE5A6F]/10 px-2.5 py-1.5 rounded-xl flex items-center gap-2 group-hover:bg-[#EE5A6F]/10 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-[#EE5A6F]/10 flex items-center justify-center shrink-0">
                            <IndianRupee className="w-3 h-3 text-[#EE5A6F]" />
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[7px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Expenses</span>
                            <span className="text-[11px] font-black text-[#EE5A6F]">₹{parseFloat(trip.totalExpenses).toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default withAuth(SelectTripPage);
