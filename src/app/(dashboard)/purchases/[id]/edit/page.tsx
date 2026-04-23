// Hello Khata OS - Edit Purchase Page
// হ্যালো খাতা - ক্রয় সংশোধন পেজ

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
} from 'lucide-react';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useUser } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetItems } from '@/hooks/api/useItems';
import { useParties } from '@/hooks/api/useParties';
import { useGetPurchaseById, useUpdatePurchase } from '@/hooks/api/usePurchases';

interface PurchaseItem {
    tempId: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    unit: string;
    total: number;
}

export default function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t, isBangla } = useAppTranslation();
    const { formatCurrency } = useCurrency();
    const router = useRouter();
    const user = useUser();

    // Form state
    const [supplierId, setSupplierId] = useState<string>('none');
    const [invoiceNo, setInvoiceNo] = useState<string>('');
    const [grnNo, setGrnNo] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile_banking'>('cash');
    const [paidAmount, setPaidAmount] = useState<string>('0');
    const [discount, setDiscount] = useState<string>('0');
    const [tax, setTax] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [status, setStatus] = useState<string>('completed');
    const [initialized, setInitialized] = useState(false);

    // Add item modal state
    const [showItemSelector, setShowItemSelector] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [itemQuantity, setItemQuantity] = useState<string>('1');
    const [itemCost, setItemCost] = useState<string>('');

    // Data fetching
    const { data: purchaseData, isLoading: isFetchingPurchase } = useGetPurchaseById(id);
    const { data: productsData } = useGetItems({ search: '' });
    const { data: suppliersData } = useParties('supplier');

    // Mutations
    const { mutate: updatePurchase, isPending: isUpdating } = useUpdatePurchase(id);

    const products = productsData?.data || [];
    const suppliers = suppliersData?.data || [];

    // Prefill form
    useEffect(() => {
        if (purchaseData?.data && !initialized) {
            const purchase = purchaseData.data;
            setSupplierId(purchase.supplierId || 'none');
            setInvoiceNo(purchase.invoiceNo || '');
            setGrnNo(purchase.grnNo || '');
            setPaymentMethod(purchase.paymentMethod || 'cash');
            setPaidAmount(purchase.paidAmount?.toString() || '0');
            setDiscount(purchase.discount?.toString() || '0');
            setTax(purchase.tax?.toString() || '0');
            setNotes(purchase.notes || '');
            setStatus(purchase.status || 'completed');

            const prefillItems: PurchaseItem[] = (purchase.items || []).map((item: any) => ({
                tempId: Math.random().toString(36).substring(2, 9),
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                unit: item.unit || 'pcs',
                total: item.quantity * item.unitCost,
            }));
            setItems(prefillItems);
            setInitialized(true);
        }
    }, [purchaseData, initialized]);

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - parseFloat(discount || '0') + parseFloat(tax || '0');
    const dueAmount = total - parseFloat(paidAmount || '0');

    const handleAddItem = () => {
        if (!selectedItemId || !itemQuantity || !itemCost) {
            toast.error(isBangla ? 'সব তথ্য পূরণ করুন' : 'Please fill all fields');
            return;
        }
        const product = products.find(p => p.id === selectedItemId);
        if (!product) return;

        const quantity = parseFloat(itemQuantity);
        const unitCost = parseFloat(itemCost);
        const totalCost = quantity * unitCost;

        setItems([...items, {
            tempId: Math.random().toString(36).substring(2, 9),
            itemId: selectedItemId,
            itemName: product.name,
            quantity,
            unitCost,
            unit: product.unit || 'pcs',
            total: totalCost,
        }]);
        setSelectedItemId('');
        setItemQuantity('1');
        setItemCost('');
        setShowItemSelector(false);
    };

    const handleRemoveItem = (tempId: string) => {
        setItems(items.filter(item => item.tempId !== tempId));
    };

    const handleSubmit = () => {
        if (items.length === 0) {
            toast.error(isBangla ? 'অন্তত একটি পণ্য যোগ করুন' : 'Add at least one item');
            return;
        }

        const payload = {
            supplierId: supplierId === 'none' ? undefined : supplierId,
            invoiceNo: invoiceNo || undefined,
            grnNo: grnNo || undefined,
            items: items.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                trackBatch: true,
                // These might normally come from elsewhere, using defaults for now
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                manufactureDate: new Date().toISOString(),
            })),
            discount: parseFloat(discount || '0'),
            tax: parseFloat(tax || '0'),
            paidAmount: parseFloat(paidAmount || '0'),
            paymentMethod,
            accountId: user?.id || '',
            notes,
            status,
        };

        updatePurchase(payload, {
            onSuccess: () => {
                toast.success(isBangla ? 'ক্রয় সফলভাবে আপডেট করা হয়েছে' : 'Purchase updated successfully');
                router.push('/purchases');
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || (isBangla ? 'আপডেট ব্যর্থ হয়েছে' : 'Update failed'));
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
                            <Truck className="h-6 w-6 text-primary" />
                            {isBangla ? 'ক্রয় সংশোধন' : 'Edit Purchase'}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{isBangla ? 'সাধারণ তথ্য' : 'General Info'}</CardTitle>
                        </CardHeader>
                        <Divider />
                        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isBangla ? 'সরবরাহকারী' : 'Supplier'}</Label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{isBangla ? 'ইনভয়েস নং' : 'Invoice No'}</Label>
                                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{isBangla ? 'GRN নং' : 'GRN No'}</Label>
                                <Input value={grnNo} onChange={(e) => setGrnNo(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>{isBangla ? 'স্ট্যাটাস' : 'Status'}</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="completed">{isBangla ? 'সম্পন্ন' : 'Completed'}</SelectItem>
                                        <SelectItem value="pending">{isBangla ? 'বাকি' : 'Pending'}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3 flex-row items-center justify-between">
                            <CardTitle className="text-base">{isBangla ? 'পণ্য তালিকা' : 'Items'}</CardTitle>
                            <Button size="sm" onClick={() => setShowItemSelector(true)}><Plus className="h-4 w-4 mr-2" /> {isBangla ? 'পণ্য যোগ' : 'Add Item'}</Button>
                        </CardHeader>
                        <Divider />
                        <CardContent className="pt-4">
                            <ScrollArea className="h-[300px]">
                                {items.map((item) => (
                                    <div key={item.tempId} className="flex items-center justify-between p-3 mb-2 rounded-lg bg-muted/30 border">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.itemName}</p>
                                            <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {formatCurrency(item.unitCost)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-sm">{formatCurrency(item.total)}</p>
                                            <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveItem(item.tempId)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {showItemSelector && (
                        <Card className="border-primary/50">
                            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Product</Label>
                                    <Select value={selectedItemId} onValueChange={(v) => { setSelectedItemId(v); const p = products.find(p => p.id === v); if(p) setItemCost(p.costPrice?.toString() || ''); }}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Qty</Label>
                                    <Input type="number" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Cost</Label>
                                    <Input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} />
                                </div>
                                <div className="md:col-span-3 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowItemSelector(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleAddItem}>Add</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card variant="elevated" padding="default">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isBangla ? 'হিসাব' : 'Calculation'}</CardTitle></CardHeader>
                        <Divider />
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex items-center justify-between text-sm gap-4">
                                <span>Discount</span>
                                <Input className="h-8 w-24 text-right" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                            </div>
                             <div className="flex items-center justify-between text-sm gap-4">
                                <span>Tax</span>
                                <Input className="h-8 w-24 text-right" type="number" value={tax} onChange={(e) => setTax(e.target.value)} />
                            </div>
                            <Divider />
                            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">{formatCurrency(total)}</span></div>
                            <div className="space-y-2 pt-2">
                                <Label>Paid Amount</Label>
                                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                            </div>
                             <div className="grid grid-cols-3 gap-2">
                                {['cash', 'bank', 'mobile_banking'].map(m => (
                                    <Button key={m} variant={paymentMethod === m ? 'default' : 'outline'} size="sm" onClick={() => setPaymentMethod(m as any)} className="text-[10px] px-1 h-8 capitalize">{m.replace('_', ' ')}</Button>
                                ))}
                            </div>
                            {dueAmount > 0 && (
                                <div className="p-2 rounded bg-red-100 text-red-700 text-xs flex justify-between font-bold">
                                    <span>Due:</span><span>{formatCurrency(dueAmount)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Button className="w-full" onClick={handleSubmit} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update Purchase'}</Button>
                </div>
            </div>
        </div>
    );
}
