import { cn } from "@/lib/utils";
import { Button, Input } from "../ui/premium";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export const SettingsCard = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div 
    className={cn(
      'w-full min-w-[400px] rounded-2xl p-6 md:p-8',
      'bg-card border border-border',
      className
    )}
  >
    {children}
  </div>
);

export const SectionHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = 'primary' 
}: { 
  icon: React.ElementType; 
  title: string; 
  description?: string;
  iconColor?: 'primary' | 'indigo' | 'warning' | 'emerald';
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    indigo: 'bg-indigo/10 text-indigo',
    warning: 'bg-warning/10 text-warning',
    emerald: 'bg-emerald/10 text-emerald',
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-3">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', colorClasses[iconColor])}>
          <Icon className="h-4 w-4" />
        </div>
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 ml-11">
          {description}
        </p>
      )}
    </div>
  );
};

export const ActionRow = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  onAction 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Button
      variant="outline" 
      size="sm" 
      className="rounded-lg h-8 px-3 text-xs"
      onClick={onAction}
    >
      {action}
    </Button>
  </div>
);


export const SettingsInput = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  placeholder, 
  type = 'text' 
}: { 
  label: string; 
  icon?: React.ElementType; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string;
  type?: string;
}) => (
  <div className="w-full space-y-2">
    <Label className="text-xs font-medium text-muted-foreground">
      {label}
    </Label>
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full',
          Icon && 'pl-10'
        )}
      />
    </div>
  </div>
);

export const SaveButton = ({ 
  onClick, 
  isLoading, 
  label 
}: { 
  onClick: () => void; 
  isLoading: boolean; 
  label: string;
}) => (
  <div className="flex justify-end mt-8 pt-6 border-t border-border">
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="h-10 px-6 rounded-xl font-medium text-sm"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  </div>
);
