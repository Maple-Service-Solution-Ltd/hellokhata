'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Plus,
  AlertTriangle,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useGetBatches, useGetBatchesStatus } from '@/hooks/api/useBatches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Batch {
  id: string;
  batchNumber: string;
  itemId: string;
  itemName?: string;
  quantity: number;
  costPrice: number;
  expiryDate?: string;
  manufactureDate?: string;
  daysUntilExpiry?: number | null;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function BatchesPage() {
  const { t, isBangla } = useAppTranslation();
  const [searchQuery, setSearchQuery] = useState('');
const [filter, setFilter] = useState<
   'expired' | 'expiring' | 'active' | 'inactive' | undefined
>(undefined);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // const [expiringSummary, setExpiringSummary] = useState<{
  //   expiringCount: number;
  //   expiredCount: number;
  //   expiringValue: number;
  //   expiredValue: number;
  // } | null>(null);

const {data: batchesStatusData} = useGetBatchesStatus();
const {data:batchesData, isLoading:isLoadingBatches} = useGetBatches(
 {search: searchQuery,status: filter }
)
const batchesStatus = batchesStatusData?.data;
const batches = batchesData?.data || [];
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/inventory')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isBangla ? 'ব্যাচ ট্র্যাকিং' : 'Batch Tracking'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `${batches.length}টি ব্যাচ` 
                    : `${batches.length} batches`}
                </p>
              </div>
            </div>
            
            <Button onClick={() => router.push('new')}>
              <Plus className="h-4 w-4 mr-2" />
              {isBangla ? 'নতুন ব্যাচ' : 'Add Batch'}
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {/* {expiringSummary && (expiringSummary.expiredCount > 0 || expiringSummary.expiringCount > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Bell className="h-5 w-5 text-amber-600 animate-pulse" />
                <div>
                  {expiringSummary.expiredCount > 0 && (
                    <span className="text-red-700 font-medium">
                      {expiringSummary.expiredCount} {isBangla ? 'মেয়াদোত্তীর্ণ' : 'expired'} 
                      {' '}(৳{expiringSummary.expiredValue.toLocaleString()})
                    </span>
                  )}
                  {expiringSummary.expiringCount > 0 && (
                    <span className="text-amber-700 font-medium ml-4">
                      {expiringSummary.expiringCount} {isBangla ? 'শীঘ্রই মেয়াদ শেষ' : 'expiring soon'}
                      {' '}(৳{expiringSummary.expiringValue.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {expiringSummary.expiredCount > 0 && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setFilter('expired')}
                  >
                    {isBangla ? 'মেয়াদোত্তীর্ণ দেখুন' : 'View Expired'}
                  </Button>
                )}
                {expiringSummary.expiringCount > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setFilter('expiring')}
                  >
                    {isBangla ? 'শীঘ্রই মেয়াদ শেষ' : 'View Expiring'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট ব্যাচ' : 'Total Batches'}
                  </p>
                  <p className="text-xl font-bold">{batchesStatus?.totalBatches || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700">
                    {isBangla ? 'মেয়াদোত্তীর্ণ' : 'Expired'}
                  </p>
                  <p className="text-xl font-bold text-red-700">
                    {batchesStatus?.expired || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-amber-700">
                    {isBangla ? '৩০ দিনের মধ্যে' : 'Expiring in 30 Days'}
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {batchesStatus?.expiringIn30Days || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'সক্রিয় ব্যাচ' : 'Active Batches'}
                  </p>
                  <p className="text-xl font-bold">
                    {batchesStatus?.activeBatches || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'ব্যাচ নম্বর বা পণ্য খুঁজুন...' : 'Search batch or product...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
             <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
  <SelectTrigger className="w-full md:w-[180px]">
    <SelectValue placeholder={isBangla ? 'ধরন' : 'Type'} />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value=" ">
      {isBangla ? 'সব' : 'All'}
    </SelectItem>

    <SelectItem value="expired">
      {isBangla ? 'মেয়াদোত্তীর্ণ' : 'Expired'}
    </SelectItem>

    <SelectItem value="expiring">
      {isBangla ? 'শীঘ্রই মেয়াদোত্তীর্ণ' : 'Expiring Soon'}
    </SelectItem>

    <SelectItem value="active">
      {isBangla ? 'সক্রিয়' : 'Active'}
    </SelectItem>
     <SelectItem value="inactive">
      {isBangla ? 'নিষ্ক্রিয়' : 'Inactive'}
    </SelectItem>
  </SelectContent>
</Select>
          </div>
        </div>
      </div>

      {/* Batches List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isLoadingBatches ? (
          <div className="text-center py-12">
            <Package className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
            </p>
          </div>
        ) : batches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                {isBangla ? 'কোন ব্যাচ নেই' : 'No batches found'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isBangla 
                  ? 'ব্যাচ ট্র্যাকিং সক্রিয় করা আইটেমগুলোর জন্য ব্যাচ যোগ করুন'
                  : 'Add batches for items with batch tracking enabled'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <Card 
                key={batch.id}
                className={cn(
                  "cursor-pointer hover:border-primary/50 transition-colors",
                  batch.isExpired && "border-red-300 bg-red-50/50",
                  batch.isExpiringSoon && !batch.isExpired && "border-amber-300 bg-amber-50/50"
                )}
                onClick={() => setSelectedBatch(batch)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center",
                        batch.isExpired ? "bg-red-100" : batch.isExpiringSoon ? "bg-amber-100" : "bg-indigo-100"
                      )}>
                        <Package className={cn(
                          "h-6 w-6",
                          batch.isExpired ? "text-red-600" : batch.isExpiringSoon ? "text-amber-600" : "text-indigo-600"
                        )} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{batch.batchNumber}</h3>
                          {/*  {batches(batch)}  */}
                          {batch.isExpired ? (
                            <Badge variant="destructive" size="sm">
                              {isBangla ? 'মেয়াদোত্তীর্ণ' : 'Expired'}
                            </Badge>
                          ) : batch.isExpiringSoon ? (
                            <Badge variant="warning" size="sm">
                              {isBangla ? 'শীঘ্রই মেয়াদ শেষ' : 'Expiring Soon'}
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              {isBangla ? 'সক্রিয়' : 'Active'}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="mt-1 text-sm text-muted-foreground">
                          {batch.itemName || 'Unknown Item'}
                        </p>
                        
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{batch.quantity} {batch.item?.unit || 'pcs'}</span>
                          <span>৳{batch.costPrice}/unit</span>
                          <span>
                            {isBangla ? 'মোট' : 'Total'}: ৳{(batch.quantity * batch.costPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ৳{(batch.quantity * batch.costPrice).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {batch.quantity} {batch.item?.unit || 'pcs'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-[400px] max-w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedBatch?.batchNumber}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedBatch(null)}
              >
                ×
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'পণ্য' : 'Product'}
                  </p>
                  <p className="font-medium">{selectedBatch?.itemName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'পরিমাণ' : 'Quantity'}
                  </p>
                  <p className="font-medium">{selectedBatch.quantity} </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'ক্রয় মূল্য' : 'Cost Price'}
                  </p>
                  <p className="font-medium">৳{selectedBatch.costPrice}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মেয়াদ শেষ' : 'Expiry Date'}
                  </p>
                  <p className="font-medium">
                    {selectedBatch.expiryDate 
                      ? format(new Date(selectedBatch.expiryDate), 'dd MMMM yyyy')
                      : (isBangla ? 'নেই' : 'Not set')}
                  </p>
                </div>
                
                {selectedBatch.manufactureDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isBangla ? 'উৎপাদনের তারিখ' : 'Manufacture Date'}
                    </p>
                    <p className="font-medium">
                      {format(new Date(selectedBatch.manufactureDate), 'dd MMMM yyyy')}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট মূল্য' : 'Total Value'}
                  </p>
                  <p className="font-bold text-lg">
                    ৳{(selectedBatch.quantity * selectedBatch.costPrice).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedBatch.isExpired && (
                <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {isBangla ? 'এই ব্যাচের মেয়াদ শেষ হয়েছে!' : 'This batch has expired!'}
                    </span>
                  </div>
                </div>
              )}
              
              {selectedBatch.isExpiringSoon && !selectedBatch.isExpired && (
                <div className="p-3 bg-amber-100 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      {isBangla 
                        ? `${selectedBatch.daysUntilExpiry} দিনের মধ্যে মেয়াদ শেষ হবে!`
                        : `Expires in ${selectedBatch.daysUntilExpiry} days!`}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                  {isBangla ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
