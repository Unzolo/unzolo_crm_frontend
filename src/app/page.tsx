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
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function DashboardPage() {
  const router = useRouter();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  const { data: tripsResponse, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const response = await api.get("/trips");
      return response.data;
    },
  });

  const allTrips = tripsResponse?.data || [];
  const camps = allTrips.filter((t: any) => t.type === "camp");
  const packages = allTrips.filter((t: any) => t.type === "package");

  const stats = [
    {
      label: "Total Trips",
      value: allTrips.length.toString(),
      icon: <Package className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Booking",
      value: "0",
      icon: <ClipboardCheck className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Total Earnings",
      value: "₹0",
      icon: <IndianRupee className="w-6 h-6 text-[#219653]" />,
    },
    {
      label: "Mo Earnings",
      value: "₹0",
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
      onClick: () => setIsBookingsOpen(true),
    },
  ];

  const formatTripDate = (start: string, end: string) => {
    try {
      return `${format(new Date(start), "MMM dd")} - ${format(new Date(end), "dd")}`;
    } catch {
      return "Date TBD";
    }
  };

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

      {/* Manage Bookings Drawer */}
      <Drawer open={isBookingsOpen} onOpenChange={setIsBookingsOpen}>
        <DrawerContent className="bg-white rounded-t-[40px] px-3 pb-8 outline-none max-h-[85vh]">
          <DrawerHeader className="p-0 my-3">
            <DrawerTitle className="text-base text-center text-black">
              Select Camp/Package to Add customers
            </DrawerTitle>
          </DrawerHeader>

          <Tabs defaultValue="camps" className="w-full overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-[#E2F1E8] rounded-xl p-1 h-9 mb-3 shrink-0">
              <TabsTrigger
                value="camps"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-medium"
              >
                Camps
              </TabsTrigger>
              <TabsTrigger
                value="packages"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#219653] text-gray-600 font-medium"
              >
                Packages
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              <TabsContent value="camps" className="space-y-4 mt-0">
                {tripsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
                    <p className="text-sm text-gray-500">Loading trips...</p>
                  </div>
                ) : camps.length > 0 ? (
                  camps.map((camp: any) => (
                    <Card
                      key={camp.id}
                      onClick={() => router.push(`/manage-bookings/${camp.id}`)}
                      className="p-3 rounded-2xl gap-2 border-2 border-[#219653]/20 space-y-1 hover:border-[#219653] bg-white transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="text-base font-bold text-black group-hover:text-[#219653] transition-colors line-clamp-1">{camp.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#219653] hover:bg-[#E2F1E8] rounded-full shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/edit-trip/${camp.id}`);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium truncate">{camp.destination}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#219653]" />
                          <span className="text-xs font-bold text-[#219653]">
                            {formatTripDate(camp.startDate, camp.endDate)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#219653]">₹{parseFloat(camp.price).toLocaleString()}</span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    No camps available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="packages" className="space-y-4 mt-0">
                {tripsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
                    <p className="text-sm text-gray-500">Loading trips...</p>
                  </div>
                ) : packages.length > 0 ? (
                  packages.map((pkg: any) => (
                    <Card
                      key={pkg.id}
                      onClick={() => router.push(`/manage-bookings/${pkg.id}`)}
                      className="p-3 rounded-2xl gap-2 border-2 border-[#219653]/20 space-y-1 hover:border-[#219653] bg-white transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className="text-base font-bold text-black group-hover:text-[#219653] transition-colors line-clamp-1">{pkg.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#219653] hover:bg-[#E2F1E8] rounded-full shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/edit-trip/${pkg.id}`);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium truncate">{pkg.destination}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#219653]" />
                          <span className="text-xs font-bold text-[#219653]">
                            {formatTripDate(pkg.startDate, pkg.endDate)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#219653]">₹{parseFloat(pkg.price).toLocaleString()}</span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    No packages available
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DrawerContent>
      </Drawer>

    </div >
  );
}

export default withAuth(DashboardPage);
