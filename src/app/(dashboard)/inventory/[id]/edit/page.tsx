// Hello Khata OS - Edit Item Page
// Multi-price support with Bengali/English language

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Save,
  Trash2,
  DollarSign,
  Box,
  Tag,
  Crown,
  TrendingDown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useItem, useCategories, useCreateItem } from '@/hooks/queries';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGetSingleItem } from '@/hooks/api/useItems';

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const businessId = useSessionStore((s) => s.business?.id);

  const { data: item, isLoading: itemLoading } = useGetSingleItem(id);
   console.log('item',item)
  const { data: categories } = useCategories();
  const createItem = useCreateItem();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    vipPrice: 0,
    minimumPrice: 0,
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
  });

  // Initialize form when item data loads
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        nameBn: item.nameBn || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        unit: item.unit || 'pcs',
        costPrice: item.costPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        wholesalePrice: item.wholesalePrice || 0,
        vipPrice: item.vipPrice || 0,
        minimumPrice: item.minimumPrice || 0,
        currentStock: item.currentStock || 0,
        minStock: item.minStock || 10,
        maxStock: item.maxStock || 100,
      });
    }
  }, [item]);

  // Calculate margin
  const margin = formData.costPrice > 0
    ? ((formData.sellingPrice - formData.costPrice) / formData.costPrice * 100)
    : 0;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: isBangla ? 'নাম প্রয়োজন' : 'Name required',
        description: isBangla ? 'পণ্যের নাম দিন' : 'Please enter item name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessId || '',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'পণ্য আপডেট হয়েছে' : 'Item updated successfully',
        });
        router.push('/inventory');
      } else {
        throw new Error(data.error?.message || 'Failed to update item');
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'পণ্য আপডেট ব্যর্থ' : 'Failed to update item',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'x-business-id': businessId || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'পণ্য মুছে ফেলা হয়েছে' : 'Item deleted successfully',
        });
        router.push('/inventory');
      } else {
        throw new Error(data.error?.message || 'Failed to delete item');
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'পণ্য মুছতে ব্যর্থ' : 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (itemLoading) {
    return (
  
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
 
    );
  }

  if (!item) {
    return (
   
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{isBangla ? 'পণ্য পাওয়া যায়নি' : 'Item not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isBangla ? 'ফিরে যান' : 'Go Back'}
          </Button>
        </div>

    );
  }

  return (

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/inventory')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                {isBangla ? 'পণ্য সম্পাদনা' : 'Edit Item'}
              </h1>
              <p className="text-sm text-muted-foreground">{item.name}</p>
            </div>
          </div>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                {isBangla ? 'মুছুন' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isBangla ? 'পণ্য মুছবেন?' : 'Delete Item?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isBangla
                    ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। পণ্যটি স্থায়ীভাবে মুছে ফেলা হবে।'
                    : 'This action cannot be undone. This item will be permanently deleted.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isBangla ? 'মুছুন' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Form */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle className="text-base">{isBangla ? 'পণ্যের তথ্য' : 'Item Information'}</CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="pt-6 space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'নাম (ইংরেজি)' : 'Name (English)'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
                <Input
                  value={formData.nameBn}
                  onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                  placeholder="পণ্যের নাম"
                />
              </div>
            </div>

            {/* SKU & Barcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'বারকোড' : 'Barcode'}</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="8901234567890"
                />
              </div>
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'ক্যাটাগরি' : 'Category'}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isBangla ? 'ক্যাটাগরি নির্বাচন' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nameBn || cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'একক' : 'Unit'}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">{isBangla ? 'পিস' : 'Pieces (pcs)'}</SelectItem>
                    <SelectItem value="kg">{isBangla ? 'কেজি' : 'Kilogram (kg)'}</SelectItem>
                    <SelectItem value="g">{isBangla ? 'গ্রাম' : 'Gram (g)'}</SelectItem>
                    <SelectItem value="l">{isBangla ? 'লিটার' : 'Liter (l)'}</SelectItem>
                    <SelectItem value="ml">{isBangla ? 'মিলি' : 'Milliliter (ml)'}</SelectItem>
                    <SelectItem value="box">{isBangla ? 'বক্স' : 'Box'}</SelectItem>
                    <SelectItem value="pack">{isBangla ? 'প্যাক' : 'Pack'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{isBangla ? 'বিবরণ' : 'Description'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isBangla ? 'পণ্যের বিবরণ' : 'Item description'}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {isBangla ? 'মূল্য নির্ধারণ' : 'Pricing'}
            </CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="pt-6 space-y-4">
            {/* Basic Prices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'ক্রয় মূল্য' : 'Cost Price'}</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'বিক্রয় মূল্য' : 'Selling Price'}</Label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Margin Display */}
            {formData.costPrice > 0 && (
              <div className={cn(
                'p-3 rounded-lg flex items-center gap-2',
                margin >= 20 ? 'bg-emerald/10' : margin >= 10 ? 'bg-warning/10' : 'bg-destructive/10'
              )}>
                <Tag className={cn(
                  'h-4 w-4',
                  margin >= 20 ? 'text-emerald' : margin >= 10 ? 'text-warning' : 'text-destructive'
                )} />
                <span className="text-sm font-medium">
                  {isBangla ? 'মার্জিন' : 'Margin'}: {margin.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Multi-Price Section */}
            <div className="pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-warning" />
                {isBangla ? 'মাল্টি-প্রাইস' : 'Multi-Price Tiers'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-indigo" />
                    {isBangla ? 'পাইকারি মূল্য' : 'Wholesale Price'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.wholesalePrice || ''}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-warning" />
                    VIP {isBangla ? 'মূল্য' : 'Price'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.vipPrice || ''}
                    onChange={(e) => setFormData({ ...formData, vipPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    {isBangla ? 'সর্বনিম্ন মূল্য' : 'Minimum Price'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.minimumPrice || ''}
                    onChange={(e) => setFormData({ ...formData, minimumPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Card */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="h-5 w-5 text-emerald" />
              {isBangla ? 'স্টক ব্যবস্থাপনা' : 'Stock Management'}
            </CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'বর্তমান স্টক' : 'Current Stock'}</Label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'ন্যূনতম স্টক' : 'Min Stock Level'}</Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'সর্বোচ্চ স্টক' : 'Max Stock Level'}</Label>
                <Input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Low Stock Warning */}
            {formData.currentStock <= formData.minStock && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">
                  {isBangla ? 'স্টক ন্যূনতম সীমার নিচে' : 'Stock is below minimum level'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.push('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isBangla ? 'ফিরে যান' : 'Go Back'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isBangla ? 'সংরক্ষণ করুন' : 'Save Changes'}
          </Button>
        </div>
      </div>
  
  );
}
