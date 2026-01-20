"use client";

import {
    ArrowLeft,
    User,
    Lock,
    Building2,
    Mail,
    Phone,
    ShieldCheck,
    Pencil,
    Check,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";

function ProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await apiWithOffline.get("/auth/profile");
            return response.data;
        },
    });

    const user = profileResponse?.data || {
        name: "Loading...",
        email: "...",
        phone: "...",
        isVerified: false,
    };

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiWithOffline.post("/auth/change-password", {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.queued) {
                toast.info("Password change request queued for sync");
            } else {
                toast.success("Password updated successfully");
            }
            setIsChangingPassword(false);
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update password");
        }
    });

    const handleSavePassword = () => {
        if (!passwords.oldPassword) {
            toast.error("Please enter your current password");
            return;
        }
        if (passwords.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        changePasswordMutation.mutate(passwords);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header - Mobile Only */}
            <div className="p-4 flex items-center justify-between lg:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-black hover:bg-transparent px-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold text-black flex-1 text-center">My Profile</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-black">My Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] lg:rounded-none p-6 shadow-2xl lg:shadow-none overflow-y-auto pb-10">
                <div className="max-w-3xl mx-auto">
                    {isProfileLoading ? (
                        <div className="space-y-8 mt-4">
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-24 h-24 rounded-full mb-4" />
                                <Skeleton className="h-6 w-32 rounded-md mb-2" />
                                <Skeleton className="h-4 w-24 rounded-md" />
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                    <Skeleton className="h-20 w-full rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* User Header Section */}
                            <div className="flex flex-col items-center mb-8 mt-4">
                                <div className="w-24 h-24 rounded-full bg-[#E2F1E8] flex items-center justify-center mb-4 relative ring-4 ring-[#219653]/10">
                                    <User className="w-12 h-12 text-[#219653]" />
                                    {user.isVerified && (
                                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#219653] border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                            <ShieldCheck className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-black">{user.name}</h2>
                                <p className="text-sm text-gray-400 font-medium">Verified Partner</p>
                            </div>

                            <div className="space-y-6">
                                {/* General Information */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Account Details</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Email */}
                                        <Card className="p-4 border-none bg-gray-50/50 rounded-lg shadow-none flex items-center flex-row gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Email Address</p>
                                                <p className="text-sm font-bold text-black truncate">{user.email}</p>
                                            </div>
                                        </Card>

                                        {/* Phone */}
                                        <Card className="p-4 border-none bg-gray-50/50 rounded-lg shadow-none flex flex-row items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Phone Number</p>
                                                <p className="text-sm font-bold text-black truncate">{user.phone}</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>

                                {/* Workplace Info */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Workplace</h3>
                                    </div>

                                    <Card className="p-4 border-none bg-gray-50/50 rounded-lg shadow-none">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                <Building2 className="w-5 h-5 text-[#219653]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Partner ID</p>
                                                <p className="text-sm font-bold text-black truncate">{user.id?.split('-')[0]}...</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Security Section */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Security</h3>
                                    </div>

                                    <Card className={cn(
                                        "p-4 border-2 transition-all rounded-lg shadow-none",
                                        isChangingPassword ? "border-red-200 bg-white ring-4 ring-red-500/5" : "border-transparent bg-gray-50/50"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                <Lock className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Password</p>
                                                    {!isChangingPassword && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setIsChangingPassword(true)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {isChangingPassword ? (
                                                    <div className="space-y-3 mt-2">
                                                        <Input
                                                            type="password"
                                                            placeholder="Current Password"
                                                            className="h-11 border-gray-100 focus-visible:ring-red-500/30 text-sm"
                                                            value={passwords.oldPassword}
                                                            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                                        />
                                                        <Input
                                                            type="password"
                                                            placeholder="New Password"
                                                            className="h-11 border-gray-100 focus-visible:ring-red-500/30 text-sm"
                                                            value={passwords.newPassword}
                                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                        />
                                                        <Input
                                                            type="password"
                                                            placeholder="Confirm New Password"
                                                            className="h-11 border-gray-100 focus-visible:ring-red-500/30 text-sm"
                                                            value={passwords.confirmPassword}
                                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                        />
                                                        <div className="flex gap-2 pt-1">
                                                            <Button
                                                                className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl h-11"
                                                                onClick={handleSavePassword}
                                                                disabled={changePasswordMutation.isPending}
                                                            >
                                                                {changePasswordMutation.isPending ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    "Update Password"
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="px-6 rounded-xl border-gray-200 h-11"
                                                                onClick={() => setIsChangingPassword(false)}
                                                                disabled={changePasswordMutation.isPending}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-black">••••••••</p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full h-14 rounded-2xl text-red-500 font-bold hover:bg-red-50 hover:text-red-600 mt-4 border-2 border-transparent active:scale-95 transition-all"
                                    onClick={handleLogout}
                                >
                                    Logout from Account
                                </Button>
                            </div>
                        </>
                    )}

                    <div className="mt-12 text-center pb-8">
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Unzolo CRM v0.1.0 Beta</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage);
