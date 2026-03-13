// Hello Khata OS - Branch Management Page Component
// হ্যালো খাতা - ব্রাঞ্চ ম্যানেজমেন্ট পেজ কম্পোনেন্ট

'use client';

import { useState, useEffect } from 'react';
import { PageHeader, ProBadge } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useBranches } from '@/hooks/queries';
import { useBranchStore } from '@/stores/branchStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useNavigation } from '@/stores/uiStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Crown,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Branch } from '@/types';

export default function BranchManagementPage() {
  const { isBangla } = useAppTranslation();
  const { data: branches, isLoading, refetch } = useBranches();
  const { setCurrentBranch, currentBranchId } = useBranchStore();
  const { plan, features, refreshSession } = useSessionStore();
  const { navigateTo } = useNavigation();
  const { toast } = useToast();

  // Refresh session on mount to get latest plan data
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    type: 'retail',
    address: '',
    phone: '',
    openingCash: '',
  });

  // Check if user has multi-branch feature
  const hasMultiBranch = features.multiBranch;
  
  // Branch limits based on plan
  const getBranchLimit = () => {
    switch (plan) {
      case 'intelligence': return 'unlimited';
      case 'growth': return 3;
      default: return 1;
    }
  };
  
  const branchLimit = getBranchLimit();
  const currentBranchCount = branches?.length || 0;
  
  // Check if we're still loading branches (to prevent false positives on limit check)
  const isBranchesLoading = isLoading || branches === undefined;
  
  // canAddMore is false if loading (we don't know the count yet) or if limit is reached
  const canAddMore = !isBranchesLoading && (branchLimit === 'unlimited' || currentBranchCount < branchLimit);

  const resetForm = () => {
    setFormData({
      name: '',
      nameBn: '',
      type: 'retail',
      address: '',
      phone: '',
      openingCash: '',
    });
    setSelectedBranch(null);
  };

  const handleAddBranch = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Missing Information',
        description: isBangla ? 'শাখার নাম দিন' : 'Branch name is required',
        variant: 'destructive',
      });
      return;
    }

    // Double check plan limits before API call
    if (!isBranchesLoading && branchLimit !== 'unlimited' && currentBranchCount >= branchLimit) {
      toast({
        title: isBangla ? 'সীমা পূর্ণ' : 'Limit Reached',
        description: isBangla 
          ? `আপনার ${plan} প্ল্যানে সর্বোচ্চ ${branchLimit}টি শাখা আছে।`
          : `Your ${plan} plan allows maximum ${branchLimit} branches.`,
        variant: 'destructive',
      });
      return;
    }
    
    // If branches are loading, show a message and wait
    if (isBranchesLoading) {
      toast({
        title: isBangla ? 'লোড হচ্ছে' : 'Loading',
        description: isBangla ? 'শাখার তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন' : 'Branch data is loading, please wait',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<Branch>('/branches', {
        name: formData.name.trim(),
        nameBn: formData.nameBn.trim(),
        type: formData.type,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        openingCash: formData.openingCash ? parseFloat(formData.openingCash) : 0,
      });

      // Show success message
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'নতুন শাখা যোগ হয়েছে' : 'Branch added successfully',
      });
      
      // Close dialog and reset form
      setIsAddDialogOpen(false);
      resetForm();
      
      // Refresh branch list
      await refetch();
    } catch (error: any) {
      // Handle ApiClientError with detailed message
      const errorMessage = error?.message || (error instanceof Error ? error.message : (isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong'));
      const errorDetails = error?.details;
      
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: errorDetails 
          ? Object.values(errorDetails).flat().join(', ')
          : errorMessage,
        variant: 'destructive',
      });
      // Refresh branches to ensure UI is in sync
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    if (!selectedBranch || !formData.name.trim()) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Missing Information',
        description: isBangla ? 'শাখার নাম দিন' : 'Branch name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch<Branch>(`/branches/${selectedBranch.id}`, {
        name: formData.name.trim(),
        nameBn: formData.nameBn.trim(),
        type: formData.type,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
      });

      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'শাখা আপডেট হয়েছে' : 'Branch updated successfully',
      });
      setIsEditDialogOpen(false);
      resetForm();
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.message || (error instanceof Error ? error.message : (isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong'));
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;

    setIsSubmitting(true);
    try {
      const response = await api.delete<{ id: string; message?: string }>(`/branches/${selectedBranch.id}`);

      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: response.data?.message || (isBangla ? 'শাখা মুছে ফেলা হয়েছে' : 'Branch deleted successfully'),
      });
      setIsDeleteDialogOpen(false);
      resetForm();
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.message || (error instanceof Error ? error.message : (isBangla ? 'কিছু ভুল হয়েছে' : 'Something went wrong'));
      toast({
        title: isBangla ? 'সমস্যা হয়েছে' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      nameBn: branch.nameBn || '',
      type: branch.type || 'retail',
      address: branch.address || '',
      phone: branch.phone || '',
      openingCash: branch.openingCash?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  // Show upgrade message if user doesn't have multi-branch feature
  if (!hasMultiBranch) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isBangla ? 'শাখা পরিচালনা' : 'Branch Management'}
          subtitle={isBangla ? 'আপনার সকল শাখা পরিচালনা করুন' : 'Manage all your branches'}
          icon={Building2}
        >
          <Button variant="outline" onClick={() => navigateTo('settings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isBangla ? 'ফিরে যান' : 'Go Back'}
          </Button>
        </PageHeader>

        {/* Premium Feature Gate */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {isBangla ? 'প্রিমিয়াম ফিচার' : 'Premium Feature'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                {isBangla
                  ? 'মাল্টি-ব্রাঞ্চ সাপোর্ট Growth বা Intelligence প্ল্যানে উপলব্ধ। আপগ্রেড করে একাধিক শাখা পরিচালনা করুন।'
                  : 'Multi-branch support is available on Growth or Intelligence plan. Upgrade to manage multiple branches.'}
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700"
                onClick={() => navigateTo('settings')}
              >
                <Crown className="w-4 h-4 mr-2" />
                {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isBangla ? 'শাখা পরিচালনা' : 'Branch Management'}
        subtitle={isBangla 
          ? `আপনার সকল শাখা পরিচালনা করুন (${currentBranchCount}/${branchLimit === 'unlimited' ? '∞' : branchLimit})`
          : `Manage all your branches (${currentBranchCount}/${branchLimit === 'unlimited' ? '∞' : branchLimit})`
        }
        icon={Building2}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateTo('settings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isBangla ? 'ফিরে যান' : 'Go Back'}
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            disabled={!canAddMore}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isBangla ? 'নতুন শাখা' : 'Add Branch'}
          </Button>
        </div>
      </PageHeader>

      {/* Limit Warning */}
      {!canAddMore && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {isBangla ? 'শাখার সীমা পূর্ণ' : 'Branch Limit Reached'}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300">
              {isBangla 
                ? `আপনার ${plan} প্ল্যানে সর্বোচ্চ ${branchLimit}টি শাখা আছে। আরো শাখা যোগ করতে আপগ্রেড করুন।`
                : `Your ${plan} plan allows maximum ${branchLimit} branches. Upgrade to add more.`
              }
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateTo('settings')}>
            <Crown className="w-4 h-4 mr-2" />
            {isBangla ? 'আপগ্রেড' : 'Upgrade'}
          </Button>
        </div>
      )}

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches?.map((branch) => (
          <BranchCard 
            key={branch.id} 
            branch={branch} 
            onEdit={() => openEditDialog(branch)}
            onDelete={() => openDeleteDialog(branch)}
          />
        ))}
      </div>

      {/* Empty State */}
      {branches?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isBangla ? 'কোনো শাখা নেই' : 'No branches found'}
          </p>
          <Button 
            className="mt-4" 
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isBangla ? 'প্রথম শাখা যোগ করুন' : 'Add Your First Branch'}
          </Button>
        </div>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              {isBangla ? 'নতুন শাখা যোগ করুন' : 'Add New Branch'}
            </DialogTitle>
            <DialogDescription>
              {isBangla ? 'আপনার ব্যবসার নতুন শাখার তথ্য দিন' : 'Enter details for your new branch'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isBangla ? 'শাখার নাম *' : 'Branch Name *'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isBangla ? 'শাখার নাম লিখুন' : 'Enter branch name'}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
              <Input
                value={formData.nameBn}
                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                placeholder={isBangla ? 'বাংলায় নাম' : 'Name in Bengali'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ধরন' : 'Type'}</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">{isBangla ? 'প্রধান শাখা' : 'Main Branch'}</SelectItem>
                  <SelectItem value="retail">{isBangla ? 'রিটেইল' : 'Retail'}</SelectItem>
                  <SelectItem value="warehouse">{isBangla ? 'গোডাউন' : 'Warehouse'}</SelectItem>
                  <SelectItem value="wholesale">{isBangla ? 'হোলসেল' : 'Wholesale'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ঠিকানা' : 'Address'}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ফোন' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'প্রারম্ভিক নগদ' : 'Opening Cash'}</Label>
              <Input
                type="number"
                value={formData.openingCash}
                onChange={(e) => setFormData({ ...formData, openingCash: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button 
              type="button"
              onClick={handleAddBranch} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isBangla ? 'যোগ করুন' : 'Add Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              {isBangla ? 'শাখা সম্পাদনা' : 'Edit Branch'}
            </DialogTitle>
            <DialogDescription>
              {isBangla ? 'শাখার তথ্য আপডেট করুন' : 'Update branch details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isBangla ? 'শাখার নাম *' : 'Branch Name *'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isBangla ? 'শাখার নাম লিখুন' : 'Enter branch name'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'নাম (বাংলা)' : 'Name (Bengali)'}</Label>
              <Input
                value={formData.nameBn}
                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                placeholder={isBangla ? 'বাংলায় নাম' : 'Name in Bengali'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ধরন' : 'Type'}</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">{isBangla ? 'প্রধান শাখা' : 'Main Branch'}</SelectItem>
                  <SelectItem value="retail">{isBangla ? 'রিটেইল' : 'Retail'}</SelectItem>
                  <SelectItem value="warehouse">{isBangla ? 'গোডাউন' : 'Warehouse'}</SelectItem>
                  <SelectItem value="wholesale">{isBangla ? 'হোলসেল' : 'Wholesale'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ঠিকানা' : 'Address'}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              />
            </div>

            <div className="space-y-2">
              <Label>{isBangla ? 'ফোন' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleEditBranch} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isBangla ? 'আপডেট করুন' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {isBangla ? 'শাখা মুছে ফেলুন' : 'Delete Branch'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBranch?.isMain
                ? (isBangla ? 'প্রধান শাখা মুছে ফেলা যাবে না।' : 'Cannot delete the main branch.')
                : (isBangla 
                    ? `আপনি কি "${selectedBranch?.name}" শাখা মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`
                    : `Are you sure you want to delete "${selectedBranch?.name}" branch? This action cannot be undone.`
                  )
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isBangla ? 'বাতিল' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBranch}
              disabled={isSubmitting || selectedBranch?.isMain}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isBangla ? 'মুছে ফেলুন' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Branch Card Component
function BranchCard({ 
  branch, 
  onEdit, 
  onDelete 
}: { 
  branch: Branch; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { isBangla } = useAppTranslation();
  const { setCurrentBranch, currentBranchId } = useBranchStore();
  const isActive = currentBranchId === branch.id;

  return (
    <Card className={cn(
      'transition-all',
      isActive && 'ring-2 ring-emerald-500 border-emerald-200',
      !branch.isActive && 'opacity-60'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{branch.nameBn || branch.name}</CardTitle>
            {branch.isMain && (
              <Badge variant="secondary" className="text-xs">
                {isBangla ? 'প্রধান' : 'Main'}
              </Badge>
            )}
            {!branch.isActive && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {isBangla ? 'নিষ্ক্রিয়' : 'Inactive'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            {!branch.isMain && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Branch Info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{branch.address || (isBangla ? 'ঠিকানা নেই' : 'No address')}</span>
          </div>
          {branch.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4" />
              <span>{branch.phone}</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center">
              <p className="text-xs text-gray-500">{isBangla ? 'ক্যাশ' : 'Cash'}</p>
              <p className="font-bold">৳{(branch.currentCash || 0).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center">
              <p className="text-xs text-gray-500">{isBangla ? 'ধরন' : 'Type'}</p>
              <p className="font-medium capitalize">{branch.type}</p>
            </div>
          </div>

          {/* Actions */}
          <Button
            variant={isActive ? 'default' : 'outline'}
            className={cn('w-full mt-2', isActive && 'bg-emerald-600 hover:bg-emerald-700')}
            onClick={() => setCurrentBranch(branch.id)}
            disabled={!branch.isActive}
          >
            {isActive 
              ? (isBangla ? 'বর্তমান শাখা' : 'Current Branch')
              : (isBangla ? 'নির্বাচন করুন' : 'Select Branch')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
