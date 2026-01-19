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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function DashboardPage() {
  const router = useRouter();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  const { data: statsResponse } = useQuery({
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

  const stats = [
    {
      label: "Total Trips",
      value: dashboardStats.totalTrips.toString(),
      icon: <Package className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Booking",
      value: dashboardStats.totalBookings.toString(),
      icon: <ClipboardCheck className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Earnings",
      value: `₹${dashboardStats.totalEarnings.toLocaleString()}`,
      icon: <IndianRupee className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Mo Earnings",
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
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-xl font-bold text-black flex-1 text-center font-sans tracking-tight">Koodam</h1>

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

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-t-[30px] p-4 shadow-2xl">
        {/* Quick Stats Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
            <h2 className="text-lg font-bold text-black">Quick Stats</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <Card key={index} className="p-3 border-none shadow-sm rounded-2xl flex flex-row gap-3 bg-white ring-1 ring-gray-50">
                <div className="w-12 h-12 rounded-full bg-[#E2F1E8] flex items-center justify-center shrink-0">
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 font-medium">{stat.label}</span>
                  <span className="text-lg font-bold text-black">{stat.value}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
            <h2 className="text-lg font-bold text-black">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full h-auto p-3 py-4 rounded-[20px] bg-[#E2F1E8] hover:bg-[#d5e9dc] flex flex-row items-center justify-start gap-3 border-none transition-all active:scale-[0.98]"
                onClick={action.onClick}
              >
                <div className="w-12 h-12 rounded-full bg-[#219653] flex items-center justify-center shrink-0 shadow-sm">
                  <div className="text-white">
                    {action.icon}
                  </div>
                </div>
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-bold text-black leading-tight truncate w-full">{action.title}</span>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight line-clamp-2">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <PwaInstallBanner />
    </div>
  );
}

export default withAuth(DashboardPage);
