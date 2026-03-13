// Hello Khata OS - Account Management Page
// হ্যালো খাতা - অ্যাকাউন্ট ম্যানেজমেন্ট পেজ

'use client';

import { FeatureGate, PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccounts } from '@/hooks/queries';
import { useAccountStore } from '@/stores/accountStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountsPage() {
  const { isBangla } = useAppTranslation();
  const { data: accounts, isLoading } = useAccounts();
  const { totalCashBalance, totalBankBalance, totalBalance } = useAccountStore();

  if (isLoading) {
    return (
   
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
 
    );
  }

  const accountTypeIcons = {
    cash: Wallet,
    bank: Building2,
    mobile_wallet: Smartphone,
    credit_card: CreditCard,
  };

  return (
    <FeatureGate feature="reconciliation">

        <div className="space-y-6">
          <PageHeader
            title={isBangla ? 'অ্যাকাউন্ট পরিচালনা' : 'Account Management'}
            subtitle={isBangla ? 'ক্যাশ, ব্যাংক ও মোবাইল ওয়ালেট' : 'Cash, Bank & Mobile Wallet accounts'}
            icon={Wallet}
          >
            <div className="flex gap-2">
              <Button variant="outline">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                {isBangla ? 'স্থানান্তর' : 'Transfer'}
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                {isBangla ? 'নতুন অ্যাকাউন্ট' : 'Add Account'}
              </Button>
            </div>
          </PageHeader>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{isBangla ? 'মোট ক্যাশ' : 'Total Cash'}</p>
                    <p className="text-2xl font-bold">৳{totalCashBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{isBangla ? 'মোট ব্যাংক' : 'Total Bank'}</p>
                    <p className="text-2xl font-bold">৳{totalBankBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{isBangla ? 'মোট ব্যালেন্স' : 'Total Balance'}</p>
                    <p className="text-2xl font-bold">৳{totalBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account List */}
          <Card>
            <CardHeader>
              <CardTitle>{isBangla ? 'সকল অ্যাকাউন্ট' : 'All Accounts'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts?.map((account) => {
                  const Icon = accountTypeIcons[account.type] || Wallet;
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          account.type === 'cash' && 'bg-emerald-100 dark:bg-emerald-900',
                          account.type === 'bank' && 'bg-blue-100 dark:bg-blue-900',
                          account.type === 'mobile_wallet' && 'bg-purple-100 dark:bg-purple-900'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            account.type === 'cash' && 'text-emerald-600',
                            account.type === 'bank' && 'text-blue-600',
                            account.type === 'mobile_wallet' && 'text-purple-600'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{account.nameBn || account.name}</p>
                            {account.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                {isBangla ? 'ডিফল্ট' : 'Default'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {account.type === 'bank' && account.bankName}
                            {account.type === 'mobile_wallet' && account.mobileNumber}
                            {account.type === 'cash' && (isBangla ? 'ক্যাশ অ্যাকাউন্ট' : 'Cash Account')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">৳{account.currentBalance.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {account.lastReconciledAt 
                            ? `${isBangla ? 'সর্বশেষ:' : 'Last:'} ${new Date(account.lastReconciledAt).toLocaleDateString(isBangla ? 'bn-BD' : 'en-US')}`
                            : (isBangla ? 'রিকনসাইল নেই' : 'Not reconciled')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
    
    </FeatureGate>
  );
}
