'use client'
import { SaveButton, SectionHeader, SettingsCard, SettingsInput } from '@/components/settings/SettingsComponent'
import { toast } from '@/hooks/use-toast'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { Building, Building2, MapPin, Phone } from 'lucide-react'
import React, { useState } from 'react'

const BusinessSettingsPage = () => {
    const [isSavingBusiness, setIsSavingBusiness] = useState(false);
      const { t, isBangla, changeLanguage } = useAppTranslation();

      // Business form state
      const [businessForm, setBusinessForm] = useState({
        name: '',
        phone: '',
        address: '',
      });
      const handleSaveBusiness = async () => {
    // if (!business?.id) return;
    setIsSavingBusiness(true);
  
  };
  return (
    <SettingsCard>
            <SectionHeader
              icon={Building2}
              title={isBangla ? 'ব্যবসার প্রোফাইল' : 'Business Profile'}
              description={isBangla ? 'আপনার ব্যবসার তথ্য পরিচালনা করুন' : 'Manage your business information'}
              iconColor="indigo"
            />

            <div className="w-full space-y-4">
              <SettingsInput
                label={isBangla ? 'ব্যবসার নাম' : 'Business Name'}
                icon={Building}
                value={businessForm.name}
                onChange={(v) => setBusinessForm({ ...businessForm, name: v })}
                placeholder={isBangla ? 'ব্যবসার নাম লিখুন' : 'Enter business name'}
              />
              <SettingsInput
                label={isBangla ? 'ফোন' : 'Phone'}
                icon={Phone}
                value={businessForm.phone}
                onChange={(v) => setBusinessForm({ ...businessForm, phone: v })}
                placeholder="01XXXXXXXXX"
              />
              <SettingsInput
                label={isBangla ? 'ঠিকানা' : 'Address'}
                icon={MapPin}
                value={businessForm.address}
                onChange={(v) => setBusinessForm({ ...businessForm, address: v })}
                placeholder={isBangla ? 'ঠিকানা লিখুন' : 'Enter address'}
              />
            </div>

            <SaveButton
              onClick={handleSaveBusiness} 
              isLoading={isSavingBusiness} 
              label={t('common.save')} 
            />
          </SettingsCard>
  )
}

export default BusinessSettingsPage
