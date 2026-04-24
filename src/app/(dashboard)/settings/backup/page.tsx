'use client'
import { ActionRow, SectionHeader, SettingsCard } from "@/components/settings/SettingsComponent"
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { Database } from "lucide-react"

const BackupPage = () => {
     const { t, isBangla, changeLanguage } = useAppTranslation();
  return (
     <SettingsCard>
            <SectionHeader
              icon={Database}
              title={isBangla ? 'ব্যাকআপ' : 'Backup'}
              description={isBangla ? 'আপনার ডেটা নিরাপদ রাখুন' : 'Keep your data safe'}
              iconColor="emerald"
            />

            <div className="space-y-3">
              <ActionRow
                icon={Database}
                title={isBangla ? 'স্বয়ংক্রিয় ব্যাকআপ' : 'Automatic Backup'}
                description={isBangla ? 'প্রতিদিন স্বয়ংক্রিয় ব্যাকআপ নেওয়া হবে' : 'Daily automatic backup'}
                action={isBangla ? 'এখন ব্যাকআপ' : 'Backup Now'}
              />
            </div>
          </SettingsCard>
  )
}

export default BackupPage
