// Hello Khata OS - Sale Return Page
// হ্যালো খাতা - বিক্রি ফেরত পেজ

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
    Minus,
    Trash2,
    Banknote,
    Smartphone,
    CreditCard,
    Check,
    X,
    ArrowLeft,
    RotateCcw,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetSaleById } from '@/hooks/api/useSales';
import { useReturnSale } from '@/hooks/api/useReturns';

interface ReturnItem {
    saleItemId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    maxQuantity: number;
    unitPrice: number;
    total: number;
    reason: string;
}

export default function SaleReturnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { t, isBangla } = useAppTranslation();
    const { formatCurrency } = useCurrency();

    // Form state
    const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'mobile_banking'>('cash');
    const [accountId, setAccountId] = useState('');
    const [overallReason, setOverallReason] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Data fetching
    const { data: saleData, isLoading: isSaleLoading } = useGetSaleById(id);
    const { mutate, isPending } = useReturnSale();

    // Prefill items when sale data is loaded
    useEffect(() => {
        if (saleData?.data && !initialized) {
            const sale = saleData.data;

            const prefillItems: ReturnItem[] = (sale.items || []).map((item: any) => {
                const quantity = item.quantity ?? 1;
                const unitPrice = item.unitPrice ?? 0;
                const itemDiscount = item.discount ?? 0;
                // Note: We're assuming the price here is the original price paid
                return {
                    saleItemId: item.id, // Assuming the sale item has an ID
                    itemId: item.itemId,
                    itemName: item.itemName,
                    quantity: quantity,
                    maxQuantity: quantity,
                    unitPrice: unitPrice,
                    total: quantity * unitPrice - itemDiscount,
                    reason: '',
                };
            });
            setItems(prefillItems);
            setInitialized(true);
        }
    }, [saleData, initialized]);

    // Totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalRefund = subtotal; // Simplified for return

    // Item handlers
    const updateQuantity = (saleItemId: string, quantity: number) => {
        setItems(
            items.map((item) => {
                if (item.saleItemId === saleItemId) {
                    // Restrict quantity
                    const newQuantity = Math.max(0, Math.min(quantity, item.maxQuantity));
                    const total = newQuantity * item.unitPrice;
                    return { ...item, quantity: newQuantity, total };
                }
                return item;
            })
        );
    };

    const updateItemReason = (saleItemId: string, reason: string) => {
        setItems(
            items.map((item) => {
                if (item.saleItemId === saleItemId) {
                    return { ...item, reason };
                }
                return item;
            })
        );
    };

    const removeItem = (saleItemId: string) => {
        setItems(items.filter((item) => item.saleItemId !== saleItemId));
    };

    // Submit → POST
    const handleSubmit = () => {
        const itemsToReturn = items.filter(item => item.quantity > 0);

        if (itemsToReturn.length === 0) {
            toast.error(isBangla ? 'অন্তত একটি পণ্য নির্বাচন করুন' : 'Select at least one item');
            return;
        }

        const payload = {
            saleId: id,
            items: itemsToReturn.map((item) => ({
                saleItemId: item.saleItemId,
                quantity: item.quantity,
                reason: item.reason || overallReason || undefined,
            })),
            reason: overallReason || undefined,
            notes: notes || undefined,
            refundMethod,
            accountId: accountId || undefined,
        };

        console.log('payload', payload)
        mutate(payload, {
            onSuccess: () => {
                toast.success(isBangla ? 'বিক্রি ফেরত সফলভাবে সম্পন্ন হয়েছে' : 'Sale return completed successfully');
                router.push('/sales');
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || (isBangla ? 'ফেরত ব্যর্থ হয়েছে' : 'Return failed'));
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
                title={isBangla ? 'বিক্রি ফেরত' : 'Sale Return'}
                subtitle={isBangla ? 'বিক্রিত পণ্য ফেরত নিন' : 'Process a sale return'}
                icon={RotateCcw}
            >
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {isBangla ? 'পেছনে' : 'Back'}
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Items Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{isBangla ? 'ফেরতযোগ্য পণ্যসমূহ' : 'Returnable Items'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.length > 0 ? (
                                <div className="border rounded-lg divide-y">
                                    {items.map((item) => (
                                        <div key={item.saleItemId} className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.itemName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatCurrency(item.unitPrice)} • {isBangla ? 'সর্বোচ্চ' : 'Max'}: {item.maxQuantity}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center border rounded-lg">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(item.saleItemId, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-10 text-center text-sm font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(item.saleItemId, item.quantity + 1)}
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
                                                        onClick={() => removeItem(item.saleItemId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <Input
                                                placeholder={isBangla ? 'ফেরত প্রদানের কারণ (ঐচ্ছিক)' : 'Reason for return (optional)'}
                                                value={item.reason}
                                                onChange={(e) => updateItemReason(item.saleItemId, e.target.value)}
                                                className="text-sm h-8"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border rounded-lg p-8 text-center text-gray-500">
                                    {isBangla ? 'কোনো পণ্য নেই' : 'No items available'}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Overall Reason & Notes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{isBangla ? 'অতিরিক্ত তথ্য' : 'Additional Information'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm">{isBangla ? 'ফেরত প্রদানের মূল কারণ' : 'Main Reason for Return'}</Label>
                                <Input
                                    placeholder={isBangla ? 'উদাহরণ: গ্রাহক সন্তুষ্ট নন' : 'e.g., Customer not satisfied'}
                                    value={overallReason}
                                    onChange={(e) => setOverallReason(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">{isBangla ? 'অন্যান্য মন্তব্য' : 'Other Notes'}</Label>
                                <Input
                                    placeholder={isBangla ? 'অতিরিক্ত নোট লিখুন' : 'Write additional notes'}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{isBangla ? 'সারসংক্ষেপ' : 'Summary'}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{isBangla ? 'ফেরতযোগ্য উপমোট' : 'Returnable Subtotal'}</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between">
                                <span className="font-semibold">{isBangla ? 'মোট রিফান্ড' : 'Total Refund'}</span>
                                <span className="font-bold text-lg text-red-600">{formatCurrency(totalRefund)}</span>
                            </div>

                            {/* Refund Method */}
                            <div className="space-y-2">
                                <Label className="text-sm">{isBangla ? 'রিফান্ড মাধ্যম' : 'Refund Method'}</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { value: 'cash', icon: Banknote, label: isBangla ? 'নগদ' : 'Cash' },
                                        { value: 'mobile_banking', icon: Smartphone, label: isBangla ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking' },
                                        { value: 'card', icon: CreditCard, label: isBangla ? 'কার্ড / ব্যাংক' : 'Card / Bank' },
                                    ].map((method) => (
                                        <Button
                                            key={method.value}
                                            variant={refundMethod === method.value ? 'default' : 'outline'}
                                            className={cn(
                                                'justify-start h-auto py-2',
                                                refundMethod === method.value && 'bg-red-600 hover:bg-red-700'
                                            )}
                                            onClick={() => setRefundMethod(method.value as any)}
                                        >
                                            <method.icon className="h-4 w-4 mr-2" />
                                            {method.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Refund Account */}
                            {refundMethod !== 'cash' && (
                                <div className="space-y-2">
                                    <Label className="text-sm">{isBangla ? 'অ্যাকাউন্ট আইডি' : 'Account ID / Number'}</Label>
                                    <Input
                                        placeholder="clx123accountid"
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                    />
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700"
                                onClick={handleSubmit}
                                disabled={items.filter(i => i.quantity > 0).length === 0 || isPending}
                            >
                                {isPending ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        {isBangla ? 'প্রসেস হচ্ছে...' : 'Processing...'}
                                    </span>
                                ) : (
                                    <>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        {isBangla ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return'}
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
