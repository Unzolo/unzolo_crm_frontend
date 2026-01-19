"use client";

import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (values: ResetPasswordValues) => {
            const response = await apiWithOffline.post("/auth/reset-password", {
                token,
                password: values.password,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Password reset successfully!");
            setIsSuccess(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to reset password. The link may have expired.");
        },
    });

    const onSubmit = (values: ResetPasswordValues) => {
        if (!token) {
            toast.error("Invalid or missing reset token.");
            return;
        }
        resetPasswordMutation.mutate(values);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col h-full text-center">
                <div className="w-20 h-20 bg-[#E2F1E8] rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-[#219653]" />
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-[#000000]">All Set!</h2>
                <p className="text-gray-500 mb-8 px-4">
                    Your password has been successfully reset. You can now login with your new password.
                </p>

                <Button
                    onClick={() => router.push("/login")}
                    className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors shadow-lg shadow-green-100"
                >
                    Back to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-center mb-2 text-[#000000]">Create New Password</h2>
            <p className="text-gray-500 mb-8 text-center px-4">
                Your new password must be different from previous used passwords.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
                {/* Password Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 ml-1">New Password</label>
                    <div className="relative mt-2">
                        <Input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className={cn(
                                "w-full px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                errors.password && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[11px] text-red-500 ml-1">{errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 ml-1">Confirm Password</label>
                    <div className="relative mt-2">
                        <Input
                            {...register("confirmPassword")}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className={cn(
                                "w-full px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-[11px] text-red-500 ml-1">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <div className="mt-8">
                    <Button
                        type="submit"
                        disabled={resetPasswordMutation.isPending}
                        className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                    >
                        {resetPasswordMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-[#219653] animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
