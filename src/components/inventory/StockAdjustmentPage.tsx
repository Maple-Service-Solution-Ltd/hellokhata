// Hello Khata OS - Stock Adjustment Page
// Manual stock adjustments with proper transaction logging
// Elite SaaS Design - Dark Theme First

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider, EmptyState } from '@/components/ui/premium';
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
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  History,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useItems, useBranches } from '@/hooks/queries';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type AdjustmentType = 'increase' | 'decrease';

export default function StockAdjustmentPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { navigateTo } = useNavigation();
  const { business } = useSessionStore();
  
  // Form state
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('increase');
  const [branchId, setBranchId] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // hoooks
  const router = useRouter()
  // Fetch data
  const { data: products = [], isLoading: productsLoading } = useItems();
  const { data: branches = [] } = useBranches();

  // Selected product info
  const selectedProduct = products.find(p => p.id === itemId);

  // Set default branch
  useEffect(() => {
    if (branches.length > 0 && !branchId) {
      const mainBranch = branches.find(b => b.isMain);
      setBranchId(mainBranch?.id || branches[0].id);
    }
  }, [branches, branchId]);

  // Common reasons
  const commonReasons = adjustmentType === 'increase' 
    ? [
        { value: 'found', label: isBangla ? 'পাওয়া গেছে' : 'Found items' },
        { value: 'return_rejected', label: isBangla ? 'ফেরত পণ্য' : 'Customer return' },
        { value: 'counting_correction', label: isBangla ? 'গণনা সংশোধন' : 'Count correction' },
        { value: 'other', label: isBangla ? 'অন্যান্য' : 'Other' },
      ]
    : [
        { value: 'damaged', label: isBangla ? 'ক্ষতিগ্রস্ত' : 'Damaged' },
        { value: 'expired', label: isBangla ? 'মেয়াদোত্তীর্ণ' : 'Expired' },
        { value: 'lost', label: isBangla ? 'হারিয়ে গেছে' : 'Lost' },
        { value: 'counting_correction', label: isBangla ? 'গণনা সংশোধন' : 'Count correction' },
        { value: 'other', label: isBangla ? 'অন্যান্য' : 'Other' },
      ];

  // Submit adjustment
  const handleSubmit = async () => {
    if (!itemId || !quantity || !reason) {
      toast.error(isBangla ? 'সব তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    if (!branchId) {
      toast.error(isBangla ? 'শাখা নির্বাচন করুন' : 'Please select a branch');
      return;
    }

    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast.error(isBangla ? 'পরিমাণ শূন্যের চেয়ে বেশি হতে হবে' : 'Quantity must be greater than zero');
      return;
    }

    // Check if decrease would result in negative stock
    if (adjustmentType === 'decrease' && selectedProduct && qty > selectedProduct.currentStock) {
      toast.error(isBangla ? 'স্টক নেতিবাচক হতে পারবে না' : 'Stock cannot go negative');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || '',
          'x-branch-id': branchId,
        },
        body: JSON.stringify({
          branchId,
          itemId,
          adjustmentType,
          quantity: qty,
          reason,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isBangla ? 'স্টক সংশোধন সফল' : 'Stock adjusted successfully');
        // Reset form
        setItemId('');
        setQuantity('');
        setReason('');
        setNotes('');
      } else {
        toast.error(data.error?.message || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error(isBangla ? 'স্টক সংশোধন ব্যর্থ' : 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/inventory')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {adjustmentType === 'increase' ? (
                  <ArrowUpCircle className="h-6 w-6 text-emerald" />
                ) : (
                  <ArrowDownCircle className="h-6 w-6 text-warning" />
                )}
                {isBangla ? 'স্টক সংশোধন' : 'Stock Adjustment'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
                {isBangla ? 'স্টক ম্যানুয়ালি বাড়ান বা কমান' : 'Manually increase or decrease stock'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Adjustment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Adjustment Type Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap">
                  {isBangla ? 'সংশোধনের ধরন' : 'Adjustment Type'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAdjustmentType('increase')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      adjustmentType === 'increase'
                        ? 'border-emerald bg-emerald/10'
                        : 'border-border-subtle hover:border-emerald/50'
                    )}
                  >
                    <div className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center',
                      adjustmentType === 'increase' ? 'bg-emerald/20' : 'bg-muted'
                    )}>
                      <TrendingUp className={cn(
                        'h-6 w-6',
                        adjustmentType === 'increase' ? 'text-emerald' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        'font-semibold',
                        adjustmentType === 'increase' ? 'text-emerald' : 'text-foreground'
                      )}>
                        {isBangla ? 'স্টক বাড়ান' : 'Increase Stock'}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {isBangla ? 'পণ্য যোগ করুন' : 'Add items to inventory'}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setAdjustmentType('decrease')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      adjustmentType === 'decrease'
                        ? 'border-warning bg-warning/10'
                        : 'border-border-subtle hover:border-warning/50'
                    )}
                  >
                    <div className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center',
                      adjustmentType === 'decrease' ? 'bg-warning/20' : 'bg-muted'
                    )}>
                      <TrendingDown className={cn(
                        'h-6 w-6',
                        adjustmentType === 'decrease' ? 'text-warning' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        'font-semibold',
                        adjustmentType === 'decrease' ? 'text-warning' : 'text-foreground'
                      )}>
                        {isBangla ? 'স্টক কমান' : 'Decrease Stock'}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {isBangla ? 'পণ্য সরান' : 'Remove items from inventory'}
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Product & Branch Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap">
                  {isBangla ? 'পণ্য ও শাখা' : 'Product & Branch'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isBangla ? 'পণ্য' : 'Product'} *</Label>
                    <Select value={itemId} onValueChange={setItemId}>
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
                    <Label>{isBangla ? 'শাখা' : 'Branch'} *</Label>
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন' : 'Select branch'} />
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
                  </div>
                </div>

                {/* Current Stock Display */}
                {selectedProduct && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{isBangla ? 'বর্তমান স্টক' : 'Current Stock'}</p>
                          <p className="text-2xl font-bold text-foreground">
                            {selectedProduct.currentStock} <span className="text-sm font-normal text-muted-foreground">{selectedProduct.unit}</span>
                          </p>
                        </div>
                      </div>
                      {selectedProduct.currentStock <= selectedProduct.minStock && (
                        <Badge variant="warning" className="whitespace-nowrap">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {isBangla ? 'স্টক কম' : 'Low Stock'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isBangla ? 'পরিমাণ' : 'Quantity'} *</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isBangla ? 'কারণ' : 'Reason'} *</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue placeholder={isBangla ? 'কারণ নির্বাচন' : 'Select reason'} />
                      </SelectTrigger>
                      <SelectContent>
                        {commonReasons.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isBangla ? 'নোট' : 'Notes'}</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isBangla ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
                    className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Submit */}
          <div className="space-y-6">
            {/* Preview */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap">
                  {isBangla ? 'প্রাকদর্শন' : 'Preview'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4 space-y-4">
                {selectedProduct && quantity ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isBangla ? 'বর্তমান স্টক' : 'Current Stock'}</span>
                      <span className="font-medium">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {adjustmentType === 'increase' 
                          ? (isBangla ? 'যোগ হবে' : 'Will add')
                          : (isBangla ? 'বিয়োগ হবে' : 'Will subtract')}
                      </span>
                      <span className={cn(
                        'font-medium',
                        adjustmentType === 'increase' ? 'text-emerald' : 'text-warning'
                      )}>
                        {adjustmentType === 'increase' ? '+' : '-'}{quantity} {selectedProduct.unit}
                      </span>
                    </div>
                    <Divider />
                    <div className="flex justify-between">
                      <span className="font-medium">{isBangla ? 'নতুন স্টক' : 'New Stock'}</span>
                      <span className={cn(
                        'text-lg font-bold',
                        adjustmentType === 'increase' ? 'text-emerald' : 
                        (selectedProduct.currentStock - parseFloat(quantity) < selectedProduct.minStock) ? 'text-warning' : 'text-foreground'
                      )}>
                        {adjustmentType === 'increase' 
                          ? selectedProduct.currentStock + parseFloat(quantity)
                          : selectedProduct.currentStock - parseFloat(quantity)
                        } {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{isBangla ? 'পণ্য নির্বাচন করুন' : 'Select a product'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning for decrease */}
            {adjustmentType === 'decrease' && selectedProduct && quantity && parseFloat(quantity) > selectedProduct.currentStock && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{isBangla ? 'সতর্কতা!' : 'Warning!'}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? 'পরিমাণ বর্তমান স্টকের চেয়ে বেশি'
                    : 'Quantity exceeds current stock'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              disabled={isSubmitting || !itemId || !quantity || !reason}
              variant={adjustmentType === 'decrease' ? 'warning' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                </>
              ) : (
                <>
                  {adjustmentType === 'increase' ? (
                    <ArrowUpCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 mr-2" />
                  )}
                  {adjustmentType === 'increase' 
                    ? (isBangla ? 'স্টক বাড়ান' : 'Increase Stock')
                    : (isBangla ? 'স্টক কমান' : 'Decrease Stock')
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
  );
}
