"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const forgotPasswordMutation = useMutation({
        mutationFn: async (values: ForgotPasswordValues) => {
            const response = await apiWithOffline.post("/auth/forgot-password", values);
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Reset link sent to your email!");
            setIsSubmitted(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to send reset link. Please try again.");
        },
    });

    const onSubmit = (values: ForgotPasswordValues) => {
        forgotPasswordMutation.mutate(values);
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col h-full text-center">
                <div className="w-20 h-20 bg-[#E2F1E8] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10 text-[#219653]" />
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-[#000000]">Check your Email</h2>
                <p className="text-gray-500 mb-8 px-4">
                    We have sent a password recover instruction to your email.
                </p>

                <div className="space-y-4">
                    <Button
                        onClick={() => router.push("/login")}
                        className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors"
                    >
                        Back to Login
                    </Button>
                    <p className="text-sm text-gray-500">
                        Didn't receive the email?{" "}
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-[#219653] font-bold hover:underline"
                        >
                            Try again
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/login")}
                    className="text-black hover:bg-transparent -ml-2"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-2xl font-semibold flex-1 text-center mr-8 text-[#000000]">Forgot Password</h2>
            </div>

            <p className="text-gray-500 mb-8 text-center px-4">
                Enter your email address and we will send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1">
                {/* Email Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 ml-1">Email ID</label>
                    <Input
                        {...register("email")}
                        type="email"
                        placeholder="Enter email id"
                        className={cn(
                            "w-full mt-2 px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                            errors.email && "border-red-500 focus-visible:ring-red-500"
                        )}
                    />
                    {errors.email && (
                        <p className="text-[11px] text-red-500 ml-1">{errors.email.message}</p>
                    )}
                </div>

                <div className="mt-8">
                    <Button
                        type="submit"
                        disabled={forgotPasswordMutation.isPending}
                        className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                    >
                        {forgotPasswordMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Instructions"
                        )}
                    </Button>
                </div>
            </form>

            <div className="mt-auto pt-8 text-center">
                <p className="text-sm text-gray-600">
                    Remember your password?{" "}
                    <Link href="/login" className="text-[#219653] font-bold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
