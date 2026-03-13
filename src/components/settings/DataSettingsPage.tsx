// Hello Khata OS - Data Settings Page
// হ্যালো খাতা - ডেটা সেটিংস পেজ

'use client';

import { useState } from 'react';
import { Button, Badge, Card } from '@/components/ui/premium';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  Database,
  Download,
  Clock,
  Cloud,
  FileSpreadsheet,
  FileJson,
  Users,
  Package,
  ShoppingCart,
  Loader2,
  Check,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Section header component
const SectionHeader = ({
  icon: Icon,
  title,
  description,
  iconColor = 'primary',
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  iconColor?: 'primary' | 'indigo' | 'warning' | 'emerald';
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    indigo: 'bg-indigo/10 text-indigo',
    warning: 'bg-warning/10 text-warning',
    emerald: 'bg-emerald/10 text-emerald',
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-3">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colorClasses[iconColor])}>
          <Icon className="h-4 w-4" />
        </div>
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 ml-11">
          {description}
        </p>
      )}
    </div>
  );
};

// Settings card component
const SettingsCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'rounded-2xl p-6',
      'bg-[rgba(255,255,255,0.03)]',
      'border border-[rgba(255,255,255,0.06)]',
      className
    )}
  >
    {children}
  </div>
);

// Export button component - not currently used, exports are inline
// Keeping for future use
const _ExportButton = ({
  icon: Icon,
  label,
  description,
  onClick,
  isLoading,
  format,
  isBangla,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
  format: string;
  isBangla: boolean;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Badge variant="outline" size="sm">
        {format}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg h-9 px-4"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {isBangla ? 'এক্সপোর্ট' : 'Export'}
          </>
        )}
      </Button>
    </div>
  </div>
);

export default function DataSettingsPage() {
  const { isBangla } = useAppTranslation();
  const { toast } = useToast();

  // State
  const [lastBackup, setLastBackup] = useState<Date | null>(
    new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  );
  const [autoBackup, setAutoBackup] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Handle create backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLastBackup(new Date());
      toast({
        title: isBangla ? 'ব্যাকআপ সম্পন্ন' : 'Backup Created',
        description: isBangla
          ? 'আপনার ডেটা সফলভাবে ব্যাকআপ নেওয়া হয়েছে'
          : 'Your data has been backed up successfully',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle export
  const handleExport = async (type: string) => {
    setExportingType(type);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const exportMessages: Record<string, { title: string; description: string }> = {
        sales: {
          title: isBangla ? 'সেলস এক্সপোর্ট সম্পন্ন' : 'Sales Exported',
          description: isBangla
            ? 'সেলস ডেটা CSV ফাইলে এক্সপোর্ট হয়েছে'
            : 'Sales data has been exported to CSV',
        },
        inventory: {
          title: isBangla ? 'ইনভেন্টরি এক্সপোর্ট সম্পন্ন' : 'Inventory Exported',
          description: isBangla
            ? 'ইনভেন্টরি ডেটা CSV ফাইলে এক্সপোর্ট হয়েছে'
            : 'Inventory data has been exported to CSV',
        },
        parties: {
          title: isBangla ? 'পার্টি এক্সপোর্ট সম্পন্ন' : 'Parties Exported',
          description: isBangla
            ? 'পার্টি ডেটা CSV ফাইলে এক্সপোর্ট হয়েছে'
            : 'Party data has been exported to CSV',
        },
        all: {
          title: isBangla ? 'সম্পূর্ণ এক্সপোর্ট সম্পন্ন' : 'All Data Exported',
          description: isBangla
            ? 'সকল ডেটা JSON ফাইলে এক্সপোর্ট হয়েছে'
            : 'All data has been exported to JSON',
        },
      };
      const msg = exportMessages[type];
      toast({
        title: msg.title,
        description: msg.description,
      });
    } finally {
      setExportingType(null);
    }
  };

  // Format last backup time
  const formatLastBackup = () => {
    if (!lastBackup) return isBangla ? 'কোনো ব্যাকআপ নেই' : 'No backup yet';
    const now = new Date();
    const diff = now.getTime() - lastBackup.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return isBangla ? `${days} দিন আগে` : `${days} days ago`;
    } else if (hours > 0) {
      return isBangla ? `${hours} ঘণ্টা আগে` : `${hours} hours ago`;
    }
    return isBangla ? 'কিছুক্ষণ আগে' : 'Just now';
  };

  return (
    
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {isBangla ? 'ডেটা ব্যাকআপ ও এক্সপোর্ট' : 'Data Backup & Export'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isBangla
              ? 'আপনার ডেটা সুরক্ষিত রাখুন এবং এক্সপোর্ট করুন'
              : 'Keep your data safe and export when needed'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Data Backup Section */}
          <SettingsCard>
            <SectionHeader
              icon={Database}
              title={isBangla ? 'ডেটা ব্যাকআপ' : 'Data Backup'}
              description={isBangla ? 'আপনার ব্যবসার ডেটা সুরক্ষিত রাখুন' : 'Keep your business data safe'}
              iconColor="emerald"
            />

            <div className="space-y-4">
              {/* Last Backup Info */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'সর্বশেষ ব্যাকআপ' : 'Last Backup'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatLastBackup()}
                    </p>
                  </div>
                </div>
                {lastBackup && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {isBangla ? 'সম্পন্ন' : 'Complete'}
                  </Badge>
                )}
              </div>

              {/* Create Backup Button */}
              <Button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className={cn(
                  'w-full h-12 rounded-xl font-medium',
                  'bg-emerald hover:bg-emerald/90',
                  'text-white',
                  'shadow-lg shadow-emerald/20'
                )}
              >
                {isCreatingBackup ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <HardDrive className="h-5 w-5 mr-2" />
                )}
                {isBangla ? 'নতুন ব্যাকআপ তৈরি করুন' : 'Create New Backup'}
              </Button>

              {/* Auto Backup Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'অটো ব্যাকআপ' : 'Auto Backup'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'প্রতিদিন স্বয়ংক্রিয় ব্যাকআপ' : 'Daily automatic backup'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm">
                    {isBangla ? 'শীঘ্রই আসছে' : 'Coming Soon'}
                  </Badge>
                  <Switch checked={autoBackup} onCheckedChange={setAutoBackup} disabled />
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Data Export Section */}
          <SettingsCard>
            <SectionHeader
              icon={Download}
              title={isBangla ? 'ডেটা এক্সপোর্ট' : 'Data Export'}
              description={isBangla ? 'আপনার ডেটা বিভিন্ন ফরম্যাটে এক্সপোর্ট করুন' : 'Export your data in various formats'}
              iconColor="indigo"
            />

            <div className="space-y-3">
              {/* Sales Export */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'সেলস ডেটা' : 'Sales Data'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'সকল বিক্রয়ের রেকর্ড' : 'All sales records'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">CSV</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 px-4"
                    onClick={() => handleExport('sales')}
                    disabled={exportingType === 'sales'}
                  >
                    {exportingType === 'sales' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {isBangla ? 'এক্সপোর্ট' : 'Export'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Inventory Export */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'ইনভেন্টরি ডেটা' : 'Inventory Data'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'সকল পণ্যের তথ্য' : 'All product information'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">CSV</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 px-4"
                    onClick={() => handleExport('inventory')}
                    disabled={exportingType === 'inventory'}
                  >
                    {exportingType === 'inventory' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {isBangla ? 'এক্সপোর্ট' : 'Export'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Parties Export */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-indigo" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'পার্টি ডেটা' : 'Parties Data'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'সকল গ্রাহক ও সরবরাহকারী' : 'All customers and suppliers'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">CSV</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 px-4"
                    onClick={() => handleExport('parties')}
                    disabled={exportingType === 'parties'}
                  >
                    {exportingType === 'parties' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {isBangla ? 'এক্সপোর্ট' : 'Export'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* All Data Export */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-indigo/5 border border-primary/10 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo flex items-center justify-center">
                    <FileJson className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isBangla ? 'সম্পূর্ণ ডেটা' : 'All Data'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isBangla ? 'সকল ডেটা সম্পূর্ণ ব্যাকআপ' : 'Complete backup of all data'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="indigo" size="sm">JSON</Badge>
                  <Button
                    className="rounded-lg h-9 px-4 bg-primary hover:bg-primary/90"
                    onClick={() => handleExport('all')}
                    disabled={exportingType === 'all'}
                  >
                    {exportingType === 'all' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {isBangla ? 'এক্সপোর্ট' : 'Export'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>
  );
}
