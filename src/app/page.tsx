"use client";

import {
  Package,
  ClipboardCheck,
  IndianRupee,
  PlusSquare,
  MapPin,
  Calendar,
  User,
  LogOut,
  Loader2,
  Pencil
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PwaInstallBanner } from "@/components/pwa-install-prompt";
import { Button } from "@/components/ui/button";

function DashboardPage() {
  const router = useRouter();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await apiWithOffline.get("/dashboard/stats");
      return response.data;
    },
  });

  const dashboardStats = statsResponse?.data || {
    totalTrips: 0,
    totalBookings: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
  };

  const { data: tripsResponse, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const response = await apiWithOffline.get("/trips");
      return response.data;
    },
  });

  const allTrips = tripsResponse?.data || [];
  const camps = allTrips.filter((t: any) => t.type === "camp");
  const packages = allTrips.filter((t: any) => t.type === "package");

  const { data: profileResponse, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiWithOffline.get("/auth/profile");
      return response.data;
    },
  });

  const userName = profileResponse?.data?.name || "Partner";

  const stats = [
    {
      label: "Total Trips Count",
      value: dashboardStats.totalTrips.toString(),
      icon: <Package className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Bookings",
      value: dashboardStats.totalBookings.toString(),
      icon: <ClipboardCheck className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Earnings",
      value: `₹${dashboardStats.totalEarnings.toLocaleString()}`,
      icon: <IndianRupee className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Monthly Earnings",
      value: `₹${dashboardStats.monthlyEarnings.toLocaleString()}`,
      icon: <IndianRupee className="w-6 h-6 text-[#219653]" />,
    },
  ];

  const actions = [
    {
      title: "Create New",
      description: "Create and list new camps",
      icon: <PlusSquare className="w-6 h-6 text-white" />,
      onClick: () => router.push("/create-trip"),
    },
    {
      title: "Manage Bookings",
      description: "View and manage booking for packages",
      icon: <ClipboardCheck className="w-6 h-6 text-white" />,
      onClick: () => router.push("/select-trip"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
      {/* Header - Mobile Only */}
      <div className="p-5 flex items-center justify-between lg:hidden">
        <div className="w-10" />
        <h1 className="text-xl font-bold text-black flex-1 text-center font-sans tracking-tight">
          {profileLoading ? <Skeleton className="h-6 w-32 mx-auto" /> : `${userName} CRM`}
        </h1>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 transition-colors">
              <User className="w-6 h-6 text-[#219653]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 rounded-2xl border-none shadow-xl bg-white mt-2" align="end">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl hover:bg-[#E2F1E8] hover:text-[#219653] font-semibold"
                onClick={() => router.push("/profile")}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Button>
              <div className="h-px bg-gray-100 my-1 mx-2" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl hover:bg-red-50 hover:text-red-500 font-semibold"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  router.push("/login");
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {profileLoading ? "..." : userName}! Here's your overview</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white lg:bg-transparent rounded-t-[30px] lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none">
        <div className="max-w-5xl mx-auto">
          {/* Quick Stats Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
              <h2 className="text-lg lg:text-xl font-bold text-black">Quick Stats</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4 lg:p-6 border-none shadow-sm rounded-[16px] lg:rounded-[28px] flex flex-row gap-3 lg:gap-4 bg-white ring-1 ring-gray-50">
                    <Skeleton className="w-12 h-12 lg:w-16 lg:h-16 rounded-full shrink-0" />
                    <div className="flex flex-col justify-center gap-2 flex-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </Card>
                ))
              ) : (
                stats.map((stat, index) => (
                  <Card key={index} className="p-4 lg:p-6 border-none shadow-sm rounded-[16px] lg:rounded-[28px] flex flex-row gap-3 lg:gap-4 bg-white ring-1 ring-gray-50 hover:shadow-md hover:ring-[#219653]/10 transition-all group">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0 group-hover:bg-[#219653]/10 transition-colors">
                      <div className="group-hover:scale-110 transition-transform">{stat.icon}</div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] lg:text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
                      <span className="text-lg lg:text-2xl font-bold text-black tracking-tight">{stat.value}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
              <h2 className="text-lg lg:text-xl font-bold text-black">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              {actions.map((action, index) => (
                <Card
                  key={index}
                  className="p-4 lg:p-6 rounded-[16px] lg:rounded-[32px] bg-[#219653]/10 lg:bg-white flex flex-row items-center gap-4 lg:gap-6 border-none ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
                  onClick={action.onClick}
                >
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-[#219653] flex items-center justify-center shrink-0 shadow-sm transition-transform ">
                    <div className="text-[#219653]">
                      {action.icon}
                    </div>
                  </div>
                  <div className="flex flex-col items-start text-left min-w-0 flex-1">
                    <span className="text-sm lg:text-lg font-bold text-black leading-tight truncate w-full group-hover:text-[#219653] transition-colors">{action.title}</span>
                    <p className="text-[10px] lg:text-sm text-gray-500 font-medium mt-1 leading-tight line-clamp-2">{action.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PwaInstallBanner />
    </div>
  );
}

export default withAuth(DashboardPage);
