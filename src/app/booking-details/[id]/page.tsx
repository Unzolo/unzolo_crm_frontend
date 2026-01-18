"use client";

import {
    ArrowLeft,
    Calendar,
    Users,
    Package,
    IndianRupee,
    Plus,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    X,
    Landmark,
    Check,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

function BookingDetailsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [paymentType, setPaymentType] = useState<"balance" | "custom">("balance");
    const [customAmount, setCustomAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("gpay");

    const { data: bookingResponse, isLoading } = useQuery({
        queryKey: ["booking", id],
        queryFn: async () => {
            const response = await api.get(`/bookings/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    const booking = bookingResponse?.data;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setSelectedFile(null);
    };

    const advanceAmount = (parseFloat(booking?.Trip?.advanceAmount || "0") * (booking?.Customers?.length || 0));

    const addPaymentMutation = useMutation({
        mutationFn: async () => {
            if (!paymentDate) throw new Error("Payment date is required");

            let finalAmount = 0;
            const remaining = parseFloat(booking.remainingAmount);

            if (paymentType === "balance") {
                finalAmount = remaining;
            } else {
                finalAmount = parseFloat(customAmount);
            }

            if (isNaN(finalAmount) || finalAmount <= 0) {
                throw new Error("Invalid amount");
            }

            if (finalAmount > remaining) {
                throw new Error("Amount cannot exceed the remaining balance");
            }


            const formData = new FormData();
            formData.append("amount", finalAmount.toString());
            formData.append("paymentType", paymentType);
            formData.append("paymentMethod", paymentMethod);
            formData.append("paymentDate", paymentDate.toISOString());

            if (selectedFile) {
                formData.append("screenshot", selectedFile);
            }

            const response = await api.post(`/bookings/${id}/payments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Payment added successfully");
            setIsUpdatePaymentOpen(false);
            setCustomAmount("");
            setSelectedFile(null);
            setImagePreview(null);
            queryClient.invalidateQueries({ queryKey: ["booking", id] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add payment");
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
            </div>
        );
    }

    if (!booking) {
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
                <h1 className="text-lg font-bold text-black flex-1 text-center ">Booking Details</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto pb-32">
                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start mt-2">
                        <div>
                            <h3 className=" text-black flex items-center gap-2 font-semibold">
                                {booking.Trip?.title || "Trip Title"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
                                <Calendar className="w-4 h-4" />
                                {booking.Trip?.startDate && format(new Date(booking.Trip.startDate), "do MMM")}
                                {booking.Trip?.endDate && ` - ${format(new Date(booking.Trip.endDate), "do MMM")}`}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold block mb-1 font-sans">
                                B.ID : #{booking.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge className="bg-[#E2F1E8] text-[#219653] border-none shadow-none rounded-md px-3 font-bold capitalize">
                                {booking.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h4 className="text-lg font-semibold text-black">Participants Details</h4>
                        </div>
                        <div className="space-y-2">
                            {booking.Customers?.map((p: any, i: number) => (
                                <Card key={p.id || i} className="p-4 border-none bg-gray-50/50 rounded-2xl flex flex-row justify-between shadow-none">
                                    <div className="flex flex-row gap-3">
                                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                                            <Users className="w-6 h-6 text-[#219653]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-black">{p.name}</p>
                                            <p className="text-[12px] text-gray-400 font-medium">
                                                {p.age} yrs • {p.gender === 'male' ? "♂" : p.gender === 'female' ? "♀" : ""} {p.gender}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                        {p.isPrimary ? "Primary" : "Member"}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h4 className="text-lg font-semibold text-black">Payment Summary</h4>
                        </div>
                        <Card className="p-4 border-none bg-gray-50/50 rounded-[20px] shadow-none">
                            <div className="grid grid-cols-2 gap-y-3">
                                <div className="space-y-0.5">
                                    <p className="text-xs text-gray-400 font-medium">Total Amount</p>
                                    <p className="text-lg font-bold text-[#219653]">₹{booking.totalCost}</p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-xs text-gray-400 font-medium">Remaining</p>
                                    <p className="text-lg font-bold text-red-500">₹{booking.remainingAmount}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-gray-400 font-medium">Paid So Far</p>
                                    <p className="text-lg font-bold text-black">₹{booking.paidAmount}</p>
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
                                                    {payment.paymentType === 'full' ? 'Full Payment' :
                                                        payment.paymentType === 'advance' ? 'Advance Payment' :
                                                            payment.paymentType === 'balance' ? 'Balance Payment' : 'Custom Payment'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" /> {format(new Date(payment.paymentDate), "do MMM, yyyy p")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-extrabold text-[#219653]">₹{payment.amount}</p>
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-50 flex gap-4">
                <Button
                    onClick={() => setIsUpdatePaymentOpen(true)}
                    disabled={booking.remainingAmount <= 0}
                    className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-5 rounded-full text-white font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Update Payment
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        const bookingData = {
                            trip: booking.Trip,
                            customers: booking.Customers,
                            amount: booking.amount,
                            paidAmount: booking.paidAmount
                        };
                        const encoded = encodeURIComponent(JSON.stringify(bookingData));
                        router.push(`/cancel-booking?data=${encoded}`);
                    }}
                    className="flex-1 py-5 rounded-full border-2 border-[#219653] text-[#219653] font-bold hover:bg-[#F5F9F7]"
                >
                    Cancel Booking
                </Button>
            </div>

            {/* Update Payment Drawer */}
            <Drawer open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen}>
                <DrawerContent className="bg-white rounded-t-[40px] px-0 max-h-[96vh] outline-none border-none">
                    <div className="overflow-y-auto px-6 pb-32">
                        <DrawerHeader className="p-0 mb-6 text-center">
                            <DrawerTitle className="text-lg pt-4 font-bold text-black my-1">Payment Details</DrawerTitle>
                        </DrawerHeader>

                        <div className="mb-6">
                            <h3 className=" text-black font-semibold">{booking.Trip?.title}</h3>
                            <p className="text-xs text-gray-400 font-bold">Participants : {booking.Customers?.length} Adults</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            {/* Full Payment */}
                            <Card
                                onClick={() => setPaymentType("balance")}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-row justify-between ${paymentType === "balance" ? "border-[#219653] bg-[#E2F1E8]/20" : "border-[#E2F1E8]/50 bg-gray-50/30 shadow-none border-none"}`}
                            >
                                <div className="flex flex-row gap-4">
                                    <div className="relative pl-4">
                                        <div className="w-12 h-12 rounded-full bg-[#219653] flex items-center justify-center">
                                            <Landmark className="w-6 h-6 text-white" />
                                        </div>
                                        {paymentType === "balance" && (
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#219653] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-[#219653]" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-black">Balance Amount</p>
                                        <p className="text-xs text-gray-400 font-medium">Pay complete remaining amount</p>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-[#219653]">₹{booking.remainingAmount}</span>
                            </Card>



                            {/* Custom Amount */}
                            <Card
                                onClick={() => setPaymentType("custom")}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-row justify-between ${paymentType === "custom" ? "border-[#219653] bg-[#E2F1E8]/20" : "border-[#E2F1E8]/50 bg-gray-50/30 shadow-none border-none"}`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative pl-4">
                                        <div className="w-12 h-12 rounded-full bg-[#219653] flex items-center justify-center">
                                            <Landmark className="w-6 h-6 text-white" />
                                        </div>
                                        {paymentType === "custom" && (
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#219653] flex items-center justify-center">
                                                <Check className="w-3 h-3 text-[#219653]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-black mb-2">Custom Amount</p>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Enter Amount here"
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                className="h-8 bg-white/50 border-[#E2F1E8] rounded-md text-[10px]"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            {/* Payment Method */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Payment Method</label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="h-14 bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653] text-gray-500 font-medium w-full">
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpay">GPay</SelectItem>
                                        <SelectItem value="phonepe">PhonePe</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Payment Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full h-14 justify-start text-left font-normal bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653] relative px-4",
                                                !paymentDate && "text-muted-foreground"
                                            )}
                                        >
                                            {paymentDate ? format(paymentDate, "PPP") : <span className="text-gray-300 font-medium">Pick a date</span>}
                                            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-[#E2F1E8] rounded-2xl" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={paymentDate}
                                            onSelect={setPaymentDate}
                                            initialFocus
                                            className="rounded-2xl border-none"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Screenshot Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Screenshot (optional)</label>
                                {!imagePreview ? (
                                    <>
                                        <input
                                            type="file"
                                            id="update-payment-screenshot"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <label
                                            htmlFor="update-payment-screenshot"
                                            className="border-2 border-dashed border-[#E2F1E8] rounded-2xl p-8 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <ImageIcon className="w-10 h-10 text-[#219653] mb-2" />
                                            <p className="text-sm text-gray-400 font-medium text-center">Upload Transaction Screenshot</p>
                                        </label>
                                    </>
                                ) : (
                                    <div className="relative rounded-2xl overflow-hidden border border-[#E2F1E8] bg-gray-50 min-h-[150px] flex items-center justify-center">
                                        <img
                                            src={imagePreview}
                                            alt="Screenshot preview"
                                            className="max-w-full max-h-64 object-contain"
                                        />
                                        <Button
                                            onClick={removeImage}
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm shadow-lg z-10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 flex gap-4">
                        <Button
                            className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg shadow-lg shadow-green-100"
                            onClick={() => addPaymentMutation.mutate()}
                            disabled={addPaymentMutation.isPending}
                        >
                            {addPaymentMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default withAuth(BookingDetailsPage);
