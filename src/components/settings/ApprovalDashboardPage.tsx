// Hello Khata OS - Approval Dashboard Page
// হ্যালো খাতা - অনুমোদন ড্যাশবোর্ড

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, KPICard, Divider, EmptyState } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Eye,
  AlertCircle,
  FileText,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCurrency } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ApprovalRequest {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'adjustment' | 'transfer' | 'return';
  referenceNo: string;
  requestedBy: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  notes?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

// Fetch approval requests
async function fetchApprovals(): Promise<ApprovalRequest[]> {
  const res = await fetch('/api/approvals');
  if (!res.ok) throw new Error('Failed to fetch approvals');
  return res.json();
}

// Approve request
async function approveRequest(id: string): Promise<void> {
  const res = await fetch(`/api/approvals/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve');
}

// Reject request
async function rejectRequest(id: string, reason: string): Promise<void> {
  const res = await fetch(`/api/approvals/${id}/reject`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to reject');
}

export default function ApprovalDashboardPage() {
  const { isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: fetchApprovals,
  });

  const approveMutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: isBangla ? 'অনুমোদিত হয়েছে' : 'Approved successfully', variant: 'success' });
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error approving', variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: isBangla ? 'প্রত্যাখ্যাত হয়েছে' : 'Rejected successfully', variant: 'success' });
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error rejecting', variant: 'destructive' });
    }
  });

  // Calculate stats
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pendingCount = pendingApprovals.length;
  const totalPendingAmount = pendingApprovals.reduce((sum, a) => sum + a.amount, 0);
  const approvedToday = approvals.filter(a => {
    const today = new Date().toDateString();
    return a.status === 'approved' && new Date(a.createdAt).toDateString() === today;
  }).length;
  const rejectedToday = approvals.filter(a => {
    const today = new Date().toDateString();
    return a.status === 'rejected' && new Date(a.createdAt).toDateString() === today;
  }).length;

  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || approval.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      toast({ title: isBangla ? 'কারণ লিখুন' : 'Please provide a reason', variant: 'warning' });
      return;
    }
    rejectMutation.mutate({ id, reason: rejectReason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            {isBangla ? 'অনুমোদন ড্যাশবোর্ড' : 'Approval Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'অপেক্ষমান অনুমোদনের অনুরোধ' : 'Pending approval requests'}
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" size="lg" className="gap-1">
            <AlertCircle className="h-4 w-4" />
            {pendingCount} {isBangla ? 'অপেক্ষমান' : 'pending'}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending"
          titleBn="অপেক্ষমান"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
        <KPICard
          title="Pending Amount"
          titleBn="অপেক্ষমান পরিমাণ"
          value={totalPendingAmount}
          prefix="৳"
          icon={<FileText className="h-5 w-5" />}
          iconColor="indigo"
          isBangla={isBangla}
        />
        <KPICard
          title="Approved Today"
          titleBn="আজ অনুমোদিত"
          value={approvedToday}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="success"
          isBangla={isBangla}
        />
        <KPICard
          title="Rejected Today"
          titleBn="আজ প্রত্যাখ্যাত"
          value={rejectedToday}
          icon={<XCircle className="h-5 w-5" />}
          iconColor="destructive"
          isBangla={isBangla}
        />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="default">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'রেফারেন্স বা ব্যক্তি খুঁজুন...' : 'Search reference or person...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={isBangla ? 'ধরন' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
              <SelectItem value="sale">{isBangla ? 'বিক্রি' : 'Sale'}</SelectItem>
              <SelectItem value="purchase">{isBangla ? 'ক্রয়' : 'Purchase'}</SelectItem>
              <SelectItem value="expense">{isBangla ? 'খরচ' : 'Expense'}</SelectItem>
              <SelectItem value="adjustment">{isBangla ? 'সমন্বয়' : 'Adjustment'}</SelectItem>
              <SelectItem value="transfer">{isBangla ? 'স্থানান্তর' : 'Transfer'}</SelectItem>
              <SelectItem value="return">{isBangla ? 'রিটার্ন' : 'Return'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Approval Requests List */}
      <Card variant="elevated" padding="none">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base">
            {isBangla ? 'অনুমোদনের অনুরোধ' : 'Approval Requests'}
          </CardTitle>
        </CardHeader>
        <Divider />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-8 w-8" />}
              title={isBangla ? 'কোনো অনুরোধ নেই' : 'No requests found'}
              description={isBangla ? 'সব অনুরোধ পরিচালনা করা হয়েছে' : 'All requests have been handled'}
              isBangla={isBangla}
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border-subtle">
                {filteredApprovals.map((request, index) => (
                  <ApprovalRow
                    key={request.id}
                    request={request}
                    isBangla={isBangla}
                    index={index}
                    onView={() => setSelectedRequest(request)}
                    onApprove={() => handleApprove(request.id)}
                    onReject={() => { setSelectedRequest(request); setRejectReason(''); }}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Approval Detail Modal */}
      <DetailModal
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setRejectReason(''); }}
        title={selectedRequest?.referenceNo || ''}
        subtitle={isBangla ? 'অনুমোদনের বিবরণ' : 'Approval Details'}
        width="lg"
      >
        {selectedRequest && (
          <>
            <DetailSection title={isBangla ? 'অনুরোধের তথ্য' : 'Request Information'}>
              <DetailRow
                label={isBangla ? 'ধরন' : 'Type'}
                value={<TypeBadge type={selectedRequest.type} isBangla={isBangla} />}
              />
              <DetailRow
                label={isBangla ? 'পরিমাণ' : 'Amount'}
                value={
                  <span className="text-xl font-bold">
                    {formatCurrency(selectedRequest.amount)}
                  </span>
                }
              />
              <DetailRow
                label={isBangla ? 'অনুরোধকারী' : 'Requested By'}
                value={selectedRequest.requestedBy}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={<StatusBadge status={selectedRequest.status} isBangla={isBangla} />}
              />
              <DetailRow
                label={isBangla ? 'তারিখ' : 'Date'}
                value={new Date(selectedRequest.createdAt).toLocaleString()}
              />
              {selectedRequest.reason && (
                <DetailRow
                  label={isBangla ? 'কারণ' : 'Reason'}
                  value={selectedRequest.reason}
                />
              )}
              {selectedRequest.notes && (
                <DetailRow
                  label={isBangla ? 'নোট' : 'Notes'}
                  value={selectedRequest.notes}
                />
              )}
            </DetailSection>

            {selectedRequest.status === 'pending' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {isBangla ? 'প্রত্যাখ্যানের কারণ (ঐচ্ছিক)' : 'Rejection Reason (optional)'}
                  </label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={isBangla ? 'কারণ লিখুন...' : 'Enter reason...'}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    className="flex-1 gap-2"
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                    {isBangla ? 'অনুমোদন' : 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                    {isBangla ? 'প্রত্যাখ্যান' : 'Reject'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DetailModal>
    </div>
  );
}

// Type Badge
function TypeBadge({ type, isBangla }: { type: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'default' | 'warning' | 'indigo' | 'success' | 'destructive' | 'emerald'; icon: React.ReactNode }> = {
    sale: { label: 'Sale', labelBn: 'বিক্রি', variant: 'success', icon: <ShoppingCart className="h-3 w-3" /> },
    purchase: { label: 'Purchase', labelBn: 'ক্রয়', variant: 'indigo', icon: <FileText className="h-3 w-3" /> },
    expense: { label: 'Expense', labelBn: 'খরচ', variant: 'destructive', icon: <Receipt className="h-3 w-3" /> },
    adjustment: { label: 'Adjustment', labelBn: 'সমন্বয়', variant: 'warning', icon: <ArrowLeftRight className="h-3 w-3" /> },
    transfer: { label: 'Transfer', labelBn: 'স্থানান্তর', variant: 'indigo', icon: <ArrowLeftRight className="h-3 w-3" /> },
    return: { label: 'Return', labelBn: 'রিটার্ন', variant: 'warning', icon: <ArrowLeftRight className="h-3 w-3" /> },
  };
  const { label, labelBn, variant, icon } = config[type] || config.sale;
  return <Badge variant={variant} className="gap-1">{icon}{isBangla ? labelBn : label}</Badge>;
}

// Status Badge
function StatusBadge({ status, isBangla }: { status: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'warning' | 'success' | 'destructive' }> = {
    pending: { label: 'Pending', labelBn: 'অপেক্ষমান', variant: 'warning' },
    approved: { label: 'Approved', labelBn: 'অনুমোদিত', variant: 'success' },
    rejected: { label: 'Rejected', labelBn: 'প্রত্যাখ্যাত', variant: 'destructive' },
  };
  const { label, labelBn, variant } = config[status] || config.pending;
  return <Badge variant={variant}>{isBangla ? labelBn : label}</Badge>;
}

// Approval Row Component
function ApprovalRow({ 
  request, 
  isBangla, 
  index, 
  onView, 
  onApprove, 
  onReject 
}: { 
  request: ApprovalRequest; 
  isBangla: boolean; 
  index: number; 
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { formatCurrency } = useCurrency();

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1" onClick={onView}>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          request.status === 'pending' ? "bg-warning-subtle" :
          request.status === 'approved' ? "bg-success-subtle" :
          "bg-destructive-subtle"
        )}>
          {request.status === 'pending' ? (
            <Clock className="h-5 w-5 text-warning" />
          ) : request.status === 'approved' ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{request.referenceNo}</p>
            <TypeBadge type={request.type} isBangla={isBangla} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'অনুরোধকারী' : 'By'}: {request.requestedBy} • {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-bold text-foreground">
            {formatCurrency(request.amount)}
          </p>
          <StatusBadge status={request.status} isBangla={isBangla} />
        </div>
        {request.status === 'pending' && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
