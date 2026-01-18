"use client";

import { ArrowLeft, IndianRupee, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";

const editTripSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    destination: z.string().min(2, "Destination must be at least 2 characters"),
    startDate: z.date({
        required_error: "Start date is required",
    } as any),
    endDate: z.date({
        required_error: "End date is required",
    } as any),
    price: z.coerce.number().min(1, "Price must be at least 1"),
    advanceAmount: z.coerce.number().min(0, "Advance amount cannot be negative"),
    type: z.enum(["camp", "package"]),
})
    .refine((data) => data.endDate >= data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
    });

type EditTripValues = z.infer<typeof editTripSchema>;

function EditTripPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<EditTripValues>({
        resolver: zodResolver(editTripSchema) as any,
    });

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
                startDate: new Date(trip.startDate),
                endDate: new Date(trip.endDate),
                price: parseFloat(trip.price),
                advanceAmount: parseFloat(trip.advanceAmount),
                type: trip.type,
            });
        }
    }, [tripResponse, reset]);

    const editTripMutation = useMutation({
        mutationFn: async (values: EditTripValues) => {
            const formattedValues = {
                ...values,
                startDate: format(values.startDate, "yyyy-MM-dd"),
                endDate: format(values.endDate, "yyyy-MM-dd"),
            };
            const response = await apiWithOffline.patch(`/trips/${tripId}`, formattedValues);
            return response.data;
        },
        onSuccess: (response) => {
            if (response.queued) {
                toast.info("Trip update queued! It will sync when you're online.");
            } else {
                toast.success("Trip updated successfully!");
            }
            router.push("/");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update trip.");
        },
    });

    const onSubmit = (values: EditTripValues) => {
        editTripMutation.mutate(values);
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
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
                    className="text-black hover:bg-transparent"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-sans font-bold text-black flex-1 text-center mr-10">
                    Edit Trip
                </h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] p-4 shadow-2xl overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24">
                    {/* Trip Title */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[#219653] ml-1">Trip Title</label>
                        <Input
                            {...register("title")}
                            placeholder="Magical Himachal"
                            className={cn(
                                "h-14 mt-1 rounded-lg border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300",
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
                                "h-14 mt-1 rounded-lg border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300",
                                errors.destination && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.destination && (
                            <p className="text-[11px] text-red-500 ml-1">{errors.destination.message}</p>
                        )}
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
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
                                                    "w-full h-14 mt-1 justify-start text-left font-normal rounded-lg border-[#E2F1E8] focus:ring-1 focus:ring-[#219653] bg-white",
                                                    !field.value && "text-gray-300",
                                                    errors.startDate && "border-red-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-[#219653]" />
                                                {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
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
                                                    "w-full h-14 mt-1 justify-start text-left font-normal rounded-lg border-[#E2F1E8] focus:ring-1 focus:ring-[#219653] bg-white",
                                                    !field.value && "text-gray-300",
                                                    errors.endDate && "border-red-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-[#219653]" />
                                                {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
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

                    {/* Pricing Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[#219653] ml-1">Total Price</label>
                            <div className="relative mt-1">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#219653]" />
                                <Input
                                    {...register("price")}
                                    type="number"
                                    placeholder="Amount"
                                    className={cn(
                                        "h-14 pl-10 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300",
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
                                        "h-14 pl-10 rounded-xl border-[#E2F1E8] focus-visible:ring-1 focus-visible:ring-[#219653] text-gray-700 placeholder:text-gray-300",
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
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-center z-50">
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
            </div>
        </div>
    );
}

export default withAuth(EditTripPage);
