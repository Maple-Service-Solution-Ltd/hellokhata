// Hello Khata OS - Feature Gate Component
// হ্যালো খাতা - ফিচার গেট কম্পোনেন্ট

'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

type FeatureName = 'multiBranch' | 'creditControl' | 'auditTrail' | 'advancedPricing' | 'healthScore' | 'reconciliation' | 'staffPerformance' | 'deadStockAnalysis' | 'globalSearch' | 'aiAssistant' | 'dataExport' | 'advancedReports';

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
  showBlur?: boolean;
  showUpgradeCard?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showBlur = true,
  showUpgradeCard = true,
}: FeatureGateProps) {
  const router = useRouter();
  const { isUnlocked, config, requiredPlan } = useFeatureAccess(feature);
  const { t, isBangla } = useAppTranslation();
  
  const handleUpgrade = () => {
    // Navigate to settings with subscription hash
    router.push('/settings#subscription');
    // Scroll to subscription section after a short delay
    setTimeout(() => {
      const element = document.getElementById('subscription');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  if (isUnlocked) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showBlur && !showUpgradeCard) {
    return null;
  }
  
  return (
    <div className="relative w-full min-w-[400px]">
      {/* Blurred content */}
      <div className={cn(showBlur && 'filter blur-sm pointer-events-none select-none')}>
        {children}
      </div>
      
      {/* Upgrade overlay */}
      {showUpgradeCard && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-8 w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {isBangla ? 'প্রিমিয়াম ফিচার' : 'Premium Feature'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              {isBangla ? config.upgradeMessageBn : config.upgradeMessage}
            </p>
            <Button
              className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700"
              onClick={handleUpgrade}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isBangla ? 'আপগ্রেড করুন' : 'Upgrade Now'}
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              {isBangla ? `প্রয়োজনীয় প্ল্যান: ${requiredPlan}` : `Required plan: ${requiredPlan}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge component for locked features
export function ProBadge({ feature }: { feature: string }) {
  const { isUnlocked } = useFeatureAccess(feature as FeatureName);
  
  if (isUnlocked) return null;
  
  return (
    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-emerald-500 text-white rounded">
      PRO
    </span>
  );
}

// Feature status indicator
export function FeatureStatus({ feature }: { feature: FeatureName }) {
  const { isUnlocked } = useFeatureAccess(feature);
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      isUnlocked 
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    )}>
      {isUnlocked ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {feature === 'aiAssistant' ? 'AI' : 'Active'}
        </>
      ) : (
        <>
          <Lock className="w-3 h-3" />
          Locked
        </>
      )}
    </span>
  );
}

export default FeatureGate;
