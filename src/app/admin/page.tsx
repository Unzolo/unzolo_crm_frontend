"use client";

import {
    ArrowLeft,
    Users,
    Package,
    ClipboardCheck,
    IndianRupee,
    ShieldCheck,
    Search,
    ChevronRight,
    Loader2,
    Settings,
    MoreVertical,
    LogOut,
    Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function AdminDashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllPerformers, setShowAllPerformers] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingState, setPendingState] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    // Check profile
    const { data: profileResponse, isLoading: profileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
    });

    const userEmail = profileResponse?.data?.email || "";
    const hasAccess = userEmail === "unzoloapp@gmail.com";

    // Global Stats
    const { data: statsResponse, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/stats");
            return response.data;
        },
        enabled: hasAccess
    });

    // All Partners
    const { data: partnersResponse, isLoading: partnersLoading } = useQuery({
        queryKey: ["admin-partners"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/partners");
            return response.data;
        },
        enabled: hasAccess
    });

    // Recent Activities Query
    const { data: actsResponse, isLoading: actsLoading } = useQuery({
        queryKey: ["admin-activities"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/activities");
            return response.data;
        },
        enabled: hasAccess,
        staleTime: 0
    });

    // Helper to get nested data safely
    const rawData = actsResponse?.data || actsResponse;
    const rawTrips = rawData?.trips || [];
    const rawBookings = rawData?.bookings || [];

    const activities = [
        ...rawTrips.map((trip: any) => ({
            id: `trip-${trip.id || trip._id}`,
            type: 'trip_created',
            partnerName: trip.Partner?.name || 'A partner',
            tripTitle: trip.title,
            createdAt: new Date(trip.createdAt || trip.timestamp || Date.now()),
            icon: <Package className="w-4 h-4 text-orange-600" />,
            color: 'bg-orange-100',
            text: `created a new trip`,
            target: `/admin/trip/${trip.id || trip._id}/bookings`
        })),
        ...rawBookings.map((booking: any) => ({
            id: `booking-${booking.id || booking._id}`,
            type: 'booking_added',
            partnerName: booking.Partner?.name || booking.Trip?.Partner?.name || 'A partner',
            tripTitle: booking.Trip?.title || 'a trip',
            createdAt: new Date(booking.createdAt || booking.timestamp || Date.now()),
            icon: <ClipboardCheck className="w-4 h-4 text-green-600" />,
            color: 'bg-green-100',
            text: `added a booking for`,
            target: `/admin/booking-details/${booking.id || booking._id}`
        }))
    ].filter(a => a.createdAt.toString() !== 'Invalid Date')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return await apiWithOffline.patch(`/admin/partners/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
            toast.success("Partner status updated");
        }
    });

    // Maintenance Mode Management
    const { data: maintenanceData } = useQuery({
        queryKey: ["maintenance-mode"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/settings/maintenance");
            return response.data;
        },
        enabled: hasAccess
    });

    // Top Performers Query
    const { data: performersResponse, isLoading: performersLoading } = useQuery({
        queryKey: ["admin-top-performers"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/admin/performers");
            return response.data;
        },
        enabled: hasAccess
    });

    const topPerformers = performersResponse?.data || [];

    const maintenanceMutation = useMutation({
        mutationFn: async (isEnabled: boolean) => {
            return await apiWithOffline.post("/admin/settings/maintenance", { isEnabled });
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["maintenance-mode"] });
            toast.success(data.message || "Maintenance mode updated");
        },
        onError: () => {
            toast.error("Failed to update maintenance mode");
        }
    });

    const isMaintenanceOn = maintenanceData?.data?.maintenanceMode || false;

    const handleConfirmToggle = (newState: boolean) => {
        setPendingState(newState);
        setIsConfirmOpen(true);
    };

    const confirmMaintenanceChange = () => {
        maintenanceMutation.mutate(pendingState);
        setIsConfirmOpen(false);
    };

    const globalStats = statsResponse?.data || {
        totalPartners: 0,
        totalTrips: 0,
        totalBookings: 0,
        totalEarnings: 0
    };

    const stats = [
        { label: "Partners", value: globalStats.totalPartners, icon: <Users className="w-5 h-5" /> },
        { label: "Trips", value: globalStats.totalTrips, icon: <Package className="w-5 h-5" /> },
        { label: "Bookings", value: globalStats.totalBookings, icon: <ClipboardCheck className="w-5 h-5" /> },
        { label: "Total Revenue", value: `₹${globalStats.totalEarnings.toLocaleString()}`, icon: <IndianRupee className="w-5 h-5" /> },
    ];

    const allPartners = partnersResponse?.data || [];
    const filteredPartners = allPartners.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">You do not have permission to view the admin platform.</p>
                <Button onClick={() => router.push("/")} className="bg-[#219653]">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header - Mobile Only */}
            <div className="p-4 flex items-center justify-between lg:hidden bg-[#E2F1E8]">
                <h1 className="text-xl font-bold text-black flex-1 text-center">Admin Platform</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-red-500 hover:bg-red-50"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-[#219653]" />
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-black">Admin Platform</h1>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Global management for Unzolo CRM</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance Mode</span>
                            <div
                                onClick={() => handleConfirmToggle(!isMaintenanceOn)}
                                className={cn(
                                    "w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300",
                                    isMaintenanceOn ? "bg-red-500" : "bg-gray-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                                    isMaintenanceOn ? "left-7" : "left-1"
                                )} />
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-8 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-blue-50/50">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Partners</p>
                                {statsLoading ? (
                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                ) : (
                                    <p className="text-lg font-bold text-black leading-none">{globalStats.totalPartners}</p>
                                )}
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-orange-50/50">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Trips</p>
                                {statsLoading ? (
                                    <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                                ) : (
                                    <p className="text-lg font-bold text-black leading-none">{globalStats.totalTrips}</p>
                                )}
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-green-50/50">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                <ClipboardCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Bookings</p>
                                {statsLoading ? (
                                    <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                                ) : (
                                    <p className="text-lg font-bold text-black leading-none">{globalStats.totalBookings}</p>
                                )}
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-purple-50/50">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                <IndianRupee className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Revenue</p>
                                {statsLoading ? (
                                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                                ) : (
                                    <p className="text-lg font-bold text-purple-600 leading-none">₹{globalStats.totalEarnings.toLocaleString()}</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Partners List Section (Moved to Top) */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                <h2 className="text-xl font-bold text-black">Registered Partners</h2>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                                {allPartners.length} Total
                            </span>
                        </div>

                        <div className="relative">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search partners by name or email..."
                                className="h-12 bg-white border-gray-100 rounded-xl pr-12 focus-visible:ring-[#219653] shadow-sm"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {partnersLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="p-6 h-32 animate-pulse bg-gray-50 rounded-2xl border-none" />
                                ))
                            ) : filteredPartners.length > 0 ? (
                                filteredPartners.map((partner: any) => (
                                    <Card
                                        key={partner.id}
                                        onClick={() => router.push(`/admin/partner/${partner.id}`)}
                                        className="p-4 border-none ring-1 ring-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-all group bg-white"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[#219653] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                                    {partner.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-black truncate text-sm group-hover:text-[#219653] transition-colors">{partner.name}</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge className={cn(
                                                            "text-[8px] uppercase font-black tracking-tighter px-1.5 py-0 rounded-full border-none",
                                                            partner.status === "active" ? "bg-green-100 text-green-700" :
                                                                partner.status === "blocked" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                                        )}>
                                                            {partner.status}
                                                        </Badge>
                                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            <Package className="w-2.5 h-2.5" /> {partner.Trips?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#219653] transition-colors" />
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <h3 className="text-sm font-bold text-black">No partners found</h3>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start py-4">
                        {/* Recent Activity Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                <h2 className="text-xl font-bold text-black">Recent Activity</h2>
                            </div>
                            <Card className="p-4 border-none ring-1 ring-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                                {actsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                                <div className="w-10 h-10 rounded-full bg-gray-100" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                                                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : activities.length > 0 ? (
                                    <div className="space-y-6">
                                        {activities.map((activity, idx) => (
                                            <div key={activity.id} className="relative flex items-start gap-4 group cursor-pointer" onClick={() => router.push(activity.target)}>
                                                {idx !== activities.length - 1 && (
                                                    <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-gray-100" />
                                                )}
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10", activity.color)}>
                                                    {activity.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-bold text-black">{activity.partnerName}</span>
                                                        {' '}{activity.text}{' '}
                                                        <span className="font-bold text-[#219653]">{activity.tripTitle}</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                                                        <Activity className="w-3 h-3" />
                                                        {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#219653] transition-colors mt-2" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <Activity className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-sm">No recent activity found</p>
                                    </div>
                                )}
                            </Card>
                        </div>


                        {/* Right Column: Settings + Performers */}
                        <div className="space-y-8">
                            {/* Global Settings Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                    <h2 className="text-xl font-bold text-black">Global Settings</h2>
                                </div>
                                <Card className="p-4 border-none ring-1 ring-gray-100 shadow-sm rounded-2xl flex items-center justify-between bg-white relative">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-black text-sm">Under Maintenance Mode</h3>
                                        <p className="text-[10px] text-gray-500 font-medium leading-tight mt-1">Normal users will see a maintenance screen.</p>
                                    </div>

                                    <div
                                        onClick={() => handleConfirmToggle(!isMaintenanceOn)}
                                        className={cn(
                                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300",
                                            isMaintenanceOn ? "bg-red-500" : "bg-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                                            isMaintenanceOn ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </div>
                                </Card>
                            </div>

                            {/* Top Performers Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                        <h2 className="text-xl font-bold text-black">Top Performers</h2>
                                    </div>
                                    {topPerformers.length > 3 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowAllPerformers(!showAllPerformers)}
                                            className="w-8 h-8 rounded-full hover:bg-green-50 text-[#219653] transition-all"
                                        >
                                            <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", showAllPerformers ? "-rotate-90" : "rotate-0")} />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {performersLoading ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {[1, 2, 3].map(i => (
                                                <Card key={i} className="h-32 animate-pulse bg-gray-50 rounded-2xl border-none ring-1 ring-gray-100" />
                                            ))}
                                        </div>
                                    ) : topPerformers.length > 0 ? (
                                        <>
                                            <div className={cn(
                                                "grid gap-3 transition-all duration-500",
                                                showAllPerformers ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"
                                            )}>
                                                {(showAllPerformers ? topPerformers : topPerformers.slice(0, 3)).map((performer: any, idx: number) => (
                                                    <Card
                                                        key={performer.id}
                                                        className={cn(
                                                            "p-3 border-none ring-1 ring-gray-100 shadow-sm rounded-2xl bg-white flex items-center transition-all cursor-pointer group hover:ring-[#219653]/30",
                                                            showAllPerformers ? "flex-row gap-4" : "flex-col text-center space-y-2"
                                                        )}
                                                        onClick={() => router.push(`/admin/partner/${performer.id}`)}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-black shrink-0 shadow-inner",
                                                            idx === 0 ? "bg-yellow-400" :
                                                                idx === 1 ? "bg-slate-300 text-slate-700" :
                                                                    idx === 2 ? "bg-orange-300 text-orange-800" :
                                                                        "bg-gray-100 text-gray-500"
                                                        )}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div className={cn("min-w-0", showAllPerformers ? "flex-1" : "w-full")}>
                                                            <h3 className="font-bold text-black text-[11px] truncate w-full">{performer.name}</h3>
                                                            <div className={cn("flex", showAllPerformers ? "items-center gap-3 mt-0.5" : "flex-col mt-1 space-y-0.5")}>
                                                                <p className="text-[9px] text-gray-500 font-bold leading-none">{performer.bookingsCount} Bookings</p>
                                                                {showAllPerformers && <span className="w-1 h-1 rounded-full bg-gray-200 shrink-0" />}
                                                                <p className="text-[10px] font-black text-[#219653]">₹{parseFloat(performer.totalRevenue || 0).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {showAllPerformers && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#219653]" />}
                                                    </Card>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <Card className="p-8 text-center text-gray-500 rounded-2xl border-none ring-1 ring-gray-100">
                                            <p className="text-xs font-medium">No performer data available yet.</p>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Confirmation Modal */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm p-6 border-none shadow-2xl rounded-3xl bg-white animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center",
                                pendingState ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                            )}>
                                <ShieldCheck className="w-8 h-8" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-black">Confirm Action</h3>
                                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    Are you sure you want to {pendingState ? "ENABLE" : "DISABLE"} maintenance mode?
                                    {pendingState ? " Normal users will be blocked from accessing the platform." : " All users will regain access to the platform."}
                                </p>
                            </div>

                            <div className="flex flex-col w-full gap-3 pt-2">
                                <Button
                                    onClick={confirmMaintenanceChange}
                                    className={cn(
                                        "w-full h-12 rounded-full font-bold text-white shadow-lg",
                                        pendingState ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-[#219653] hover:bg-[#1A7B44] shadow-green-100"
                                    )}
                                >
                                    Yes, {pendingState ? "Enable" : "Disable"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="w-full h-12 rounded-full font-bold text-gray-400"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default withAuth(AdminDashboardPage);
