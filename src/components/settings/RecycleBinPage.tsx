// Hello Khata OS - Recycle Bin Page
// হ্যালো খাতা - রিসাইকেল বিন

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, KPICard, Divider, EmptyState } from '@/components/ui/premium';
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
  Trash2,
  Search,
  RotateCcw,
  Clock,
  Eye,
  AlertTriangle,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
  AlertCircle,
  Trash,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCurrency } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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

interface DeletedRecord {
  id: string;
  type: 'item' | 'party' | 'sale' | 'purchase' | 'expense';
  name: string;
  deletedAt: string;
  deletedBy?: string;
  canRestore: boolean;
  data?: Record<string, unknown>;
}

// Fetch deleted records
async function fetchDeletedRecords(): Promise<DeletedRecord[]> {
  const res = await fetch('/api/trash');
  if (!res.ok) throw new Error('Failed to fetch deleted records');
  return res.json();
}

// Restore record
async function restoreRecord(id: string, type: string): Promise<void> {
  const res = await fetch(`/api/trash/${id}/restore`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  if (!res.ok) throw new Error('Failed to restore');
}

// Permanently delete
async function permanentDelete(id: string, type: string): Promise<void> {
  const res = await fetch(`/api/trash/${id}?type=${type}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete permanently');
}

export default function RecycleBinPage() {
  const { isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<DeletedRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['deleted-records'],
    queryFn: fetchDeletedRecords,
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => restoreRecord(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-records'] });
      toast({ title: isBangla ? 'পুনরুদ্ধার সফল' : 'Restored successfully', variant: 'success' });
      setSelectedRecord(null);
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error restoring', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => permanentDelete(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deleted-records'] });
      toast({ title: isBangla ? 'স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'Permanently deleted', variant: 'success' });
      setSelectedRecord(null);
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error deleting', variant: 'destructive' });
    }
  });

  // Calculate stats
  const totalRecords = records.length;
  const itemsCount = records.filter(r => r.type === 'item').length;
  const partiesCount = records.filter(r => r.type === 'party').length;
  const transactionsCount = records.filter(r => ['sale', 'purchase', 'expense'].includes(r.type)).length;

  // Get days until permanent deletion (30 days policy)
  const getDaysUntilDeletion = (deletedAt: string): number => {
    const deleted = new Date(deletedAt);
    const autoDelete = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = autoDelete.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleRestore = (id: string, type: string) => {
    restoreMutation.mutate({ id, type });
  };

  const handlePermanentDelete = (id: string, type: string) => {
    deleteMutation.mutate({ id, type });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-primary" />
            {isBangla ? 'রিসাইকেল বিন' : 'Recycle Bin'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'মুছে ফেলা রেকর্ড পুনরুদ্ধার করুন' : 'Restore deleted records'}
          </p>
        </div>
      </div>

      {/* Warning */}
      {totalRecords > 0 && (
        <Card className="border-warning bg-warning-subtle">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {isBangla ? 'রেকর্ড ৩০ দিন পর স্থায়ীভাবে মুছে যাবে' : 'Records are permanently deleted after 30 days'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isBangla ? 'গুরুত্বপূর্ণ রেকর্ড পুনরুদ্ধার করুন' : 'Restore important records before they are gone'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Deleted"
          titleBn="মোট মুছে ফেলা"
          value={totalRecords}
          icon={<Trash2 className="h-5 w-5" />}
          iconColor="destructive"
          isBangla={isBangla}
        />
        <KPICard
          title="Items"
          titleBn="পণ্য"
          value={itemsCount}
          icon={<Package className="h-5 w-5" />}
          iconColor="default"
          isBangla={isBangla}
        />
        <KPICard
          title="Parties"
          titleBn="পার্টি"
          value={partiesCount}
          icon={<Users className="h-5 w-5" />}
          iconColor="indigo"
          isBangla={isBangla}
        />
        <KPICard
          title="Transactions"
          titleBn="লেনদেন"
          value={transactionsCount}
          icon={<Receipt className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="default">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'রেকর্ড খুঁজুন...' : 'Search records...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={isBangla ? 'ধরন' : 'Type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
              <SelectItem value="item">{isBangla ? 'পণ্য' : 'Item'}</SelectItem>
              <SelectItem value="party">{isBangla ? 'পার্টি' : 'Party'}</SelectItem>
              <SelectItem value="sale">{isBangla ? 'বিক্রি' : 'Sale'}</SelectItem>
              <SelectItem value="purchase">{isBangla ? 'ক্রয়' : 'Purchase'}</SelectItem>
              <SelectItem value="expense">{isBangla ? 'খরচ' : 'Expense'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Deleted Records List */}
      <Card variant="elevated" padding="none">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base">
            {isBangla ? 'মুছে ফেলা রেকর্ড' : 'Deleted Records'}
          </CardTitle>
        </CardHeader>
        <Divider />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={<Trash2 className="h-8 w-8" />}
              title={isBangla ? 'রিসাইকেল বিন খালি' : 'Recycle bin is empty'}
              description={isBangla ? 'কোনো মুছে ফেলা রেকর্ড নেই' : 'No deleted records to display'}
              isBangla={isBangla}
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border-subtle">
                {filteredRecords.map((record, index) => (
                  <DeletedRow
                    key={record.id}
                    record={record}
                    isBangla={isBangla}
                    index={index}
                    onView={() => setSelectedRecord(record)}
                    onRestore={() => handleRestore(record.id, record.type)}
                    onDelete={() => handlePermanentDelete(record.id, record.type)}
                    daysLeft={getDaysUntilDeletion(record.deletedAt)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Record Detail Modal */}
      <DetailModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.name || ''}
        subtitle={isBangla ? 'মুছে ফেলা রেকর্ডের বিবরণ' : 'Deleted Record Details'}
        width="lg"
      >
        {selectedRecord && (
          <>
            <DetailSection title={isBangla ? 'রেকর্ডের তথ্য' : 'Record Information'}>
              <DetailRow
                label={isBangla ? 'ধরন' : 'Type'}
                value={<TypeBadge type={selectedRecord.type} isBangla={isBangla} />}
              />
              <DetailRow
                label={isBangla ? 'নাম' : 'Name'}
                value={selectedRecord.name}
              />
              <DetailRow
                label={isBangla ? 'মুছে ফেলার তারিখ' : 'Deleted At'}
                value={new Date(selectedRecord.deletedAt).toLocaleString()}
              />
              {selectedRecord.deletedBy && (
                <DetailRow
                  label={isBangla ? 'মুছে ফেলেছে' : 'Deleted By'}
                  value={selectedRecord.deletedBy}
                />
              )}
              <DetailRow
                label={isBangla ? 'স্থায়ী মুছে ফেলার বাকি' : 'Days Until Permanent Deletion'}
                value={
                  <Badge variant={getDaysUntilDeletion(selectedRecord.deletedAt) <= 7 ? 'destructive' : 'warning'}>
                    {getDaysUntilDeletion(selectedRecord.deletedAt)} {isBangla ? 'দিন' : 'days'}
                  </Badge>
                }
              />
            </DetailSection>

            <div className="mt-6 flex gap-3">
              <Button
                variant="success"
                className="flex-1 gap-2"
                onClick={() => handleRestore(selectedRecord.id, selectedRecord.type)}
                disabled={restoreMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                {isBangla ? 'পুনরুদ্ধার' : 'Restore'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash className="h-4 w-4" />
                    {isBangla ? 'স্থায়ীভাবে মুছুন' : 'Delete Forever'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{isBangla ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isBangla 
                        ? 'এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না। রেকর্ড স্থায়ীভাবে মুছে যাবে।'
                        : 'This action cannot be undone. The record will be permanently deleted.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handlePermanentDelete(selectedRecord.id, selectedRecord.type)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isBangla ? 'মুছে ফেলুন' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}

// Type Badge
function TypeBadge({ type, isBangla }: { type: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'default' | 'warning' | 'indigo' | 'success' | 'destructive'; icon: React.ReactNode }> = {
    item: { label: 'Item', labelBn: 'পণ্য', variant: 'default', icon: <Package className="h-3 w-3" /> },
    party: { label: 'Party', labelBn: 'পার্টি', variant: 'indigo', icon: <Users className="h-3 w-3" /> },
    sale: { label: 'Sale', labelBn: 'বিক্রি', variant: 'success', icon: <ShoppingCart className="h-3 w-3" /> },
    purchase: { label: 'Purchase', labelBn: 'ক্রয়', variant: 'indigo', icon: <FileText className="h-3 w-3" /> },
    expense: { label: 'Expense', labelBn: 'খরচ', variant: 'destructive', icon: <Receipt className="h-3 w-3" /> },
  };
  const { label, labelBn, variant, icon } = config[type] || config.item;
  return <Badge variant={variant} className="gap-1">{icon}{isBangla ? labelBn : label}</Badge>;
}

// Deleted Row Component
function DeletedRow({ 
  record, 
  isBangla, 
  index, 
  onView, 
  onRestore, 
  onDelete,
  daysLeft
}: { 
  record: DeletedRecord; 
  isBangla: boolean; 
  index: number; 
  onView: () => void;
  onRestore: () => void;
  onDelete: () => void;
  daysLeft: number;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1" onClick={onView}>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-muted"
        )}>
          <Trash2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{record.name}</p>
            <TypeBadge type={record.type} isBangla={isBangla} />
            {daysLeft <= 7 && (
              <Badge variant="destructive" size="sm" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {daysLeft}d
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'মুছে ফেলা হয়েছে' : 'Deleted'}: {new Date(record.deletedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="gap-1" onClick={onRestore}>
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{isBangla ? 'পুনরুদ্ধার' : 'Restore'}</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
