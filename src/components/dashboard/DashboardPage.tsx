// Hello Khata - AI Control Room Dashboard
// AI-First Overview Page

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStats, useDailySales, useAiInsights, useAccounts, useHealthScore, useDeadStockReport } from '@/hooks/queries';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider, Progress, CircularProgress } from '@/components/ui/premium';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Users,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Plus,
  CreditCard,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Trophy,
  Bell,
  Building2,
  DollarSign,
  ChevronRight,
  Target,
  PiggyBank,
  BarChart3,
  Clock,
  Zap,
  Mic,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency, formatNumber } = useCurrency();
  const [chartView, setChartView] = useState<'sales' | 'profit'>('sales');
  
  // API data hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: dailySales, isLoading: salesLoading, refetch: refetchDailySales } = useDailySales();
  const { data: aiInsightsResponse, refetch: refetchInsights } = useAiInsights();
  const { data: accounts, refetch: refetchAccounts } = useAccounts();
  const { data: apiHealthScore, refetch: refetchHealthScore } = useHealthScore();
  const { data: deadStockReport, refetch: refetchDeadStock } = useDeadStockReport();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Extract the health score data which contains suggestions
  const aiInsightsData = aiInsightsResponse?.data;
  
  const isLoading = statsLoading || salesLoading;
  
  // Transform API health score to display format
  const healthScore = apiHealthScore ? {
    overallScore: apiHealthScore.overallScore,
    grade: apiHealthScore.grade,
    trend: apiHealthScore.trend,
    components: [
      {
        name: 'Profit Margin',
        nameBn: 'লাভের মার্জিন',
        score: apiHealthScore.components.profitTrend.score,
        trend: apiHealthScore.components.profitTrend.trend,
      },
      {
        name: 'Credit Health',
        nameBn: 'ক্রেডিট স্বাস্থ্য',
        score: apiHealthScore.components.creditRisk.score,
        trend: apiHealthScore.components.creditRisk.trend,
      },
      {
        name: 'Stock Efficiency',
        nameBn: 'স্টক দক্ষতা',
        score: apiHealthScore.components.deadStock.score,
        trend: apiHealthScore.components.deadStock.trend,
      },
      {
        name: 'Cash Flow',
        nameBn: 'নগদ প্রবাহ',
        score: apiHealthScore.components.cashStability.score,
        trend: apiHealthScore.components.cashStability.trend,
      },
      {
        name: 'Sales Growth',
        nameBn: 'বিক্রি প্রবৃদ্ধি',
        score: apiHealthScore.components.salesConsistency.score,
        trend: apiHealthScore.components.salesConsistency.trend,
      },
    ],
  } : null;
  
  // Transform API insights to display format
  // aiInsightsData comes from health-score endpoint which has suggestions array
  const insights = (() => {
    // Check if aiInsightsData has suggestions (from health score endpoint)
    const suggestions = aiInsightsData?.suggestions || [];
    
    if (suggestions.length > 0) {
      return suggestions.map((suggestion) => ({
        id: suggestion.id,
        type: suggestion.priority === 'high' ? 'alert' as const : 
              suggestion.priority === 'medium' ? 'opportunity' as const : 'suggestion' as const,
        title: suggestion.title,
        titleBn: suggestion.titleBn,
        description: suggestion.description,
        descriptionBn: suggestion.descriptionBn,
        impact: suggestion.priority === 'high' ? 'high' as const : 
                suggestion.priority === 'medium' ? 'medium' as const : 'low' as const,
        impactLabel: '',
        impactLabelBn: '',
        actionLabel: suggestion.action || 'View',
        actionLabelBn: suggestion.action || 'দেখুন',
        actionUrl: suggestion.actionUrl || '#',
      }));
    }
    
    // Return default insights if no data
    return [
      {
        id: '1',
        type: 'opportunity' as const,
        title: 'Add inventory items',
        titleBn: 'ইনভেন্টরি আইটেম যোগ করুন',
        description: 'Start adding products to track your inventory',
        descriptionBn: 'আপনার ইনভেন্টরি ট্র্যাক করতে পণ্য যোগ করা শুরু করুন',
        impact: 'medium' as const,
        impactLabel: '',
        impactLabelBn: '',
        actionLabel: 'Add Items',
        actionLabelBn: 'আইটেম যোগ করুন',
        actionUrl: '/inventory/new',
      },
      {
        id: '2',
        type: 'suggestion' as const,
        title: 'Add customers or suppliers',
        titleBn: 'গ্রাহক বা সরবরাহকারী যোগ করুন',
        description: 'Build your party list for better tracking',
        descriptionBn: 'আরও ভাল ট্র্যাকিংয়ের জন্য আপনার পার্টি তালিকা তৈরি করুন',
        impact: 'medium' as const,
        impactLabel: '',
        impactLabelBn: '',
        actionLabel: 'Add Party',
        actionLabelBn: 'পার্টি যোগ করুন',
        actionUrl: '/parties/new',
      },
      {
        id: '3',
        type: 'achievement' as const,
        title: 'Welcome to Hello Khata',
        titleBn: 'হ্যালো খাতায় স্বাগতম',
        description: 'Set up your business to unlock insights',
        descriptionBn: 'ইনসাইটস আনলক করতে আপনার ব্যবসা সেট আপ করুন',
        impact: 'low' as const,
        impactLabel: '',
        impactLabelBn: '',
        actionLabel: 'Get Started',
        actionLabelBn: 'শুরু করুন',
        actionUrl: '/settings',
      },
    ];
  })();
  
  // Calculate dead stock value
  const deadStockValue = deadStockReport?.reduce((sum, item) => sum + item.stockValue, 0) || stats?.deadStockValue || 0;
  
  // Format chart data
  const chartData = dailySales?.map((item) => ({
    date: new Date(item.date).toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', {
      weekday: 'short',
    }),
    sales: item.sales,
    expenses: item.expenses,
    profit: item.profit,
  })) || [];
  
  // Calculate account totals
  const cashBalance = accounts?.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.currentBalance, 0) || 0;
  const bankBalance = accounts?.filter(a => a.type === 'bank' || a.type === 'mobile_wallet').reduce((sum, a) => sum + a.currentBalance, 0) || 0;

  // Format number with proper locale
  const formatNum = (num: number): string => {
    return new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isBangla ? 'ওভারভিউ' : 'Overview'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'স্বাগতম! আজকের সারসংক্ষেপ' : 'Welcome! Today\'s summary'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await Promise.all([
                  refetchStats(),
                  refetchDailySales(),
                  refetchInsights(),
                  refetchAccounts(),
                  refetchHealthScore(),
                  refetchDeadStock(),
                ]);
              } finally {
                setIsRefreshing(false);
              }
            }} 
            disabled={isRefreshing}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
            {isBangla ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
          {/* Health Score Badge */}
          {healthScore && (
            <div 
              onClick={() => router.push('/reports/health-score')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-subtle cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">{healthScore.overallScore}</span>
              <Badge variant="success" size="sm">{healthScore.grade}</Badge>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Dock */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-6 scrollbar-hidden">
        <ActionDockButton
          icon={ShoppingCart}
          label={isBangla ? 'নতুন বিক্রি' : 'New Sale'}
          color="emerald"
          onClick={() => router.push('/sales/new')}
        />
        <ActionDockButton
          icon={CreditCard}
          label={isBangla ? 'পেমেন্ট' : 'Payment'}
          color="indigo"
          onClick={() => router.push('/reports/credit-control')}
        />
        <ActionDockButton
          icon={Receipt}
          label={isBangla ? 'খরচ' : 'Expense'}
          color="warning"
          onClick={() => router.push('/expenses/new')}
        />
        <ActionDockButton
          icon={Package}
          label={isBangla ? 'ক্রয়' : 'Purchase'}
          color="default"
          onClick={() => router.push('/purchases/new')}
        />
      </div>
      
      {/* KPI Cards with Count-up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICardAnimated
          title="Today's Sales"
          titleBn="আজকের বিক্রি"
          value={stats?.todaySales || 0}
          prefix="৳"
          change={stats?.salesGrowth}
          isPositive={(stats?.salesGrowth || 0) >= 0}
          icon={<TrendingUp className="h-5 w-5" />}
          color="emerald"
          isBangla={isBangla}
          isLoading={isLoading}
        />
        <KPICardAnimated
          title="Today's Profit"
          titleBn="আজকের লাভ"
          value={stats?.todayProfit || 0}
          prefix="৳"
          change={stats?.profitGrowth}
          isPositive={(stats?.profitGrowth || 0) >= 0}
          icon={<Wallet className="h-5 w-5" />}
          color="indigo"
          isBangla={isBangla}
          isLoading={isLoading}
        />
        <KPICardAnimated
          title="Receivable"
          titleBn="পাওনা"
          value={stats?.receivable || 0}
          prefix="৳"
          icon={<Users className="h-5 w-5" />}
          color="warning"
          isBangla={isBangla}
          isLoading={isLoading}
        />
        <KPICardAnimated
          title="Stock Value"
          titleBn="স্টক মূল্য"
          value={stats?.stockValue || 0}
          prefix="৳"
          icon={<Package className="h-5 w-5" />}
          color="default"
          isBangla={isBangla}
          isLoading={isLoading}
        />
      </div>
      
      {/* AI Daily Brief + Health Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Daily Brief - Intelligence Engine */}
        <div className="ai-section-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary ai-icon-illuminated" />
              {isBangla ? 'AI ডেইলি ব্রিফ' : 'AI Daily Brief'}
            </h3>
            <div className="ai-badge-shimmer px-2.5 py-1 rounded-full text-xs font-medium bg-primary-subtle text-primary">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              AI
            </div>
          </div>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <BriefItem key={insight.id} insight={insight} isBangla={isBangla} index={index} />
            ))}
          </div>
          <Link 
            href="/ai"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 hover:bg-muted/50 hover:text-foreground h-10 px-4 py-2 rounded-lg w-full mt-4 border border-border-subtle"
          >
            {isBangla ? 'AI কো-পাইলট খুলুন' : 'Open AI Copilot'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Business Health Score */}
        <Card variant="elevated" padding="lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                {isBangla ? 'বিজনেস হেলথ স্কোর' : 'Business Health'}
              </CardTitle>
              {healthScore && (
                <Badge variant={healthScore.trend === 'improving' ? 'success' : 'warning'} size="sm">
                  {healthScore.trend === 'improving' ? (isBangla ? '↑ উন্নতি' : '↑ Improving') : (isBangla ? '→ স্থির' : '→ Stable')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {healthScore ? (
              <>
                <div className="flex items-center gap-6">
                  <CircularProgress
                    value={healthScore.overallScore}
                    grade={healthScore.grade}
                    size={120}
                    strokeWidth={8}
                  />
                  <div className="flex-1 space-y-3">
                    {healthScore.components.slice(0, 3).map((component) => (
                      <div key={component.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{isBangla ? component.nameBn : component.name}</span>
                          <span className={cn(
                            'font-medium',
                            component.score >= 80 ? 'text-primary' : 
                            component.score >= 60 ? 'text-warning' : 'text-destructive'
                          )}>
                            {component.score}
                          </span>
                        </div>
                        <Progress 
                          value={component.score} 
                          size="sm" 
                          color={component.score >= 80 ? 'emerald' : component.score >= 60 ? 'warning' : 'destructive'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Link 
                  href="/reports/health-score"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 border border-border bg-transparent hover:bg-muted hover:text-foreground h-10 px-4 py-2 rounded-lg w-full mt-4"
                >
                  {isBangla ? 'স্কোর উন্নতি করুন' : 'Improve Score'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Row */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card variant="elevated" padding="lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isBangla ? '৭ দিনের প্রবণতা' : '7-Day Trend'}
              </CardTitle>
              <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                <button
                  onClick={() => setChartView('sales')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    chartView === 'sales'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isBangla ? 'বিক্রি' : 'Sales'}
                </button>
                <button
                  onClick={() => setChartView('profit')}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    chartView === 'profit'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isBangla ? 'লাভ' : 'Profit'}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F5BFF" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4F5BFF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0FBF9F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0FBF9F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#9DA7B3" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9DA7B3" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C2430', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}
                      labelStyle={{ color: '#E6EDF5' }}
                      itemStyle={{ color: '#E6EDF5' }}
                      formatter={(value: number) => [`৳${formatNum(value)}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartView === 'sales' ? 'sales' : 'profit'}
                      name={chartView === 'sales' ? (isBangla ? 'বিক্রি' : 'Sales') : (isBangla ? 'লাভ' : 'Profit')}
                      stroke={chartView === 'sales' ? '#4F5BFF' : '#0FBF9F'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={chartView === 'sales' ? 'url(#colorSales)' : 'url(#colorProfit)'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Account Balances + Dead Stock Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash & Bank Balances */}
        <Card variant="elevated" padding="lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-primary" />
              {isBangla ? 'অ্যাকাউন্ট ব্যালেন্স' : 'Account Balances'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AccountBalanceRow
              type="cash"
              label={isBangla ? 'ক্যাশ' : 'Cash'}
              balance={cashBalance}
              isBangla={isBangla}
            />
            <AccountBalanceRow
              type="bank"
              label={isBangla ? 'ব্যাংক/মোবাইল' : 'Bank/Mobile'}
              balance={bankBalance}
              isBangla={isBangla}
            />
            <Divider />
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-muted-foreground">{isBangla ? 'মোট' : 'Total'}</span>
              <span className="text-xl font-bold">৳{formatNum(cashBalance + bankBalance)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dead Stock Alert */}
        <Card variant="elevated" padding="lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {isBangla ? 'অচল স্টক সতর্কতা' : 'Dead Stock Alert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-warning">৳{formatNum(deadStockValue)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isBangla ? 'অচল মজুদ মূল্য' : 'Capital Stuck'}
              </p>
            </div>
            <div className="space-y-2">
              {deadStockReport?.slice(0, 3).map((item) => (
                <div key={item.itemId} className="flex items-center justify-between text-sm py-2 border-b border-border-subtle last:border-0">
                  <span className="text-muted-foreground truncate max-w-[120px]">{item.itemName}</span>
                  <span className={cn(
                    'font-medium',
                    item.priority === 'high' ? 'text-destructive' : item.priority === 'medium' ? 'text-warning' : ''
                  )}>৳{formatNum(item.stockValue)}</span>
                </div>
              )) || (
                <>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border-subtle">
                    <span className="text-muted-foreground">{isBangla ? '৩০-৬০ দিন' : '30-60 days'}</span>
                    <span className="font-medium">৳{formatNum(deadStockValue * 0.33)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-b border-border-subtle">
                    <span className="text-muted-foreground">{isBangla ? '৬০-৯০ দিন' : '60-90 days'}</span>
                    <span className="font-medium">৳{formatNum(deadStockValue * 0.27)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-muted-foreground">{isBangla ? '৯০+ দিন' : '90+ days'}</span>
                    <span className="font-medium text-destructive">৳{formatNum(deadStockValue * 0.4)}</span>
                  </div>
                </>
              )}
            </div>
            <Link 
              href="/reports/dead-stock"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 border border-border bg-transparent hover:bg-muted hover:text-foreground h-10 px-4 py-2 rounded-lg w-full mt-4"
            >
              {isBangla ? 'বিস্তারিত দেখুন' : 'View Details'}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Action Dock Button
function ActionDockButton({ 
  icon: Icon, 
  label, 
  color, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  color: 'emerald' | 'indigo' | 'warning' | 'default';
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: 'bg-primary-subtle text-primary hover:bg-primary/20',
    indigo: 'bg-indigo-subtle text-indigo hover:bg-indigo/20',
    warning: 'bg-warning-subtle text-warning hover:bg-warning/20',
    default: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-white/5',
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
        'active:scale-95',
        colorClasses[color]
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// KPI Card with Count-up Animation - GPU Optimized
function KPICardAnimated({
  title,
  titleBn,
  value,
  prefix,
  change,
  isPositive,
  icon,
  color,
  isBangla,
  isLoading,
}: {
  title: string;
  titleBn: string;
  value: number;
  prefix?: string;
  change?: number;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: 'emerald' | 'indigo' | 'warning' | 'default';
  isBangla: boolean;
  isLoading?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const prevValue = useRef(value);
  
  useEffect(() => {
    // Reset animation when value changes significantly
    if (Math.abs(value - prevValue.current) > 100) {
      hasAnimated.current = false;
    }
    prevValue.current = value;
    
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    
    // Use requestAnimationFrame for smoother animation
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * value);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  // Format number with proper locale
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US').format(num);
  };
  
  const colorClasses = {
    emerald: 'text-emerald bg-emerald-subtle',
    indigo: 'text-primary bg-primary-subtle',
    warning: 'text-warning bg-warning-subtle',
    default: 'text-foreground bg-muted',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="surface-metric p-4 overflow-hidden will-change-transform"
      style={{ contain: 'layout style' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-2">
            {isBangla ? titleBn : title}
          </p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-base text-muted-foreground">{prefix}</span>}
            <span className="kpi-number tabular-nums">
              {formatNumber(displayValue)}
            </span>
          </div>
          {change !== undefined && (
            <p className={cn(
              'text-xs font-medium mt-1.5',
              isPositive ? 'text-emerald' : 'text-destructive'
            )}>
              {isPositive ? '↑' : '↓'} {new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US').format(Math.abs(change))}%
            </p>
          )}
        </div>
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Brief Item - GPU Optimized
function BriefItem({ insight, isBangla, index }: { insight: any; isBangla: boolean; index: number }) {
  const typeStyles = {
    alert: 'border-l-destructive bg-destructive-subtle/30',
    opportunity: 'border-l-primary bg-primary-subtle/30',
    suggestion: 'border-l-indigo bg-indigo-subtle/30',
    achievement: 'border-l-warning bg-warning-subtle/30',
  };
  
  const impactStyles = {
    high: 'bg-destructive-subtle text-destructive',
    medium: 'bg-warning-subtle text-warning',
    low: 'bg-primary-subtle text-primary',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: 'easeOut' }}
      className={cn('p-3 rounded-xl border-l-2 will-change-transform', typeStyles[insight.type])}
      style={{ contain: 'layout style' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-foreground">
          {isBangla ? insight.titleBn : insight.title}
        </p>
        <Badge className={cn('text-[10px] shrink-0', impactStyles[insight.impact])}>
          {insight.impact.toUpperCase()}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {isBangla ? insight.descriptionBn : insight.description}
      </p>
      <div className="flex items-center gap-2">
        <button className="text-xs font-medium text-primary hover:underline">
          {isBangla ? insight.actionLabelBn : insight.actionLabel}
        </button>
        <span className="text-muted-foreground">•</span>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          {isBangla ? 'ব্যাখ্যা' : 'Explain'}
        </button>
      </div>
    </motion.div>
  );
}

// Account Balance Row
function AccountBalanceRow({
  type,
  label,
  balance,
  isBangla,
}: {
  type: 'cash' | 'bank';
  label: string;
  balance: number;
  isBangla: boolean;
}) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US').format(num);
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-xl',
      type === 'cash' ? 'bg-primary-subtle' : 'bg-indigo-subtle'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center',
          type === 'cash' ? 'bg-primary/20' : 'bg-indigo/20'
        )}>
          {type === 'cash' ? (
            <Wallet className={cn('w-5 h-5', type === 'cash' ? 'text-primary' : 'text-indigo')} />
          ) : (
            <Building2 className="w-5 h-5 text-indigo" />
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">৳{formatNumber(balance)}</p>
        </div>
      </div>
    </div>
  );
}
