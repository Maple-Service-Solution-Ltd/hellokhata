// Hello Khata - Send Reminder Modal
// হ্যালো খাতা - রিমাইন্ডার পাঠানোর মোডাল
// Send SMS/WhatsApp reminders to overdue customers

'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  MessageCircle,
  Clock,
  CalendarIcon,
  CheckCircle2,
  Send,
  History,
  Edit3,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Types
interface OverdueCustomer {
  id: string;
  name: string;
  nameBn?: string;
  phone?: string;
  totalOutstanding: number;
  daysOverdue: number;
  overdueInvoices: Array<{
    id: string;
    invoiceNo: string;
    dueAmount: number;
  }>;
  contactHistory: Array<{
    id: string;
    type: string;
    date: string;
    message?: string;
    status?: string;
  }>;
}

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: OverdueCustomer;
  onSent: () => void;
}

// Message templates in Bangla
const MESSAGE_TEMPLATES = [
  {
    id: 'friendly',
    name: 'বন্ধুত্বপূর্ণ অনুস্মারক',
    nameEn: 'Friendly Reminder',
    template: 'প্রিয় {name}, আপনার {amount} টাকা বকি আছে। অনুগ্রহ করে শীঘ্রই পরিশোধ করুন। ধন্যবাদ।',
  },
  {
    id: 'reminder',
    name: 'সাধারণ অনুস্মারক',
    nameEn: 'Standard Reminder',
    template: 'প্রিয় {name}, আপনার {amount} টাকা {days} দিন ধরে বকি আছে। অনুগ্রহ করে পরিশোধ করুন।',
  },
  {
    id: 'urgent',
    name: 'জরুরি অনুস্মারক',
    nameEn: 'Urgent Reminder',
    template: 'প্রিয় {name}, আপনার {amount} টাকা {days} দিন ধরে বকি আছে। অনুগ্রহ করে আজই পরিশোধ করুন। আমাদের যোগাযোগ করুন।',
  },
  {
    id: 'final',
    name: 'চূড়ান্ত নোটিশ',
    nameEn: 'Final Notice',
    template: 'প্রিয় {name}, আপনার {amount} টাকা দীর্ঘদিন ধরে বকি আছে। অনুগ্রহ করে ৩ দিনের মধ্যে পরিশোধ করুন, অন্যথায় আইনি ব্যবস্থা নেওয়া হবে।',
  },
  {
    id: 'custom',
    name: 'কাস্টম মেসেজ',
    nameEn: 'Custom Message',
    template: '',
  },
];

type ReminderChannel = 'sms' | 'whatsapp';

export function SendReminderModal({
  isOpen,
  onClose,
  customer,
  onSent,
}: SendReminderModalProps) {
  const { isBangla } = useAppTranslation();

  // State
  const [channel, setChannel] = useState<ReminderChannel>('sms');
  const [selectedTemplate, setSelectedTemplate] = useState('friendly');
  const [message, setMessage] = useState('');
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Replace template variables
  const replaceTemplateVars = (template: string) => {
    return template
      .replace('{name}', customer.nameBn || customer.name)
      .replace('{amount}', formatCurrency(customer.totalOutstanding))
      .replace('{days}', customer.daysOverdue.toString());
  };

  // Update message when template or customer changes
  useEffect(() => {
    const template = MESSAGE_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (template && template.id !== 'custom') {
      setMessage(replaceTemplateVars(template.template));
    }
  }, [selectedTemplate, customer]);

  // Handle send
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(isBangla ? 'মেসেজ লিখুন' : 'Please enter a message');
      return;
    }

    if (scheduleLater && !scheduledDate) {
      toast.error(isBangla ? 'তারিখ নির্বাচন করুন' : 'Please select a date');
      return;
    }

    if (!customer.phone) {
      toast.error(isBangla ? 'ফোন নম্বর নেই' : 'No phone number available');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/collection/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          reminderType: channel,
          message,
          scheduledAt: scheduleLater && scheduledDate ? scheduledDate.toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reminder');

      toast.success(
        scheduleLater
          ? isBangla
            ? 'রিমাইন্ডার নির্ধারিত হয়েছে'
            : 'Reminder scheduled successfully'
          : isBangla
          ? 'রিমাইন্ডার পাঠানো হয়েছে'
          : 'Reminder sent successfully'
      );
      onSent();
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(isBangla ? 'রিমাইন্ডার পাঠাতে সমস্যা হয়েছে' : 'Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  // Get recent reminders from contact history
  const recentReminders = customer.contactHistory
    .filter((h) => h.type === 'sms' || h.type === 'whatsapp')
    .slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === 'sms' ? (
              <MessageSquare className="h-5 w-5 text-blue-500" />
            ) : (
              <MessageCircle className="h-5 w-5 text-green-500" />
            )}
            {isBangla ? 'রিমাইন্ডার পাঠান' : 'Send Reminder'}
          </DialogTitle>
          <DialogDescription>
            {customer.nameBn || customer.name} • {formatCurrency(customer.totalOutstanding)} {isBangla ? 'টাকা বকেয়া' : 'overdue'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Selection */}
          <div className="space-y-2">
            <Label>{isBangla ? 'চ্যানেল নির্বাচন করুন' : 'Select Channel'}</Label>
            <RadioGroup
              value={channel}
              onValueChange={(v) => setChannel(v as ReminderChannel)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  WhatsApp
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>{isBangla ? 'মেসেজ টেমপ্লেট' : 'Message Template'}</Label>
            <ScrollArea className="h-[120px]">
              <RadioGroup
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="space-y-2"
              >
                {MESSAGE_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      'flex items-start space-x-3 p-2 rounded-lg border transition-colors',
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={template.id}
                        className="cursor-pointer font-medium"
                      >
                        {isBangla ? template.name : template.nameEn}
                      </Label>
                      {template.id !== 'custom' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {replaceTemplateVars(template.template)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </div>

          {/* Message Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{isBangla ? 'মেসেজ' : 'Message'}</Label>
              <Badge variant="secondary" className="text-xs">
                <Edit3 className="h-3 w-3 mr-1" />
                {isBangla ? 'সম্পাদনাযোগ্য' : 'Editable'}
              </Badge>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isBangla ? 'মেসেজ লিখুন...' : 'Type your message...'}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} {isBangla ? 'অক্ষর' : 'characters'}
            </p>
          </div>

          {/* Schedule Option */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="cursor-pointer">
                {isBangla ? 'পরে পাঠানোর জন্য নির্ধারণ করুন' : 'Schedule for later'}
              </Label>
            </div>
            <Switch
              checked={scheduleLater}
              onCheckedChange={setScheduleLater}
            />
          </div>

          {/* Date Picker */}
          {scheduleLater && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !scheduledDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? (
                    format(scheduledDate, 'PPP')
                  ) : (
                    <span>{isBangla ? 'তারিখ নির্বাচন করুন' : 'Pick a date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Reminder History */}
          {recentReminders.length > 0 && (
            <>
              <Separator />
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {isBangla ? 'সাম্প্রতিক রিমাইন্ডার' : 'Recent Reminders'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      showHistory && 'rotate-180'
                    )}
                  />
                </Button>
                {showHistory && (
                  <ScrollArea className="h-[100px] mt-2">
                    <div className="space-y-2">
                      {recentReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
                        >
                          {reminder.type === 'sms' ? (
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                          )}
                          <span className="flex-1 truncate">
                            {reminder.message || (isBangla ? 'মেসেজ পাঠানো হয়েছে' : 'Message sent')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reminder.date).toLocaleDateString('bn-BD')}
                          </span>
                          {reminder.status && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                reminder.status === 'sent' && 'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {reminder.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isBangla ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button onClick={handleSend} disabled={sending || !customer.phone}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isBangla ? 'পাঠানো হচ্ছে...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {scheduleLater
                  ? isBangla
                    ? 'নির্ধারণ করুন'
                    : 'Schedule'
                  : isBangla
                  ? 'পাঠান'
                  : 'Send'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SendReminderModal;
