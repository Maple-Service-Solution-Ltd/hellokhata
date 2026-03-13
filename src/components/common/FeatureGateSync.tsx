// Hello Khata OS - Feature Gate Sync Component
// হ্যালো খাতা - ফিচার গেট সিঙ্ক কম্পোনেন্ট
// Syncs the session plan to feature gate store

'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useFeatureGateStore } from '@/stores/featureGateStore';

/**
 * This component syncs the plan from sessionStore to featureGateStore.
 * It must be rendered inside Providers to ensure stores are available.
 */
export function FeatureGateSync() {
  const plan = useSessionStore((state) => state.plan);
  const setFeaturePlan = useFeatureGateStore((state) => state.setPlan);

  useEffect(() => {
    // Sync the plan whenever it changes
    setFeaturePlan(plan);
  }, [plan, setFeaturePlan]);

  // This component renders nothing
  return null;
}
