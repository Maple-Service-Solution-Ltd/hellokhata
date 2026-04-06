// Hello Khata OS - New Quotation Page
// হ্যালো খাতা - নতুন কোটেশন পেজ

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  Badge, 
  Button, 
  Divider 
} from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Minus,
  Trash2,
  User,
  CalendarIcon,
  Check,
  X,
  ArrowLeft,
  Save,
  Send,
  Package,
  Loader2,
} from 'lucide-react';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useParties } from '@/hooks/api/useParties';
import { useGetItems } from '@/hooks/api/useItems';
import { useCreateQuotation } from '@/hooks/api/useQuotations';

interface QuotationItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedPartyName, setSelectedPartyName] = useState<string>('');
  const [validityDate, setValidityDate] = useState<Date>();
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [discount, setDiscount] = useState<string>('0');
  const [tax, setTax] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  
  const { data: itemsData } = useGetItems({search:searchTerm});
  const { data: partiesData = [] } = useParties('customer');
    const availableItems = itemsData?.data || [];
  const parties = partiesData.data || [];
  const {mutate,isPending} = useCreateQuotation();
  
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return availableItems.slice(0, 10);
    return availableItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableItems]);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxAmount = parseFloat(tax) || 0;
  const total = subtotal - discountAmount + taxAmount;
  
  // Add item to quotation
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
          discount: 0,
          total: item.sellingPrice,
        },
      ]);
    }
    setSearchTerm('');
  };
  
  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(
      items.map((item) => {
        if (item.itemId === itemId) {
          const total = quantity * item.unitPrice - item.discount;
          return { ...item, quantity, total };
        }
        return item;
      })
    );
  };
  
  // Update item price
  const updatePrice = (itemId: string, price: number) => {
    setItems(
      items.map((item) => {
        if (item.itemId === itemId) {
          const total = item.quantity * price - item.discount;
          return { ...item, unitPrice: price, total };
        }
        return item;
      })
    );
  };
  
  // Update item discount
  const updateItemDiscount = (itemId: string, discount: number) => {
    setItems(
      items.map((item) => {
        if (item.itemId === itemId) {
          const total = item.quantity * item.unitPrice - discount;
          return { ...item, discount, total };
        }
        return item;
      })
    );
  };
  
  // Remove item
  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.itemId !== itemId));
  };
  
  // Handle party selection
  const handlePartyChange = (partyId: string) => {
    if (partyId === 'none') {
      setSelectedPartyId('');
      setSelectedPartyName('');
    } else {
      setSelectedPartyId(partyId);
      const party = parties.find(p => p.id === partyId);
      setSelectedPartyName(party?.name || '');
    }
  };
  
  // Handle save draft
  const handleSaveDraft = async () => {
 
    if (!validityDate) {
      toast.error(isBangla ? 'মেয়াদ উপযুক্তির তারিখ দিন' : 'Please select validity date');
      return;
    }
    
    const draftData = {
        partyId: selectedPartyId || undefined,
        partyName: selectedPartyName || undefined,
        items: items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        discount: discountAmount,
        tax: taxAmount,
        validityDate: validityDate.toISOString(),
        quotationDate: quotationDate.toISOString(),
        notes: notes || undefined,
        status: 'draft',
      }

      mutate(draftData, {
        onSuccess: () => {
          toast.success(isBangla ? 'খসড়া সংরক্ষণ হয়েছে!' : 'Draft saved successfully!');
          router.push('/sales/quotations');
        },
      });
    }
  // Handle mark as sent
  const handleMarkAsSent = async () => {
    if (items.length === 0) {
      toast.error(isBangla ? 'অন্তত একটি পণ্য যোগ করুন' : 'Add at least one item');
      return;
    }
    
    if (!validityDate) {
      toast.error(isBangla ? 'মেয়াদ উপযুক্তির তারিখ দিন' : 'Please select validity date');
      return;
    }
    
    // try {
    //   await createQuotation.mutateAsync({
    //     partyId: selectedPartyId || undefined,
    //     // partyName: selectedPartyName || undefined,
    //     items: items.map(item => ({
    //       itemId: item.itemId,
    //       itemName: item.itemName,
    //       quantity: item.quantity,
    //       unitPrice: item.unitPrice,
    //       discount: item.discount,
    //     })),
    //     discount: discountAmount,
    //     tax: taxAmount,
    //     validityDate: validityDate.toISOString(),
    //     quotationDate: quotationDate.toISOString(),
    //     notes: notes || undefined,
    //     // status: 'sent',
    //   });
      
    //   toast.success(isBangla ? 'কোটেশন প্রেরিত হয়েছে!' : 'Quotation sent successfully!');
    //   router.push('/sales/quotations');
    // } catch (error) {
    //   toast.error(isBangla ? 'প্রেরণে সমস্যা হয়েছে' : 'Failed to send');
    // }
  };
    
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {isBangla ? 'নতুন কোটেশন' : 'New Quotation'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBangla ? 'একটি নতুন কোটেশন তৈরি করুন' : 'Create a new quotation'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isBangla ? 'পেছনে' : 'Back'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Item Search & Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {isBangla ? 'গ্রাহক' : 'Customer'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPartyId || 'none'} onValueChange={handlePartyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={isBangla ? 'গ্রাহক নির্বাচন করুন (ঐচ্ছিক)' : 'Select customer (optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isBangla ? 'সাধারণ গ্রাহক' : 'Walk-in customer'}</SelectItem>
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
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {isBangla ? 'পণ্য যোগ করুন' : 'Add Items'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isBangla ? 'পণ্যের নাম খুঁজুন...' : 'Search items...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Item Suggestions */}
                {searchTerm && (
                  <div className="border border-border-subtle rounded-lg divide-y divide-border-subtle max-h-60 overflow-auto bg-card">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {isBangla ? 'কোনো পণ্য পাওয়া যায়নি' : 'No items found'}
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          onClick={() => addItem(item)}
                        >
                          <div className="text-left">
                            <p className="font-medium text-sm text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.sellingPrice)} • {isBangla ? 'স্টক' : 'Stock'}: {item.currentStock}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-primary" />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Items */}
                {items.length > 0 ? (
                  <div className="border border-border-subtle rounded-lg divide-y divide-border-subtle">
                    {items.map((item) => (
                      <div key={item.itemId} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground">{item.itemName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.itemId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">{isBangla ? 'পরিমাণ' : 'Qty'}</Label>
                            <div className="flex items-center border border-border-subtle rounded-lg mt-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">{isBangla ? 'দর' : 'Price'}</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(item.itemId, parseFloat(e.target.value) || 0)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">{isBangla ? 'ছাড়' : 'Discount'}</Label>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItemDiscount(item.itemId, parseFloat(e.target.value) || 0)}
                              className="h-9 mt-1"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">{isBangla ? 'মোট' : 'Total'}</Label>
                            <div className="h-9 px-3 py-2 mt-1 bg-muted/50 rounded-lg text-right font-medium text-foreground">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border-subtle rounded-lg p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {isBangla ? 'পণ্য খুঁজে যোগ করুন' : 'Search and add items'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            {/* Date Selection */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isBangla ? 'তারিখ' : 'Dates'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quotation Date */}
                <div className="space-y-2">
                  <Label className="text-sm">{isBangla ? 'কোটেশনের তারিখ' : 'Quotation Date'}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {quotationDate ? format(quotationDate, 'PPP') : <span>{isBangla ? 'তারিখ নির্বাচন' : 'Pick date'}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={quotationDate}
                        onSelect={(date) => date && setQuotationDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Validity Date */}
                <div className="space-y-2">
                  <Label className="text-sm">{isBangla ? 'মেয়াদ উপযুক্তির তারিখ' : 'Valid Until'}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !validityDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {validityDate ? format(validityDate, 'PPP') : <span>{isBangla ? 'তারিখ নির্বাচন' : 'Pick date'}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validityDate}
                        onSelect={setValidityDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card variant="elevated" padding="default">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isBangla ? 'সারসংক্ষেপ' : 'Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isBangla ? 'উপমোট' : 'Subtotal'}</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isBangla ? 'ছাড়' : 'Discount'}</span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 h-8 text-right"
                    min="0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{isBangla ? 'ট্যাক্স' : 'Tax'}</span>
                  <Input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-24 h-8 text-right"
                    min="0"
                  />
                </div>

                <Divider />

                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">{isBangla ? 'মোট' : 'Total'}</span>
                  <span className="font-bold text-lg text-foreground">{formatCurrency(total)}</span>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm">{isBangla ? 'নোট' : 'Notes'}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isBangla ? 'অতিরিক্ত তথ্য...' : 'Additional notes...'}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={items.length === 0 || isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isBangla ? 'খসড়া সংরক্ষণ' : 'Save Draft'}
                    </>
                  )}
                </Button>
                {/* <Button
                  variant="premium"
                  className="w-full"
                  onClick={handleMarkAsSent}
                  disabled={items.length === 0 || isPending || !validityDate}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isBangla ? 'প্রেরণ হচ্ছে...' : 'Sending...'}
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {isBangla ? 'প্রেরণ করুন' : 'Mark as Sent'}
                    </>
                  )}
                </Button> */}
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                  <X className="h-4 w-4 mr-2" />
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
  );
}
