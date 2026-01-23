"use client";

import {
    ArrowLeft,
    Plus,
    Minus,
    Users,
    Check,
    Landmark,
    Calendar as CalendarIcon,
    Image as ImageIcon,
    X,
    Loader2,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle
} from "@/components/ui/drawer";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";

const memberSchema = z.object({
    name: z.string().min(2, "Name is required"),
    gender: z.enum(["male", "female", "other"]),
    age: z.coerce.number().min(1, "Age is required"),
    contactNumber: z.string().optional(),
    isPrimary: z.boolean(),
}).refine((data) => {
    if (data.isPrimary && (!data.contactNumber || data.contactNumber.length < 10)) {
        return false;
    }
    return true;
}, {
    message: "Contact number is required",
    path: ["contactNumber"],
});

const createBookingSchema = z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    amount: z.coerce.number().min(1, "Amount is required"),
    paymentType: z.enum(["advance", "full", "custom"]),
    paymentMethod: z.string().min(1, "Payment method is required"),
    paymentDate: z.date(),
    members: z.array(memberSchema).min(1, "At least one participant is required"),
    memberCount: z.coerce.number().min(1).optional(),
    preferredDate: z.date().optional(),
    totalPackagePrice: z.coerce.number().optional(),
    concessionAmount: z.coerce.number().optional(),
});

type CreateBookingValues = z.infer<typeof createBookingSchema>;

function CreateBookingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tripId = searchParams.get("tripId");

    const [showPayment, setShowPayment] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const methods = useForm<CreateBookingValues>({
        resolver: zodResolver(createBookingSchema) as any,
        defaultValues: {
            tripId: tripId || "",
            paymentType: "advance",
            paymentMethod: "gpay",
            paymentDate: new Date(),
            members: [{ name: "", gender: "male", age: 0, contactNumber: "", isPrimary: true }],
            amount: 0,
            memberCount: 1,
            totalPackagePrice: 0,
            concessionAmount: 0,
        },
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = methods;

    const { fields, append, remove } = useFieldArray({
        control,
        name: "members",
    });

    const { data: tripResponse, isLoading: tripLoading } = useQuery({
        queryKey: ["trip", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/trips/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    const trip = tripResponse?.data;
    const paymentType = watch("paymentType");
    const members = watch("members");
    const memberCountValue = watch("memberCount");
    const totalPackagePriceValue = watch("totalPackagePrice");
    const concessionAmountValue = watch("concessionAmount") || 0;

    useEffect(() => {
        if (trip) {
            let count = members.length;
            if (trip.type === 'package' && memberCountValue) {
                count = Number(memberCountValue);
            }

            // For packages, auto-calculate totalPackagePrice if not set or update (user can override)
            // But to make it editable defaults, we only set it if it matches calculation-logic or first load
            // A simpler approach for "default calculated":
            if (trip.type === 'package') {
                // Check if we should update the default
                // We can use a separate effect for this or combine.
                // Let's rely on user input, but if memberCountValue changes, we can suggest/auto-update if needed. 
                // The user requirement says "charged for particular package for that members"
                // "show calculated amount as default"
                const calculatedDefault = parseFloat(trip.price) * count;
                // We will update totalPackagePrice only if it is 0 (initial) or maybe we shouldn't overwrite always?
                // "show calculated amount as default" implies initial value.
                // But wait, if memberCount changes, calculate should probably update?
                // Let's update it.
            }

            let fullPrice = trip.type === 'package' ? (Number(totalPackagePriceValue) || 0) : parseFloat(trip.price) * count;
            const advancePrice = parseFloat(trip.advanceAmount) * count;

            // Apply concession to full price
            fullPrice = Math.max(0, fullPrice - Number(concessionAmountValue));

            if (paymentType === "full") {
                setValue("amount", fullPrice);
            } else if (paymentType === "advance") {
                setValue("amount", advancePrice);
            }
        }
    }, [trip, paymentType, members.length, memberCountValue, totalPackagePriceValue, concessionAmountValue, setValue]);

    // Effect to update totalPackagePrice when memberCount changes for packages
    useEffect(() => {
        if (trip?.type === 'package' && memberCountValue) {
            const defaultPrice = parseFloat(trip.price) * Number(memberCountValue);
            setValue("totalPackagePrice", defaultPrice);
        }
    }, [trip, memberCountValue, setValue]);

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
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const queryClient = useQueryClient();

    const createBookingMutation = useMutation({
        mutationFn: async (data: CreateBookingValues) => {
            const formData = new FormData();
            formData.append("tripId", data.tripId);
            formData.append("amount", data.amount.toString());
            formData.append("paymentType", data.paymentType);
            formData.append("paymentMethod", data.paymentMethod);
            formData.append("paymentDate", data.paymentDate.toISOString());

            if (trip?.type === 'package') {
                if (data.memberCount) formData.append("memberCount", data.memberCount.toString());
                if (data.preferredDate) formData.append("preferredDate", data.preferredDate.toISOString());
                if (data.totalPackagePrice) formData.append("totalPackagePrice", data.totalPackagePrice.toString());
            } else {
                formData.append("memberCount", data.members.length.toString());
            }

            if (data.concessionAmount) {
                formData.append("concessionAmount", data.concessionAmount.toString());
            }

            const cleanedMembers = data.members.map((member) => ({
                ...member,
                contactNumber: member.contactNumber === "" ? undefined : member.contactNumber,
            }));
            formData.append("members", JSON.stringify(cleanedMembers));

            if (selectedFile) {
                formData.append("screenshot", selectedFile);
            }

            const response = await apiWithOffline.post("/bookings", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings", tripId] });
            toast.success("Booking created successfully!");
            router.push(`/manage-bookings/${tripId}`);
        },
        onError: (error: any) => {
            if (error.isOffline) {
                router.push(`/manage-bookings/${tripId}`);
                return;
            }
            toast.error(error.response?.data?.message || "Failed to create booking");
        },
    });

    const onSubmit: SubmitHandler<CreateBookingValues> = (values) => {
        createBookingMutation.mutate(values);
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
                <h1 className="text-lg text-black flex-1 text-center font-bold">Create Booking</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] p-3 shadow-2xl overflow-y-auto">
                {tripLoading ? (
                    <div className="2xl:max-w-3xl 2xl:mx-auto space-y-8 mt-4 p-3">
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-32 rounded-md" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-14 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <Skeleton className="h-6 w-40 rounded-md" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-full" />
                    </div>
                ) : (
                    <div className="2xl:max-w-3xl 2xl:mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h2 className="text-lg font-bold text-black ">Participants</h2>
                        </div>

                        {/* Participants Count Card - Only for Camps */}
                        {trip?.type !== 'package' && (
                            <Card className="p-4 border-none shadow-none bg-[#219653]/5 rounded-2xl flex flex-row justify-between mb-8">
                                <div className="flex items-center gap-4 ">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-[#219653]" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Participants Count</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-full bg-[#E2F1E8] text-[#219653] hover:bg-[#d5e9dc]"
                                        onClick={() => {
                                            if (fields.length > 1) remove(fields.length - 1);
                                        }}
                                        disabled={fields.length <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className=" font-bold text-black min-w-[20px] text-center">{fields.length}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 rounded-full bg-[#E2F1E8] text-[#219653] hover:bg-[#d5e9dc]"
                                        onClick={() => append({ name: "", gender: "male", age: 0, contactNumber: "", isPrimary: false })}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Concession/Opt-out Field - Only for Camps */}
                        {trip?.type !== 'package' && (
                            <Card className="p-4 border-none shadow-none bg-[#EE5A6F]/5 rounded-2xl flex flex-col gap-3 mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-[#EE5A6F] rounded-br-full rounded-tr-full" />
                                    <h3 className="text-base font-bold text-black tracking-tight">Concession / Opt-outs</h3>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[11px] text-gray-500 font-medium ml-1">If any amenities like travel opted out, enter amount to reduce</p>
                                    <div className="relative">
                                        <Input
                                            {...register("concessionAmount")}
                                            type="number"
                                            placeholder="eg: 500"
                                            className="h-12 bg-white border-[#EE5A6F]/20 rounded-xl pl-10 focus-visible:ring-[#EE5A6F] font-bold text-[#EE5A6F]"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EE5A6F] font-bold">₹</div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <form id="booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-32">
                            {/* Package Specific Fields */}
                            {trip?.type === 'package' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-black ml-1">Preferred Date</label>
                                            <Controller
                                                control={control}
                                                name="preferredDate"
                                                render={({ field }) => (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653]", !field.value && "text-muted-foreground")}>
                                                                <CalendarIcon className="mr-2 h-4 w-4 text-[#219653]" />
                                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-xl border-[#E2F1E8]" />
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-black ml-1">Total Members</label>
                                            <div className="relative">
                                                <Input {...register("memberCount")} type="number" placeholder="Count" className="h-12 bg-gray-50/50 border-[#E2F1E8] rounded-xl pl-10 focus-visible:ring-[#219653]" />
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Calculation Summary */}
                                    {memberCountValue && trip?.price && (
                                        <Card className="p-4 border-none bg-gradient-to-br from-[#219653]/10 to-[#E2F1E8]/50 rounded-2xl">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-5 bg-[#219653] rounded-full" />
                                                    <h3 className="text-sm font-bold text-[#219653]">Pricing Breakdown</h3>
                                                </div>

                                                <div className="space-y-2 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 font-medium">Per Person Price</span>
                                                        <span className="text-sm font-bold text-gray-800">₹{parseFloat(trip.price).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 font-medium">Number of Members</span>
                                                        <span className="text-sm font-bold text-gray-800">× {memberCountValue}</span>
                                                    </div>
                                                    <div className="h-px bg-gradient-to-r from-transparent via-[#219653]/30 to-transparent my-1" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-[#219653]">Calculated Total</span>
                                                        <span className="text-lg font-bold text-[#219653]">₹{(Number(memberCountValue) * parseFloat(trip.price)).toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-gray-500 font-medium italic text-center">
                                                    You can modify the total amount below if needed
                                                </p>
                                            </div>
                                        </Card>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-black ml-1">Total Amount Charged</label>
                                        <div className="relative">
                                            <Input
                                                {...register("totalPackagePrice")}
                                                type="number"
                                                placeholder="Enter total package price"
                                                className="h-14 bg-white border-2 border-[#219653]/20 rounded-xl pl-10 focus-visible:ring-2 focus-visible:ring-[#219653] font-semibold text-lg"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#219653] font-bold text-lg">₹</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(trip?.type === 'package' ? fields.slice(0, 1) : fields).map((field, index) => (
                                <Card key={field.id} className="p-3 border-none bg-[#219653]/5 rounded-[24px] space-y-0 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold",
                                                index === 0 ? "bg-[#219653]" : "bg-gray-400"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <h3 className={cn("text-sm font-bold", index === 0 ? "text-[#219653]" : "text-gray-500")}>
                                                {index === 0 ? "Primary Contact" : `Participant ${index + 1}`}
                                            </h3>
                                        </div>
                                        {index > 0 && trip?.type !== 'package' && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-12 gap-x-4 gap-y-4 pt-0">
                                        <div className="col-span-9 space-y-1.5">
                                            <label className="text-xs font-bold text-black ml-1">Full Name</label>
                                            <Input
                                                {...register(`members.${index}.name`)}
                                                placeholder="Enter Name"
                                                className={cn(
                                                    "h-12 placeholder:text-sm mt-1 bg-gray-50/50 border-[#E2F1E8] rounded-xl focus-visible:ring-[#219653]",
                                                    errors.members?.[index]?.name && "border-red-500 focus-visible:ring-red-500"
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-1.5">
                                            <label className="text-xs font-bold text-black ml-1">Gender</label>
                                            <Controller
                                                control={control}
                                                name={`members.${index}.gender`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className="h-12 mt-1 bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653]">
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

                                        {index === 0 && (
                                            <div className="col-span-9 space-y-1.5">
                                                <label className="text-xs font-bold text-black ml-1">Contact Number</label>
                                                <Input
                                                    {...register(`members.${index}.contactNumber`)}
                                                    placeholder="Phone number"
                                                    type="number"
                                                    className={cn(
                                                        "h-12 mt-1 placeholder:text-sm bg-gray-50/50 border-[#E2F1E8] rounded-xl focus-visible:ring-[#219653]",
                                                        errors.members?.[index]?.contactNumber && "border-red-500"
                                                    )}
                                                />
                                            </div>
                                        )}

                                        <div className={cn(index === 0 ? "col-span-3" : "col-span-3", "space-y-1.5")}>
                                            <label className="text-xs font-bold text-black ml-1">Age</label>
                                            <Input
                                                {...register(`members.${index}.age`)}
                                                type="number"
                                                placeholder="eg: 20"
                                                className={cn(
                                                    "h-12 mt-1 placeholder:text-sm bg-gray-50/50 border-[#E2F1E8] rounded-xl focus-visible:ring-[#219653]",
                                                    errors.members?.[index]?.age && "border-red-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {trip?.type !== 'package' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-16 rounded-2xl border-2 border-dashed border-[#219653] text-[#219653] font-bold text-lg hover:bg-[#F5F9F7] bg-white gap-2"
                                    onClick={() => append({ name: "", gender: "male", age: 0, contactNumber: "", isPrimary: false })}
                                >
                                    <Plus className="w-6 h-6" /> Add Participant
                                </Button>
                            )}

                            {/* Payment Details Trigger */}
                            <div className="p-4 flex justify-center">
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        const isValid = await trigger("members");
                                        if (isValid) {
                                            setShowPayment(true);
                                        }
                                    }}
                                    className="w-full max-w-md bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg transition-all active:scale-95"
                                >
                                    Next
                                </Button>
                            </div>

                            {/* Payment Details Drawer */}
                            <Drawer open={showPayment} onOpenChange={setShowPayment} direction={isDesktop ? "right" : "bottom"}>
                                <DrawerContent className={cn(
                                    "bg-white px-0 outline-none border-none",
                                    isDesktop ? "h-full w-[600px] p-4" : "rounded-t-[40px] max-h-[96vh]"
                                )}>
                                    <div className="overflow-y-auto px-6 pb-32">
                                        <DrawerHeader className="p-0 mb-6 text-center">
                                            <DrawerTitle className="text-lg font-bold text-black my-1">Payment Details</DrawerTitle>
                                        </DrawerHeader>

                                        <div className="mb-6">
                                            <h3 className=" text-black font-bold">{trip?.title || "Loading..."}</h3>
                                            <p className="text-xs text-gray-400 font-medium">Participants : {fields.length} Adults</p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            {/* Full Payment */}
                                            <Card
                                                onClick={() => setValue("paymentType", "full")}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-row justify-between",
                                                    paymentType === "full" ? "border-[#219653] bg-[#E2F1E8]/20" : "border-[#E2F1E8]/50 bg-gray-50/30"
                                                )}
                                            >
                                                <div className="flex flex-row gap-4">
                                                    <div className="relative pl-4">
                                                        <div className="w-12 h-12 rounded-full bg-[#219653] flex items-center justify-center">
                                                            <Landmark className="w-6 h-6 text-white" />
                                                        </div>
                                                        {paymentType === "full" && (
                                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#219653] flex items-center justify-center">
                                                                <Check className="w-3 h-3 text-[#219653]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-black">Full Payment</p>
                                                        <p className="text-xs text-gray-400 font-medium">Pay complete amount now</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-[#219653]">
                                                        ₹{trip ? (
                                                            Math.max(0, (trip.type === 'package' ? (Number(totalPackagePriceValue) || 0) : parseFloat(trip.price) * fields.length) - Number(concessionAmountValue))
                                                        ).toLocaleString() : "..."}
                                                    </span>
                                                    {Number(concessionAmountValue) > 0 && (
                                                        <p className="text-[10px] text-gray-400 font-bold line-through">
                                                            ₹{(trip.type === 'package' ? (Number(totalPackagePriceValue) || 0) : parseFloat(trip.price) * fields.length).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </Card>

                                            {/* Advance Payment - Only for Camps */}
                                            {trip?.type !== 'package' && (
                                                <Card
                                                    onClick={() => setValue("paymentType", "advance")}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-row justify-between",
                                                        paymentType === "advance" ? "border-[#219653] bg-[#E2F1E8]/20" : "border-[#E2F1E8]/50 bg-gray-50/30"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative pl-4">
                                                            <div className="w-12 h-12 rounded-full bg-[#219653] flex items-center justify-center">
                                                                <Landmark className="w-6 h-6 text-white" />
                                                            </div>
                                                            {paymentType === "advance" && (
                                                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#219653] flex items-center justify-center">
                                                                    <Check className="w-3 h-3 text-[#219653]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-bold text-black">Advance Payment</p>
                                                            <p className="text-xs text-gray-400 font-medium max-w-[150px]">Pay advance and balance later</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-lg font-bold text-[#219653]">₹{trip ? (parseFloat(trip.advanceAmount) * fields.length).toLocaleString() : "..."}</span>
                                                </Card>
                                            )}

                                            {/* Custom Amount */}
                                            <Card
                                                onClick={() => setValue("paymentType", "custom")}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-3",
                                                    paymentType === "custom" ? "border-[#219653] bg-[#E2F1E8]/20" : "border-[#E2F1E8]/50 bg-gray-50/30"
                                                )}
                                            >
                                                <div className="flex flex-row justify-between items-center w-full">
                                                    <div className="flex items-center gap-4">
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
                                                        <div>
                                                            <p className="text-base font-bold text-black">Custom Amount</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {paymentType === "custom" && (
                                                    <div className="flex items-center gap-2 pl-4">
                                                        <Input
                                                            {...register("amount")}
                                                            placeholder="Enter Amount"
                                                            type="number"
                                                            className="h-10 bg-white border-[#E2F1E8] rounded-xl text-sm focus-visible:ring-[#219653]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                )}
                                            </Card>
                                        </div>

                                        {/* Payment Details Form */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-black ml-1">Payment Date</label>
                                                <Controller
                                                    control={control}
                                                    name="paymentDate"
                                                    render={({ field }) => (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full h-14 justify-start text-left font-normal bg-gray-50/50 border-[#E2F1E8] rounded-xl focus:ring-[#219653] relative px-4",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#219653]" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 border-[#E2F1E8] rounded-2xl" align="start">
                                                                <CalendarComponent
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    initialFocus
                                                                    className="rounded-2xl border-none"
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-black ml-1">Payment Method</label>
                                                <Controller
                                                    control={control}
                                                    name="paymentMethod"
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger className="h-14 py-2 bg-gray-50/50 border-[#E2F1E8] rounded-xl mt-1 focus:ring-[#219653] w-full">
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
                                                    )}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-black ml-1">Screenshot (optional)</label>
                                                {!imagePreview ? (
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="border-2 border-dashed border-[#E2F1E8] rounded-2xl p-8 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                                    >
                                                        <ImageIcon className="w-10 h-10 text-[#219653] mb-2" />
                                                        <p className="text-sm text-gray-400 font-medium text-center">Upload Transaction Screenshot</p>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                        />
                                                    </div>
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
                                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer Button inside Drawer */}
                                        <div className="mt-8">
                                            <Button
                                                form="booking-form"
                                                type="submit"
                                                disabled={createBookingMutation.isPending}
                                                className="w-full bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg shadow-lg"
                                            >
                                                {createBookingMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Creating Booking...
                                                    </>
                                                ) : (
                                                    "Confirm Booking"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

function CreateBookingPageContainer() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
                <div className="p-4 flex items-center justify-between">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <div className="w-10" />
                </div>
                <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl space-y-6">
                    <div className="max-w-3xl mx-auto space-y-8 mt-4">
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-32 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <CreateBookingPage />
        </Suspense>
    );
}

export default withAuth(CreateBookingPageContainer);
