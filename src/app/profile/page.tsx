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
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { withAuth } from "@/components/auth/with-auth";

function ProfilePage() {
    const router = useRouter();

    const [userData, setUserData] = useState({
        name: "Muhammed Rafeeq",
        email: "rafeeq@unzolo.com",
        phone: "+91 9876543210",
        role: "Administrator",
        companyName: "Unzolo Travels",
        password: "••••••••"
    });

    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [tempCompany, setTempCompany] = useState(userData.companyName);
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const partner = JSON.parse(storedUser);
                setUserData(prev => ({
                    ...prev,
                    name: partner.name || prev.name,
                    email: partner.email || prev.email,
                    phone: partner.phone || prev.phone,
                    companyName: partner.name || prev.companyName,
                }));
                setTempCompany(partner.name || userData.companyName);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    const handleSaveCompany = () => {
        setUserData({ ...userData, companyName: tempCompany });
        setIsEditingCompany(false);
    };

    const handleSavePassword = () => {
        setIsChangingPassword(false);
        setPasswords({ current: "", new: "", confirm: "" });
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
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
                <h1 className="text-lg font-bold text-black flex-1 text-center">My Profile</h1>
                <div className="w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[40px] p-6 shadow-2xl overflow-y-auto pb-10">
                {/* User Header Section */}
                <div className="flex flex-col items-center mb-8 mt-4">
                    <div className="w-24 h-24 rounded-full bg-[#E2F1E8] flex items-center justify-center mb-4 relative ring-4 ring-[#219653]/10">
                        <User className="w-12 h-12 text-[#219653]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#219653] border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-black">{userData.name}</h2>
                    <p className="text-sm text-gray-400 font-medium">{userData.role}</p>
                </div>

                <div className="space-y-6">
                    {/* General Information (Non-editable) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Account Details</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Email */}
                            <Card className="p-4 border-none bg-gray-50/50 rounded-2xl flex items-center flex-row gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Email Address</p>
                                    <p className="text-sm font-bold text-black truncate">{userData.email}</p>
                                </div>
                            </Card>

                            {/* Phone */}
                            <Card className="p-4 border-none bg-gray-50/50 rounded-2xl flex flex-row items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Phone Number</p>
                                    <p className="text-sm font-bold text-black truncate">{userData.phone}</p>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Editable Section: Company */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Workplace</h3>
                        </div>

                        <Card className={cn(
                            "p-4 border-2 transition-all rounded-2xl",
                            isEditingCompany ? "border-[#219653] bg-white ring-4 ring-[#219653]/5" : "border-transparent bg-gray-50/50"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Building2 className="w-5 h-5 text-[#219653]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Company Name</p>
                                    {isEditingCompany ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                value={tempCompany}
                                                onChange={(e) => setTempCompany(e.target.value)}
                                                className="h-10 border-[#E2F1E8] focus-visible:ring-[#219653] font-bold"
                                                autoFocus
                                            />
                                            <Button size="icon" className="h-10 w-10 bg-[#219653] shrink-0" onClick={handleSaveCompany}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-400 shrink-0" onClick={() => { setIsEditingCompany(false); setTempCompany(userData.companyName); }}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-black">{userData.companyName}</p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#219653]" onClick={() => setIsEditingCompany(true)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Editable Section: Password */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Security</h3>
                        </div>

                        <Card className={cn(
                            "p-4 border-2 transition-all rounded-2xl",
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
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="New Password"
                                                className="h-11 border-gray-100 focus-visible:ring-red-500/30 text-sm"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                className="h-11 border-gray-100 focus-visible:ring-red-500/30 text-sm"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <Button className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl h-11" onClick={handleSavePassword}>
                                                    Update Password
                                                </Button>
                                                <Button variant="outline" className="px-6 rounded-xl border-gray-200 h-11" onClick={() => setIsChangingPassword(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-black">{userData.password}</p>
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

                <div className="mt-12 text-center pb-8">
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Koodam CRM v0.1.0 Beta</p>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage);
