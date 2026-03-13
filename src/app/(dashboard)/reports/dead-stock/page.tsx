// Hello Khata OS - Dead Stock Report Page
// হ্যালো খাতা - ডেড স্টক রিপোর্ট পেজ

'use client';

import { FeatureGate, PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeadStockReport } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowRight,
  Tag,
  RotateCcw,
  Gift,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DeadStockReportPage() {
  const { isBangla } = useAppTranslation();
  const { data: deadStock, isLoading } = useDeadStockReport();

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>

    );
  }

  const totalValue = deadStock?.reduce((sum, item) => sum + item.stockValue, 0) || 0;
  const highPriority = deadStock?.filter(i => i.priority === 'high').length || 0;

  return (
    <FeatureGate feature="deadStockAnalysis">

        <div className="space-y-6">
          <PageHeader
            title={isBangla ? 'অচল মজুদ রিপোর্ট' : 'Dead Stock Report'}
            subtitle={isBangla ? 'দীর্ঘদিন বিক্রি না হওয়া পণ্য' : 'Items that haven\'t sold in a long time'}
            icon={Package}
          />

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{isBangla ? 'মোট পণ্য' : 'Total Items'}</p>
                <p className="text-3xl font-bold text-red-500">{deadStock?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{isBangla ? 'মোট মূল্য' : 'Total Value'}</p>
                <p className="text-3xl font-bold">৳{totalValue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{isBangla ? 'জরুরি পদক্ষেপ' : 'Urgent Action'}</p>
                <p className="text-3xl font-bold text-orange-500">{highPriority}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dead Stock List */}
          <Card>
            <CardHeader>
              <CardTitle>{isBangla ? 'অচল পণ্যের তালিকা' : 'Dead Stock List'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadStock?.map((item) => (
                  <div 
                    key={item.itemId}
                    className={cn(
                      'p-4 rounded-lg border',
                      item.priority === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
                      item.priority === 'medium' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950' :
                      'border-gray-200 bg-gray-50 dark:bg-gray-900'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          item.priority === 'high' ? 'bg-red-100 dark:bg-red-900' :
                          item.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900' :
                          'bg-gray-100 dark:bg-gray-800'
                        )}>
                          <Package className={cn(
                            'w-5 h-5',
                            item.priority === 'high' ? 'text-red-500' :
                            item.priority === 'medium' ? 'text-amber-500' :
                            'text-gray-400'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.daysWithoutSale} {isBangla ? 'দিন' : 'days'}
                            </span>
                            <span>৳{item.stockValue.toLocaleString()}</span>
                            <span>{item.currentStock} {isBangla ? 'ইউনিট' : 'units'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={cn(
                            item.suggestedAction === 'discount' && 'border-green-500 text-green-700',
                            item.suggestedAction === 'return' && 'border-blue-500 text-blue-700',
                            item.suggestedAction === 'donate' && 'border-purple-500 text-purple-700',
                            item.suggestedAction === 'write_off' && 'border-gray-500 text-gray-700'
                          )}
                        >
                          {item.suggestedAction === 'discount' && <Tag className="w-3 h-3 mr-1" />}
                          {item.suggestedAction === 'return' && <RotateCcw className="w-3 h-3 mr-1" />}
                          {item.suggestedAction === 'donate' && <Gift className="w-3 h-3 mr-1" />}
                          {item.suggestedAction === 'write_off' && <Trash2 className="w-3 h-3 mr-1" />}
                          {item.suggestedAction === 'discount' ? (isBangla ? 'ডিসকাউন্ট' : 'Discount') :
                           item.suggestedAction === 'return' ? (isBangla ? 'ফেরত' : 'Return') :
                           item.suggestedAction === 'donate' ? (isBangla ? 'দান' : 'Donate') :
                           (isBangla ? 'খরচ' : 'Write-off')}
                        </Badge>
                        <Badge 
                          className={cn(
                            item.priority === 'high' && 'bg-red-500',
                            item.priority === 'medium' && 'bg-amber-500',
                            item.priority === 'low' && 'bg-gray-500'
                          )}
                        >
                          {item.priority === 'high' ? (isBangla ? 'জরুরি' : 'High') :
                           item.priority === 'medium' ? (isBangla ? 'মাঝারি' : 'Medium') :
                           (isBangla ? 'কম' : 'Low')}
                        </Badge>
                      </div>
                    </div>
                    {item.lastSaleDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        {isBangla ? 'সর্বশেষ বিক্রি:' : 'Last sold:'} {new Date(item.lastSaleDate).toLocaleDateString(isBangla ? 'bn-BD' : 'en-US')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </FeatureGate>
  );
}
