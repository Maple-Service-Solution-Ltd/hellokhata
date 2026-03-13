// Hello Khata OS - Batch Management Page
// হ্যালো খাতা - ব্যাচ ম্যানেজমেন্ট

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
  Package,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCurrency } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useQuery } from '@tanstack/react-query';

interface Batch {
  id: string;
  batchNo: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  remainingQuantity: number;
  manufacturingDate?: string;
  expiryDate?: string;
  purchasePrice: number;
  mrp?: number;
  status: 'active' | 'expired' | 'depleted' | 'recall';
  location?: string;
  createdAt: string;
}

// Fetch batches
async function fetchBatches(): Promise<Batch[]> {
  const res = await fetch('/api/batches');
  if (!res.ok) throw new Error('Failed to fetch batches');
  return res.json();
}

// Get days until expiry
function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function BatchManagementPage() {
  const { isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: fetchBatches,
  });

  // Calculate stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'active').length;
  const expiredBatches = batches.filter(b => b.status === 'expired').length;
  const expiringSoonBatches = batches.filter(b => {
    if (!b.expiryDate || b.status !== 'active') return false;
    const days = getDaysUntilExpiry(b.expiryDate);
    return days > 0 && days <= 30;
  }).length;

  // Filter batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    
    // Expiry filter
    let matchesExpiry = true;
    if (expiryFilter === 'expired' && batch.expiryDate) {
      matchesExpiry = getDaysUntilExpiry(batch.expiryDate) <= 0;
    } else if (expiryFilter === '30days' && batch.expiryDate) {
      const days = getDaysUntilExpiry(batch.expiryDate);
      matchesExpiry = days > 0 && days <= 30;
    } else if (expiryFilter === '90days' && batch.expiryDate) {
      const days = getDaysUntilExpiry(batch.expiryDate);
      matchesExpiry = days > 0 && days <= 90;
    }
    
    return matchesSearch && matchesStatus && matchesExpiry;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {isBangla ? 'ব্যাচ ম্যানেজমেন্ট' : 'Batch Management'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'ব্যাচ ট্র্যাকিং ও মেয়াদ পর্যবেক্ষণ' : 'Batch tracking and expiry monitoring'}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {isBangla ? 'রিপোর্ট' : 'Report'}
        </Button>
      </div>

      {/* Alert for expiring batches */}
      {expiringSoonBatches > 0 && (
        <Card className="border-warning bg-warning-subtle">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {isBangla ? `${expiringSoonBatches}টি ব্যাচ ৩০ দিনের মধ্যে মেয়াদ শেষ হবে` : `${expiringSoonBatches} batches expiring within 30 days`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isBangla ? 'অবিলম্বে পদক্ষেপ নিন' : 'Take action immediately'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpiryFilter('30days')}
            >
              {isBangla ? 'দেখুন' : 'View'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Batches"
          titleBn="মোট ব্যাচ"
          value={totalBatches}
          icon={<Package className="h-5 w-5" />}
          iconColor="default"
          isBangla={isBangla}
        />
        <KPICard
          title="Active"
          titleBn="সক্রিয়"
          value={activeBatches}
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor="success"
          isBangla={isBangla}
        />
        <KPICard
          title="Expiring Soon"
          titleBn="শীঘ্রই মেয়াদ শেষ"
          value={expiringSoonBatches}
          icon={<Clock className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
        <KPICard
          title="Expired"
          titleBn="মেয়াদ শেষ"
          value={expiredBatches}
          icon={<AlertCircle className="h-5 w-5" />}
          iconColor="destructive"
          isBangla={isBangla}
        />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="default">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'ব্যাচ নম্বর বা পণ্য খুঁজুন...' : 'Search batch or item...'}
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
              <SelectItem value="active">{isBangla ? 'সক্রিয়' : 'Active'}</SelectItem>
              <SelectItem value="expired">{isBangla ? 'মেয়াদ শেষ' : 'Expired'}</SelectItem>
              <SelectItem value="depleted">{isBangla ? 'নিঃশেষ' : 'Depleted'}</SelectItem>
              <SelectItem value="recall">{isBangla ? 'প্রত্যাহার' : 'Recall'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={expiryFilter} onValueChange={setExpiryFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={isBangla ? 'মেয়াদ' : 'Expiry'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
              <SelectItem value="expired">{isBangla ? 'মেয়াদ শেষ' : 'Expired'}</SelectItem>
              <SelectItem value="30days">{isBangla ? '৩০ দিনের মধ্যে' : 'Within 30 days'}</SelectItem>
              <SelectItem value="90days">{isBangla ? '৯০ দিনের মধ্যে' : 'Within 90 days'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Batches List */}
      <Card variant="elevated" padding="none">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base">
            {isBangla ? 'ব্যাচের তালিকা' : 'Batch List'}
          </CardTitle>
        </CardHeader>
        <Divider />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredBatches.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title={isBangla ? 'কোনো ব্যাচ নেই' : 'No batches found'}
              description={isBangla ? 'কোনো ব্যাচ পাওয়া যায়নি' : 'No batches to display'}
              isBangla={isBangla}
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border-subtle">
                {filteredBatches.map((batch, index) => (
                  <BatchRow
                    key={batch.id}
                    batch={batch}
                    isBangla={isBangla}
                    index={index}
                    onView={() => setSelectedBatch(batch)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Batch Detail Modal */}
      <DetailModal
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        title={selectedBatch?.batchNo || ''}
        subtitle={isBangla ? 'ব্যাচের বিবরণ' : 'Batch Details'}
        width="lg"
      >
        {selectedBatch && (
          <>
            <DetailSection title={isBangla ? 'ব্যাচের তথ্য' : 'Batch Information'}>
              <DetailRow
                label={isBangla ? 'পণ্য' : 'Item'}
                value={selectedBatch.itemName}
              />
              <DetailRow
                label={isBangla ? 'SKU' : 'SKU'}
                value={selectedBatch.sku}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={<BatchStatusBadge status={selectedBatch.status} isBangla={isBangla} />}
              />
              <DetailRow
                label={isBangla ? 'পরিমাণ' : 'Quantity'}
                value={`${selectedBatch.remainingQuantity} / ${selectedBatch.quantity}`}
              />
              <DetailRow
                label={isBangla ? 'ক্রয় মূল্য' : 'Purchase Price'}
                value={formatCurrency(selectedBatch.purchasePrice)}
              />
              {selectedBatch.mrp && (
                <DetailRow
                  label={isBangla ? 'MRP' : 'MRP'}
                  value={formatCurrency(selectedBatch.mrp)}
                />
              )}
              {selectedBatch.manufacturingDate && (
                <DetailRow
                  label={isBangla ? 'উৎপাদন তারিখ' : 'Mfg Date'}
                  value={new Date(selectedBatch.manufacturingDate).toLocaleDateString()}
                />
              )}
              {selectedBatch.expiryDate && (
                <DetailRow
                  label={isBangla ? 'মেয়াদ শেষের তারিখ' : 'Expiry Date'}
                  value={
                    <span className={cn(
                      getDaysUntilExpiry(selectedBatch.expiryDate) <= 30 && 'text-warning font-medium',
                      getDaysUntilExpiry(selectedBatch.expiryDate) <= 0 && 'text-destructive font-medium'
                    )}>
                      {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                      {getDaysUntilExpiry(selectedBatch.expiryDate) > 0 && (
                        <span className="text-muted-foreground ml-2">
                          ({getDaysUntilExpiry(selectedBatch.expiryDate)} {isBangla ? 'দিন বাকি' : 'days left'})
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {selectedBatch.location && (
                <DetailRow
                  label={isBangla ? 'অবস্থান' : 'Location'}
                  value={selectedBatch.location}
                />
              )}
            </DetailSection>
          </>
        )}
      </DetailModal>
    </div>
  );
}

// Batch Status Badge
function BatchStatusBadge({ status, isBangla }: { status: string; isBangla: boolean }) {
  const config: Record<string, { label: string; labelBn: string; variant: 'success' | 'warning' | 'destructive' | 'indigo' }> = {
    active: { label: 'Active', labelBn: 'সক্রিয়', variant: 'success' },
    expired: { label: 'Expired', labelBn: 'মেয়াদ শেষ', variant: 'destructive' },
    depleted: { label: 'Depleted', labelBn: 'নিঃশেষ', variant: 'indigo' },
    recall: { label: 'Recall', labelBn: 'প্রত্যাহার', variant: 'warning' },
  };
  const { label, labelBn, variant } = config[status] || config.active;
  return <Badge variant={variant}>{isBangla ? labelBn : label}</Badge>;
}

// Batch Row Component
function BatchRow({ batch, isBangla, index, onView }: { batch: Batch; isBangla: boolean; index: number; onView: () => void }) {
  const { formatCurrency } = useCurrency();
  
  const daysUntilExpiry = batch.expiryDate ? getDaysUntilExpiry(batch.expiryDate) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onView}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          batch.status === 'expired' || isExpired ? "bg-destructive-subtle" :
          isExpiringSoon ? "bg-warning-subtle" :
          batch.status === 'depleted' ? "bg-indigo-subtle" :
          "bg-emerald-subtle"
        )}>
          <Package className={cn(
            "h-5 w-5",
            batch.status === 'expired' || isExpired ? "text-destructive" :
            isExpiringSoon ? "text-warning" :
            batch.status === 'depleted' ? "text-indigo" :
            "text-emerald"
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{batch.batchNo}</p>
            <BatchStatusBadge status={batch.status} isBangla={isBangla} />
            {isExpiringSoon && batch.status === 'active' && (
              <Badge variant="warning" size="sm">
                <Clock className="h-3 w-3 mr-1" />
                {daysUntilExpiry}d
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {batch.itemName} • {batch.remainingQuantity}/{batch.quantity} {isBangla ? 'ইউনিট' : 'units'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-bold text-foreground">
            {formatCurrency(batch.purchasePrice)}
          </p>
          {batch.expiryDate && (
            <p className={cn(
              "text-xs",
              isExpired ? "text-destructive" : isExpiringSoon ? "text-warning" : "text-muted-foreground"
            )}>
              {isBangla ? 'মেয়াদ' : 'Exp'}: {new Date(batch.expiryDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
