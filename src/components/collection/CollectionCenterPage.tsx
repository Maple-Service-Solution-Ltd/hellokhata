// Hello Khata - Collection Center Page
// হ্যালো খাতা - কালেকশন সেন্টার পেজ
// Comprehensive credit control dashboard for overdue payments

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PageContainer } from '@/components/common/PageContainer';
import { CollectionStats } from './CollectionStats';
import { OverdueCustomersList } from './OverdueCustomersList';
import { OverdueCustomerCard } from './OverdueCustomerCard';
import { SendReminderModal } from './SendReminderModal';
import { PromiseToPayModal } from './PromiseToPayModal';
import { FollowUpModal } from './FollowUpModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Wallet,
  RefreshCw,
  Settings,
  Bell,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';
import { useSessionStore } from '@/stores/sessionStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
export interface OverdueInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  daysOverdue: number;
}

export interface AgingBreakdown {
  bucket1to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90Plus: number;
}

export interface ContactHistory {
  id: string;
  type: 'sms' | 'whatsapp' | 'call' | 'note' | 'promise';
  date: string;
  message?: string;
  status?: string;
  promiseAmount?: number;
  promiseDate?: string;
}

export interface OverdueCustomer {
  id: string;
  name: string;
  nameBn?: string;
  phone?: string;
  email?: string;
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

export interface CollectionSummary {
  totalOverdue: number;
  customersOverdue: number;
  dueThisWeek: number;
  promisedAmount: number;
  collectionRate?: number;
  averageDaysToCollect?: number;
  promisesKept?: number;
  promisesBroken?: number;
  promisesPending?: number;
}

export function CollectionCenterPage() {
  const { t, isBangla } = useAppTranslation();
  const { business } = useSessionStore();

  // State
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<OverdueCustomer[]>([]);
  const [summary, setSummary] = useState<CollectionSummary>({
    totalOverdue: 0,
    customersOverdue: 0,
    dueThisWeek: 0,
    promisedAmount: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<OverdueCustomer | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [promiseModalOpen, setPromiseModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch overdue customers
  const fetchOverdueCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collection/overdue');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCustomers(data.customers || []);
      setSummary(data.summary || summary);
    } catch (error) {
      console.error('Error fetching overdue customers:', error);
      toast.error(isBangla ? 'ডেটা লোড করতে সমস্যা হয়েছে' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [isBangla, summary]);

  useEffect(() => {
    fetchOverdueCustomers();
  }, [fetchOverdueCustomers]);

  // Handle send reminder
  const handleSendReminder = (customer: OverdueCustomer) => {
    setSelectedCustomer(customer);
    setReminderModalOpen(true);
  };

  // Handle record promise
  const handleRecordPromise = (customer: OverdueCustomer) => {
    setSelectedCustomer(customer);
    setPromiseModalOpen(true);
  };

  // Handle follow-up
  const handleFollowUp = (customer: OverdueCustomer) => {
    setSelectedCustomer(customer);
    setFollowUpModalOpen(true);
  };

  // Handle customer selection
  const handleSelectCustomer = (customer: OverdueCustomer) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
  };

  // Handle reminder sent
  const handleReminderSent = () => {
    setReminderModalOpen(false);
    fetchOverdueCustomers();
    toast.success(isBangla ? 'রিমাইন্ডার পাঠানো হয়েছে' : 'Reminder sent successfully');
  };

  // Handle promise recorded
  const handlePromiseRecorded = () => {
    setPromiseModalOpen(false);
    fetchOverdueCustomers();
    toast.success(isBangla ? 'প্রতিশ্রুতি রেকর্ড করা হয়েছে' : 'Promise recorded successfully');
  };

  // Handle follow-up recorded
  const handleFollowUpRecorded = () => {
    setFollowUpModalOpen(false);
    fetchOverdueCustomers();
    toast.success(isBangla ? 'ফলো-আপ রেকর্ড করা হয়েছে' : 'Follow-up recorded successfully');
  };

  // Filter customers by tab
  const getFilteredCustomers = () => {
    switch (activeTab) {
      case 'promises':
        return customers.filter((c) => c.promiseStatus === 'pending');
      case 'critical':
        return customers.filter((c) => c.daysOverdue > 60);
      case 'recent':
        return customers.filter((c) => c.daysOverdue <= 30);
      default:
        return customers;
    }
  };

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Collection Center"
        titleBn="কালেকশন সেন্টার"
        subtitle="Manage overdue payments and customer follow-ups"
        subtitleBn="বকেয়া পেমেন্ট এবং গ্রাহক ফলো-আপ পরিচালনা করুন"
        icon={Wallet}
        action={{
          label: isBangla ? 'রিফ্রেশ করুন' : 'Refresh',
          onClick: fetchOverdueCustomers,
          icon: RefreshCw,
        }}
      />

      {/* Stats */}
      <div className="mb-6">
        <CollectionStats stats={summary} isLoading={loading} />
      </div>

      {/* Quick Actions Tabs */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {isBangla ? 'সব বকেয়া' : 'All Overdue'}
              <Badge variant="secondary" className="ml-1">{customers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="promises" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {isBangla ? 'প্রতিশ্রুতি' : 'Promises'}
              <Badge variant="secondary" className="ml-1">
                {customers.filter((c) => c.promiseStatus === 'pending').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              {isBangla ? 'জরুরি' : 'Critical'}
              <Badge variant="secondary" className="ml-1">
                {customers.filter((c) => c.daysOverdue > 60).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {isBangla ? 'নতুন' : 'Recent'}
              <Badge variant="secondary" className="ml-1">
                {customers.filter((c) => c.daysOverdue <= 30).length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Customer List */}
      <OverdueCustomersList
        customers={getFilteredCustomers()}
        isLoading={loading}
        onSendReminder={handleSendReminder}
        onRecordPromise={handleRecordPromise}
        onSelectCustomer={handleSelectCustomer}
        onRefresh={fetchOverdueCustomers}
      />

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <Dialog open={customerDetailOpen} onOpenChange={setCustomerDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isBangla && selectedCustomer.nameBn ? selectedCustomer.nameBn : selectedCustomer.name}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="destructive">
                    ৳{selectedCustomer.totalOutstanding.toLocaleString('bn-BD')} {isBangla ? 'বকেয়া' : 'overdue'}
                  </Badge>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedCustomer.daysOverdue} {isBangla ? 'দিন' : 'days'}
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <OverdueCustomerCard
                customer={selectedCustomer}
                onSendReminder={() => {
                  setCustomerDetailOpen(false);
                  handleSendReminder(selectedCustomer);
                }}
                onRecordPromise={() => {
                  setCustomerDetailOpen(false);
                  handleRecordPromise(selectedCustomer);
                }}
                onRefresh={() => {
                  fetchOverdueCustomers();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Reminder Modal */}
      {selectedCustomer && (
        <SendReminderModal
          isOpen={reminderModalOpen}
          onClose={() => setReminderModalOpen(false)}
          customer={selectedCustomer}
          onSent={handleReminderSent}
        />
      )}

      {/* Promise to Pay Modal */}
      {selectedCustomer && (
        <PromiseToPayModal
          isOpen={promiseModalOpen}
          onClose={() => setPromiseModalOpen(false)}
          customer={selectedCustomer}
          onRecorded={handlePromiseRecorded}
        />
      )}

      {/* Follow-up Modal */}
      {selectedCustomer && (
        <FollowUpModal
          isOpen={followUpModalOpen}
          onClose={() => setFollowUpModalOpen(false)}
          customer={selectedCustomer}
          onRecorded={handleFollowUpRecorded}
        />
      )}
    </>
  );
}

export default CollectionCenterPage;
