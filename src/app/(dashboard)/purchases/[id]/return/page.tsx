// Hello Khata OS - Purchase Return Page
// হ্যালো খাতা - ক্রয় ফেরত পেজ

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    Trash2,
    ArrowLeft,
    Truck,
    Calculator,
    CreditCard,
    Banknote,
    Wallet,
    AlertCircle,
    CheckCircle,
    Loader2,
    RotateCcw,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useUser } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetPurchaseById } from '@/hooks/api/usePurchases';
import { useReturnPurchase } from '@/hooks/api/useReturns';

interface ReturnItem {
    purchaseItemId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    maxQuantity: number;
    unitCost: number;
    unit: string;
    total: number;
    reason: string;
}

export default function PurchaseReturnPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t, isBangla } = useAppTranslation();
    const { formatCurrency } = useCurrency();
    const router = useRouter();
    const user = useUser();

    // Form state
    const [supplierId, setSupplierId] = useState<string>('');
    const [refundMethod, setRefundMethod] = useState<'cash' | 'bank' | 'mobile_banking'>('cash');
    const [accountId, setAccountId] = useState<string>('');
    const [discount, setDiscount] = useState<string>('0');
    const [tax, setTax] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [overallReason, setOverallReason] = useState<string>('');
    const [initialized, setInitialized] = useState(false);

    // Data fetching
    const { data: purchaseData, isLoading: isFetchingPurchase } = useGetPurchaseById(id);
    const { mutate: returnPurchase, isPending: isSubmitting } = useReturnPurchase();

    // Prefill items
    useEffect(() => {
        if (purchaseData?.data && !initialized) {
            const purchase = purchaseData.data;
            setSupplierId(purchase.supplierId || '');
            setInitialized(true);

            const prefillItems: ReturnItem[] = (purchase.items || []).map((item: any) => ({
                purchaseItemId: item.id,
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                maxQuantity: item.quantity,
                unitCost: item.unitCost,
                unit: item.unit || 'pcs',
                total: item.quantity * item.unitCost,
                reason: '',
            }));
            setItems(prefillItems);
        }
    }, [purchaseData, initialized]);

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalRefund = subtotal - parseFloat(discount || '0') + parseFloat(tax || '0');

    const updateQuantity = (purchaseItemId: string, quantity: number) => {
        setItems(items.map(item => {
            if (item.purchaseItemId === purchaseItemId) {
                const newQty = Math.max(0, Math.min(quantity, item.maxQuantity));
                return { ...item, quantity: newQty, total: newQty * item.unitCost };
            }
            return item;
        }));
    };

    const updateItemReason = (purchaseItemId: string, reason: string) => {
        setItems(items.map(item => {
            if (item.purchaseItemId === purchaseItemId) {
                return { ...item, reason };
            }
            return item;
        }));
    };

    const removeItem = (purchaseItemId: string) => {
        setItems(items.filter(item => item.purchaseItemId !== purchaseItemId));
    };

    const handleSubmit = () => {
        const itemsToReturn = items.filter(i => i.quantity > 0);
        if (itemsToReturn.length === 0) {
            toast.error(isBangla ? 'অন্তত একটি পণ্য নির্বাচন করুন' : 'Select at least one item');
            return;
        }

        const payload = {
            purchaseId: id,
            supplierId,
            items: itemsToReturn.map(item => ({
                purchaseItemId: item.purchaseItemId,
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                reason: item.reason || overallReason || undefined,
            })),
            discount: parseFloat(discount || '0'),
            tax: parseFloat(tax || '0'),
            reason: overallReason || undefined,
            refundMethod,
            accountId: accountId || user?.id || '',
            notes: notes || undefined,
        };

        returnPurchase(payload, {
            onSuccess: () => {
                toast.success(isBangla ? 'ক্রয় ফেরত সফলভাবে সম্পন্ন হয়েছে' : 'Purchase return completed successfully');
                router.push('/purchases');
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || (isBangla ? 'ফেরত ব্যর্থ হয়েছে' : 'Return failed'));
            }
        });
    };

    if (isFetchingPurchase) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <RotateCcw className="h-6 w-6 text-primary" />
                            {isBangla ? 'ক্রয় ফেরত' : 'Purchase Return'}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isBangla ? 'ফেরতযোগ্য পণ্যসমূহ' : 'Returnable Items'}</CardTitle></CardHeader>
                        <Divider />
                        <CardContent className="pt-4">
                            <ScrollArea className="h-[400px]">
                                {items.map((item) => (
                                    <div key={item.purchaseItemId} className="p-4 mb-3 rounded-lg bg-muted/30 border space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.itemName}</p>
                                                <p className="text-xs text-muted-foreground">Unit Cost: {formatCurrency(item.unitCost)} • Max: {item.maxQuantity}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border rounded">
                                                    <Button variant="ghost" size="icon-sm" onClick={() => updateQuantity(item.purchaseItemId, item.quantity - 1)}>-</Button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon-sm" onClick={() => updateQuantity(item.purchaseItemId, item.quantity + 1)}>+</Button>
                                                </div>
                                                <p className="w-20 font-bold text-sm text-right">{formatCurrency(item.total)}</p>
                                                <Button variant="ghost" size="icon-sm" onClick={() => removeItem(item.purchaseItemId)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                        <Input
                                            placeholder="Reason for return"
                                            className="h-8 text-xs"
                                            value={item.reason}
                                            onChange={(e) => updateItemReason(item.purchaseItemId, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isBangla ? 'অতিরিক্ত তথ্য' : 'Additional Info'}</CardTitle></CardHeader>
                        <Divider />
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Overall Reason</Label>
                                <Input value={overallReason} onChange={(e) => setOverallReason(e.target.value)} placeholder="e.g. damaged" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <textarea
                                    className="w-full h-20 px-3 py-2 text-sm bg-background border rounded-lg resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Refund notes..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isBangla ? 'রিফান্ড' : 'Refund'}</CardTitle></CardHeader>
                        <Divider />
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                             <div className="flex items-center justify-between text-sm gap-2">
                                <span>Discount</span>
                                <Input className="h-8 w-24 text-right" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                            </div>
                             <div className="flex items-center justify-between text-sm gap-2">
                                <span>Tax</span>
                                <Input className="h-8 w-24 text-right" type="number" value={tax} onChange={(e) => setTax(e.target.value)} />
                            </div>
                            <Divider />
                            <div className="flex justify-between text-lg font-bold"><span>Total Refund</span><span className="text-primary">{formatCurrency(totalRefund)}</span></div>

                            <div className="space-y-2 pt-2">
                                <Label>Refund Method</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['cash', 'bank', 'mobile_banking'].map(m => (
                                        <Button key={m} variant={refundMethod === m ? 'default' : 'outline'} size="sm" onClick={() => setRefundMethod(m as any)} className="justify-start gap-2 h-9 capitalize">
                                            {m === 'cash' && <Banknote className="h-4 w-4" />}
                                            {m === 'bank' && <CreditCard className="h-4 w-4" />}
                                            {m === 'mobile_banking' && <Wallet className="h-4 w-4" />}
                                            {m.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            {refundMethod !== 'cash' && (
                                <div className="space-y-2 pt-2">
                                    <Label>Account ID</Label>
                                    <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="accountId123" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button className="w-full bg-primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Confirm Return'}</Button>
                </div>
            </div>
        </div>
    );
}
