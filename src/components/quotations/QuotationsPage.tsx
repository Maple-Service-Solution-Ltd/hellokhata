// Hello Khata OS - Premium Quotations Page
// Elite SaaS Design - Dark Theme First

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Button, 
  KPICard, 
  Divider, 
  EmptyState 
} from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  DollarSign,
  ChevronRight,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {  useDeleteQuotation } from '@/hooks/queries';
import { cn } from '@/lib/utils';
import type { Quotation, QuotationStatus } from '@/types/quotation';
import { QUOTATION_STATUS_CONFIG } from '@/types/quotation';
import { toast } from 'sonner';
import { useGetQuotations } from '@/hooks/api/useQuotations';

export default function QuotationsPage() {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  
  // Fetch quotations from API
  const { data: quotationData = [], isLoading } = useGetQuotations(searchTerm);
  const quotations = quotationData?.data || [];
  // Delete mutation
  const deleteQuotation = useDeleteQuotation();
  
  // Filter quotations (client-side search if API doesn't support it)
  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];
    if (!searchTerm) return quotations;
    
    return quotations.filter((quotation) => {
      const matchesSearch = 
        quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.items.some((item) => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [quotations, searchTerm]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!quotations) return { total: 0, pending: 0, accepted: 0, totalValue: 0 };
    
    const total = quotations.length;
    const pending = quotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
    const accepted = quotations.filter(q => q.status === 'accepted').length;
    const totalValue = quotations.reduce((sum, q) => sum + q.total, 0);
    
    return { total, pending, accepted, totalValue };
  }, [quotations]);
  
  // Handle delete confirmation
  const handleDeleteClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
  };
  
  // Handle confirmed delete
  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;
    
    try {
      await deleteQuotation.mutateAsync(quotationToDelete.id);
      toast.success(isBangla ? 'কোটেশন মুছে ফেলা হয়েছে' : 'Quotation deleted successfully');
    } catch (error) {
      toast.error(isBangla ? 'মুছে ফেলতে সমস্যা হয়েছে' : 'Failed to delete quotation');
    } finally {
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };
  
  // Handle view quotation
  const handleView = (quotation: Quotation) => {
    // For now, just show a toast - can be expanded to show a modal
    toast.info(`${quotation.quotationNo} - ${quotation.partyName || 'Walk-in customer'}`);
  };
  
  // Handle edit quotation
  const handleEdit = (quotation: Quotation) => {
    router.push(`/sales/quotations/${quotation.id}/edit`);
  };
  
  // Handle convert to sale
  const handleConvert = (quotation: Quotation) => {
    router.push(`/sales/new?quotationId=${quotation.id}`);
  };
  
  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {isBangla ? 'কোটেশন' : 'Quotations'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBangla ? 'সকল কোটেশনের রেকর্ড' : 'All quotation records'}
            </p>
          </div>
          <Button onClick={() => router.push('/sales/quotations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {isBangla ? 'নতুন কোটেশন' : 'New Quotation'}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Quotations"
            titleBn="মোট কোটেশন"
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
            iconColor="indigo"
            isBangla={isBangla}
          />
          <KPICard
            title="Pending"
            titleBn="অপেক্ষমান"
            value={stats.pending}
            icon={<Clock className="h-5 w-5" />}
            iconColor="warning"
            isBangla={isBangla}
          />
          <KPICard
            title="Accepted"
            titleBn="গৃহীত"
            value={stats.accepted}
            trend={{ value: 15, isPositive: true }}
            icon={<CheckCircle className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
          <KPICard
            title="Total Value"
            titleBn="মোট মূল্য"
            value={stats.totalValue}
            prefix="৳"
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
        </div>

        {/* Filters */}
        <Card variant="elevated" padding="default">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isBangla ? 'কোটেশন বা গ্রাহক খুঁজুন...' : 'Search quotation or customer...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={isBangla ? 'স্ট্যাটাস' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
                <SelectItem value="draft">{isBangla ? 'খসড়া' : 'Draft'}</SelectItem>
                <SelectItem value="sent">{isBangla ? 'প্রেরিত' : 'Sent'}</SelectItem>
                <SelectItem value="accepted">{isBangla ? 'গৃহীত' : 'Accepted'}</SelectItem>
                <SelectItem value="rejected">{isBangla ? 'প্রত্যাখ্যাত' : 'Rejected'}</SelectItem>
                <SelectItem value="converted">{isBangla ? 'রূপান্তরিত' : 'Converted'}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {isBangla ? 'তারিখ' : 'Date'}
            </Button>
          </div>
        </Card>

        {/* Quotations List */}
        <Card variant="elevated" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base">
              {isBangla ? 'কোটেশন তালিকা' : 'Quotation List'}
            </CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) 
            // : 
            // error ? (
            //   <div className="flex items-center justify-center py-12">
            //     <p className="text-destructive">
            //       {isBangla ? 'ডেটা লোড করতে সমস্যা হয়েছে' : 'Failed to load quotations'}
            //     </p>
            //   </div>
            // ) 
            : filteredQuotations.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title={isBangla ? 'কোনো কোটেশন নেই' : 'No quotations found'}
                description={isBangla ? 'নতুন কোটেশন তৈরি করুন' : 'Create your first quotation'}
                isBangla={isBangla}
                action={
                  <Button onClick={() => router.push('/sales/quotations/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isBangla ? 'নতুন কোটেশন' : 'New Quotation'}
                  </Button>
                }
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border-subtle">
                  {filteredQuotations.map((quotation, index) => (
                    <QuotationRow 
                      key={quotation.id} 
                      quotation={quotation} 
                      isBangla={isBangla} 
                      index={index}
                      onView={() => handleView(quotation)}
                      onEdit={() => handleEdit(quotation)}
                      onConvert={() => handleConvert(quotation)}
                      onDelete={() => handleDeleteClick(quotation)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBangla ? 'কোটেশন মুছে ফেলুন' : 'Delete Quotation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBangla 
                ? `আপনি কি নিশ্চিত যে "${quotationToDelete?.quotationNo}" কোটেশনটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`
                : `Are you sure you want to delete quotation "${quotationToDelete?.quotationNo}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteQuotation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isBangla ? 'মুছে ফেলুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Quotation Row Component
interface QuotationRowProps {
  quotation: Quotation;
  isBangla: boolean;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onConvert: () => void;
  onDelete: () => void;
}

function QuotationRow({ quotation, isBangla, index, onView, onEdit, onConvert, onDelete }: QuotationRowProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useDateFormat();
  
  const statusConfig = QUOTATION_STATUS_CONFIG[quotation.status];
  
  const isExpired = new Date(quotation.validityDate) < new Date() && quotation.status === 'sent';
  
  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group stagger-item"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          quotation.status === 'converted' ? 'bg-indigo-subtle' :
          quotation.status === 'accepted' ? 'bg-success-subtle' :
          quotation.status === 'rejected' ? 'bg-destructive-subtle' :
          'bg-primary-subtle'
        )}>
          <FileText className={cn(
            "h-5 w-5",
            quotation.status === 'converted' ? 'text-indigo' :
            quotation.status === 'accepted' ? 'text-success' :
            quotation.status === 'rejected' ? 'text-destructive' :
            'text-primary'
          )} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">{quotation.quotationNo}</p>
            <Badge variant={statusConfig.variant} size="sm">
              {isBangla ? statusConfig.labelBn : statusConfig.label}
            </Badge>
            {isExpired && (
              <Badge variant="destructive" size="sm">
                {isBangla ? 'মেয়াদ শেষ' : 'Expired'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {quotation.partyName || (isBangla ? 'সাধারণ গ্রাহক' : 'Walk-in customer')}
            {' • '}
            {quotation.items.length} {isBangla ? 'পণ্য' : 'items'}
            {' • '}
            {isBangla ? 'তারিখ' : 'Date'}: {formatDate(quotation.quotationDate)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBangla ? 'মেয়াদ' : 'Valid until'}: {formatDate(quotation.validityDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-foreground text-lg">
            {formatCurrency(quotation.total)}
          </p>
          {quotation.discount > 0 && (
            <span className="text-xs text-primary">
              {isBangla ? 'ছাড়' : 'Discount'}: {formatCurrency(quotation.discount)}
            </span>
          )}
          {quotation.convertedToSaleId && (
            <p className="text-xs text-indigo">
              {isBangla ? 'বিক্রিতে রূপান্তরিত' : 'Converted to sale'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {(quotation.status === 'draft' || quotation.status === 'sent') && (
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {quotation.status === 'accepted' && (
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onConvert(); }} title={isBangla ? 'বিক্রিতে রূপান্তর' : 'Convert to Sale'}>
              <ShoppingCart className="h-4 w-4 text-emerald" />
            </Button>
          )}
          {quotation.status === 'draft' && (
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
