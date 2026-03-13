// Hello Khata OS - Health Score Card Component
// হ্যালো খাতা - হেলথ স্কোর কার্ড কম্পোনেন্ট

'use client';

import { useHealthScore } from '@/hooks/queries';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  BarChart3,
  Sparkles,
  ChevronRight,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FeatureGate } from './FeatureGate';

interface HealthScoreCardProps {
  compact?: boolean;
}

// Circular progress component
function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8,
  grade 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  grade: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-500';
      case 'B': return 'text-green-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getBgColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'stroke-emerald-100 dark:stroke-emerald-900';
      case 'B': return 'stroke-green-100 dark:stroke-green-900';
      case 'C': return 'stroke-yellow-100 dark:stroke-yellow-900';
      case 'D': return 'stroke-orange-100 dark:stroke-orange-900';
      case 'F': return 'stroke-red-100 dark:stroke-red-900';
      default: return 'stroke-gray-100 dark:stroke-gray-800';
    }
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className={getBgColor(grade)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('transition-all duration-500', getColor(grade))}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', getColor(grade))}>{value}</span>
        <span className={cn('text-lg font-bold', getColor(grade))}>Grade {grade}</span>
      </div>
    </div>
  );
}

// Component score item
function ComponentScoreItem({ 
  label, 
  labelBn, 
  score, 
  trend, 
  icon: Icon, 
  weight 
}: { 
  label: string; 
  labelBn: string;
  score: number; 
  trend: string;
  icon: React.ElementType;
  weight: number;
}) {
  const { isBangla } = useAppTranslation();
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{isBangla ? labelBn : label}</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{score}</span>
            {getTrendIcon()}
          </div>
        </div>
        <Progress value={score} className="h-2" />
      </div>
    </div>
  );
}

export function HealthScoreCard({ compact = false }: HealthScoreCardProps) {
  const { t, isBangla } = useAppTranslation();
  const { data: healthScore, isLoading } = useHealthScore();
  const featureAccess = useFeatureAccess('healthScore');

  if (!featureAccess.isUnlocked) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {isBangla ? 'বিজনেস হেলথ স্কোর' : 'Business Health Score'}
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">PRO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-emerald-100 dark:from-purple-900 dark:to-emerald-900 flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {isBangla ? 'প্রো প্ল্যানে এই ফিচারটি পান' : 'Get this feature with Pro plan'}
            </p>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
              <Link href="/settings#subscription">
                <Sparkles className="w-4 h-4 mr-1" />
                {isBangla ? 'আপগ্রেড করুন' : 'Upgrade'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !healthScore) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {isBangla ? 'বিজনেস হেলথ স্কোর' : 'Business Health Score'}
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <div className="flex items-center justify-center py-8">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Link href="/reports/health-score">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    className="stroke-gray-200 dark:stroke-gray-700"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                  <circle
                    className={cn(
                      'transition-all duration-500',
                      healthScore.grade === 'A' ? 'stroke-emerald-500' :
                      healthScore.grade === 'B' ? 'stroke-green-500' :
                      healthScore.grade === 'C' ? 'stroke-yellow-500' :
                      healthScore.grade === 'D' ? 'stroke-orange-500' : 'stroke-red-500'
                    )}
                    strokeWidth="4"
                    strokeDasharray={176}
                    strokeDashoffset={176 - (healthScore.overallScore / 100) * 176}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{healthScore.overallScore}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isBangla ? 'বিজনেস স্বাস্থ্য' : 'Business Health'}
                  </span>
                  <Badge className={cn(
                    'text-xs',
                    healthScore.trend === 'improving' ? 'bg-emerald-100 text-emerald-700' :
                    healthScore.trend === 'declining' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  )}>
                    {healthScore.trend === 'improving' ? (isBangla ? 'উন্নতি' : 'Improving') :
                     healthScore.trend === 'declining' ? (isBangla ? 'অবনতি' : 'Declining') : 
                     (isBangla ? 'স্থির' : 'Stable')}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isBangla ? `গ্রেড: ${healthScore.grade}` : `Grade: ${healthScore.grade}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {isBangla ? 'বিজনেস হেলথ স্কোর' : 'Business Health Score'}
          </CardTitle>
          <Badge className={cn(
            healthScore.trend === 'improving' ? 'bg-emerald-100 text-emerald-700' :
            healthScore.trend === 'declining' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          )}>
            {healthScore.trend === 'improving' ? (isBangla ? '↑ উন্নতি' : '↑ Improving') :
             healthScore.trend === 'declining' ? (isBangla ? '↓ অবনতি' : '↓ Declining') : 
             (isBangla ? '→ স্থির' : '→ Stable')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <CircularProgress 
              value={healthScore.overallScore} 
              grade={healthScore.grade}
              size={140}
              strokeWidth={10}
            />
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/reports/health-score">
                {isBangla ? 'বিস্তারিত দেখুন' : 'View Details'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          
          {/* Component Scores */}
          <div className="flex-1 space-y-3">
            <ComponentScoreItem
              label="Profit Trend"
              labelBn="লাভের প্রবণতা"
              score={healthScore.components.profitTrend.score}
              trend={healthScore.components.profitTrend.trend}
              icon={TrendingUp}
              weight={healthScore.components.profitTrend.weight}
            />
            <ComponentScoreItem
              label="Credit Risk"
              labelBn="ক্রেডিট ঝুঁকি"
              score={healthScore.components.creditRisk.score}
              trend={healthScore.components.creditRisk.trend}
              icon={AlertTriangle}
              weight={healthScore.components.creditRisk.weight}
            />
            <ComponentScoreItem
              label="Dead Stock"
              labelBn="অচল মজুদ"
              score={healthScore.components.deadStock.score}
              trend={healthScore.components.deadStock.trend}
              icon={Package}
              weight={healthScore.components.deadStock.weight}
            />
            <ComponentScoreItem
              label="Cash Stability"
              labelBn="নগদ স্থিতিশীলতা"
              score={healthScore.components.cashStability.score}
              trend={healthScore.components.cashStability.trend}
              icon={DollarSign}
              weight={healthScore.components.cashStability.weight}
            />
            <ComponentScoreItem
              label="Sales Consistency"
              labelBn="বিক্রির ধারাবাহিকতা"
              score={healthScore.components.salesConsistency.score}
              trend={healthScore.components.salesConsistency.trend}
              icon={BarChart3}
              weight={healthScore.components.salesConsistency.weight}
            />
          </div>
        </div>
        
        {/* Top Suggestion */}
        {healthScore.suggestions.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {isBangla ? healthScore.suggestions[0].titleBn : healthScore.suggestions[0].title}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {isBangla ? healthScore.suggestions[0].descriptionBn : healthScore.suggestions[0].description}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthScoreCard;
