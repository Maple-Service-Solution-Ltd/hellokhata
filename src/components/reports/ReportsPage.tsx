// Hello Khata OS - Reports Page
// হ্যালো খাতা - রিপোর্ট পেজ

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader, StatCard } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Printer,
  Loader2,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToExcel, exportToPDF, printReport, type ReportData } from '@/lib/export-utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { useDashboardStats, useDailySales, useItems } from '@/hooks/queries';
import { useCurrency } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export default function ReportsPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'overview' | 'sales' | 'profit' | 'stock'>('overview');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportingType, setExportingType] = useState<string | null>(null);

  const { data: stats } = useDashboardStats();
  const { data: dailySales } = useDailySales();
  const { data: items } = useItems();

  // Get period label
  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      '7d': isBangla ? 'গত ৭ দিন' : 'Last 7 days',
      '30d': isBangla ? 'গত ৩০ দিন' : 'Last 30 days',
      '90d': isBangla ? 'গত ৯০ দিন' : 'Last 90 days',
      '1y': isBangla ? 'গত ১ বছর' : 'Last year',
    };
    return labels[period];
  };

  // Mock data for charts
  const salesByCategory = [
    { name: isBangla ? 'খাদ্য পণ্য' : 'Food', value: 45 },
    { name: isBangla ? 'পানীয়' : 'Beverages', value: 25 },
    { name: isBangla ? 'দৈনন্দিন' : 'Daily', value: 15 },
    { name: isBangla ? 'অন্যান্য' : 'Others', value: 15 },
  ];

  const chartData = dailySales?.map((item) => ({
    date: new Date(item.date).toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' }),
    sales: item.sales,
    expenses: item.expenses,
    profit: item.profit,
  })) || [];

  // Calculate stock statistics
  const totalStockValue = items?.reduce((sum, item) => sum + (item.stock * (item.salePrice || 0)), 0) || 0;
  const lowStockItems = items?.filter(item => item.stock <= (item.minStock || 10)) || [];
  const totalItems = items?.length || 0;

  // Prepare report data for export
  const getReportData = (): ReportData => ({
    dateRange: {
      start: new Date(Date.now() - (period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      end: new Date().toLocaleDateString(),
      period: getPeriodLabel(),
    },
    stats: {
      totalSales: stats?.todaySales || 0,
      totalExpenses: stats?.todayExpenses || 0,
      netProfit: stats?.todayProfit || 0,
      profitMargin: ((stats?.todayProfit || 0) / (stats?.todaySales || 1)) * 100,
      receivable: stats?.receivable || 0,
      stockValue: stats?.stockValue || 0,
    },
    chartData: chartData.map(item => ({
      date: item.date,
      sales: item.sales,
      expenses: item.expenses,
      profit: item.profit,
    })),
    salesByCategory,
    profitLossSummary: {
      totalRevenue: stats?.todaySales || 0,
      costOfGoods: Math.round((stats?.todaySales || 0) * 0.63), // Approximate COGS
      grossProfit: Math.round((stats?.todaySales || 0) * 0.37), // Gross profit margin
      operatingExpenses: stats?.todayExpenses || 0,
      netProfit: stats?.todayProfit || 0,
    },
  });

  // Handle export functions
  const handleExportCSV = async () => {
    setExportingType('csv');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const success = exportToCSV(getReportData());
      if (success) {
        toast({
          title: isBangla ? 'CSV এক্সপোর্ট সম্পন্ন' : 'CSV Exported',
          description: isBangla ? 'রিপোর্ট CSV ফাইলে ডাউনলোড হয়েছে' : 'Report has been downloaded as CSV',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: isBangla ? 'ত্রুটি' : 'Error',
        description: isBangla ? 'এক্সপোর্ট ব্যর্থ হয়েছে' : 'Export failed',
        variant: 'destructive',
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingType('excel');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const success = exportToExcel(getReportData());
      if (success) {
        toast({
          title: isBangla ? 'Excel এক্সপোর্ট সম্পন্ন' : 'Excel Exported',
          description: isBangla ? 'রিপোর্ট Excel ফাইলে ডাউনলোড হয়েছে' : 'Report has been downloaded as Excel',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: isBangla ? 'ত্রুটি' : 'Error',
        description: isBangla ? 'এক্সপোর্ট ব্যর্থ হয়েছে' : 'Export failed',
        variant: 'destructive',
      });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportingType('pdf');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const success = exportToPDF(getReportData());
      if (success) {
        toast({
          title: isBangla ? 'PDF তৈরি হয়েছে' : 'PDF Generated',
          description: isBangla ? 'প্রিন্ট উইন্ডো খোলা হয়েছে, PDF হিসেবে সংরক্ষণ করুন' : 'Print window opened, save as PDF',
        });
      } else {
        throw new Error('PDF export failed - popup may be blocked');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: isBangla ? 'ত্রুটি' : 'Error',
        description: isBangla ? 'পপ-আপ ব্লক করা হয়েছে। পপ-আপ অনুমোদন করুন।' : 'Popup blocked. Please allow popups for this site.',
        variant: 'destructive',
      });
    } finally {
      setExportingType(null);
    }
  };

  const handlePrint = async () => {
    setExportingType('print');
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const success = printReport(getReportData());
      if (success) {
        toast({
          title: isBangla ? 'প্রিন্ট উইন্ডো খোলা হয়েছে' : 'Print Dialog Opened',
          description: isBangla ? 'প্রিন্ট করুন বা PDF হিসেবে সংরক্ষণ করুন' : 'Print or save as PDF',
        });
      } else {
        throw new Error('Print failed - popup may be blocked');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: isBangla ? 'ত্রুটি' : 'Error',
        description: isBangla ? 'পপ-আপ ব্লক করা হয়েছে। পপ-আপ অনুমোদন করুন।' : 'Popup blocked. Please allow popups for this site.',
        variant: 'destructive',
      });
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {t('reports.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBangla ? 'ব্যবসার বিশ্লেষণ ও প্রতিবেদন' : 'Business analytics & reports'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exportingType === 'pdf'}>
              {exportingType === 'pdf' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exportingType === 'excel'}>
              {exportingType === 'excel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exportingType === 'csv'}>
              {exportingType === 'csv' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} disabled={exportingType === 'print'}>
              {exportingType === 'print' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              {isBangla ? 'প্রিন্ট' : 'Print'}
            </Button>
          </div>
        </div>

        {/* Tabs Container - All content must be inside Tabs */}
        <Tabs value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)} className="space-y-6">
          {/* Period Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <TabsList>
                  <TabsTrigger value="overview">{isBangla ? 'সারসংক্ষেপ' : 'Overview'}</TabsTrigger>
                  <TabsTrigger value="sales">{isBangla ? 'বিক্রি' : 'Sales'}</TabsTrigger>
                  <TabsTrigger value="profit">{isBangla ? 'লাভ-লোকসান' : 'Profit/Loss'}</TabsTrigger>
                  <TabsTrigger value="stock">{isBangla ? 'স্টক' : 'Stock'}</TabsTrigger>
                </TabsList>
                <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">{isBangla ? 'গত ৭ দিন' : 'Last 7 days'}</SelectItem>
                    <SelectItem value="30d">{isBangla ? 'গত ৩০ দিন' : 'Last 30 days'}</SelectItem>
                    <SelectItem value="90d">{isBangla ? 'গত ৯০ দিন' : 'Last 90 days'}</SelectItem>
                    <SelectItem value="1y">{isBangla ? 'গত ১ বছর' : 'Last year'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={isBangla ? 'মোট বিক্রি' : 'Total Sales'}
                value={formatCurrency(stats?.todaySales || 0)}
                icon={TrendingUp}
                iconColor="text-emerald-600"
                trend={{ value: 12.5, isPositive: true }}
              />
              <StatCard
                title={isBangla ? 'মোট খরচ' : 'Total Expenses'}
                value={formatCurrency(stats?.todayExpenses || 0)}
                icon={TrendingDown}
                iconColor="text-orange-600"
                trend={{ value: -5.2, isPositive: true }}
              />
              <StatCard
                title={isBangla ? 'নেট লাভ' : 'Net Profit'}
                value={formatCurrency(stats?.todayProfit || 0)}
                icon={DollarSign}
                iconColor="text-blue-600"
                trend={{ value: 18.3, isPositive: true }}
              />
              <StatCard
                title={isBangla ? 'লাভের হার' : 'Profit Margin'}
                value={`${((stats?.todayProfit || 0) / (stats?.todaySales || 1) * 100).toFixed(1)}%`}
                icon={PieChart}
                iconColor="text-purple-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    {isBangla ? 'বিক্রির প্রবণতা' : 'Sales Trend'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSalesReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="sales" stroke="#10B981" fillOpacity={1} fill="url(#colorSalesReport)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    {isBangla ? 'ক্যাটাগরি অনুযায়ী বিক্রি' : 'Sales by Category'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Tab Content */}
          <TabsContent value="sales" className="space-y-6 mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={isBangla ? 'আজকের বিক্রি' : 'Today\'s Sales'}
                value={formatCurrency(stats?.todaySales || 0)}
                icon={ShoppingCart}
                iconColor="text-emerald-600"
                trend={{ value: stats?.salesGrowth || 0, isPositive: (stats?.salesGrowth || 0) >= 0 }}
              />
              <StatCard
                title={isBangla ? 'বিক্রি প্রবৃদ্ধি' : 'Sales Growth'}
                value={`${(stats?.salesGrowth || 0).toFixed(1)}%`}
                icon={TrendingUp}
                iconColor="text-blue-600"
              />
              <StatCard
                title={isBangla ? 'পাওনা' : 'Receivable'}
                value={formatCurrency(stats?.receivable || 0)}
                icon={Users}
                iconColor="text-orange-600"
              />
              <StatCard
                title={isBangla ? 'পরিশোধিত' : 'Paid'}
                value={formatCurrency((stats?.todaySales || 0) - (stats?.receivable || 0))}
                icon={DollarSign}
                iconColor="text-emerald-600"
              />
            </div>

            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  {isBangla ? 'বিক্রি বিশ্লেষণ' : 'Sales Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="sales" name={isBangla ? 'বিক্রি' : 'Sales'} fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/reports/sales">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{isBangla ? 'বিক্রি রিপোর্ট' : 'Sales Report'}</p>
                        <p className="text-sm text-muted-foreground">{isBangla ? 'বিস্তারিত বিক্রি বিশ্লেষণ' : 'Detailed sales analysis'}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/sales/new">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{isBangla ? 'নতুন বিক্রি' : 'New Sale'}</p>
                        <p className="text-sm text-muted-foreground">{isBangla ? 'নতুন বিক্রি যোগ করুন' : 'Create a new sale'}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          {/* Profit/Loss Tab Content */}
          <TabsContent value="profit" className="space-y-6 mt-0">
            {/* Profit Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={isBangla ? 'মোট আয়' : 'Total Revenue'}
                value={formatCurrency(stats?.todaySales || 0)}
                icon={ArrowUpRight}
                iconColor="text-emerald-600"
              />
              <StatCard
                title={isBangla ? 'মোট খরচ' : 'Total Expenses'}
                value={formatCurrency(stats?.todayExpenses || 0)}
                icon={ArrowDownRight}
                iconColor="text-red-600"
              />
              <StatCard
                title={isBangla ? 'নেট লাভ' : 'Net Profit'}
                value={formatCurrency(stats?.todayProfit || 0)}
                icon={DollarSign}
                iconColor={(stats?.todayProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}
              />
              <StatCard
                title={isBangla ? 'লাভের হার' : 'Profit Margin'}
                value={`${((stats?.todayProfit || 0) / (stats?.todaySales || 1) * 100).toFixed(1)}%`}
                icon={PieChart}
                iconColor="text-purple-600"
              />
            </div>

            {/* Profit & Loss Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{isBangla ? 'লাভ-লোকসান সারাংশ' : 'Profit & Loss Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Revenue */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">{isBangla ? 'মোট আয়' : 'Total Revenue'}</span>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(stats?.todaySales || 0)}</span>
                  </div>

                  {/* Cost of Goods */}
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                      <span className="font-medium">{isBangla ? 'পণ্যের খরচ' : 'Cost of Goods Sold'}</span>
                    </div>
                    <span className="font-bold text-red-600">-{formatCurrency(Math.round((stats?.todaySales || 0) * 0.63))}</span>
                  </div>

                  {/* Gross Profit */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{isBangla ? 'স্থূল লাভ' : 'Gross Profit'}</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(Math.round((stats?.todaySales || 0) * 0.37))}</span>
                  </div>

                  {/* Operating Expenses */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowDownRight className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">{isBangla ? 'পরিচালন খরচ' : 'Operating Expenses'}</span>
                    </div>
                    <span className="font-bold text-orange-600">-{formatCurrency(stats?.todayExpenses || 0)}</span>
                  </div>

                  {/* Net Profit */}
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2",
                    (stats?.todayProfit || 0) >= 0 
                      ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800"
                      : "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800"
                  )}>
                    <div className="flex items-center gap-3">
                      <TrendingUp className={cn("h-6 w-6", (stats?.todayProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600")} />
                      <span className="font-bold text-lg">{isBangla ? 'নেট লাভ' : 'Net Profit'}</span>
                    </div>
                    <span className={cn("font-bold text-xl", (stats?.todayProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {formatCurrency(stats?.todayProfit || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profit Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  {isBangla ? 'লাভের প্রবণতা' : 'Profit Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProfitReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="profit" name={isBangla ? 'লাভ' : 'Profit'} stroke="#3B82F6" fillOpacity={1} fill="url(#colorProfitReport)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Tab Content */}
          <TabsContent value="stock" className="space-y-6 mt-0">
            {/* Stock Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={isBangla ? 'স্টক মূল্য' : 'Stock Value'}
                value={formatCurrency(stats?.stockValue || 0)}
                icon={Package}
                iconColor="text-blue-600"
              />
              <StatCard
                title={isBangla ? 'মোট আইটেম' : 'Total Items'}
                value={totalItems.toString()}
                icon={Package}
                iconColor="text-purple-600"
              />
              <StatCard
                title={isBangla ? 'কম স্টক' : 'Low Stock'}
                value={lowStockItems.length.toString()}
                icon={AlertTriangle}
                iconColor="text-orange-600"
              />
              <StatCard
                title={isBangla ? 'অচল স্টক' : 'Dead Stock'}
                value={formatCurrency(stats?.deadStockValue || 0)}
                icon={AlertTriangle}
                iconColor="text-red-600"
              />
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    {isBangla ? 'কম স্টক সতর্কতা' : 'Low Stock Alert'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {lowStockItems.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="warning">{item.stock} {isBangla ? 'বাকি' : 'left'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/reports/stock">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{isBangla ? 'স্টক রিপোর্ট' : 'Stock Report'}</p>
                        <p className="text-sm text-muted-foreground">{isBangla ? 'বিস্তারিত স্টক বিশ্লেষণ' : 'Detailed stock analysis'}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/reports/dead-stock">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{isBangla ? 'অচল স্টক' : 'Dead Stock'}</p>
                        <p className="text-sm text-muted-foreground">{isBangla ? 'অচল মজুদ পরিচালনা' : 'Manage dead inventory'}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
