// Hello Khata OS - Invoice Settings Page
// হ্যালো খাতা - ইনভয়েস সেটিংস পেজ

'use client';

import { useState, useRef } from 'react';
import { Button, Badge, Card, CardContent, Divider } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  FileText,
  Upload,
  Building2,
  MapPin,
  Phone,
  Hash,
  MessageSquare,
  Printer,
  Save,
  Loader2,
  Image as ImageIcon,
  X,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Settings input component using shadcn/ui Input with full width
const SettingsInput = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  icon?: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <div className="w-full space-y-2">
    <Label className="text-xs font-medium text-muted-foreground">
      {label}
    </Label>
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('h-11 w-full', Icon && 'pl-10')}
      />
    </div>
  </div>
);

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

// Settings card component with full width
const SettingsCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'w-full rounded-2xl p-6',
      'bg-card border border-border',
      className
    )}
  >
    {children}
  </div>
);

export default function InvoiceSettingsPage() {
  const { isBangla } = useAppTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('স্মার্টস্টোর');
  const [businessAddress, setBusinessAddress] = useState('ঢাকা, বাংলাদেশ');
  const [businessPhone, setBusinessPhone] = useState('01XXXXXXXXX');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [footerNote, setFooterNote] = useState('ধন্যবাদ আপনার কেনাকাটার জন্য!');
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [isSaving, setIsSaving] = useState(false);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: isBangla ? 'ফাইল বড় হয়েছে' : 'File too large',
          description: isBangla ? 'লোগো ২MB এর চেয়ে ছোট হতে হবে' : 'Logo must be smaller than 2MB',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast({
          title: isBangla ? 'লোগো আপলোড হয়েছে' : 'Logo uploaded',
          description: isBangla ? 'নতুন লোগো সফলভাবে আপলোড হয়েছে' : 'New logo uploaded successfully',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: isBangla ? 'লোগো সরানো হয়েছে' : 'Logo removed',
      description: isBangla ? 'লোগো সফলভাবে সরানো হয়েছে' : 'Logo has been removed',
    });
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'ইনভয়েস সেটিংস সংরক্ষিত হয়েছে' : 'Invoice settings saved successfully',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
  
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isBangla ? 'ইনভয়েস কাস্টমাইজেশন' : 'Invoice Customization'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isBangla
              ? 'আপনার ইনভয়েস টেমপ্লেট কাস্টমাইজ করুন'
              : 'Customize your invoice template'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Logo Upload Section */}
          <SettingsCard>
            <SectionHeader
              icon={ImageIcon}
              title={isBangla ? 'ব্যবসার লোগো' : 'Business Logo'}
              description={isBangla ? 'ইনভয়েসে দেখানোর জন্য লোগো আপলোড করুন' : 'Upload logo for invoices'}
              iconColor="primary"
            />

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Logo Preview */}
              <div
                className={cn(
                  'w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0',
                  logoPreview
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30'
                )}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <span className="text-[10px] text-muted-foreground/50">
                      {isBangla ? 'লোগো নেই' : 'No logo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Actions */}
              <div className="flex-1 w-full space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isBangla ? 'লোগো আপলোড করুন' : 'Upload Logo'}
                </Button>
                {logoPreview && (
                  <Button
                    variant="ghost"
                    className="w-full h-9 rounded-xl text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isBangla ? 'লোগো সরান' : 'Remove Logo'}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  {isBangla
                    ? 'PNG, JPG বা SVG • সর্বোচ্চ 2MB'
                    : 'PNG, JPG or SVG • Max 2MB'}
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* Business Information Section */}
          <SettingsCard>
            <SectionHeader
              icon={Building2}
              title={isBangla ? 'ব্যবসার তথ্য' : 'Business Information'}
              description={isBangla ? 'ইনভয়েসে দেখানোর তথ্য' : 'Information shown on invoices'}
              iconColor="indigo"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'ব্যবসার নাম' : 'Business Name'}
                icon={Building2}
                value={businessName}
                onChange={setBusinessName}
                placeholder={isBangla ? 'ব্যবসার নাম লিখুন' : 'Enter business name'}
              />
              <SettingsInput
                label={isBangla ? 'ঠিকানা' : 'Address'}
                icon={MapPin}
                value={businessAddress}
                onChange={setBusinessAddress}
                placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              />
              <SettingsInput
                label={isBangla ? 'ফোন' : 'Phone'}
                icon={Phone}
                value={businessPhone}
                onChange={setBusinessPhone}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </SettingsCard>

          {/* Invoice Settings Section */}
          <SettingsCard>
            <SectionHeader
              icon={Hash}
              title={isBangla ? 'ইনভয়েস নম্বর' : 'Invoice Number'}
              description={isBangla ? 'ইনভয়েস নম্বরের ফরম্যাট' : 'Invoice number format'}
              iconColor="emerald"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'ইনভয়েস প্রিফিক্স' : 'Invoice Prefix'}
                icon={Hash}
                value={invoicePrefix}
                onChange={setInvoicePrefix}
                placeholder="INV-"
              />
              <div className="p-4 rounded-xl bg-muted/30 border border-border w-full">
                <p className="text-xs text-muted-foreground mb-1">
                  {isBangla ? 'প্রিভিউ:' : 'Preview:'}
                </p>
                <p className="text-lg font-mono text-foreground">
                  {invoicePrefix}0001
                </p>
              </div>
            </div>
          </SettingsCard>

          {/* Footer Note Section */}
          <SettingsCard>
            <SectionHeader
              icon={MessageSquare}
              title={isBangla ? 'ফুটার নোট' : 'Footer Note'}
              description={isBangla ? 'ইনভয়েসের নিচে দেখানোর জন্য' : 'Shown at the bottom of invoices'}
              iconColor="warning"
            />

            <div className="w-full space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {isBangla ? 'ফুটার বার্তা' : 'Footer Message'}
              </Label>
              <Textarea
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder={isBangla ? 'ফুটার নোট লিখুন' : 'Enter footer note'}
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </SettingsCard>

          {/* Print Settings Section */}
          <SettingsCard>
            <SectionHeader
              icon={Printer}
              title={isBangla ? 'প্রিন্ট সেটিংস' : 'Print Settings'}
              description={isBangla ? 'ডিফল্ট প্রিন্ট অপশন' : 'Default print options'}
              iconColor="primary"
            />

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground block mb-3">
                  {isBangla ? 'কাগজের আকার' : 'Paper Size'}
                </Label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaperSize('A4')}
                    className={cn(
                      'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
                      paperSize === 'A4'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <FileCheck className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">A4</span>
                  </button>
                  <button
                    onClick={() => setPaperSize('A5')}
                    className={cn(
                      'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
                      paperSize === 'A5'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <FileCheck className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">A5</span>
                  </button>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 px-8 rounded-xl font-medium text-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isBangla ? 'সংরক্ষণ করুন' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
   
  );
}
