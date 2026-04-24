'use client'
import { SectionHeader, SettingsCard } from "@/components/settings/SettingsComponent";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge, Button, Input } from "@/components/ui/premium";
import { toast } from "@/hooks/use-toast";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useSessionStore } from "@/stores";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Crown, Edit2, Loader2, Plus, Trash2, User, Users } from "lucide-react";
import { useState } from "react";

const StaffManagementPage = () => {
      const { t, isBangla, changeLanguage } = useAppTranslation();
      const { user, business, plan, logout, updateUser, updateBusiness, setPlan } = useSessionStore();
        const [activeSection, setActiveSection] = useState('profile');

     // Staff management state (for Pro users)
      const [staffList, setStaffList] = useState<Array<{ id: string; name: string; email: string; role: string; status: string }>>([]);
      const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
      const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', role: 'staff' });
      const [isAddingStaff, setIsAddingStaff] = useState(false);
      
        // Toggle staff status
  const toggleStaffStatus = (staffId: string) => {
    setStaffList(staffList.map(staff =>
      staff.id === staffId
        ? { ...staff, status: staff.status === 'active' ? 'inactive' : 'active' }
        : staff
    ));
  };

    // Delete staff
  const deleteStaff = (staffId: string) => {
    setStaffList(staffList.filter(staff => staff.id !== staffId));
    toast({
      title: isBangla ? 'সফল হয়েছে' : 'Success',
      description: isBangla ? 'স্টাফ মুছে ফেলা হয়েছে' : 'Staff member deleted',
    });
  };

   // Add staff handler
  const handleAddStaff = async () => {
    if (!newStaffForm.name || !newStaffForm.email) {
      toast({
        title: isBangla ? 'তথ্য অসম্পূর্ণ' : 'Incomplete data',
        description: isBangla ? 'নাম ও ইমেইল পূরণ করুন' : 'Please fill name and email',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingStaff(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStaff = {
        id: Date.now().toString(),
        ...newStaffForm,
        status: 'active',
      };
      setStaffList([...staffList, newStaff]);
      setNewStaffForm({ name: '', email: '', role: 'staff' });
      setIsAddStaffDialogOpen(false);
      toast({
        title: isBangla ? 'সফল হয়েছে' : 'Success',
        description: isBangla ? 'স্টাফ যোগ হয়েছে' : 'Staff member added successfully',
      });
    } finally {
      setIsAddingStaff(false);
    }
  };
      if (plan !== 'growth' && plan !== 'intelligence') {
          return (
            <SettingsCard>
              <SectionHeader
                icon={Users}
                title={isBangla ? 'স্টাফ পরিচালনা' : 'Staff Management'}
                iconColor="primary"
              />

              {/* Premium Feature Gate */}
              <div className="text-center py-10 w-full">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shrink-0">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isBangla ? 'প্রিমিয়াম ফিচার' : 'Premium Feature'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                  {isBangla
                    ? 'এই ফিচারটি Growth বা Intelligence প্ল্যানে উপলব্ধ। আপগ্রেড করে স্টাফ পরিচালনা করুন।'
                    : 'This feature is available on Growth or Intelligence plan. Upgrade to manage staff.'}
                </p>
                <Button className="rounded-xl h-10 px-6" onClick={() => setActiveSection('subscription')}>
                  {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Plan'}
                </Button>
              </div>
            </SettingsCard>
          );
        }

        // Show actual staff management UI for Growth/Intelligence users
        return (
          <>
            <SettingsCard>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <SectionHeader
                  icon={Users}
                  title={isBangla ? 'স্টাফ পরিচালনা' : 'Staff Management'}
                  description={isBangla ? `${staffList.length} জন স্টাফ` : `${staffList.length} staff members`}
                  iconColor="primary"
                />
                <Button
                  onClick={() => setIsAddStaffDialogOpen(true)}
                  className="rounded-xl flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isBangla ? 'স্টাফ যোগ করুন' : 'Add Staff'}
                </Button>
              </div>

              <div className="space-y-2 w-full">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-4 rounded-xl w-full bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{staff.name}</span>
                          <Badge
                            variant={staff.role === 'manager' ? 'indigo' : 'outline'}
                            size="sm"
                          >
                            {staff.role === 'manager' ? (isBangla ? 'ম্যানেজার' : 'Manager') : (isBangla ? 'স্টাফ' : 'Staff')}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{staff.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={staff.status === 'active' ? 'success' : 'outline'}
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => toggleStaffStatus(staff.id)}
                      >
                        {staff.status === 'active' ? (isBangla ? 'সক্রিয়' : 'Active') : (isBangla ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => deleteStaff(staff.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>

            {/* Add Staff Dialog */}
            <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {isBangla ? 'নতুন স্টাফ যোগ করুন' : 'Add New Staff'}
                  </DialogTitle>
                  <DialogDescription>
                    {isBangla ? 'একজন নতুন স্টাফ সদস্য যোগ করুন' : 'Add a new staff member to your team'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'নাম' : 'Name'}
                    </Label>
                    <Input
                      value={newStaffForm.name}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                      placeholder={isBangla ? 'স্টাফের নাম' : 'Staff name'}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'ইমেইল' : 'Email'}
                    </Label>
                    <Input
                      type="email"
                      value={newStaffForm.email}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                      placeholder="email@example.com"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {isBangla ? 'ভূমিকা' : 'Role'}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={newStaffForm.role === 'staff' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewStaffForm({ ...newStaffForm, role: 'staff' })}
                        className="flex-1 rounded-xl"
                      >
                        {isBangla ? 'স্টাফ' : 'Staff'}
                      </Button>
                      <Button
                        variant={newStaffForm.role === 'manager' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewStaffForm({ ...newStaffForm, role: 'manager' })}
                        className="flex-1 rounded-xl"
                      >
                        {isBangla ? 'ম্যানেজার' : 'Manager'}
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddStaffDialogOpen(false);
                      setNewStaffForm({ name: '', email: '', role: 'staff' });
                    }}
                    className="rounded-xl"
                  >
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    disabled={isAddingStaff}
                    className="rounded-xl"
                  >
                    {isAddingStaff ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isBangla ? 'যোগ করুন' : 'Add Staff'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        );

}

export default StaffManagementPage