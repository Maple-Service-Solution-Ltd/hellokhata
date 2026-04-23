// Hello Khata - Overdue Customer Card
// হ্যালো খাতা - বকেয়া গ্রাহক কার্ড
// Display customer overdue details with actions

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone,
  MessageSquare,
  MessageCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  MapPin,
  Clock,
  DollarSign,
  CreditCard,
  StickyNote,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Plus,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface OverdueInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  daysOverdue: number;
}

interface AgingBreakdown {
  bucket1to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90Plus: number;
}

interface ContactHistory {
  id: string;
  type: 'sms' | 'whatsapp' | 'call' | 'note' | 'promise';
  date: string;
  message?: string;
  status?: string;
  promiseAmount?: number;
  promiseDate?: string;
}

interface OverdueCustomer {
  id: string;
  name: string;
  nameBn?: string;
  phone?: string;
  address?: string;
  totalOutstanding: number;
  daysOverdue: number;
  lastPaymentDate?: string;
  lastContactDate?: string;
  promiseStatus?: 'pending' | 'kept' | 'broken' | null;
  promiseAmount?: number;
  promiseDate?: string;
  agingBreakdown: AgingBreakdown;
  overdueInvoices: OverdueInvoice[];
  contactHistory: ContactHistory[];
}

interface OverdueCustomerCardProps {
  customer: OverdueCustomer;
  onSendReminder: () => void;
  onRecordPromise: () => void;
  onRefresh: () => void;
}

export function OverdueCustomerCard({
  customer,
  onSendReminder,
  onRecordPromise,
  onRefresh,
}: OverdueCustomerCardProps) {
  const { isBangla } = useAppTranslation();
  const { business } = useSessionStore();

  const [expanded, setExpanded] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [markPromiseDialogOpen, setMarkPromiseDialogOpen] = useState(false);
  const [markAsKept, setMarkAsKept] = useState(true);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get days overdue color
  const getDaysOverdueColor = (days: number): string => {
    if (days > 90) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (days > 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    if (days > 30) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
  };

  // Get promise status badge
  const getPromiseStatusBadge = () => {
    if (!customer.promiseStatus) return null;

    const statusConfig = {
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        label: isBangla ? 'প্রতিশ্রুতি মুলতুবি' : 'Promise Pending',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20',
      },
      kept: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: isBangla ? 'প্রতিশ্রুতি রক্ষিত' : 'Promise Kept',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20',
      },
      broken: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: isBangla ? 'প্রতিশ্রুতি ভঙ্গ' : 'Promise Broken',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20',
      },
    };

    const config = statusConfig[customer.promiseStatus];
    const Icon = config.icon;

    return (
      <Badge className={cn('gap-1', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error(isBangla ? 'নোট লিখুন' : 'Please enter a note');
      return;
    }

    try {
      const response = await fetch('/api/collection/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          note: noteText,
        }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      toast.success(isBangla ? 'নোট যোগ করা হয়েছে' : 'Note added successfully');
      setNoteModalOpen(false);
      setNoteText('');
      onRefresh();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(isBangla ? 'নোট যোগ করতে সমস্যা হয়েছে' : 'Failed to add note');
    }
  };

  // Handle record payment
  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error(isBangla ? 'সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }

    try {
      const response = await fetch('/api/collection/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          amount,
          note: paymentNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast.success(isBangla ? 'পেমেন্ট রেকর্ড করা হয়েছে' : 'Payment recorded successfully');
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNote('');
      onRefresh();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(isBangla ? 'পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record payment');
    }
  };

  // Handle mark promise status
  const handleMarkPromise = async () => {
    try {
      const response = await fetch('/api/collection/promise/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: customer.id,
          status: markAsKept ? 'kept' : 'broken',
        }),
      });

      if (!response.ok) throw new Error('Failed to update promise status');

      toast.success(
        markAsKept
          ? isBangla
            ? 'প্রতিশ্রুতি রক্ষিত হিসেবে চিহ্নিত'
            : 'Marked as promise kept'
          : isBangla
          ? 'প্রতিশ্রুতি ভঙ্গ হিসেবে চিহ্নিত'
          : 'Marked as promise broken'
      );
      setMarkPromiseDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating promise status:', error);
      toast.error(isBangla ? 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে' : 'Failed to update status');
    }
  };

  // Get contact history icon
  const getContactHistoryIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'call':
        return <Phone className="h-4 w-4 text-purple-500" />;
      case 'note':
        return <StickyNote className="h-4 w-4 text-amber-500" />;
      case 'promise':
        return <Calendar className="h-4 w-4 text-emerald-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  // Render aging breakdown
  const renderAgingBreakdown = () => (
    <div className="grid grid-cols-4 gap-2 mt-3">
      {[
        { label: '1-30', value: customer.agingBreakdown.bucket1to30, color: 'bg-yellow-500' },
        { label: '31-60', value: customer.agingBreakdown.bucket31to60, color: 'bg-amber-500' },
        { label: '61-90', value: customer.agingBreakdown.bucket61to90, color: 'bg-orange-500' },
        { label: '90+', value: customer.agingBreakdown.bucket90Plus, color: 'bg-red-500' },
      ].map((bucket) => (
        <div
          key={bucket.label}
          className="text-center p-2 rounded-lg bg-muted/50"
        >
          <p className="text-xs text-muted-foreground">{bucket.label}</p>
          <p className="text-sm font-semibold">{formatCurrency(bucket.value)}</p>
          {bucket.value > 0 && (
            <div className={cn('h-1 rounded-full mt-1', bucket.color)} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Main Content */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                <span className="text-lg font-bold text-primary">
                  {(customer.nameBn || customer.name).charAt(0)}
                </span>
              </div>

              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">
                    {isBangla && customer.nameBn ? customer.nameBn : customer.name}
                  </CardTitle>
                  {getPromiseStatusBadge()}
                </div>

                {/* Phone & Address */}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </a>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Amount & Actions */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(customer.totalOutstanding)}
                </p>
                <Badge className={cn('mt-1', getDaysOverdueColor(customer.daysOverdue))}>
                  <Clock className="h-3 w-3 mr-1" />
                  {customer.daysOverdue} {isBangla ? 'দিন বকেয়া' : 'days overdue'}
                </Badge>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                {customer.phone && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a href={`tel:${customer.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={onSendReminder}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onSendReminder}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {isBangla ? 'SMS পাঠান' : 'Send SMS Reminder'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSendReminder}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {isBangla ? 'WhatsApp পাঠান' : 'Send WhatsApp'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRecordPromise}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {isBangla ? 'প্রতিশ্রুতি রেকর্ড' : 'Record Promise'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPaymentModalOpen(true)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isBangla ? 'পেমেন্ট রেকর্ড' : 'Record Payment'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setNoteModalOpen(true)}>
                      <StickyNote className="h-4 w-4 mr-2" />
                      {isBangla ? 'নোট যোগ করুন' : 'Add Note'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setHistoryModalOpen(true)}>
                      <History className="h-4 w-4 mr-2" />
                      {isBangla ? 'ইতিহাস দেখুন' : 'View History'}
                    </DropdownMenuItem>
                    {customer.promiseStatus === 'pending' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setMarkAsKept(true);
                          setMarkPromiseDialogOpen(true);
                        }}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                          {isBangla ? 'প্রতিশ্রুতি রক্ষিত' : 'Mark Promise Kept'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setMarkAsKept(false);
                          setMarkPromiseDialogOpen(true);
                        }}>
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                          {isBangla ? 'প্রতিশ্রুতি ভঙ্গ' : 'Mark Promise Broken'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Collapsible Content */}
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-6 py-2 text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isBangla ? 'বিস্তারিত দেখুন' : 'View Details'}
              </span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 border-t">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* Aging Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    {isBangla ? 'বকেয়া বিভাজন' : 'Outstanding Breakdown'}
                  </h4>
                  {renderAgingBreakdown()}

                  {/* Promise Info */}
                  {customer.promiseAmount && customer.promiseDate && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {isBangla ? 'প্রতিশ্রুতি' : 'Promise to Pay'}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(customer.promiseAmount)}
                        </span>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                          {isBangla ? 'তারিখ:' : 'by'} {formatDate(customer.promiseDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overdue Invoices */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    {isBangla ? 'বকেয়া চালান' : 'Overdue Invoices'} ({customer.overdueInvoices.length})
                  </h4>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {customer.overdueInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                        >
                          <div>
                            <p className="font-medium">{invoice.invoiceNo}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(invoice.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              {formatCurrency(invoice.dueAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.daysOverdue} {isBangla ? 'দিন' : 'days'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Last Activity */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                {customer.lastPaymentDate && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {isBangla ? 'শেষ পেমেন্ট:' : 'Last Payment:'} {formatDate(customer.lastPaymentDate)}
                  </span>
                )}
                {customer.lastContactDate && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {isBangla ? 'শেষ যোগাযোগ:' : 'Last Contact:'} {formatDate(customer.lastContactDate)}
                  </span>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {isBangla ? 'যোগাযোগের ইতিহাস' : 'Contact History'}
            </DialogTitle>
            <DialogDescription>
              {customer.nameBn || customer.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {customer.contactHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isBangla ? 'কোন ইতিহাস নেই' : 'No history available'}
                </div>
              ) : (
                customer.contactHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="shrink-0 mt-0.5">
                      {getContactHistoryIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">
                          {item.type === 'sms' ? 'SMS' : 
                           item.type === 'whatsapp' ? 'WhatsApp' :
                           item.type === 'promise' ? (isBangla ? 'প্রতিশ্রুতি' : 'Promise') :
                           item.type === 'note' ? (isBangla ? 'নোট' : 'Note') :
                           item.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date)}
                        </p>
                      </div>
                      {item.message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.message}
                        </p>
                      )}
                      {item.promiseAmount && (
                        <p className="text-sm text-emerald-600 mt-1">
                          {formatCurrency(item.promiseAmount)} - {item.promiseDate && formatDate(item.promiseDate)}
                        </p>
                      )}
                      {item.status && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              {isBangla ? 'নোট যোগ করুন' : 'Add Note'}
            </DialogTitle>
            <DialogDescription>
              {customer.nameBn || customer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isBangla ? 'নোট' : 'Note'}</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={isBangla ? 'নোট লিখুন...' : 'Enter note...'}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button onClick={handleAddNote}>
                {isBangla ? 'সংরক্ষণ করুন' : 'Save Note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {isBangla ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payment'}
            </DialogTitle>
            <DialogDescription>
              {isBangla ? 'বকেয়া:' : 'Outstanding:'} {formatCurrency(customer.totalOutstanding)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isBangla ? 'পরিমাণ' : 'Amount'}</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={isBangla ? 'পরিমাণ লিখুন' : 'Enter amount'}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{isBangla ? 'নোট' : 'Note (Optional)'}</Label>
              <Textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder={isBangla ? 'নোট লিখুন...' : 'Enter note...'}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button onClick={handleRecordPayment}>
                {isBangla ? 'পেমেন্ট রেকর্ড' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Promise Dialog */}
      <AlertDialog open={markPromiseDialogOpen} onOpenChange={setMarkPromiseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {markAsKept
                ? isBangla
                  ? 'প্রতিশ্রুতি রক্ষিত হিসেবে চিহ্নিত করুন?'
                  : 'Mark Promise as Kept?'
                : isBangla
                ? 'প্রতিশ্রুতি ভঙ্গ হিসেবে চিহ্নিত করুন?'
                : 'Mark Promise as Broken?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {markAsKept
                ? isBangla
                  ? 'গ্রাহক তাদের প্রতিশ্রুতি অনুযায়ী পেমেন্ট করেছে।'
                  : 'The customer has paid according to their promise.'
                : isBangla
                ? 'গ্রাহক তাদের প্রতিশ্রুতি অনুযায়ী পেমেন্ট করেনি।'
                : 'The customer has not paid according to their promise.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkPromise}
              className={cn(markAsKept ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700')}
            >
              {markAsKept
                ? isBangla
                  ? 'রক্ষিত হিসেবে চিহ্নিত করুন'
                  : 'Mark as Kept'
                : isBangla
                ? 'ভঙ্গ হিসেবে চিহ্নিত করুন'
                : 'Mark as Broken'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default OverdueCustomerCard;
