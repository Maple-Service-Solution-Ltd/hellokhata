// Hello Khata - New Payment Plan Modal
// Create a new payment plan with automatic installment calculation

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Party, PaymentFrequency, PaymentPlanFormData } from "@/types";
import { useParties } from "@/hooks/api/useParties";
import { useGetSales } from "@/hooks/api/useSales";
import { useCreatePaymentPlans } from "@/hooks/api/usePayments";
import { toast } from "sonner";
// import { toast } from "@/hooks/use-toast";

interface NewPaymentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const frequencyOptions: {
  value: PaymentFrequency;
  label: string;
  days: number;
}[] = [
    { value: "weekly", label: "Weekly", days: 7 },
    { value: "bi_weekly", label: "Bi-Weekly", days: 14 },
    { value: "monthly", label: "Monthly", days: 30 },
  ];

export function NewPaymentPlanModal({
  isOpen,
  onClose,
  // onSubmit,
  isLoading = false,
}: NewPaymentPlanModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PaymentPlanFormData>>({
    totalAmount: 0,
    totalInstallments: 1,
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
  });

  const [searchParty, setSearchParty] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyPopoverOpen, setPartyPopoverOpen] = useState(false);
  const [salePopoverOpen, setSalePopoverOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: partiesData, isLoading: partiesLoading } = useParties({ type: 'customer', search: searchParty });
  const parties = partiesData?.data || []

  const { data: salesData, isLoading: salesLoading } = useGetSales();
  const sales = salesData?.data;
  // Filter sales for selected party
  const partySales = sales?.filter((s) => s.partyId === formData.partyId);
  const { mutate: createPaymentPlans, isPending: isSubmitting } = useCreatePaymentPlans()

  // Calculate installment preview
  const installmentAmount =
    formData.totalAmount && formData.totalInstallments
      ? Math.ceil((formData.totalAmount / formData.totalInstallments) * 100) /
      100
      : 0;

  const lastInstallmentAmount =
    formData.totalAmount && formData.totalInstallments
      ? formData.totalAmount -
      installmentAmount * (formData.totalInstallments - 1)
      : 0;

  // Generate preview due dates
  const generatePreviewDates = () => {
    if (
      !formData.startDate ||
      !formData.totalInstallments ||
      !formData.frequency
    )
      return [];

    const dates: Date[] = [];
    const start = new Date(formData.startDate);
    const frequency = frequencyOptions.find(
      (f) => f.value === formData.frequency,
    );

    for (let i = 0; i < formData.totalInstallments; i++) {
      const dueDate = new Date(start);

      switch (formData.frequency) {
        case "weekly":
          dueDate.setDate(start.getDate() + i * 7);
          break;
        case "bi_weekly":
          dueDate.setDate(start.getDate() + i * 14);
          break;
        case "monthly":
          dueDate.setMonth(start.getMonth() + i);
          break;
      }

      dates.push(dueDate);
    }

    return dates;
  };

  const previewDates = generatePreviewDates();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        totalAmount: 0,
        totalInstallments: 1,
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
      });
      setSelectedParty(null);
      setErrors({});
    }
  }, [isOpen]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.partyId) {
        newErrors.partyId = "Please select a customer";
      }
    } else if (stepNumber === 2) {
      if (!formData.totalAmount || formData.totalAmount <= 0) {
        newErrors.totalAmount = "Amount must be greater than 0";
      }
      if (!formData.totalInstallments || formData.totalInstallments < 1) {
        newErrors.totalInstallments = "At least 1 installment required";
      }
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    createPaymentPlans(formData, {
      onSuccess: () => {
        toast.success('Payment plan created successfully!')
        onClose(true)
      }
    })

  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Payment Plan</DialogTitle>
          <DialogDescription>
            Set up an installment payment plan for a customer
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                s === step
                  ? "bg-emerald-500"
                  : s < step
                    ? "bg-emerald-200"
                    : "bg-gray-200",
              )}
            />
          ))}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Step 1: Customer Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Customer *</Label>
                  <Popover
                    open={partyPopoverOpen}
                    onOpenChange={setPartyPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          errors.partyId && "border-red-500",
                        )}
                      >
                        {selectedParty ? (
                          <span className="truncate">
                            {selectedParty.name}
                            {selectedParty.phone && ` (${selectedParty.phone})`}
                          </span>
                        ) : (
                          "Select a customer..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput onValueChange={value => setSearchParty(value)} className="w-full" placeholder="Search customers..." />
                        <CommandList>
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            {parties
                              .map((party) => (
                                <CommandItem
                                  key={party.id}
                                  value={party.name}
                                  onSelect={() => {
                                    setSelectedParty(party);
                                    setFormData((prev) => ({
                                      ...prev,
                                      partyId: party.id,
                                    }));
                                    setPartyPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedParty?.id === party.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span className="truncate">{party.name}</span>
                                  {party.phone && (
                                    <span className="ml-2 text-gray-500 text-sm">
                                      {party.phone}
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.partyId && (
                    <p className="text-sm text-red-500">{errors.partyId}</p>
                  )}
                </div>

                {/* Optional Sale Link */}
                <div className="space-y-2">
                  <Label>Link to Sale (Optional)</Label>
                  <Popover
                    open={salePopoverOpen}
                    onOpenChange={setSalePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={!formData.partyId}
                      >
                        {formData.saleId
                          ? sales?.find((s) => s.id === formData.saleId)
                            ?.invoiceNo
                          : "Select a sale..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search sales..." />
                        <CommandList>
                          <CommandEmpty>No sales found.</CommandEmpty>
                          <CommandGroup>
                            {sales?.map((sale) => (
                              <CommandItem
                                key={sale.id}
                                value={sale.invoiceNo}
                                onSelect={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    saleId: sale.id,
                                    totalAmount: sale.total,
                                  }));
                                  setSalePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.saleId === sale.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span>{sale.invoiceNo}</span>
                                <span className="ml-2 text-gray-500">
                                  {formatCurrency(sale.total)}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Step 2: Plan Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        totalAmount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className={cn(errors.totalAmount && "border-red-500")}
                  />
                  {errors.totalAmount && (
                    <p className="text-sm text-red-500">{errors.totalAmount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments">Number of Installments *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min={1}
                    max={24}
                    value={formData.totalInstallments || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        totalInstallments: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={cn(errors.totalInstallments && "border-red-500")}
                  />
                  {errors.totalInstallments && (
                    <p className="text-sm text-red-500">
                      {errors.totalInstallments}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: PaymentFrequency) =>
                      setFormData((prev) => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                          errors.startDate && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(new Date(formData.startDate), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.startDate
                            ? new Date(formData.startDate)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setFormData((prev) => ({
                              ...prev,
                              startDate: date.toISOString().split("T")[0],
                            }));
                          }
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any notes..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium">{selectedParty?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(formData.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Installments</span>
                    <span className="font-medium">
                      {formData.totalInstallments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frequency</span>
                    <Badge>
                      {
                        frequencyOptions.find(
                          (f) => f.value === formData.frequency,
                        )?.label
                      }
                    </Badge>
                  </div>
                </div>

                {/* Installment Amounts */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Installment Amounts</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Each installment</span>
                      <span className="font-medium">
                        {formatCurrency(installmentAmount)}
                      </span>
                    </div>
                    {lastInstallmentAmount !== installmentAmount && (
                      <div className="flex justify-between text-gray-500">
                        <span>Last installment</span>
                        <span>{formatCurrency(lastInstallmentAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Due Dates Preview */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Due Dates Preview</h4>
                  <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                    {previewDates.map((date, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Installment {index + 1}</span>
                        <span className="text-gray-500">
                          {format(date, "dd MMM yyyy")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="ml-auto">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Payment Plan"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewPaymentPlanModal;
