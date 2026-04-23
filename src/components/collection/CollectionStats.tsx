// Hello Khata - Collection Stats Component
// হ্যালো খাতা - কালেকশন পরিসংখ্যান
// Display collection effectiveness metrics

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Target,
  BarChart3,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';

// Types
interface CollectionStats {
  totalOverdue: number;
  customersOverdue: number;
  dueThisWeek: number;
  promisedAmount: number;
  collectionRate?: number;
  averageDaysToCollect?: number;
  promisesKept?: number;
  promisesBroken?: number;
  promisesPending?: number;
  trendDirection?: 'up' | 'down' | 'stable';
}

interface CollectionStatsProps {
  stats: CollectionStats;
  isLoading?: boolean;
}

export function CollectionStats({ stats, isLoading }: CollectionStatsProps) {
  const { isBangla } = useAppTranslation();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate collection effectiveness
  const promiseFulfillmentRate = 
    stats.promisesKept && stats.promisesBroken
      ? Math.round(
          (stats.promisesKept / (stats.promisesKept + stats.promisesBroken + (stats.promisesPending || 0))) * 100
        )
      : 0;

  // Get trend indicator
  const getTrendIndicator = () => {
    if (!stats.trendDirection) return null;
    
    const trendConfig = {
      up: { icon: TrendingUp, color: 'text-emerald-500', label: isBangla ? 'উন্নতি' : 'Improving' },
      down: { icon: TrendingDown, color: 'text-red-500', label: isBangla ? 'অবনতি' : 'Declining' },
      stable: { icon: Clock, color: 'text-amber-500', label: isBangla ? 'স্থির' : 'Stable' },
    };

    const config = trendConfig[stats.trendDirection];
    const Icon = config.icon;
    
    return (
      <Badge variant="secondary" className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Stats card configuration
  const mainStats = [
    {
      title: isBangla ? 'মোট বকেয়া' : 'Total Overdue',
      value: formatCurrency(stats.totalOverdue),
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      borderColor: 'border-l-red-500',
      subtitle: stats.customersOverdue 
        ? `${stats.customersOverdue} ${isBangla ? 'জন গ্রাহক' : 'customers'}`
        : undefined,
    },
    {
      title: isBangla ? 'এই সপ্তাহে দেয়' : 'Due This Week',
      value: formatCurrency(stats.dueThisWeek),
      icon: Calendar,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      borderColor: 'border-l-amber-500',
    },
    {
      title: isBangla ? 'প্রতিশ্রুতি' : 'Promised Amount',
      value: formatCurrency(stats.promisedAmount),
      icon: Target,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      borderColor: 'border-l-emerald-500',
      subtitle: stats.promisesPending
        ? `${stats.promisesPending} ${isBangla ? 'টি মুলতুবি' : 'pending'}`
        : undefined,
    },
    {
      title: isBangla ? 'কালেকশন হার' : 'Collection Rate',
      value: stats.collectionRate ? `${stats.collectionRate}%` : '--',
      icon: BarChart3,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      borderColor: 'border-l-blue-500',
      trend: getTrendIndicator(),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat) => (
          <Card
            key={stat.title}
            className={cn('border-l-4', stat.borderColor)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', stat.bgColor)}>
                    <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className={cn('text-xl font-bold truncate', stat.iconColor)}>
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
                {stat.trend && (
                  <div className="shrink-0">{stat.trend}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Effectiveness Metrics */}
      {(stats.promisesKept !== undefined || stats.averageDaysToCollect !== undefined) && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {isBangla ? 'কালেকশন কার্যকারিতা' : 'Collection Effectiveness'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Promise Fulfillment */}
              {stats.promisesKept !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isBangla ? 'প্রতিশ্রুতি পূরণের হার' : 'Promise Fulfillment'}
                    </span>
                    <span className="font-semibold">{promiseFulfillmentRate}%</span>
                  </div>
                  <Progress value={promiseFulfillmentRate} className="h-2" />
                  <div className="flex items-center gap-4 text-xs">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {stats.promisesKept}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isBangla ? 'প্রতিশ্রুতি রক্ষিত' : 'Promises Kept'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {stats.promisesBroken || 0}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isBangla ? 'প্রতিশ্রুতি ভঙ্গ' : 'Promises Broken'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {stats.promisesPending && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-amber-600">
                              <Clock className="h-3 w-3" />
                              {stats.promisesPending}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isBangla ? 'মুলতুবি প্রতিশ্রুতি' : 'Pending Promises'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}

              {/* Average Days to Collect */}
              {stats.averageDaysToCollect !== undefined && (
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    {isBangla ? 'গড় দিন কালেকশনে' : 'Avg Days to Collect'}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.averageDaysToCollect}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isBangla ? 'দিন' : 'days'}
                  </p>
                </div>
              )}

              {/* Collection Progress */}
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">
                  {isBangla ? 'কালেকশন অগ্রগতি' : 'Collection Progress'}
                </p>
                <div className="relative flex items-center justify-center">
                  <svg className="h-16 w-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-muted"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={175.93}
                      strokeDashoffset={175.93 * (1 - (stats.collectionRate || 0) / 100)}
                      className="text-emerald-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold">
                    {stats.collectionRate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CollectionStats;
