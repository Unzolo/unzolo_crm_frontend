"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";

function OtpForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "your email";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Move to previous input on backspace if current input is empty
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const verifyMutation = useMutation({
        mutationFn: async (otpString: string) => {
            const response = await apiWithOffline.post("/auth/verify-otp", { email, otp: otpString });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return response.data;
        },
        onSuccess: (response) => {
            if (response.queued) {
                toast.warning("You are currently offline. Verification will proceed once you're back online.");
                return;
            }
            toast.success("Verification successful!");
            router.push("/login"); // Or dashboard
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Invalid OTP. Please try again.");
        },
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            const response = await apiWithOffline.post("/auth/resend-otp", { email });
            return response.data;
        },
        onSuccess: (response) => {
            if (response.queued) {
                toast.warning("You are currently offline. Resend will proceed once you're back online.");
                return;
            }
            toast.success("OTP sent");
            setTimer(30);
            setCanResend(false);
            setOtp(["", "", "", "", "", ""]); // Clear OTP fields
            inputRefs.current[0]?.focus(); // Focus the first input field
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to resend OTP. Please try again later.");
        },
    });

    const handleVerify = () => {
        const otpString = otp.join("");
        if (otpString.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        verifyMutation.mutate(otpString);
    };

    return (
        <div className="flex flex-col h-full ">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                suppressHydrationWarning
                className="w-fit flex items-center text-gray-800 font-medium mb-6 hover:text-black transition-colors px-0 group"
            >
                <ChevronLeft size={24} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Back</span>
            </Button>

            <h2 className="text-2xl font-bold text-[#000000] mb-8 leading-tight">
                Enter OTP Received on email
            </h2>

            <div className="flex justify-between gap-2 mb-8">
                {otp.map((digit, index) => (
                    <Input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        suppressHydrationWarning
                        className="w-12 h-14 border border-gray-300 rounded-xl text-center text-xl font-semibold focus-visible:ring-2 focus-visible:ring-[#219653] focus-visible:border-transparent transition-all"
                    />
                ))}
            </div>

            <div className="space-y-4 flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">
                    Please check your email, we have sent a verification code to:
                </p>
                <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-black">{email}</span>
                    <Button
                        variant="link"
                        onClick={() => router.push("/signup")}
                        suppressHydrationWarning
                        className="text-[#219653] text-sm font-medium hover:underline p-0 h-auto"
                    >
                        Change ?
                    </Button>
                </div>

                <p className="text-sm text-gray-600 pt-4">
                    Didn't receive OTP?{" "}
                    {canResend ? (
                        <Button
                            variant="link"
                            onClick={() => resendMutation.mutate()}
                            disabled={resendMutation.isPending}
                            suppressHydrationWarning
                            className="text-[#219653] font-medium hover:underline p-0 h-auto"
                        >
                            {resendMutation.isPending ? "Resending..." : "Resend"}
                        </Button>
                    ) : (
                        <span className="text-gray-400 font-medium">Resend in {timer}s</span>
                    )}
                </p>
            </div>

            <div className="mt-8">
                <Button
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                    suppressHydrationWarning
                    className="w-full bg-[#219653] py-6 rounded-full text-white font-semibold text-lg hover:bg-[#1A7B44] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {verifyMutation.isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify"
                    )}
                </Button>
            </div>
        </div>
    );
}

export default function OtpPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-[#219653]" /></div>}>
            <OtpForm />
        </Suspense>
    );
}

