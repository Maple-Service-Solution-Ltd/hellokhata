'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight,
  Search,
  ArrowDownUp,
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  mobileNumber?: string;
  bankName?: string;
}

interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  status: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export default function AccountTransfersPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, transfersRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/accounts/transfers'),
      ]);
      
      const accountsData = await accountsRes.json();
      const transfersData = await transfersRes.json();
      
      if (accountsData.success) setAccounts(accountsData.data);
      if (transfersData.success) setTransfers(transfersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!form.fromAccountId || !form.toAccountId || !form.amount) return;
    
    if (form.fromAccountId === form.toAccountId) {
      alert(isBangla ? 'উৎস এবং গন্তব্য একই হতে পারবে না' : 'Source and destination cannot be the same');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/accounts/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          amount: parseFloat(form.amount),
          notes: form.notes,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowForm(false);
        setForm({ fromAccountId: '', toAccountId: '', amount: '', notes: '' });
      } else {
        alert(data.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet className="h-5 w-5" />;
      case 'bank':
        return <Building2 className="h-5 w-5" />;
      case 'mobile_wallet':
        return <Smartphone className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown';
  };

  const getAccountBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      cash: { bg: 'bg-emerald-100 text-emerald-700', text: isBangla ? 'নগদ' : 'Cash' },
      bank: { bg: 'bg-blue-100 text-blue-700', text: isBangla ? 'ব্যাংক' : 'Bank' },
      mobile_wallet: { bg: 'bg-purple-100 text-purple-700', text: 'bKash/Nagad' },
      credit_card: { bg: 'bg-amber-100 text-amber-700', text: isBangla ? 'কার্ড' : 'Card' },
    };
    
    const style = styles[type] || styles.cash;
    return <Badge className={cn('text-xs', style.bg)}>{style.text}</Badge>;
  };

  const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo('settings-accounts')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <ArrowDownUp className="h-5 w-5" />
                  {isBangla ? 'অ্যাকাউন্ট স্থানান্তর' : 'Account Transfers'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? 'অ্যাকাউন্টের মধ্যে টাকা স্থানান্তর করুন'
                    : 'Transfer money between accounts'}
                </p>
              </div>
            </div>
            
            <Button onClick={() => setShowForm(true)}>
              <ArrowDownUp className="h-4 w-4 mr-2" />
              {isBangla ? 'নতুন স্থানান্তর' : 'New Transfer'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ArrowDownUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট স্থানান্তর' : 'Total Transfers'}
                  </p>
                  <p className="text-xl font-bold">{transfers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-600">৳</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট পরিমাণ' : 'Total Amount'}
                  </p>
                  <p className="text-xl font-bold">৳{totalTransferred.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Accounts'}
                  </p>
                  <p className="text-xl font-bold">{accounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transfer Form */}
      {showForm && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">
                {isBangla ? 'নতুন স্থানান্তর' : 'New Transfer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {isBangla ? 'উৎস অ্যাকাউন্ট' : 'From Account'}
                  </label>
                  <select
                    value={form.fromAccountId}
                    onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{isBangla ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select account'}</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (৳{acc.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">
                    {isBangla ? 'গন্তব্য অ্যাকাউন্ট' : 'To Account'}
                  </label>
                  <select
                    value={form.toAccountId}
                    onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{isBangla ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select account'}</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (৳{acc.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {isBangla ? 'পরিমাণ' : 'Amount'}
                </label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="৳0.00"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {isBangla ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)'}
                </label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={isBangla ? 'স্থানান্তরের কারণ...' : 'Transfer reason...'}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button onClick={handleTransfer} disabled={saving}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {isBangla ? 'স্থানান্তর করুন' : 'Transfer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accounts Quick View */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-lg font-semibold mb-4">
          {isBangla ? 'অ্যাকাউন্ট সমূহ' : 'Accounts'}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {accounts.map((account) => (
            <Card key={account.id} className="cursor-pointer hover:border-primary/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{account.name}</p>
                    <p className="text-lg font-bold">৳{account.currentBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transfers History */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-lg font-semibold mb-4">
          {isBangla ? 'স্থানান্তরের ইতিহাস' : 'Transfer History'}
        </h2>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
          </div>
        ) : transfers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <ArrowDownUp className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 font-medium">
                {isBangla ? 'কোন স্থানান্তর নেই' : 'No Transfers Yet'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isBangla 
                  ? 'অ্যাকাউন্টের মধ্যে টাকা স্থানান্তর শুরু করুন'
                  : 'Start transferring money between accounts'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <Card key={transfer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ArrowDownUp className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{getAccountName(transfer.fromAccountId)}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getAccountName(transfer.toAccountId)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(transfer.createdAt), 'dd MMM yyyy HH:mm')}
                          </span>
                          
                          {transfer.notes && (
                            <span>{transfer.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">৳{transfer.amount.toLocaleString()}</p>
                      <Badge className={cn(
                        'text-xs',
                        transfer.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {transfer.status === 'completed' 
                          ? (isBangla ? 'সম্পন্ন' : 'Completed')
                          : (isBangla ? 'প্রক্রিয়াধীন' : 'Pending')
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
