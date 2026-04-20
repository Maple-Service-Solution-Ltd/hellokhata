// Hello Khata OS - Edit Expense Page
// Edit expense entries with Bengali/English language support

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Receipt,
  Check,
  X,
  Zap,
  Droplets,
  Home,
  Truck,
  Users,
  MoreHorizontal,
  ArrowLeft,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore, useUser } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { useGetExpenseById, useGetExpenseCategories, useUpdateExpense } from '@/hooks/api/useExpense';

const categoryIcons: Record<string, React.ReactNode> = {
  'Zap': <Zap className="h-4 w-4" />,
  'Droplets': <Droplets className="h-4 w-4" />,
  'Home': <Home className="h-4 w-4" />,
  'Truck': <Truck className="h-4 w-4" />,
  'Users': <Users className="h-4 w-4" />,
  'MoreHorizontal': <MoreHorizontal className="h-4 w-4" />,
};

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = use(params);
  console.log('Editing expense with ID:', id);
  const router = useRouter();
  const { isBangla } = useAppTranslation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Expense data
  const {data:expense,isLoading:expenseLoading} = useGetExpenseById(id);
  const {data:categories,isLoading:categoriesLoading} = useGetExpenseCategories();
  const {mutate: updateExpense, isPending: isUpdating} = useUpdateExpense();
  const user = useUser()

  // Form state
  const [formData, setFormData] = useState({
    categoryId:  '__none__',
    amount:  '',
    description:  '',
    date:  '',
  });


  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(isBangla ? 'পরিমাণ প্রয়োজন' : 'Amount is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error(isBangla ? 'বিবরণ প্রয়োজন' : 'Description is required');
      return;
    }

    const expenseData = {
          categoryId: formData.categoryId === '__none__' ? null : formData.categoryId,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          accountId:user?.id ,
          branchId: user?.branchId,
        }

    updateExpense({expenseId: id, expenseData}, {
      onSuccess: () => {
        toast.success(isBangla ? 'খরচ আপডেট হয়েছে' : 'Expense updated successfully');
        router.push('/expenses');
      }});
  }
  const handleDelete = async () => {
  // delete api here
  };


useEffect(() => {
  if (!expense) return;

  setFormData({
    categoryId: expense.categoryId ?? "__none__",
    amount: String(expense.amount ?? ""),
    description: expense.description ?? "",
    date: expense.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : "",
  });

}, [expense?.id]);

  if (expenseLoading || categoriesLoading) {
    return (
      
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
     
    );
  }

  if (!expense) {
    return (
 
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{isBangla ? 'খরচ পাওয়া যায়নি' : 'Expense not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/expenses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isBangla ? 'ফিরে যান' : 'Go Back'}
          </Button>
        </div>
 
    );
  }

  return (
    <>
      {/* Centered Page Container */}
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth: '600px' }}>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 mb-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{isBangla ? 'পেছনে' : 'Back'}</span>
          </button>

          {/* Page Title */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isBangla ? 'খরচ সম্পাদনা' : 'Edit Expense'}
                </h1>
              </div>
              
              {/* Delete Button */}
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isBangla ? 'মুছুন' : 'Delete'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isBangla ? 'খরচ মুছবেন?' : 'Delete Expense?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isBangla
                        ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। খরচটি স্থায়ীভাবে মুছে ফেলা হবে।'
                        : 'This action cannot be undone. This expense will be permanently deleted.'}
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
            <p className="text-sm text-muted-foreground mt-1">
              {isBangla ? 'খরচের তথ্য পরিবর্তন করুন' : 'Modify expense details'}
            </p>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isBangla ? 'খরচের তথ্য' : 'Expense Details'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Category */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'ক্যাটাগরি' : 'Category'}
                </Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={isBangla ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">{isBangla ? 'কোনোটি নয়' : 'None'}</span>
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: cat.color || '#6B7280' }}>
                            {categoryIcons[cat.icon || 'MoreHorizontal']}
                          </span>
                          <span>{cat.nameBn || cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'পরিমাণ (৳)' : 'Amount (৳)'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className="h-11 text-lg"
                />
              </div>

              {/* Date */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'তারিখ' : 'Date'}
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'বিবরণ' : 'Description'} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isBangla ? 'খরচের বিবরণ লিখুন...' : 'Enter expense description...'}
                  rows={3}
                />
              </div>

              {/* Total Preview */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {isBangla ? 'মোট খরচ' : 'Total Expense'}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      ৳{parseFloat(formData.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button
                className="flex-1 h-11"
                onClick={handleSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isBangla ? 'আপডেট হচ্ছে...' : 'Updating...'}
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
