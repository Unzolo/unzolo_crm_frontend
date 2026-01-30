"use client";

import {
    Zap,
    MessageSquare,
    FileText,
    CheckCircle2,
    ArrowLeft,
    Crown,
    XCircle,
    Loader2,
    Calendar,
    ArrowRight,
    History,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { withAuth } from "@/components/auth/with-auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

function SubscriptionPage() {
    const router = useRouter();

    const { data: profileResponse, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
    });

    const { data: historyResponse } = useQuery({
        queryKey: ["subscription-history"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/subscriptions/history");
            return response.data;
        },
    });

    const partner = profileResponse?.data;
    const history = historyResponse?.data || [];
    const [isProcessing, setIsProcessing] = useState(false);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!partner) return;
        setIsProcessing(true);

        try {
            const sdkLoaded = await loadRazorpay();
            if (!sdkLoaded) {
                toast.error("Failed to load Payment Gateway. Please check your connection.");
                setIsProcessing(false);
                return;
            }

            // 1. Create Order
            const orderRes = await apiWithOffline.post("/subscriptions/create-order");
            const order = orderRes.data.data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Unzolo CRM",
                description: "Premium Plan (1 Month)",
                order_id: order.id,
                handler: async (response: any) => {
                    try {
                        // 2. Verify Payment
                        const verifyRes = await apiWithOffline.post("/subscriptions/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.data.success) {
                            toast.success("Welcome to Premium! Your plan is activated.");
                            window.location.reload(); // Refresh to update partner status
                        }
                    } catch (err: any) {
                        toast.error(err.response?.data?.message || "Payment verification failed.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: partner.name,
                    email: partner.email,
                    contact: partner.phone || "",
                },
                theme: {
                    color: "#219653",
                },
                modal: {
                    ondismiss: () => setIsProcessing(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Something went wrong.");
            setIsProcessing(false);
        }
    };

    if (partner && partner.email !== 'muhammedrafeeqvr805@gmail.com') {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex flex-col items-center justify-center p-6 text-center">
                <Crown className="w-16 h-16 text-[#219653] mb-4 opacity-20" />
                <h2 className="text-2xl font-black text-black mb-2">Internal Testing Only</h2>
                <p className="text-gray-500 text-sm">Subscription features are being tested. Your account is currently on the legacy free plan.</p>
                <Button onClick={() => router.back()} className="mt-6 bg-[#219653]" variant="outline">Go Back</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E2F1E8] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
            </div>
        );
    }

    const plans = [
        {
            name: "Premium Plan",
            price: "₹300",
            period: "per month",
            description: "Full access to all Unzolo features",
            features: [
                "Unlimited Trip Creation",
                "Unlimited Bookings",
                "WhatsApp Notifications",
                "Automated PDF Receipts",
                "Customer Management",
                "Basic Analytics",
                "Offline Support"
            ],
            recommended: true,
            current: partner?.plan === 'pro',
            button: partner?.plan === 'pro' ? "Plan Active" : "Get Premium Access",
            disabled: partner?.plan === 'pro'
        }
    ];

    const isTrialActive = new Date() < new Date("2026-03-01");

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
                <h1 className="text-xl font-bold text-black flex-1 text-center">Subscription</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 bg-white rounded-t-[30px] p-6 shadow-2xl overflow-y-auto">
                <div className="max-w-md mx-auto space-y-8 pb-10">

                    {/* Current Plan Status */}
                    <Card className="p-6 bg-gradient-to-br from-[#219653] to-[#1b7a43] text-white border-none rounded-3xl overflow-hidden relative shadow-xl shadow-green-100">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                                    {isTrialActive && partner?.plan !== 'pro' ? "Free Trial Active" : "Account Status"}
                                </Badge>
                                <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                            </div>
                            <h2 className="text-3xl font-black mb-1 capitalize">
                                {isTrialActive && partner?.plan !== 'pro' ? "Free Period" : (partner?.plan === 'pro' ? "Premium Plan" : "Free Plan")}
                            </h2>
                            <p className="text-white/80 text-xs font-medium mb-6">
                                {isTrialActive && partner?.plan !== 'pro'
                                    ? "Full access for free until March 1"
                                    : (partner?.plan === 'pro' ? "Full automation & notifications enabled" : "Please upgrade to continue using services")}
                            </p>

                            {(partner?.subscriptionExpires || isTrialActive) && (
                                <div className="flex items-center gap-2 text-[10px] font-bold py-2 px-3 bg-black/20 rounded-full w-fit">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {partner?.plan === 'pro' && partner?.subscriptionExpires
                                            ? `EXPIRES ON ${format(new Date(partner.subscriptionExpires), "dd MMM yyyy").toUpperCase()}`
                                            : "FREE UNTIL 01 MARCH 2026"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Decorative Circles */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-black/5 rounded-full blur-2xl" />
                    </Card>

                    {/* Notification Stats (Dummy) */}
                    {partner?.isWhatsappEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-4 rounded-2xl border-none ring-1 ring-gray-100 flex flex-col items-center justify-center text-center">
                                <MessageSquare className="w-5 h-5 text-green-500 mb-2" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp</span>
                                <span className="text-lg font-black text-black">Active</span>
                            </Card>
                            <Card className="p-4 rounded-2xl border-none ring-1 ring-gray-100 flex flex-col items-center justify-center text-center">
                                <FileText className="w-5 h-5 text-blue-500 mb-2" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF Automation</span>
                                <span className="text-lg font-black text-black">Enabled</span>
                            </Card>
                        </div>
                    )}

                    {/* Plan Options */}
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-black text-black">Scale your business</h3>
                            <p className="text-sm text-gray-500 mt-1">Upgrade to unlock automation tools</p>
                        </div>

                        {plans.map((plan) => (
                            <Card
                                key={plan.name}
                                className={cn(
                                    "p-6 rounded-[30px] border-2 transition-all relative overflow-hidden",
                                    plan.recommended ? "border-[#219653] shadow-lg shadow-green-50" : "border-gray-50",
                                    plan.current && "bg-gray-50/50"
                                )}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-[#219653] text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase">
                                            Recommended
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black text-black">{plan.name}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{plan.description}</p>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-black">{plan.price}</span>
                                        <span className="text-xs text-gray-400 font-bold">/ {plan.period}</span>
                                    </div>

                                    <div className="space-y-3 py-4">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#219653]" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-bold transition-all",
                                            plan.current
                                                ? "bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-default"
                                                : "bg-[#219653] hover:bg-[#1b7a43] text-white shadow-lg shadow-green-100"
                                        )}
                                        onClick={() => {
                                            if (!plan.disabled) {
                                                handlePayment();
                                            }
                                        }}
                                        disabled={plan.disabled || isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                {plan.button}
                                                {!plan.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Purchase History */}
                    {history.length > 0 && (
                        <div className="space-y-4 pt-10">
                            <div className="flex items-center gap-2 mb-2">
                                <History className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-black text-black">Purchase History</h3>
                            </div>

                            <div className="space-y-3">
                                {history.map((item: any) => (
                                    <Card key={item.id} className="p-4 rounded-2xl border-none ring-1 ring-gray-100 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                            <CreditCard className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-sm font-bold text-black capitalize">{item.plan} Plan</p>
                                                <p className="text-sm font-black text-[#219653]">₹{item.amount}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                                                </p>
                                                <Badge className="bg-green-50 text-[#219653] border-none text-[8px] h-4">
                                                    SUCCESS
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-center text-[10px] text-gray-400 font-medium pb-10">
                        By subscribing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default withAuth(SubscriptionPage);
