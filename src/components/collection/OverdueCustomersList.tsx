// Hello Khata - Overdue Customers List
// হ্যালো খাতা - বকেয়া গ্রাহক তালিকা
// List of overdue customers with filtering and actions

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  Search,
  ArrowUpDown,
  Phone,
  MessageSquare,
  Calendar,
  ChevronRight,
  Clock,
  User,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import type { OverdueCustomer } from './CollectionCenterPage';

type AgingFilter = 'all' | '1-30' | '31-60' | '61-90' | '90+';
type SortOption = 'amount-high' | 'amount-low' | 'days-overdue' | 'last-contact';

interface OverdueCustomersListProps {
  customers: OverdueCustomer[];
  isLoading?: boolean;
  onSendReminder: (customer: OverdueCustomer) => void;
  onRecordPromise: (customer: OverdueCustomer) => void;
  onSelectCustomer: (customer: OverdueCustomer) => void;
  onRefresh: () => void;
}

export function OverdueCustomersList({
  customers,
  isLoading,
  onSendReminder,
  onRecordPromise,
  onSelectCustomer,
  onRefresh,
}: OverdueCustomersListProps) {
  const { isBangla } = useAppTranslation();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('amount-high');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get days overdue color
  const getDaysOverdueColor = (days: number): string => {
    if (days > 90) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (days > 60) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    if (days > 30) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter((customer) => {
      // Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          customer.name.toLowerCase().includes(query) ||
          customer.nameBn?.includes(query) ||
          customer.phone?.includes(query);
        if (!matchesSearch) return false;
      }

      // Aging filter
      if (agingFilter !== 'all') {
        switch (agingFilter) {
          case '1-30':
            return customer.daysOverdue >= 1 && customer.daysOverdue <= 30;
          case '31-60':
            return customer.daysOverdue >= 31 && customer.daysOverdue <= 60;
          case '61-90':
            return customer.daysOverdue >= 61 && customer.daysOverdue <= 90;
          case '90+':
            return customer.daysOverdue > 90;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount-high':
          return b.totalOutstanding - a.totalOutstanding;
        case 'amount-low':
          return a.totalOutstanding - b.totalOutstanding;
        case 'days-overdue':
          return b.daysOverdue - a.daysOverdue;
        case 'last-contact':
          const aDate = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
          const bDate = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
          return aDate - bDate;
        default:
          return 0;
      }
    });

  // Get customer count by aging bucket
  const getCustomerCountByAging = (filter: AgingFilter): number => {
    if (filter === 'all') return customers.length;
    return customers.filter((c) => {
      switch (filter) {
        case '1-30':
          return c.daysOverdue >= 1 && c.daysOverdue <= 30;
        case '31-60':
          return c.daysOverdue >= 31 && c.daysOverdue <= 60;
        case '61-90':
          return c.daysOverdue >= 61 && c.daysOverdue <= 90;
        case '90+':
          return c.daysOverdue > 90;
        default:
          return true;
      }
    }).length;
  };

  // Get aging bucket label
  const getAgingLabel = (filter: AgingFilter): string => {
    const labels: Record<AgingFilter, string> = {
      all: isBangla ? 'সব বকেয়া' : 'All Overdue',
      '1-30': isBangla ? '১-৩০ দিন' : '1-30 Days',
      '31-60': isBangla ? '৩১-৬০ দিন' : '31-60 Days',
      '61-90': isBangla ? '৬১-৯০ দিন' : '61-90 Days',
      '90+': isBangla ? '৯০+ দিন' : '90+ Days',
    };
    return labels[filter];
  };

  // Render skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{isBangla ? 'বকেয়া গ্রাহক' : 'Overdue Customers'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {isBangla ? 'বকেয়া গ্রাহক' : 'Overdue Customers'}
            <Badge variant="secondary" className="ml-2">
              {customers.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'গ্রাহক খুঁজুন...' : 'Search customers...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder={isBangla ? 'সাজান' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount-high">{isBangla ? 'পরিমাণ (বেশি থেকে কম)' : 'Amount (High to Low)'}</SelectItem>
              <SelectItem value="amount-low">{isBangla ? 'পরিমাণ (কম থেকে বেশি)' : 'Amount (Low to High)'}</SelectItem>
              <SelectItem value="days-overdue">{isBangla ? 'বকেয়া দিন' : 'Days Overdue'}</SelectItem>
              <SelectItem value="last-contact">{isBangla ? 'শেষ যোগাযোগ' : 'Last Contact'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Aging Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(['all', '1-30', '31-60', '61-90', '90+'] as AgingFilter[]).map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={agingFilter === filter ? 'default' : 'outline'}
              onClick={() => setAgingFilter(filter)}
              className={cn(
                'relative',
                filter === '90+' && agingFilter === filter && 'bg-red-500 hover:bg-red-600',
                filter === '61-90' && agingFilter === filter && 'bg-orange-500 hover:bg-orange-600',
                filter === '31-60' && agingFilter === filter && 'bg-amber-500 hover:bg-amber-600',
                filter === '1-30' && agingFilter === filter && 'bg-yellow-500 hover:bg-yellow-600'
              )}
            >
              {getAgingLabel(filter)}
              <Badge
                variant="secondary"
                className={cn(
                  'ml-2 text-xs',
                  agingFilter === filter ? 'bg-white/20' : 'bg-muted'
                )}
              >
                {getCustomerCountByAging(filter)}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Customer List */}
        <ScrollArea className="h-[400px] pr-4">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold">
                {isBangla ? 'কোন বকেয়া নেই' : 'No Overdue Payments'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {isBangla
                  ? 'সব পেমেন্ট সময়মতো হয়েছে!'
                  : 'All payments are up to date!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onSelectCustomer(customer)}
                >
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {(customer.nameBn || customer.name).charAt(0)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {isBangla && customer.nameBn ? customer.nameBn : customer.name}
                      </p>
                      {customer.promiseStatus === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {isBangla ? 'প্রতিশ্রুতি' : 'Promise'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(customer.totalOutstanding)}
                    </p>
                    <Badge className={getDaysOverdueColor(customer.daysOverdue)}>
                      <Clock className="h-3 w-3 mr-1" />
                      {customer.daysOverdue} {isBangla ? 'দিন' : 'days'}
                    </Badge>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {customer.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendReminder(customer);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default OverdueCustomersList;
