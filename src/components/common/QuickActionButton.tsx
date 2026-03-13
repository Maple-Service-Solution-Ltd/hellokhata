// Hello Khata OS - Quick Action Button Component
// হ্যালো খাতা - কুইক অ্যাকশন বাটন কম্পোনেন্ট

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
  className?: string;
}

const colorClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
  blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300',
  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300',
  red: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300',
};

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
  color = 'emerald',
  className,
}: QuickActionButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={cn(
        'h-auto flex-col gap-2 py-3 px-4 min-w-[100px]',
        colorClasses[color],
        className
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}
