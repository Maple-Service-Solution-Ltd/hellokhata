// Hello Khata - Promise to Pay Modal
// হ্যালো খাতা - প্রতিশ্রুতি মোডাল
// Record promise to pay from customers

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  CalendarDays,
  Clock,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

// Types
interface OverdueCustomer {
  id: string;
  name: string;
  nameBn?: string;
  phone?: string;
  totalOutstanding: number;
  daysOverdue: number;
  promiseStatus?: 'pending' | 'kept' | 'broken' | null;
  promiseAmount?: number;
  promiseDate?: string;
}

interface PromiseToPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: OverdueCustomer;
  onRecorded: () => void;
}

// Quick date options
const QUICK_DATE_OPTIONS = [
  { label: 'আজ', labelEn: 'Today', days: 0 },
  { label: 'আগামীকাল', labelEn: 'Tomorrow', days: 1 },
  { label: '৩ দিন পর', labelEn: 'In 3 days', days: 3 },
  { label: '১ সপ্তাহ পর', labelEn: 'In 1 week', days: 7 },
  { label: '২ সপ্তাহ পর', labelEn: 'In 2 weeks', days: 14 },
  { label: '১ মাস পর', labelEn: 'In 1 month', days: 30 },
];

export function PromiseToPayModal({
  isOpen,
  onClose,
  customer,
  onRecorded,
}: PromiseToPayModalProps) {
  const { isBangla } = useAppTranslation();

  // State
  const [promiseAmount, setPromiseAmount] = useState(
    customer.totalOutstanding.toString()
  );
  const [promiseDate, setPromiseDate] = useState<Date>(addDays(new Date(), 3));
  const [notes, setNotes] = useState('');
  const [setReminder, setSetReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState(1);
  const [saving, setSaving] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle quick date select
  const handleQuickDate = (days: number) => {
    setPromiseDate(addDays(new Date(), days));
  };

  // Handle save
  const handleSave = async () => {
    const amount = parseFloat(promiseAmount);
    if (!amount || amount <= 0) {
      toast.error(isBangla ? 'সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }

    if (!promiseDate) {
      toast.error(isBangla ? 'তারিখ নির্বাচন করুন' : 'Please select a date');
      return;
    }

    if (promiseDate < new Date()) {
      toast.error(isBangla ? 'অতীতের তারিখ নির্বাচন করা যাবে না' : 'Cannot select a past date');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/collection/promise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          promiseAmount: amount,
          promiseDate: promiseDate.toISOString(),
          notes,
          setReminder,
          reminderDays: setReminder ? reminderDays : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to record promise');

      toast.success(isBangla ? 'প্রতিশ্রুতি রেকর্ড করা হয়েছে' : 'Promise recorded successfully');
      onRecorded();
    } catch (error) {
      console.error('Error recording promise:', error);
      toast.error(isBangla ? 'প্রতিশ্রুতি রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record promise');
    } finally {
      setSaving(false);
    }
  };

  // Check if there's an existing promise
  const hasExistingPromise = customer.promiseStatus === 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-500" />
            {isBangla ? 'প্রতিশ্রুতি রেকর্ড করুন' : 'Record Promise to Pay'}
          </DialogTitle>
          <DialogDescription>
            {customer.nameBn || customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Outstanding Amount */}
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">
                {isBangla ? 'মোট বকেয়া' : 'Total Outstanding'}
              </span>
              <span className="text-lg font-bold text-red-700 dark:text-red-300">
                ৳{formatCurrency(customer.totalOutstanding)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
              <Clock className="h-3 w-3" />
              {customer.daysOverdue} {isBangla ? 'দিন অতিবাহিত' : 'days overdue'}
            </div>
          </div>

          {/* Existing Promise Warning */}
          {hasExistingPromise && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    {isBangla ? 'বিদ্যমান প্রতিশ্রুতি' : 'Existing Promise'}
                  </p>
                  <p className="text-amber-600 dark:text-amber-400 mt-1">
                    {customer.promiseAmount && (
                      <>
                        ৳{formatCurrency(customer.promiseAmount)} - {customer.promiseDate && format(new Date(customer.promiseDate), 'PPP')}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Promise Amount */}
          <div className="space-y-2">
            <Label>{isBangla ? 'প্রতিশ্রুতির পরিমাণ' : 'Promise Amount'}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={promiseAmount}
                onChange={(e) => setPromiseAmount(e.target.value)}
                placeholder={isBangla ? 'পরিমাণ লিখুন' : 'Enter amount'}
                className="pl-10"
              />
            </div>
            {parseFloat(promiseAmount) < customer.totalOutstanding && (
              <p className="text-xs text-amber-600">
                {isBangla ? 'আংশিক পেমেন্টের প্রতিশ্রুতি' : 'Partial payment promise'}
              </p>
            )}
          </div>

          {/* Promise Date */}
          <div className="space-y-2">
            <Label>{isBangla ? 'প্রতিশ্রুতির তারিখ' : 'Promise Date'}</Label>
            
            {/* Quick Date Selection */}
            <div className="flex flex-wrap gap-2">
              {QUICK_DATE_OPTIONS.map((option) => {
                const isSelected = 
                  promiseDate && 
                  format(promiseDate, 'yyyy-MM-dd') === format(addDays(new Date(), option.days), 'yyyy-MM-dd');
                return (
                  <Button
                    key={option.days}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleQuickDate(option.days)}
                    className="h-8"
                  >
                    {isBangla ? option.label : option.labelEn}
                  </Button>
                );
              })}
            </div>

            {/* Custom Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !promiseDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {promiseDate ? (
                    format(promiseDate, 'PPP')
                  ) : (
                    <span>{isBangla ? 'তারিখ নির্বাচন করুন' : 'Pick a date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={promiseDate}
                  onSelect={(date) => date && setPromiseDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{isBangla ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)'}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBangla ? 'কোন নোট থাকলে লিখুন...' : 'Add any notes...'}
              rows={2}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Follow-up Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="cursor-pointer">
                  {isBangla ? 'ফলো-আপ রিমাইন্ডার সেট করুন' : 'Set Follow-up Reminder'}
                </Label>
              </div>
              <Switch checked={setReminder} onCheckedChange={setSetReminder} />
            </div>

            {setReminder && (
              <div className="flex items-center gap-2 pl-6">
                <span className="text-sm text-muted-foreground">
                  {isBangla ? 'তারিখের' : 'On the'}{' '}
                </span>
                <Input
                  type="number"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                  min={0}
                  max={30}
                />
                <span className="text-sm text-muted-foreground">
                  {isBangla ? 'দিন আগে' : 'days before'}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isBangla ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isBangla ? 'প্রতিশ্রুতি সংরক্ষণ করুন' : 'Save Promise'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PromiseToPayModal;
