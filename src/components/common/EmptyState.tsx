// Hello Khata OS - Empty State Component
// হ্যালো খাতা - এম্পটি স্টেট কম্পোনেন্ট

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        'w-full min-h-[200px]', // Ensure minimum dimensions
        className
      )}
    >
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 shrink-0">
          <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 whitespace-nowrap">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
          {description}
        </p>
      )}
      {action && (
        <Button 
          onClick={action.onClick} 
          className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap shrink-0"
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2 shrink-0" />}
          <span className="whitespace-nowrap">{action.label}</span>
        </Button>
      )}
    </div>
  );
}
