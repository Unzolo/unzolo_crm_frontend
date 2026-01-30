"use client";

import {
    ArrowLeft,
    Users,
    Package,
    ClipboardCheck,
    IndianRupee,
    Phone,
    Mail,
    Calendar,
    ChevronRight,
    Loader2,
    ShieldCheck,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Search,
    Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

function AdminPartnerDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const partnerId = params.id;
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

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

    // Fetch Partner Details
    const { data: partnerResponse, isLoading: partnerLoading } = useQuery({
        queryKey: ["admin-partner", partnerId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/admin/partners/${partnerId}`);
            return response.data;
        },
        enabled: hasAccess && !!partnerId
    });

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return await apiWithOffline.patch(`/admin/partners/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-partner", partnerId] });
            toast.success("Partner status updated");
        }
    });

    // Update Subscription Mutation
    const subscriptionMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiWithOffline.patch(`/admin/partners/${partnerId}/subscription`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-partner", partnerId] });
            toast.success("Subscription updated");
        }
    });

    const partner = partnerResponse?.data;

    if (profileLoading || partnerLoading) {
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
                <Button onClick={() => router.push("/")} className="bg-[#219653]">Go Back</Button>
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-black mb-2">Partner Not Found</h1>
                <Button onClick={() => router.push("/admin")} className="bg-[#219653]">Back to Admin</Button>
            </div>
        );
    }

    // Calculate Partner Stats
    const totalTrips = partner.Trips?.length || 0;
    const totalBookings = partner.Trips?.reduce((sum: number, trip: any) => sum + (trip.Bookings?.length || 0), 0) || 0;
    const totalRevenue = partner.Trips?.reduce((sum: number, trip: any) => {
        return sum + (trip.Bookings?.reduce((bSum: number, booking: any) => {
            return bSum + (booking.Payments?.reduce((pSum: number, payment: any) => {
                return pSum + (payment.status === 'completed' ? parseFloat(payment.amount) : 0);
            }, 0) || 0);
        }, 0) || 0);
    }, 0) || 0;

    const allTripsCount = partner.Trips?.length || 0;
    const filteredTrips = partner.Trips?.filter((trip: any) => {
        const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || trip.type === typeFilter;
        return matchesSearch && matchesType;
    }) || [];

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
                <h1 className="text-xl font-bold text-black flex-1 text-center truncate px-4">{partner.name}</h1>
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
                            <h1 className="text-3xl font-bold text-black">{partner.name}</h1>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> {partner.email}
                                <span className="text-gray-300">|</span>
                                Member since {format(new Date(partner.createdAt), "PPP")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-8 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-8 pb-10">

                    {/* Subscription & Access Management (Testing Only) */}
                    {partner.email === 'muhammedrafeeqvr805@gmail.com' && (
                        <Card className="p-6 rounded-2xl border-none ring-1 ring-gray-100 shadow-sm bg-white overflow-hidden">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck className="w-5 h-5 text-[#219653]" />
                                <h3 className="text-lg font-bold text-black">Subscription & Access</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing Plan</label>
                                    <div className="flex gap-2">
                                        {(['free', 'pro'] as const).map((plan) => (
                                            <Button
                                                key={plan}
                                                size="sm"
                                                variant={partner.plan === plan ? "default" : "outline"}
                                                className={cn(
                                                    "flex-1 h-10 rounded-xl text-xs font-bold uppercase",
                                                    partner.plan === plan ? "bg-[#219653] hover:bg-[#1b7a43]" : "text-gray-400 border-gray-100"
                                                )}
                                                onClick={() => subscriptionMutation.mutate({ plan })}
                                                disabled={subscriptionMutation.isPending}
                                            >
                                                {plan}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp Notifications</label>
                                    <Button
                                        variant={partner.isWhatsappEnabled ? "default" : "outline"}
                                        className={cn(
                                            "w-full h-10 rounded-xl text-xs font-bold uppercase transition-all",
                                            partner.isWhatsappEnabled ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-100" : "text-gray-400 border-gray-100"
                                        )}
                                        onClick={() => subscriptionMutation.mutate({ isWhatsappEnabled: !partner.isWhatsappEnabled })}
                                        disabled={subscriptionMutation.isPending}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {partner.isWhatsappEnabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valid Until</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            defaultValue={partner.subscriptionExpires ? format(new Date(partner.subscriptionExpires), "yyyy-MM-dd") : ""}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val) subscriptionMutation.mutate({ subscriptionExpires: new Date(val).toISOString() });
                                            }}
                                            className="h-10 bg-gray-50 border-none rounded-xl text-sm font-medium focus-visible:ring-[#219653]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {partner.plan === 'pro' && !partner.subscriptionExpires && (
                                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold text-red-600">Pro plan active but no expiry date set.</span>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Partner Info Card */}
                    <Card className="p-4 rounded-2xl border-none ring-1 ring-gray-100 shadow-sm mb-4 bg-white relative">
                        <div className="absolute right-4 top-4 flex items-center gap-2">
                            <Badge className={cn(
                                "text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full border-none",
                                partner.status === "active" ? "bg-green-100 text-green-700" :
                                    partner.status === "blocked" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                            )}>
                                {partner.status}
                            </Badge>

                            {partner.status === 'active' ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-bold px-3 transition-colors"
                                    onClick={() => statusMutation.mutate({ id: partner.id, status: 'blocked' })}
                                    disabled={statusMutation.isPending}
                                >
                                    {statusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Block"}
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-full border-green-100 text-green-600 hover:bg-green-50 text-[10px] font-bold px-3 transition-colors"
                                    onClick={() => statusMutation.mutate({ id: partner.id, status: 'active' })}
                                    disabled={statusMutation.isPending}
                                >
                                    {statusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Activate"}
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 pr-32">
                                <div className="w-14 h-14 rounded-full bg-[#219653] text-white flex items-center justify-center text-xl font-bold shrink-0">
                                    {partner.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-bold text-black truncate">{partner.name}</h2>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                                            <Mail className="w-3.5 h-3.5" /> <span className="truncate">{partner.email}</span>
                                        </div>
                                        {partner.phone && (
                                            <>
                                                <span className="text-gray-300">|</span>
                                                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                                                    <Phone className="w-3.5 h-3.5" /> {partner.phone}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-4">
                                <div className="bg-blue-50/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trips</span>
                                    <span className="text-lg font-black text-black leading-none">{totalTrips}</span>
                                </div>
                                <div className="bg-orange-50/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bookings</span>
                                    <span className="text-lg font-black text-black leading-none">{totalBookings}</span>
                                </div>
                                <div className="bg-green-50/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue</span>
                                    <span className="text-lg font-black text-[#219653] leading-none">₹{totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Trips & Bookings Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-6 h-6 text-[#219653]" />
                                <h3 className="text-xl font-bold text-black">Trips & Performance</h3>
                                <Badge variant="outline" className="rounded-lg border-gray-100 text-gray-400 font-bold ml-1">
                                    {allTripsCount}
                                </Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Input
                                        placeholder="Search trips..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 bg-gray-50 border-none rounded-lg focus-visible:ring-[#219653] pr-10 min-w-[200px]"
                                    />
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                                    {['all', 'package', 'camp'].map((type) => (
                                        <Button
                                            key={type}
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setTypeFilter(type)}
                                            className={cn(
                                                "h-8 rounded-lg text-xs font-bold capitalize px-3",
                                                typeFilter === type ? "bg-white text-[#219653] shadow-sm" : "text-gray-400"
                                            )}
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filteredTrips.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredTrips.map((trip: any) => (
                                    <Card
                                        key={trip.id}
                                        className="p-6 border-none ring-1 ring-gray-100 shadow-sm rounded-lg bg-white overflow-hidden group cursor-pointer active:scale-[0.99] transition-all"
                                        onClick={() => router.push(`/admin/trip/${trip.id}/bookings`)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-black truncate group-hover:text-[#219653] transition-colors">
                                                        {trip.title}
                                                    </h4>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400 border-gray-200">
                                                        {trip.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {trip.startDate ? format(new Date(trip.startDate), "dd MMM yyyy") : "Open Date"}</span>
                                                    <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> {trip.Bookings?.length || 0} Bookings</span>
                                                </p>
                                            </div>


                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg py-12 text-center border-2 border-dashed border-gray-100">
                                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <h4 className="text-lg font-bold text-gray-400">
                                    {searchQuery || typeFilter !== 'all' ? "No trips matching filters" : "No trips created yet"}
                                </h4>
                                {(searchQuery || typeFilter !== 'all') && (
                                    <Button
                                        variant="link"
                                        className="text-[#219653] font-bold mt-2"
                                        onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}
                                    >
                                        Clear all filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(AdminPartnerDetailsPage);
