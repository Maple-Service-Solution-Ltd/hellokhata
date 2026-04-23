// Hello Khata OS - Returns Management Page
// হ্যালো খাতা - রিটার্ন ম্যানেজমেন্ট

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  RotateCcw,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowLeftRight,
  ChevronRight,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useGetSalesReturns, useGetPurchaseReturns } from '@/hooks/api/useReturns';
import { useToast } from '@/hooks/use-toast';

interface ReturnItem {
  id: string;
  returnId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason?: string;
}

interface SaleReturn {
  id: string;
  invoiceNo: string;
  originalSaleId: string;
  partyId: string;
  partyName: string;
  items: ReturnItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  reason?: string;
  creditNoteId?: string;
  createdAt: string;
}

interface PurchaseReturn {
  id: string;
  returnNo: string;
  originalPurchaseId: string;
  partyId: string;
  partyName: string;
  items: ReturnItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  reason?: string;
  debitNoteId?: string;
  createdAt: string;
}

// Sales Returns Management Page Component
export default function ReturnsPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | PurchaseReturn | null>(null);

  const { data: salesReturnsData, isLoading: loadingSales } = useGetSalesReturns();
  const { data: purchaseReturnsData, isLoading: loadingPurchases } = useGetPurchaseReturns();

  const salesReturns = salesReturnsData?.data || [];
  const purchaseReturns = purchaseReturnsData?.data || [];

  // Calculate stats
  const totalSalesReturns = salesReturns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPurchaseReturns = purchaseReturns.reduce((sum, r) => sum + r.totalAmount, 0);
  const pendingSalesReturns = salesReturns.filter(r => r.status === 'pending').length;
  const pendingPurchaseReturns = purchaseReturns.filter(r => r.status === 'pending').length;

  // Filter returns
  const filteredSalesReturns = salesReturns.filter(r => {
    const matchesSearch = r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPurchaseReturns = purchaseReturns.filter(r => {
    const matchesSearch = r.returnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isLoading = loadingSales || loadingPurchases;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            {isBangla ? 'রিটার্ন ব্যবস্থাপনা' : 'Returns Management'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'সকল বিক্রি ও ক্রয় রিটার্ন' : 'All sales and purchase returns'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Sales Returns"
          titleBn="বিক্রি রিটার্ন"
          value={totalSalesReturns}
          prefix="৳"
          trend={{ value: 2.5, isPositive: false }}
          icon={<TrendingDown className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
        <KPICard
          title="Purchase Returns"
          titleBn="ক্রয় রিটার্ন"
          value={totalPurchaseReturns}
          prefix="৳"
          trend={{ value: 1.8, isPositive: true }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="emerald"
          isBangla={isBangla}
        />
        <KPICard
          title="Pending Sales"
          titleBn="অপেক্ষমান বিক্রি"
          value={pendingSalesReturns}
          icon={<Clock className="h-5 w-5" />}
          iconColor="indigo"
          isBangla={isBangla}
        />
        <KPICard
          title="Pending Purchases"
          titleBn="অপেক্ষমান ক্রয়"
          value={pendingPurchaseReturns}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sales' | 'purchases')}>
        <TabsList className="grid w-full   grid-cols-2">
          <TabsTrigger value="sales" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            {isBangla ? 'বিক্রি রিটার্ন' : 'Sales Returns'}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {isBangla ? 'ক্রয় রিটার্ন' : 'Purchase Returns'}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card variant="elevated" padding="default" className="mt-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isBangla ? 'ইনভয়েস বা পার্টি খুঁজুন...' : 'Search invoice or party...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={isBangla ? 'স্ট্যাটাস' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
                <SelectItem value="pending">{isBangla ? 'অপেক্ষমান' : 'Pending'}</SelectItem>
                <SelectItem value="approved">{isBangla ? 'অনুমোদিত' : 'Approved'}</SelectItem>
                <SelectItem value="completed">{isBangla ? 'সম্পন্ন' : 'Completed'}</SelectItem>
                <SelectItem value="rejected">{isBangla ? 'প্রত্যাখ্যাত' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Sales Returns Tab */}
        <TabsContent value="sales">
          <Card variant="elevated" padding="none">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-base">
                {isBangla ? 'বিক্রি রিটার্নের তালিকা' : 'Sales Returns List'}
              </CardTitle>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : filteredSalesReturns.length === 0 ? (
                <EmptyState
                  icon={<RotateCcw className="h-8 w-8" />}
                  title={isBangla ? 'কোনো বিক্রি রিটার্ন নেই' : 'No sales returns found'}
                  description={isBangla ? 'কোনো বিক্রি রিটার্ন নেই' : 'No sales returns to display'}
                  isBangla={isBangla}
                />
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border-subtle">
                    {filteredSalesReturns.map((ret, index) => (
                      <ReturnRow
                        key={ret.id}
                        ret={ret}
                        type="sale"
                        isBangla={isBangla}
                        index={index}
                        onView={() => setSelectedReturn(ret)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Returns Tab */}
        <TabsContent value="purchases">
          <Card variant="elevated" padding="none">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-base">
                {isBangla ? 'ক্রয় রিটার্নের তালিকা' : 'Purchase Returns List'}
              </CardTitle>
            </CardHeader>
            <Divider />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : filteredPurchaseReturns.length === 0 ? (
                <EmptyState
                  icon={<RotateCcw className="h-8 w-8" />}
                  title={isBangla ? 'কোনো ক্রয় রিটার্ন নেই' : 'No purchase returns found'}
                  description={isBangla ? 'কোনো ক্রয় রিটার্ন নেই' : 'No purchase returns to display'}
                  isBangla={isBangla}
                />
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border-subtle">
                    {filteredPurchaseReturns.map((ret, index) => (
                      <ReturnRow
                        key={ret.id}
                        ret={ret}
                        type="purchase"
                        isBangla={isBangla}
                        index={index}
                        onView={() => setSelectedReturn(ret)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Detail Modal */}
      <DetailModal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={'invoiceNo' in (selectedReturn || {}) ? (selectedReturn as SaleReturn)?.invoiceNo : (selectedReturn as PurchaseReturn)?.returnNo}
        subtitle={isBangla ? 'রিটার্নের বিবরণ' : 'Return Details'}
        width="lg"
      >
        {selectedReturn && (
          <>
            <DetailSection title={isBangla ? 'রিটার্নের তথ্য' : 'Return Information'}>
              <DetailRow
                label={isBangla ? 'মোট পরিমাণ' : 'Total Amount'}
                value={
                  <span className="text-xl font-bold text-warning">
                    {formatCurrency(selectedReturn.totalAmount)}
                  </span>
                }
              />
              <DetailRow
                label={isBangla ? 'পার্টি' : 'Party'}
                value={selectedReturn.partyName}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={
                  <StatusBadge status={selectedReturn.status} isBangla={isBangla} />
                }
              />
              <DetailRow
                label={isBangla ? 'তারিখ' : 'Date'}
                value={new Date(selectedReturn.createdAt).toLocaleString()}
              />
              {selectedReturn.reason && (
                <DetailRow
                  label={isBangla ? 'কারণ' : 'Reason'}
                  value={selectedReturn.reason}
                />
              )}
            </DetailSection>

            <DetailSection title={isBangla ? 'পণ্য তালিকা' : 'Items'}>
              {selectedReturn.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <RotateCcw className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-foreground shrink-0">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </DetailSection>
          </>
        )}
      </DetailModal>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, isBangla }: { status: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'warning' | 'success' | 'indigo' | 'destructive' }> = {
    pending: { label: 'Pending', labelBn: 'অপেক্ষমান', variant: 'warning' },
    approved: { label: 'Approved', labelBn: 'অনুমোদিত', variant: 'indigo' },
    completed: { label: 'Completed', labelBn: 'সম্পন্ন', variant: 'success' },
    rejected: { label: 'Rejected', labelBn: 'প্রত্যাখ্যাত', variant: 'destructive' },
  };
  const { label, labelBn, variant } = config[status] || config.pending;
  return <Badge variant={variant}>{isBangla ? labelBn : label}</Badge>;
}

// Return Row Component
function ReturnRow({ 
  ret, 
  type, 
  isBangla, 
  index, 
  onView 
}: { 
  ret: SaleReturn | PurchaseReturn; 
  type: 'sale' | 'purchase';
  isBangla: boolean; 
  index: number; 
  onView: () => void;
}) {
  const { formatCurrency } = useCurrency();
  const invoiceNo = type === 'sale' ? (ret as SaleReturn).invoiceNo : (ret as PurchaseReturn).returnNo;
  
  const statusConfig: Record<string, { label: string; labelBn: string; variant: 'warning' | 'success' | 'indigo' | 'destructive'; icon: React.ReactNode }> = {
    pending: { label: 'Pending', labelBn: 'অপেক্ষমান', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
    approved: { label: 'Approved', labelBn: 'অনুমোদিত', variant: 'indigo', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { label: 'Completed', labelBn: 'সম্পন্ন', variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
    rejected: { label: 'Rejected', labelBn: 'প্রত্যাখ্যাত', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  };

  const status = statusConfig[ret.status] || statusConfig.pending;

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onView}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          type === 'sale' ? "bg-warning-subtle" : "bg-emerald-subtle"
        )}>
          <RotateCcw className={cn("h-5 w-5", type === 'sale' ? "text-warning" : "text-emerald")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{invoiceNo}</p>
            <Badge variant={status.variant} size="sm" className="gap-1">
              {status.icon}
              {isBangla ? status.labelBn : status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ret.partyName} • {ret.items.length} {isBangla ? 'পণ্য' : 'items'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-bold text-foreground text-lg">
            {formatCurrency(ret.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
