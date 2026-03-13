'use client';

import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore, type PageRoute } from '@/stores/uiStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  LogOut,
  Store,
  HelpCircle,
  Zap,
  FileText,
  Truck,
  RotateCcw,
  Lock,
  CheckCircle,
  Trash2,
  Icon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


const mainNavItems = [
  { page: '/' , icon: LayoutDashboard, labelKey: 'Dashboard', labelBn: 'ড্যাশবোর্ড' },
  { page: '/sales', icon: ShoppingCart, labelKey: 'Sales', labelBn: 'বিক্রি' },
  { page: '/sales/quotations', icon: FileText, labelKey: 'Quotations', labelBn: 'কোটেশন' },
  { page: '/returns'  , icon: RotateCcw, labelKey: 'Returns', labelBn: 'রিটার্ন' },
  { page: '/purchases', icon: Truck, labelKey: 'Purchases', labelBn: 'ক্রয়' },
  { page: '/parties' , icon: Users, labelKey: 'Parties', labelBn: 'পার্টি' },
  { page: '/inventory', icon: Package, labelKey: 'Inventory', labelBn: 'ইনভেন্টরি' },
  { page: '/inventory/batches' , icon: Package, labelKey: 'Batches', labelBn: 'ব্যাচ' },
  { page: '/expenses', icon: Receipt, labelKey: 'Expenses', labelBn: 'খরচ' },
  { page: '/reports', icon: BarChart3, labelKey: 'Reports', labelBn: 'রিপোর্ট' },
];

const bottomNavItems = [
  { page: '/ai', icon: Sparkles, labelKey: 'AI', labelBn: 'AI সহায়ক', isPro: true },
  { page: '/settings' , icon: Settings, labelKey: 'Settings', labelBn: 'সেটিংস' },
];

export function Sidebar() {
  const { t, isBangla } = useAppTranslation();
  const { business, logout, plan, features } = useSessionStore();
  const { sidebarCollapsed, setSidebarCollapsed, currentPage, navigateTo } = useUiStore();
  const path = usePathname();
   const language = useUiStore((state) => state.language);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen',
          'bg-sidebar border-r border-sidebar-border',
          'flex flex-col transition-all duration-300 ease-smooth',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-border-subtle px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground">Hello Khata</span>
                <span className="text-[10px] text-muted-foreground">হ্যালো খাতা</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            // size="icon-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', sidebarCollapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Business Name */}
        {!sidebarCollapsed && business && (
          <div className="px-4 py-3 border-b border-border-subtle bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-subtle flex items-center justify-center">
                <Zap className="h-4 w-4 text-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {business.nameBn || business.name}
                </p>
                <p className="text-xs text-muted-foreground">{business.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4 scrollbar-premium">
          <nav className="space-y-1">
            {mainNavItems?.map((item, index) => (
              <div key={item.page} className="stagger-item" style={{ animationDelay: `${index * 30}ms` }}>
     <Link href={item.page}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full',
          'relative group',
          // Default state
          'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          // Active state with indigo accent
          path === item.page && [
            'text-primary bg-primary-subtle',
          ],
          sidebarCollapsed && 'justify-center px-2',
        )}
      >
        {/* Active indicator dot */}
        {  path === item.page && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
        
        <item.icon className={cn(
          'h-5 w-5 flex-shrink-0 transition-all duration-200',
            path === item.page && 'text-primary',
          'group-hover:scale-105'
        )} />
        
        {!sidebarCollapsed && (
          <>
            <span className="truncate">{language ==='en' ? item.labelKey : item.labelBn}</span>
            {/* {isLocked && (
              <Badge variant="warning" size="sm" className="ml-auto">Pro</Badge>
            )} */}
          </>
        )}
      </Link>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-border-subtle p-3 space-y-1">
          {bottomNavItems?.map((item, index) => (
            <div key={item.page} className="stagger-item" style={{ animationDelay: `${(mainNavItems.length + index) * 30}ms` }}>
              <Link href={item.page}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full',
          'relative group',
          // Default state
          'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          // Active state with indigo accent
          path === item.page && [
            'text-primary bg-primary-subtle',
          ],
          sidebarCollapsed && 'justify-center px-2',
          //isLocked && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Active indicator dot */}
        {  path === item.page && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}

        <item.icon className={cn(
          'h-5 w-5 flex-shrink-0 transition-all duration-200',
            path === item.page && 'text-primary',
          'group-hover:scale-105'
        )} />

        {!sidebarCollapsed && (
          <>
            <span className="truncate">{language ==='en' ? item.labelKey : item.labelBn}</span>
            {/* {isLocked && (
              <Badge variant="warning" size="sm" className="ml-auto">Pro</Badge>
            )} */}
          </>
        )}
      </Link>
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium w-full',
              'text-destructive hover:bg-destructive-subtle transition-all duration-200',
              sidebarCollapsed && 'justify-center px-2 mt-2'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>{isBangla ? 'লগআউট' : 'Logout'}</span>}
          </button>
        </div>

     
      </aside>
    </TooltipProvider>
  );
}
