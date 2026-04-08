// Hello Khata OS - Edit Party Page
// Edit customer/supplier with Bengali/English language support

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui/premium';
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
  Users,
  ArrowLeft,
  Save,
  Trash2,
  User,
  Building2,
  AlertTriangle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useToast } from '@/hooks/use-toast';
import { useSessionStore, useUser } from '@/stores/sessionStore';
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
import { useDeleteParty, useParty, useUpdateParty } from '@/hooks/api/useParties';

interface EditPartyPageProps {
  params: Promise<{ id: string }>;
}

interface PartyData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  type: 'customer' | 'supplier' | 'both';
  customerTier: string | null;
  currentBalance: number;
  creditLimit: number | null;
  paymentTerms: number | null;
  notes: string | null;
  isActive: boolean;
  riskLevel: string | null;
  categoryId: string | null;
  category: { id: string; name: string; nameBn: string | null } | null;
}

export default function EditPartyPage({ params }: EditPartyPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { toast } = useToast();
  const businessId = useSessionStore((s) => s.business?.id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; nameBn: string | null }>>([]);

  const { data: party, isLoading: partyLoading } = useParty(id);
  const { mutate: deleteParty, isPending: isDeleting } = useDeleteParty();
  const { mutate: updateParty, isPending: isSaving } = useUpdateParty();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as 'customer' | 'supplier' | 'both',
    customerTier: 'regular',
    categoryId: '__none__',
    creditLimit: '',
    paymentTerms: '',
    notes: '',
    isActive: true,
  });

  const user = useUser();


  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: isBangla ? 'নাম প্রয়োজন' : 'Name required',
        description: isBangla ? 'পার্টির নাম দিন' : 'Please enter party name',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      type: formData.type,
      // customerTier: formData.customerTier === 'regular' ? null : formData.customerTier || null,
      categoryId: formData.categoryId === '__none__' ? null : formData.categoryId || null,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      paymentTerms: formData.paymentTerms ? parseInt(formData.paymentTerms) : null,
      notes: formData.notes || null,
      // isActive: formData.isActive,
    }

    updateParty({ id, data }, {
      onSuccess: (data) => {
        console.log(data)
        toast({
          title: isBangla ? 'পার্টি আপডেট হয়েছে' : 'Party updated successfully',
        });
        router.push('/parties');
      }
    })
  };

  const handleDelete = () => {
    deleteParty(id, {
      onSuccess: (data) => {
        toast({
          title: isBangla ? 'পার্টি মুছে ফেলা হয়েছে' : 'Party deleted successfully',
        });
        router.push('/parties');
      }
    })
  };

  useEffect(() => {
    if (!party?.data) return;
    setFormData({
      name: party.data.name || "",
      phone: party.data.phone || "",
      email: party.data.email || "",
      address: party.data.address || "",
      type: party.data.type ?? "customer",
      customerTier: party.data.customerTier || "regular",
      categoryId: party.data.categoryId || "__none__",
      creditLimit: party.data.creditLimit?.toString() || "",
      paymentTerms: party.data.paymentTerms?.toString() || "",
      notes: party.data.notes || "",
      isActive: party.data.isActive ?? true,
    });

  }, [party, user]);

  if (partyLoading) {
    return (

      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>

    );
  }



  if (!party) {
    return (

      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">{isBangla ? 'পার্টি পাওয়া যায়নি' : 'Party not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/parties')}>
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
          <Button variant="ghost" size="icon" onClick={() => router.push('/parties')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              {isBangla ? 'পার্টি সম্পাদনা' : 'Edit Party'}
            </h1>
            <p className="text-sm text-muted-foreground">{party.name}</p>
          </div>
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              {isDeleting ?
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                <Trash2 className="h-4 w-4 mr-2" />}
              {isBangla ? 'মুছুন' : 'Delete'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className='w-[320px]'>
            <AlertDialogHeader>
              <AlertDialogTitle>{isBangla ? 'পার্টি মুছবেন?' : 'Delete Party?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isBangla
                  ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। পার্টিটি স্থায়ীভাবে মুছে ফেলা হবে।'
                  : 'This action cannot be undone. This party will be permanently deleted.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >

                <Trash2 className="h-4 w-4 mr-2" />

                {isBangla ? 'মুছুন' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Current Balance Card */}
      <Card variant="elevated" padding="default">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center',
                party.data.currentBalance > 0 ? 'bg-emerald/10' : party.data.currentBalance < 0 ? 'bg-destructive/10' : 'bg-muted'
              )}>
                <CreditCard className={cn(
                  'h-5 w-5',
                  party.data.currentBalance > 0 ? 'text-emerald' : party.data.currentBalance < 0 ? 'text-destructive' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isBangla ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
                </p>
                <p className={cn(
                  'text-xl font-bold',
                  party.data.currentBalance > 0 ? 'text-emerald' : party.data.currentBalance < 0 ? 'text-destructive' : 'text-foreground'
                )}>
                  ৳{Math.abs(party.data.currentBalance).toLocaleString()}
                  {party.data.currentBalance > 0 && <span className="text-sm ml-1">({isBangla ? 'পাওনা' : 'Receivable'})</span>}
                  {party.data.currentBalance < 0 && <span className="text-sm ml-1">({isBangla ? 'দেনা' : 'Payable'})</span>}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle className="text-base">{isBangla ? 'পার্টির তথ্য' : 'Party Information'}</CardTitle>
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
                  onClick={() => setFormData({ ...formData, type: type.value as 'customer' | 'supplier' | 'both' })}
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={isBangla ? 'পূর্ণ নাম লিখুন' : 'Enter full name'}
              className="h-11"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {isBangla ? 'ফোন' : 'Phone'}
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                {isBangla ? 'ইমেইল' : 'Email'}
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {isBangla ? 'ঠিকানা' : 'Address'}
            </Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              className="h-11"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <Label className="mb-2 block">{isBangla ? 'ক্যাটাগরি' : 'Category'}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isBangla ? 'ক্যাটাগরি নির্বাচন' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{isBangla ? 'কোনোটি নয়' : 'None'}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameBn || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Settings Card */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isBangla ? 'ক্রেডিট সেটিংস' : 'Credit Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">
                {isBangla ? 'ক্রেডিট লিমিট (৳)' : 'Credit Limit (৳)'}
              </Label>
              <Input
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="0"
                className="h-11"
              />
            </div>
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {isBangla ? 'পেমেন্ট পিরিয়ড (দিন)' : 'Payment Terms (days)'}
              </Label>
              <Input
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="30"
                className="h-11"
              />
            </div>
          </div>

          {/* Customer Tier */}
          {(formData.type === 'customer' || formData.type === 'both') && (
            <div>
              <Label className="mb-2 block">{isBangla ? 'গ্রাহক স্তর' : 'Customer Tier'}</Label>
              <Select
                value={formData.customerTier}
                onValueChange={(v) => setFormData({ ...formData, customerTier: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isBangla ? 'স্তর নির্বাচন' : 'Select tier'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">{isBangla ? 'সাধারণ' : 'Regular'}</SelectItem>
                  <SelectItem value="bronze">{isBangla ? 'ব্রোঞ্জ' : 'Bronze'}</SelectItem>
                  <SelectItem value="silver">{isBangla ? 'সিলভার' : 'Silver'}</SelectItem>
                  <SelectItem value="gold">{isBangla ? 'গোল্ড' : 'Gold'}</SelectItem>
                  <SelectItem value="platinum">{isBangla ? 'প্লাটিনাম' : 'Platinum'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Card */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isBangla ? 'নোট' : 'Notes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={isBangla ? 'অতিরিক্ত তথ্য...' : 'Additional notes...'}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Status Warning */}
      {!formData.isActive && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <span className="text-sm text-warning">
            {isBangla ? 'এই পার্টি নিষ্ক্রিয় আছে' : 'This party is currently inactive'}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/parties')}>
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
