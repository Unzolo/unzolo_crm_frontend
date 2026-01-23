"use client";

import {
    ArrowLeft,
    Save,
    User,
    Phone,
    MapPin,
    Calendar,
    UserPlus,
    Search,
    ChevronRight,
    Loader2,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { syncService } from "@/lib/sync-service";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function NewEnquiryPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        tripId: "",
        status: "warm",
        notes: "",
        followUpDate: new Date().toISOString().split('T')[0]
    });

    // Fetch previous customers from bookings
    const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
        queryKey: ["all-bookings"],
        queryFn: async () => {
            return await syncService.getBookings();
        },
    });

    // Extract unique customers
    const previousCustomers = useMemo(() => {
        const unique = new Map();
        bookings.forEach((booking: any) => {
            booking.Customers?.forEach((customer: any) => {
                if (!unique.has(customer.contactNumber)) {
                    unique.set(customer.contactNumber, {
                        name: customer.name,
                        phone: customer.contactNumber
                    });
                }
            });
        });
        return Array.from(unique.values());
    }, [bookings]);

    const filteredCustomers = previousCustomers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    const selectCustomer = (customer: { name: string, phone: string }) => {
        setFormData(prev => ({ ...prev, name: customer.name, phone: customer.phone }));
        setIsSelectingCustomer(false);
    };

    // Create Mutation
    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return await apiWithOffline.post("/enquiries", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["enquiries"] });
            toast.success("Enquiry created successfully");
            router.push("/enquiries");
        },
        onError: (error: any) => {
            if (error.isOffline) {
                toast.info("Saved offline. Will sync when online.");
                router.push("/enquiries");
            } else {
                toast.error("Failed to create enquiry");
            }
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            toast.error("Name and Phone are required");
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-black hover:bg-transparent px-0">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold text-black flex-1 text-center font-sans tracking-tight">New Enquiry</h1>
                <div className="w-6" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-black">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-3xl font-bold text-black">New Enquiry</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-6 shadow-2xl lg:shadow-none overflow-y-auto">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

                    <Button
                        type="button"
                        onClick={() => setIsSelectingCustomer(true)}
                        variant="outline"
                        className="w-full h-14 border-dashed border-[#219653] text-[#219653] hover:bg-[#E2F1E8] rounded-lg flex items-center justify-center gap-3 font-bold"
                    >
                        <UserPlus className="w-5 h-5" /> Select from Previous Customers
                    </Button>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <User className="w-3.5 h-3.5 text-[#219653]" /> Full Name
                            </label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter customer name"
                                className="h-14 bg-gray-50/50 border-gray-100 rounded-lg focus-visible:ring-[#219653]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <Phone className="w-3.5 h-3.5 text-[#219653]" /> Contact Number
                            </label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter mobile number"
                                className="h-14 bg-gray-50/50 border-gray-100 rounded-lg focus-visible:ring-[#219653]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Clock className="w-3.5 h-3.5 text-[#219653]" /> Status
                                </label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger className="w-full h-14 bg-gray-50/50 border-gray-100 rounded-lg focus:ring-[#219653] px-4 text-sm font-medium">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="hot" className="rounded-xl">Hot</SelectItem>
                                        <SelectItem value="warm" className="rounded-xl">Warm</SelectItem>
                                        <SelectItem value="cold" className="rounded-xl">Cold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#219653]" /> Next Follow-up
                                </label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-14 bg-gray-50/50 border-gray-100 rounded-lg px-4 justify-start text-left font-normal focus:ring-[#219653]",
                                                !formData.followUpDate && "text-muted-foreground"
                                            )}
                                        >
                                            <Calendar className="mr-2 h-4 w-4 text-[#219653]" />
                                            {formData.followUpDate ? (
                                                format(new Date(formData.followUpDate), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={formData.followUpDate ? new Date(formData.followUpDate) : undefined}
                                            onSelect={(date) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    followUpDate: date ? date.toISOString().split('T')[0] : ""
                                                }));
                                                setIsCalendarOpen(false);
                                            }}
                                            initialFocus
                                            className="p-3"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                <MapPin className="w-3.5 h-3.5 text-[#219653]" /> Notes / Interests
                            </label>
                            <textarea
                                className="w-full p-4 min-h-[120px] bg-gray-50/50 border-gray-100 rounded-[16px] focus:ring-[#219653] text-sm resize-none"
                                placeholder="Destination, group size, special requests..."
                                value={formData.notes}
                                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full h-14 bg-[#219653] hover:bg-[#1A7B44] text-white rounded-2xl shadow-lg shadow-[#219653]/20 font-bold text-lg"
                    >
                        {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Enquiry"}
                    </Button>
                </form>
            </div>

            {/* Customer Selection Drawer */}
            <Drawer open={isSelectingCustomer} onOpenChange={setIsSelectingCustomer}>
                <DrawerContent className="h-[80vh] bg-white rounded-t-[40px]">
                    <DrawerHeader>
                        <DrawerTitle className="text-xl font-black text-center text-black">Previous Customers</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-6 py-4 space-y-4 flex flex-col h-full overflow-hidden">
                        <div className="relative">
                            <Input
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                placeholder="Search by name or number..."
                                className="h-12 bg-gray-50 border-none rounded-xl pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pb-10">
                            {bookingsLoading ? (
                                <div className="flex flex-col items-center justify-center h-40">
                                    <Loader2 className="w-8 h-8 text-[#219653] animate-spin" />
                                </div>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer, idx) => (
                                    <Card
                                        key={idx}
                                        onClick={() => selectCustomer(customer)}
                                        className="p-4 border-none bg-gray-50/50 hover:bg-[#E2F1E8] rounded-lg flex flex-row shadow-none items-center justify-between group cursor-pointer active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#219653] border border-gray-100">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-black text-sm">{customer.name}</h4>
                                                <p className="text-xs text-gray-400 font-medium">{customer.phone}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#219653] transition-colors" />
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <User className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 font-medium">No previous customers found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default withAuth(NewEnquiryPage);
