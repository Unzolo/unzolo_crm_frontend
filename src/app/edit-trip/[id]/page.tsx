"use client";

import { ArrowLeft, IndianRupee, Calendar as CalendarIcon, Loader2, Tent, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { withAuth } from "@/components/auth/with-auth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PACKAGE_CATEGORIES = [
    { value: "budget_friendly", label: "Budget Friendly" },
    { value: "heritage_culture", label: "Heritage & Culture" },
    { value: "spiritual", label: "Spiritual" },
    { value: "international", label: "International Packages" },
    { value: "honeymoon", label: "Honeymoon" },
    { value: "group_trips", label: "Group Trips" },
];

const editTripSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    destination: z.string().min(2, "Destination must be at least 2 characters"),
    type: z.enum(["camp", "package"]),
    // Camp Specific
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    // Package Specific
    groupSize: z.string().optional(),
    category: z.string().optional(),
    // Common
    price: z.coerce.number().min(1, "Price must be at least 1"),
    advanceAmount: z.coerce.number().min(0, "Advance amount cannot be negative"),
}).superRefine((data, ctx) => {
    if (data.type === "camp") {
        if (!data.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Start date is required for camps",
                path: ["startDate"],
            });
        }
        if (!data.endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date is required for camps",
                path: ["endDate"],
            });
        }
        if (data.startDate && data.endDate && data.endDate < data.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date must be after start date",
                path: ["endDate"],
            });
        }
    }
    if (data.type === "package") {
        if (!data.groupSize) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Group size is required for packages",
                path: ["groupSize"],
            });
        }
        if (!data.category) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Category is required for packages",
                path: ["category"],
            });
        }
    }
});

type EditTripValues = z.infer<typeof editTripSchema>;

function EditTripPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditTripValues>({
        resolver: zodResolver(editTripSchema) as any,
    });

    const tripType = watch("type");

    const { data: tripResponse, isLoading: isFetching } = useQuery({
        queryKey: ["trip", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/trips/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    useEffect(() => {
        if (tripResponse?.data) {
            const trip = tripResponse.data;
            reset({
                title: trip.title,
                destination: trip.destination,
                startDate: trip.startDate ? new Date(trip.startDate) : undefined,
                endDate: trip.endDate ? new Date(trip.endDate) : undefined,
                price: parseFloat(trip.price),
                advanceAmount: parseFloat(trip.advanceAmount),
                type: trip.type,
                groupSize: trip.groupSize || "",
                category: trip.category || "",
            });
        }
    }, [tripResponse, reset]);

    const editTripMutation = useMutation({
        mutationFn: async (values: EditTripValues) => {
            const formattedValues = {
                ...values,
                startDate: values.startDate ? format(values.startDate, "yyyy-MM-dd") : undefined,
                endDate: values.endDate ? format(values.endDate, "yyyy-MM-dd") : undefined,
            };
            const response = await apiWithOffline.patch(`/trips/${tripId}`, formattedValues);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.queued) {
                toast.info("Trip update queued! It will sync when you're online.");
            } else {
                toast.success("Trip updated successfully!");
                // Invalidate the trip query to ensure fresh data is fetched on the manage bookings page
                queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
            }
            router.push(`/manage-bookings/${tripId}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update trip.");
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: async () => {
            const response = await apiWithOffline.delete(`/trips/${tripId}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Trip deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            router.push("/select-trip");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete trip.");
        },
    });

    const handleDelete = () => {
        const bookingCount = tripResponse?.data?.bookingCount || 0;
        const message = bookingCount > 0
            ? `This trip has ${bookingCount} active booking(s). Deleting it will hide it from new bookings, but existing bookings will remain. Are you sure?`
            : "Are you sure you want to delete this trip? This will hide it from new bookings.";

        if (window.confirm(message)) {
            deleteTripMutation.mutate();
        }
    };

    const onSubmit = (values: EditTripValues) => {
        editTripMutation.mutate(values);
    };



    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-black hover:bg-transparent"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-sans font-bold text-black flex-1 text-center">
                    Edit Trip
                </h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={deleteTripMutation.isPending}
                    className="text-red-500 hover:bg-red-50"
                >
                    {deleteTripMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] p-4 shadow-2xl overflow-y-auto">
                {isFetching ? (
                    <div className="max-w-3xl mx-auto space-y-6 mt-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20 ml-1" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 ml-1" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 ml-1" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-full mt-8" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24 xl:max-w-3xl mx-auto">
                        {/* Trip Type */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[#219653] ml-1">Trip Type</label>
                            <Tabs
                                value={tripType}
                                onValueChange={(val) => setValue("type", val as "camp" | "package")}
                                className="w-full"
                            >
                                <TabsList className="w-full h-14 bg-gray-50 border border-[#E2F1E8] rounded-xl p-1">
                                    <TabsTrigger
                                        value="camp"
                                        className="flex-1 h-full rounded-lg data-[state=active]:bg-[#219653] data-[state=active]:text-white transition-all font-bold mt-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Tent className="w-4 h-4" />
                                            Camp
                                        </div>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="package"
                                        className="flex-1 h-full rounded-lg data-[state=active]:bg-[#219653] data-[state=active]:text-white transition-all font-bold mt-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Package
                                        </div>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Trip Title */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[#219653] ml-1">Trip Title</label>
                            <Input
                                {...register("title")}
                                placeholder="Magical Himachal"
                                className={cn(
                                    "h-14 mt-1 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300 shadow-none",
                                    errors.title && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.title && (
                                <p className="text-[11px] text-red-500 ml-1">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Destination */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[#219653] ml-1">Destination</label>
                            <Input
                                {...register("destination")}
                                placeholder="Munnar"
                                className={cn(
                                    "h-14 mt-1 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300 shadow-none",
                                    errors.destination && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.destination && (
                                <p className="text-[11px] text-red-500 ml-1">{errors.destination.message}</p>
                            )}
                        </div>

                        {/* Camp Specific Dates */}
                        {tripType === "camp" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-[#219653] ml-1">Start Date</label>
                                    <Controller
                                        control={control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-14 mt-1 justify-start text-left font-normal rounded-xl border-[#E2F1E8] focus:ring-1 focus:ring-[#219653] bg-white shadow-none",
                                                            !field.value && "text-gray-300",
                                                            errors.startDate && "border-red-500"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#219653]" />
                                                        {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        className="rounded-2xl"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                    {errors.startDate && (
                                        <p className="text-[11px] text-red-500 ml-1">{errors.startDate.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-[#219653] ml-1">End Date</label>
                                    <Controller
                                        control={control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-14 mt-1 justify-start text-left font-normal rounded-xl border-[#E2F1E8] focus:ring-1 focus:ring-[#219653] bg-white shadow-none",
                                                            !field.value && "text-gray-300",
                                                            errors.endDate && "border-red-500"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#219653]" />
                                                        {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                        className="rounded-2xl"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                    {errors.endDate && (
                                        <p className="text-[11px] text-red-500 ml-1">{errors.endDate.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Package Specific Fields */}
                        {tripType === "package" && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                                <div className="space-y-1 col-span-1">
                                    <label className="text-sm font-medium text-[#219653] ml-1">Group Size</label>
                                    <Input
                                        {...register("groupSize")}
                                        placeholder="2-4 people"
                                        className={cn(
                                            "h-14 mt-1 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300 shadow-none",
                                            errors.groupSize && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                    />
                                    {errors.groupSize && (
                                        <p className="text-[11px] text-red-500 ml-1">{errors.groupSize.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1 col-span-1">
                                    <label className="text-sm font-medium text-[#219653] ml-1">Category</label>
                                    <Controller
                                        control={control}
                                        name="category"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className={cn(
                                                    "h-14 mt-1 rounded-xl border-[#E2F1E8] focus:ring-[#219653] text-gray-700 shadow-none",
                                                    errors.category && "border-red-500"
                                                )}>
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    {PACKAGE_CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.category && (
                                        <p className="text-[11px] text-red-500 ml-1">{errors.category.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pricing Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[#219653] ml-1">{tripType === 'package' ? 'Starting From' : 'Total Price'}</label>
                                <div className="relative mt-1">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#219653]" />
                                    <Input
                                        {...register("price")}
                                        type="number"
                                        placeholder="Amount"
                                        className={cn(
                                            "h-14 pl-10 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300 shadow-none",
                                            errors.price && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                    />
                                </div>
                                {errors.price && (
                                    <p className="text-[11px] text-red-500 ml-1">{errors.price.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[#219653] ml-1">Advance amount</label>
                                <div className="relative mt-1">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#219653]" />
                                    <Input
                                        {...register("advanceAmount")}
                                        type="number"
                                        placeholder="1000"
                                        className={cn(
                                            "h-14 pl-10 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300 shadow-none",
                                            errors.advanceAmount && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                    />
                                </div>
                                {errors.advanceAmount && (
                                    <p className="text-[11px] text-red-500 ml-1">{errors.advanceAmount.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button (Fixed) */}
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-center z-50 2xl:pl-[250px]">
                            <Button
                                type="submit"
                                disabled={editTripMutation.isPending}
                                className="w-full max-w-md bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {editTripMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Updating trip...
                                    </>
                                ) : (
                                    "Update Trip"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default withAuth(EditTripPage);
