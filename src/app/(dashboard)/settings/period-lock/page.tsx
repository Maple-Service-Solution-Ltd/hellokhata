'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  User,
  Trash2
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PeriodLock {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  lockedAt: Date;
  lockedBy?: string;
  notes?: string;
}

export default function PeriodLockPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  
  const [locks, setLocks] = useState<PeriodLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    periodStart: '',
    periodEnd: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [globalLockDate, setGlobalLockDate] = useState<string | null>(null);

  useEffect(() => {
    fetchLocks();
  }, []);

  const fetchLocks = async () => {
    try {
      // In production, fetch from API
      // const response = await fetch('/api/period-locks');
      setLocks([]);
    } catch (error) {
      console.error('Error fetching locks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    if (!form.periodStart || !form.periodEnd) return;
    
    setSaving(true);
    try {
      // In production, call API
      const newLock: PeriodLock = {
        id: Date.now().toString(),
        periodStart: new Date(form.periodStart),
        periodEnd: new Date(form.periodEnd),
        lockedAt: new Date(),
        notes: form.notes,
      };
      
      setLocks([newLock, ...locks]);
      setShowForm(false);
      setForm({ periodStart: '', periodEnd: '', notes: '' });
    } catch (error) {
      console.error('Error locking period:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async (lockId: string) => {
    if (!confirm(isBangla 
      ? 'আপনি কি নিশ্চিত যে আপনি এই সময়কাল আনলক করতে চান?'
      : 'Are you sure you want to unlock this period?'
    )) {
      return;
    }
    
    try {
      setLocks(locks.filter(l => l.id !== lockId));
    } catch (error) {
      console.error('Error unlocking:', error);
    }
  };

  const handleSetGlobalLock = async () => {
    if (!globalLockDate) return;
    
    try {
      // In production, call API
      // await fetch('/api/period-lock/global', { method: 'POST', body: JSON.stringify({ date: globalLockDate }) });
      alert(isBangla 
        ? `সফলভাবে ${format(new Date(globalLockDate), 'dd MMMM yyyy')} পর্যন্ত লক করা হয়েছে`
        : `Successfully locked until ${format(new Date(globalLockDate), 'dd MMMM yyyy')}`
      );
    } catch (error) {
      console.error('Error setting global lock:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo('settings')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {isBangla ? 'সময়কাল লক' : 'Period Lock'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? 'হিসাবের সময়কাল লক করুন'
                    : 'Lock accounting periods to prevent changes'}
                </p>
              </div>
            </div>
            
            <Button onClick={() => setShowForm(true)}>
              <Lock className="h-4 w-4 mr-2" />
              {isBangla ? 'নতুন লক' : 'Add Lock'}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 text-blue-700">
            <Shield className="h-5 w-5" />
            <p className="text-sm">
              {isBangla 
                ? 'লক করা সময়কালে কোন লেনদেন সম্পাদনা বা মুছে ফেলা যাবে না।'
                : 'Locked periods cannot have transactions edited or deleted.'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Global Lock Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              {isBangla ? 'গ্লোবাল লক' : 'Global Lock'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {isBangla 
                ? 'একটি তারিখ নির্বাচন করুন। এই তারিখের আগে সব লেনদেন লক হয়ে যাবে।'
                : 'Set a date. All transactions before this date will be locked.'}
            </p>
            
            <div className="flex gap-4">
              <Input
                type="date"
                value={globalLockDate || ''}
                onChange={(e) => setGlobalLockDate(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSetGlobalLock} disabled={!globalLockDate}>
                {isBangla ? 'লক করুন' : 'Lock'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Lock Form */}
        {showForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {isBangla ? 'নতুন সময়কাল লক করুন' : 'Lock New Period'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {isBangla ? 'শুরুর তারিখ' : 'Start Date'}
                  </label>
                  <Input
                    type="date"
                    value={form.periodStart}
                    onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {isBangla ? 'শেষের তারিখ' : 'End Date'}
                  </label>
                  <Input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {isBangla ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)'}
                </label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={isBangla ? 'লকের কারণ...' : 'Reason for lock...'}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button onClick={handleLock} disabled={saving}>
                  <Lock className="h-4 w-4 mr-2" />
                  {isBangla ? 'লক করুন' : 'Lock Period'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Locks */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            {isBangla ? 'সক্রিয় লক' : 'Active Locks'}
          </h2>
          
          {locks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Unlock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="mt-4 font-medium">
                  {isBangla ? 'কোন সক্রিয় লক নেই' : 'No Active Locks'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isBangla 
                    ? 'সময়কাল লক করতে উপরের বাটনে ক্লিক করুন'
                    : 'Click the button above to lock a period'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {locks.map((lock) => (
                <Card key={lock.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-red-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-700">
                              {isBangla ? 'লক করা' : 'Locked'}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(lock.periodStart), 'dd MMM yyyy')} - {format(new Date(lock.periodEnd), 'dd MMM yyyy')}
                            </span>
                            
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(lock.lockedAt), 'dd MMM yyyy HH:mm')}
                            </span>
                          </div>
                          
                          {lock.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {lock.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleUnlock(lock.id)}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        {isBangla ? 'আনলক' : 'Unlock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-700">
                  {isBangla ? 'সতর্কতা' : 'Warning'}
                </h4>
                <p className="text-sm text-amber-600 mt-1">
                  {isBangla 
                    ? 'লক করা সময়কালের লেনদেন পরিবর্তন করতে প্রথমে আনলক করতে হবে। এটি অডিট ট্রেইলে রেকর্ড হবে।'
                    : 'To modify transactions in locked periods, you must first unlock them. This will be recorded in the audit trail.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
