// Hello Khata OS - Premium Sales Page
// Elite SaaS Design - Dark Theme First

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
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  Eye,
  Printer,
  Share2,
  TrendingUp,
  FileText,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  Package,
  DollarSign,
  Receipt,
  Clock,
} from 'lucide-react';
import { useSales } from '@/hooks/queries';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { Sale } from '@/types';
import Link from 'next/link';

export default function SalesPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { data: sales = [], isLoading } = useSales();

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const todaySales = sales.reduce((sum, s) => sum + s.total, 0);
  const monthSales = todaySales * 30;
  const invoiceCount = sales.length;
  const avgSale = invoiceCount > 0 ? todaySales / invoiceCount : 0;

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {t('sales.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
              {isBangla ? 'সকল বিক্রির রেকর্ড' : 'All sales records'}
            </p>
          </div>
          <Link href="/sales/new">
          <Button className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            <span className="whitespace-nowrap">{t('sales.newSale')}</span>
          </Button></Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Today's Sales"
            titleBn="আজকের বিক্রি"
            value={todaySales}
            prefix="৳"
            trend={{ value: 12.5, isPositive: true }}
            icon={<TrendingUp className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
          <KPICard
            title="This Month"
            titleBn="এই মাসে"
            value={monthSales}
            prefix="৳"
            trend={{ value: 8.2, isPositive: true }}
            icon={<BarChart3 className="h-5 w-5" />}
            iconColor="indigo"
            isBangla={isBangla}
          />
          <KPICard
            title="Invoices"
            titleBn="ইনভয়েস"
            value={invoiceCount}
            trend={{ value: 5, isPositive: true }}
            icon={<FileText className="h-5 w-5" />}
            iconColor="warning"
            isBangla={isBangla}
          />
          <KPICard
            title="Avg. Sale"
            titleBn="গড় বিক্রি"
            value={Math.round(avgSale)}
            prefix="৳"
            icon={<ShoppingCart className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
        </div>

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
                <SelectItem value="completed">{isBangla ? 'সম্পন্ন' : 'Completed'}</SelectItem>
                <SelectItem value="pending">{isBangla ? 'অপেক্ষমান' : 'Pending'}</SelectItem>
                <SelectItem value="cancelled">{isBangla ? 'বাতিল' : 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">{isBangla ? 'তারিখ' : 'Date'}</span>
            </Button>
          </div>
        </Card>

        {/* Sales List */}
        <Card variant="elevated" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base whitespace-nowrap">{t('sales.saleHistory')}</CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredSales.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8" />}
                title={isBangla ? 'কোনো বিক্রি নেই' : 'No sales found'}
                description={isBangla ? 'নতুন বিক্রি শুরু করুন' : 'Start a new sale'}
                isBangla={isBangla}
                action={
                  <Button onClick={() => window.location.href = '/sales/new'}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{t('sales.newSale')}</span>
                  </Button>
                }
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border-subtle">
                  {filteredSales.map((sale, index) => (
                    <SaleRow 
                      key={sale.id} 
                      sale={sale} 
                      isBangla={isBangla} 
                      index={index}
                      onView={() => setSelectedSale(sale)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Detail Modal */}
      <DetailModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={selectedSale?.invoiceNo || ''}
        subtitle={isBangla ? 'বিক্রির বিবরণ' : 'Sale Details'}
        width="lg"
      >
        {selectedSale && (
          <>
            <DetailSection title={isBangla ? 'বিক্রির তথ্য' : 'Sale Information'}>
              <DetailRow
                label={isBangla ? 'মোট পরিমাণ' : 'Total Amount'}
                value={
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(selectedSale.total)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              />
              <DetailRow
                label={isBangla ? 'তারিখ ও সময়' : 'Date & Time'}
                value={new Date(selectedSale.createdAt).toLocaleString()}
                icon={<Clock className="h-5 w-5 text-blue-600" />}
              />
              <DetailRow
                label={isBangla ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                value={selectedSale.paymentMethod}
                icon={<CreditCard className="h-5 w-5 text-purple-600" />}
              />
              {selectedSale.profit > 0 && (
                <DetailRow
                  label={isBangla ? 'লাভ' : 'Profit'}
                  value={
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(selectedSale.profit)}
                    </span>
                  }
                  icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                />
              )}
            </DetailSection>

            <DetailSection title={isBangla ? 'পণ্য তালিকা' : 'Items'}>
              {selectedSale.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-foreground shrink-0">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </DetailSection>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">{isBangla ? 'প্রিন্ট' : 'Print'}</span>
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">{isBangla ? 'শেয়ার' : 'Share'}</span>
              </Button>
            </div>
          </>
        )}
        </DetailModal>
    </>
  );
}

// Sale Row Component
function SaleRow({ sale, isBangla, index, onView }: { sale: Sale; isBangla: boolean; index: number; onView: () => void }) {
  const { formatCurrency } = useCurrency();
  const { formatDateTime } = useDateFormat();

  const statusConfig = {
    completed: { label: isBangla ? 'সম্পন্ন' : 'Completed', variant: 'success' as const },
    pending: { label: isBangla ? 'অপেক্ষমান' : 'Pending', variant: 'warning' as const },
    cancelled: { label: isBangla ? 'বাতিল' : 'Cancelled', variant: 'destructive' as const },
    returned: { label: isBangla ? 'রিটার্ন' : 'Returned', variant: 'indigo' as const },
  };

  const status = statusConfig[sale.status] || statusConfig.completed;

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group stagger-item gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onView}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-12 w-12 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{sale.invoiceNo}</p>
            <Badge variant={status.variant} size="sm" className="whitespace-nowrap">{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
            {sale.items.length} {isBangla ? 'পণ্য' : 'items'} • {formatDateTime(sale.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right min-w-0">
          <p className="font-bold text-foreground text-lg truncate">
            {formatCurrency(sale.total)}
          </p>
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {sale.dueAmount > 0 && (
              <span className="text-xs text-destructive whitespace-nowrap">
                {isBangla ? 'বাকি' : 'Due'}: {formatCurrency(sale.dueAmount)}
              </span>
            )}
            {sale.profit > 0 && (
              <span className="text-xs text-primary whitespace-nowrap">
                {isBangla ? 'লাভ' : 'Profit'}: {formatCurrency(sale.profit)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
