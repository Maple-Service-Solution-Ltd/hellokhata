// Hello Khata OS - New Item Page with Multi-Price Support
// Enhanced pricing with MRP, Wholesale, VIP, and Minimum prices

'use client';

import { useState, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  Check, 
  X, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Tag,
  Star,
  Crown,
  Sparkles,
  Calculator,
  Info
} from 'lucide-react';
import { useCategories } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateItem, useGetItemsCategories } from '@/hooks/api/useItems';
import Link from 'next/link';

// Price type configuration
const PRICE_TYPES = {
  cost: { label: 'Cost Price', labelBn: 'ক্রয় মূল্য', icon: DollarSign, color: 'text-muted-foreground', description: 'Purchase price from supplier' },
  retail: { label: 'Retail Price (MRP)', labelBn: 'খুচরা মূল্য (MRP)', icon: Tag, color: 'text-primary', description: 'Maximum Retail Price' },
  wholesale: { label: 'Wholesale Price', labelBn: 'পাইকারি মূল্য', icon: Package, color: 'text-indigo', description: 'Bulk purchase discount' },
  vip: { label: 'VIP Price', labelBn: 'ভিআইপি মূল্য', icon: Crown, color: 'text-warning', description: 'Special price for VIP customers' },
  minimum: { label: 'Minimum Price', labelBn: 'ন্যূনতম মূল্য', icon: TrendingDown, color: 'text-destructive', description: 'Lowest acceptable price' },
};

const initialForm = {
    name: '',
    // nameBn:'',
    categoryId: '',
    sku: '',
    barcode: '',
    description: '',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    vipPrice: '',
    minimumPrice: '',
    currentStock: '0',
    minStock: '10',
    maxStock: '',
  }
export default function NewItemPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  const createItem = useCreateItem()
  
  const { data: categoriesData } = useGetItemsCategories();
  const categories = categoriesData?.data || [];
  
  const [formData, setFormData] = useState(initialForm);
  
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  
  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  
  // Calculate margins for all price types
  const margins = useMemo(() => {
    const costPrice = parseFloat(formData.costPrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const wholesalePrice = parseFloat(formData.wholesalePrice) || 0;
    const vipPrice = parseFloat(formData.vipPrice) || 0;
    const minimumPrice = parseFloat(formData.minimumPrice) || 0;
    
    const calculateMargin = (price: number) => {
      if (costPrice <= 0 || price <= 0) return 0;
      return ((price - costPrice) / costPrice) * 100;
    };
    
    const calculateProfit = (price: number) => {
      if (price <= 0) return 0;
      return price - costPrice;
    };
    
    return {
      retail: {
        price: sellingPrice,
        margin: calculateMargin(sellingPrice),
        profit: calculateProfit(sellingPrice),
      },
      wholesale: {
        price: wholesalePrice,
        margin: calculateMargin(wholesalePrice),
        profit: calculateProfit(wholesalePrice),
      },
      vip: {
        price: vipPrice,
        margin: calculateMargin(vipPrice),
        profit: calculateProfit(vipPrice),
      },
      minimum: {
        price: minimumPrice,
        margin: calculateMargin(minimumPrice),
        profit: calculateProfit(minimumPrice),
      },
    };
  }, [formData.costPrice, formData.sellingPrice, formData.wholesalePrice, formData.vipPrice, formData.minimumPrice]);
  
  // Find best margin
  const bestMargin = useMemo(() => {
    const validMargins = Object.entries(margins).filter(([, data]) => data.margin > 0);
    if (validMargins.length === 0) return null;
    
    const [type, data] = validMargins.reduce((best, current) => 
      current[1].margin > best[1].margin ? current : best
    );
    
    return { type, ...data };
  }, [margins]);
  
  // Price validation
  const priceValidation = useMemo(() => {
    const cost = parseFloat(formData.costPrice) || 0;
    const retail = parseFloat(formData.sellingPrice) || 0;
    const wholesale = parseFloat(formData.wholesalePrice) || 0;
    const vip = parseFloat(formData.vipPrice) || 0;
    const minimum = parseFloat(formData.minimumPrice) || 0;
    
    const warnings: string[] = [];
    
    if (retail > 0 && retail < cost) {
      warnings.push(isBangla ? 'খুচরা মূল্য ক্রয় মূল্যের চেয়ে কম' : 'Retail price is below cost price');
    }
    if (wholesale > 0 && wholesale > retail) {
      warnings.push(isBangla ? 'পাইকারি মূল্য খুচরা মূল্যের চেয়ে বেশি' : 'Wholesale price is above retail price');
    }
    if (vip > 0 && vip > retail) {
      warnings.push(isBangla ? 'ভিআইপি মূল্য খুচরা মূল্যের চেয়ে বেশি' : 'VIP price is above retail price');
    }
    if (minimum > 0 && minimum > retail) {
      warnings.push(isBangla ? 'ন্যূনতম মূল্য খুচরা মূল্যের চেয়ে বেশি' : 'Minimum price is above retail price');
    }
    
    return warnings;
  }, [formData, isBangla]);
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(isBangla ? 'পণ্যের নাম প্রয়োজন' : 'Item name is required');
      return;
    }
    
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    if (sellingPrice <= 0) {
      toast.error(isBangla ? 'বিক্রয় মূল্য প্রয়োজন' : 'Selling price is required');
      return;
    }
    
    const costPrice = parseFloat(formData.costPrice) || 0;
    
    const item = {
        name: formData.name,
        nameBn: formData.name,
        categoryId: formData.categoryId || undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        unit: formData.unit,
        costPrice,
        sellingPrice,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined,
        vipPrice: formData.vipPrice ? parseFloat(formData.vipPrice) : undefined,
        minimumPrice: formData.minimumPrice ? parseFloat(formData.minimumPrice) : undefined,
        currentStock: parseFloat(formData.currentStock) || 0,
        minStock: parseFloat(formData.minStock) || 10,
        maxStock: formData.maxStock ? parseFloat(formData.maxStock) : undefined,
        supplierId:''
      }
   
      createItem.mutate(item,{
        onSuccess: data => {
          if(data.success){
            toast.success('Item saved successfully!');
            setFormData(initialForm)
          }
        }
      })
  };

  return (
    <>
      {/* Centered Page Container */}
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth: '800px' }}>
          
          {/* Back Button */}
          <Link href='/inventory'
            className="flex items-center gap-1 mb-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{isBangla ? 'পেছনে' : 'Back'}</span>
          </Link>
          
          {/* Page Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isBangla ? 'নতুন পণ্য যোগ' : 'Add Item'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isBangla ? 'নতুন পণ্য ইনভেন্টরিতে যোগ করুন' : 'Add a new item to inventory'}
            </p>
          </div>
          
          {/* Form Card */}
          <Card variant="elevated" padding="none">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-lg">
                {isBangla ? 'পণ্যের তথ্য' : 'Item Information'}
              </CardTitle>
            </CardHeader>
            <Divider />
            
            <CardContent className="p-6 space-y-5">
              {/* Name */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'পণ্যের নাম' : 'Item Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder={isBangla ? 'পণ্যের নাম লিখুন' : 'Enter item name'}
                  className="h-11"
                />
              </div>
              
              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'ক্যাটাগরি' : 'Category'}
                  </Label>
                  <Select value={formData.categoryId} onValueChange={(v) => updateForm('categoryId', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={isBangla ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nameBn || cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'একক' : 'Unit'}
                  </Label>
                  <Select value={formData.unit} onValueChange={(v) => updateForm('unit', v)}>
                    <SelectTrigger className="h-11">
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
              
              {/* SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'SKU' : 'SKU'}
                  </Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => updateForm('sku', e.target.value)}
                    placeholder="SKU-001"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'বারকোড' : 'Barcode'}
                  </Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => updateForm('barcode', e.target.value)}
                    placeholder="8901234567890"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
            
            {/* Multi-Price Section */}
            <div className="border-t border-border">
              <div className="px-6 py-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      {isBangla ? 'মূল্য নির্ধারণ' : 'Pricing'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'একাধিক মূল্য সেট করুন' : 'Set multiple price tiers'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      {isBangla ? 'উন্নত মূল্য' : 'Advanced Pricing'}
                    </Label>
                    <Switch
                      checked={showAdvancedPricing}
                      onCheckedChange={setShowAdvancedPricing}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Basic Prices - Always Visible */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cost Price */}
                  <div>
                    <Label className="mb-2 flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {isBangla ? 'ক্রয় মূল্য (৳)' : 'Cost Price (৳)'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => updateForm('costPrice', e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isBangla ? 'সরবরাহকারীর ক্রয় মূল্য' : 'Purchase price from supplier'}
                    </p>
                  </div>
                  
                  {/* Retail Price (MRP) */}
                  <div>
                    <Label className="mb-2 flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      {isBangla ? 'খুচরা মূল্য/MRP (৳)' : 'Retail Price/MRP (৳)'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => updateForm('sellingPrice', e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isBangla ? 'সর্বোচ্চ খুচরা মূল্য' : 'Maximum Retail Price'}
                    </p>
                  </div>
                </div>
                
                {/* Margin Preview - Retail */}
                {margins.retail.margin > 0 && (
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    bestMargin?.type === 'retail' 
                      ? "bg-primary/10 border border-primary/20" 
                      : "bg-muted/30 border border-border"
                  )}>
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      bestMargin?.type === 'retail' ? "bg-primary/20" : "bg-muted"
                    )}>
                      {bestMargin?.type === 'retail' ? (
                        <Sparkles className="h-4 w-4 text-primary" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {isBangla ? 'খুচরা মার্জিন' : 'Retail Margin'}
                        </span>
                        {bestMargin?.type === 'retail' && (
                          <Badge variant="default" size="sm">
                            {isBangla ? 'সেরা' : 'Best'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ৳{margins.retail.profit.toFixed(2)} {isBangla ? 'লাভ প্রতি এককে' : 'profit per unit'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">
                        {margins.retail.margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Advanced Pricing Toggle */}
                {showAdvancedPricing && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Wholesale Price */}
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-indigo" />
                          {isBangla ? 'পাইকারি মূল্য (৳)' : 'Wholesale (৳)'}
                        </Label>
                        <Input
                          type="number"
                          value={formData.wholesalePrice}
                          onChange={(e) => updateForm('wholesalePrice', e.target.value)}
                          placeholder="0"
                          className="h-11"
                        />
                        {margins.wholesale.margin > 0 && (
                          <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            bestMargin?.type === 'wholesale' ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {bestMargin?.type === 'wholesale' && <Sparkles className="h-3 w-3" />}
                            {margins.wholesale.margin.toFixed(1)}% {isBangla ? 'মার্জিন' : 'margin'}
                          </p>
                        )}
                      </div>
                      
                      {/* VIP Price */}
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <Crown className="h-3.5 w-3.5 text-warning" />
                          {isBangla ? 'ভিআইপি মূল্য (৳)' : 'VIP Price (৳)'}
                        </Label>
                        <Input
                          type="number"
                          value={formData.vipPrice}
                          onChange={(e) => updateForm('vipPrice', e.target.value)}
                          placeholder="0"
                          className="h-11"
                        />
                        {margins.vip.margin > 0 && (
                          <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            bestMargin?.type === 'vip' ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {bestMargin?.type === 'vip' && <Sparkles className="h-3 w-3" />}
                            {margins.vip.margin.toFixed(1)}% {isBangla ? 'মার্জিন' : 'margin'}
                          </p>
                        )}
                      </div>
                      
                      {/* Minimum Price */}
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                          {isBangla ? 'ন্যূনতম মূল্য (৳)' : 'Min Price (৳)'}
                        </Label>
                        <Input
                          type="number"
                          value={formData.minimumPrice}
                          onChange={(e) => updateForm('minimumPrice', e.target.value)}
                          placeholder="0"
                          className="h-11"
                        />
                        {margins.minimum.margin > 0 && (
                          <p className={cn(
                            "text-xs mt-1 flex items-center gap-1",
                            bestMargin?.type === 'minimum' ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {bestMargin?.type === 'minimum' && <Sparkles className="h-3 w-3" />}
                            {margins.minimum.margin.toFixed(1)}% {isBangla ? 'মার্জিন' : 'margin'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Margin Comparison Card */}
                    {bestMargin && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {isBangla ? 'মার্জিন তুলনা' : 'Margin Comparison'}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(margins).map(([type, data]) => {
                            if (data.margin <= 0) return null;
                            const config = PRICE_TYPES[type as keyof typeof PRICE_TYPES];
                            const Icon = config.icon;
                            const isBest = bestMargin.type === type;
                            
                            return (
                              <div 
                                key={type}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                                  isBest ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className={cn("h-4 w-4", config.color)} />
                                  <span className="text-sm font-medium">
                                    {isBangla ? config.labelBn : config.label}
                                  </span>
                                  {isBest && (
                                    <Badge variant="default" size="sm">
                                      <Star className="h-3 w-3 mr-1" />
                                      {isBangla ? 'সেরা' : 'Best'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">
                                    ৳{data.profit.toFixed(2)}
                                  </span>
                                  <span className={cn(
                                    "text-sm font-bold",
                                    isBest ? "text-primary" : "text-foreground"
                                  )}>
                                    {data.margin.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Price Validation Warnings */}
                    {priceValidation.length > 0 && (
                      <div className="p-3 rounded-lg bg-warning-subtle/50 border border-warning/20">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-warning mt-0.5" />
                          <div className="space-y-1">
                            {priceValidation.map((warning, index) => (
                              <p key={index} className="text-xs text-warning">
                                {warning}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Stock Section */}
            <div className="border-t border-border">
              <div className="px-6 py-4 bg-muted/20">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  {isBangla ? 'স্টক তথ্য' : 'Stock Information'}
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-2 block">
                      {isBangla ? 'বর্তমান স্টক' : 'Current Stock'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => updateForm('currentStock', e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      {isBangla ? 'ন্যূনতম স্টক' : 'Min Stock'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => updateForm('minStock', e.target.value)}
                      placeholder="10"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      {isBangla ? 'সর্বোচ্চ স্টক' : 'Max Stock'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.maxStock}
                      onChange={(e) => updateForm('maxStock', e.target.value)}
                      placeholder="100"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="border-t border-border p-6">
              <Label className="mb-2 block">
                {isBangla ? 'বিবরণ' : 'Description'}
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder={isBangla ? 'পণ্যের বিবরণ...' : 'Item description...'}
                rows={2}
              />
            </div>
            
            {/* Footer Actions */}
            <div className="border-t border-border px-6 py-4 flex gap-3">
              <Button
                className="flex-1 h-11"
                onClick={handleSubmit}
                disabled={createItem.isPending}
              >
                {createItem.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isBangla ? 'সংরক্ষণ করুন' : 'Save Item'}
                  </>
                )}
              </Button>
            
              <Button
                variant="outline"
                 className="flex-1 h-11 flex items-center"
                // onClick={() => navigateTo('inventory')}
              >
                 <Link href="/inventory" className='w-full h-full flex items-center justify-center'>
             <X className="h-4 w-4 mr-2" />
                {isBangla ? 'বাতিল' : 'Cancel'}
             </Link>
                
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
