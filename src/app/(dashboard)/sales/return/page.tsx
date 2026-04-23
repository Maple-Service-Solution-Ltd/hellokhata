'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  RotateCcw,
  Eye,
  Calendar,
  FileText,
  Package,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGetSalesReturns } from '@/hooks/api/useReturns';
import { useQueryClient } from '@tanstack/react-query';

interface SaleReturn {
  id: string;
  returnNo: string;
  saleId: string;
  sale?: {
    invoiceNo: string;
  };
  partyId?: string;
  party?: {
    name: string;
  };
  total: number;
  refundAmount: number;
  refundMethod: string;
  status: string;
  reason?: string;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function SalesReturnsPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);

  const { data: returnsData, isLoading: loading } = useGetSalesReturns();
  const returns = returnsData?.data || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
  };

  const filteredReturns = returns.filter(r => {
    const matchesSearch =
      r.returnNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sale?.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.party?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      completed: { bg: 'bg-emerald-100 text-emerald-700', text: isBangla ? 'সম্পন্ন' : 'Completed', icon: CheckCircle2 },
      draft: { bg: 'bg-gray-100 text-gray-700', text: isBangla ? 'খসড়া' : 'Draft', icon: FileText },
      cancelled: { bg: 'bg-red-100 text-red-700', text: isBangla ? 'বাতিল' : 'Cancelled', icon: AlertCircle },
    };

    const style = styles[status] || styles.draft;
    const Icon = style.icon;

    return (
      <Badge className={cn('gap-1', style.bg)}>
        <Icon className="h-3 w-3" />
        {style.text}
      </Badge>
    );
  };

  const getRefundMethodBadge = (method: string) => {
    const methods: Record<string, string> = {
      cash: isBangla ? 'নগদ' : 'Cash',
      credit_note: isBangla ? 'ক্রেডিট নোট' : 'Credit Note',
      bank: isBangla ? 'ব্যাংক' : 'Bank Transfer',
    };

    return (
      <Badge variant="outline" className="text-xs">
        {methods[method] || method}
      </Badge>
    );
  };

  const totalRefundAmount = filteredReturns.reduce((sum, r) => sum + r.refundAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo('sales')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isBangla ? 'বিক্রয় ফেরত' : 'Sales Returns'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla
                    ? `${filteredReturns.length}টি ফেরত`
                    : `${filteredReturns.length} returns`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isBangla ? 'রিফ্রেশ' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট ফেরত' : 'Total Returns'}
                  </p>
                  <p className="text-xl font-bold">{returns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">৳</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট রিফান্ড' : 'Total Refunded'}
                  </p>
                  <p className="text-xl font-bold">৳{totalRefundAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'সম্পন্ন' : 'Completed'}
                  </p>
                  <p className="text-xl font-bold">
                    {returns.filter(r => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'এই মাসে' : 'This Month'}
                  </p>
                  <p className="text-xl font-bold">
                    {returns.filter(r => {
                      const date = new Date(r.createdAt);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'ফেরত নম্বর, ইনভয়েস বা গ্রাহক খুঁজুন...' : 'Search by return no, invoice or customer...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">{isBangla ? 'সব স্ট্যাটাস' : 'All Status'}</option>
              <option value="completed">{isBangla ? 'সম্পন্ন' : 'Completed'}</option>
              <option value="draft">{isBangla ? 'খসড়া' : 'Draft'}</option>
              <option value="cancelled">{isBangla ? 'বাতিল' : 'Cancelled'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
            </p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                {isBangla ? 'কোন ফেরত নেই' : 'No returns found'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isBangla
                  ? 'কোন বিক্রয় ফেরত এখনো তৈরি হয়নি'
                  : 'No sales returns have been created yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReturns.map((saleReturn) => (
              <Card
                key={saleReturn.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedReturn(saleReturn)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <RotateCcw className="h-6 w-6 text-orange-600" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{saleReturn.returnNo}</h3>
                          {getStatusBadge(saleReturn.status)}
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {saleReturn.sale?.invoiceNo || 'N/A'}
                          </span>

                          {saleReturn.party && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {saleReturn.party.name}
                            </span>
                          )}

                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(saleReturn.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {saleReturn.items.length} {isBangla ? 'আইটেম' : 'items'}
                          </span>
                          {getRefundMethodBadge(saleReturn.refundMethod)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        ৳{saleReturn.refundAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isBangla ? 'রিফান্ড' : 'Refunded'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Return Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                {selectedReturn.returnNo}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedReturn(null)}
              >
                <span className="sr-only">Close</span>
                ×
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'ইনভয়েস' : 'Invoice'}
                  </p>
                  <p className="font-medium">{selectedReturn.sale?.invoiceNo}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'গ্রাহক' : 'Customer'}
                  </p>
                  <p className="font-medium">{selectedReturn.party?.name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'তারিখ' : 'Date'}
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedReturn.createdAt), 'dd MMMM yyyy')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'রিফান্ড পদ্ধতি' : 'Refund Method'}
                  </p>
                  {getRefundMethodBadge(selectedReturn.refundMethod)}
                </div>
              </div>

              {/* Reason */}
              {selectedReturn.reason && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'কারণ' : 'Reason'}
                  </p>
                  <p className="mt-1">{selectedReturn.reason}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-3">
                  {isBangla ? 'ফেরত আইটেম' : 'Returned Items'}
                </h4>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">{isBangla ? 'আইটেম' : 'Item'}</th>
                        <th className="text-center p-3">{isBangla ? 'পরিমাণ' : 'Qty'}</th>
                        <th className="text-right p-3">{isBangla ? 'দর' : 'Price'}</th>
                        <th className="text-right p-3">{isBangla ? 'মোট' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.itemName}</td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">৳{item.unitPrice.toLocaleString()}</td>
                          <td className="text-right p-3 font-medium">৳{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t">
                        <td colSpan={3} className="p-3 text-right font-medium">
                          {isBangla ? 'মোট রিফান্ড' : 'Total Refund'}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                          ৳{selectedReturn.refundAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                  {isBangla ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
