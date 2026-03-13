// Hello Khata OS - Health Score Details Page Content
// হ্যালো খাতা - হেলথ স্কোর বিস্তারিত পেজ কন্টেন্ট

'use client';

import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHealthScore, useRecalculateHealthScore } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function HealthScoreDetailsPageContent() {
  const { isBangla } = useAppTranslation();
  const { data: healthScore, isLoading } = useHealthScore();
  const recalculate = useRecalculateHealthScore();

  if (isLoading || !healthScore) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isBangla ? 'বিজনেস হেলথ স্কোর' : 'Business Health Score'}
        subtitle={isBangla ? 'আপনার ব্যবসার সামগ্রিক স্বাস্থ্য বিশ্লেষণ' : 'Overall health analysis of your business'}
        icon={Sparkles}
      >
        <Button
          variant="outline"
          onClick={() => recalculate.mutate()}
          disabled={recalculate.isPending}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', recalculate.isPending && 'animate-spin')} />
          {isBangla ? 'পুনরায় গণনা' : 'Recalculate'}
        </Button>
      </PageHeader>

      {/* Overall Score */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                  r="88"
                  cx="96"
                  cy="96"
                />
                <circle
                  className={cn(
                    'transition-all duration-1000',
                    healthScore.grade === 'A' ? 'stroke-emerald-500' :
                    healthScore.grade === 'B' ? 'stroke-green-500' :
                    healthScore.grade === 'C' ? 'stroke-yellow-500' :
                    healthScore.grade === 'D' ? 'stroke-orange-500' : 'stroke-red-500'
                  )}
                  strokeWidth="12"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (healthScore.overallScore / 100) * 553}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="88"
                  cx="96"
                  cy="96"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn(
                  'text-5xl font-bold',
                  healthScore.grade === 'A' ? 'text-emerald-500' :
                  healthScore.grade === 'B' ? 'text-green-500' :
                  healthScore.grade === 'C' ? 'text-yellow-500' :
                  healthScore.grade === 'D' ? 'text-orange-500' : 'text-red-500'
                )}>
                  {healthScore.overallScore}
                </span>
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  Grade {healthScore.grade}
                </span>
              </div>
            </div>

            {/* Trend & Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  'text-sm',
                  healthScore.trend === 'improving' ? 'bg-emerald-100 text-emerald-700' :
                  healthScore.trend === 'declining' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                )}>
                  {healthScore.trend === 'improving' ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {isBangla ? 'উন্নতি হচ্ছে' : 'Improving'}
                    </>
                  ) : healthScore.trend === 'declining' ? (
                    <>
                      <TrendingDown className="w-4 h-4 mr-1" />
                      {isBangla ? 'অবনতি হচ্ছে' : 'Declining'}
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4 mr-1" />
                      {isBangla ? 'স্থির' : 'Stable'}
                    </>
                  )}
                </Badge>
                <span className="text-sm text-gray-500">
                  {isBangla ? 'সর্বশেষ আপডেট:' : 'Last updated:'}{' '}
                  {new Date(healthScore.lastCalculated).toLocaleString(isBangla ? 'bn-BD' : 'en-US')}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400">
                {healthScore.grade === 'A' 
                  ? (isBangla ? 'আপনার ব্যবসা অত্যন্ত স্বাস্থ্যকর অবস্থায় আছে!' : 'Your business is in excellent health!')
                  : healthScore.grade === 'B'
                  ? (isBangla ? 'আপনার ব্যবসা ভালো অবস্থায় আছে।' : 'Your business is in good health.')
                  : healthScore.grade === 'C'
                  ? (isBangla ? 'কিছু ক্ষেত্রে উন্নতির সুযোগ আছে।' : 'There is room for improvement.')
                  : healthScore.grade === 'D'
                  ? (isBangla ? 'বেশ কিছু ক্ষেত্রে মনোযোগ দেওয়া প্রয়োজন।' : 'Several areas need attention.')
                  : (isBangla ? 'জরুরি ব্যবস্থা নেওয়া প্রয়োজন।' : 'Urgent action is needed.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Scores */}
      <Card>
        <CardHeader>
          <CardTitle>{isBangla ? 'স্কোর উপাদানসমূহ' : 'Score Components'}</CardTitle>
          <CardDescription>
            {isBangla ? 'প্রতিটি উপাদানের অবদান ও অবস্থা' : 'Contribution and status of each component'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ComponentScore
              label="Profit Trend"
              labelBn="লাভের প্রবণতা"
              description="Monthly profit growth rate"
              descriptionBn="মাসিক লাভ বৃদ্ধির হার"
              score={healthScore.components.profitTrend.score}
              trend={healthScore.components.profitTrend.trend}
              weight={healthScore.components.profitTrend.weight}
              icon={TrendingUp}
            />
            <ComponentScore
              label="Credit Risk"
              labelBn="ক্রেডিট ঝুঁকি"
              description="Percentage of overdue receivables"
              descriptionBn="বকেয়া পাওনার শতাংশ"
              score={healthScore.components.creditRisk.score}
              trend={healthScore.components.creditRisk.trend}
              weight={healthScore.components.creditRisk.weight}
              icon={AlertTriangle}
            />
            <ComponentScore
              label="Dead Stock"
              labelBn="অচল মজুদ"
              description="Percentage of unsold inventory"
              descriptionBn="অবিক্রিত মজুদের শতাংশ"
              score={healthScore.components.deadStock.score}
              trend={healthScore.components.deadStock.trend}
              weight={healthScore.components.deadStock.weight}
              icon={Package}
            />
            <ComponentScore
              label="Cash Stability"
              labelBn="নগদ স্থিতিশীলতা"
              description="Cash flow consistency ratio"
              descriptionBn="নগদ প্রবাহের ধারাবাহিকতা"
              score={healthScore.components.cashStability.score}
              trend={healthScore.components.cashStability.trend}
              weight={healthScore.components.cashStability.weight}
              icon={DollarSign}
            />
            <ComponentScore
              label="Sales Consistency"
              labelBn="বিক্রির ধারাবাহিকতা"
              description="Sales variance over time"
              descriptionBn="সময়ের সাথে বিক্রির তারতম্য"
              score={healthScore.components.salesConsistency.score}
              trend={healthScore.components.salesConsistency.trend}
              weight={healthScore.components.salesConsistency.weight}
              icon={BarChart3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>{isBangla ? 'উন্নতির সুপারিশ' : 'Improvement Suggestions'}</CardTitle>
          <CardDescription>
            {isBangla ? 'স্কোর বাড়াতে এই পদক্ষেপগুলো নিন' : 'Take these actions to improve your score'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthScore.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={cn(
                  'p-4 rounded-lg border',
                  suggestion.priority === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
                  suggestion.priority === 'medium' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950' :
                  'border-gray-200 bg-gray-50 dark:bg-gray-900'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {isBangla ? suggestion.titleBn : suggestion.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.potentialImpact} pts
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isBangla ? suggestion.descriptionBn : suggestion.description}
                    </p>
                  </div>
                  {suggestion.actionUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={suggestion.actionUrl}>
                        {isBangla ? 'পদক্ষেপ নিন' : 'Take Action'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComponentScore({
  label,
  labelBn,
  description,
  descriptionBn,
  score,
  trend,
  weight,
  icon: Icon,
}: {
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
  score: number;
  trend: string;
  weight: number;
  icon: React.ElementType;
}) {
  const { isBangla } = useAppTranslation();

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="font-medium">{isBangla ? labelBn : label}</span>
            <span className="text-xs text-gray-500 ml-2">
              ({Math.round(weight * 100)}% {isBangla ? 'ওজন' : 'weight'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{score}</span>
            {getTrendIcon()}
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-2">{isBangla ? descriptionBn : description}</p>
        <Progress value={score} className="h-2" />
      </div>
    </div>
  );
}
