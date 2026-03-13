// Hello Khata OS - Command Palette
// Global search and action palette (Ctrl+K)

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/premium';
import {
  Search,
  DollarSign,
  Package,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Building2,
  FileText,
  CreditCard,
  Box,
  Plus,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  labelBn: string;
  shortcut?: string;
  icon: React.ElementType;
  category: 'navigation' | 'action' | 'recent';
  action: () => void;
  keywords: string[];
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { isBangla } = useAppTranslation();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define commands
  const commands = useMemo<Command[]>(() => [
    // Navigation
    { id: 'nav-overview', label: 'Overview', labelBn: 'ওভারভিউ', icon: BarChart3, category: 'navigation', action: () => router.push('/'), keywords: ['home', 'dashboard'] },
    { id: 'nav-sales', label: 'Sales', labelBn: 'বিক্রি', icon: DollarSign, category: 'navigation', action: () => router.push('/sales'), keywords: ['sell', 'invoice'] },
    { id: 'nav-customers', label: 'Customers', labelBn: 'গ্রাহক', icon: Users, category: 'navigation', action: () => router.push('/parties'), keywords: ['party', 'client'] },
    { id: 'nav-inventory', label: 'Inventory', labelBn: 'ইনভেন্টরি', icon: Package, category: 'navigation', action: () => router.push('/inventory'), keywords: ['stock', 'items'] },
    { id: 'nav-reports', label: 'Reports', labelBn: 'রিপোর্ট', icon: FileText, category: 'navigation', action: () => router.push('/reports'), keywords: ['analytics'] },
    { id: 'nav-ai', label: 'AI Copilot', labelBn: 'AI সহায়ক', icon: Sparkles, category: 'navigation', action: () => router.push('/ai'), keywords: ['assistant', 'chat'] },
    { id: 'nav-branches', label: 'Branches', labelBn: 'ব্রাঞ্চ', icon: Building2, category: 'navigation', action: () => router.push('/settings#branches'), keywords: ['store'] },
    { id: 'nav-settings', label: 'Settings', labelBn: 'সেটিংস', icon: Settings, category: 'navigation', action: () => router.push('/settings'), keywords: ['config'] },
    
    // Actions
    { id: 'action-new-sale', label: 'New Sale', labelBn: 'নতুন বিক্রি', icon: Plus, shortcut: 'N', category: 'action', action: () => router.push('/sales/new'), keywords: ['sell', 'invoice', 'create'] },
    { id: 'action-new-payment', label: 'Record Payment', labelBn: 'পেমেন্ট রেকর্ড', icon: CreditCard, category: 'action', action: () => router.push('/parties'), keywords: ['collect', 'receive'] },
    { id: 'action-new-expense', label: 'Add Expense', labelBn: 'খরচ যোগ', icon: Receipt, category: 'action', action: () => router.push('/expenses/new'), keywords: ['cost', 'spending'] },
    { id: 'action-new-item', label: 'Add Item', labelBn: 'পণ্য যোগ', icon: Box, category: 'action', action: () => router.push('/inventory/new'), keywords: ['product', 'stock'] },
    { id: 'action-new-customer', label: 'Add Customer', labelBn: 'গ্রাহক যোগ', icon: Users, category: 'action', action: () => router.push('/parties/new'), keywords: ['client', 'party'] },
    
    // Quick Reports
    { id: 'report-profit', label: 'Profit Trend', labelBn: 'লাভের প্রবণতা', icon: TrendingUp, category: 'action', action: () => router.push('/reports?tab=profit'), keywords: ['margin', 'growth'] },
    { id: 'report-low-stock', label: 'Low Stock Alert', labelBn: 'কম স্টক', icon: AlertTriangle, category: 'action', action: () => router.push('/inventory?filter=low'), keywords: ['reorder', 'minimum'] },
    { id: 'report-credit', label: 'Credit Report', labelBn: 'ক্রেডিট রিপোর্ট', icon: CreditCard, category: 'action', action: () => router.push('/reports/credit-aging'), keywords: ['aging', 'overdue'] },
    
    // Recent
    { id: 'recent-sale-1', label: 'Invoice #1001', labelBn: 'ইনভয়েস #1001', icon: FileText, category: 'recent', action: () => router.push('/sales/1001'), keywords: [] },
    { id: 'recent-customer-1', label: 'Karim Hossain', labelBn: 'করিম হোসেন', icon: Users, category: 'recent', action: () => router.push('/parties/1'), keywords: [] },
    { id: 'recent-item-1', label: 'Rice (Miniket)', labelBn: 'চাল (মিনিকেট)', icon: Package, category: 'recent', action: () => router.push('/inventory/1'), keywords: [] },
  ], [router]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.labelBn.includes(search) ||
      cmd.keywords.some(kw => kw.includes(searchLower))
    );
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open command palette
          const event = new CustomEvent('openCommandPalette');
          window.dispatchEvent(event);
        }
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      // Navigate with arrows
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const selectedCmd = filteredCommands[selectedIndex];
          if (selectedCmd) {
            selectedCmd.action();
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (cmd: Command) => {
    cmd.action();
    onClose();
  };

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    navigation: isBangla ? 'নেভিগেশন' : 'Navigation',
    action: isBangla ? 'অ্যাকশন' : 'Actions',
    recent: isBangla ? 'সাম্প্রতিক' : 'Recent',
  };

  let itemIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-start justify-center pt-[15vh] px-4 h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: '100%', maxWidth: '560px', minWidth: '320px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={isBangla ? 'কমান্ড বা পেজ খুঁজুন...' : 'Search commands or pages...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
              autoFocus
            />
            <Badge variant="outline" size="sm">
              <kbd className="text-[10px]">ESC</kbd>
            </Badge>
          </div>

          {/* Commands List */}
          <div className="max-h-[50vh] min-h-[200px] overflow-y-auto scrollbar-premium">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="py-2">
                <p className="px-4 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]}
                </p>
                {cmds.map((cmd) => {
                  itemIndex++;
                  const currentIndex = itemIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        selectedIndex === currentIndex
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        selectedIndex === currentIndex ? 'bg-primary-subtle text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <cmd.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium">
                        {isBangla ? cmd.labelBn : cmd.label}
                      </span>
                      {cmd.shortcut && (
                        <Badge variant="outline" size="sm">
                          <kbd className="text-[10px]">{cmd.shortcut}</kbd>
                        </Badge>
                      )}
                      {selectedIndex === currentIndex && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* No results */}
            {filteredCommands.length === 0 && (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isBangla ? 'কোনো ফলাফল নেই' : 'No results found'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle bg-muted/30">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border-subtle">↑↓</kbd>
                {isBangla ? 'নেভিগেট' : 'Navigate'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border-subtle">↵</kbd>
                {isBangla ? 'সিলেক্ট' : 'Select'}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {isBangla ? `${filteredCommands.length} টি কমান্ড` : `${filteredCommands.length} commands`}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Command Palette Trigger Button
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  const { isBangla } = useAppTranslation();
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/50 border border-border-subtle hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <Search className="h-4 w-4" />
      <span className="text-sm hidden sm:inline">
        {isBangla ? 'খুঁজুন...' : 'Search...'}
      </span>
      <div className="hidden md:flex items-center gap-0.5 ml-2">
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] border border-border-subtle">⌘</kbd>
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] border border-border-subtle">K</kbd>
      </div>
    </button>
  );
}

export default CommandPalette;
