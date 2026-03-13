// Hello Khata OS - Categories Management Modal
// Manage item categories with add/edit/delete functionality

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, Badge, Divider } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tags,
  Plus,
  Edit,
  Trash2,
  Package,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { isBangla } = useAppTranslation();
  const { business } = useSessionStore();
  
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameBn, setEditNameBn] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameBn, setNewNameBn] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error(isBangla ? 'ক্যাটাগরির নাম প্রয়োজন' : 'Category name is required');
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: newName,
        nameBn: newNameBn || undefined,
      });
      
      toast.success(isBangla ? 'ক্যাটাগরি তৈরি হয়েছে' : 'Category created');
      setNewName('');
      setNewNameBn('');
      setShowAddForm(false);
    } catch (error) {
      toast.error(isBangla ? 'ক্যাটাগরি তৈরি ব্যর্থ' : 'Failed to create category');
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditNameBn(category.nameBn || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateCategory.mutateAsync({
        id: editingId,
        name: editName,
        nameBn: editNameBn || undefined,
      });
      
      toast.success(isBangla ? 'ক্যাটাগরি আপডেট হয়েছে' : 'Category updated');
      setEditingId(null);
    } catch (error) {
      toast.error(isBangla ? 'আপডেট ব্যর্থ' : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBangla ? 'এই ক্যাটাগরি মুছে ফেলতে চান?' : 'Delete this category?')) return;

    try {
      await deleteCategory.mutateAsync(id);
      toast.success(isBangla ? 'ক্যাটাগরি মুছে ফেলা হয়েছে' : 'Category deleted');
    } catch (error) {
      toast.error(isBangla ? 'মুছে ফেলা ব্যর্থ' : 'Failed to delete');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            {isBangla ? 'ক্যাটাগরি ব্যবস্থাপনা' : 'Manage Categories'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Add New Form */}
          {showAddForm ? (
            <Card variant="elevated" padding="default" className="border-primary/50">
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">
                    {isBangla ? 'নাম (ইংরেজি)' : 'Name (English)'} *
                  </Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Electronics"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">
                    {isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}
                  </Label>
                  <Input
                    value={newNameBn}
                    onChange={(e) => setNewNameBn(e.target.value)}
                    placeholder="ইলেকট্রনিক্স"
                    className="h-9"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewName('');
                      setNewNameBn('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        {isBangla ? 'সংরক্ষণ' : 'Save'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isBangla ? 'নতুন ক্যাটাগরি যোগ করুন' : 'Add New Category'}
            </Button>
          )}

          {/* Categories List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2 bg-muted/50 text-sm font-medium">
              {isBangla ? `মোট ক্যাটাগরি: ${categories.length}টি` : `${categories.length} categories`}
            </div>
            <Divider />
            
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Tags className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">{isBangla ? 'কোনো ক্যাটাগরি নেই' : 'No categories'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="divide-y divide-border">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                      {editingId === category.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                            className="h-8"
                          />
                          <Input
                            value={editNameBn}
                            onChange={(e) => setEditNameBn(e.target.value)}
                            placeholder="বাংলা নাম"
                            className="h-8"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Tags className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{category.name}</p>
                            {category.nameBn && (
                              <p className="text-xs text-muted-foreground">{category.nameBn}</p>
                            )}
                          </div>
                          {category.itemCount > 0 && (
                            <Badge variant="indigo" size="sm">
                              {category.itemCount} {isBangla ? 'পণ্য' : 'items'}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {editingId === category.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={handleSaveEdit}
                              disabled={updateCategory.isPending}
                            >
                              {updateCategory.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-emerald" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(category.id)}
                              disabled={deleteCategory.isPending || category.itemCount > 0}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              {isBangla ? 'বন্ধ করুন' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
