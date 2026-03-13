// Hello Khata OS - Premium App Layout
// Elite SaaS Design - Dark Theme First
// Proper scroll handling with sticky header and fixed AI button

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIDrawer, AILauncherButton } from '@/components/ai/AIDrawer';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Simple store subscription for hydration
const emptySubscribe = () => () => {};

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, aiDrawerCollapsed } = useUiStore();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Lock body scroll when AI drawer is open
  useEffect(() => {
    if (!aiDrawerCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [aiDrawerCollapsed]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !aiDrawerCollapsed) {
        useUiStore.getState().toggleAiDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aiDrawerCollapsed]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-indigo animate-pulse flex items-center justify-center">
            <div className="h-6 w-6 rounded-lg bg-background/50" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed position */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* AI Copilot Drawer - Fixed overlay */}
      <AIDrawer />

      {/* AI Copilot Launcher Button - FIXED at middle-right, always visible */}
      <AILauncherButton />

      {/* Main Content Area with sidebar margin */}
      <div
        className={cn(
          'transition-all duration-300 ease-smooth',
          'md:ml-64',
          sidebarCollapsed && 'md:ml-16'
        )}
      >
        {/* Sticky Header */}
        <Header />

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8 animate-fade-in min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </>
  );
}
