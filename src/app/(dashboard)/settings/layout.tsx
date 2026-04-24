'use client';
import { Badge } from '@/components/ui/premium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { useNavigation, useUiStore } from '@/stores';
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
//   Badge,
//   Link,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Active section
  const [activeSection, setActiveSection] = useState('profile');

//  const { navigateTo } = useNavigation();
     const { t, isBangla, changeLanguage } = useAppTranslation();
       const { theme, setTheme, language } = useUiStore();
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
  return  <div className='space-y-6'>
    <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            {t('settings.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isBangla ? 'অ্যাপ ও ব্যবসার সেটিংস পরিচালনা করুন' : 'Manage your app and business settings'}
          </p>
        </div>
      </div> <div className="flex flex-col lg:flex-row gap-6">
    {/* Page Header */}
        {/* Left Navigation - Hidden on mobile */}
        <nav className="hidden lg:block w-52 flex-shrink-0">
            <div className="space-y-5">
              {settingsCategories.map((category) => (
                <div key={category.id}>
                  {/* Category Label */}
                  <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2.5 mb-1.5">
                    {category.label}
                  </p>
                  {/* Category Items */}
                  <div className="space-y-0.5">
                    {category.items.map((item) => {
                      const isActive = activeSection === item.id;
                      const itemContent = (
                        <>
                          <div className="flex items-center gap-2.5">
                            <item.icon className="h-4 w-4" />
                            <span>{isBangla ? item.labelBn : item.labelEn}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.isPro && (
                              <Badge variant="indigo" size="sm">Pro</Badge>
                            )}
                            {item.href && (
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </>
                      );

                      // If item has href, render as Link
                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all',
                              'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            {itemContent}
                          </Link>
                        );
                      }

                      // If item has pageRoute, render as button with client-side navigation
                      if (item.pageRoute) {
                        return (
                          <button
                            key={item.id}
                            // onClick={() => navigateTo(item.pageRoute as any)}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all',
                              'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                          >
                            {itemContent}
                          </button>
                        );
                      }

                      // Otherwise render as button with active state
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all',
                            isActive 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          {itemContent}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* App Settings - Language */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2.5 mb-2.5">
                {isBangla ? 'অ্যাপ সেটিংস' : 'APP SETTINGS'}
              </p>
              
              {/* Language Toggle */}
              <div className="px-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{t('settings.language')}</span>
                </div>
                <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                  <button
                    onClick={() => changeLanguage('bn')}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all',
                      language === 'bn'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all',
                      language === 'en'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="mt-4 px-2.5">
              <button
                // onClick={logout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t('settings.logout')}
              </button>
            </div>
          </nav>

          {/* Right Content Panel - Full width with proper minimum */}
          <div className="flex-1 min-w-[400px] w-full max-w-full">
            {/* Mobile Section Tabs */}
            <div className="lg:hidden mb-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-1 p-1 bg-muted/30 rounded-xl min-w-max">
                {settingsCategories.flatMap(cat => cat.items).filter(item => !item.href).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {isBangla ? item.labelBn : item.labelEn}
                    {item.isPro && (
                      <Badge variant="indigo" size="sm">Pro</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
           {children}
          </div>
        </div>
        
        {/* Mobile App Settings - Language & Theme */}
        <div className="lg:hidden mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            {/* Language Toggle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('settings.language')}</span>
              </div>
              <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                <button
                  onClick={() => changeLanguage('bn')}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-md transition-all',
                    language === 'bn'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-md transition-all',
                    language === 'en'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  English
                </button>
              </div>
            </div>

            {/* Theme Toggle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('settings.theme')}</span>
              </div>
              <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-lg">
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-md transition-all',
                    theme === 'dark'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium rounded-md transition-all',
                    theme === 'light'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Light
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Logout */}
          <button
            // onClick={logout}
            className="w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-xl text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('settings.logout')}
          </button>
        </div>
      </div>;
}