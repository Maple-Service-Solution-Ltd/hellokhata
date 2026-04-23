// Hello Khata - Payment Plans Page
// Main page for managing payment plans with installments

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, EmptyState } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react';
// import { authFetch } from '@/lib/api-client';s
import { useCurrency } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { PaymentPlanCard } from './PaymentPlanCard';
import { NewPaymentPlanModal } from './NewPaymentPlanModal';
import { InstallmentSchedule } from './InstallmentSchedule';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { 
  Party, 
  PaymentPlan, 
  PaymentPlanSummary, 
  Installment,
  PaymentPlanFormData,
  Sale,
} from '@/types';

interface PaymentPlanWithDetails extends PaymentPlan {
  party: { id: string; name: string; phone?: string | null };
  installments: Installment[];
  nextDueDate?: Date | null;
  nextDueAmount?: number;
  paidInstallments?: number;
}

export default function PaymentPlansPage() {
  const { formatCurrency } = useCurrency();
  
  // State
  const [plans, setPlans] = useState<PaymentPlanWithDetails[]>([]);
  const [summary, setSummary] = useState<PaymentPlanSummary | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanWithDetails | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, partiesRes, salesRes] = await Promise.all([
        authFetch(`/api/payment-plans?status=${statusFilter}&search=${searchTerm}`),
        authFetch('/api/parties'),
        authFetch('/api/sales'),
      ]);

      const plansData = await plansRes.json();
      const partiesData = await partiesRes.json();
      const salesData = await salesRes.json();

      if (plansData.success) {
        setPlans(plansData.data || []);
        setSummary(plansData.summary);
      }
      if (partiesData.success) {
        setParties(partiesData.data || []);
      }
      if (salesData.success) {
        setSales(salesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create new payment plan
  const handleCreatePlan = async (data: PaymentPlanFormData) => {
    const response = await authFetch('/api/payment-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create plan');
    }

    fetchData();
  };

  // Record payment
  const handleRecordPayment = async (
    planId: string,
    installmentId: string,
    amount: number,
    paidDate: string,
    notes?: string
  ) => {
    const response = await authFetch(`/api/payment-plans/${planId}/installments`, {
      method: 'POST',
      body: JSON.stringify({ installmentId, amount, paidDate, notes }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to record payment');
    }

    fetchData();
    if (selectedPlan?.id === planId) {
      // Refresh selected plan details
      fetchPlanDetails(planId);
    }
  };

  // Send reminder
  const handleSendReminder = async (planId: string, installmentId: string) => {
    const response = await authFetch(`/api/payment-plans/${planId}/installments`, {
      method: 'PATCH',
      body: JSON.stringify({ installmentId, action: 'send_reminder' }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to send reminder');
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId: string) => {
    const response = await authFetch(`/api/payment-plans/${planId}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete plan');
    }

    fetchData();
  };

  // Fetch plan details
  const fetchPlanDetails = async (planId: string) => {
    const response = await authFetch(`/api/payment-plans/${planId}`);
    const result = await response.json();
    
    if (result.success) {
      setSelectedPlan({
        ...result.data,
        installments: result.data.installments || [],
      });
      setDetailsModalOpen(true);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = searchTerm
      ? plan.party?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.party?.phone?.includes(searchTerm)
      : true;
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Outstanding',
      value: formatCurrency(summary?.totalOutstanding || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Overdue Amount',
      value: formatCurrency(summary?.overdueAmount || 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Due This Week',
      value: formatCurrency(summary?.dueThisWeek || 0),
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Active Plans',
      value: String(summary?.activePlans || 0),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Plans"
        subtitle="Manage installment plans and track payments"
        icon={CreditCard}
        action={{
          label: 'New Plan',
          onClick: () => setNewPlanModalOpen(true),
          icon: Plus,
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', stat.bgColor)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 truncate">{stat.title}</p>
                  <p className={cn('text-xl font-bold truncate', stat.color)}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Payment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment plans found"
              description="Create your first payment plan to start tracking installments"
              action={{
                label: 'Create Plan',
                onClick: () => setNewPlanModalOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {filteredPlans.map((plan) => (
                  <PaymentPlanCard
                    key={plan.id}
                    plan={plan}
                    onViewDetails={() => fetchPlanDetails(plan.id)}
                    onRecordPayment={() => {
                      setSelectedPlan(plan);
                      setDetailsModalOpen(true);
                    }}
                    onSendReminder={() => {
                      // Send reminder for next pending installment
                      const nextInstallment = plan.installments?.find(
                        (i) => i.status === 'pending' || i.status === 'overdue'
                      );
                      if (nextInstallment) {
                        handleSendReminder(plan.id, nextInstallment.id);
                      }
                    }}
                    onDelete={() => handleDeletePlan(plan.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* New Plan Modal */}
      <NewPaymentPlanModal
        isOpen={newPlanModalOpen}
        onClose={() => setNewPlanModalOpen(false)}
        onSubmit={handleCreatePlan}
        parties={parties}
        sales={sales.map((s) => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          total: s.total,
          partyId: s.partyId || '',
        }))}
      />

      {/* Plan Details Modal */}
      <DetailModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedPlan(null);
        }}
        title={selectedPlan?.party?.name || 'Payment Plan Details'}
        subtitle={`Total: ${formatCurrency(selectedPlan?.totalAmount || 0)}`}
        width="xl"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <DetailSection title="Plan Summary">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedPlan.totalAmount)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-600">Paid Amount</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(selectedPlan.paidAmount)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Remaining</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedPlan.remainingAmount)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-lg font-bold">
                    {selectedPlan.totalAmount > 0
                      ? Math.round((selectedPlan.paidAmount / selectedPlan.totalAmount) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </DetailSection>

            {/* Installment Schedule */}
            <DetailSection title="Installment Schedule">
              <InstallmentSchedule
                installments={selectedPlan.installments || []}
                totalAmount={selectedPlan.totalAmount}
                totalPaid={selectedPlan.paidAmount}
                onRecordPayment={(installmentId, amount, paidDate, notes) =>
                  handleRecordPayment(selectedPlan.id, installmentId, amount, paidDate, notes)
                }
                onSendReminder={(installmentId) =>
                  handleSendReminder(selectedPlan.id, installmentId)
                }
              />
            </DetailSection>

            {/* Linked Sale */}
            {selectedPlan.sale && (
              <DetailSection title="Linked Sale">
                <DetailRow
                  label="Invoice"
                  value={selectedPlan.sale.invoiceNo}
                  icon={<FileText className="h-5 w-5 text-blue-600" />}
                />
              </DetailSection>
            )}

            {/* Notes */}
            {selectedPlan.notes && (
              <DetailSection title="Notes">
                <p className="text-gray-600">{selectedPlan.notes}</p>
              </DetailSection>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
