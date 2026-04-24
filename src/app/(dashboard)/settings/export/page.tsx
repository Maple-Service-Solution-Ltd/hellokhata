'use client'
import { SectionHeader, SettingsCard } from '@/components/settings/SettingsComponent'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/premium'
import { useAppTranslation } from '@/hooks/useAppTranslation'
import { Download } from 'lucide-react'

const ExportPage = () => {
     const { t, isBangla, changeLanguage } = useAppTranslation();
  return (
    <SettingsCard>
            <SectionHeader
              icon={Download}
              title={isBangla ? 'এক্সপোর্ট' : 'Export Data'}
              description={isBangla ? 'আপনার ডেটা এক্সপোর্ট করুন' : 'Export your data'}
              iconColor="indigo"
            />

            <div className="space-y-2">
              {[
                { label: isBangla ? 'সব ডেটা' : 'All Data', format: 'JSON' },
                { label: isBangla ? 'পণ্য তালিকা' : 'Products List', format: 'CSV' },
                { label: isBangla ? 'বিক্রয় রিপোর্ট' : 'Sales Report', format: 'CSV' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <Badge variant="outline" size="sm">{item.format}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-xs">
                    {isBangla ? 'ডাউনলোড' : 'Download'}
                  </Button>
                </div>
              ))}
            </div>
          </SettingsCard>
  )
}

export default ExportPage
