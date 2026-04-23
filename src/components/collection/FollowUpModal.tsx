// Hello Khata - Follow Up Modal
// হ্যালো খাতা - ফলো-আপ মোডাল
// Log follow-up actions (call, SMS, WhatsApp, note)

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
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Phone,
  MessageSquare,
  MessageCircle,
  Mail,
  StickyNote,
  CalendarIcon,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  User,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

// Types
interface OverdueInvoice {
  id: string;
  invoiceNo: string;
  dueAmount: number;
  daysOverdue: number;
}

interface OverdueCustomer {
  id: string;
  name: string;
  nameBn?: string;
  phone?: string;
  email?: string;
  totalOutstanding: number;
  daysOverdue: number;
  overdueInvoices?: OverdueInvoice[];
}

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: OverdueCustomer;
  onRecorded: () => void;
}

// Follow-up types
const FOLLOW_UP_TYPES = [
  {
    id: 'call',
    name: 'ফোন কল',
    nameEn: 'Phone Call',
    icon: Phone,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    requiresPhone: true,
  },
  {
    id: 'sms',
    name: 'SMS',
    nameEn: 'SMS',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    requiresPhone: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameEn: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    requiresPhone: true,
  },
  {
    id: 'email',
    name: 'ইমেইল',
    nameEn: 'Email',
    icon: Mail,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    requiresEmail: true,
  },
  {
    id: 'note',
    name: 'নোট',
    nameEn: 'Note',
    icon: StickyNote,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    requiresPhone: false,
    requiresEmail: false,
  },
];

// Call outcomes
const CALL_OUTCOMES = [
  { id: 'reached', label: 'যোগাযোগ হয়েছে', labelEn: 'Reached' },
  { id: 'no_answer', label: 'ধরা হয়নি', labelEn: 'No Answer' },
  { id: 'busy', label: 'ব্যস্ত', labelEn: 'Busy' },
  { id: 'wrong_number', label: 'ভুল নম্বর', labelEn: 'Wrong Number' },
  { id: 'call_back', label: 'পরে কল করতে বলেছে', labelEn: 'Asked to Call Back' },
];

type FollowUpType = 'call' | 'sms' | 'whatsapp' | 'email' | 'note';

export function FollowUpModal({
  isOpen,
  onClose,
  customer,
  onRecorded,
}: FollowUpModalProps) {
  const { isBangla } = useAppTranslation();

  // State
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [notes, setNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState<string>('');
  const [setReminder, setSetReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>(addDays(new Date(), 3));
  const [saving, setSaving] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get selected follow-up type config
  const selectedType = FOLLOW_UP_TYPES.find((t) => t.id === followUpType);

  // Check if type is available for customer
  const isTypeAvailable = (type: typeof FOLLOW_UP_TYPES[0]) => {
    if (type.requiresPhone && !customer.phone) return false;
    if (type.requiresEmail && !customer.email) return false;
    return true;
  };

  // Handle external action (open WhatsApp, call, etc.)
  const handleExternalAction = () => {
    if (!customer.phone) return;

    switch (followUpType) {
      case 'call':
        window.open(`tel:${customer.phone}`, '_self');
        break;
      case 'whatsapp':
        const message = encodeURIComponent(
          `প্রিয় ${customer.nameBn || customer.name}, আপনার ${formatCurrency(customer.totalOutstanding)} টাকা বকি আছে। অনুগ্রহ করে পরিশোধ করুন।`
        );
        window.open(`https://wa.me/88${customer.phone}?text=${message}`, '_blank');
        break;
      case 'sms':
        const smsBody = encodeURIComponent(
          `প্রিয় ${customer.nameBn || customer.name}, আপনার ${formatCurrency(customer.totalOutstanding)} টাকা বকি আছে।`
        );
        window.open(`sms:+88${customer.phone}?body=${smsBody}`, '_self');
        break;
      case 'email':
        if (customer.email) {
          const subject = encodeURIComponent('বকেয়া পেমেন্ট অনুস্মারক');
          const body = encodeURIComponent(
            `প্রিয় ${customer.name},\n\nআপনার ${formatCurrency(customer.totalOutstanding)} টাকা বকি আছে। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন।\n\nধন্যবাদ।`
          );
          window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_self');
        }
        break;
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!notes.trim() && followUpType === 'note') {
      toast.error(isBangla ? 'নোট লিখুন' : 'Please enter a note');
      return;
    }

    if (followUpType === 'call' && !callOutcome) {
      toast.error(isBangla ? 'কলের ফলাফল নির্বাচন করুন' : 'Please select call outcome');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/collection/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          followUpType,
          notes,
          callOutcome: followUpType === 'call' ? callOutcome : undefined,
          reminderDate: setReminder ? reminderDate.toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to record follow-up');

      toast.success(isBangla ? 'ফলো-আপ রেকর্ড করা হয়েছে' : 'Follow-up recorded successfully');
      onRecorded();
    } catch (error) {
      console.error('Error recording follow-up:', error);
      toast.error(isBangla ? 'ফলো-আপ রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record follow-up');
    } finally {
      setSaving(false);
    }
  };

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNotes('');
      setCallOutcome('');
      setSetReminder(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType && (
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', selectedType.bgColor)}>
                <selectedType.icon className={cn('h-4 w-4', selectedType.color)} />
              </div>
            )}
            {isBangla ? 'ফলো-আপ রেকর্ড করুন' : 'Record Follow-up'}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4" />
              {customer.nameBn || customer.name}
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(customer.totalOutstanding)} {isBangla ? 'বকেয়া' : 'overdue'}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Follow-up Type Selection */}
          <div className="space-y-2">
            <Label>{isBangla ? 'ফলো-আপের ধরন' : 'Follow-up Type'}</Label>
            <RadioGroup
              value={followUpType}
              onValueChange={(v) => setFollowUpType(v as FollowUpType)}
              className="grid grid-cols-5 gap-2"
            >
              {FOLLOW_UP_TYPES.map((type) => {
                const available = isTypeAvailable(type);
                const Icon = type.icon;
                
                return (
                  <Tooltip key={type.id}>
                    <TooltipTrigger asChild>
                      <label
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-colors',
                          followUpType === type.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50',
                          !available && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <RadioGroupItem
                          value={type.id}
                          id={type.id}
                          className="sr-only"
                          disabled={!available}
                        />
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', type.bgColor)}>
                          <Icon className={cn('h-4 w-4', type.color)} />
                        </div>
                        <span className="text-xs text-center">
                          {isBangla ? type.name : type.nameEn}
                        </span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!available
                        ? isBangla
                          ? 'এই গ্রাহকের তথ্য নেই'
                          : 'Customer info not available'
                        : isBangla
                        ? type.name
                        : type.nameEn}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </RadioGroup>
          </div>

          {/* External Action Button (for call, WhatsApp, SMS, email) */}
          {followUpType !== 'note' && isTypeAvailable(selectedType!) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExternalAction}
            >
              {followUpType === 'call' && (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  {customer.phone}
                </>
              )}
              {followUpType === 'whatsapp' && (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {isBangla ? 'WhatsApp এ খুলুন' : 'Open WhatsApp'}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </>
              )}
              {followUpType === 'sms' && (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {isBangla ? 'SMS অ্যাপে খুলুন' : 'Open SMS App'}
                </>
              )}
              {followUpType === 'email' && (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {customer.email}
                </>
              )}
            </Button>
          )}

          {/* Call Outcome (only for calls) */}
          {followUpType === 'call' && (
            <div className="space-y-2">
              <Label>{isBangla ? 'কলের ফলাফল' : 'Call Outcome'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {CALL_OUTCOMES.map((outcome) => (
                  <label
                    key={outcome.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                      callOutcome === outcome.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="callOutcome"
                      value={outcome.id}
                      checked={callOutcome === outcome.id}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm">
                      {isBangla ? outcome.label : outcome.labelEn}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>
              {followUpType === 'note' 
                ? isBangla ? 'নোট' : 'Note'
                : isBangla ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)'}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                followUpType === 'call'
                  ? isBangla ? 'কল সম্পর্কে নোট লিখুন...' : 'Add notes about the call...'
                  : followUpType === 'note'
                  ? isBangla ? 'নোট লিখুন...' : 'Enter your note...'
                  : isBangla ? 'কোন নোট থাকলে লিখুন...' : 'Add any additional notes...'
              }
              rows={3}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Follow-up Reminder */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="cursor-pointer">
                {isBangla ? 'পরবর্তী ফলো-আপ রিমাইন্ডার' : 'Set Follow-up Reminder'}
              </Label>
            </div>
            <Switch checked={setReminder} onCheckedChange={setSetReminder} />
          </div>

          {setReminder && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !reminderDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reminderDate ? format(reminderDate, 'PPP') : <span>{isBangla ? 'তারিখ নির্বাচন করুন' : 'Pick a date'}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminderDate}
                  onSelect={(date) => date && setReminderDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
                {isBangla ? 'রেকর্ড করুন' : 'Record'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default FollowUpModal;
