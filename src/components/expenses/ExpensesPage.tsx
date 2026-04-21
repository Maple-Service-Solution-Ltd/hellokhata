// Hello Khata OS - Expenses Page
// হ্যালো খাতা - খরচ পেজ

'use client';

import { useState } from 'react';
import { PageHeader, EmptyState, StatCard } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  Zap,
  Droplets,
  Home,
  Truck,
  Users,
  MoreHorizontal,
  Eye,
  
  DollarSign,
  FileText,
  Tag,
  Router,
  Edit,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { Expense } from '@/types';
import { useDeletExpense, useExpenseSummary, useGetExpenseCategories, useGetExpenses } from '@/hooks/api/useExpense';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';

const categoryIcons: Record<string, React.ReactNode> = {
  'Zap': <Zap className="h-5 w-5" />,
  'Droplets': <Droplets className="h-5 w-5" />,
  'Home': <Home className="h-5 w-5" />,
  'Truck': <Truck className="h-5 w-5" />,
  'Users': <Users className="h-5 w-5" />,
  'MoreHorizontal': <MoreHorizontal className="h-5 w-5" />,
};

export default function ExpensesPage() {
  
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const router = useRouter();
  const { data: expenses = [], isLoading: expensesLoading } = useGetExpenses({search: searchTerm, categoryId: categoryFilter});
  const { data: categories } = useGetExpenseCategories();
  const {data: expenseSummary} = useExpenseSummary();
 
  return (
    <>
    <div className="space-y-6">
      <PageHeader
          title={t('expenses.title')}
          subtitle={isBangla ? 'খরচের হিসাব ও বিশ্লেষণ' : 'Expense tracking & analysis'}
          icon={Receipt}
          action={{
            label: t('expenses.newExpense'),
            onClick: () => router.push('/expenses/new'),
            icon: Plus,
          }}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={isBangla ? 'আজকের খরচ' : "Today's Expenses"}
            value={formatCurrency(expenseSummary?.today?.total || 0)}
            icon={Receipt}
            iconColor="text-orange-600"
          />
          <StatCard
            title={isBangla ? 'এই মাসের খরচ' : 'This Month'}
            value={formatCurrency(expenseSummary?.thisMonth?.total || 0)}
            icon={Calendar}
            iconColor="text-blue-600"
          />
          <StatCard
            title={isBangla ? 'মোট খরচ' : 'Total Expenses'}
            value={formatCurrency(expenseSummary?.allTime?.total || 0)}
            icon={Receipt}
            iconColor="text-purple-600"
          />
          <StatCard
            title={isBangla ? 'ক্যাটাগরি' : 'Categories'}
            value={expenseSummary?.categories?.length.toString() || '0'}
            icon={MoreHorizontal}
            iconColor="text-emerald-600"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 shrink-0" />
                <Input
                  placeholder={isBangla ? 'খরচের বিবরণ খুঁজুন...' : 'Search expenses...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value )}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue className='text-white' placeholder={isBangla ? 'ক্যাটাগরি' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isBangla ? 'সব ক্যাটাগরি' : 'All Categories'}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameBn || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg whitespace-nowrap">{t('expenses.expenseHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title={isBangla ? 'কোনো খরচ নেই' : 'No expenses found'}
                description={isBangla ? 'নতুন খরচ যোগ করুন' : 'Add your first expense'}
                action={{
                  label: t('expenses.newExpense'),
                  onClick: () => router.push('/expenses/new'),
                  icon: Plus,
                }}
              />
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {expenses.map((expense) => {
                    const category = categories?.find((c) => c.id === expense.categoryId);
                    return (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        categoryName={category?.nameBn || category?.name || 'Other'}
                        categoryIcon={category?.icon || 'MoreHorizontal'}
                        categoryColor={category?.color || '#6B7280'}
                        onView={() => setSelectedExpense(expense)}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Detail Modal */}
      <DetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title={selectedExpense?.description || ''}
        subtitle={isBangla ? 'খরচের বিবরণ' : 'Expense Details'}
        width="md"
      >
        {selectedExpense && (
          <>
            <DetailSection title={isBangla ? 'খরচের তথ্য' : 'Expense Information'}>
              <DetailRow
                label={isBangla ? 'পরিমাণ' : 'Amount'}
                value={
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(selectedExpense.amount)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-orange-600" />}
              />
              <DetailRow
                label={isBangla ? 'তারিখ' : 'Date'}
                value={formatDate(selectedExpense.date)}
                icon={<Calendar className="h-5 w-5 text-blue-600" />}
              />
              <DetailRow
                label={isBangla ? 'ক্যাটাগরি' : 'Category'}
                value={categories?.find((c) => c.id === selectedExpense.categoryId)?.nameBn || 
                       categories?.find((c) => c.id === selectedExpense.categoryId)?.name || 'Other'}
                icon={<Tag className="h-5 w-5 text-purple-600" />}
              />
            </DetailSection>

            {selectedExpense.receipt && (
              <DetailSection title={isBangla ? 'রশিদ' : 'Receipt'}>
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img 
                    src={selectedExpense.receipt} 
                    alt="Receipt" 
                    className="w-full h-auto max-h-48 object-contain"
                  />
                </div>
              </DetailSection>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button 
                className="flex-1"
                onClick={() => router.push(`/expenses/${selectedExpense.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isBangla ? 'সম্পাদনা' : 'Edit'}
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isBangla ? 'প্রিন্ট' : 'Print'}
              </Button>
            </div>
          </>
        )}
        </DetailModal>
    </>
  );
}

// Expense Card Component
function ExpenseCard({
  expense,
  categoryName,
  categoryIcon,
  categoryColor,
  onView,
}: {
  expense: Expense;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onView: () => void;
}) {
  const { isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();
  const router = useRouter();
//  const queryClient = new QueryClient()
   const {mutate:deleteExpense, isPaused:isDeleting} = useDeletExpense();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const handleDelete = (id) => {
    deleteExpense(id,{
      onSuccess: data => {
        if(data.success){
          toast.success(isBangla ? 'খরচ ডিলিট হয়েছে' : 'Expense deleted successfully');
        //  queryClient.invalidateQueries({ queryKey: ['expenses'] });
        }
      }
    })
  };
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 transition-colors gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <span style={{ color: categoryColor }}>
            {categoryIcons[categoryIcon] || <Receipt className="h-5 w-5" />}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{expense.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {categoryName}
            </Badge>
            <span className="whitespace-nowrap">•</span>
            <span className="whitespace-nowrap">{formatDate(expense.date)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right min-w-0">
          <p className="font-bold text-orange-600 truncate">{formatCurrency(expense.amount)}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button onClick={() => router.push(`/expenses/${expense.id}/edit`)} variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>

           <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                          <button className='text-red-500'>
                            <AlertDialogTrigger asChild>
                          
                              <Trash2 className="h-4 w-4 mr-2" />
                           
                          </AlertDialogTrigger>
                          </button>
                          <AlertDialogContent className='max-w-[350px]'>
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
                                onClick={() => handleDelete(expense.id)}
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
      </div>
    </div>
  );
}
