// Hello Khata OS - Dead Stock Card Component
// হ্যালো খাতা - ডেড স্টক কার্ড কম্পোনেন্ট

'use client';

import { useDeadStockReport } from '@/hooks/queries';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DeadStockCardProps {
  compact?: boolean;
}

export function DeadStockCard({ compact = false }: DeadStockCardProps) {
  const { isBangla } = useAppTranslation();
  const { data: deadStock, isLoading } = useDeadStockReport();
  const featureAccess = useFeatureAccess('deadStockAnalysis');

  if (!featureAccess.isUnlocked) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-red-500" />
            {isBangla ? 'অচল মজুদ বিশ্লেষণ' : 'Dead Stock Analysis'}
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">PRO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-xs text-gray-500">
              {isBangla ? 'প্রো প্ল্যানে এই ফিচারটি পান' : 'Get this feature with Pro plan'}
            </p>
            <Button size="sm" variant="outline" className="mt-2" asChild>
              <Link href="/settings#subscription">
                <Sparkles className="w-3 h-3 mr-1" />
                {isBangla ? 'আপগ্রেড' : 'Upgrade'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !deadStock?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-red-500" />
            {isBangla ? 'অচল মজুদ' : 'Dead Stock'}
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </CardContent>
      </Card>
    );
  }

  // Calculate summary
  const totalValue = deadStock.reduce((sum, item) => sum + item.stockValue, 0);
  const totalItems = deadStock.length;
  const highPriority = deadStock.filter(i => i.priority === 'high').length;

  if (compact) {
    return (
      <Link href="/reports/dead-stock">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                highPriority > 0 ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <Package className={cn(
                  'w-6 h-6',
                  highPriority > 0 ? 'text-red-500' : 'text-gray-400'
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isBangla ? 'অচল মজুদ' : 'Dead Stock'}
                  </span>
                  {highPriority > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {highPriority} {isBangla ? 'জরুরি' : 'Urgent'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {totalItems} {isBangla ? 'টি পণ্য' : 'items'} • ৳{totalValue.toLocaleString()}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-red-500" />
            {isBangla ? 'অচল মজুদ সতর্কতা' : 'Dead Stock Alerts'}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports/dead-stock">
              {isBangla ? 'বিস্তারিত' : 'Details'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-500">{totalItems}</p>
            <p className="text-xs text-gray-500">{isBangla ? 'টি পণ্য' : 'Items'}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
            <p className="text-2xl font-bold">৳{totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{isBangla ? 'মূল্য' : 'Value'}</p>
          </div>
        </div>
        
        {/* Top Dead Stock Items */}
        <div className="space-y-2">
          {deadStock.slice(0, 3).map((item) => (
            <div 
              key={item.itemId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                item.priority === 'high' ? 'bg-red-100 dark:bg-red-900' :
                item.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900' :
                'bg-gray-100 dark:bg-gray-800'
              )}>
                <Package className={cn(
                  'w-4 h-4',
                  item.priority === 'high' ? 'text-red-500' :
                  item.priority === 'medium' ? 'text-amber-500' :
                  'text-gray-400'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.itemName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{item.daysWithoutSale} {isBangla ? 'দিন' : 'days'}</span>
                  <span>•</span>
                  <span>৳{item.stockValue.toLocaleString()}</span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  item.priority === 'high' ? 'border-red-200 text-red-700' :
                  item.priority === 'medium' ? 'border-amber-200 text-amber-700' :
                  'border-gray-200 text-gray-600'
                )}
              >
                {item.suggestedAction === 'discount' ? (isBangla ? 'ডিসকাউন্ট' : 'Discount') :
                 item.suggestedAction === 'return' ? (isBangla ? 'ফেরত' : 'Return') :
                 item.suggestedAction === 'donate' ? (isBangla ? 'দান' : 'Donate') :
                 (isBangla ? 'খরচ' : 'Write-off')}
              </Badge>
            </div>
          ))}
        </div>
        
        {/* Warning Banner */}
        {highPriority > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {isBangla ? `${highPriority}টি পণ্য জরুরি ব্যবস্থা প্রয়োজন` : `${highPriority} items need urgent action`}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  {isBangla 
                    ? 'এই পণ্যগুলো ৬০ দিনের বেশি বিক্রি হয়নি'
                    : 'These items have not sold in over 60 days'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeadStockCard;
