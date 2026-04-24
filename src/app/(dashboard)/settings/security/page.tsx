'use client'
import { ActionRow, SectionHeader, SettingsCard } from '@/components/settings/SettingsComponent';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, Input } from '@/components/ui/premium';
import { toast } from '@/hooks/use-toast';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Eye, EyeOff, Key, Loader2, Shield } from 'lucide-react';
import React, { useState } from 'react'
import { Label } from 'recharts';

const SecurityPage = () => {
  const { t, isBangla, changeLanguage } = useAppTranslation();

  // Password change state
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false,
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
  
      // Password change handler
  const handleChangePassword = async () => {

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'সব ঘর পূরণ করুন' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: isBangla ? 'পাসওয়ার্ড ছোট' : 'Password too short',
        description: isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: isBangla ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match',
        description: isBangla ? 'নতুন পাসওয়ার্ড দুটি মিলছে না' : 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
  };

  return (
     <>
            <SettingsCard>
              <SectionHeader
                icon={Shield}
                title={isBangla ? 'নিরাপত্তা' : 'Security'}
                description={isBangla ? 'আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন' : 'Keep your account secure'}
                iconColor="warning"
              />

              <div className="space-y-3">
                <ActionRow
                  icon={Key}
                  title={isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  description={isBangla ? 'নিয়মিত পাসওয়ার্ড পরিবর্তন করুন' : 'Update your password regularly'}
                  action={isBangla ? 'পরিবর্তন' : 'Change'}
                  onAction={() => setIsPasswordDialogOpen(true)}
                />
              </div>
            </SettingsCard>

            {/* Password Change Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogContent className="sm:max-w-md min-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    {isBangla ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </DialogTitle>
                  <DialogDescription>
                    {isBangla ? 'আপনার পাসওয়ার্ড পরিবর্তন করুন' : 'Update your account password'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder={isBangla ? 'বর্তমান পাসওয়ার্ড' : 'Enter current password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder={isBangla ? 'নতুন পাসওয়ার্ড' : 'Enter new password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder={isBangla ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm new password'}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="rounded-xl"
                  >
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="rounded-xl"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    {isBangla ? 'পরিবর্তন করুন' : 'Change Password'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
  )
}

export default SecurityPage
