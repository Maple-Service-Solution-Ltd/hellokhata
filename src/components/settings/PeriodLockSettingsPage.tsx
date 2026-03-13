// Hello Khata OS - Period Lock Settings Page
// হ্যালো খাতা - পিরিয়ড লক সেটিংস

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, KPICard, Divider, EmptyState } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lock,
  Unlock,
  Search,
  Calendar,
  Shield,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PeriodLock {
  id: string;
  periodStart: string;
  periodEnd: string;
  lockedBy: string;
  lockedAt: string;
  reason?: string;
  isActive: boolean;
}

// Fetch period locks
async function fetchPeriodLocks(): Promise<PeriodLock[]> {
  const res = await fetch('/api/period-locks');
  if (!res.ok) throw new Error('Failed to fetch period locks');
  return res.json();
}

// Create period lock
async function createPeriodLock(data: { periodStart: string; periodEnd: string; reason?: string }): Promise<PeriodLock> {
  const res = await fetch('/api/period-locks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create period lock');
  return res.json();
}

// Unlock period
async function unlockPeriod(id: string): Promise<void> {
  const res = await fetch(`/api/period-locks/${id}/unlock`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to unlock period');
}

export default function PeriodLockSettingsPage() {
  const { isBangla } = useAppTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLock, setSelectedLock] = useState<PeriodLock | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [newReason, setNewReason] = useState('');

  const { data: locks = [], isLoading } = useQuery({
    queryKey: ['period-locks'],
    queryFn: fetchPeriodLocks,
  });

  const createMutation = useMutation({
    mutationFn: createPeriodLock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-locks'] });
      toast({ title: isBangla ? 'পিরিয়ড লক করা হয়েছে' : 'Period locked successfully', variant: 'success' });
      setCreateDialogOpen(false);
      setNewPeriodStart('');
      setNewPeriodEnd('');
      setNewReason('');
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error creating period lock', variant: 'destructive' });
    }
  });

  const unlockMutation = useMutation({
    mutationFn: unlockPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-locks'] });
      toast({ title: isBangla ? 'পিরিয়ড আনলক করা হয়েছে' : 'Period unlocked successfully', variant: 'success' });
      setSelectedLock(null);
    },
    onError: () => {
      toast({ title: isBangla ? 'ত্রুটি হয়েছে' : 'Error unlocking period', variant: 'destructive' });
    }
  });

  // Calculate stats
  const activeLocks = locks.filter(l => l.isActive);
  const activeCount = activeLocks.length;
  const totalLocks = locks.length;
  
  // Get currently locked periods
  const now = new Date();
  const currentlyLockedPeriods = activeLocks.filter(l => {
    const start = new Date(l.periodStart);
    const end = new Date(l.periodEnd);
    return now >= start && now <= end;
  });

  const handleCreateLock = () => {
    if (!newPeriodStart || !newPeriodEnd) {
      toast({ title: isBangla ? 'তারিখ নির্বাচন করুন' : 'Please select dates', variant: 'warning' });
      return;
    }
    createMutation.mutate({
      periodStart: newPeriodStart,
      periodEnd: newPeriodEnd,
      reason: newReason || undefined,
    });
  };

  const handleUnlock = (id: string) => {
    unlockMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            {isBangla ? 'পিরিয়ড লক সেটিংস' : 'Period Lock Settings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'হিসাবের সময়কাল লক করুন' : 'Lock accounting periods to prevent edits'}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {isBangla ? 'নতুন লক' : 'New Lock'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isBangla ? 'পিরিয়ড লক করুন' : 'Lock Period'}</DialogTitle>
              <DialogDescription>
                {isBangla 
                  ? 'এই সময়কালের সকল লেনদেন সম্পাদনা থেকে সুরক্ষিত থাকবে।'
                  : 'All transactions in this period will be protected from editing.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'শুরুর তারিখ' : 'Start Date'}</Label>
                <Input
                  type="date"
                  value={newPeriodStart}
                  onChange={(e) => setNewPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'শেষের তারিখ' : 'End Date'}</Label>
                <Input
                  type="date"
                  value={newPeriodEnd}
                  onChange={(e) => setNewPeriodEnd(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'কারণ (ঐচ্ছিক)' : 'Reason (optional)'}</Label>
                <Input
                  placeholder={isBangla ? 'কারণ লিখুন...' : 'Enter reason...'}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button onClick={handleCreateLock} disabled={createMutation.isPending}>
                {isBangla ? 'লক করুন' : 'Lock Period'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Lock Warning */}
      {currentlyLockedPeriods.length > 0 && (
        <Card className="border-warning bg-warning-subtle">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {isBangla 
                  ? `বর্তমানে ${currentlyLockedPeriods.length}টি পিরিয়ড লক করা আছে`
                  : `${currentlyLockedPeriods.length} periods are currently locked`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isBangla 
                  ? 'লক করা পিরিয়ডে নতুন লেনদেন বা সম্পাদনা করা যাবে না'
                  : 'No new transactions or edits can be made in locked periods'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Locks"
          titleBn="সক্রিয় লক"
          value={activeCount}
          icon={<Lock className="h-5 w-5" />}
          iconColor="warning"
          isBangla={isBangla}
        />
        <KPICard
          title="Total Locks"
          titleBn="মোট লক"
          value={totalLocks}
          icon={<Shield className="h-5 w-5" />}
          iconColor="default"
          isBangla={isBangla}
        />
        <KPICard
          title="Currently Locked"
          titleBn="বর্তমানে লক"
          value={currentlyLockedPeriods.length}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="destructive"
          isBangla={isBangla}
        />
        <KPICard
          title="Unlocked"
          titleBn="আনলক করা"
          value={totalLocks - activeCount}
          icon={<Unlock className="h-5 w-5" />}
          iconColor="success"
          isBangla={isBangla}
        />
      </div>

      {/* Period Locks List */}
      <Card variant="elevated" padding="none">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base">
            {isBangla ? 'পিরিয়ড লকের তালিকা' : 'Period Locks List'}
          </CardTitle>
        </CardHeader>
        <Divider />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : locks.length === 0 ? (
            <EmptyState
              icon={<Lock className="h-8 w-8" />}
              title={isBangla ? 'কোনো পিরিয়ড লক নেই' : 'No period locks found'}
              description={isBangla ? 'পিরিয়ড লক তৈরি করুন' : 'Create a period lock to protect your data'}
              isBangla={isBangla}
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border-subtle">
                {locks.map((lock, index) => (
                  <LockRow
                    key={lock.id}
                    lock={lock}
                    isBangla={isBangla}
                    index={index}
                    onView={() => setSelectedLock(lock)}
                    onUnlock={() => handleUnlock(lock.id)}
                    isCurrentlyLocked={currentlyLockedPeriods.some(l => l.id === lock.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Lock Detail Modal */}
      <DetailModal
        isOpen={!!selectedLock}
        onClose={() => setSelectedLock(null)}
        title={isBangla ? 'পিরিয়ড লকের বিবরণ' : 'Period Lock Details'}
        subtitle={`${selectedLock ? new Date(selectedLock.periodStart).toLocaleDateString() : ''} - ${selectedLock ? new Date(selectedLock.periodEnd).toLocaleDateString() : ''}`}
        width="lg"
      >
        {selectedLock && (
          <>
            <DetailSection title={isBangla ? 'লকের তথ্য' : 'Lock Information'}>
              <DetailRow
                label={isBangla ? 'শুরুর তারিখ' : 'Start Date'}
                value={new Date(selectedLock.periodStart).toLocaleDateString()}
              />
              <DetailRow
                label={isBangla ? 'শেষের তারিখ' : 'End Date'}
                value={new Date(selectedLock.periodEnd).toLocaleDateString()}
              />
              <DetailRow
                label={isBangla ? 'স্ট্যাটাস' : 'Status'}
                value={
                  <Badge variant={selectedLock.isActive ? 'warning' : 'success'}>
                    {selectedLock.isActive 
                      ? (isBangla ? 'সক্রিয়' : 'Active')
                      : (isBangla ? 'নিষ্ক্রিয়' : 'Inactive')}
                  </Badge>
                }
              />
              <DetailRow
                label={isBangla ? 'লক করেছে' : 'Locked By'}
                value={selectedLock.lockedBy}
              />
              <DetailRow
                label={isBangla ? 'লক করার তারিখ' : 'Locked At'}
                value={new Date(selectedLock.lockedAt).toLocaleString()}
              />
              {selectedLock.reason && (
                <DetailRow
                  label={isBangla ? 'কারণ' : 'Reason'}
                  value={selectedLock.reason}
                />
              )}
            </DetailSection>

            {selectedLock.isActive && (
              <div className="mt-6">
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => handleUnlock(selectedLock.id)}
                  disabled={unlockMutation.isPending}
                >
                  <Unlock className="h-4 w-4" />
                  {isBangla ? 'পিরিয়ড আনলক করুন' : 'Unlock Period'}
                </Button>
              </div>
            )}
          </>
        )}
      </DetailModal>
    </div>
  );
}

// Lock Row Component
function LockRow({ 
  lock, 
  isBangla, 
  index, 
  onView, 
  onUnlock,
  isCurrentlyLocked
}: { 
  lock: PeriodLock; 
  isBangla: boolean; 
  index: number; 
  onView: () => void;
  onUnlock: () => void;
  isCurrentlyLocked: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1" onClick={onView}>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
          lock.isActive ? "bg-warning-subtle" : "bg-muted"
        )}>
          {lock.isActive ? (
            <Lock className="h-5 w-5 text-warning" />
          ) : (
            <Unlock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">
              {new Date(lock.periodStart).toLocaleDateString()} - {new Date(lock.periodEnd).toLocaleDateString()}
            </p>
            {lock.isActive && (
              <Badge variant="warning" size="sm">
                {isBangla ? 'সক্রিয়' : 'Active'}
              </Badge>
            )}
            {isCurrentlyLocked && (
              <Badge variant="destructive" size="sm" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {isBangla ? 'বর্তমান' : 'Current'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'লক করেছে' : 'By'}: {lock.lockedBy} • {new Date(lock.lockedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {lock.isActive && (
          <Button variant="outline" size="sm" className="gap-1" onClick={onUnlock}>
            <Unlock className="h-4 w-4" />
            <span className="hidden sm:inline">{isBangla ? 'আনলক' : 'Unlock'}</span>
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
