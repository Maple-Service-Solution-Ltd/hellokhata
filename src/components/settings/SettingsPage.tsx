// Hello Khata OS - Enterprise Settings Page
// Stripe/Linear level design - Clean, Structured, Professional

'use client';

import { useState, useEffect } from 'react';
import { Button, Badge } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Building2,
  Users,
  Shield,
  Database,
  Download,
  CreditCard,
  HelpCircle,
  Globe,
  Palette,
  LogOut,
  Check,
  Sparkles,
  Crown,
  Zap,
  Save,
  Loader2,
  Lock,
  Key,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  FileText,
  Package,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Wallet,
  Smartphone,
  Star,
  Calendar,
  ArrowRight,
  Settings,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore, useNavigation } from '@/stores/uiStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const planFeatures = {
  free: [
    { key: 'items', value: '১০০ পণ্য পর্যন্ত' },
    { key: 'ai', value: '৩ AI চ্যাট/দিন' },
    { key: 'basic', value: 'বেসিক সেলস ট্র্যাকিং' },
  ],
  starter: [
    { key: 'items', value: 'অসীমিত পণ্য' },
    { key: 'ai', value: '১৫ AI চ্যাট/দিন' },
    { key: 'export', value: 'CSV এক্সপোর্ট' },
    { key: 'alert', value: 'ডেড স্টক এলার্ট' },
  ],
  growth: [
    { key: 'ai', value: '৫০ AI চ্যাট/দিন' },
    { key: 'forecast', value: 'AI ফোরকাস্টিং' },
    { key: 'health', value: 'হেলথ স্কোর' },
    { key: 'multi', value: '৩ শাখা পর্যন্ত' },
    { key: 'support', value: 'প্রায়োরিটি সাপোর্ট' },
  ],
  intelligence: [
    { key: 'ai', value: 'আনলিমিটেড AI' },
    { key: 'api', value: 'API অ্যাক্সেস' },
    { key: 'all', value: 'সব ফিচার' },
    { key: 'support', value: 'ডেডিকেটেড সাপোর্ট' },
  ],
};

// Settings categories with items
const settingsCategories = [
  {
    id: 'account',
    label: 'ACCOUNT',
    items: [
      { icon: User, labelEn: 'Personal Profile', labelBn: 'ব্যক্তিগত প্রোফাইল', id: 'profile' },
      { icon: Building2, labelEn: 'Business Profile', labelBn: 'ব্যবসার প্রোফাইল', id: 'business' },
      { icon: Shield, labelEn: 'Security', labelBn: 'নিরাপত্তা', id: 'security' },
    ],
  },
  {
    id: 'business_settings',
    label: 'BUSINESS',
    items: [
      { icon: Building2, labelEn: 'Branch Management', labelBn: 'শাখা পরিচালনা', id: 'branches', pageRoute: 'settings-branches', isPro: true },
      { icon: FileText, labelEn: 'Invoice Settings', labelBn: 'ইনভয়েস সেটিংস', id: 'invoice', href: '/settings/invoice' },
      { icon: CheckCircle, labelEn: 'Approval Dashboard', labelBn: 'অনুমোদন ড্যাশবোর্ড', id: 'approvals', pageRoute: 'settings-approvals' },
      { icon: Lock, labelEn: 'Period Lock', labelBn: 'পিরিয়ড লক', id: 'period-lock', pageRoute: 'settings-period-lock' },
    ],
  },
  {
    id: 'inventory',
    label: 'INVENTORY',
    items: [
      { icon: Package, labelEn: 'Inventory Settings', labelBn: 'ইনভেন্টরি সেটিংস', id: 'inventory', pageRoute: 'settings-inventory' },
    ],
  },
  {
    id: 'team',
    label: 'TEAM',
    items: [
      { icon: Users, labelEn: 'Staff Management', labelBn: 'স্টাফ পরিচালনা', id: 'staff', isPro: true },
      { icon: Lock, labelEn: 'Roles & Permissions', labelBn: 'ভূমিকা ও অনুমতি', id: 'roles', isPro: true },
    ],
  },
  {
    id: 'data',
    label: 'DATA',
    items: [
      { icon: Database, labelEn: 'Backup & Export', labelBn: 'ব্যাকআপ ও এক্সপোর্ট', id: 'data', href: '/settings/data' },
      { icon: Trash2, labelEn: 'Recycle Bin', labelBn: 'রিসাইকেল বিন', id: 'recycle-bin', pageRoute: 'settings-recycle-bin' },
    ],
  },
  {
    id: 'billing',
    label: 'BILLING',
    items: [
      { icon: CreditCard, labelEn: 'Subscription', labelBn: 'সাবস্ক্রিপশন', id: 'subscription' },
    ],
  },
  {
    id: 'support',
    label: 'SUPPORT',
    items: [
      { icon: HelpCircle, labelEn: 'Help & Support', labelBn: 'সাহায্য ও সাপোর্ট', id: 'help' },
    ],
  },
];

// Settings input component - defined OUTSIDE the main component to prevent re-renders
const SettingsInput = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  placeholder, 
  type = 'text' 
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
        className={cn(
          'h-11 w-full',
          Icon && 'pl-10'
        )}
      />
    </div>
  </div>
);

// Settings section card - full width with proper styling
const SettingsCard = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div 
    className={cn(
      'w-full min-w-[400px] rounded-2xl p-6 md:p-8',
      'bg-card border border-border',
      className
    )}
  >
    {children}
  </div>
);

// Section header component
const SectionHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = 'primary' 
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

// Action row component
const ActionRow = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  onAction 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-lg h-8 px-3 text-xs"
      onClick={onAction}
    >
      {action}
    </Button>
  </div>
);

// Save button component
const SaveButton = ({ 
  onClick, 
  isLoading, 
  label 
}: { 
  onClick: () => void; 
  isLoading: boolean; 
  label: string;
}) => (
  <div className="flex justify-end mt-8 pt-6 border-t border-border">
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="h-10 px-6 rounded-xl font-medium text-sm"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  </div>
);

export default function SettingsPage() {
  const { t, isBangla, changeLanguage } = useAppTranslation();
  const { user, business, plan, logout, updateUser, updateBusiness, setPlan } = useSessionStore();
  const { theme, setTheme, language } = useUiStore();
  const { navigateTo } = useNavigation();
  const { toast } = useToast();

  // Active section
  const [activeSection, setActiveSection] = useState('profile');

  // Handle URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['profile', 'business', 'security', 'staff', 'roles', 'data', 'subscription', 'help', 'invoice', 'inventory', 'party-categories', 'branches'].includes(hash)) {
      setActiveSection(hash);
    }
  }, []);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Staff management state (for Pro users)
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; email: string; role: string; status: string }>>([]);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', role: 'staff' });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Billing history state - with sample data
  const [billingHistory] = useState<Array<{ id: string; date: string; amount: number; status: string; plan: string; invoiceNo: string }>>([
    { id: '1', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: 0, status: 'free', plan: 'Free', invoiceNo: '-' },
    { id: '2', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), amount: 0, status: 'free', plan: 'Free', invoiceNo: '-' },
  ]);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; type: string; number: string; isDefault: boolean; expiryDate?: string }>>([]);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  const [newPaymentExpiry, setNewPaymentExpiry] = useState('');
  const [newPaymentCvv, setNewPaymentCvv] = useState('');
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // Plan upgrade state
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // AI Addon state
  const [hasAiAddon, setHasAiAddon] = useState(false);
  const [isAddingAiAddon, setIsAddingAiAddon] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (business) {
      setBusinessForm({
        name: business.name || '',
        phone: business.phone || '',
        address: business.address || '',
      });
    }
  }, [business]);

  // Save handlers
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: profileForm.name,
          email: profileForm.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateUser({
          name: profileForm.name,
          email: profileForm.email,
        });
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error?.message || (isBangla ? 'আপডেট ব্যর্থ হয়েছে' : 'Failed to update'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!business?.id) return;
    
    setIsSavingBusiness(true);
    try {
      const response = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: businessForm.name,
          phone: businessForm.phone,
          address: businessForm.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateBusiness({
          name: businessForm.name,
          phone: businessForm.phone,
          address: businessForm.address,
        });
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ব্যবসার তথ্য আপডেট হয়েছে' : 'Business info updated successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error?.message || (isBangla ? 'আপডেট ব্যর্থ হয়েছে' : 'Failed to update'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBusiness(false);
    }
  };

  // Password change handler
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'সব ঘর পূরণ করুন' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: isBangla ? 'পাসওয়ার্ড ছোট' : 'Password too short',
        description: isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: isBangla ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match',
        description: isBangla ? 'নতুন পাসওয়ার্ড দুটি মিলছে না' : 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'পাসওয়ার্ড পরিবর্তন হয়েছে' : 'Password changed successfully',
        });
        setIsPasswordDialogOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error || (isBangla ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' : 'Failed to change password'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Add staff handler
  const handleAddStaff = async () => {
    if (!newStaffForm.name || !newStaffForm.email) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'নাম ও ইমেইল পূরণ করুন' : 'Please fill name and email',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingStaff(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStaff = {
        id: Date.now().toString(),
        ...newStaffForm,
        status: 'active',
      };
      setStaffList([...staffList, newStaff]);
      setNewStaffForm({ name: '', email: '', role: 'staff' });
      setIsAddStaffDialogOpen(false);
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'স্টাফ যোগ হয়েছে' : 'Staff member added successfully',
      });
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Toggle staff status
  const toggleStaffStatus = (staffId: string) => {
    setStaffList(staffList.map(staff =>
      staff.id === staffId
        ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
        : staff
    ));
  };

  // Delete staff
  const deleteStaff = (staffId: string) => {
    setStaffList(staffList.filter(staff => staff.id !== staffId));
    toast({
      title: isBangla ? 'সফল হয়েছে' : 'Success',
      description: isBangla ? 'স্টাফ মুছে ফেলা হয়েছে' : 'Staff member deleted',
    });
  };

  // Add payment method handler
  const handleAddPaymentMethod = async () => {
    if (!newPaymentNumber) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'নম্বর পূরণ করুন' : 'Please enter number',
        variant: 'destructive',
      });
      return;
    }

    // Validate based on payment type
    if (newPaymentType === 'bkash' || newPaymentType === 'nagad') {
      // Mobile number validation: 11 digits starting with 01
      const mobileRegex = /^01[3-9]\d{8}$/;
      if (!mobileRegex.test(newPaymentNumber)) {
        toast({
          title: isBangla ? 'অবৈধ নম্বর' : 'Invalid number',
          description: isBangla ? 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)' : 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)',
          variant: 'destructive',
        });
        return;
      }
    } else if (newPaymentType === 'card') {
      // Card validation: at least 16 digits
      const cardDigits = newPaymentNumber.replace(/\s/g, '');
      if (cardDigits.length < 16 || !/^\d+$/.test(cardDigits)) {
        toast({
          title: isBangla ? 'অবৈধ কার্ড নম্বর' : 'Invalid card number',
          description: isBangla ? 'কার্ড নম্বর কমপক্ষে ১৬ অঙ্কের হতে হবে' : 'Card number must be at least 16 digits',
          variant: 'destructive',
        });
        return;
      }
      // Validate expiry date (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!newPaymentExpiry || !expiryRegex.test(newPaymentExpiry)) {
        toast({
          title: isBangla ? 'অবৈধ মেয়াদ শেষ' : 'Invalid expiry date',
          description: isBangla ? 'সঠিক মেয়াদ শেষ তারিখ দিন (MM/YY)' : 'Please enter valid expiry date (MM/YY)',
          variant: 'destructive',
        });
        return;
      }
      // Validate CVV (3 digits)
      if (!newPaymentCvv || !/^\d{3}$/.test(newPaymentCvv)) {
        toast({
          title: isBangla ? 'অবৈধ CVV' : 'Invalid CVV',
          description: isBangla ? 'সঠিক CVV দিন (৩ অঙ্ক)' : 'Please enter valid CVV (3 digits)',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsAddingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newPayment = {
        id: Date.now().toString(),
        type: newPaymentType,
        number: newPaymentType === 'card' ? `**** **** **** ${newPaymentNumber.replace(/\s/g, '').slice(-4)}` : newPaymentNumber,
        isDefault: paymentMethods.length === 0,
        expiryDate: newPaymentType === 'card' ? newPaymentExpiry : undefined,
      };
      setPaymentMethods([...paymentMethods, newPayment]);
      setNewPaymentNumber('');
      setNewPaymentExpiry('');
      setNewPaymentCvv('');
      setIsAddPaymentDialogOpen(false);
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'পেমেন্ট মেথড যোগ হয়েছে' : 'Payment method added successfully',
      });
    } finally {
      setIsAddingPayment(false);
    }
  };

  // Set default payment method
  const setDefaultPaymentMethod = (paymentId: string) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === paymentId,
    })));
    toast({
      title: isBangla ? 'সফল হয়েছে' : 'Success',
      description: isBangla ? 'ডিফল্ট পেমেন্ট মেথড পরিবর্তন হয়েছে' : 'Default payment method updated',
    });
  };

  // Delete payment method
  const deletePaymentMethod = (paymentId: string) => {
    const updated = paymentMethods.filter(pm => pm.id !== paymentId);
    if (paymentMethods.find(pm => pm.id === paymentId)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setPaymentMethods(updated);
    toast({
      title: isBangla ? 'সফল হয়েছে' : 'Success',
      description: isBangla ? 'পেমেন্ট মেথড মুছে ফেলা হয়েছে' : 'Payment method deleted',
    });
  };

  // Plan upgrade handler
  const handlePlanUpgrade = async (newPlan: string) => {
    setIsUpgrading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actually update the plan in session store
      setPlan(newPlan as 'free' | 'starter' | 'growth' | 'intelligence');
      
      setSelectedPlan(null);
      const planDisplayName = newPlan === 'intelligence' ? 'Intelligence' : newPlan === 'growth' ? 'Growth' : newPlan === 'starter' ? 'Starter' : 'Free';
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla 
          ? `${planDisplayName} প্ল্যানে পরিবর্তন হয়েছে`
          : `Successfully switched to ${planDisplayName} plan`,
      });
    } finally {
      setIsUpgrading(false);
    }
  };
  
  // AI Addon handler
  const handleAddAiAddon = async () => {
    setIsAddingAiAddon(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setHasAiAddon(true);
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla 
          ? 'AI সহায়ক সফলভাবে সক্রিয় করা হয়েছে'
          : 'AI Assistant has been activated successfully',
      });
    } finally {
      setIsAddingAiAddon(false);
    }
  };

  // Download invoice handler
  const handleDownloadInvoice = (invoiceNo: string) => {
    toast({
      title: isBangla ? 'ডাউনলোড শুরু' : 'Download started',
      description: isBangla ? `${invoiceNo} ইনভয়েস ডাউনলোড হচ্ছে` : `Downloading invoice ${invoiceNo}`,
    });
  };

  const planIcons = {
    free: Star,
    starter: Zap,
    growth: Sparkles,
    intelligence: Crown,
  };

  const PlanIcon = planIcons[plan] || Star;

  // Render active section content
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <SettingsCard>
            <SectionHeader
              icon={User}
              title={isBangla ? 'ব্যক্তিগত প্রোফাইল' : 'Personal Profile'}
              description={isBangla ? 'আপনার ব্যক্তিগত তথ্য পরিচালনা করুন' : 'Manage your personal information'}
              iconColor="primary"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'নাম' : 'Name'}
                icon={User}
                value={profileForm.name}
                onChange={(v) => setProfileForm({ ...profileForm, name: v })}
                placeholder={isBangla ? 'আপনার নাম লিখুন' : 'Enter your name'}
              />
              <SettingsInput
                label={isBangla ? 'ফোন' : 'Phone'}
                icon={Phone}
                value={profileForm.phone}
                onChange={(v) => setProfileForm({ ...profileForm, phone: v })}
                placeholder="01XXXXXXXXX"
              />
              <SettingsInput
                label={isBangla ? 'ইমেইল' : 'Email'}
                icon={Mail}
                type="email"
                value={profileForm.email}
                onChange={(v) => setProfileForm({ ...profileForm, email: v })}
                placeholder="example@email.com"
              />
            </div>

            <SaveButton 
              onClick={handleSaveProfile} 
              isLoading={isSavingProfile} 
              label={t('common.save')} 
            />
          </SettingsCard>
        );

      case 'business':
        return (
          <SettingsCard>
            <SectionHeader
              icon={Building2}
              title={isBangla ? 'ব্যবসার প্রোফাইল' : 'Business Profile'}
              description={isBangla ? 'আপনার ব্যবসার তথ্য পরিচালনা করুন' : 'Manage your business information'}
              iconColor="indigo"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'ব্যবসার নাম' : 'Business Name'}
                icon={Building}
                value={businessForm.name}
                onChange={(v) => setBusinessForm({ ...businessForm, name: v })}
                placeholder={isBangla ? 'ব্যবসার নাম লিখুন' : 'Enter business name'}
              />
              <SettingsInput
                label={isBangla ? 'ফোন' : 'Phone'}
                icon={Phone}
                value={businessForm.phone}
                onChange={(v) => setBusinessForm({ ...businessForm, phone: v })}
                placeholder="01XXXXXXXXX"
              />
              <SettingsInput
                label={isBangla ? 'ঠিকানা' : 'Address'}
                icon={MapPin}
                value={businessForm.address}
                onChange={(v) => setBusinessForm({ ...businessForm, address: v })}
                placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              />
            </div>

            <SaveButton 
              onClick={handleSaveBusiness} 
              isLoading={isSavingBusiness} 
              label={t('common.save')} 
            />
          </SettingsCard>
        );

      case 'security':
        return (
          <>
            <SettingsCard>
              <SectionHeader
                icon={Shield}
                title={isBangla ? 'নিরাপত্তা' : 'Security'}
                description={isBangla ? 'আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন' : 'Keep your account secure'}
                iconColor="warning"
              />

              <div className="space-y-3">
                <ActionRow
                  icon={Key}
                  title={isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  description={isBangla ? 'নিয়মিত পাসওয়ার্ড পরিবর্তন করুন' : 'Update your password regularly'}
                  action={isBangla ? 'পরিবর্তন' : 'Change'}
                  onAction={() => setIsPasswordDialogOpen(true)}
                />
              </div>
            </SettingsCard>

            {/* Password Change Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogContent className="sm:max-w-md min-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </DialogTitle>
                  <DialogDescription>
                    {isBangla ? 'আপনার পাসওয়ার্ড পরিবর্তন করুন' : 'Update your account password'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder={isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Enter current password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder={isBangla ? 'নতুন পাসওয়ার্ড' : 'Enter new password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder={isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm new password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="rounded-xl"
                  >
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="rounded-xl"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    {isBangla ? 'পরিবর্তন করুন' : 'Change Password'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );

      case 'staff':
        // Check if user has Growth or Intelligence plan
        if (plan !== 'growth' && plan !== 'intelligence') {
          return (
            <SettingsCard>
              <SectionHeader
                icon={Users}
                title={isBangla ? 'স্টাফ পরিচালনা' : 'Staff Management'}
                iconColor="primary"
              />

              {/* Premium Feature Gate */}
              <div className="text-center py-10 w-full">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shrink-0">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isBangla ? 'প্রিমিয়াম ফিচার' : 'Premium Feature'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {isBangla
                    ? 'এই ফিচারটি Growth বা Intelligence প্ল্যানে উপলব্ধ। আপগ্রেড করে স্টাফ পরিচালনা করুন।'
                    : 'This feature is available on Growth or Intelligence plan. Upgrade to manage staff.'}
                </p>
                <Button className="rounded-xl h-10 px-6" onClick={() => setActiveSection('subscription')}>
                  {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Plan'}
                </Button>
              </div>
            </SettingsCard>
          );
        }

        // Show actual staff management UI for Growth/Intelligence users
        return (
          <>
            <SettingsCard>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <SectionHeader
                  icon={Users}
                  title={isBangla ? 'স্টাফ পরিচালনা' : 'Staff Management'}
                  description={isBangla ? `${staffList.length} জন স্টাফ` : `${staffList.length} staff members`}
                  iconColor="primary"
                />
                <Button
                  onClick={() => setIsAddStaffDialogOpen(true)}
                  className="rounded-xl flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isBangla ? 'স্টাফ যোগ করুন' : 'Add Staff'}
                </Button>
              </div>

              <div className="space-y-2 w-full">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-4 rounded-xl w-full bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{staff.name}</span>
                          <Badge
                            variant={staff.role === 'manager' ? 'indigo' : 'outline'}
                            size="sm"
                          >
                            {staff.role === 'manager' ? (isBangla ? 'ম্যানেজার' : 'Manager') : (isBangla ? 'স্টাফ' : 'Staff')}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{staff.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={staff.status === 'active' ? 'success' : 'outline'}
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => toggleStaffStatus(staff.id)}
                      >
                        {staff.status === 'active' ? (isBangla ? 'সক্রিয়' : 'Active') : (isBangla ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => deleteStaff(staff.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>

            {/* Add Staff Dialog */}
            <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {isBangla ? 'নতুন স্টাফ যোগ করুন' : 'Add New Staff'}
                  </DialogTitle>
                  <DialogDescription>
                    {isBangla ? 'একজন নতুন স্টাফ সদস্য যোগ করুন' : 'Add a new staff member to your team'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'নাম' : 'Name'}
                    </Label>
                    <Input
                      value={newStaffForm.name}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                      placeholder={isBangla ? 'স্টাফের নাম' : 'Staff name'}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'ইমেইল' : 'Email'}
                    </Label>
                    <Input
                      type="email"
                      value={newStaffForm.email}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'ভূমিকা' : 'Role'}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={newStaffForm.role === 'staff' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewStaffForm({ ...newStaffForm, role: 'staff' })}
                        className="flex-1 rounded-xl"
                      >
                        {isBangla ? 'স্টাফ' : 'Staff'}
                      </Button>
                      <Button
                        variant={newStaffForm.role === 'manager' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewStaffForm({ ...newStaffForm, role: 'manager' })}
                        className="flex-1 rounded-xl"
                      >
                        {isBangla ? 'ম্যানেজার' : 'Manager'}
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddStaffDialogOpen(false);
                      setNewStaffForm({ name: '', email: '', role: 'staff' });
                    }}
                    className="rounded-xl"
                  >
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={isAddingStaff}
                    className="rounded-xl"
                  >
                    {isAddingStaff ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isBangla ? 'যোগ করুন' : 'Add Staff'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );

      case 'roles':
        // Check if user has Growth or Intelligence plan
        if (plan !== 'growth' && plan !== 'intelligence') {
          return (
            <SettingsCard>
              <SectionHeader
                icon={Lock}
                title={isBangla ? 'ভূমিকা ও অনুমতি' : 'Roles & Permissions'}
                iconColor="primary"
              />

              {/* Premium Feature Gate */}
              <div className="text-center py-10 w-full">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shrink-0">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isBangla ? 'প্রিমিয়াম ফিচার' : 'Premium Feature'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {isBangla
                    ? 'এই ফিচারটি Growth বা Intelligence প্ল্যানে উপলব্ধ। আপগ্রেড করে ভূমিকা ও অনুমতি নিয়ন্ত্রণ করুন।'
                    : 'This feature is available on Growth or Intelligence plan. Upgrade to manage roles and permissions.'}
                </p>
                <Button className="rounded-xl h-10 px-6" onClick={() => setActiveSection('subscription')}>
                  {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Plan'}
                </Button>
              </div>
            </SettingsCard>
          );
        }

        // Show actual roles & permissions UI for Pro users
        return (
          <SettingsCard>
            <SectionHeader
              icon={Lock}
              title={isBangla ? 'ভূমিকা ও অনুমতি' : 'Roles & Permissions'}
              description={isBangla ? 'ব্যবহারকারীর অনুমতি নিয়ন্ত্রণ করুন' : 'Control user permissions'}
              iconColor="primary"
            />

            <div className="space-y-4 w-full">
              {/* Owner Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'মালিক' : 'Owner'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'সম্পূর্ণ অ্যাক্সেস' : 'Full access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory', 'parties', 'expenses', 'reports', 'settings', 'staff'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি', parties: 'পার্টি', expenses: 'খরচ', reports: 'রিপোর্ট', settings: 'সেটিংস', staff: 'স্টাফ' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Manager Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'ম্যানেজার' : 'Manager'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'বেশিরভাগ অ্যাক্সেস' : 'Most access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory', 'parties', 'expenses', 'reports'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি', parties: 'পার্টি', expenses: 'খরচ', reports: 'রিপোর্ট' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Staff Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'স্টাফ' : 'Staff'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'মৌলিক অ্যাক্সেস' : 'Basic access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SettingsCard>
        );

      case 'backup':
        return (
          <SettingsCard>
            <SectionHeader
              icon={Database}
              title={isBangla ? 'ব্যাকআপ' : 'Backup'}
              description={isBangla ? 'আপনার ডেটা নিরাপদ রাখুন' : 'Keep your data safe'}
              iconColor="emerald"
            />

            <div className="space-y-3">
              <ActionRow
                icon={Database}
                title={isBangla ? 'স্বয়ংক্রিয় ব্যাকআপ' : 'Automatic Backup'}
                description={isBangla ? 'প্রতিদিন স্বয়ংক্রিয় ব্যাকআপ নেওয়া হবে' : 'Daily automatic backup'}
                action={isBangla ? 'এখন ব্যাকআপ' : 'Backup Now'}
              />
            </div>
          </SettingsCard>
        );

      case 'export':
        return (
          <SettingsCard>
            <SectionHeader
              icon={Download}
              title={isBangla ? 'এক্সপোর্ট' : 'Export Data'}
              description={isBangla ? 'আপনার ডেটা এক্সপোর্ট করুন' : 'Export your data'}
              iconColor="indigo"
            />

            <div className="space-y-2">
              {[
                { label: isBangla ? 'সব ডেটা' : 'All Data', format: 'JSON' },
                { label: isBangla ? 'পণ্য তালিকা' : 'Products List', format: 'CSV' },
                { label: isBangla ? 'বিক্রয় রিপোর্ট' : 'Sales Report', format: 'CSV' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <Badge variant="outline" size="sm">{item.format}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-xs">
                    {isBangla ? 'ডাউনলোড' : 'Download'}
                  </Button>
                </div>
              ))}
            </div>
          </SettingsCard>
        );

      case 'subscription':
        return (
          <div className="w-full min-w-[400px] space-y-6">
            {/* Current Plan Status */}
            <SettingsCard>
              <SectionHeader
                icon={CreditCard}
                title={isBangla ? 'সাবস্ক্রিপশন' : 'Subscription'}
                iconColor="primary"
              />

              {/* Current Plan */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 to-indigo/5 border border-primary/10 mb-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo flex items-center justify-center">
                      <PlanIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground capitalize">{plan === 'intelligence' ? 'INTELLIGENCE' : plan === 'growth' ? 'GROWTH' : plan === 'starter' ? 'STARTER' : 'FREE'}</p>
                      <p className="text-xs text-muted-foreground">
                        {isBangla ? 'বর্তমান প্ল্যান' : 'Current plan'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="lg">
                      <Check className="h-3 w-3 mr-1" />
                      {isBangla ? 'সক্রিয়' : 'Active'}
                    </Badge>
                    {plan !== 'intelligence' && (
                      <Button
                        variant="premium"
                        size="sm"
                        className="rounded-lg h-8 px-3 text-xs"
                        onClick={() => setSelectedPlan('intelligence')}
                      >
                        {isBangla ? 'আপগ্রেড করুন' : 'Upgrade'}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Billing Date for paid plans */}
              {plan !== 'free' && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isBangla ? 'পরবর্তী বিলিং তারিখ' : 'Next billing date'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {isBangla ? '১৫ ফেব্রুয়ারি, ২০২৫' : 'Feb 15, 2025'}
                    </span>
                  </div>
                </div>
              )}
            </SettingsCard>

            {/* Plan Upgrade Options - 4 Tiers */}
            <SettingsCard>
              <SectionHeader
                icon={Crown}
                title={isBangla ? 'প্ল্যান নির্বাচন করুন' : 'Choose Your Plan'}
                description={isBangla ? 'আপনার ব্যবসার জন্য সঠিক প্ল্যান বেছে নিন' : 'Select the right plan for your business'}
                iconColor="indigo"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {(['free', 'starter', 'growth', 'intelligence'] as const).map((p) => {
                  const isCurrentPlan = plan === p;
                  const isSelected = selectedPlan === p;
                  const planPrice = p === 'free' ? 0 : p === 'starter' ? 199 : p === 'growth' ? 499 : 999;
                  const planDisplayName = p === 'intelligence' ? 'INTELLIGENCE' : p.toUpperCase();
                  const planIcon = p === 'free' ? Star : p === 'starter' ? Zap : p === 'growth' ? Sparkles : Crown;
                  const PlanIconComponent = planIcon;
                  
                  return (
                    <div
                      key={p}
                      onClick={() => !isCurrentPlan && setSelectedPlan(p)}
                      className={cn(
                        'relative p-5 rounded-xl border-2 transition-all duration-200 min-w-[180px]',
                        isCurrentPlan
                          ? 'cursor-default'
                          : isSelected
                            ? 'cursor-pointer ring-2'
                            : 'bg-card cursor-pointer',
                        // Current plan styling
                        isCurrentPlan && p === 'intelligence' && 'border-amber-500 bg-amber-500/5',
                        isCurrentPlan && p === 'growth' && 'border-purple-500 bg-purple-500/5',
                        isCurrentPlan && p === 'starter' && 'border-blue-500 bg-blue-500/5',
                        isCurrentPlan && p === 'free' && 'border-gray-400 bg-gray-500/5',
                        // Selected plan styling
                        !isCurrentPlan && isSelected && p === 'intelligence' && 'border-amber-500 bg-amber-500/10 ring-amber-500/30',
                        !isCurrentPlan && isSelected && p === 'growth' && 'border-purple-500 bg-purple-500/10 ring-purple-500/30',
                        !isCurrentPlan && isSelected && p === 'starter' && 'border-blue-500 bg-blue-500/10 ring-blue-500/30',
                        !isCurrentPlan && isSelected && p === 'free' && 'border-gray-400 bg-gray-500/10 ring-gray-400/30',
                        // Default hover styling
                        !isCurrentPlan && !isSelected && 'border-border hover:border-gray-400',
                        // Growth always has a subtle ring (best value)
                        p === 'growth' && !isCurrentPlan && 'ring-1 ring-purple-500/20'
                      )}
                    >
                      {/* Current Plan Badge */}
                      {isCurrentPlan && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <Badge 
                            className={cn(
                              p === 'intelligence' && 'bg-amber-500 text-white',
                              p === 'growth' && 'bg-purple-500 text-white',
                              p === 'starter' && 'bg-blue-500 text-white',
                              p === 'free' && 'bg-gray-500 text-white'
                            )}
                            size="sm"
                          >
                            {isBangla ? 'বর্তমান' : 'Current'}
                          </Badge>
                        </div>
                      )}

                      {/* Popular Badge for Growth */}
                      {p === 'growth' && !isCurrentPlan && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <Badge className="bg-purple-500 text-white" size="sm">
                            <Star className="h-3 w-3 mr-1" />
                            {isBangla ? 'সেরা মূল্য' : 'Best Value'}
                          </Badge>
                        </div>
                      )}

                      {/* Premium Badge for Intelligence */}
                      {p === 'intelligence' && !isCurrentPlan && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white" size="sm">
                            <Crown className="h-3 w-3 mr-1" />
                            {isBangla ? 'প্রিমিয়াম' : 'Premium'}
                          </Badge>
                        </div>
                      )}

                      <div className="text-center pt-2">
                        <div className="flex items-center justify-center mb-2">
                          <PlanIconComponent className={cn(
                            'h-4 w-4 mr-1.5',
                            p === 'intelligence' && 'text-yellow-500',
                            p === 'growth' && 'text-purple-500',
                            p === 'starter' && 'text-blue-500',
                            p === 'free' && 'text-muted-foreground'
                          )} />
                          <p className="font-semibold text-foreground text-sm">{planDisplayName}</p>
                        </div>
                        
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-foreground">
                            {p === 'free' 
                              ? (isBangla ? 'ফ্রি' : 'Free')
                              : `৳${planPrice}`
                            }
                          </span>
                          {p !== 'free' && (
                            <span className="text-sm text-muted-foreground">
                              /{isBangla ? 'মাস' : 'mo'}
                            </span>
                          )}
                        </div>

                        <ul className="space-y-2 text-xs text-left">
                          {planFeatures[p].map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="text-muted-foreground">{feature.value}</span>
                            </li>
                          ))}
                        </ul>

                        {!isCurrentPlan && (
                          <Button
                            size="sm"
                            className={cn(
                              'w-full mt-4 rounded-lg h-9 text-xs font-medium transition-all',
                              // FREE tier - gray outline
                              p === 'free' && 'border-2 border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800',
                              // STARTER tier - solid blue
                              p === 'starter' && 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
                              // GROWTH tier - purple gradient (best value)
                              p === 'growth' && 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-md',
                              // INTELLIGENCE tier - gold/amber gradient (premium)
                              p === 'intelligence' && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(p);
                            }}
                          >
                            {p === 'intelligence' 
                              ? (isBangla ? 'আপগ্রেড' : 'Upgrade')
                              : planPrice > (plan === 'free' ? 0 : plan === 'starter' ? 199 : plan === 'growth' ? 499 : 0)
                                ? (isBangla ? 'আপগ্রেড' : 'Upgrade')
                                : (isBangla ? 'ডাউনগ্রেড' : 'Downgrade')
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upgrade Confirmation */}
              {selectedPlan && selectedPlan !== plan && (
                <div className={cn(
                  'p-4 rounded-xl border',
                  selectedPlan === 'intelligence' 
                    ? 'bg-amber-500/5 border-amber-500/20' 
                    : selectedPlan === 'growth' 
                      ? 'bg-purple-500/5 border-purple-500/20'
                      : selectedPlan === 'starter'
                        ? 'bg-blue-500/5 border-blue-500/20'
                        : 'bg-muted/30 border-border'
                )}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {isBangla ? `${selectedPlan.toUpperCase()} প্ল্যানে পরিবর্তন করতে চান?` : `Switch to ${selectedPlan.toUpperCase()} plan?`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedPlan !== 'free' 
                          ? (isBangla ? `৳${selectedPlan === 'intelligence' ? 999 : selectedPlan === 'growth' ? 499 : 199}/মাস চার্জ প্রযোজ্য` : `৳${selectedPlan === 'intelligence' ? 999 : selectedPlan === 'growth' ? 499 : 199}/mo will be charged`)
                          : (isBangla ? 'কিছু ফিচার সীমিত হবে' : 'Some features will be limited')
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8 px-3 text-xs"
                        onClick={() => setSelectedPlan(null)}
                      >
                        {isBangla ? 'বাতিল' : 'Cancel'}
                      </Button>
                      <Button
                        size="sm"
                        className={cn(
                          'rounded-lg h-8 px-3 text-xs font-medium',
                          selectedPlan === 'intelligence' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                            : selectedPlan === 'growth'
                              ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white'
                              : selectedPlan === 'starter'
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        )}
                        disabled={isUpgrading}
                        onClick={() => handlePlanUpgrade(selectedPlan)}
                      >
                        {isUpgrading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : null}
                        {isBangla ? 'নিশ্চিত করুন' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </SettingsCard>

            {/* Billing History */}
            <SettingsCard>
              <SectionHeader
                icon={Receipt}
                title={isBangla ? 'বিলিং ইতিহাস' : 'Billing History'}
                description={isBangla ? 'আপনার পেমেন্ট ইতিহাস দেখুন' : 'View your payment history'}
                iconColor="emerald"
              />

              <div className="w-full overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 rounded-lg text-xs font-medium text-muted-foreground">
                  <div className="col-span-3">{isBangla ? 'তারিখ' : 'Date'}</div>
                  <div className="col-span-3">{isBangla ? 'প্ল্যান' : 'Plan'}</div>
                  <div className="col-span-3">{isBangla ? 'পরিমাণ' : 'Amount'}</div>
                  <div className="col-span-3 text-right">{isBangla ? 'অ্যাকশন' : 'Action'}</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {billingHistory.map((bill) => (
                    <div key={bill.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                      <div className="col-span-3 text-sm text-foreground">
                        {isBangla 
                          ? new Date(bill.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })
                          : new Date(bill.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        }
                      </div>
                      <div className="col-span-3">
                        <Badge 
                          variant={bill.plan === 'Pro' ? 'indigo' : bill.plan === 'Business' ? 'default' : 'outline'} 
                          size="sm"
                        >
                          {bill.plan}
                        </Badge>
                      </div>
                      <div className="col-span-3 text-sm font-medium text-foreground">
                        {bill.amount === 0 
                          ? (isBangla ? 'ফ্রি' : 'Free')
                          : `৳${bill.amount}`
                        }
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <Badge 
                          variant={bill.status === 'paid' ? 'success' : 'outline'} 
                          size="sm"
                        >
                          {bill.status === 'paid' 
                            ? (isBangla ? 'পরিশোধিত' : 'Paid')
                            : (isBangla ? 'ফ্রি' : 'Free')
                          }
                        </Badge>
                        {bill.invoiceNo !== '-' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg h-7 w-7"
                            onClick={() => handleDownloadInvoice(bill.invoiceNo)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsCard>

            {/* Payment Methods */}
            <SettingsCard>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader
                  icon={Wallet}
                  title={isBangla ? 'পেমেন্ট মেথড' : 'Payment Methods'}
                  description={isBangla ? 'আপনার পেমেন্ট অপশন পরিচালনা করুন' : 'Manage your payment options'}
                  iconColor="warning"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 px-3 text-xs"
                  onClick={() => setIsAddPaymentDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  {isBangla ? 'যোগ করুন' : 'Add New'}
                </Button>
              </div>

              <div className="space-y-3 w-full">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 mx-auto rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isBangla ? 'কোনো পেমেন্ট মেথড নেই' : 'No payment methods added'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-8 px-4 mt-3"
                      onClick={() => setIsAddPaymentDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {isBangla ? 'পেমেন্ট মেথড যোগ করুন' : 'Add Payment Method'}
                    </Button>
                  </div>
                ) : (
                  paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center',
                          pm.type === 'bkash' ? 'bg-pink-500/10' : 
                          pm.type === 'nagad' ? 'bg-orange-500/10' : 
                          'bg-primary/10'
                        )}>
                          {pm.type === 'bkash' ? (
                            <span className="text-sm font-bold text-pink-500">bK</span>
                          ) : pm.type === 'nagad' ? (
                            <span className="text-sm font-bold text-orange-500">N</span>
                          ) : (
                            <CreditCard className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">
                              {pm.type === 'bkash' ? 'bKash' : pm.type === 'nagad' ? 'Nagad' : isBangla ? 'কার্ড' : 'Card'}
                            </span>
                            {pm.isDefault && (
                              <Badge variant="success" size="sm">
                                <Star className="h-3 w-3 mr-1" />
                                {isBangla ? 'ডিফল্ট' : 'Default'}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{pm.number}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!pm.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-8 px-2 text-xs"
                            onClick={() => setDefaultPaymentMethod(pm.id)}
                          >
                            {isBangla ? 'ডিফল্ট করুন' : 'Set Default'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => deletePaymentMethod(pm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Method Options Info */}
              <div className="mt-4 p-3 rounded-lg bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {isBangla ? 'সমর্থিত পেমেন্ট মেথড:' : 'Supported payment methods:'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-pink-500/10 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-pink-500">bK</span>
                    </div>
                    <span className="text-xs text-foreground">bKash</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-orange-500/10 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-orange-500">N</span>
                    </div>
                    <span className="text-xs text-foreground">Nagad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs text-foreground">{isBangla ? 'কার্ড' : 'Card'}</span>
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Add Payment Method Dialog */}
            <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
              <DialogContent className="sm:max-w-md w-[90%] min-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    {isBangla ? 'পেমেন্ট মেথড যোগ করুন' : 'Add Payment Method'}
                  </DialogTitle>
                  <DialogDescription>
                    {isBangla ? 'একটি নতুন পেমেন্ট মেথড যোগ করুন' : 'Add a new payment method to your account'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Payment Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'পেমেন্ট টাইপ' : 'Payment Type'}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => { setNewPaymentType('bkash'); setNewPaymentExpiry(''); setNewPaymentCvv(''); }}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5',
                          newPaymentType === 'bkash'
                            ? 'border-pink-500 bg-pink-500/10'
                            : 'border-border hover:border-pink-500/30'
                        )}
                      >
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-pink-500">bK</span>
                        </div>
                        <span className="text-xs font-medium">bKash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewPaymentType('nagad'); setNewPaymentExpiry(''); setNewPaymentCvv(''); }}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5',
                          newPaymentType === 'nagad'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-orange-500/30'
                        )}
                      >
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-500">N</span>
                        </div>
                        <span className="text-xs font-medium">Nagad</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPaymentType('card')}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5',
                          newPaymentType === 'card'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium">{isBangla ? 'কার্ড' : 'Card'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Number Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {newPaymentType === 'card' 
                        ? (isBangla ? 'কার্ড নম্বর' : 'Card Number')
                        : (isBangla ? 'মোবাইল নম্বর' : 'Mobile Number')
                      }
                    </Label>
                    <div className="relative">
                      {newPaymentType === 'card' ? (
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      )}
                      <Input
                        value={newPaymentNumber}
                        onChange={(e) => setNewPaymentNumber(e.target.value)}
                        placeholder={newPaymentType === 'card' 
                          ? '1234 5678 9012 3456'
                          : '01XXXXXXXXX'
                        }
                        className="h-11 pl-10"
                      />
                    </div>
                  </div>

                  {/* Card Additional Fields - Expiry and CVV */}
                  {newPaymentType === 'card' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {isBangla ? 'মেয়াদ শেষ' : 'Expiry Date'}
                        </Label>
                        <Input
                          value={newPaymentExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^\d]/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setNewPaymentExpiry(value);
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          CVV
                        </Label>
                        <div className="relative">
                          <Input
                            type="password"
                            value={newPaymentCvv}
                            onChange={(e) => setNewPaymentCvv(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                            placeholder="•••"
                            maxLength={3}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsAddPaymentDialogOpen(false);
                      setNewPaymentNumber('');
                      setNewPaymentExpiry('');
                      setNewPaymentCvv('');
                    }}
                    className="rounded-xl"
                  >
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    disabled={isAddingPayment}
                    className="rounded-xl"
                  >
                    {isAddingPayment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isBangla ? 'যোগ করুন' : 'Add Method'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      case 'help':
        return (
          <SettingsCard>
            <SectionHeader
              icon={HelpCircle}
              title={isBangla ? 'সাহায্য ও সাপোর্ট' : 'Help & Support'}
              iconColor="primary"
            />

            <div className="space-y-2">
              {[
                { label: isBangla ? 'ডকুমেন্টেশন' : 'Documentation', desc: isBangla ? 'বিস্তারিত গাইড' : 'Detailed guides' },
                { label: isBangla ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials', desc: isBangla ? 'শেখার ভিডিও' : 'Learn with videos' },
                { label: isBangla ? 'যোগাযোগ' : 'Contact Support', desc: isBangla ? 'সাপোর্ট টিম' : 'Support team' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </SettingsCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
    
      </div>
  );
}
