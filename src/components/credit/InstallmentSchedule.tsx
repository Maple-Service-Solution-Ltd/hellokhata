// Hello Khata - Installment Schedule Component
// Displays a table of installments with payment actions

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  Bell,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Installment, InstallmentStatus } from '@/types';

interface InstallmentScheduleProps {
  installments: Installment[];
  totalAmount: number;
  totalPaid: number;
  currency?: string;
  onRecordPayment: (installmentId: string, amount: number, paidDate: string, notes?: string) => Promise<void>;
  onSendReminder: (installmentId: string) => Promise<void>;
  isLoading?: boolean;
}

const statusConfig: Record<InstallmentStatus, { 
  label: string; 
  className: string; 
  icon: React.ElementType;
}> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700', icon: Clock },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700', icon: AlertCircle },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700', icon: Clock },
};

export function InstallmentSchedule({
  installments,
  totalAmount,
  totalPaid,
  currency = 'BDT',
  onRecordPayment,
  onSendReminder,
  isLoading = false,
}: InstallmentScheduleProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
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

  const openPaymentModal = (installment: Installment) => {
    setSelectedInstallment(installment);
    const remainingAmount = installment.amount - installment.paidAmount;
    setPaymentAmount(remainingAmount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedInstallment || !paymentAmount) return;
    
    setIsProcessing(true);
    try {
      await onRecordPayment(
        selectedInstallment.id,
        parseFloat(paymentAmount),
        paymentDate,
        paymentNotes || undefined
      );
      setPaymentModalOpen(false);
      setSelectedInstallment(null);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReminder = async (installmentId: string) => {
    try {
      await onSendReminder(installmentId);
    } catch (error) {
      console.error('Reminder failed:', error);
    }
  };

  const totalRemaining = totalAmount - totalPaid;
  const paidCount = installments.filter((i) => i.status === 'paid').length;
  const overdueCount = installments.filter((i) => i.status === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      {/* Installments Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((installment) => {
              const status = statusConfig[installment.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const remaining = installment.amount - installment.paidAmount;
              const isPastDue = new Date(installment.dueDate) < new Date() && installment.status !== 'paid';

              return (
                <TableRow
                  key={installment.id}
                  className={cn(
                    installment.status === 'overdue' && 'bg-red-50',
                    installment.status === 'paid' && 'bg-emerald-50/50'
                  )}
                >
                  <TableCell className="font-medium">
                    {installment.installmentNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={cn(isPastDue && 'text-red-600 font-medium')}>
                        {formatDate(installment.dueDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(installment.amount)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatCurrency(installment.paidAmount)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-medium',
                    remaining > 0 ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {formatCurrency(remaining)}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('flex items-center gap-1 w-fit', status.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {installment.status !== 'paid' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPaymentModal(installment)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                          {!installment.reminderSent && (
                            <DropdownMenuItem onClick={() => handleReminder(installment.id)}>
                              <Bell className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Total Row */}
            <TableRow className="bg-gray-100 font-semibold">
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
              <TableCell className="text-right text-emerald-600">{formatCurrency(totalPaid)}</TableCell>
              <TableCell className="text-right text-red-600">{formatCurrency(totalRemaining)}</TableCell>
              <TableCell colSpan={2}>
                <div className="flex gap-1">
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {paidCount} paid
                  </Badge>
                  {overdueCount > 0 && (
                    <Badge className="bg-red-100 text-red-700">
                      {overdueCount} overdue
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Installment #{selectedInstallment?.installmentNo} - 
              Amount: {selectedInstallment && formatCurrency(selectedInstallment.amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {selectedInstallment && (
                <p className="text-sm text-gray-500">
                  Remaining: {formatCurrency(selectedInstallment.amount - selectedInstallment.paidAmount)}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes..."
              />
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!paymentAmount || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstallmentSchedule;
