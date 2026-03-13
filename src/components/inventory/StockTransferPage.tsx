// Hello Khata OS - Stock Transfer Page
// Transfer stock between branches with proper transaction logging
// Elite SaaS Design - Dark Theme First

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider, EmptyState } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Building2,
  Truck,
} from 'lucide-react';
import { useItems, useBranches } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function StockTransferPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  const { business } = useSessionStore();
  
  // Form state
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const { data: products = [], isLoading: productsLoading } = useItems();
  const { data: branches = [] } = useBranches();

    // hoooks
    const router = useRouter();

  // Selected product info
  const selectedProduct = products.find(p => p.id === itemId);
  const fromBranch = branches.find(b => b.id === fromBranchId);
  const toBranch = branches.find(b => b.id === toBranchId);

  // Set default from branch (main branch)
  useEffect(() => {
    if (branches.length > 0 && !fromBranchId) {
      const mainBranch = branches.find(b => b.isMain);
      setFromBranchId(mainBranch?.id || branches[0].id);
    }
  }, [branches, fromBranchId]);

  // Validate transfer
  const isValidTransfer = fromBranchId && toBranchId && fromBranchId !== toBranchId && itemId && quantity;
  const quantityNum = parseFloat(quantity || '0');
  const exceedsStock = selectedProduct && quantityNum > selectedProduct.currentStock;

  // Submit transfer
  const handleSubmit = async () => {
    if (!isValidTransfer) {
      toast.error(isBangla ? 'সব তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    if (exceedsStock) {
      toast.error(isBangla ? 'পরিমাণ বর্তমান স্টকের চেয়ে বেশি' : 'Quantity exceeds current stock');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business?.id || '',
        },
        body: JSON.stringify({
          fromBranchId,
          toBranchId,
          itemId,
          quantity: quantityNum,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isBangla ? 'স্টক স্থানান্তর সফল' : 'Stock transferred successfully');
        // Reset form
        setItemId('');
        setQuantity('');
        setNotes('');
      } else {
        toast.error(data.error?.message || 'Failed to transfer stock');
      }
    } catch (error) {
      console.error('Error transferring stock:', error);
      toast.error(isBangla ? 'স্টক স্থানান্তর ব্যর্থ' : 'Failed to transfer stock');
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
                <ArrowRightLeft className="h-6 w-6 text-primary" />
                {isBangla ? 'স্টক স্থানান্তর' : 'Stock Transfer'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
                {isBangla ? 'শাখার মধ্যে স্টক সরান' : 'Move stock between branches'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transfer Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branch Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {isBangla ? 'শাখা নির্বাচন' : 'Branch Selection'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Branch */}
                  <div className="space-y-3">
                    <Label className="text-muted-foreground">{isBangla ? 'থেকে' : 'From'}</Label>
                    <Select value={fromBranchId} onValueChange={setFromBranchId}>
                      <SelectTrigger className="h-14">
                        <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id} disabled={branch.id === toBranchId}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{branch.nameBn || branch.name}</span>
                              {branch.isMain && (
                                <Badge variant="indigo" size="sm">{isBangla ? 'প্রধান' : 'Main'}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fromBranch && (
                      <p className="text-xs text-muted-foreground">
                        {fromBranch.address || fromBranch.phone || ''}
                      </p>
                    )}
                  </div>

                  {/* Transfer Arrow */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* To Branch */}
                  <div className="space-y-3">
                    <Label className="text-muted-foreground">{isBangla ? 'প্রতি' : 'To'}</Label>
                    <Select value={toBranchId} onValueChange={setToBranchId}>
                      <SelectTrigger className="h-14">
                        <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন' : 'Select branch'} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id} disabled={branch.id === fromBranchId}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{branch.nameBn || branch.name}</span>
                              {branch.isMain && (
                                <Badge variant="indigo" size="sm">{isBangla ? 'প্রধান' : 'Main'}</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {toBranch && (
                      <p className="text-xs text-muted-foreground">
                        {toBranch.address || toBranch.phone || ''}
                      </p>
                    )}
                  </div>
                </div>

                {fromBranchId === toBranchId && toBranchId && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{isBangla ? 'একই শাখা নির্বাচিত' : 'Same branch selected'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base whitespace-nowrap flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {isBangla ? 'পণ্য নির্বাচন' : 'Product Selection'}
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
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{product.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {product.currentStock} {product.unit}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>

                {/* Current Stock Display */}
                {selectedProduct && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{isBangla ? 'উপলব্ধ স্টক' : 'Available Stock'}</p>
                          <p className="text-2xl font-bold text-foreground">
                            {selectedProduct.currentStock} <span className="text-sm font-normal text-muted-foreground">{selectedProduct.unit}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                  {isBangla ? 'স্থানান্তর প্রাকদর্শন' : 'Transfer Preview'}
                </CardTitle>
              </CardHeader>
              <Divider />
              <CardContent className="pt-4 space-y-4">
                {fromBranch && toBranch && selectedProduct && quantity ? (
                  <div className="space-y-4">
                    {/* Transfer visualization */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">{isBangla ? 'থেকে' : 'From'}</p>
                        <p className="font-semibold text-foreground truncate">{fromBranch.nameBn || fromBranch.name}</p>
                      </div>
                      <Truck className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">{isBangla ? 'প্রতি' : 'To'}</p>
                        <p className="font-semibold text-foreground truncate">{toBranch.nameBn || toBranch.name}</p>
                      </div>
                    </div>

                    <Divider />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isBangla ? 'পণ্য' : 'Product'}</span>
                        <span className="font-medium">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isBangla ? 'পরিমাণ' : 'Quantity'}</span>
                        <span className="font-bold text-primary">{quantity} {selectedProduct.unit}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{isBangla ? 'স্থানান্তরের তথ্য পূরণ করুন' : 'Fill transfer details'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning for exceeding stock */}
            {exceedsStock && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{isBangla ? 'সতর্কতা!' : 'Warning!'}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `${quantity} ${selectedProduct?.unit} স্থানান্তর করতে ${selectedProduct?.currentStock} ${selectedProduct?.unit} উপলব্ধ`
                    : `Only ${selectedProduct?.currentStock} ${selectedProduct?.unit} available to transfer`}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValidTransfer || exceedsStock}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isBangla ? 'স্থানান্তর হচ্ছে...' : 'Transferring...'}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-5 w-5 mr-2" />
                  {isBangla ? 'স্থানান্তর করুন' : 'Transfer Stock'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
  );
}
