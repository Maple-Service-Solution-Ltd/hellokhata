// Hello Khata OS - New Purchase Page (Add Stock)
// Simplified UI for small retailers - internally creates Purchase + Inventory Transaction
// Elite SaaS Design - Dark Theme First

'use client';

import { useState, useEffect } from 'react';
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
  DollarSign,
  Calculator,
  CreditCard,
  Banknote,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useItems, useSuppliers, useBranches } from '@/hooks/queries';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { useSessionStore, useUser } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useGetItems } from '@/hooks/api/useItems';
import { useParties } from '@/hooks/api/useParties';
import { useCreatePurchases } from '@/hooks/api/usePurchases';

interface PurchaseItem {
  tempId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  unit: string;
  total: number;
}

export default function NewPurchasePage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  
  // Form state
  const [supplierId, setSupplierId] = useState<string>('none');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile_banking'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Add item modal state
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('1');
  const [itemCost, setItemCost] = useState<string>('');

  // Fetch data
 const {data:productsData} = useGetItems({ search: ''});
 const {data: suppliersData} = useParties('supplier');

//  create purchase mutation
const {mutate: createPurchase,isPending:isCreatingPurchases} = useCreatePurchases();
const products = productsData?.data || [];
const suppliers = suppliersData?.data || [];

const user = useUser();

  const router = useRouter()
  // Set default branch
  // useEffect(() => {
  //   if (branches.length > 0 && !branchId) {
  //     const mainBranch = branches.find(b => b.isMain);
  //     setBranchId(mainBranch?.id || branches[0].id);
  //   }
  // }, [branches, branchId]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal;
  const dueAmount = total - parseFloat(paidAmount || '0');
  // const isCredit = paymentMethod === 'credit' || (paymentMethod === 'partial' && dueAmount > 0);

  // Add item to purchase
  const handleAddItem = () => {
    if (!selectedItemId || !itemQuantity || !itemCost) {
      toast.error(isBangla ? 'সব তথ্য পূরণ করুন' : 'Please fill all fields');
      return;
    }

    const product = products.find(p => p.id === selectedItemId);
    if (!product) return;

    const quantity = parseFloat(itemQuantity);
    const unitCost = parseFloat(itemCost);
    const total = quantity * unitCost;

    const newItem: PurchaseItem = {
      tempId: Math.random().toString(36).substring(2, 9),
      itemId: selectedItemId,
      itemName: product.name,
      quantity,
      unitCost,
      unit: product.unit || 'pcs',
      total,
    };

    setItems([...items, newItem]);
    setSelectedItemId('');
    setItemQuantity('1');
    setItemCost('');
    setShowItemSelector(false);
  };

  // Remove item
  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  // Submit purchase
  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error(isBangla ? 'অন্তত একটি পণ্য যোগ করুন' : 'Add at least one item');
      return;
    }

    // if (!branchId) {
    //   toast.error(isBangla ? 'শাখা নির্বাচন করুন' : 'Please select a branch');
    //   return;
    // }

    const data = {
                supplierId: supplierId === 'none' ? undefined : supplierId,
                items: items.map(item => ({
                  itemId: item.itemId,
                  itemName: item.itemName,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  trackBatch:true
                })),
                paidAmount: parseFloat(paidAmount || '0'),
                accountId: user?.id || '',
                notes,
              }


              createPurchase(data,{
                onSuccess: () => {
                  toast.success(isBangla ? 'স্টক সফলভাবে যোগ করা হয়েছে' : 'Stock added successfully');
                  router.push('/purchases');
                }
              })
      };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                {isBangla ? 'স্টক যোগ করুন' : 'Add Stock'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
                {isBangla ? 'নতুন পণ্য ক্রয় বা স্টক যোগ করুন' : 'Add new stock or record a purchase'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier & Branch Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap">
                  {isBangla ? 'সরবরাহকারী ও শাখা' : 'Supplier & Branch'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isBangla ? 'সরবরাহকারী' : 'Supplier'}</Label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBangla ? 'সরবরাহকারী নির্বাচন করুন' : 'Select supplier'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{isBangla ? 'কোনোটি নয়' : 'None'}</SelectItem>
                        {suppliers.filter(s => s.type === 'supplier').map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div className="space-y-2">
                    <Label>{isBangla ? 'শাখা' : 'Branch'}</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন করুন' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.nameBn || branch.name}
                            {branch.isMain && ` (${isBangla ? 'প্রধান' : 'Main'})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base whitespace-nowrap">
                    {isBangla ? 'পণ্য তালিকা' : 'Items'}
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowItemSelector(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{isBangla ? 'পণ্য যোগ' : 'Add Item'}</span>
                  </Button>
                </div>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {isBangla ? 'কোনো পণ্য যোগ করা হয়নি' : 'No items added yet'}
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowItemSelector(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {isBangla ? 'পণ্য যোগ করুন' : 'Add First Item'}
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={item.tempId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border-subtle"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{item.itemName}</p>
                              <p className="text-sm text-muted-foreground whitespace-nowrap">
                                {item.quantity} {item.unit} × {formatCurrency(item.unitCost)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="font-bold text-foreground whitespace-nowrap">
                              {formatCurrency(item.total)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemoveItem(item.tempId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Add Item Selector */}
            {showItemSelector && (
              <Card variant="elevated" padding="default" className="border-primary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base whitespace-nowrap">
                    {isBangla ? 'পণ্য নির্বাচন করুন' : 'Select Product'}
                  </CardTitle>
                </CardHeader>
                <Divider />
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{isBangla ? 'পণ্য' : 'Product'}</Label>
                      <Select value={selectedItemId} onValueChange={(value) => {
                        setSelectedItemId(value);
                        const product = products.find(p => p.id === value);
                        if (product) {
                          setItemCost(product.costPrice?.toString() || '');
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder={isBangla ? 'পণ্য নির্বাচন' : 'Select product'} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.sku && `(${product.sku})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isBangla ? 'পরিমাণ' : 'Quantity'}</Label>
                      <Input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isBangla ? 'ক্রয় মূল্য' : 'Cost Price'}</Label>
                      <Input
                        type="number"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowItemSelector(false)}>
                      {isBangla ? 'বাতিল' : 'Cancel'}
                    </Button>
                    <Button onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      {isBangla ? 'যোগ করুন' : 'Add'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-6">
            {/* Summary */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {isBangla ? 'সারসংক্ষেপ' : 'Summary'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isBangla ? 'উপমোট' : 'Subtotal'}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isBangla ? 'পণ্য' : 'Items'}</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <Divider />
                <div className="flex justify-between text-lg font-bold">
                  <span>{isBangla ? 'মোট' : 'Total'}</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {isBangla ? 'পেমেন্ট' : 'Payment'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                   
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-subtle hover:border-primary/50'
                    )}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs font-medium">{isBangla ? 'নগদ' : 'Cash'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod('bank');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      paymentMethod === 'bank'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-subtle hover:border-primary/50'
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs font-medium">{isBangla ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile_banking')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      paymentMethod === 'mobile_banking'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-subtle hover:border-primary/50'
                    )}
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="text-xs font-medium">{isBangla ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}</span>
                  </button>
                </div>
 <div className="space-y-2">
                    <Label>{isBangla ? 'পরিশোধিত পরিমাণ' : 'Paid Amount'}</Label>
                    <Input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max={total.toString()}
                      step="0.01"
                    />
                  </div>
                {/* {paymentMethod === 'partial' && (
                  <div className="space-y-2">
                    <Label>{isBangla ? 'পরিশোধিত পরিমাণ' : 'Paid Amount'}</Label>
                    <Input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max={total.toString()}
                      step="0.01"
                    />
                  </div>
                )} */}

                {dueAmount > 0 && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 text-warning mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{isBangla ? 'বাকি পরিমাণ' : 'Due Amount'}</span>
                    </div>
                    <p className="text-lg font-bold text-warning">{formatCurrency(dueAmount)}</p>
                    {supplierId && supplierId !== 'none' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isBangla ? 'সরবরাহকারীর পাওনায় যোগ হবে' : 'Will be added to supplier payable'}
                      </p>
                    )}
                  </div>
                )}

                {parseFloat(paidAmount) === total && (
                  <div className="p-3 rounded-lg bg-emerald/10 border border-emerald/20">
                    <div className="flex items-center gap-2 text-emerald">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{isBangla ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Paid'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap">{isBangla ? 'নোট' : 'Notes'}</CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBangla ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
                  className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              disabled={isCreatingPurchases || items.length === 0}
            >
              {isCreatingPurchases ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {isBangla ? 'স্টক যোগ করুন' : 'Add Stock'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
  );
}
