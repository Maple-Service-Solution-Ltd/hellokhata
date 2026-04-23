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
  RotateCcw,
  Check,
  Edit2,
  Edit,
} from 'lucide-react';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { Sale } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetSales, useGetSalesSummary, } from '@/hooks/api/useSales';
import { toast } from 'sonner';
import { handleBuildComplete } from 'next/dist/build/adapter/build-complete';


interface ReturnForm {
  reason: string;
  notes: string;
  refundMethod: 'cash' | 'bkash' | 'credit_note' | 'bank'
}
export default function SalesPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();

  const [isOpenDetail, setIsOpenDetail] = useState(false);
  const [isOpenRetrun, setIsOpenReturn] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnForm, setReturnForm] = useState<ReturnForm>({
    reason: '',
    notes: '',
    refundMethod: 'cash',
  });




  const { data: salesData, isLoading } = useGetSales(searchTerm);
  const { data: salesSummary } = useGetSalesSummary();
  const sales = salesData?.data || [];
  const summary = salesSummary?.data;

  const router = useRouter()
  // Calculate stats
  const todaySales = sales.reduce((sum, s) => sum + s.total, 0);
  const monthSales = todaySales * 30;
  const invoiceCount = sales.length;
  const avgSale = invoiceCount > 0 ? todaySales / invoiceCount : 0;

  const handleChange = (field: string, value: string) => {
    setReturnForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSubmitReturn = () => {
    if (!returnForm.reason || !returnForm.refundMethod) {
      console.log(returnForm)
      toast.error(isBangla ? 'সব তথ্য দিন' : 'Please fill required fields');
      return;
    }

    toast.success(isBangla ? 'রিটার্ন সফল' : 'Return processed successfully');
  };
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
            ) : sales.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8" />}
                title={isBangla ? 'কোনো বিক্রি নেই' : 'No sales found'}
                description={isBangla ? 'নতুন বিক্রি শুরু করুন' : 'Start a new sale'}
                isBangla={isBangla}
                action={
                  <Button onClick={() => router.push('sales/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{t('sales.newSale')}</span>
                  </Button>
                }
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border-subtle">
                  {sales.map((sale, index) => (
                    <SaleRow
                      key={sale.id}
                      sale={sale}
                      isBangla={isBangla}
                      index={index}
                      onView={() => { setSelectedSale(sale); setIsOpenDetail((prev) => !prev) }}
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
        isOpen={!!isOpenDetail}
        onClose={() => setIsOpenDetail(false)}
        title={selectedSale?.invoiceNo || ''}
        subtitle={isBangla ? 'বিক্রির বিবরণ' : 'Sale Details'}
        width="lg"
      >
        {selectedSale && (
          <>
            <DetailSection title={isBangla ? 'কাস্টমার তথ্য' : 'Customer'}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    {selectedSale?.party?.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{selectedSale?.party?.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedSale?.party?.phone}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 capitalize shrink-0">
                  {selectedSale?.party?.type}
                </span>
              </div>
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
                      <p className="text-xs text-muted-foreground truncate">SKU: {item.item.sku}</p>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                        {item.discount > 0 && (
                          <span className="ml-2 text-amber-600">-{formatCurrency(item.discount)} off</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <p className="font-bold text-foreground">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-muted-foreground">Cost: {formatCurrency(item.costPrice)}</p>
                    <p className="text-xs text-green-600 font-medium">+{formatCurrency(item.profit)} profit</p>
                  </div>
                </div>
              ))}
            </DetailSection>
            <DetailSection title={isBangla ? 'বিক্রির তথ্য' : 'Sale Information'}>

              <DetailRow
                label={isBangla ? 'তারিখ ও সময়' : 'Date & Time'}
                value={new Date(selectedSale.createdAt).toLocaleString()}
                icon={<Clock className="h-5 w-5 text-blue-600" />}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${selectedSale?.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : selectedSale?.status === "pending"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedSale?.status === "completed" ? "bg-green-600"
                      : selectedSale?.status === "pending" ? "bg-amber-600"
                        : "bg-red-600"
                      }`} />
                    {selectedSale?.status?.charAt(0).toUpperCase() + selectedSale?.status?.slice(1)}
                  </span>
                }
                icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
              />
              <DetailRow
                label={isBangla ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                value={selectedSale.paymentMethod}
                icon={<CreditCard className="h-5 w-5 text-purple-600" />}
              />
              <DetailRow
                label={isBangla ? 'সাবটোটাল' : 'Subtotal'}
                value={formatCurrency(selectedSale.subtotal)}
                icon={<DollarSign className="h-5 w-5 text-gray-500" />}
              />
              {selectedSale.discount > 0 && (
                <DetailRow
                  label={isBangla ? 'ছাড়' : 'Discount'}
                  value={<span className="text-amber-600">-{formatCurrency(selectedSale.discount)}</span>}
                  icon={<DollarSign className="h-5 w-5 text-amber-600" />}
                />
              )}
              {selectedSale.tax > 0 && (
                <DetailRow
                  label={isBangla ? 'ট্যাক্স' : 'Tax'}
                  value={formatCurrency(selectedSale.tax)}
                  icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                />
              )}
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
                label={isBangla ? 'পরিশোধিত' : 'Paid Amount'}
                value={
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedSale.paidAmount)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-green-600" />}
              />
              <DetailRow
                label={isBangla ? 'বাকি' : 'Due Amount'}
                value={
                  <span className="font-bold text-red-600">
                    {formatCurrency(selectedSale.dueAmount)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-red-600" />}
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
              {selectedSale.notes && (
                <DetailRow
                  label={isBangla ? 'নোট' : 'Notes'}
                  value={selectedSale.notes}
                  icon={<FileText className="h-5 w-5 text-gray-500" />}
                />
              )}
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

      {/* Return Sale */}
      <DetailModal
        isOpen={!!isOpenRetrun}
        onClose={() => setIsOpenReturn(false)}
        title={isBangla ? 'রিটার্ন তথ্য' : 'Return Information'}
        subtitle={isBangla ? 'বিক্রির বিবরণ' : 'Sale Details'}
        width="lg"
      >
        {/* <DetailSection title={isBangla ? 'রিটার্ন তথ্য' : 'Return Information'}> */}
        <DetailSection title={isBangla ? 'কাস্টমার তথ্য' : 'Customer'}>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                {selectedSale?.party?.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">{selectedSale?.party?.name}</p>
              <p className="text-sm text-muted-foreground truncate">{selectedSale?.party?.phone}</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 capitalize shrink-0">
              {selectedSale?.party?.type}
            </span>
          </div>
        </DetailSection>

        <DetailSection title={isBangla ? 'পণ্য তালিকা' : 'Items'}>
          {selectedSale?.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground truncate">SKU: {item.item.sku}</p>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.discount > 0 && (
                      <span className="ml-2 text-amber-600">-{formatCurrency(item.discount)} off</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-1">
                <p className="font-bold text-foreground">{formatCurrency(item.total)}</p>
                <p className="text-xs text-muted-foreground">Cost: {formatCurrency(item.costPrice)}</p>
                <p className="text-xs text-green-600 font-medium">+{formatCurrency(item.profit)} profit</p>
              </div>
            </div>
          ))}
        </DetailSection>
        {/* Reason */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {isBangla ? 'কারণ' : 'Reason'}
          </label>
          <Input
            placeholder={isBangla ? 'রিটার্নের কারণ লিখুন' : 'Enter return reason'}
            value={returnForm.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium">
            {isBangla ? 'নোট' : 'Notes'}
          </label>
          <Input
            placeholder={isBangla ? 'অতিরিক্ত তথ্য লিখুন' : 'Additional notes'}
            value={returnForm.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        {/* Refund Method */}
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium">
            {isBangla ? 'রিফান্ড পদ্ধতি' : 'Refund Method'}
          </label>
          <Select
            value={returnForm.refundMethod}
            onValueChange={(value) => handleChange('refundMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={isBangla ? 'পদ্ধতি নির্বাচন করুন' : 'Select method'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">{isBangla ? 'নগদ' : 'Cash'}</SelectItem>
              <SelectItem value="bank">{isBangla ? 'ব্যাংক' : 'Bank Transfer'}</SelectItem>
              <SelectItem value="bkash">bKash</SelectItem>
              <SelectItem value="credit_note">Nagad</SelectItem>
              {/* <SelectItem value="credit">{isBangla ? 'ক্রেডিট নোট' : 'Credit Note'}</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="flex-1 h-11"
          onClick={handleSubmitReturn}
        // disabled={isLoading || isUploading}
        >
          Make Return
        </Button>
      </DetailModal>
    </>
  );
}

// Sale Row Component
function SaleRow({ sale, isBangla, index, onView }: { sale: Sale; isBangla: boolean; index: number; onView: () => void; }) {
  const { formatCurrency } = useCurrency();
  const { formatDateTime } = useDateFormat();
  const router = useRouter();
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
        <div className="flex items-center gap-1 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); router.push(`/sales/${sale.id}/edit`); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); router.push(`/sales/${sale.id}/return  `) }}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        {/* <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" /> */}
      </div>
    </div>
  );
}
