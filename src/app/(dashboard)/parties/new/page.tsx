
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Check, X, User, Building2, ArrowLeft } from 'lucide-react';
import { useCreateParty } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewPartyPage() {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const createParty = useCreateParty();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as 'customer' | 'supplier' | 'both',
    openingBalance: '0',
    creditLimit: '',
    paymentTerms: '',
    notes: '',
  });
  
  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(isBangla ? 'নাম প্রয়োজন' : 'Name is required');
      return;
    }
    
    try {
      await createParty.mutateAsync({
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        type: formData.type,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        paymentTerms: formData.paymentTerms ? parseInt(formData.paymentTerms) : undefined,
        notes: formData.notes || undefined,
      });
      
      toast.success(isBangla ? 'পার্টি তৈরি হয়েছে!' : 'Party created successfully!');
      router.push('/parties');
    } catch (error) {
      toast.error(isBangla ? 'পার্টি সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save party');
    }
  };

  return (
    <>
      {/* Centered Page Container */}
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth: '700px' }}>
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 mb-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{isBangla ? 'পেছনে' : 'Back'}</span>
          </button>
          
          {/* Page Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isBangla ? 'নতুন পার্টি যোগ' : 'Add Party'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isBangla ? 'নতুন গ্রাহক বা সরবরাহকারী যোগ করুন' : 'Add a new customer or supplier'}
            </p>
          </div>
          
          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isBangla ? 'পার্টির তথ্য' : 'Party Information'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-5">
              {/* Party Type */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'ধরন' : 'Type'}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'customer', icon: User, label: isBangla ? 'গ্রাহক' : 'Customer' },
                    { value: 'supplier', icon: Building2, label: isBangla ? 'সরবরাহকারী' : 'Supplier' },
                    { value: 'both', label: isBangla ? 'উভয়' : 'Both' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateForm('type', type.value)}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        formData.type === type.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-transparent text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {type.icon && <type.icon className="h-4 w-4" />}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Name */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'নাম' : 'Name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder={isBangla ? 'পূর্ণ নাম লিখুন' : 'Enter full name'}
                  className="h-11"
                />
              </div>
              
              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'ফোন' : 'Phone'}
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {isBangla ? 'ইমেইল' : 'Email'}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="email@example.com"
                    className="h-11"
                  />
                </div>
              </div>
              
              {/* Address */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'ঠিকানা' : 'Address'}
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
                  className="h-11"
                />
              </div>
              
              {/* Opening Balance */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'ওপেনিং ব্যালেন্স (৳)' : 'Opening Balance (৳)'}
                </Label>
                <Input
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => updateForm('openingBalance', e.target.value)}
                  placeholder="0"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isBangla ? 'পাওনা থাকলে ধনাত্মক, দেনা থাকলে ঋণাত্মক' : 'Positive for receivable, negative for payable'}
                </p>
              </div>
              
              {/* Credit Settings (for customers) */}
              {(formData.type === 'customer' || formData.type === 'both') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
                  <div>
                    <Label className="mb-2 block">
                      {isBangla ? 'ক্রেডিট লিমিট (৳)' : 'Credit Limit (৳)'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => updateForm('creditLimit', e.target.value)}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      {isBangla ? 'পেমেন্ট পিরিয়ড (দিন)' : 'Payment Terms (days)'}
                    </Label>
                    <Input
                      type="number"
                      value={formData.paymentTerms}
                      onChange={(e) => updateForm('paymentTerms', e.target.value)}
                      placeholder="30"
                      className="h-11"
                    />
                  </div>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'নোট' : 'Notes'}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder={isBangla ? 'অতিরিক্ত তথ্য...' : 'Additional notes...'}
                  rows={2}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-3">
              <Button
                className="flex-1 h-11"
                onClick={handleSubmit}
                disabled={createParty.isPending}
              >
                {createParty.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isBangla ? 'সংরক্ষণ করুন' : 'Save'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => router.back()}
              >
                <X className="h-4 w-4 mr-2" />
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
