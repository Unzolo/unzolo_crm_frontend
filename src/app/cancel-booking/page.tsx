"use client";

import {
    ArrowLeft,
    Users,
    Check,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    CheckCircle2,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";

function CancelBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // States
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [cancellationReason, setCancellationReason] = useState("Personal emergency");
    const [paymentMethod, setPaymentMethod] = useState("GPay");

    // Parse booking data from query params
    const bookingData = useMemo(() => {
        const dataParam = searchParams.get("data");
        if (!dataParam) return null;

        try {
            return JSON.parse(decodeURIComponent(dataParam));
        } catch (error) {
            console.error("Failed to parse booking data:", error);
            return null;
        }
    }, [searchParams]);

    const bookingId = bookingData?._id;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScreenshotFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setScreenshotFile(null);
        setImagePreview(null);
    };

    const participants = bookingData?.customers || [];

    const toggleParticipant = (id: string) => {
        if (selectedParticipants.includes(id)) {
            setSelectedParticipants(selectedParticipants.filter(p => p !== id));
        } else {
            setSelectedParticipants([...selectedParticipants, id]);
        }
    };

    const toggleAll = () => {
        if (selectedParticipants.length === participants.length) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(participants.map((p: any) => p.id));
        }
    };

    const cancelBookingMutation = useMutation({
        mutationFn: async () => {
            if (!bookingId) throw new Error("Booking ID not found");

            const formData = new FormData();

            // Build body according to requirements
            selectedParticipants.forEach(id => {
                formData.append("memberIds[]", id);
            });

            if (refundAmount) {
                formData.append("refundAmount", refundAmount);
            }

            formData.append("cancellationReason", cancellationReason);

            if (paymentMethod) {
                formData.append("paymentMethod", paymentMethod);
            }

            if (date) {
                formData.append("paymentDate", format(date, "yyyy-MM-dd"));
            }

            if (screenshotFile) {
                formData.append("screenshot", screenshotFile);
            }

            const response = await apiWithOffline.post(`/bookings/${bookingId}/cancel`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            return response.data;
        },
        onSuccess: (data: any) => {
            if (data.queued) {
                toast.info("Cancellation request queued for offline sync");
            } else {
                toast.success("Cancellation processed successfully");
            }
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            router.push(`/manage-bookings/${bookingData?.trip?._id || ''}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to process cancellation");
        }
    });

    const handleConfirm = () => {
        if (selectedParticipants.length === 0) {
            toast.error("Please select at least one participant to cancel");
            return;
        }
        if (!cancellationReason) {
            toast.error("Please provide a cancellation reason");
            return;
        }
        cancelBookingMutation.mutate();
    };

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
                <h1 className="text-lg font-bold text-black flex-1 text-center ">Cancel Booking</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto pb-32">
                {/* Trip Info */}
                <div className="mb-6 mt-2">
                    <h3 className="text-lg font-semibold text-black">{bookingData?.trip?.title || "Trip"}</h3>
                    <p className="text-xs text-gray-400 font-medium">Participants : {participants.length} {participants.length === 1 ? 'Person' : 'People'}</p>
                </div>

                {/* Select Participants Section */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                        <h4 className="text-lg font-semibold text-black">Select Participants to Cancel</h4>
                    </div>

                    <div
                        className="flex items-center gap-2 mb-2 cursor-pointer active:scale-[0.98] transition-all w-fit p-1"
                        onClick={toggleAll}
                    >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${selectedParticipants.length === participants.length ? "bg-[#219653]" : "bg-[#E2F1E8]"}`}>
                            <CheckCircle2 className={`w-4 h-4 ${selectedParticipants.length === participants.length ? "text-white" : "text-[#219653]"}`} />
                        </div>
                        <span className="text-[10px] font-bold text-black">
                            {selectedParticipants.length === participants.length ? "Deselect all" : "Select all"}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {participants.map((p: any) => (
                            <Card
                                key={p.id}
                                onClick={() => toggleParticipant(p.id)}
                                className={`p-4 border-2 transition-all cursor-pointer rounded-2xl flex flex-row justify-between ${selectedParticipants.includes(p.id) ? "border-[#219653] bg-white" : "border-transparent bg-gray-50/50"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedParticipants.includes(p.id) ? "bg-[#E2F1E8] border-[#219653]" : "bg-white border-gray-200"}`}>
                                        {selectedParticipants.includes(p.id) && <Check className="w-3 h-3 text-[#219653]" />}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-50">
                                        <Users className="w-5 h-5 text-[#219653]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-black">{p.name}</p>
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            {p.age} yrs • {p.gender === 'male' ? "♂" : p.gender === 'female' ? "♀" : ""} {p.gender}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-400 text-[9px] font-bold uppercase py-0 px-2 mb-1 border-none shadow-none">{p.isPrimary ? "Primary" : "Member"}</Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Refund Summary Section */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                        <h4 className="text-lg font-semibold text-black">Refund Summary</h4>
                    </div>
                    <Card className="p-6 border-none bg-gray-50/30 rounded-[20px] shadow-none">
                        <div className="grid grid-cols-2 gap-y-2">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 font-medium">Paid Amount</p>
                                <p className="text-lg font-semibold text-[#219653]">₹{bookingData?.amount || 0}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-sm text-gray-400 font-medium">Cancellation Charges</p>
                                <p className="text-lg font-semibold text-red-500">₹0</p>
                            </div>
                            <div className="col-span-2 flex justify-center items-center gap-4 mt-2">
                                <p className="text-base font-semibold text-black">Refund Amount</p>
                                <div className="w-[120px]">
                                    <Input
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        type="number"
                                        className="h-10 text-lg font-bold text-center border-[#219653] focus-visible:ring-[#219653] bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-black ml-1">Cancellation Reason</label>
                        <Select value={cancellationReason} onValueChange={setCancellationReason}>
                            <SelectTrigger className="h-14 bg-gray-50/50 border-[#E2F1E8] rounded-lg w-full mt-1 focus:ring-[#219653] text-gray-400">
                                <SelectValue placeholder="Select Reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Personal emergency">Personal emergency</SelectItem>
                                <SelectItem value="Health issues">Health issues</SelectItem>
                                <SelectItem value="Travel plan change">Travel plan change</SelectItem>
                                <SelectItem value="Trip cancelled by provider">Trip cancelled by provider</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-black ml-1">Payment Method</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="h-14 bg-gray-50/50 border-[#E2F1E8] rounded-lg mt-1 w-full focus:ring-[#219653] text-gray-400">
                                <SelectValue placeholder="Select Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GPay">GPay</SelectItem>
                                <SelectItem value="PhonePe">PhonePe</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-black ml-1">Payment Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full h-14 justify-start text-left font-normal bg-gray-50/50 border-[#E2F1E8] rounded-lg mt-1 relative px-4 text-black",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    {date ? format(date, "PPP") : <span className="text-gray-300">Pick a date</span>}
                                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-[#E2F1E8] rounded-2xl" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="rounded-2xl border-none"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-black ml-1">Screenshot (optional)</label>
                        {!imagePreview ? (
                            <>
                                <input
                                    type="file"
                                    id="screenshot-upload-cancel"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <label
                                    htmlFor="screenshot-upload-cancel"
                                    className="border-2 border-dashed border-[#E2F1E8] mt-1 rounded-2xl p-8 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <ImageIcon className="w-10 h-10 text-[#219653] mb-2" />
                                    <p className="text-sm text-gray-400 font-medium text-center">Upload Transaction Screenshot (gpay, etc..)</p>
                                </label>
                            </>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-[#E2F1E8] bg-gray-50 min-h-[150px] flex items-center justify-center mt-1">
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

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-50 flex gap-4">
                <Button
                    onClick={handleConfirm}
                    disabled={cancelBookingMutation.isPending}
                    className="flex-1 bg-[#219653] hover:bg-[#1A7B44] py-5 rounded-full text-white"
                >
                    {cancelBookingMutation.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        "Confirm Cancellation"
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1 py-5 rounded-full border-2 border-[#219653] text-[#219653]  hover:bg-[#F5F9F7]"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function CancelBookingPageContainer() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">Loading...</div>}>
            <CancelBookingPage />
        </Suspense>
    );
}

export default withAuth(CancelBookingPageContainer);
