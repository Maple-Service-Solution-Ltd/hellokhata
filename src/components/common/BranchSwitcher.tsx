// Hello Khata OS - Branch Switcher Component
// হ্যালো খাতা - ব্রাঞ্চ সুইচার কম্পোনেন্ট

'use client';

import { useRouter } from 'next/navigation';
import { useBranchStore } from '@/stores/branchStore';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useBranches } from '@/hooks/queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  ChevronDown,
  MapPin,
  Plus,
  Settings,
  Check,
  LayoutGrid,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FeatureGate, ProBadge } from './FeatureGate';

interface BranchSwitcherProps {
  compact?: boolean;
}

export function BranchSwitcher({ compact = false }: BranchSwitcherProps) {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const { currentBranchId, setCurrentBranch, viewAllBranches, setViewAllBranches } = useBranchStore();
  const { data: branches, isLoading } = useBranches();
  const featureAccess = useFeatureAccess('multiBranch');

  // If multi-branch is not unlocked, show clickable upgrade prompt
  if (!featureAccess.isUnlocked) {
    return (
      <button
        onClick={() => router.push('/settings#subscription')}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
        title={isBangla ? 'আপগ্রেড করতে ক্লিক করুন' : 'Click to upgrade'}
      >
        <Building2 className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium">
          {isBangla ? 'প্রধান শাখা' : 'Main Branch'}
        </span>
        <Lock className="w-3 h-3 text-purple-500 group-hover:text-purple-600" />
      </button>
    );
  }

  // Loading state - show skeleton that matches header style
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="w-20 h-4 bg-muted rounded" />
      </div>
    );
  }

  // If no branches exist yet, show a simple "Main Branch" indicator
  if (!branches?.length) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Building2 className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium">
          {isBangla ? 'প্রধান শাখা' : 'Main Branch'}
        </span>
      </div>
    );
  }

  const currentBranch = branches.find(b => b.id === currentBranchId);

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {viewAllBranches 
                ? (isBangla ? 'সব শাখা' : 'All Branches')
                : (currentBranch?.nameBn || currentBranch?.name || (isBangla ? 'শাখা নির্বাচন' : 'Select Branch'))
              }
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>
            {isBangla ? 'শাখা নির্বাচন করুন' : 'Select Branch'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* All Branches Option */}
          <DropdownMenuItem
            onClick={() => setViewAllBranches(true)}
            className={cn(viewAllBranches && 'bg-emerald-50 dark:bg-emerald-950')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            {isBangla ? 'সব শাখার সারসংক্ষেপ' : 'All Branches Summary'}
            {viewAllBranches && <Check className="w-4 h-4 ml-auto text-emerald-600" />}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Individual Branches */}
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => {
                setCurrentBranch(branch.id);
                setViewAllBranches(false);
              }}
              className={cn(
                currentBranchId === branch.id && !viewAllBranches && 'bg-emerald-50 dark:bg-emerald-950'
              )}
            >
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <div className="flex flex-col">
                <span>{branch.nameBn || branch.name}</span>
                {branch.isMain && (
                  <Badge variant="secondary" className="text-[10px] w-fit mt-0.5">
                    {isBangla ? 'প্রধান' : 'Main'}
                  </Badge>
                )}
              </div>
              {currentBranchId === branch.id && !viewAllBranches && (
                <Check className="w-4 h-4 ml-auto text-emerald-600" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/settings/branches" className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              {isBangla ? 'শাখা পরিচালনা' : 'Manage Branches'}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full dropdown version
  return (
    <div className="flex items-center gap-2">
      <Select
        value={viewAllBranches ? 'all' : (currentBranchId || '')}
        onValueChange={(value) => {
          if (value === 'all') {
            setViewAllBranches(true);
          } else {
            setCurrentBranch(value);
            setViewAllBranches(false);
          }
        }}
      >
        <SelectTrigger className="w-[200px] bg-white dark:bg-gray-900">
          <Building2 className="w-4 h-4 mr-2 text-emerald-600" />
          <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন' : 'Select Branch'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span>{isBangla ? 'সব শাখার সারসংক্ষেপ' : 'All Branches'}</span>
            </div>
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{branch.nameBn || branch.name}</span>
                {branch.isMain && (
                  <Badge variant="secondary" className="text-[10px]">
                    {isBangla ? 'প্রধান' : 'Main'}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="icon" asChild>
        <Link href="/settings/branches">
          <Settings className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
}

// Branch badge for header
export function BranchBadge() {
  const { currentBranch, viewAllBranches } = useBranchStore();
  const { isBangla } = useAppTranslation();
  
  if (viewAllBranches) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
        <LayoutGrid className="w-3 h-3 mr-1" />
        {isBangla ? 'সব শাখা' : 'All'}
      </Badge>
    );
  }
  
  if (!currentBranch) return null;
  
  return (
    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      <MapPin className="w-3 h-3 mr-1" />
      {currentBranch.nameBn || currentBranch.name}
    </Badge>
  );
}

export default BranchSwitcher;
