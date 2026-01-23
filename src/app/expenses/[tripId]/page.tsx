"use client";

import {
    ArrowLeft,
    Plus,
    TrendingUp,
    Calendar,
    IndianRupee,
    Home,
    Utensils,
    Car,
    Activity,
    Wrench,
    FileText,
    Users,
    Heart,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    Receipt,
    PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { withAuth } from "@/components/auth/with-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiWithOffline } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const EXPENSE_CATEGORIES = [
    { value: "accommodation", label: "Accommodation", icon: Home, color: "#FF6B6B" },
    { value: "food", label: "Food & Dining", icon: Utensils, color: "#4ECDC4" },
    { value: "transportation", label: "Transportation", icon: Car, color: "#45B7D1" },
    { value: "activities", label: "Activities", icon: Activity, color: "#FFA07A" },
    { value: "equipment", label: "Equipment", icon: Wrench, color: "#98D8C8" },
    { value: "permits", label: "Permits & Fees", icon: FileText, color: "#F7B731" },
    { value: "guide_fees", label: "Guide Fees", icon: Users, color: "#5F27CD" },
    { value: "medical", label: "Medical", icon: Heart, color: "#EE5A6F" },
    { value: "miscellaneous", label: "Miscellaneous", icon: MoreHorizontal, color: "#95A5A6" },
    { value: "other", label: "Other", icon: MoreHorizontal, color: "#7F8C8D" },
];

const expenseSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(3, "Description must be at least 3 characters"),
    amount: z.coerce.number().min(1, "Amount must be at least 1"),
    date: z.date(),
    paidBy: z.string().optional(),
    notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

function ExpenseManagementPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const queryClient = useQueryClient();

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useState(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    });

    // Fetch trip details
    const { data: tripResponse, isLoading: tripLoading } = useQuery({
        queryKey: ["trip", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/trips/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    // Fetch expenses
    const { data: expensesResponse, isLoading: expensesLoading } = useQuery({
        queryKey: ["expenses", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/expenses/trip/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
    });

    // Fetch analytics
    const { data: analyticsResponse } = useQuery({
        queryKey: ["expense-analytics", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/expenses/trip/${tripId}/analytics`);
            return response.data;
        },
        enabled: !!tripId,
    });

    const trip = tripResponse?.data;
    const expenses = expensesResponse?.data?.expenses || [];
    const summary = expensesResponse?.data?.summary || { total: 0, byCategory: {}, count: 0 };
    const analytics = analyticsResponse?.data || {};

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            category: "",
            description: "",
            amount: 0,
            date: new Date(),
            paidBy: "",
            notes: "",
        },
    });

    const selectedCategory = watch("category");

    // Create expense mutation
    const createExpenseMutation = useMutation({
        mutationFn: async (data: ExpenseFormValues) => {
            const formData = new FormData();
            formData.append("tripId", tripId);
            formData.append("category", data.category);
            formData.append("description", data.description);
            formData.append("amount", data.amount.toString());
            formData.append("date", data.date.toISOString());
            if (data.paidBy) formData.append("paidBy", data.paidBy);
            if (data.notes) formData.append("notes", data.notes);

            const response = await apiWithOffline.post("/expenses", formData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
            queryClient.invalidateQueries({ queryKey: ["expense-analytics", tripId] });
            toast.success("Expense added successfully!");
            setShowAddExpense(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add expense");
        },
    });

    // Update expense mutation
    const updateExpenseMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: ExpenseFormValues }) => {
            const formData = new FormData();
            formData.append("category", data.category);
            formData.append("description", data.description);
            formData.append("amount", data.amount.toString());
            formData.append("date", data.date.toISOString());
            if (data.paidBy) formData.append("paidBy", data.paidBy);
            if (data.notes) formData.append("notes", data.notes);

            const response = await apiWithOffline.put(`/expenses/${id}`, formData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
            queryClient.invalidateQueries({ queryKey: ["expense-analytics", tripId] });
            toast.success("Expense updated successfully!");
            setShowAddExpense(false);
            setEditingExpense(null);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update expense");
        },
    });

    // Delete expense mutation
    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiWithOffline.delete(`/expenses/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
            queryClient.invalidateQueries({ queryKey: ["expense-analytics", tripId] });
            toast.success("Expense deleted successfully!");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete expense");
        },
    });

    const onSubmit = (values: ExpenseFormValues) => {
        if (editingExpense) {
            updateExpenseMutation.mutate({ id: editingExpense.id, data: values });
        } else {
            createExpenseMutation.mutate(values);
        }
    };

    const handleEdit = (expense: any) => {
        setEditingExpense(expense);
        setValue("category", expense.category);
        setValue("description", expense.description);
        setValue("amount", parseFloat(expense.amount));
        setValue("date", new Date(expense.date));
        setValue("paidBy", expense.paidBy || "");
        setValue("notes", expense.notes || "");
        setShowAddExpense(true);
    };

    const handleDelete = (id: string) => {
        toast("Delete Expense?", {
            description: "Are you sure you want to delete this expense?",
            action: {
                label: "Delete",
                onClick: () => deleteExpenseMutation.mutate(id),
            },
            cancel: {
                label: "Cancel",
                onClick: () => { },
            },
        });
    };

    const getCategoryIcon = (category: string) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
        return cat ? cat.icon : MoreHorizontal;
    };

    const getCategoryColor = (category: string) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
        return cat ? cat.color : "#95A5A6";
    };

    const getCategoryLabel = (category: string) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
        return cat ? cat.label : category;
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
                <h1 className="text-xl font-bold text-black flex-1 text-center">Manage Expenses</h1>
                <div className="w-10" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block p-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-bold text-black">Manage Expenses</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and manage expenses for this trip</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-t-[30px] lg:rounded-none p-4 lg:p-6 shadow-2xl lg:shadow-none overflow-hidden flex flex-col">
                <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
                    {tripLoading || expensesLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="shrink-0">
                                <div className="mb-6 mt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-[#219653] rounded-br-full rounded-tr-full" />
                                        <h2 className="text-lg lg:text-xl font-bold text-black">Trip Expenses</h2>
                                    </div>
                                    <p className="text-xs lg:text-sm text-gray-400 font-medium ml-3">{trip?.title} • {trip?.destination}</p>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <Card className="p-4 border-none bg-gradient-to-br from-[#219653]/10 to-[#E2F1E8]/50 rounded-lg shadow-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#219653] flex items-center justify-center">
                                                <IndianRupee className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Total</p>
                                                <p className="text-lg lg:text-xl font-black text-[#219653]">₹{summary.total.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-4 border-none bg-gradient-to-br from-blue-500/10 to-blue-100/50 rounded-lg shadow-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Receipt className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Items</p>
                                                <p className="text-lg lg:text-xl font-black text-blue-600">{summary.count}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pb-24 pr-1 -mr-1">
                                <div className="space-y-6">
                                    {/* Category Breakdown */}
                                    {Object.keys(summary.byCategory).length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Breakdown by Category</h3>
                                            <Card className="p-4 border-none bg-[#219653]/5 rounded-lg shadow-none">
                                                <div className="space-y-4">
                                                    {Object.entries(summary.byCategory).map(([category, amount]: [string, any]) => {
                                                        const Icon = getCategoryIcon(category);
                                                        const color = getCategoryColor(category);
                                                        const percentage = ((amount / summary.total) * 100).toFixed(1);

                                                        return (
                                                            <div key={category} className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                                            style={{ backgroundColor: `${color}15` }}
                                                                        >
                                                                            <Icon className="w-4 h-4" style={{ color }} />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-700">{getCategoryLabel(category)}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xs font-black text-black">₹{amount.toLocaleString()}</span>
                                                                        <span className="text-[10px] text-gray-400 font-bold ml-1.5">{percentage}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                            backgroundColor: color
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Expenses List */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Transactions</h3>
                                            <Button
                                                onClick={() => {
                                                    setEditingExpense(null);
                                                    reset();
                                                    setShowAddExpense(true);
                                                }}
                                                className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-full h-8 px-3 text-xs font-bold"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                New Expense
                                            </Button>
                                        </div>

                                        {expenses.length === 0 ? (
                                            <Card className="p-12 border-2 border-dashed shadow-none border-gray-100 rounded-[16px] bg-gray-50/30">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                                        <Receipt className="w-8 h-8 text-gray-200" />
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-bold">No expenses yet</p>
                                                    <p className="text-xs text-gray-400 mt-1">Start tracking by adding your first expense</p>
                                                </div>
                                            </Card>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {expenses.map((expense: any) => {
                                                    const Icon = getCategoryIcon(expense.category);
                                                    const color = getCategoryColor(expense.category);

                                                    return (
                                                        <Card key={expense.id} className="p-3.5 rounded-[16px] bg-white border shadow-none ring-1 ring-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                                                            <div className="flex justify-between items-start gap-3">
                                                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                                                    <div
                                                                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 shadow-sm"
                                                                        style={{ backgroundColor: `${color}15` }}
                                                                    >
                                                                        <Icon className="w-5 h-5" style={{ color }} />
                                                                    </div>

                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 mb-1 text-[8px] font-bold uppercase tracking-widest">
                                                                            <span
                                                                                className="px-2.5 py-1 rounded-lg"
                                                                                style={{ backgroundColor: `${color}15`, color }}
                                                                            >
                                                                                {getCategoryLabel(expense.category)}
                                                                            </span>
                                                                            <span className="text-gray-400 font-black">
                                                                                • {format(new Date(expense.date), "dd MMM, yyyy")}
                                                                            </span>
                                                                        </div>
                                                                        <h4 className="text-sm  truncate group-hover:text-[#219653] transition-colors leading-tight">
                                                                            {expense.description}
                                                                        </h4>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col items-end shrink-0 gap-2">
                                                                    <div className="text-right">
                                                                        <span className="text-lg font-black text-black leading-none">
                                                                            ₹{parseFloat(expense.amount).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleEdit(expense)}
                                                                            className="h-8 w-8 text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-xl transition-all active:scale-90"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDelete(expense.id)}
                                                                            className="h-8 w-8 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-xl transition-all active:scale-90"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {(expense.paidBy || expense.notes) && (
                                                                <div className="mt-3.5 pt-3.5 border-t border-gray-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                                                                    {expense.paidBy && (
                                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-xl shrink-0 border border-gray-100/50">
                                                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                                                            <span className="text-[11px] font-bold text-gray-600 tracking-tight">{expense.paidBy}</span>
                                                                        </div>
                                                                    )}
                                                                    {expense.notes && (
                                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-xl min-w-0 flex-1 border border-gray-100/50">
                                                                            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                            <span className="text-[11px] font-medium text-gray-500 italic truncate tracking-tight">{expense.notes}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Expense Drawer */}
            <Drawer open={showAddExpense} onOpenChange={setShowAddExpense} direction={isDesktop ? "right" : "bottom"}>
                <DrawerContent className={cn(
                    "bg-white px-0 outline-none border-none",
                    isDesktop ? "h-full w-[600px] p-4" : "rounded-t-[40px] max-h-[96vh]"
                )}>
                    <div className="overflow-y-auto px-6 pb-32">
                        <DrawerHeader className="p-0 mb-6 text-center">
                            <DrawerTitle className="text-lg font-bold text-black my-1">
                                {editingExpense ? "Edit Expense" : "Add Expense"}
                            </DrawerTitle>
                        </DrawerHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Category</label>
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className={cn(
                                                "h-14 bg-gray-50/50 border-[#E2F1E8] rounded-xl",
                                                errors.category && "border-red-500"
                                            )}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_CATEGORIES.map((cat) => {
                                                    const Icon = cat.icon;
                                                    return (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                                                {cat.label}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.category && (
                                    <p className="text-xs text-red-500 ml-1">{errors.category.message}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Description</label>
                                <Input
                                    {...register("description")}
                                    placeholder="e.g., Hotel stay for 2 nights"
                                    className={cn(
                                        "h-14 bg-gray-50/50 border-[#E2F1E8] rounded-xl",
                                        errors.description && "border-red-500"
                                    )}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-500 ml-1">{errors.description.message}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Amount</label>
                                <div className="relative">
                                    <Input
                                        {...register("amount")}
                                        type="number"
                                        placeholder="0"
                                        className={cn(
                                            "h-14 pl-10 bg-gray-50/50 border-[#E2F1E8] rounded-xl",
                                            errors.amount && "border-red-500"
                                        )}
                                    />
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                </div>
                                {errors.amount && (
                                    <p className="text-xs text-red-500 ml-1">{errors.amount.message}</p>
                                )}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Date</label>
                                <Controller
                                    control={control}
                                    name="date"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-14 justify-start text-left font-normal bg-gray-50/50 border-[#E2F1E8] rounded-xl"
                                                >
                                                    <Calendar className="mr-2 h-4 w-4 text-[#219653]" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                    className="rounded-xl border-[#E2F1E8]"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>

                            {/* Paid By */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Paid By (Optional)</label>
                                <Input
                                    {...register("paidBy")}
                                    placeholder="e.g., John Doe"
                                    className="h-14 bg-gray-50/50 border-[#E2F1E8] rounded-xl"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-black ml-1">Notes (Optional)</label>
                                <Textarea
                                    {...register("notes")}
                                    placeholder="Add any additional notes..."
                                    className="min-h-[100px] bg-gray-50/50 border-[#E2F1E8] rounded-xl resize-none"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                                    className="w-full bg-[#219653] hover:bg-[#1A7B44] py-7 rounded-full text-white font-bold text-lg"
                                >
                                    {createExpenseMutation.isPending || updateExpenseMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            {editingExpense ? "Updating..." : "Adding..."}
                                        </>
                                    ) : (
                                        editingExpense ? "Update Expense" : "Add Expense"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default withAuth(ExpenseManagementPage);
