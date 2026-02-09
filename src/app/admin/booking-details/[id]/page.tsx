"use client";

import {
    ArrowLeft,
    Calendar,
    Users,
    Package,
    IndianRupee,
    MoreVertical,
    Trash2,
    RotateCcw,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";

function AdminBookingDetailsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();

    const { data: bookingResponse, isLoading } = useQuery({
        queryKey: ["booking", id],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/admin/bookings/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (isActive: boolean) => {
            const response = await apiWithOffline.patch(`/admin/bookings/${id}/status`, { isActive });
            return response.data;
        },
        onSuccess: (data) => {
            const isActive = data.data.isActive;
            toast.success(`Booking ${isActive ? 'activated' : 'deactivated'} successfully`);
            queryClient.invalidateQueries({ queryKey: ["booking", id] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings"] });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || "Failed to update status";
            toast.error(errorMessage);
        },
    });

    const booking = bookingResponse?.data;

    if (!isLoading && !booking) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <p className="text-gray-500">Booking not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-black hover:bg-transparent px-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold text-black flex-1 text-center">Booking Details</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-full transition-colors",
                        booking?.isActive ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                    )}
                    onClick={() => toggleStatusMutation.mutate(!booking?.isActive)}
                    disabled={toggleStatusMutation.isPending}
                >
                    {toggleStatusMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : booking?.isActive ? (
                        <Trash2 className="w-5 h-5" />
                    ) : (
                        <RotateCcw className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto pb-10">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {/* Header Info */}
                    <div className="flex justify-between items-start mt-2">
                        <div className="flex-1">
                            {isLoading ? (
                                <Skeleton className="h-7 w-3/4 mb-2" />
                            ) : (
                                <h3 className=" text-black flex items-center gap-2 font-semibold">
                                    {booking.Trip?.title || "Trip Title"}
                                </h3>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
                                <Calendar className="w-4 h-4" />
                                {isLoading ? (
                                    <Skeleton className="h-4 w-32" />
                                ) : (
                                    booking.Trip?.type === 'package' ? (
                                        booking.preferredDate ? `Preferred: ${format(new Date(booking.preferredDate), "do MMM, yyyy")}` : "Flexible Dates"
                                    ) : (
                                        <>
                                            {booking.Trip?.startDate && format(new Date(booking.Trip.startDate), "do MMM")}
                                            {booking.Trip?.endDate && ` - ${format(new Date(booking.Trip.endDate), "do MMM")}`}
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            {isLoading ? (
                                <Skeleton className="h-8 w-20 rounded-md" />
                            ) : (
                                <>
                                    <Badge className="bg-[#E2F1E8] text-[#219653] border-none shadow-none rounded-md px-3 font-bold capitalize">
                                        {booking.status}
                                    </Badge>
                                    {!booking.isActive && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-600 border-none shadow-none rounded-md px-2 py-0 text-[10px] uppercase font-bold">
                                            Inactive
                                        </Badge>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h4 className="text-lg font-semibold text-black">Participants Details</h4>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {booking?.Customers?.map((p: any, i: number) => (
                                <Card key={p.id || i} className={cn(
                                    "p-4 border-none rounded-2xl flex flex-row justify-between shadow-none relative overflow-hidden",
                                    p.status === 'cancelled' ? "bg-red-50/50 opacity-80" : "bg-gray-50/50"
                                )}>
                                    <div className="flex flex-row gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                                            <Users className={cn("w-6 h-6", p.status === 'cancelled' ? "text-red-400" : "text-[#219653]")} />
                                        </div>
                                        <div>
                                            <p className={cn("text-sm font-bold", p.status === 'cancelled' ? "text-red-900" : "text-black")}>{p.name}</p>
                                            <p className="text-[12px] text-gray-400 font-medium">
                                                {p.age} yrs • {p.gender === 'male' ? "♂" : p.gender === 'female' ? "♀" : ""} {p.gender}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                                            {p.isPrimary ? "Primary" : "Member"}
                                        </span>
                                        {p.status === 'cancelled' && (
                                            <Badge variant="destructive" className="text-[8px] px-2 py-0 h-4 bg-red-100 text-red-600 border-none shadow-none uppercase font-bold">
                                                Cancelled
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                            {booking?.Trip?.type === 'package' && (booking.totalMemberCount || booking.memberCount || 0) > (booking.Customers?.length || 0) && (
                                <Card className="p-4 rounded-2xl flex flex-row justify-between shadow-none bg-gray-50/30 border-dashed border-2 border-gray-100">
                                    <div className="flex flex-row gap-3 items-center">
                                        <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400">
                                                + {(booking.totalMemberCount || booking.memberCount || 0) - (booking.Customers?.length || 0)} Other Members
                                            </p>
                                            <p className="text-[10px] text-gray-300 font-medium uppercase tracking-tight">Unnamed Participants</p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h4 className="text-lg font-semibold text-black">Payment Summary</h4>
                        </div>
                        <Card className="p-4 border-none bg-gray-50/50 rounded-[24px] shadow-none">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Total Amount</p>
                                    <p className="text-xl font-bold text-[#219653]">₹{parseFloat(booking?.totalCost || "0").toLocaleString()}</p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Paid so far</p>
                                    <p className="text-xl font-bold text-black">₹{parseFloat(booking?.paidAmount || "0").toLocaleString()}</p>
                                </div>

                                {parseFloat(booking?.refundAmount || "0") > 0 && (
                                    <div className="col-span-2 flex items-center justify-between py-2 px-3 bg-white/60 rounded-xl border border-gray-100/50">
                                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Refunded Amount</p>
                                        <p className="text-sm font-bold text-orange-500">₹{parseFloat(booking?.refundAmount || "0").toLocaleString()}</p>
                                    </div>
                                )}

                                <div className="col-span-2 pt-2 border-t border-dashed border-gray-200">
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-tight mb-1">
                                            {parseFloat(booking?.remainingAmount || "0") < 0 ? "Refund Due" : "Remaining Balance"}
                                        </p>
                                        <p className={cn(
                                            "text-2xl font-semibold leading-none",
                                            parseFloat(booking?.remainingAmount || "0") < 0 ? "text-orange-500" :
                                                parseFloat(booking?.remainingAmount || "0") === 0 ? "text-[#219653]" : "text-red-500"
                                        )}>
                                            ₹{parseFloat(booking?.remainingAmount || "0").toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Payment Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h4 className="text-lg font-semibold text-black">Payment Timeline</h4>
                        </div>
                        <div className="space-y-6 pl-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {isLoading ? (
                                <div className="space-y-6">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ) : (
                                <>
                                    {booking.Payments?.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                        .map((payment: any, i: number) => (
                                            <div key={payment.id || i} className="flex items-center justify-between relative">
                                                <div className="absolute left-[-17px] w-4 h-4 rounded-full bg-[#B9DBC8]" />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0">
                                                        <IndianRupee className="w-4 h-4 text-[#219653]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black leading-tight">
                                                            {payment.paymentType === 'refund' ? 'Refund' :
                                                                payment.paymentType === 'full' ? 'Full Payment' :
                                                                    payment.paymentType === 'advance' ? 'Advance Payment' :
                                                                        payment.paymentType === 'balance' ? 'Balance Payment' : 'Custom Payment'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3" /> {format(new Date(payment.paymentDate), "do MMM, yyyy p")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "text-sm font-extrabold",
                                                        payment.paymentType === 'refund' ? "text-red-500" : "text-[#219653]"
                                                    )}>
                                                        {payment.paymentType === 'refund' ? `-₹${payment.amount}` : `₹${payment.amount}`}
                                                    </p>
                                                    {payment.method && <p className="text-[9px] text-gray-400 font-bold uppercase">{payment.method}</p>}
                                                </div>
                                            </div>
                                        ))}

                                    <div className="flex items-center justify-between relative">
                                        <div className="absolute left-[-17px] w-4 h-4 rounded-full bg-[#B9DBC8]" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0">
                                                <Package className="w-4 h-4 text-[#219653]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-black leading-tight">Booking Created</p>
                                                <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" /> {format(new Date(booking.createdAt), "do MMM, yyyy p")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(AdminBookingDetailsPage);
