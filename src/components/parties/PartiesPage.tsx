// Hello Khata OS - Parties Page
// হ্যালো খাতা - পার্টি পেজ

'use client';

import { useState } from 'react';
import { PageHeader, EmptyState } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Eye,
  MessageCircle,
  MoreVertical,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useParties } from '@/hooks/queries';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { Party } from '@/types';

export default function PartiesPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const { data: parties = [], isLoading } = useParties();

  const router = useRouter()
  // Filter parties
  const filteredParties = parties.filter((party) => {
    const matchesSearch = party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.phone?.includes(searchTerm);
    const matchesType = typeFilter === 'all' || party.type === typeFilter || party.type === 'both';
    return matchesSearch && matchesType;
  });

  // Separate customers and suppliers for stats
  const customers = parties.filter((p) => p.type === 'customer' || p.type === 'both');
  const suppliers = parties.filter((p) => p.type === 'supplier' || p.type === 'both');
  const totalReceivable = parties.reduce((sum, p) => sum + (p.currentBalance > 0 ? p.currentBalance : 0), 0);
  const totalPayable = parties.reduce((sum, p) => sum + (p.currentBalance < 0 ? Math.abs(p.currentBalance) : 0), 0);

  return (
    <>
    <div className="space-y-6">
      <PageHeader
          title={t('parties.title')}
          subtitle={isBangla ? 'গ্রাহক ও সরবরাহকারী ব্যবস্থাপনা' : 'Customer & supplier management'}
          icon={Users}
          action={{
            label: t('parties.addParty'),
            onClick: () => router.push('/parties/new'),
            icon: Plus,
          }}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter('customer')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</div>
                  <p className="text-sm text-gray-500 truncate">{t('parties.customers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter('supplier')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</div>
                  <p className="text-sm text-gray-500 truncate">{t('parties.suppliers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold text-emerald-600 truncate">{formatCurrency(totalReceivable)}</div>
                  <p className="text-sm text-gray-500 truncate">{t('dashboard.receivable')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-bold text-red-600 truncate">{formatCurrency(totalPayable)}</div>
                  <p className="text-sm text-gray-500 truncate">{t('dashboard.payable')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 shrink-0" />
                <Input
                  placeholder={isBangla ? 'নাম বা ফোন খুঁজুন...' : 'Search by name or phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={isBangla ? 'ধরন' : 'Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
                  <SelectItem value="customer">{isBangla ? 'গ্রাহক' : 'Customer'}</SelectItem>
                  <SelectItem value="supplier">{isBangla ? 'সরবরাহকারী' : 'Supplier'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Parties List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg whitespace-nowrap">{isBangla ? 'পার্টি তালিকা' : 'Party List'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredParties.length === 0 ? (
              <EmptyState
                icon={Users}
                title={isBangla ? 'কোনো পার্টি নেই' : 'No parties found'}
                description={isBangla ? 'নতুন পার্টি যোগ করুন' : 'Add your first party'}
                action={{
                  label: t('parties.addParty'),
                  onClick: () => router.push('/parties/new'),
                  icon: Plus,
                }}
              />
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredParties.map((party) => (
                    <PartyCard 
                      key={party.id} 
                      party={party} 
                      onView={() => setSelectedParty(party)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Party Detail Modal */}
      <DetailModal
        isOpen={!!selectedParty}
        onClose={() => setSelectedParty(null)}
        title={selectedParty?.name || ''}
        subtitle={selectedParty?.type === 'customer' 
          ? (isBangla ? 'গ্রাহক' : 'Customer')
          : selectedParty?.type === 'supplier'
          ? (isBangla ? 'সরবরাহকারী' : 'Supplier')
          : (isBangla ? 'উভয়' : 'Both')
        }
        width="lg"
      >
        {selectedParty && (
          <>
            <DetailSection title={isBangla ? 'যোগাযোগ তথ্য' : 'Contact Information'}>
              {selectedParty.phone && (
                <DetailRow
                  label={isBangla ? 'ফোন' : 'Phone'}
                  value={selectedParty.phone}
                  icon={<Phone className="h-5 w-5 text-blue-600" />}
                />
              )}
              {selectedParty.email && (
                <DetailRow
                  label={isBangla ? 'ইমেইল' : 'Email'}
                  value={selectedParty.email}
                  icon={<Mail className="h-5 w-5 text-purple-600" />}
                />
              )}
              {selectedParty.address && (
                <DetailRow
                  label={isBangla ? 'ঠিকানা' : 'Address'}
                  value={selectedParty.address}
                  icon={<MapPin className="h-5 w-5 text-red-600" />}
                />
              )}
            </DetailSection>

            <DetailSection title={isBangla ? 'আর্থিক তথ্য' : 'Financial Information'}>
              <DetailRow
                label={isBangla ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
                value={
                  <span className={cn(
                    'font-bold',
                    selectedParty.currentBalance > 0 ? 'text-emerald-600' : 
                    selectedParty.currentBalance < 0 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {formatCurrency(selectedParty.currentBalance)}
                  </span>
                }
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              />
              {selectedParty.creditLimit && (
                <DetailRow
                  label={isBangla ? 'ক্রেডিট লিমিট' : 'Credit Limit'}
                  value={formatCurrency(selectedParty.creditLimit)}
                  icon={<CreditCard className="h-5 w-5 text-amber-600" />}
                />
              )}
              {selectedParty.paymentTerms && (
                <DetailRow
                  label={isBangla ? 'পেমেন্ট শর্ত' : 'Payment Terms'}
                  value={`${selectedParty.paymentTerms} ${isBangla ? 'দিন' : 'days'}`}
                  icon={<Calendar className="h-5 w-5 text-blue-600" />}
                />
              )}
            </DetailSection>

            {selectedParty.notes && (
              <DetailSection title={isBangla ? 'নোট' : 'Notes'}>
                <DetailRow
                  label=""
                  value={selectedParty.notes}
                  icon={<FileText className="h-5 w-5 text-gray-600" />}
                />
              </DetailSection>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button 
                className="flex-1"
                onClick={() => {
                  window.location.href = `/parties/${selectedParty.id}/edit`;
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isBangla ? 'সম্পাদনা' : 'Edit'}
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Open SMS/WhatsApp
                  if (selectedParty.phone) {
                    window.open(`tel:${selectedParty.phone}`);
                  }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isBangla ? 'যোগাযোগ' : 'Contact'}
              </Button>
            </div>
          </>
        )}
        </DetailModal>
    </>
  );
}

// Party Card Component
function PartyCard({ party, onView }: { party: Party; onView: () => void }) {
  const { isBangla } = useAppTranslation();
  const { formatCurrency } = useCurrency();

  const getRiskBadge = () => {
    if (!party.riskLevel || party.currentBalance <= 0) return null;

    const colorMap = {
      low: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-red-100 text-red-700',
    };

    const labelMap = {
      low: isBangla ? 'কম ঝুঁকি' : 'Low Risk',
      medium: isBangla ? 'মাঝারি ঝুঁকি' : 'Medium Risk',
      high: isBangla ? 'উচ্চ ঝুঁকি' : 'High Risk',
    };

    return (
      <Badge className={cn('text-xs whitespace-nowrap', colorMap[party.riskLevel])}>
        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
        {labelMap[party.riskLevel]}
      </Badge>
    );
  };

  const getTypeBadge = () => {
    const colorMap = {
      customer: 'bg-blue-100 text-blue-700',
      supplier: 'bg-purple-100 text-purple-700',
      both: 'bg-gray-100 text-gray-700',
    };

    const labelMap = {
      customer: isBangla ? 'গ্রাহক' : 'Customer',
      supplier: isBangla ? 'সরবরাহকারী' : 'Supplier',
      both: isBangla ? 'উভয়' : 'Both',
    };

    return (
      <Badge className={cn('text-xs whitespace-nowrap', colorMap[party.type])}>
        {labelMap[party.type]}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors gap-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          {party.type === 'supplier' ? (
            <Building2 className="h-6 w-6 text-purple-600" />
          ) : (
            <User className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{party.name}</p>
            {getTypeBadge()}
            {getRiskBadge()}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
            {party.phone && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Phone className="h-3 w-3 shrink-0" />
                {party.phone}
              </span>
            )}
            {party.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{party.address}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right min-w-0">
          <p className={cn(
            'font-bold truncate',
            party.currentBalance > 0 ? 'text-emerald-600' : party.currentBalance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
          )}>
            {party.currentBalance >= 0 ? '+' : ''}{formatCurrency(party.currentBalance)}
          </p>
          <p className="text-xs text-gray-500 whitespace-nowrap">
            {party.currentBalance > 0 ? (isBangla ? 'পাওনা' : 'Receivable') : party.currentBalance < 0 ? (isBangla ? 'দেনা' : 'Payable') : (isBangla ? 'ক্লিয়ার' : 'Clear')}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => party.phone && window.open(`tel:${party.phone}`)}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Import Edit icon
import { Edit } from 'lucide-react';import { useRouter } from 'next/navigation';

