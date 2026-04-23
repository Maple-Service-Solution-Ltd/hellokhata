// Hello Khata OS - Edit Sale Page
// হ্যালো খাতা - বিক্রি সম্পাদনা পেজ

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  X,
  ArrowLeft,
  Edit,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetItems } from '@/hooks/api/useItems';
import { useParties } from '@/hooks/api/useParties';
import { useGetSaleById, useUpdateSale } from '@/hooks/api/useSales';

interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
  profit: number;
}

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();

  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_banking' | 'credit'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [discount, setDiscount] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Data fetching
  const { data: saleData, isLoading: isSaleLoading } = useGetSaleById(id);
  const { data: itemsData } = useGetItems({ search: searchTerm });
  const { data: partiesData = [] } = useParties();
  const { mutate, isPending } = useUpdateSale(id);

  const availableItems = itemsData?.data || [];
  const parties = partiesData?.data || [];

  // Prefill form when sale data is loaded
  useEffect(() => {
    if (saleData?.data && !initialized) {
      const sale = saleData.data;

      setSelectedPartyId(sale.partyId || '');
      setPaymentMethod(sale.paymentMethod || 'cash');
      setPaidAmount(sale.paidAmount?.toString() || '');
      setDiscount(sale.discount?.toString() || '0');
      setNotes(sale.notes || '');

      const prefillItems: SaleItem[] = (sale.items || []).map((item: any) => {
        const unitPrice = item.unitPrice ?? 0;
        const costPrice = item.costPrice ?? 0;
        const quantity = item.quantity ?? 1;
        const itemDiscount = item.discount ?? 0;
        return {
          itemId: item.itemId,
          itemName: item.itemName,
          quantity,
          unitPrice,
          costPrice,
          discount: itemDiscount,
          total: quantity * unitPrice - itemDiscount,
          profit: (unitPrice - costPrice) * quantity,
        };
      });
      setItems(prefillItems);
      setInitialized(true);
    }
  }, [saleData, initialized]);

  // Totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;

  const effectivePaidAmount =
    paymentMethod === 'credit'
      ? parseFloat(paidAmount) || 0
      : paidAmount === ''
        ? total
        : parseFloat(paidAmount) || total;

  const due = total - effectivePaidAmount;
  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);

  // Item handlers
  const addItem = (item: typeof availableItems[0]) => {
    const existing = items.find((i) => i.itemId === item.id);
    if (existing) {
      updateQuantity(existing.itemId, existing.quantity + 1);
    } else {
      setItems([
        ...items,
        {
          itemId: item.id,
          itemName: item.name,
          quantity: 1,
          unitPrice: item.sellingPrice,
          costPrice: item.costPrice,
          discount: 0,
          total: item.sellingPrice,
          profit: item.sellingPrice - item.costPrice,
        },
      ]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(
      items.map((item) => {
        if (item.itemId === itemId) {
          const total = quantity * item.unitPrice - item.discount;
          const profit = (item.unitPrice - item.costPrice) * quantity;
          return { ...item, quantity, total, profit };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.itemId !== itemId));
  };

  const handlePaymentMethodChange = (method: typeof paymentMethod) => {
    setPaymentMethod(method);
    if (method === 'credit') {
      setPaidAmount('0');
    }
  };

  // Submit → PATCH
  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error(isBangla ? 'অন্তত একটি পণ্য যোগ করুন' : 'Add at least one item');
      return;
    }

    const payload = {
      partyId: selectedPartyId || undefined,
      items: items.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
      discount: discountAmount,
      paidAmount: effectivePaidAmount,
      paymentMethod,
      notes: notes || undefined,
    };

    console.log(payload)
    mutate(payload, {
      onSuccess: () => {
        toast.success(isBangla ? 'বিক্রি সফলভাবে আপডেট হয়েছে' : 'Sale updated successfully');
        router.push('/sales');
      }
    });
  };

  if (isSaleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isBangla ? 'বিক্রি সম্পাদনা' : 'Edit Sale'}
        subtitle={isBangla ? 'বিক্রির তথ্য আপডেট করুন' : 'Update sale information'}
        icon={Edit}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isBangla ? 'পেছনে' : 'Back'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Item Search & Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('sales.customer')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedPartyId || 'none'}
                onValueChange={(v) => setSelectedPartyId(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isBangla ? 'গ্রাহক নির্বাচন করুন (ঐচ্ছিক)' : 'Select customer (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isBangla ? 'সাধারণ গ্রাহক' : 'Walk-in customer'}
                  </SelectItem>
                  {parties
                    .filter((p) => p.type === 'customer' || p.type === 'both')
                    .map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Item Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('sales.items')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('sales.searchItems')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Item Suggestions */}
              {searchTerm && (
                <div className="border rounded-lg divide-y max-h-60 overflow-auto">
                  {availableItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {isBangla ? 'কোনো পণ্য পাওয়া যায়নি' : 'No items found'}
                    </div>
                  ) : (
                    availableItems.map((item) => (
                      <button
                        key={item.id}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900"
                        onClick={() => addItem(item)}
                      >
                        <div className="text-left">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.sellingPrice)} •{' '}
                            {isBangla ? 'স্টক' : 'Stock'}: {item.currentStock}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-emerald-600" />
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Items */}
              {items.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {items.map((item) => (
                    <div key={item.itemId} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-medium text-sm">{formatCurrency(item.total)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeItem(item.itemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {isBangla ? 'পণ্য খুঁজে যোগ করুন' : 'Search and add items'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isBangla ? 'মন্তব্য' : 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={isBangla ? 'অতিরিক্ত তথ্য লিখুন (ঐচ্ছিক)' : 'Additional notes (optional)'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isBangla ? 'সারসংক্ষেপ' : 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('common.subtotal')}</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t('common.discount')}</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 h-8 text-right"
                  min="0"
                />
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold">{t('common.total')}</span>
                <span className="font-bold text-lg">{formatCurrency(total)}</span>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm">{t('sales.paymentMethod')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', icon: Banknote, label: isBangla ? 'নগদ' : 'Cash' },
                    { value: 'card', icon: CreditCard, label: isBangla ? 'কার্ড' : 'Card' },
                    { value: 'mobile_banking', icon: Smartphone, label: isBangla ? 'মোবাইল' : 'Mobile' },
                    { value: 'credit', icon: User, label: isBangla ? 'বাকি' : 'Credit' },
                  ].map((method) => (
                    <Button
                      key={method.value}
                      variant={paymentMethod === method.value ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-2',
                        paymentMethod === method.value && 'bg-emerald-600 hover:bg-emerald-700'
                      )}
                      onClick={() => handlePaymentMethodChange(method.value as typeof paymentMethod)}
                    >
                      <method.icon className="h-4 w-4 mr-2" />
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              <div className="space-y-2">
                <Label className="text-sm">{t('sales.paidAmount')}</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={paymentMethod === 'credit' ? '0' : total.toString()}
                />
                {paymentMethod !== 'credit' && paidAmount === '' && items.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {isBangla ? 'পূর্ণ পরিমাণ প্রদান করা হবে' : 'Full amount will be paid'}
                  </p>
                )}
              </div>

              {/* Due Amount */}
              {due > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">{t('sales.dueAmount')}</span>
                    <span className="font-bold text-red-600">{formatCurrency(due)}</span>
                  </div>
                </div>
              )}

              {/* Profit Preview */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">{t('sales.estimatedProfit')}</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalProfit)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={items.length === 0 || isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {isBangla ? 'আপডেট হচ্ছে...' : 'Updating...'}
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isBangla ? 'বিক্রি আপডেট করুন' : 'Update Sale'}
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
