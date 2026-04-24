'use client'
import { SectionHeader, SettingsCard,SettingsInput ,SaveButton} from '@/components/settings/SettingsComponent'
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Mail, Phone, User } from 'lucide-react'
import { useState } from 'react';

  
const ProfilePage = () => {
  const { t, isBangla, changeLanguage } = useAppTranslation();
    const [profileForm, setProfileForm] = useState({
      name: '',
      phone: '',
      email: '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);


     // Save handlers
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
  };
  return (
    <SettingsCard>
            <SectionHeader
              icon={User}
              title={isBangla ? 'ব্যক্তিগত প্রোফাইল' : 'Personal Profile'}
              description={isBangla ? 'আপনার ব্যক্তিগত তথ্য পরিচালনা করুন' : 'Manage your personal information'}
              iconColor="primary"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'নাম' : 'Name'}
                icon={User}
                value={profileForm.name}
                onChange={(v) => setProfileForm({ ...profileForm, name: v })}
                placeholder={isBangla ? 'আপনার নাম লিখুন' : 'Enter your name'}
              />
              <SettingsInput
                label={isBangla ? 'ফোন' : 'Phone'}
                icon={Phone}
                value={profileForm.phone}
                onChange={(v) => setProfileForm({ ...profileForm, phone: v })}
                placeholder="01XXXXXXXXX"
              />
              <SettingsInput
                label={isBangla ? 'ইমেইল' : 'Email'}
                icon={Mail}
                type="email"
                value={profileForm.email}
                onChange={(v) => setProfileForm({ ...profileForm, email: v })}
                placeholder="example@email.com"
              />
            </div>

            <SaveButton
              onClick={handleSaveProfile} 
              isLoading={isSavingProfile} 
              label={t('common.save')} 
            />
          </SettingsCard>
  )
}

export default ProfilePage
