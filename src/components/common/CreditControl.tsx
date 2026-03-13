// Hello Khata OS - Credit Control Components
// হ্যালো খাতা - ক্রেডিট কন্ট্রোল কম্পোনেন্ট

'use client';

import { useState } from 'react';
import { useCreditAgingReport, useCreditLimitCheck } from '@/hooks/queries';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CreditCard,
  Clock,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Risk Badge Component
export function RiskBadge({ riskLevel, score }: { riskLevel: 'low' | 'medium' | 'high'; score?: number }) {
  const { isBangla } = useAppTranslation();
  
  const config = {
    low: {
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      label: isBangla ? 'কম ঝুঁকি' : 'Low Risk',
    },
    medium: {
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      label: isBangla ? 'মাঝারি ঝুঁকি' : 'Medium Risk',
    },
    high: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      label: isBangla ? 'উচ্চ ঝুঁকি' : 'High Risk',
    },
  };
  
  const { color, icon: Icon, label } = config[riskLevel];
  
  return (
    <Badge variant="outline" className={cn('gap-1', color)}>
      <Icon className="w-3 h-3" />
      {label}
      {score !== undefined && <span className="ml-1">({score})</span>}
    </Badge>
  );
}

// Credit Limit Warning Modal
interface CreditLimitWarningProps {
  isOpen: boolean;
  onClose: () => void;
  partyId: string;
  partyName: string;
  amount: number;
  onProceed: () => void;
}

export function CreditLimitWarning({
  isOpen,
  onClose,
  partyId,
  partyName,
  amount,
  onProceed,
}: CreditLimitWarningProps) {
  const { isBangla } = useAppTranslation();
  const { data: creditCheck, isLoading } = useCreditLimitCheck(partyId, amount);
  
  if (!creditCheck) return null;
  
  const utilizationAfterSale = ((creditCheck.currentBalance + amount) / creditCheck.creditLimit) * 100;
  const isOverLimit = !creditCheck.withinLimit;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            {isBangla ? 'ক্রেডিট লিমিট সতর্কতা' : 'Credit Limit Warning'}
          </DialogTitle>
          <DialogDescription>
            {isBangla 
              ? `${partyName} এর ক্রেডিট লিমিট পরীক্ষা করুন`
              : `Check credit limit for ${partyName}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500">{isBangla ? 'বর্তমান বকেয়া' : 'Current Balance'}</p>
              <p className="text-lg font-bold">৳{creditCheck.currentBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500">{isBangla ? 'ক্রেডিট লিমিট' : 'Credit Limit'}</p>
              <p className="text-lg font-bold">৳{creditCheck.creditLimit.toLocaleString()}</p>
            </div>
          </div>
          
          {/* New Sale */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">{isBangla ? 'নতুন বিক্রি' : 'New Sale'}</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">+৳{amount.toLocaleString()}</p>
          </div>
          
          {/* Utilization Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isBangla ? 'লিমিট ব্যবহার' : 'Credit Utilization'}</span>
              <span className={cn(
                utilizationAfterSale > 100 ? 'text-red-600' :
                utilizationAfterSale > 80 ? 'text-amber-600' : 'text-emerald-600'
              )}>
                {Math.min(100, utilizationAfterSale).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, utilizationAfterSale)} 
              className={cn(
                'h-2',
                utilizationAfterSale > 100 && '[&>div]:bg-red-500',
                utilizationAfterSale > 80 && utilizationAfterSale <= 100 && '[&>div]:bg-amber-500'
              )}
            />
          </div>
          
          {/* Warning Message */}
          {isOverLimit && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {isBangla ? 'ক্রেডিট লিমিট অতিক্রম!' : 'Credit Limit Exceeded!'}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {isBangla 
                      ? `এই বিক্রির পর বকেয়া হবে ৳${(creditCheck.currentBalance + amount).toLocaleString()}, যা লিমিট ছাড়িয়ে গেছে।`
                      : `After this sale, balance will be ৳${(creditCheck.currentBalance + amount).toLocaleString()}, exceeding the limit.`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Suggested Action */}
          {!isOverLimit && utilizationAfterSale > 80 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {isBangla 
                  ? 'ক্রেডিট ব্যবহার ৮০% এর বেশি। পেমেন্ট নিয়ে বিক্রি করুন।'
                  : 'Credit utilization above 80%. Consider collecting payment.'}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {isBangla ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button 
            onClick={onProceed}
            className={isOverLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
          >
            {isBangla ? 'তবুও এগিয়ে যান' : 'Proceed Anyway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Credit Aging Summary Card
export function CreditAgingCard() {
  const { isBangla } = useAppTranslation();
  const { data: agingReport, isLoading } = useCreditAgingReport();
  const featureAccess = useFeatureAccess('creditControl');
  
  if (!featureAccess.isUnlocked) {
    return null;
  }
  
  if (isLoading || !agingReport?.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-amber-500" />
            {isBangla ? 'ক্রেডিট এজিং' : 'Credit Aging'}
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </CardContent>
      </Card>
    );
  }
  
  // Calculate totals
  const totals = agingReport.reduce((acc, r) => ({
    total: acc.total + r.totalOutstanding,
    bucket0_30: acc.bucket0_30 + r.agingBuckets.bucket0_30,
    bucket31_60: acc.bucket31_60 + r.agingBuckets.bucket31_60,
    bucket61_90: acc.bucket61_90 + r.agingBuckets.bucket61_90,
    bucket90Plus: acc.bucket90Plus + r.agingBuckets.bucket90Plus,
    highRisk: acc.highRisk + (r.riskLevel === 'high' ? 1 : 0),
  }), { total: 0, bucket0_30: 0, bucket31_60: 0, bucket61_90: 0, bucket90Plus: 0, highRisk: 0 });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-amber-500" />
            {isBangla ? 'ক্রেডিট এজিং' : 'Credit Aging'}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports/credit-aging">
              {isBangla ? 'বিস্তারিত' : 'Details'}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Outstanding */}
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-500">{isBangla ? 'মোট বকেয়া' : 'Total Outstanding'}</p>
            <p className="text-2xl font-bold">৳{totals.total.toLocaleString()}</p>
          </div>
          
          {/* Aging Buckets */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded text-center">
              <p className="text-xs text-emerald-600">০-৩০ দিন</p>
              <p className="text-sm font-bold text-emerald-700">৳{totals.bucket0_30.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-center">
              <p className="text-xs text-yellow-600">৩১-৬০ দিন</p>
              <p className="text-sm font-bold text-yellow-700">৳{totals.bucket31_60.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded text-center">
              <p className="text-xs text-orange-600">৬১-৯০ দিন</p>
              <p className="text-sm font-bold text-orange-700">৳{totals.bucket61_90.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
              <p className="text-xs text-red-600">৯০+ দিন</p>
              <p className="text-sm font-bold text-red-700">৳{totals.bucket90Plus.toLocaleString()}</p>
            </div>
          </div>
          
          {/* High Risk Alert */}
          {totals.highRisk > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {isBangla 
                  ? `${totals.highRisk} জন উচ্চ ঝুঁকিপূর্ণ গ্রাহক`
                  : `${totals.highRisk} high-risk customers`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CreditAgingCard;
