'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, KPICard, Divider, EmptyState } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
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
  Package,
  Plus,
  Search,
  Calendar,
  TrendingDown,
  FileText,
  BarChart3,
  ChevronRight,
  DollarSign,
  Truck,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  ShoppingCart,
  MessageSquare,
  User,
  Building,
  CreditCard,
  Store,
} from 'lucide-react';
import { usePurchases } from '@/hooks/queries';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useQuery } from '@tanstack/react-query';
import type { Purchase } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetPurchases } from '@/hooks/api/usePurchases';

// Purchase Order interface
interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  partyId: string;
  partyName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'partial' | 'received' | 'cancelled';
  expectedDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Fetch purchase orders
async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const res = await fetch('/api/purchase-orders');
  if (!res.ok) return [];
  return res.json();
}

export default function PurchasesPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { navigateTo } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'purchases' | 'orders'>('purchases');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const { data: purchases = [], isLoading: purchasesLoading } = useGetPurchases();
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: fetchPurchaseOrders,
  });

  console.log(purchases)
  const router = useRouter()
  const isLoading = purchasesLoading || ordersLoading;

  // Calculate purchase stats
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPurchases = purchases
    .filter(p => new Date(p.createdAt) >= startOfMonth)
    .reduce((sum, p) => sum + p.total, 0);
  const purchaseCount = purchases.length;

  // Calculate order stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => ['draft', 'submitted', 'approved'].includes(o.status)).length;
  const pendingOrderValue = orders
    .filter(o => ['submitted', 'approved'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = (purchase.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.items.some((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              {isBangla ? 'ক্রয় ব্যবস্থাপনা' : 'Purchases'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
              {isBangla ? 'ক্রয় ও অর্ডার পরিচালনা' : 'Manage purchases & orders'}
            </p>
          </div>
          <Link href="/purchases/new" className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 flex gap-2 shrink-0 p-2 rounded-lg">
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">{isBangla ? 'নতুন ক্রয়' : 'New Purchase'}</span>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Purchases"
            titleBn="মোট ক্রয়"
            value={totalPurchases}
            prefix="৳"
            trend={{ value: 8.5, isPositive: false }}
            icon={<ShoppingCart className="h-5 w-5" />}
            iconColor="warning"
            isBangla={isBangla}
          />
          <KPICard
            title="This Month"
            titleBn="এই মাসে"
            value={monthPurchases}
            prefix="৳"
            trend={{ value: 5.2, isPositive: false }}
            icon={<BarChart3 className="h-5 w-5" />}
            iconColor="indigo"
            isBangla={isBangla}
          />
          <KPICard
            title="Pending Orders"
            titleBn="অপেক্ষমান অর্ডার"
            value={pendingOrders}
            trend={{ value: 3, isPositive: true }}
            icon={<Clock className="h-5 w-5" />}
            iconColor="warning"
            isBangla={isBangla}
          />
          <KPICard
            title="Pending Value"
            titleBn="অপেক্ষমান মূল্য"
            value={pendingOrderValue}
            prefix="৳"
            icon={<AlertCircle className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purchases' | 'orders')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchases" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {isBangla ? 'ক্রয়' : 'Purchases'} ({purchaseCount})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <FileText className="h-4 w-4" />
              {isBangla ? 'অর্ডার' : 'Orders'} ({totalOrders})
            </TabsTrigger>
          </TabsList>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-4 space-y-4">
            {/* Filters */}
            <Card variant="elevated" padding="default">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={isBangla ? 'ইনভয়েস বা পণ্য খুঁজুন...' : 'Search invoice or item...'}
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
                    <SelectItem value="received">{isBangla ? 'গৃহীত' : 'Received'}</SelectItem>
                    <SelectItem value="pending">{isBangla ? 'অপেক্ষমান' : 'Pending'}</SelectItem>
                    <SelectItem value="partial">{isBangla ? 'আংশিক' : 'Partial'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span className="whitespace-nowrap">{isBangla ? 'তারিখ' : 'Date'}</span>
                </Button>
              </div>
            </Card>
            
            <Card variant="elevated" padding="none">
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="text-base whitespace-nowrap">
                  {isBangla ? 'ক্রয়ের ইতিহাস' : 'Purchase History'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : filteredPurchases.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title={isBangla ? 'কোনো ক্রয় নেই' : 'No purchases found'}
                    description={isBangla ? 'নতুন ক্রয় শুরু করুন' : 'Start a new purchase'}
                    isBangla={isBangla}
                    action={
                      <Button onClick={() => router.push('/purchases/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="whitespace-nowrap">{isBangla ? 'স্টক যোগ' : 'Add Stock'}</span>
                      </Button>
                    }
                  />
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y divide-border-subtle">
                      {filteredPurchases.map((purchase, index) => (
                        <PurchaseRow
                          key={purchase.id}
                          purchase={purchase}
                          isBangla={isBangla}
                          index={index}
                          onView={() => setSelectedPurchase(purchase)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-4">
            {/* Filters */}
            <Card variant="elevated" padding="default">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={isBangla ? 'অর্ডার বা সরবরাহকারী খুঁজুন...' : 'Search order or supplier...'}
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
                    <SelectItem value="draft">{isBangla ? 'খসড়া' : 'Draft'}</SelectItem>
                    <SelectItem value="submitted">{isBangla ? 'জমা দেওয়া' : 'Submitted'}</SelectItem>
                    <SelectItem value="approved">{isBangla ? 'অনুমোদিত' : 'Approved'}</SelectItem>
                    <SelectItem value="partial">{isBangla ? 'আংশিক' : 'Partial'}</SelectItem>
                    <SelectItem value="received">{isBangla ? 'গৃহীত' : 'Received'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 shrink-0">
                  <Calendar className="h-4 w-4" />
                  <span className="whitespace-nowrap">{isBangla ? 'তারিখ' : 'Date'}</span>
                </Button>
              </div>
            </Card>
            
            <Card variant="elevated" padding="none">
              <CardHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {isBangla ? 'ক্রয় অর্ডারের তালিকা' : 'Purchase Orders List'}
                </CardTitle>
                <Button size="sm" onClick={() => navigateTo('purchases-new')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {isBangla ? 'নতুন অর্ডার' : 'New Order'}
                </Button>
              </CardHeader>
              <Divider />
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-8 w-8" />}
                    title={isBangla ? 'কোনো অর্ডার নেই' : 'No orders found'}
                    description={isBangla ? 'নতুন ক্রয় অর্ডার তৈরি করুন' : 'Create a new purchase order'}
                    isBangla={isBangla}
                    action={
                      <Button onClick={() => navigateTo('purchases-new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        {isBangla ? 'নতুন অর্ডার' : 'New Order'}
                      </Button>
                    }
                  />
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y divide-border-subtle">
                      {filteredOrders.map((order, index) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          isBangla={isBangla}
                          index={index}
                          onView={() => setSelectedPO(order)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase Detail Modal */}
      <DetailModal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={selectedPurchase?.invoiceNo || ''}
        subtitle={isBangla ? 'ক্রয়ের বিবরণ' : 'Purchase Details'}
        width="lg"
      >
        {selectedPurchase && (
          <>
            <DetailSection title={isBangla ? 'ক্রয়ের তথ্য' : 'Purchase Information'}>
              <DetailRow
                label={isBangla ? 'মোট পরিমাণ' : 'Total Amount'}
                value={
                  <span className="text-xl font-bold text-warning">
                    {formatCurrency(selectedPurchase.total)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-warning" />}
              />
              <DetailRow
                label={isBangla ? 'তারিখ ও সময়' : 'Date & Time'}
                value={new Date(selectedPurchase.createdAt).toLocaleString()}
                icon={<Clock className="h-5 w-5 text-blue-600" />}
              />
              {selectedPurchase.dueAmount > 0 && (
                <DetailRow
                  label={isBangla ? 'বাকি' : 'Due Amount'}
                  value={
                    <span className="font-bold text-destructive">
                      {formatCurrency(selectedPurchase.dueAmount)}
                    </span>
                  }
                  icon={<TrendingDown className="h-5 w-5 text-destructive" />}
                />
              )}
            </DetailSection>

            <DetailSection title={isBangla ? 'পণ্য তালিকা' : 'Items'}>
              {selectedPurchase.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.quantity} × {formatCurrency(item.unitCost)}
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

      {/* Order Detail Modal */}
      <DetailModal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={selectedPO?.poNo || ''}
        subtitle={isBangla ? 'ক্রয় অর্ডারের বিবরণ' : 'Purchase Order Details'}
        width="lg"
      >
        {selectedPO && (
          <>
            <DetailSection title={isBangla ? 'অর্ডারের তথ্য' : 'Order Information'}>
              <DetailRow
                label={isBangla ? 'অর্ডার নম্বর' : 'PO Number'}
                value={selectedPO.poNo}
              />
              <DetailRow
                label={isBangla ? 'সরবরাহকারী' : 'Supplier'}
                value={selectedPO.partyName}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={<POStatusBadge status={selectedPO.status} isBangla={isBangla} />}
              />
              <DetailRow
                label={isBangla ? 'মোট পরিমাণ' : 'Total Amount'}
                value={
                  <span className="text-xl font-bold text-indigo">
                    {formatCurrency(selectedPO.totalAmount)}
                  </span>
                }
              />
              {selectedPO.expectedDate && (
                <DetailRow
                  label={isBangla ? 'প্রত্যাশিত তারিখ' : 'Expected Date'}
                  value={new Date(selectedPO.expectedDate).toLocaleDateString()}
                />
              )}
              <DetailRow
                label={isBangla ? 'তৈরি করেছে' : 'Created By'}
                value={selectedPO.createdBy}
              />
              <DetailRow
                label={isBangla ? 'তারিখ' : 'Date'}
                value={new Date(selectedPO.createdAt).toLocaleString()}
              />
              {selectedPO.approvedBy && (
                <DetailRow
                  label={isBangla ? 'অনুমোদন করেছে' : 'Approved By'}
                  value={`${selectedPO.approvedBy} (${new Date(selectedPO.approvedAt!).toLocaleDateString()})`}
                />
              )}
              {selectedPO.notes && (
                <DetailRow
                  label={isBangla ? 'নোট' : 'Notes'}
                  value={selectedPO.notes}
                />
              )}
            </DetailSection>

            <DetailSection title={isBangla ? 'পণ্য তালিকা' : 'Items'}>
              {selectedPO.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.receivedQuantity}/{item.quantity} {isBangla ? 'ইউনিট' : 'units'} • {formatCurrency(item.unitCost)}/unit
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatCurrency(item.total)}</p>
                    {item.receivedQuantity < item.quantity && (
                      <p className="text-xs text-warning">
                        {item.quantity - item.receivedQuantity} {isBangla ? 'বাকি' : 'pending'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </DetailSection>
          </>
        )}
      </DetailModal>
    </>
  );
}

// Purchase Row Component
function PurchaseRow({ purchase, isBangla, index, onView }: { purchase: Purchase; isBangla: boolean; index: number; onView: () => void }) {
  const { formatCurrency } = useCurrency();
  const { formatDateTime } = useDateFormat();

  const statusConfig = {
    received: { label: isBangla ? 'গৃহীত' : 'Received', variant: 'success' as const },
    pending: { label: isBangla ? 'অপেক্ষমান' : 'Pending', variant: 'warning' as const },
    partial: { label: isBangla ? 'আংশিক' : 'Partial', variant: 'indigo' as const },
    cancelled: { label: isBangla ? 'বাতিল' : 'Cancelled', variant: 'destructive' as const },
  };

  const status = statusConfig[purchase.status as keyof typeof statusConfig] || statusConfig.received;

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group stagger-item gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onView}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-12 w-12 rounded-xl bg-warning-subtle flex items-center justify-center shrink-0">
          <ShoppingCart className="h-5 w-5 text-warning" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{purchase.invoiceNo || `PUR-${purchase.id.slice(-6)}`}</p>
            <Badge variant={status.variant} size="sm" className="whitespace-nowrap">{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
            {purchase.items.length} {isBangla ? 'পণ্য' : 'items'} • {formatDateTime(purchase.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right min-w-0">
          <p className="font-bold text-foreground text-lg truncate">
            {formatCurrency(purchase.total)}
          </p>
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {purchase.dueAmount > 0 && (
              <span className="text-xs text-destructive whitespace-nowrap">
                {isBangla ? 'বাকি' : 'Due'}: {formatCurrency(purchase.dueAmount)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

// Order Row Component
function OrderRow({ order, isBangla, index, onView }: { order: PurchaseOrder; isBangla: boolean; index: number; onView: () => void }) {
  const { formatCurrency } = useCurrency();

  const statusConfig: Record<string, { label: string; labelBn: string; variant: 'default' | 'warning' | 'indigo' | 'success' | 'destructive'; icon: React.ReactNode }> = {
    draft: { label: 'Draft', labelBn: 'খসড়া', variant: 'default', icon: <FileText className="h-3 w-3" /> },
    submitted: { label: 'Submitted', labelBn: 'জমা দেওয়া', variant: 'warning', icon: <Send className="h-3 w-3" /> },
    approved: { label: 'Approved', labelBn: 'অনুমোদিত', variant: 'indigo', icon: <CheckCircle className="h-3 w-3" /> },
    partial: { label: 'Partial', labelBn: 'আংশিক', variant: 'warning', icon: <Package className="h-3 w-3" /> },
    received: { label: 'Received', labelBn: 'গৃহীত', variant: 'success', icon: <Truck className="h-3 w-3" /> },
    cancelled: { label: 'Cancelled', labelBn: 'বাতিল', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  };

  const status = statusConfig[order.status] || statusConfig.draft;

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onView}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          order.status === 'received' ? "bg-success-subtle" :
          order.status === 'cancelled' ? "bg-destructive-subtle" :
          order.status === 'approved' ? "bg-indigo-subtle" :
          "bg-warning-subtle"
        )}>
          <FileText className={cn(
            "h-5 w-5",
            order.status === 'received' ? "text-success" :
            order.status === 'cancelled' ? "text-destructive" :
            order.status === 'approved' ? "text-indigo" :
            "text-warning"
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{order.poNo}</p>
            <Badge variant={status.variant} size="sm" className="gap-1">
              {status.icon}
              {isBangla ? status.labelBn : status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order.partyName} • {order.items.length} {isBangla ? 'পণ্য' : 'items'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-bold text-foreground text-lg">
            {formatCurrency(order.totalAmount)}
          </p>
          {order.expectedDate && (
            <p className="text-xs text-muted-foreground">
              {isBangla ? 'প্রত্যাশিত' : 'Expected'}: {new Date(order.expectedDate).toLocaleDateString()}
            </p>
          )}
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

// Status Badge Component
function POStatusBadge({ status, isBangla }: { status: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'default' | 'warning' | 'indigo' | 'success' | 'destructive' }> = {
    draft: { label: 'Draft', labelBn: 'খসড়া', variant: 'default' },
    submitted: { label: 'Submitted', labelBn: 'জমা দেওয়া', variant: 'warning' },
    approved: { label: 'Approved', labelBn: 'অনুমোদিত', variant: 'indigo' },
    partial: { label: 'Partial', labelBn: 'আংশিক', variant: 'warning' },
    received: { label: 'Received', labelBn: 'গৃহীত', variant: 'success' },
    cancelled: { label: 'Cancelled', labelBn: 'বাতিল', variant: 'destructive' },
  };
  const { label, labelBn, variant } = config[status] || config.draft;
  return <Badge variant={variant}>{isBangla ? labelBn : label}</Badge>;
}
