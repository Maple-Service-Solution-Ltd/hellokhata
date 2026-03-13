// Hello Khata OS - Inventory Settings Page
// হ্যালো খাতা - ইনভেন্টরি সেটিংস পেজ

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useCategories } from '@/hooks/queries';
import {
  Package,
  AlertTriangle,
  Bell,
  Save,
  Loader2,
  Settings,
  TrendingDown,
  Shield,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSessionStore } from '@/stores/sessionStore';
import { useNavigation } from '@/stores/uiStore';
import { ArrowLeft } from 'lucide-react';

// Settings input component using shadcn/ui Input with full width
const SettingsInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  suffix?: string;
}) => (
  <div className="w-full space-y-2">
    <Label className="text-xs font-medium text-muted-foreground">
      {label}
    </Label>
    <div className="relative w-full">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('h-11 w-full', suffix && 'pr-12')}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// Section header component
const SectionHeader = ({
  icon: Icon,
  title,
  description,
  iconColor = 'primary',
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

// Settings card component with full width
const SettingsCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'w-full rounded-2xl p-6',
      'bg-card border border-border',
      className
    )}
  >
    {children}
  </div>
);

// Toggle row component
const ToggleRow = ({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border w-full">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

export default function InventorySettingsPage() {
  const { isBangla } = useAppTranslation();
  const { toast } = useToast();
  const businessId = useSessionStore((s) => s.business?.id);
  const { data: categories, refetch: refetchCategories } = useCategories();
  const { navigateTo } = useNavigation();

  // Form state
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [stockWarningNotifications, setStockWarningNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Category management state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; nameBn: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', nameBn: '' });
  const [isCategorySaving, setIsCategorySaving] = useState(false);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory-settings');
      const data = await response.json();
      if (data.success) {
        setLowStockThreshold(data.data.lowStockThreshold);
        setLowStockAlerts(data.data.lowStockAlerts);
        setStockWarningNotifications(data.data.stockWarningNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch inventory settings:', error);
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'সেটিংস লোড করতে ব্যর্থ' : 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isBangla]);

  // Fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/inventory-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockThreshold,
          lowStockAlerts,
          stockWarningNotifications,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla
            ? 'ইনভেন্টরি সেটিংস সংরক্ষিত হয়েছে'
            : 'Inventory settings saved successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error || (isBangla ? 'সেটিংস সংরক্ষণ ব্যর্থ' : 'Failed to save settings'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Category management handlers
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: isBangla ? 'নাম প্রয়োজন' : 'Name required',
        description: isBangla ? 'ক্যাটাগরির নাম দিন' : 'Please enter category name',
        variant: 'destructive',
      });
      return;
    }

    setIsCategorySaving(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessId || '',
        },
        body: JSON.stringify({
          name: categoryForm.name,
          nameBn: categoryForm.nameBn || categoryForm.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ক্যাটাগরি যোগ হয়েছে' : 'Category added successfully',
        });
        setIsAddCategoryOpen(false);
        setCategoryForm({ name: '', nameBn: '' });
        refetchCategories();
      } else {
        throw new Error(data.error?.message || 'Failed to add category');
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'ক্যাটাগরি যোগ ব্যর্থ' : 'Failed to add category',
        variant: 'destructive',
      });
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsCategorySaving(true);
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': businessId || '',
        },
        body: JSON.stringify({
          name: editingCategory.name,
          nameBn: editingCategory.nameBn || editingCategory.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ক্যাটাগরি আপডেট হয়েছে' : 'Category updated successfully',
        });
        setEditingCategory(null);
        refetchCategories();
      } else {
        throw new Error(data.error?.message || 'Failed to update category');
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'ক্যাটাগরি আপডেট ব্যর্থ' : 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsCategorySaving(true);
    try {
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: {
          'x-business-id': businessId || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ক্যাটাগরি মুছে ফেলা হয়েছে' : 'Category deleted successfully',
        });
        setDeletingCategory(null);
        refetchCategories();
      } else {
        throw new Error(data.error?.message || 'Failed to delete category');
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'ক্যাটাগরি মুছতে ব্যর্থ' : 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setIsCategorySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigateTo('settings')}
            className="rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {isBangla ? 'ইনভেন্টরি সেটিংস' : 'Inventory Settings'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBangla
                ? 'স্টক ও ইনভেন্টরি সংক্রান্ত সেটিংস'
                : 'Configure stock and inventory settings'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={fetchSettings}
          disabled={isLoading}
          className="rounded-lg"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 max-w-[800px]">
          {/* Low Stock Settings */}
            <SettingsCard>
              <SectionHeader
                icon={TrendingDown}
                title={isBangla ? 'লো স্টক থ্রেশহোল্ড' : 'Low Stock Threshold'}
                description={isBangla
                  ? 'যে পরিমাণের নিচে স্টক কম বলে গণ্য হবে'
                  : 'Stock quantity below this will be considered low'}
                iconColor="warning"
              />

              <div className="w-full sm:w-80 space-y-3">
                <SettingsInput
                  label={isBangla ? 'ডিফল্ট থ্রেশহোল্ড' : 'Default Threshold'}
                  type="number"
                  value={lowStockThreshold}
                  onChange={(v) => setLowStockThreshold(parseInt(v) || 0)}
                  placeholder="10"
                  suffix={isBangla ? 'পিস' : 'pcs'}
                />
                <p className="text-xs text-muted-foreground">
                  {isBangla
                    ? 'স্টক এই সংখ্যার নিচে নামলে লো স্টক এলার্ট দেখাবে'
                    : 'Alert will show when stock falls below this number'}
                </p>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border w-full sm:w-80">
                <p className="text-xs text-muted-foreground mb-2">
                  {isBangla ? 'উদাহরণ:' : 'Example:'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">
                        {isBangla ? 'পণ্য A' : 'Product A'}
                      </span>
                      <span className="text-sm font-medium text-warning flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        5 {isBangla ? 'পিস' : 'pcs'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-warning to-warning/70 rounded-full"
                        style={{ width: `${Math.min((5 / lowStockThreshold) * 50, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* Alert Settings */}
            <SettingsCard>
              <SectionHeader
                icon={Bell}
                title={isBangla ? 'এলার্ট সেটিংস' : 'Alert Settings'}
                description={isBangla
                  ? 'স্টক সংক্রান্ত নোটিফিকেশন সেটিংস'
                  : 'Configure stock-related notifications'}
                iconColor="primary"
              />

              <div className="space-y-3 w-full">
                <ToggleRow
                  icon={AlertTriangle}
                  title={isBangla ? 'লো স্টক এলার্ট' : 'Low Stock Alerts'}
                  description={isBangla
                    ? 'স্টক কম হলে এলার্ট দেখাবে'
                    : 'Show alerts when stock is low'}
                  checked={lowStockAlerts}
                  onCheckedChange={setLowStockAlerts}
                />

                <ToggleRow
                  icon={Bell}
                  title={isBangla ? 'স্টক ওয়ার্নিং নোটিফিকেশন' : 'Stock Warning Notifications'}
                  description={isBangla
                    ? 'ড্যাশবোর্ডে ওয়ার্নিং দেখাবে'
                    : 'Show warnings on dashboard'}
                  checked={stockWarningNotifications}
                  onCheckedChange={setStockWarningNotifications}
                />
              </div>
            </SettingsCard>

            {/* Inventory Features Info */}
            <SettingsCard>
              <SectionHeader
                icon={Shield}
                title={isBangla ? 'ইনভেন্টরি ফিচার' : 'Inventory Features'}
                description={isBangla
                  ? 'উপলব্ধ ইনভেন্টরি ব্যবস্থাপনা ফিচার'
                  : 'Available inventory management features'}
                iconColor="emerald"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {isBangla ? 'স্টক ট্র্যাকিং' : 'Stock Tracking'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? 'রিয়েল-টাইম স্টক আপডেট'
                      : 'Real-time stock updates'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">
                      {isBangla ? 'লো স্টক এলার্ট' : 'Low Stock Alert'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? 'স্বয়ংক্রিয় এলার্ট সিস্টেম'
                      : 'Automatic alert system'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-emerald" />
                    <span className="text-sm font-medium text-foreground">
                      {isBangla ? 'ডেড স্টক রিপোর্ট' : 'Dead Stock Report'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? 'অচল পণ্য শনাক্তকরণ'
                      : 'Identify non-moving items'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-indigo" />
                    <span className="text-sm font-medium text-foreground">
                      {isBangla ? 'কাস্টম থ্রেশহোল্ড' : 'Custom Thresholds'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? 'পণ্যভিত্তিক সেটিংস'
                      : 'Per-product settings'}
                  </p>
                </div>
              </div>
            </SettingsCard>

            {/* Category Management */}
            <SettingsCard>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader
                  icon={FolderOpen}
                  title={isBangla ? 'ক্যাটাগরি পরিচালনা' : 'Category Management'}
                  description={isBangla
                    ? 'পণ্য ক্যাটাগরি যোগ ও পরিচালনা করুন'
                    : 'Add and manage product categories'}
                  iconColor="indigo"
                />
              </div>

              {/* Add Category Button */}
              <div className="mb-4">
                <Button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="h-10 px-4 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isBangla ? 'নতুন ক্যাটাগরি' : 'Add Category'}
                </Button>
              </div>

              {/* Category List */}
              <div className="space-y-2 w-full">
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {category.nameBn || category.name}
                          </p>
                          {category.nameBn && (
                            <p className="text-xs text-muted-foreground">{category.name}</p>
                          )}
                        </div>
                        {category.itemCount > 0 && (
                          <Badge variant="secondary" size="sm">{category.itemCount}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingCategory({
                            id: category.id,
                            name: category.name,
                            nameBn: category.nameBn || '',
                          })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingCategory({ id: category.id, name: category.nameBn || category.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{isBangla ? 'কোনো ক্যাটাগরি নেই' : 'No categories yet'}</p>
                  </div>
                )}
              </div>
            </SettingsCard>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-11 px-8 rounded-xl font-medium text-sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isBangla ? 'সংরক্ষণ করুন' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isBangla ? 'নতুন ক্যাটাগরি' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {isBangla ? 'একটি নতুন পণ্য ক্যাটাগরি যোগ করুন' : 'Add a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isBangla ? 'নাম (ইংরেজি)' : 'Name (English)'}</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>{isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
              <Input
                value={categoryForm.nameBn}
                onChange={(e) => setCategoryForm({ ...categoryForm, nameBn: e.target.value })}
                placeholder="ক্যাটাগরির নাম"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleAddCategory} disabled={isCategorySaving}>
              {isCategorySaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBangla ? 'যোগ করুন' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isBangla ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category'}</DialogTitle>
            <DialogDescription>
              {isBangla ? 'ক্যাটাগরির তথ্য পরিবর্তন করুন' : 'Update category details'}
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isBangla ? 'নাম (ইংরেজি)' : 'Name (English)'}</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
                <Input
                  value={editingCategory.nameBn}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameBn: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleEditCategory} disabled={isCategorySaving}>
              {isCategorySaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBangla ? 'আপডেট' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBangla ? 'ক্যাটাগরি মুছবেন?' : 'Delete Category?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBangla
                ? `"${deletingCategory?.name}" ক্যাটাগরি মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।`
                : `Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCategorySaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBangla ? 'মুছুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
