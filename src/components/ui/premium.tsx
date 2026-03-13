// Hello Khata OS - Premium Design System Components
// Elite SaaS UI Components inspired by Stripe, Linear, Notion
// GPU-optimized for smooth performance

'use client';

import { forwardRef, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

/* ============================================
   BUTTON VARIANTS
   ============================================ */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-transparent hover:bg-muted hover:text-foreground',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        premium: 'bg-gradient-to-r from-primary to-indigo text-primary-foreground hover:opacity-90',
        glass: 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10',
      },
      size: {
        default: 'h-10 px-4 py-2 rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/* ============================================
   BUTTON COMPONENT
   ============================================ */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ============================================
   CARD VARIANTS - PREMIUM WITH INNER GRADIENTS
   ============================================ */
const cardVariants = cva(
  'transition-all duration-200 relative',
  {
    variants: {
      variant: {
        default: 'border border-[rgba(255,255,255,0.04)] rounded-xl bg-gradient-to-b from-[rgba(30,40,52,1)] to-[rgba(28,36,48,1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.15)]',
        elevated: 'border border-[rgba(255,255,255,0.04)] rounded-xl bg-gradient-to-b from-[rgba(35,46,60,1)] to-[rgba(33,43,56,1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5',
        glass: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl',
        ghost: 'bg-transparent',
        outline: 'border border-border rounded-xl',
        glow: 'border border-[rgba(255,255,255,0.04)] rounded-xl bg-gradient-to-b from-[rgba(30,40,52,1)] to-[rgba(28,36,48,1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

/* ============================================
   CARD COMPONENT
   ============================================ */
export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  glowColor?: 'emerald' | 'indigo' | 'warning' | 'none';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, glowColor, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding }),
          glowColor === 'emerald' && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_20px_rgba(15,191,159,0.06)]',
          glowColor === 'indigo' && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_20px_rgba(79,91,255,0.08)]',
          glowColor === 'warning' && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_20px_rgba(232,162,58,0.06)]',
          className
        )}
        {...props}
      >
        {/* Premium inner gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 40%)',
            borderRadius: 'inherit'
          }}
        />
        <div className="relative">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

/* ============================================
   CARD HEADER, CONTENT, FOOTER
   ============================================ */
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/* ============================================
   INPUT COMPONENT
   ============================================ */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border-subtle bg-input px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-destructive focus:ring-destructive/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* ============================================
   BADGE VARIANTS - SUBTLE & REFINED
   ============================================ */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-subtle text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive-subtle text-destructive',
        warning: 'bg-warning-subtle text-warning',
        success: 'bg-success-subtle text-success',
        indigo: 'bg-indigo-subtle text-indigo',
        outline: 'border border-border text-foreground',
        ghost: 'text-muted-foreground',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/* ============================================
   BADGE COMPONENT
   ============================================ */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: ReactNode;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, icon, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        {icon}
        {children}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

/* ============================================
   KPI CARD COMPONENT (Flagship Dashboard Card)
   ============================================ */
export interface KPICardProps {
  title: string;
  titleBn?: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  iconColor?: 'emerald' | 'indigo' | 'warning' | 'destructive';
  isBangla?: boolean;
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  titleBn,
  value,
  prefix,
  suffix,
  trend,
  icon,
  iconColor = 'emerald',
  isBangla = false,
  className,
  onClick,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const prevValueRef = useRef(0);
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    // Reset animation when value changes significantly (e.g., from 0 to actual value)
    if (Math.abs(numericValue - prevValueRef.current) > 0) {
      hasAnimated.current = false;
    }
    prevValueRef.current = numericValue;
    
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    
    const duration = 800;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [numericValue]);
  
  const iconColorClasses = {
    emerald: 'text-emerald bg-emerald-subtle',
    indigo: 'text-primary bg-primary-subtle',
    warning: 'text-warning bg-warning-subtle',
    destructive: 'text-destructive bg-destructive-subtle',
  };
  
  const formatValue = (val: number) => {
    return new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US').format(val);
  };
  
  return (
    <Card
      variant="elevated"
      className={cn(
        'relative overflow-hidden cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {isBangla && titleBn ? titleBn : title}
          </p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-lg font-medium text-muted-foreground">{prefix}</span>}
            <span className="kpi-number text-foreground animate-count-up">
              {typeof value === 'number' ? formatValue(displayValue) : value}
            </span>
            {suffix && <span className="text-lg font-medium text-muted-foreground">{suffix}</span>}
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-primary' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(trend.value))}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            iconColorClasses[iconColor]
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ============================================
   CIRCULAR PROGRESS RING - PREMIUM GRADIENT
   ============================================ */
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  showGrade?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 140,
  strokeWidth = 10,
  grade = 'A',
  showGrade = true,
  label,
  sublabel,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / max) * circumference;
  
  // Premium grade colors with glow
  const gradeColors = {
    A: { stroke: '#4F5BFF', text: 'text-primary', glow: 'rgba(79, 91, 255, 0.2)' },
    B: { stroke: '#0FBF9F', text: 'text-emerald', glow: 'rgba(15, 191, 159, 0.2)' },
    C: { stroke: '#E8A23A', text: 'text-warning', glow: 'rgba(232, 162, 58, 0.2)' },
    D: { stroke: '#F97316', text: 'text-orange-500', glow: 'rgba(249, 115, 22, 0.2)' },
    F: { stroke: '#C93C42', text: 'text-destructive', glow: 'rgba(201, 60, 66, 0.2)' },
  };
  
  const colors = gradeColors[grade];
  
  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size} style={{ filter: `drop-shadow(0 0 10px ${colors.glow})` }}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F5BFF" />
              <stop offset="100%" stopColor="#0FBF9F" />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            className="stroke-border-subtle"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle with glow */}
          <circle
            className="transition-all duration-800 ease-smooth"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', colors.text)}>{value}</span>
          {showGrade && (
            <span className={cn('text-sm font-semibold', colors.text)}>Grade {grade}</span>
          )}
        </div>
      </div>
      {label && (
        <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      )}
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

/* ============================================
   PROGRESS BAR - PREMIUM WITH SHINE
   ============================================ */
export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
  color?: 'emerald' | 'indigo' | 'warning' | 'destructive';
  showValue?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  color = 'indigo',
  showValue = false,
  className,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const colorClasses = {
    emerald: 'bg-emerald',
    indigo: 'bg-primary',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };
  
  return (
    <div 
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.04)]', 
        sizeClasses[size], 
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden',
          variant === 'gradient' 
            ? 'bg-gradient-to-r from-primary to-emerald' 
            : colorClasses[color]
        )}
        style={{ width: `${percentage}%` }}
      />
      {/* Shine effect */}
      <div 
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            animation: 'progress-shine 2.5s ease-in-out infinite',
            willChange: 'transform'
          }}
        />
      </div>
      {showValue && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

/* ============================================
   AVATAR COMPONENT
   ============================================ */
export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };
  
  const initials = fallback?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className={cn(
      'relative rounded-full bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center font-semibold',
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-primary">{initials || '?'}</span>
      )}
    </div>
  );
}

/* ============================================
   DIVIDER COMPONENT
   ============================================ */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={cn(
      'h-px w-full bg-gradient-to-r from-transparent via-border to-transparent',
      className
    )} />
  );
}

/* ============================================
   SKELETON COMPONENT
   ============================================ */
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-muted rounded-lg',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded',
        className
      )}
      style={{ width, height }}
    />
  );
}

/* ============================================
   EMPTY STATE COMPONENT
   ============================================ */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  action?: ReactNode;
  isBangla?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  titleBn,
  description,
  descriptionBn,
  action,
  isBangla = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center w-full min-h-[200px]', className)}>
      {icon && (
        <div className="mb-4 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1 whitespace-nowrap">
        {isBangla && titleBn ? titleBn : title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground  mb-4  text-ellipsis">
          {isBangla && descriptionBn ? descriptionBn : description}
        </p>
      )}
      <div className="shrink-0">
        {action}
      </div>
    </div>
  );
}

/* ============================================
   SPACING COMPONENT
   ============================================ */
export function Spacer({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  };
  return <div className={sizeClasses[size]} />;
}

/* ============================================
   FEATURE GATE OVERLAY
   ============================================ */
export interface FeatureGateOverlayProps {
  isLocked: boolean;
  featureName: string;
  featureNameBn?: string;
  requiredPlan: string;
  isBangla?: boolean;
  onUpgrade?: () => void;
  children: ReactNode;
  className?: string;
}

export function FeatureGateOverlay({
  isLocked,
  featureName,
  featureNameBn,
  requiredPlan,
  isBangla = false,
  onUpgrade,
  children,
  className,
}: FeatureGateOverlayProps) {
  if (!isLocked) return <>{children}</>;
  
  return (
    <div className={cn('relative', className)}>
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6 max-w-xs">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {isBangla && featureNameBn ? featureNameBn : featureName}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isBangla 
              ? `${requiredPlan} প্ল্যানে এই ফিচারটি পান` 
              : `Available on ${requiredPlan} plan`}
          </p>
          <Button size="sm" onClick={onUpgrade} variant="premium">
            {isBangla ? 'আপগ্রেড করুন' : 'Upgrade'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   GLASS NAVIGATION BAR (Mobile Bottom Nav)
   ============================================ */
export interface NavItemProps {
  icon: ReactNode;
  label: string;
  labelBn?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export interface GlassNavBarProps {
  items: NavItemProps[];
  isBangla?: boolean;
  className?: string;
}

export function GlassNavBar({ items, isBangla = false, className }: GlassNavBarProps) {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-glass-bg backdrop-blur-xl',
      'border-t border-glass-border',
      'safe-area-inset-bottom',
      className
    )}>
      <div className="flex items-center justify-around py-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-4 min-w-[64px]',
              'transition-all duration-150',
              item.isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className={cn(
              'h-6 w-6 mb-1',
              item.isActive && 'filter drop-shadow-[0_0_6px_rgba(79,91,255,0.3)]'
            )}>
              {item.icon}
            </div>
            <span className="text-[10px] font-medium">
              {isBangla && item.labelBn ? item.labelBn : item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ============================================
   EXPORTS
   ============================================ */
export { buttonVariants, cardVariants, badgeVariants };
