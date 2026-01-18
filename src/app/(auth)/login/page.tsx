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
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { email: storedEmail, setEmail } = useAuthStore();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: storedEmail || "",
        },
    });

    // Ensure form is updated if store hydrates after render
    useEffect(() => {
        if (storedEmail) {
            setValue("email", storedEmail);
        }
    }, [storedEmail, setValue]);

    const loginMutation = useMutation({
        mutationFn: async (values: LoginValues) => {
            const response = await api.post("/auth/login", values);
            return response.data;
        },
        onSuccess: (response) => {
            const token = response?.data?.token;
            const partner = response?.data?.partner;

            if (token) {
                localStorage.setItem("token", token);
                if (partner) {
                    localStorage.setItem("user", JSON.stringify(partner));
                }
                toast.success("Welcome back!");
                router.push("/");
            } else {
                toast.error("Invalid response from server.");
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
        },
    });

    const onSubmit = (values: LoginValues) => {
        loginMutation.mutate(values);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-center mb-8 text-[#000000]">Login</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
                {/* Email Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 ml-1">Email ID</label>
                    <Input
                        {...register("email", { onChange: handleEmailChange })}
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

                {/* Password Field */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500 ml-1">Password</label>
                    <div className="relative mt-2">
                        <Input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
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

                <div className="pt-2">
                    <p className="text-sm text-gray-600">
                        Create a new account ?{" "}
                        <Link href="/signup" className="text-black font-bold hover:underline">
                            Signup
                        </Link>
                    </p>
                </div>

                <div className="mt-8">
                    <Button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] transition-colors flex items-center justify-center gap-2"
                    >
                        {loginMutation.isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Logging in...
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
