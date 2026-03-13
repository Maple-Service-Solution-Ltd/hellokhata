// Hello Khata OS - Shared Page Container Component
// Provides consistent centered layout for form pages and settings

'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface PageContainerProps {
  children: React.ReactNode;
  /** Maximum width in pixels. Default: 900 */
  maxWidth?: number;
  /** Show back button */
  showBack?: boolean;
  /** Custom back handler */
  onBack?: () => void;
  /** Additional class names */
  className?: string;
}

export function PageContainer({ 
  children, 
  maxWidth = 900,
  showBack = true,
  onBack,
  className 
}: PageContainerProps) {
  const router = useRouter();
  const { isBangla } = useAppTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('flex justify-center', className)}>
      <div 
        className="w-full px-4 sm:px-6"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-4 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">
              {isBangla ? 'পেছনে যান' : 'Go Back'}
            </span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  icon: React.ElementType;
  iconColor?: 'primary' | 'indigo' | 'emerald' | 'warning';
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  action?: React.ReactNode;
}

export function PageHeader({ 
  icon: Icon, 
  iconColor = 'primary',
  title, 
  titleBn,
  description, 
  descriptionBn,
  action 
}: PageHeaderProps) {
  const { isBangla } = useAppTranslation();

  const colorClasses = {
    primary: 'bg-primary/15 text-primary',
    indigo: 'bg-indigo/15 text-indigo',
    emerald: 'bg-emerald/15 text-emerald',
    warning: 'bg-warning/15 text-warning',
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', colorClasses[iconColor])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isBangla && titleBn ? titleBn : title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {isBangla && descriptionBn ? descriptionBn : description}
              </p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

// Form Card Component
interface FormCardProps {
  children: React.ReactNode;
  title?: string;
  titleBn?: string;
  className?: string;
}

export function FormCard({ children, title, titleBn, className }: FormCardProps) {
  const { isBangla } = useAppTranslation();

  return (
    <div 
      className={cn(
        'rounded-2xl border border-[rgba(255,255,255,0.06)]',
        'bg-[rgba(255,255,255,0.03)]',
        className
      )}
    >
      {title && (
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-base font-semibold text-foreground">
            {isBangla && titleBn ? titleBn : title}
          </h2>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Form Section Component
interface FormSectionProps {
  title?: string;
  titleBn?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted';
}

export function FormSection({ 
  title, 
  titleBn, 
  children, 
  className,
  variant = 'default' 
}: FormSectionProps) {
  const { isBangla } = useAppTranslation();

  return (
    <div 
      className={cn(
        'space-y-4',
        variant === 'highlighted' && 'p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]',
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-semibold text-foreground">
          {isBangla && titleBn ? titleBn : title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Form Actions Component
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex gap-3 pt-4', className)}>
      {children}
    </div>
  );
}

export default PageContainer;
