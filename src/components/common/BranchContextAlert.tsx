// Hello Khata OS - Branch Context Alert Component
// Shows current branch context in forms and alerts when branch is not selected

'use client';

import { useBranchStore } from '@/stores/branchStore';
import { useBranches } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { AlertCircle, Building2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface BranchContextAlertProps {
  className?: string;
  showSelector?: boolean;
}

/**
 * Shows an alert if no branch is selected (All Branches mode)
 * Optionally shows a branch selector
 */
export function BranchContextAlert({ 
  className,
  showSelector = true 
}: BranchContextAlertProps) {
  const { isBangla } = useAppTranslation();
  const currentBranchId = useBranchStore((state) => state.currentBranchId);
  const viewAllBranches = useBranchStore((state) => state.viewAllBranches);
  const setCurrentBranch = useBranchStore((state) => state.setCurrentBranch);
  const setViewAllBranches = useBranchStore((state) => state.setViewAllBranches);
  const { data: branches } = useBranches();

  const currentBranch = branches?.find(b => b.id === currentBranchId);
  
  // In "All Branches" mode - show warning
  if (viewAllBranches || !currentBranchId) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800',
        className
      )}>
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {isBangla ? 'শাখা নির্বাচন করুন' : 'Select a Branch'}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            {isBangla 
              ? 'এই কাজের জন্য একটি নির্দিষ্ট শাখা নির্বাচন করুন। "সব শাখা" মোডে নতুন রেকর্ড তৈরি করা যাবে না।'
              : 'Please select a specific branch for this action. "All Branches" mode cannot be used for creating new records.'}
          </p>
        </div>
        
        {showSelector && branches && branches.length > 0 && (
          <Select
            value={currentBranchId || ''}
            onValueChange={(value) => {
              setCurrentBranch(value);
              setViewAllBranches(false);
            }}
          >
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
              <SelectValue placeholder={isBangla ? 'শাখা নির্বাচন' : 'Select Branch'} />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  <div className="flex items-center gap-2">
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
        )}
      </div>
    );
  }

  // Branch is selected - show current context
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg',
      'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800',
      className
    )}>
      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span className="text-sm text-emerald-700 dark:text-emerald-300">
        {isBangla ? 'শাখা:' : 'Branch:'}
      </span>
      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
        {currentBranch?.nameBn || currentBranch?.name || (isBangla ? 'অজানা' : 'Unknown')}
      </Badge>
      {currentBranch?.isMain && (
        <Badge variant="outline" className="text-[10px]">
          {isBangla ? 'প্রধান' : 'Main'}
        </Badge>
      )}
    </div>
  );
}

/**
 * Minimal branch indicator for form headers
 */
export function BranchIndicator({ className }: { className?: string }) {
  const { isBangla } = useAppTranslation();
  const currentBranchId = useBranchStore((state) => state.currentBranchId);
  const { data: branches } = useBranches();
  
  const currentBranch = branches?.find(b => b.id === currentBranchId);
  
  if (!currentBranchId || !currentBranch) {
    return (
      <span className={cn(
        'text-xs text-amber-600 dark:text-amber-400',
        className
      )}>
        ⚠️ {isBangla ? 'শাখা নির্বাচন করুন' : 'Select branch'}
      </span>
    );
  }
  
  return (
    <span className={cn(
      'text-xs text-emerald-600 dark:text-emerald-400',
      className
    )}>
      📍 {currentBranch.nameBn || currentBranch.name}
    </span>
  );
}
