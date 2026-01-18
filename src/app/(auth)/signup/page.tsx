"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

import { useAuthStore, SignupData } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/lib/hooks/use-offline";

const signupSchema = z.object({
    name: z.string().min(2, "Company Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(10, "Phone number must be exactly 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const isOnline = useOnlineStatus();
    const { setEmail, signupData, setSignupData } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: signupData,
    });

    const signupMutation = useMutation({
        mutationFn: async (values: SignupValues) => {
            const response = await apiWithOffline.post("/auth/register", values);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return response.data;
        },
        onSuccess: (response, variables) => {
            if (response.queued) {
                toast.warning("You are currently offline. Signup will proceed once you're back online.");
                return;
            }
            setEmail(variables.email);
            toast.success("OTP sent");
            router.push(`/otp?email=${encodeURIComponent(variables.email)}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        },
    });

    const onSubmit = (values: SignupValues) => {
        signupMutation.mutate(values);
    };

    const handleFieldChange = (name: keyof SignupData, value: string) => {
        setSignupData({ [name]: value });
        if (name === 'email') {
            setEmail(value);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                <h2 className="text-2xl font-semibold text-center mb-4 text-[#000000]">Create new account</h2>

                <div className="space-y-3 flex-1">
                    {/* Company Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500 ml-1">Company name</label>
                        <Input
                            {...register("name", { onChange: (e) => handleFieldChange('name', e.target.value) })}
                            type="text"
                            placeholder="Enter company name"
                            suppressHydrationWarning
                            className={cn(
                                "w-full px-4 py-6 mt-1 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                errors.name && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.name && (
                            <p className="text-[11px] text-red-500 ml-1">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500 ml-1">Email ID</label>
                        <Input
                            {...register("email", { onChange: (e) => handleFieldChange('email', e.target.value) })}
                            type="email"
                            placeholder="Enter email id"
                            suppressHydrationWarning
                            className={cn(
                                "w-full mt-1 px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                errors.email && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.email ? (
                            <p className="text-[11px] text-red-500 ml-1">{errors.email.message}</p>
                        ) : (
                            <p className="text-[11px] text-gray-400 ml-1">You will receive on OTP on this email</p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500 ml-1">Phone Number</label>
                        <Input
                            {...register("phone", { onChange: (e) => handleFieldChange('phone', e.target.value) })}
                            type="tel"
                            placeholder="10 digit phone number"
                            suppressHydrationWarning
                            className={cn(
                                "w-full mt-1 px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                errors.phone && "border-red-500 focus-visible:ring-red-500"
                            )}
                        />
                        {errors.phone && (
                            <p className="text-[11px] text-red-500 ml-1">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-500 ml-1">Password</label>
                        <div className="relative">
                            <Input
                                {...register("password", { onChange: (e) => handleFieldChange('password', e.target.value) })}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a new password"
                                suppressHydrationWarning
                                className={cn(
                                    "w-full mt-1 px-4 py-6 rounded-lg border border-gray-200 focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all",
                                    errors.password && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                                suppressHydrationWarning
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-[11px] text-red-500 ml-1">{errors.password.message}</p>
                        )}
                    </div>
                    <div className="pt-2">
                        <p className="text-sm text-gray-600">
                            Already have an account ?{" "}
                            <Link href="/login" className="text-black font-bold hover:underline">
                                Login
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <Button
                        type="submit"
                        disabled={signupMutation.isPending}
                        suppressHydrationWarning
                        className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors flex items-center justify-center gap-2"
                    >
                        {signupMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

