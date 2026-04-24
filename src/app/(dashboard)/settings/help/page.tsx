'use client'
import { SectionHeader, SettingsCard } from '@/components/settings/SettingsComponent'
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { ChevronRight, HelpCircle } from 'lucide-react'
import React from 'react'

const HelpPage = () => {
     const { t, isBangla, changeLanguage } = useAppTranslation();
  return (
      <SettingsCard>
            <SectionHeader
              icon={HelpCircle}
              title={isBangla ? 'সাহায্য ও সাপোর্ট' : 'Help & Support'}
              iconColor="primary"
            />

            <div className="space-y-2">
              {[
                { label: isBangla ? 'ডকুমেন্টেশন' : 'Documentation', desc: isBangla ? 'বিস্তারিত গাইড' : 'Detailed guides' },
                { label: isBangla ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials', desc: isBangla ? 'শেখার ভিডিও' : 'Learn with videos' },
                { label: isBangla ? 'যোগাযোগ' : 'Contact Support', desc: isBangla ? 'সাপোর্ট টিম' : 'Support team' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </SettingsCard>
  )
}

export default HelpPage
