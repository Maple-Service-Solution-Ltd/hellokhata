// Hello Khata OS - Credit Control Page
// Credit aging, risk badges, and collection management

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Divider, Progress } from '@/components/ui/premium';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  AlertTriangle,
  Users,
  DollarSign,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  Download,
  TrendingUp,
  Ban,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';

interface PartyWithBalance {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string;
  currentBalance: number;
  creditLimit: number | null;
  lastPaymentDate: Date | null;
  riskLevel: string | null;
  customerTier: string | null;
}

export default function CreditControlPage() {
  const router = useRouter();
  const { isBangla } = useAppTranslation();
  const businessId = useSessionStore((s) => s.business?.id);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [parties, setParties] = useState<PartyWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch parties with outstanding balances
  useEffect(() => {
    const fetchParties = async () => {
      if (!businessId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/parties', {
          headers: {
            'x-business-id': businessId,
          },
        });

        const data = await response.json();
        if (data.success) {
          // Filter only parties with positive balance (customers who owe money)
          const partiesWithBalance = data.data.filter((p: PartyWithBalance) => p.currentBalance > 0);
          setParties(partiesWithBalance);
        }
      } catch (error) {
        console.error('Error fetching parties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParties();
  }, [businessId]);

  // Calculate totals
  const totalOutstanding = parties.reduce((sum, p) => sum + p.currentBalance, 0);
  const highRiskCount = parties.filter(p => p.riskLevel === 'high').length;
  const overdueCount = parties.filter(p => {
    if (!p.lastPaymentDate) return true;
    const daysSincePayment = Math.floor((Date.now() - new Date(p.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSincePayment > 30;
  }).length;

  // Filter parties
  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm));
    const matchesRisk = riskFilter === 'all' || 
      (riskFilter === 'high' && p.riskLevel === 'high') ||
      (riskFilter === 'medium' && p.riskLevel === 'medium') ||
      (riskFilter === 'low' && (!p.riskLevel || p.riskLevel === 'low'));
    return matchesSearch && matchesRisk;
  });

  // Sort by balance (highest first)
  const sortedParties = [...filteredParties].sort((a, b) => b.currentBalance - a.currentBalance);

  // Calculate aging buckets (simplified)
  const agingBuckets = {
    current: 0, // 0-30 days
    bucket31_60: 0,
    bucket61_90: 0,
    over90: 0,
  };

  parties.forEach(p => {
    const daysSincePayment = p.lastPaymentDate 
      ? Math.floor((Date.now() - new Date(p.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 90; // If no payment date, assume overdue

    if (daysSincePayment <= 30) {
      agingBuckets.current += p.currentBalance;
    } else if (daysSincePayment <= 60) {
      agingBuckets.bucket31_60 += p.currentBalance;
    } else if (daysSincePayment <= 90) {
      agingBuckets.bucket61_90 += p.currentBalance;
    } else {
      agingBuckets.over90 += p.currentBalance;
    }
  });

  const totalOverdue = agingBuckets.bucket61_90 + agingBuckets.over90;

  // Export functions
  const getDateForFilename = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const exportToCSV = () => {
    const rows: string[][] = [];

    // Header
    rows.push(['Hello Khata OS - Credit Control Report']);
    rows.push([`Generated: ${new Date().toLocaleString()}`]);
    rows.push([]);

    // Summary
    rows.push(['SUMMARY']);
    rows.push(['Total Outstanding', `৳${totalOutstanding.toLocaleString()}`]);
    rows.push(['Overdue 60+ Days', `৳${totalOverdue.toLocaleString()}`]);
    rows.push(['High Risk Customers', highRiskCount.toString()]);
    rows.push(['Total Overdue Count', overdueCount.toString()]);
    rows.push([]);

    // Aging Analysis
    rows.push(['AGING ANALYSIS']);
    rows.push(['Bucket', 'Amount']);
    rows.push(['0-30 Days', `৳${agingBuckets.current.toLocaleString()}`]);
    rows.push(['31-60 Days', `৳${agingBuckets.bucket31_60.toLocaleString()}`]);
    rows.push(['61-90 Days', `৳${agingBuckets.bucket61_90.toLocaleString()}`]);
    rows.push(['90+ Days', `৳${agingBuckets.over90.toLocaleString()}`]);
    rows.push([]);

    // Customer Details
    rows.push(['OUTSTANDING CUSTOMERS']);
    rows.push(['Name', 'Phone', 'Type', 'Outstanding', 'Risk Level', 'Credit Limit', 'Last Payment', 'Days Since Payment']);

    sortedParties.forEach(p => {
      const daysSincePayment = p.lastPaymentDate
        ? Math.floor((Date.now() - new Date(p.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
        : 90;
      rows.push([
        p.name,
        p.phone || '-',
        p.type,
        p.currentBalance.toString(),
        p.riskLevel || 'low',
        p.creditLimit ? `৳${p.creditLimit.toLocaleString()}` : '-',
        p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString() : '-',
        daysSincePayment.toString()
      ]);
    });

    // Convert to CSV
    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-control-${getDateForFilename()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    // Create HTML table for Excel
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          .header { font-weight: bold; font-size: 14px; }
          .section-header { font-weight: bold; background-color: #f0f0f0; }
          .label { font-weight: bold; }
          .currency { text-align: right; }
          .high-risk { color: #EF4444; }
          .medium-risk { color: #F59E0B; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="header">Hello Khata OS - Credit Control Report</td></tr>
          <tr><td colspan="8">Generated: ${new Date().toLocaleString()}</td></tr>
          <tr><td colspan="8"></td></tr>

          <tr class="section-header"><td colspan="8">SUMMARY</td></tr>
          <tr><td class="label">Total Outstanding</td><td class="currency">৳${totalOutstanding.toLocaleString()}</td></tr>
          <tr><td class="label">Overdue 60+ Days</td><td class="currency">৳${totalOverdue.toLocaleString()}</td></tr>
          <tr><td class="label">High Risk Customers</td><td>${highRiskCount}</td></tr>
          <tr><td class="label">Total Overdue Count</td><td>${overdueCount}</td></tr>
          <tr><td colspan="8"></td></tr>

          <tr class="section-header"><td colspan="8">AGING ANALYSIS</td></tr>
          <tr><td class="label">Bucket</td><td class="label">Amount</td></tr>
          <tr><td>0-30 Days</td><td class="currency">৳${agingBuckets.current.toLocaleString()}</td></tr>
          <tr><td>31-60 Days</td><td class="currency">৳${agingBuckets.bucket31_60.toLocaleString()}</td></tr>
          <tr><td>61-90 Days</td><td class="currency">৳${agingBuckets.bucket61_90.toLocaleString()}</td></tr>
          <tr><td>90+ Days</td><td class="currency">৳${agingBuckets.over90.toLocaleString()}</td></tr>
          <tr><td colspan="8"></td></tr>

          <tr class="section-header"><td colspan="8">OUTSTANDING CUSTOMERS</td></tr>
          <tr>
            <td class="label">Name</td>
            <td class="label">Phone</td>
            <td class="label">Type</td>
            <td class="label">Outstanding</td>
            <td class="label">Risk Level</td>
            <td class="label">Credit Limit</td>
            <td class="label">Last Payment</td>
            <td class="label">Days Since</td>
          </tr>
          ${sortedParties.map(p => {
            const daysSincePayment = p.lastPaymentDate
              ? Math.floor((Date.now() - new Date(p.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
              : 90;
            const riskClass = p.riskLevel === 'high' ? 'high-risk' : p.riskLevel === 'medium' ? 'medium-risk' : '';
            return `<tr>
              <td>${p.name}</td>
              <td>${p.phone || '-'}</td>
              <td>${p.type}</td>
              <td class="currency">৳${p.currentBalance.toLocaleString()}</td>
              <td class="${riskClass}">${p.riskLevel || 'low'}</td>
              <td>${p.creditLimit ? `৳${p.creditLimit.toLocaleString()}` : '-'}</td>
              <td>${p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString() : '-'}</td>
              <td>${daysSincePayment}</td>
            </tr>`;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-control-${getDateForFilename()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
  };

  const printReport = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Credit Control Report - Hello Khata OS</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0E1117; border-bottom: 2px solid #10B981; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-label { font-size: 12px; color: #666; }
          .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          .high { color: #EF4444; font-weight: bold; }
          .medium { color: #F59E0B; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Credit Control Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>

        <div class="summary">
          <div class="stat">
            <div class="stat-label">Total Outstanding</div>
            <div class="stat-value">৳${totalOutstanding.toLocaleString()}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Overdue 60+ Days</div>
            <div class="stat-value">৳${totalOverdue.toLocaleString()}</div>
          </div>
          <div class="stat">
            <div class="stat-label">High Risk</div>
            <div class="stat-value">${highRiskCount}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Overdue Count</div>
            <div class="stat-value">${overdueCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Outstanding</th>
              <th>Risk</th>
              <th>Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            ${sortedParties.map(p => {
              const daysSincePayment = p.lastPaymentDate
                ? Math.floor((Date.now() - new Date(p.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
                : 90;
              const riskClass = p.riskLevel === 'high' ? 'high' : p.riskLevel === 'medium' ? 'medium' : '';
              return `<tr>
                <td>${p.name}</td>
                <td>${p.phone || '-'}</td>
                <td>${p.type}</td>
                <td>৳${p.currentBalance.toLocaleString()}</td>
                <td class="${riskClass}">${p.riskLevel || 'low'}</td>
                <td>${daysSincePayment} days</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
    
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
  
    );
  }

  return (

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              {isBangla ? 'ক্রেডিট কন্ট্রোল' : 'Credit Control'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBangla ? 'বকেয়া ব্যবস্থাপনা ও আদায় ট্র্যাকিং' : 'Outstanding management & collection tracking'}
            </p>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4 mr-1" />
              {isBangla ? 'এক্সপোর্ট' : 'Export'}
            </Button>

            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1"
              >
                <button
                  onClick={exportToExcel}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  {isBangla ? 'এক্সেল (.xlsx)' : 'Excel (.xlsx)'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  {isBangla ? 'সিএসভি (.csv)' : 'CSV (.csv)'}
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={printReport}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <Download className="h-4 w-4 text-gray-500" />
                  {isBangla ? 'প্রিন্ট' : 'Print'}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Outstanding"
            titleBn="মোট বকেয়া"
            value={`৳${totalOutstanding.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            color="emerald"
          />
          <SummaryCard
            title="Overdue 60+ Days"
            titleBn="৬০+ দিন বকেয়া"
            value={`৳${totalOverdue.toLocaleString()}`}
            icon={<Clock className="h-5 w-5" />}
            color="warning"
          />
          <SummaryCard
            title="High Risk"
            titleBn="উচ্চ ঝুঁকি"
            value={highRiskCount.toString()}
            subtitle={isBangla ? 'গ্রাহক' : 'customers'}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="destructive"
          />
          <SummaryCard
            title="Overdue Count"
            titleBn="বকেয়া সংখ্যা"
            value={overdueCount.toString()}
            subtitle={isBangla ? 'জন' : 'parties'}
            icon={<Users className="h-5 w-5" />}
            color="indigo"
          />
        </div>

        {/* Aging Buckets Overview */}
        <Card variant="elevated" padding="lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isBangla ? 'বকেয়া বয়স বিশ্লেষণ' : 'Aging Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AgingBucket
                label="0-30 Days"
                labelBn="০-৩০ দিন"
                amount={agingBuckets.current}
                total={totalOutstanding}
                color="emerald"
                isBangla={isBangla}
              />
              <AgingBucket
                label="31-60 Days"
                labelBn="৩১-৬০ দিন"
                amount={agingBuckets.bucket31_60}
                total={totalOutstanding}
                color="indigo"
                isBangla={isBangla}
              />
              <AgingBucket
                label="61-90 Days"
                labelBn="৬১-৯০ দিন"
                amount={agingBuckets.bucket61_90}
                total={totalOutstanding}
                color="warning"
                isBangla={isBangla}
              />
              <AgingBucket
                label="90+ Days"
                labelBn="৯০+ দিন"
                amount={agingBuckets.over90}
                total={totalOutstanding}
                color="destructive"
                isBangla={isBangla}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card variant="elevated" padding="default">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder={isBangla ? 'গ্রাহক খুঁজুন...' : 'Search customers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-border-subtle bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder={isBangla ? 'ঝুঁকি' : 'Risk Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
                <SelectItem value="high">{isBangla ? 'উচ্চ ঝুঁকি' : 'High Risk'}</SelectItem>
                <SelectItem value="medium">{isBangla ? 'মধ্যম ঝুঁকি' : 'Medium Risk'}</SelectItem>
                <SelectItem value="low">{isBangla ? 'নিম্ন ঝুঁকি' : 'Low Risk'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Customer List */}
        <Card variant="elevated" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base">
              {isBangla ? 'বকেয়া গ্রাহক তালিকা' : 'Outstanding Customers'} ({sortedParties.length})
            </CardTitle>
          </CardHeader>
          <Divider />
          {sortedParties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{isBangla ? 'কোনো বকেয়া নেই' : 'No outstanding balances'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isBangla ? 'সব গ্রাহক থেকে পেমেন্ট আদায় হয়েছে' : 'All customer payments are up to date'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border-subtle">
                {sortedParties.map((party, index) => (
                  <PartyRow 
                    key={party.id} 
                    party={party} 
                    isBangla={isBangla} 
                    index={index}
                    onClick={() => router.push(`/parties/${party.id}/edit`)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
  
  );
}

// Summary Card
function SummaryCard({
  title,
  titleBn,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  titleBn: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'emerald' | 'indigo' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    emerald: 'text-primary bg-primary-subtle',
    indigo: 'text-indigo bg-indigo-subtle',
    warning: 'text-warning bg-warning-subtle',
    destructive: 'text-destructive bg-destructive-subtle',
  };

  return (
    <Card variant="elevated" padding="default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Aging Bucket
function AgingBucket({
  label,
  labelBn,
  amount,
  total,
  color,
  isBangla,
}: {
  label: string;
  labelBn: string;
  amount: number;
  total: number;
  color: 'emerald' | 'indigo' | 'warning' | 'destructive';
  isBangla: boolean;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  const colorClasses = {
    emerald: 'bg-primary',
    indigo: 'bg-indigo',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border-subtle">
      <p className="text-xs text-muted-foreground mb-1">{isBangla ? labelBn : label}</p>
      <p className="text-lg font-bold">৳{amount.toLocaleString()}</p>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
    </div>
  );
}

// Party Row
function PartyRow({
  party,
  isBangla,
  index,
  onClick,
}: {
  party: PartyWithBalance;
  isBangla: boolean;
  index: number;
  onClick: () => void;
}) {
  const riskLevel = party.riskLevel || 'low';
  const creditUsage = party.creditLimit && party.creditLimit > 0 
    ? (party.currentBalance / party.creditLimit) * 100 
    : 0;

  const daysSincePayment = party.lastPaymentDate 
    ? Math.floor((Date.now() - new Date(party.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
    : 90;

  const riskConfig = {
    high: { label: isBangla ? 'উচ্চ' : 'High', variant: 'destructive' as const },
    medium: { label: isBangla ? 'মধ্যম' : 'Medium', variant: 'warning' as const },
    low: { label: isBangla ? 'নিম্ন' : 'Low', variant: 'success' as const },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
          <span className="text-sm font-semibold text-muted-foreground">
            {party.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {party.name}
            </p>
            <Badge variant={riskConfig[riskLevel as keyof typeof riskConfig]?.variant || 'success'} size="sm">
              {riskConfig[riskLevel as keyof typeof riskConfig]?.label || 'Low'}
            </Badge>
            {party.customerTier && party.customerTier !== 'regular' && (
              <Badge variant="indigo" size="sm">{party.customerTier.toUpperCase()}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-muted-foreground">{party.phone || '-'}</span>
            <span className="text-xs text-muted-foreground">
              {party.type === 'customer' ? (isBangla ? 'গ্রাহক' : 'Customer') : 
               party.type === 'supplier' ? (isBangla ? 'সরবরাহকারী' : 'Supplier') : 
               (isBangla ? 'উভয়' : 'Both')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Credit Usage */}
        {party.creditLimit && party.creditLimit > 0 && (
          <div className="w-32 hidden md:block">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{isBangla ? 'ব্যবহৃত' : 'Used'}</span>
              <span className={cn(
                'font-medium',
                creditUsage > 80 ? 'text-destructive' : creditUsage > 60 ? 'text-warning' : 'text-primary'
              )}>
                {creditUsage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={creditUsage}
              size="sm"
              color={creditUsage > 80 ? 'destructive' : creditUsage > 60 ? 'warning' : 'emerald'}
            />
          </div>
        )}

        {/* Outstanding */}
        <div className="text-right w-28">
          <p className="font-bold">৳{party.currentBalance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {daysSincePayment > 30 
              ? `${daysSincePayment} ${isBangla ? 'দিন আগে' : 'days ago'}`
              : (isBangla ? 'বকেয়া' : 'Outstanding')
            }
          </p>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </motion.div>
  );
}
