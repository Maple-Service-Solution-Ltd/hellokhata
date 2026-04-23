// Hello Khata - Payment Plan Card Component
// Displays a single payment plan with progress and actions

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Phone,
  Calendar,
  DollarSign,
  MoreVertical,
  Eye,
  CreditCard,
  Bell,
  Trash2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentPlan, PaymentPlanStatus } from '@/types';

interface PaymentPlanCardProps {
  plan: PaymentPlan & {
    party: { id: string; name: string; phone?: string | null };
    installments?: Array<{
      id: string;
      installmentNo: number;
      amount: number;
      dueDate: Date;
      status: string;
      paidAmount: number;
    }>;
    nextDueDate?: Date | null;
    nextDueAmount?: number;
    paidInstallments?: number;
  };
  onViewDetails: () => void;
  onRecordPayment: () => void;
  onSendReminder: () => void;
  onDelete?: () => void;
}

const statusConfig: Record<PaymentPlanStatus, { label: string; className: string; color: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700', color: 'emerald' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700', color: 'blue' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700', color: 'red' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700', color: 'gray' },
};

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
};

export function PaymentPlanCard({
  plan,
  onViewDetails,
  onRecordPayment,
  onSendReminder,
  onDelete,
}: PaymentPlanCardProps) {
  const [showActions, setShowActions] = useState(false);

  const status = statusConfig[plan.status] || statusConfig.active;
  const progressPercentage = plan.totalAmount > 0 
    ? Math.round((plan.paidAmount / plan.totalAmount) * 100) 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilDue = plan.nextDueDate ? getDaysUntilDue(plan.nextDueDate) : null;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      plan.status === 'overdue' && 'border-red-200 bg-red-50/30',
      plan.status === 'active' && 'border-emerald-200'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left Section - Customer Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
              plan.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'
            )}>
              <User className={cn(
                'h-6 w-6',
                plan.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {plan.party?.name || 'Unknown Customer'}
                </h3>
                <Badge className={cn('text-xs whitespace-nowrap', status.className)}>
                  {status.label}
                </Badge>
              </div>
              {plan.party?.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{plan.party.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {frequencyLabels[plan.frequency] || plan.frequency}
                </span>
                <span>
                  {plan.paidInstallments || 0}/{plan.totalInstallments} installments
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Amount & Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Amount */}
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(plan.remainingAmount)}
              </p>
              <p className="text-xs text-gray-500">remaining</p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {plan.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={onRecordPayment}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  Pay
                </Button>
              )}
              
              <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onViewDetails}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {plan.status === 'active' && (
                    <>
                      <DropdownMenuItem onClick={onRecordPayment}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSendReminder}>
                        <Bell className="h-4 w-4 mr-2" />
                        Send Reminder
                      </DropdownMenuItem>
                    </>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Plan
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {formatCurrency(plan.paidAmount)} paid
            </span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn(
              'h-2',
              plan.status === 'overdue' && '[&>div]:bg-red-500',
              plan.status === 'completed' && '[&>div]:bg-blue-500'
            )}
          />
        </div>

        {/* Next Due Date */}
        {plan.nextDueDate && plan.status === 'active' && (
          <div className={cn(
            'mt-3 flex items-center justify-between p-2 rounded-lg text-sm',
            isDueSoon ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'
          )}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Next due: {formatDate(plan.nextDueDate)}</span>
            </div>
            <span className="font-medium">
              {formatCurrency(plan.nextDueAmount || 0)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentPlanCard;
