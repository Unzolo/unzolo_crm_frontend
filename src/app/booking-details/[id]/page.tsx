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
    Loader2,
    Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const participantSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name is required"),
    gender: z.enum(["male", "female", "other"]),
    age: z.coerce.number().min(1, "Age is required"),
    contactNumber: z.string().optional(),
    isPrimary: z.boolean().default(false),
    place: z.string().optional(),
});

type ParticipantValues = z.infer<typeof participantSchema>;

function BookingDetailsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [paymentType, setPaymentType] = useState<"advance" | "balance" | "custom">("balance");
    const [customAmount, setCustomAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("gpay");
    const [concessionAmount, setConcessionAmount] = useState("");
    const [isDesktop, setIsDesktop] = useState(false);
    const [isEditParticipantOpen, setIsEditParticipantOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<any>(null);

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ParticipantValues>({
        resolver: zodResolver(participantSchema) as any,
        defaultValues: {
            name: "",
            gender: "male",
            age: 0,
            contactNumber: "",
            isPrimary: false,
            place: "",
        }
    });

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const { data: bookingResponse, isLoading } = useQuery({
        queryKey: ["booking", id],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/bookings/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    const booking = bookingResponse?.data;

    useEffect(() => {
        if (booking && isUpdatePaymentOpen) {
            setConcessionAmount(booking.concessionAmount?.toString() || "");
        }
    }, [isUpdatePaymentOpen, booking]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please upload an image file");
                return;
            }
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

    const initialTotal = (parseFloat(booking?.Trip?.price || "0") * (booking?.Customers?.length || 0));
    const advanceAmount = (parseFloat(booking?.Trip?.advanceAmount || "0") * (booking?.Customers?.length || 0));

    const addPaymentMutation = useMutation({
        mutationFn: async () => {
            if (!paymentDate) throw new Error("Payment date is required");

            const oldConcession = parseFloat(booking?.concessionAmount || "0");
            const newConcession = parseFloat(concessionAmount || "0");
            const currentRemaining = parseFloat(booking.remainingAmount);
            const adjustedRemaining = currentRemaining + (oldConcession - newConcession);

            let finalAmount = 0;

            if (paymentType === "balance") {
                finalAmount = adjustedRemaining;
            } else {
                finalAmount = parseFloat(customAmount);
            }

            if (isNaN(finalAmount) || (finalAmount < 0 && paymentType === "custom")) {
                throw new Error("Please enter a valid amount");
            }

            if (finalAmount > adjustedRemaining + 0.01) { // Add small tolerance for floats
                throw new Error(`Amount cannot exceed the remaining balance of ₹${adjustedRemaining.toLocaleString()}`);
            }

            const formData = new FormData();
            formData.append("amount", finalAmount.toString());
            formData.append("paymentType", paymentType);
            formData.append("paymentMethod", paymentMethod);
            formData.append("paymentDate", paymentDate.toISOString());

            if (concessionAmount !== undefined) {
                formData.append("concessionAmount", concessionAmount);
            }

            if (selectedFile) {
                formData.append("screenshot", selectedFile);
            }

            const response = await apiWithOffline.post(`/bookings/${id}/payments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Payment added successfully");
            setIsUpdatePaymentOpen(false);
            setCustomAmount("");
            setConcessionAmount("");
            setSelectedFile(null);
            setImagePreview(null);
            queryClient.invalidateQueries({ queryKey: ["booking", id] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
        onError: (error: any) => {
            if (error.isOffline) {
                setIsUpdatePaymentOpen(false);
                setCustomAmount("");
                setSelectedFile(null);
                setImagePreview(null);
                return;
            }
            const errorMessage = error.response?.data?.message || error.message || "Failed to add payment";
            toast.error(errorMessage);
        },
    });

    const updateParticipantsMutation = useMutation({
        mutationFn: async (participants: any[]) => {
            const response = await apiWithOffline.put(`/bookings/${id}/participants`, { participants });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Participants updated successfully");
            setIsEditParticipantOpen(false);
            setEditingParticipant(null);
            queryClient.invalidateQueries({ queryKey: ["booking", id] });
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.message || "Failed to update participants";
            toast.error(errorMessage);
        },
    });

    const onParticipantSubmit: SubmitHandler<ParticipantValues> = (values) => {
        updateParticipantsMutation.mutate([values]);
    };

    const handleEditParticipant = (participant: any) => {
        setEditingParticipant(participant);
        reset({
            id: participant.id,
            name: participant.name,
            gender: participant.gender,
            age: participant.age,
            contactNumber: participant.contactNumber || "",
            isPrimary: participant.isPrimary || false,
            place: participant.place || "",
        });
        setIsEditParticipantOpen(true);
    };

    const handleAddDetails = () => {
        setEditingParticipant(null);
        reset({
            name: "",
            gender: "male",
            age: 0,
            contactNumber: "",
            isPrimary: false,
            place: "",
        });
        setIsEditParticipantOpen(true);
    };



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
                <h1 className="text-lg font-bold text-black flex-1 text-center ">Booking Details</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto pb-32">
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
                        <div className="text-right">
                            {isLoading ? (
                                <Skeleton className="h-8 w-20 rounded-md" />
                            ) : (
                                <Badge className="bg-[#E2F1E8] text-[#219653] border-none shadow-none rounded-md px-3 font-bold capitalize">
                                    {booking.status}
                                </Badge>
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
                                                {p.place && ` • ${p.place}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-[#219653] hover:bg-[#E2F1E8] rounded-full"
                                                onClick={() => handleEditParticipant(p)}
                                                disabled={p.status === 'cancelled'}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                {p.isPrimary ? "Primary" : "Member"}
                                            </span>
                                        </div>
                                        {p.status === 'cancelled' && (
                                            <Badge variant="destructive" className="text-[8px] px-2 py-0 h-4 bg-red-100 text-red-600 border-none shadow-none uppercase font-bold">
                                                Cancelled
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                            {booking?.Trip?.type === 'package' && (booking.totalMemberCount || booking.memberCount || 0) > (booking.Customers?.length || 0) && (
                                <Card
                                    className="p-4 rounded-2xl flex flex-row justify-between shadow-none bg-gray-50/30 border-dashed border-2 border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors"
                                    onClick={handleAddDetails}
                                >
                                    <div className="flex flex-row gap-3 items-center">
                                        <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-400">
                                                Add Details for {(booking.totalMemberCount || booking.memberCount || 0) - (booking.Customers?.length || 0)} Members
                                            </p>
                                            <p className="text-[10px] text-gray-300 font-medium uppercase tracking-tight">Unnamed Participants</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-gray-300">
                                        <Plus className="w-5 h-5" />
                                    </Button>
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
                                {/* Header: Target vs Collected */}
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Original Amount</p>
                                    <p className="text-xl font-bold text-gray-500">₹{(parseFloat(booking?.totalCost || "0") + parseFloat(booking?.concessionAmount || "0")).toLocaleString()}</p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Paid so far</p>
                                    <p className="text-xl font-bold text-[#219653]">₹{parseFloat(booking?.paidAmount || "0").toLocaleString()}</p>
                                </div>

                                {/* Concession if any */}
                                {parseFloat(booking?.concessionAmount || "0") > 0 && (
                                    <div className="col-span-2 flex items-center justify-between py-2 px-3 bg-[#EE5A6F]/5 rounded-xl border border-[#EE5A6F]/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-[#EE5A6F] rounded-full" />
                                            <p className="text-[10px] text-[#EE5A6F] uppercase font-bold tracking-tight">Concession Applied</p>
                                        </div>
                                        <p className="text-sm font-bold text-[#EE5A6F]">-₹{parseFloat(booking?.concessionAmount || "0").toLocaleString()}</p>
                                    </div>
                                )}

                                {/* Intermediate: Refund if any */}
                                {parseFloat(booking?.refundAmount || "0") > 0 && (
                                    <div className="col-span-2 flex items-center justify-between py-2 px-3 bg-white/60 rounded-xl border border-gray-100/50">
                                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Refunded Amount</p>
                                        <p className="text-sm font-bold text-orange-500">₹{parseFloat(booking?.refundAmount || "0").toLocaleString()}</p>
                                    </div>
                                )}

                                {/* Result: Balance */}
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
                                    {/* {parseFloat(booking.remainingAmount || "0") < 0 && (
                                        <p className="text-right text-[10px] text-orange-400 font-semibold mt-1 uppercase italic">
                                            Return this amount to customer
                                        </p>
                                    )} */}
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

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white p-4 border-t border-gray-50 flex justify-center z-40">
                <div className="flex gap-4 w-full max-w-3xl">
                    <Button
                        onClick={() => setIsUpdatePaymentOpen(true)}
                        disabled={booking?.remainingAmount <= 0 || booking?.status?.toLowerCase() === 'cancelled'}
                        className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-5 rounded-full text-white font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Update Payment
                    </Button>
                    <Button
                        variant="outline"
                        disabled={booking?.status?.toLowerCase() === 'cancelled'}
                        onClick={() => {
                            const bookingData = {
                                _id: booking?._id || booking?.id,
                                trip: booking?.Trip,
                                customers: booking?.Customers,
                                totalAmount: booking?.totalCost,
                                paidAmount: booking?.paidAmount,
                                refundAmount: booking?.refundAmount
                            };
                            const encoded = encodeURIComponent(JSON.stringify(bookingData));
                            router.push(`/cancel-booking?data=${encoded}`);
                        }}
                        className="flex-1 py-5 rounded-full border-2 border-[#219653] text-[#219653] font-bold hover:bg-[#F5F9F7] disabled:border-gray-300 disabled:text-gray-300 disabled:bg-white disabled:cursor-not-allowed"
                    >
                        {booking?.status?.toLowerCase() === 'cancelled' ? 'Booking Cancelled' : 'Cancel Booking'}
                    </Button>
                </div>
            </div>

            {/* Update Payment Drawer */}
            <Drawer open={isUpdatePaymentOpen} onOpenChange={setIsUpdatePaymentOpen} direction={isDesktop ? "right" : "bottom"}>
                <DrawerContent className={cn(
                    "bg-white px-0 outline-none border-none",
                    isDesktop ? "h-full w-[600px] p-4" : "rounded-t-[40px] max-h-[96vh]"
                )}>
                    <div className="overflow-y-auto px-6 pb-32">
                        <DrawerHeader className="p-0 mb-6 text-center">
                            <DrawerTitle className="text-lg pt-4 font-bold text-black my-1">Payment Details</DrawerTitle>
                        </DrawerHeader>

                        <div className="mb-6">
                            <h3 className=" text-black font-semibold">{booking?.Trip?.title}</h3>
                            <p className="text-xs text-gray-400 font-bold">Participants : {booking?.activeMemberCount || booking?.totalMemberCount || booking?.Customers?.length} Adults</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            {/* Balance Payment */}
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
                                        <p className="text-base font-bold text-black">Balance Payment</p>
                                        <p className="text-xs text-gray-400 font-medium">Pay complete remaining amount</p>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-[#219653]">₹{Math.max(0,
                                    parseFloat(booking?.remainingAmount || "0") +
                                    (parseFloat(booking?.concessionAmount || "0") - (parseFloat(concessionAmount) || 0))
                                ).toLocaleString()}</span>
                            </Card>



                            {/* Custom Payment */}
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
                                        <p className="text-base font-bold text-black mb-2">Custom Payment (Advance)</p>
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

                            {/* Concession Field */}
                            <Card className="p-4 border-none shadow-none bg-[#EE5A6F]/5 rounded-2xl flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-[#EE5A6F] rounded-br-full rounded-tr-full" />
                                    <h3 className="text-base font-bold text-black tracking-tight">Update Concession</h3>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[11px] text-gray-500 font-medium ml-1">Current Concession: ₹{booking?.concessionAmount || 0}</p>
                                    <div className="relative">
                                        <Input
                                            value={concessionAmount}
                                            onChange={(e) => setConcessionAmount(e.target.value)}
                                            type="number"
                                            placeholder="Enter total concession amount"
                                            className="h-12 bg-white border-[#EE5A6F]/20 rounded-xl pl-10 focus-visible:ring-[#EE5A6F] font-bold text-[#EE5A6F]"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EE5A6F] font-bold">₹</div>
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
                                            type="button"
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
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 flex gap-4">
                        <Button
                            className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg shadow-lg shadow-green-100"
                            onClick={() => {
                                const oldConcession = parseFloat(booking?.concessionAmount || "0");
                                const newConcession = parseFloat(concessionAmount || "0");
                                const currentRemaining = parseFloat(booking.remainingAmount);
                                const adjustedRemaining = currentRemaining + (oldConcession - newConcession);

                                let finalAmount = 0;

                                if (paymentType === "balance") {
                                    finalAmount = adjustedRemaining;
                                } else {
                                    finalAmount = parseFloat(customAmount);
                                }

                                if (isNaN(finalAmount) || (finalAmount < 0 && paymentType === "custom")) {
                                    toast.error("Please enter a valid amount");
                                    return;
                                }

                                if (finalAmount > adjustedRemaining + 0.01) {
                                    toast.error(`Amount cannot exceed the remaining balance of ₹${adjustedRemaining.toLocaleString()}`);
                                    return;
                                }

                                addPaymentMutation.mutate();
                            }}
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

            {/* Edit Participant Drawer */}
            <Drawer open={isEditParticipantOpen} onOpenChange={setIsEditParticipantOpen} direction={isDesktop ? "right" : "bottom"}>
                <DrawerContent className={cn(
                    "bg-white px-0 outline-none border-none",
                    isDesktop ? "h-full w-[600px] p-4" : "rounded-t-[40px] max-h-[96vh]"
                )}>
                    <form onSubmit={handleSubmit(onParticipantSubmit)} className="flex flex-col h-full">
                        <div className="overflow-y-auto px-6 pb-32">
                            <DrawerHeader className="p-0 mb-6 text-center">
                                <DrawerTitle className="text-lg pt-4 font-bold text-black my-1">
                                    {editingParticipant ? "Edit Participant" : "Add Participant Details"}
                                </DrawerTitle>
                            </DrawerHeader>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-black ml-1">Full Name</label>
                                    <Controller
                                        control={control}
                                        name="name"
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                placeholder="Enter Name"
                                                className={cn(
                                                    "h-12 bg-gray-50/50 border-[#E2F1E8] rounded-lg focus-visible:ring-[#219653]",
                                                    errors.name && "border-red-500"
                                                )}
                                            />
                                        )}
                                    />
                                    {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black ml-1">Gender</label>
                                        <Controller
                                            control={control}
                                            name="gender"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="h-18 bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653]">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black ml-1">Age</label>
                                        <Controller
                                            control={control}
                                            name="age"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Age"
                                                    className={cn(
                                                        "h-12 bg-gray-50/50 border-[#E2F1E8] rounded-lg focus-visible:ring-[#219653]",
                                                        errors.age && "border-red-500"
                                                    )}
                                                />
                                            )}
                                        />
                                        {errors.age && <p className="text-xs text-red-500 ml-1">{errors.age.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-black ml-1">Contact Number (Optional)</label>
                                    <Controller
                                        control={control}
                                        name="contactNumber"
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                placeholder="Phone number"
                                                className="h-12 bg-gray-50/50 border-[#E2F1E8] rounded-lg focus-visible:ring-[#219653]"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-black ml-1">Place (Optional)</label>
                                    <Controller
                                        control={control}
                                        name="place"
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                placeholder="Enter City/Place"
                                                className="h-12 bg-gray-50/50 border-[#E2F1E8] rounded-lg focus-visible:ring-[#219653]"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="flex items-center gap-2 ml-1">
                                    <Controller
                                        control={control}
                                        name="isPrimary"
                                        render={({ field }) => {
                                            const totalParticipants = booking?.Customers?.length || 0;
                                            const isDisabled = (totalParticipants <= 1) && field.value;

                                            return (
                                                <input
                                                    type="checkbox"
                                                    id="isPrimary"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isDisabled}
                                                    className={cn(
                                                        "w-4 h-4 rounded border-gray-300 text-[#219653] focus:ring-[#219653]",
                                                        isDisabled && "opacity-50 cursor-not-allowed"
                                                    )}
                                                />
                                            );
                                        }}
                                    />
                                    <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">Primary Contact</label>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 flex gap-4">
                            <Button
                                type="submit"
                                className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg shadow-lg shadow-green-100"
                                disabled={updateParticipantsMutation.isPending}
                            >
                                {updateParticipantsMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default withAuth(BookingDetailsPage);
