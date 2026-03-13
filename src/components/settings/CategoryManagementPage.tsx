// Hello Khata OS - Category Management Page
// Inventory item categories management

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileText,
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
import { Textarea } from '@/components/ui/textarea';

// Types
interface Category {
  id: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  itemCount: number;
  createdAt: string;
}

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
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', colorClasses[iconColor])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="whitespace-nowrap">{title}</span>
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 ml-11 whitespace-nowrap">
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
      'w-full rounded-2xl p-6 min-w-[400px]',
      'bg-card border border-border',
      className
    )}
  >
    {children}
  </div>
);

export default function CategoryManagementPage() {
  const { isBangla } = useAppTranslation();
  const { toast } = useToast();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', nameBn: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'ক্যাটাগরি লোড করতে ব্যর্থ' : 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isBangla]);

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', nameBn: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  // Handle add category
  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'ক্যাটাগরির নাম পূরণ করুন' : 'Please fill category name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          nameBn: formData.nameBn.trim() || null,
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories([...categories, { ...data.data, itemCount: 0 }]);
        resetForm();
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'নতুন ক্যাটাগরি যোগ হয়েছে' : 'Category added successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error?.message || (isBangla ? 'ক্যাটাগরি যোগ করতে ব্যর্থ' : 'Failed to add category'),
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

  // Handle edit category
  const handleEditCategory = async () => {
    if (!editingId || !formData.name.trim()) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'ক্যাটাগরির নাম পূরণ করুন' : 'Please fill category name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          nameBn: formData.nameBn.trim() || null,
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories(
          categories.map((cat) =>
            cat.id === editingId ? { ...cat, ...data.data } : cat
          )
        );
        resetForm();
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ক্যাটাগরি আপডেট হয়েছে' : 'Category updated successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error?.message || (isBangla ? 'ক্যাটাগরি আপডেট করতে ব্যর্থ' : 'Failed to update category'),
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

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category?.itemCount && category.itemCount > 0) {
      toast({
        title: isBangla ? 'মুছতে পারবেন না' : 'Cannot delete',
        description: isBangla
          ? `${category.itemCount}টি পণ্য এই ক্যাটাগরিতে আছে`
          : `${category.itemCount} items are in this category`,
        variant: 'destructive',
      });
      setDeleteConfirmId(null);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCategories(categories.filter((cat) => cat.id !== id));
        setDeleteConfirmId(null);
        toast({
          title: isBangla ? 'সফল হয়েছে' : 'Success',
          description: isBangla ? 'ক্যাটাগরি মুছে ফেলা হয়েছে' : 'Category deleted successfully',
        });
      } else {
        toast({
          title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
          description: data.error?.message || (isBangla ? 'ক্যাটাগরি মুছতে ব্যর্থ' : 'Failed to delete category'),
          variant: 'destructive',
        });
        setDeleteConfirmId(null);
      }
    } catch (error) {
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong',
        variant: 'destructive',
      });
      setDeleteConfirmId(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing
  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      nameBn: category.nameBn || '',
      description: category.description || '',
    });
    setEditingId(category.id);
    setIsAdding(false);
  };

  // Input component using shadcn/ui Input with full width
  const FormInput = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <div className="w-full space-y-2">
      <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full"
      />
    </div>
  );

  return (

      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary shrink-0" />
            <span className="whitespace-nowrap">
              {isBangla ? 'ইনভেন্টরি ক্যাটাগরি' : 'Inventory Categories'}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">
            {isBangla
              ? 'পণ্যের ক্যাটাগরি পরিচালনা করুন'
              : 'Manage item categories'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Add/Edit Form Dialog */}
          <Dialog open={isAdding || !!editingId} onOpenChange={(open) => !open && resetForm()}>
            <DialogContent className="sm:max-w-md min-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                  <span className="whitespace-nowrap">
                    {isAdding
                      ? (isBangla ? 'নতুন ক্যাটাগরি' : 'New Category')
                      : (isBangla ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category')}
                  </span>
                </DialogTitle>
                <DialogDescription className="whitespace-nowrap">
                  {isBangla
                    ? 'ক্যাটাগরির তথ্য পূরণ করুন'
                    : 'Fill in the category details'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <FormInput
                  label={isBangla ? 'ইংরেজিতে নাম' : 'Name (English)'}
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  placeholder="Category name"
                />
                <FormInput
                  label={isBangla ? 'বাংলায় নাম' : 'Name (Bangla)'}
                  value={formData.nameBn}
                  onChange={(v) => setFormData({ ...formData, nameBn: v })}
                  placeholder="ক্যাটাগরির নাম"
                />
                <div className="w-full space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {isBangla ? 'বিবরণ' : 'Description'}
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={isBangla ? 'ক্যাটাগরির বিবরণ (ঐচ্ছিক)' : 'Category description (optional)'}
                    className="min-h-[80px] w-full resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-xl"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  onClick={isAdding ? handleAddCategory : handleEditCategory}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isBangla ? 'সংরক্ষণ' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Categories List */}
          <SettingsCard>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <SectionHeader
                icon={FolderOpen}
                title={isBangla ? 'সকল ক্যাটাগরি' : 'All Categories'}
                description={isBangla ? `${categories.length}টি ক্যাটাগরি` : `${categories.length} categories`}
                iconColor="emerald"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={fetchCategories}
                  disabled={isLoading}
                  className="rounded-lg shrink-0"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
                {!isAdding && !editingId && (
                  <Button
                    onClick={() => {
                      setIsAdding(true);
                      setFormData({ name: '', nameBn: '', description: '' });
                    }}
                    className="rounded-xl flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{isBangla ? 'নতুন ক্যাটাগরি' : 'Add Category'}</span>
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2 w-full max-h-96 overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl w-full min-w-[300px]',
                      'bg-muted/30 border border-border',
                      'hover:bg-muted/50 transition-colors'
                    )}
                  >
                    {/* Category Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="h-5 w-5 text-emerald" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate whitespace-nowrap">
                            {isBangla && category.nameBn ? category.nameBn : category.name}
                          </span>
                          {category.nameBn && (
                            <Badge variant="outline" size="sm" className="flex-shrink-0">
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Package className="h-3 w-3 flex-shrink-0" />
                            {category.itemCount} {isBangla ? 'পণ্য' : 'items'}
                          </span>
                          {category.description && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              {category.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {deleteConfirmId === category.id ? (
                        <>
                          <span className="text-xs text-destructive mr-2 flex items-center gap-1 whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3" />
                            {isBangla ? 'নিশ্চিত?' : 'Sure?'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-muted-foreground"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="whitespace-nowrap">{isBangla ? 'কোনো ক্যাটাগরি নেই' : 'No categories found'}</p>
                    <p className="text-sm mt-1 whitespace-nowrap">
                      {isBangla ? 'নতুন ক্যাটাগরি যোগ করতে উপরের বাটনে ক্লিক করুন' : 'Click the button above to add a category'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </SettingsCard>
        </div>
      </div>
 
  );
}
