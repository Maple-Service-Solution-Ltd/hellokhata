'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Trash2,
  RotateCcw,
  Search,
  Package,
  User,
  FileText,
  Receipt,
  Calendar,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeletedItem {
  id: string;
  type: 'sale' | 'purchase' | 'item' | 'party' | 'expense';
  name: string;
  amount?: number;
  deletedAt: Date;
  deletedBy?: string;
}

export default function RecycleBinPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeletedItems();
  }, [typeFilter]);

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from an API that aggregates deleted records
      // For now, showing mock data structure
      const mockItems: DeletedItem[] = [
        // This would be populated from API
      ];
      setItems(mockItems);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    setRestoringId(item.id);
    try {
      // In production, this would call the restore API
      const response = await fetch(`/api/${item.type}s/${item.id}/restore`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchDeletedItems();
      }
    } catch (error) {
      console.error('Error restoring item:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (!confirm(isBangla 
      ? 'আপনি কি নিশ্চিত? এটি স্থায়ীভাবে মুছে যাবে এবং পুনরুদ্ধার করা যাবে না।'
      : 'Are you sure? This will permanently delete the item and cannot be undone.'
    )) {
      return;
    }
    
    try {
      // In production, this would call the permanent delete API
      const response = await fetch(`/api/${item.type}s/${item.id}?permanent=true`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchDeletedItems();
      }
    } catch (error) {
      console.error('Error permanently deleting:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <Receipt className="h-5 w-5 text-blue-600" />;
      case 'purchase':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'item':
        return <Package className="h-5 w-5 text-amber-600" />;
      case 'party':
        return <User className="h-5 w-5 text-emerald-600" />;
      case 'expense':
        return <FileText className="h-5 w-5 text-red-600" />;
      default:
        return <Trash2 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      sale: { bg: 'bg-blue-100 text-blue-700', text: isBangla ? 'বিক্রয়' : 'Sale' },
      purchase: { bg: 'bg-purple-100 text-purple-700', text: isBangla ? 'ক্রয়' : 'Purchase' },
      item: { bg: 'bg-amber-100 text-amber-700', text: isBangla ? 'পণ্য' : 'Item' },
      party: { bg: 'bg-emerald-100 text-emerald-700', text: isBangla ? 'পক্ষ' : 'Party' },
      expense: { bg: 'bg-red-100 text-red-700', text: isBangla ? 'খরচ' : 'Expense' },
    };
    
    const style = styles[type] || { bg: 'bg-gray-100 text-gray-700', text: type };
    
    return (
      <Badge className={cn('text-xs', style.bg)}>
        {style.text}
      </Badge>
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
                onClick={() => navigateTo('settings')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  {isBangla ? 'রিসাইকেল বিন' : 'Recycle Bin'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `${filteredItems.length}টি মুছে ফেলা আইটেম`
                    : `${filteredItems.length} deleted items`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">
              {isBangla 
                ? 'মুছে ফেলা আইটেম ৩০ দিন পর স্থায়ীভাবে মুছে যাবে। প্রয়োজনে পুনরুদ্ধার করুন।'
                : 'Deleted items are permanently removed after 30 days. Restore if needed.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isBangla ? 'মুছে ফেলা আইটেম খুঁজুন...' : 'Search deleted items...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{isBangla ? 'সব ধরন' : 'All Types'}</option>
            <option value="sale">{isBangla ? 'বিক্রয়' : 'Sales'}</option>
            <option value="purchase">{isBangla ? 'ক্রয়' : 'Purchases'}</option>
            <option value="item">{isBangla ? 'পণ্য' : 'Items'}</option>
            <option value="party">{isBangla ? 'পক্ষ' : 'Parties'}</option>
            <option value="expense">{isBangla ? 'খরচ' : 'Expenses'}</option>
          </select>
        </div>
      </div>

      {/* Deleted Items List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <Trash2 className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trash2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                {isBangla ? 'রিসাইকেল বিন খালি' : 'Recycle Bin is Empty'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isBangla 
                  ? 'কোন মুছে ফেলা আইটেম নেই'
                  : 'No deleted items to show'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold line-through text-muted-foreground">
                            {item.name}
                          </h3>
                          {getTypeBadge(item.type)}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {isBangla ? 'মুছেছে' : 'Deleted'}: {format(new Date(item.deletedAt), 'dd MMM yyyy')}
                          </span>
                          
                          {item.deletedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.deletedBy}
                            </span>
                          )}
                        </div>
                        
                        {item.amount !== undefined && (
                          <p className="mt-2 text-sm">
                            <span className="text-muted-foreground">{isBangla ? 'পরিমাণ' : 'Amount'}:</span>{' '}
                            <span className="font-medium">৳{item.amount.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {isBangla ? 'পুনরুদ্ধার' : 'Restore'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handlePermanentDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">
                  {isBangla ? 'স্বয়ংক্রিয় মুছে ফেলা' : 'Auto-Delete Policy'}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {isBangla 
                    ? 'মুছে ফেলা আইটেম ৩০ দিন পর স্বয়ংক্রিয়ভাবে স্থায়ীভাবে মুছে যাবে।'
                    : 'Deleted items are automatically permanently deleted after 30 days.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
