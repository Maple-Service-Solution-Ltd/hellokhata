// Hello Khata OS - Credit Aging Report Page
// হ্যালো খাতা - ক্রেডিট এজিং রিপোর্ট পেজ

'use client';

import { FeatureGate, PageHeader, RiskBadge } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCreditAgingReport } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  CreditCard,
  AlertTriangle,
  Phone,
  User,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CreditAgingPage() {
  const { isBangla } = useAppTranslation();
  const { data: agingReport, isLoading } = useCreditAgingReport();

  return (
    <FeatureGate feature="creditControl">
        <div className="space-y-6">
          <PageHeader
            title={isBangla ? 'ক্রেডিট এজিং রিপোর্ট' : 'Credit Aging Report'}
            subtitle={isBangla ? 'বকেয়া পাওনার বিশ্লেষণ' : 'Analysis of outstanding receivables'}
            icon={CreditCard}
          />

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  title={isBangla ? '০-৩০ দিন' : '0-30 Days'}
                  value={agingReport?.reduce((sum, r) => sum + r.agingBuckets.bucket0_30, 0) || 0}
                  color="emerald"
                />
                <SummaryCard
                  title={isBangla ? '৩১-৬০ দিন' : '31-60 Days'}
                  value={agingReport?.reduce((sum, r) => sum + r.agingBuckets.bucket31_60, 0) || 0}
                  color="yellow"
                />
                <SummaryCard
                  title={isBangla ? '৬১-৯০ দিন' : '61-90 Days'}
                  value={agingReport?.reduce((sum, r) => sum + r.agingBuckets.bucket61_90, 0) || 0}
                  color="orange"
                />
                <SummaryCard
                  title={isBangla ? '৯০+ দিন' : '90+ Days'}
                  value={agingReport?.reduce((sum, r) => sum + r.agingBuckets.bucket90Plus, 0) || 0}
                  color="red"
                />
              </div>

              {/* Party-wise Aging */}
              <Card>
                <CardHeader>
                  <CardTitle>{isBangla ? 'পার্টি অনুযায়ী এজিং' : 'Aging by Party'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agingReport?.map((party) => (
                      <div key={party.partyId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{party.partyName}</p>
                              <p className="text-sm text-gray-500">
                                {isBangla ? 'মোট বকেয়া:' : 'Total Outstanding:'} ৳{party.totalOutstanding.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <RiskBadge riskLevel={party.riskLevel} score={party.riskScore} />
                        </div>

                        {/* Credit Limit Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{isBangla ? 'ক্রেডিট ব্যবহার' : 'Credit Utilization'}</span>
                            <span>{party.creditUtilization.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={party.creditUtilization} 
                            className={cn(
                              'h-2',
                              party.creditUtilization > 80 && '[&>div]:bg-red-500',
                              party.creditUtilization > 60 && party.creditUtilization <= 80 && '[&>div]:bg-amber-500'
                            )}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {isBangla ? `লিমিট: ৳${party.creditLimit?.toLocaleString()}` : `Limit: ৳${party.creditLimit?.toLocaleString()}`}
                          </p>
                        </div>

                        {/* Aging Buckets */}
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded">
                            <p className="text-xs text-emerald-600">০-৩০</p>
                            <p className="font-medium">৳{party.agingBuckets.bucket0_30.toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                            <p className="text-xs text-yellow-600">৩১-৬০</p>
                            <p className="font-medium">৳{party.agingBuckets.bucket31_60.toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded">
                            <p className="text-xs text-orange-600">৬১-৯০</p>
                            <p className="font-medium">৳{party.agingBuckets.bucket61_90.toLocaleString()}</p>
                          </div>
                          <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                            <p className="text-xs text-red-600">৯০+</p>
                            <p className="font-medium">৳{party.agingBuckets.bucket90Plus.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Suggested Action */}
                        {party.suggestedAction && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                            <span className="text-blue-600">
                              💡 {isBangla ? 'সুপারিশ:' : 'Suggestion:'} {party.suggestedAction}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
    </FeatureGate>
  );
}

function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  };

  return (
    <Card className={cn('border', colors[color as keyof typeof colors])}>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">৳{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
