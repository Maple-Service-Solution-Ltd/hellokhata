// Hello Khata OS - Health Score Details Page
// হ্যালো খাতা - হেলথ স্কোর বিস্তারিত পেজ

'use client';

import { FeatureGate, PageHeader } from '@/components/common';
import HealthScoreDetailsPageContent from '@/components/reports/HealthScoreDetailsPage';

export default function HealthScorePage() {
  return (
    <FeatureGate feature="healthScore">

        <HealthScoreDetailsPageContent />

    </FeatureGate>
  );
}
