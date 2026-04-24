'use client'
import { SectionHeader, SettingsCard } from '@/components/settings/SettingsComponent';
import { Badge, Button } from '@/components/ui/premium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { Crown, Lock, User, Users } from 'lucide-react';

const RoleManagementPage = () => {
      const { t, isBangla, changeLanguage } = useAppTranslation();
          const { user, business, plan, logout, updateUser, updateBusiness, setPlan } = useSessionStore();

    if (plan !== 'growth' && plan !== 'intelligence') {
          return (
            <SettingsCard>
              <SectionHeader
                icon={Lock}
                title={isBangla ? 'ভূমিকা ও অনুমতি' : 'Roles & Permissions'}
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
                    ? 'এই ফিচারটি Growth বা Intelligence প্ল্যানে উপলব্ধ। আপগ্রেড করে ভূমিকা ও অনুমতি নিয়ন্ত্রণ করুন।'
                    : 'This feature is available on Growth or Intelligence plan. Upgrade to manage roles and permissions.'}
                </p>
                <Button className="rounded-xl h-10 px-6" >
                  {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Plan'}
                </Button>
              </div>
            </SettingsCard>
          );
        }

        // Show actual roles & permissions UI for Pro users
        return (
          <SettingsCard>
            <SectionHeader
              icon={Lock}
              title={isBangla ? 'ভূমিকা ও অনুমতি' : 'Roles & Permissions'}
              description={isBangla ? 'ব্যবহারকারীর অনুমতি নিয়ন্ত্রণ করুন' : 'Control user permissions'}
              iconColor="primary"
            />

            <div className="space-y-4 w-full">
              {/* Owner Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'মালিক' : 'Owner'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'সম্পূর্ণ অ্যাক্সেস' : 'Full access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory', 'parties', 'expenses', 'reports', 'settings', 'staff'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি', parties: 'পার্টি', expenses: 'খরচ', reports: 'রিপোর্ট', settings: 'সেটিংস', staff: 'স্টাফ' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Manager Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-indigo" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'ম্যানেজার' : 'Manager'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'বেশিরভাগ অ্যাক্সেস' : 'Most access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory', 'parties', 'expenses', 'reports'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি', parties: 'পার্টি', expenses: 'খরচ', reports: 'রিপোর্ট' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Staff Role */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{isBangla ? 'স্টাফ' : 'Staff'}</span>
                      <p className="text-xs text-muted-foreground">{isBangla ? 'মৌলিক অ্যাক্সেস' : 'Basic access'}</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">{isBangla ? 'সক্রিয়' : 'Active'}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sales', 'inventory'].map((perm) => (
                    <Badge key={perm} variant="outline" size="sm" className="bg-primary/5">
                      {isBangla
                        ? { sales: 'বিক্রয়', inventory: 'ইনভেন্টরি' }[perm] || perm
                        : perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SettingsCard>
        );
}

export default RoleManagementPage
