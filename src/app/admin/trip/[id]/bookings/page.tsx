"use client";

import {
    ArrowLeft,
    Users,
    Calendar,
    MapPin,
    IndianRupee,
    Search,
    SlidersHorizontal,
    ClipboardCheck,
    Clock,
    Loader2,
    ChevronDown,
    ChevronUp,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function AdminTripBookingsPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const { data: response, isLoading } = useQuery({
        queryKey: ["admin-trip-bookings", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/admin/trips/${tripId}/bookings`);
            return response.data;
        },
        enabled: !!tripId,
    });

    const trip = response?.data?.trip;
    const bookings = response?.data?.bookings || [];
    const summary = response?.data?.summary;

    const filters = ["All", "Advance Paid", "Partially Paid", "Fully Paid", "Cancelled"];

    const getStatusLabel = (booking: any) => {
        const paidAmount = parseFloat(booking.paidAmount || "0");
        const totalAmount = parseFloat(booking.totalCost || "0");
        const status = booking.status?.toLowerCase();

        if (status === "cancelled") return "Cancelled";
        if (paidAmount >= totalAmount && totalAmount > 0) return "Fully Paid";
        if (paidAmount > 0 && paidAmount < totalAmount) return "Partially Paid";
        if (paidAmount > 0) return "Advance Paid";
        return "Pending";
    };

    const getStatusColor = (label: string) => {
        switch (label) {
            case "Fully Paid": return "bg-green-100 text-green-700";
            case "Partially Paid": return "bg-blue-100 text-blue-700";
            case "Advance Paid": return "bg-orange-100 text-orange-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const filteredAndSortedBookings = bookings
        .filter((booking: any) => {
            const primaryCustomer = booking.Customers?.find((c: any) => c.isPrimary) || booking.Customers?.[0];
            const name = primaryCustomer?.name?.toLowerCase() || "";
            const phone = primaryCustomer?.contactNumber || "";
            const query = searchQuery.toLowerCase();
            const matchesSearch = name.includes(query) || phone.includes(query);

            const statusLabel = getStatusLabel(booking);
            const matchesFilter = activeFilter === "All" || statusLabel === activeFilter;

            return matchesSearch && matchesFilter;
        })
        .sort((a: any, b: any) => {
            let comp = 0;
            if (sortBy === "date") {
                comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === "amount") {
                comp = parseFloat(a.paidAmount) - parseFloat(b.paidAmount);
            } else if (sortBy === "name") {
                const nameA = (a.Customers?.find((c: any) => c.isPrimary) || a.Customers?.[0])?.name || "";
                const nameB = (b.Customers?.find((c: any) => c.isPrimary) || b.Customers?.[0])?.name || "";
                comp = nameA.localeCompare(nameB);
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
                <h1 className="text-xl font-bold text-black flex-1 text-center">Manage Bookings</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
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
                            <h1 className="text-3xl font-bold text-black">Manage Bookings</h1>
                            <p className="text-sm text-gray-500 mt-1">{trip?.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none overflow-y-auto">
                <div className="max-w-5xl mx-auto pb-10">

                    {/* Trip Info Card */}
                    <Card className="p-4 rounded-2xl border-none ring-1 ring-gray-100 shadow-sm mb-4 bg-white relative gap-2">
                        <button
                            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                            className="absolute right-4 top-4 p-1 px-2 flex flex-row items-center text-xs rounded-full bg-[#219653]/10 text-[#219653] hover:text-[#219653] transition-colors"
                        >
                            <span>Overview</span>
                            {isStatsExpanded ? <ChevronUp className="w-5 h-5 text-[#219653]" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        <h2 className="text-lg font-semibold text-black mb-1 pr-16 truncate">{trip?.title}</h2>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400 font-medium">{trip?.destination}</span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs text-gray-400 font-bold">{bookings.length} Bookings</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#219653]" />
                                <span className="text-sm font-bold text-[#219653]">
                                    {trip ? (
                                        trip.type === 'package' ? (
                                            (trip.startDate && trip.endDate)
                                                ? `${format(new Date(trip.startDate), "MMM dd")} - ${format(new Date(trip.endDate), "dd, yyyy")}`
                                                : "Flexible Dates"
                                        ) : `${format(new Date(trip.startDate), "MMM dd")} - ${format(new Date(trip.endDate), "dd, yyyy")}`
                                    ) : "..."}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-[#219653]">₹{parseFloat(trip?.price || "0").toLocaleString()}</span>
                            </div>
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
                                <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-blue-50/50">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Total Members</p>
                                        <p className="text-lg font-bold text-black leading-none">{summary?.totalCustomers}</p>
                                    </div>
                                </Card>
                                <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-green-50/50">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Collected</p>
                                        <p className="text-lg font-bold text-green-600 leading-none">₹{summary?.totalCollected?.toLocaleString()}</p>
                                    </div>
                                </Card>
                                <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-red-50/50">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Pending</p>
                                        <p className="text-lg font-bold text-red-600 leading-none">₹{summary?.totalPending?.toLocaleString()}</p>
                                    </div>
                                </Card>
                                <Card className="p-4 border-none shadow-sm rounded-2xl ring-1 ring-gray-100/50 flex flex-row gap-3 bg-gray-50/50">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                        <ClipboardCheck className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mb-0.5">Fully Paid</p>
                                        <p className="text-lg font-bold text-black leading-none">{summary?.fullyPaidCustomers}</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Filters & Search */}
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {filters.map(f => (
                                <Button
                                    key={f}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "h-9 rounded-lg px-4 text-xs font-bold whitespace-nowrap",
                                        activeFilter === f ? "bg-[#219653] text-white hover:bg-[#1A7B44]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    )}
                                >
                                    {f}
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 bg-gray-50/50 border-gray-100 rounded-lg pr-10 focus-visible:ring-[#219653]"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-lg border-gray-100 bg-gray-50/50">
                                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-3 rounded-lg border-none shadow-xl bg-white" align="end">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sort By</p>
                                            <div className="space-y-1">
                                                {['date', 'amount', 'name'].map(s => (
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
                                                        {s === 'date' ? 'Booking Date' : s}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order</p>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn("flex-1 text-[10px] font-bold", sortOrder === 'asc' ? "bg-[#E2F1E8] text-[#219653]" : "")}
                                                    onClick={() => setSortOrder('asc')}
                                                >
                                                    ASC
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn("flex-1 text-[10px] font-bold", sortOrder === 'desc' ? "bg-[#E2F1E8] text-[#219653]" : "")}
                                                    onClick={() => setSortOrder('desc')}
                                                >
                                                    DESC
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Bookings List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bookings ({filteredAndSortedBookings.length})</h3>
                        </div>

                        {filteredAndSortedBookings.length > 0 ? (
                            filteredAndSortedBookings.map((booking: any) => {
                                const primaryCustomer = booking.Customers?.find((c: any) => c.isPrimary) || booking.Customers?.[0];
                                const statusLabel = getStatusLabel(booking);

                                return (
                                    <Card
                                        key={booking.id}
                                        className="p-4 border-none ring-1 ring-gray-100 shadow-sm rounded-lg bg-white group hover:ring-[#219653]/30 transition-all cursor-pointer"

                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#E2F1E8] text-[#219653] flex items-center justify-center font-bold">
                                                    {primaryCustomer?.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-black group-hover:text-[#219653] transition-colors">
                                                        {primaryCustomer?.name || "Unknown"}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-400 font-medium">{primaryCustomer?.contactNumber}</span>
                                                        <span className="text-gray-200">•</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{booking.activeMemberCount || 0} Members</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-full border-none shadow-none", getStatusColor(statusLabel))}>
                                                {statusLabel}
                                            </Badge>
                                        </div>

                                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between -mt-4">
                                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                <span className="flex items-center gap-1.5"><ClipboardCheck className="w-3.5 h-3.5" /> Booked: {format(new Date(booking.createdAt), "dd MMM")}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-gray-400 block leading-none mb-1">PAID</span>
                                                <span className="font-black text-[#219653]">₹{parseFloat(booking.paidAmount || "0").toLocaleString()}</span>
                                                <span className="text-[9px] text-gray-300 ml-1">/ ₹{parseFloat(booking.totalCost || "0").toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-100">
                                <ClipboardCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No bookings found</h4>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(AdminTripBookingsPage);
