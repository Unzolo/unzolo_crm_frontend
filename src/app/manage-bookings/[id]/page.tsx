"use client";

import {
    ArrowLeft,
    Plus,
    MapPin,
    Calendar,
    Users,
    IndianRupee,
    Search,
    SlidersHorizontal,
    ClipboardCheck,
    Package,
    Loader2,
    ChevronDown,
    ChevronUp,
    Clock
} from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PwaInstallBanner } from "@/components/pwa-install-prompt";

function ManageBookingPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const { data: bookingsResponse, isLoading } = useQuery({
        queryKey: ["bookings", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/bookings?tripId=${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    const summary = bookingsResponse?.data?.summary;
    const bookings = bookingsResponse?.data?.bookings || [];

    // Separate fetch for trip details to ensure header is correct even if no bookings
    const { data: tripResponse } = useQuery({
        queryKey: ["trip", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/trips/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    const trip = tripResponse?.data;

    const totalMembers = bookings.reduce((acc: number, b: any) => acc + (b.memberCount || b.Customers?.length || 0), 0);

    const stats = [
        {
            type: "simple",
            label: "Total Members",
            value: totalMembers.toString(),
            icon: <Users className="w-5 h-5 text-[#219653]" />,
            color: "text-black"
        },
        {
            type: "split",
            left: { label: "Adv Paid", value: summary?.advancePaidCustomers?.toString() || "0", color: "text-orange-400" },
            right: { label: "Full Paid", value: summary?.fullyPaidCustomers?.toString() || "0", color: "text-[#219653]" }
        },
        {
            type: "simple",
            label: "Total Collected",
            value: `₹${summary?.totalCollected?.toLocaleString() || "0"}`,
            icon: <ClipboardCheck className="w-5 h-5 text-[#219653]" />,
            color: "text-[#219653]"
        },
        {
            type: "simple",
            label: "Total Pending",
            value: `₹${summary?.totalPending?.toLocaleString() || "0"}`,
            icon: <IndianRupee className="w-5 h-5 text-[#219653]" />,
            color: "text-red-600"
        },
    ];

    const filters = ["All", "Advance Paid", "Partially Paid", "Fully Paid", "Partially Cancelled", "Cancelled"];

    const getStatusColor = (status: string, paidAmount: number, totalAmount: number, advanceAmount: number) => {
        if (status?.toLowerCase() === "cancelled") return "bg-red-50 text-red-500";
        if (status?.toLowerCase() === "partial_cancelled") return "bg-orange-50 text-orange-600";
        if (paidAmount >= totalAmount && totalAmount > 0) return "bg-green-50 text-[#219653]";
        if (paidAmount > advanceAmount && paidAmount < totalAmount) return "bg-blue-50 text-blue-600";
        if (paidAmount > 0) return "bg-orange-50 text-orange-400";
        return "bg-gray-50 text-gray-500";
    };

    const getStatusLabel = (status: string, paidAmount: number, totalAmount: number, advanceAmount: number) => {
        if (status?.toLowerCase() === "cancelled") return "Cancelled";
        if (status?.toLowerCase() === "partial_cancelled") return "Partially Cancelled";
        if (paidAmount >= totalAmount && totalAmount > 0) return "Fully Paid";
        if (paidAmount > advanceAmount && paidAmount < totalAmount) return "Partially Paid";
        if (paidAmount > 0) return "Advance Paid";
        return "Pending";
    };

    const filteredAndSortedBookings = bookings
        .filter((booking: any) => {
            const primaryCustomer = booking.Customers?.find((c: any) => c.isPrimary) || booking.Customers?.[0];
            const name = primaryCustomer?.name?.toLowerCase() || "";
            const phone = primaryCustomer?.contactNumber || "";
            const query = searchQuery.toLowerCase();

            const matchesSearch = name.includes(query) || phone.includes(query);

            let matchesFilter = true;

            const paidAmount = parseFloat(booking.netPaidAmount || booking.paidAmount || "0");
            const totalAmount = parseFloat(booking.totalCost || booking.amount || "0");
            const memberCount = booking.Customers?.filter((c: any) => c.status !== 'cancelled').length || booking.memberCount || 0;
            const advanceAmount = parseFloat(trip?.advanceAmount || "0") * (booking.Customers?.length || 0);
            const statusLabel = getStatusLabel(booking.status, paidAmount, totalAmount, advanceAmount);

            if (activeFilter !== "All") {
                matchesFilter = statusLabel === activeFilter;
            }

            return matchesSearch && matchesFilter;
        })
        .sort((a: any, b: any) => {
            const primaryA = a.Customers?.find((c: any) => c.isPrimary) || a.Customers?.[0];
            const primaryB = b.Customers?.find((c: any) => c.isPrimary) || b.Customers?.[0];

            let comparison = 0;
            if (sortBy === "date") {
                comparison = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime();
            } else if (sortBy === "amount") {
                comparison = parseFloat(a.amount) - parseFloat(b.amount);
            } else if (sortBy === "name") {
                comparison = (primaryA?.name || "").localeCompare(primaryB?.name || "");
            }

            return sortOrder === "desc" ? -comparison : comparison;
        });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
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
                <h1 className="text-xl font-bold text-black flex-1 text-center">Manage Bookings</h1>
                <Button
                    onClick={() => router.push(`/create-booking?tripId=${tripId}`)}
                    className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-full px-4 h-9 gap-1 font-semibold"
                >
                    <Plus className="w-4 h-4" /> Add
                </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Manage Bookings</h1>
                        <p className="text-sm text-gray-500 mt-1">{trip?.title || "Loading..."}</p>
                    </div>
                    <Button
                        onClick={() => router.push(`/create-booking?tripId=${tripId}`)}
                        className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-full px-6 h-12 gap-2 font-semibold"
                    >
                        <Plus className="w-5 h-5" /> Add Booking
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Trip Info Card */}
                    <Card className="p-4 rounded-2xl border-none ring-1 ring-gray-100 shadow-sm mb-4 bg-white relative gap-2">
                        <button
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                            className="absolute right-4 top-4 p-1 px-2 flex flex-row items-center text-xs rounded-full bg-gray-[#219653]/10 text-[#219653] hover:text-[#219653] transition-colors"
                        >
                            <span>Overview</span>
                            {isStatsExpanded ? <ChevronUp className="w-5 h-5 text-[#219653]" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <h2 className="text-lg font-semibold text-black mb-1 pr-16 truncate">{trip?.title || "Loading..."}</h2>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">{trip?.destination || "..."}</span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs text-gray-400 font-bold">{bookings.length} Bookings</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#219653]" />
                                <span className="text-sm font-bold text-[#219653]">
                                    {trip ? `${format(new Date(trip.startDate), "MMM dd")} - ${format(new Date(trip.endDate), "dd, yyyy")}` : "..."}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-[#219653]">₹{parseFloat(trip?.price || "0").toLocaleString()}</span>
                        </div>
                    </Card>

                    {isStatsExpanded && <div className="flex items-center gap-2 mb-3 mt-4">
                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                        <h2 className="text-sm font-bold text-black">Overview</h2>
                    </div>}

                    {/* Stats Grid */}
                    {isStatsExpanded && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                {stats.map((stat, index) => {
                                    if (stat.type === "split") {
                                        return (
                                            <Card key={index} className="p-4 border-none shadow-sm rounded-2xl bg-white ring-1 ring-gray-50 flex flex-row items-center justify-between col-span-1">
                                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                    <span className="text-[12px] text-black font-medium leading-tight mb-2 whitespace-nowrap">{stat.left?.label}</span>
                                                    <span className={`text-lg font-bold leading-tight ${stat.left?.color}`}>{stat.left?.value}</span>
                                                </div>
                                                <div className="w-px h-10 bg-gray-100 shrink-0" />
                                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                    <span className="text-[12px] text-black font-medium leading-tight mb-2 whitespace-nowrap">{stat.right?.label}</span>
                                                    <span className={`text-lg font-bold leading-tight ${stat.right?.color}`}>{stat.right?.value}</span>
                                                </div>
                                            </Card>
                                        );
                                    }
                                    return (
                                        <Card key={index} className="p-4 border-none shadow-sm rounded-2xl bg-white ring-1 ring-gray-50 flex flex-row gap-3">
                                            {stat.icon && (
                                                <div className="w-9 h-9 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0">
                                                    <div className="scale-90">{stat.icon}</div>
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[12px] text-gray-500 font-medium leading-tight mb-0.5">{stat.label}</span>
                                                <span className={`text-base font-bold leading-tight ${stat.color}`}>{stat.value}</span>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Filters Row */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
                        {filters.map((filter) => (
                            <Button
                                key={filter}
                                variant="outline"
                                onClick={() => setActiveFilter(filter)}
                                className={`rounded-lg px-3 h-9 whitespace-nowrap border-gray-200 text-xs font-medium transition-all ${activeFilter === filter
                                    ? "bg-[#E2F1E8] border-[#219653] text-[#219653]"
                                    : "bg-white text-gray-500"
                                    }`}
                            >
                                {filter}
                            </Button>
                        ))}
                    </div>

                    {/* Search and Sort */}
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customer"
                                className="h-11 bg-gray-50/50 border-gray-200 rounded-xl pr-10 focus-visible:ring-[#219653] placeholder:text-sm"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#219653]" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-none bg-gray-50/50">
                                    <SlidersHorizontal className="w-5 h-5 text-[#219653]" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3 rounded-2xl border-none shadow-xl bg-white" align="end">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {[
                                                { label: "Booking Date", value: "date" },
                                                { label: "Amount", value: "amount" },
                                                { label: "Customer Name", value: "name" },
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

                    <p className="text-sm font-bold text-black mb-3 ml-1">
                        {filteredAndSortedBookings.length} Bookings
                    </p>

                    {/* Bookings List */}
                    <div className="space-y-2 pb-12 2xl:grid 2xl:grid-cols-3 gap-4">
                        {filteredAndSortedBookings.length > 0 ? (
                            filteredAndSortedBookings.map((booking: any) => {
                                const isCancelled = booking.status?.toLowerCase() === 'cancelled';
                                const isPartialCancelled = booking.status?.toLowerCase() === 'partial_cancelled';

                                const primaryCustomer = booking.Customers?.find((c: any) => c.isPrimary) || booking.Customers?.[0];
                                const paidAmount = parseFloat(booking.netPaidAmount || booking.paidAmount || "0");
                                const totalAmount = parseFloat(booking.totalCost || booking.amount || "0");
                                const activeMemberCount = booking.Customers?.filter((c: any) => c.status !== 'cancelled').length || booking.memberCount || 0;
                                const totalMemberCount = booking.Customers?.length || booking.memberCount || 0;
                                const advanceAmount = parseFloat(trip?.advanceAmount || "0") * totalMemberCount;

                                const calculatedRefund = booking.Payments?.filter((p: any) => p.paymentType === 'refund').reduce((acc: number, curr: any) => acc + parseFloat(curr.amount || 0), 0) || 0;

                                // Fallback calculation for list view if aggregated field is missing
                                const initialTotal = (parseFloat(booking.Trip?.price || trip?.price || "0") * totalMemberCount);
                                const impliedRefund = isPartialCancelled && initialTotal > paidAmount ? initialTotal - paidAmount : 0;

                                const refundAmount = booking.refundAmount || calculatedRefund || impliedRefund;

                                return (
                                    <Card
                                        key={booking._id || booking.id}
                                        onClick={() => router.push(`/booking-details/${booking._id || booking.id}`)}
                                        className={cn(
                                            "p-3 pt-5 2xl:h-24 rounded-2xl border-[1px] ring-1 ring-gray-50 shadow-sm relative group overflow-hidden cursor-pointer active:scale-[0.99] transition-all hover:border-[#219653]/30",
                                            isPartialCancelled ? "bg-orange-50/30 border-orange-100" :
                                                isCancelled ? "bg-red-50/30 border-red-100" : "bg-white border-[#219653]/10"
                                        )}
                                    >
                                        <span className="absolute top-1.5 right-3 text-[9px] text-gray-400 font-medium flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> {format(new Date(booking.bookingDate), "dd MMM, yyyy h:mm a")}
                                        </span>
                                        <div className="flex items-start gap-3 mt-1">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                isPartialCancelled ? "bg-orange-100" :
                                                    isCancelled ? "bg-red-100" : "bg-[#E2F1E8]"
                                            )}>
                                                <Package className={cn(
                                                    "w-5 h-5",
                                                    isPartialCancelled ? "text-orange-600" :
                                                        isCancelled ? "text-red-600" : "text-[#219653]"
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-bold text-black mb-0.5">
                                                    {primaryCustomer?.name || "No Name"} - {primaryCustomer?.contactNumber || "No Number"}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-medium mb-1">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {activeMemberCount} members
                                                    </span>
                                                    {!isCancelled && !isPartialCancelled ? (
                                                        <span className="flex items-center gap-1 text-[12px]">
                                                            <span className="text-gray-400">₹{paidAmount.toLocaleString()}</span>/
                                                            <span className="text-[#219653]">₹{totalAmount.toLocaleString()}</span>
                                                        </span>
                                                    ) : null}
                                                    <Badge className={`border-none shadow-none text-[8px] px-2 py-0.5 rounded-md font-bold ${getStatusColor(booking.status, paidAmount, totalAmount, advanceAmount)}`}>
                                                        {getStatusLabel(booking.status, paidAmount, totalAmount, advanceAmount)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <ClipboardCheck className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-black mb-2">No Bookings Found</h3>
                                <p className="text-sm text-gray-500 mb-8 max-w-[200px]">Start adding customers to this trip to manage bookings.</p>
                                <Button
                                    onClick={() => router.push(`/create-booking?tripId=${tripId}`)}
                                    className="bg-[#219653] hover:bg-[#1A7B44] px-8 py-6 rounded-full text-white font-bold text-lg shadow-lg shadow-green-100"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Add Booking
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <PwaInstallBanner />
        </div>
    );
}

export default withAuth(ManageBookingPage);
