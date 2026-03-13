// Plan Indicator Component
// Shows current plan status in header/sidebar

'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Crown, 
  Zap, 
  Rocket, 
  Star, 
  ChevronUp, 
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import type { PlanId } from '@/lib/pricing/plans';
import { PRICING_PLANS } from '@/lib/pricing/plans';

interface PlanInfo {
  id: PlanId;
  name: string;
  nameBn: string;
  price: number;
  aiLimit: number | 'unlimited';
  aiUsed: number;
}

const planIcons: Record<PlanId, React.ReactNode> = {
  free: <Star className="w-4 h-4" />,
  starter: <Rocket className="w-4 h-4" />,
  growth: <Zap className="w-4 h-4" />,
  intelligence: <Crown className="w-4 h-4" />,
};

const planColors: Record<PlanId, string> = {
  free: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  starter: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  growth: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  intelligence: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 hover:from-amber-200 hover:to-orange-200',
};

export function PlanIndicator() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanInfo();
  }, []);

  const fetchPlanInfo = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        const plan = PRICING_PLANS.find(p => p.id === data.data?.plan) || PRICING_PLANS[0];
        
        // Get usage stats
        const usageResponse = await fetch('/api/subscription/usage');
        const usageData = usageResponse.ok ? await usageResponse.json() : { data: { aiChats: { used: 0 } } };
        
        setPlanInfo({
          id: plan.id,
          name: plan.name,
          nameBn: plan.nameBn,
          price: plan.price,
          aiLimit: plan.limits.aiChatsPerDay,
          aiUsed: usageData.data?.aiChats?.used || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch plan info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !planInfo) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 animate-pulse">
        <div className="w-4 h-4 rounded bg-gray-300" />
        <div className="w-12 h-4 rounded bg-gray-300" />
      </div>
    );
  }

  const aiRemaining = planInfo.aiLimit === 'unlimited' 
    ? '∞' 
    : Math.max(0, planInfo.aiLimit - planInfo.aiUsed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${planColors[planInfo.id]}`}
        >
          {planIcons[planInfo.id]}
          <span className="font-medium text-sm">{planInfo.name}</span>
          <ChevronUp className="w-3 h-3 rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Current Plan</span>
          <Badge variant="outline" className="font-normal">
            {planInfo.name}
          </Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Usage Stats */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">AI Chats Today</span>
            <span className="font-medium">
              {planInfo.aiUsed} / {planInfo.aiLimit === 'unlimited' ? '∞' : planInfo.aiLimit}
            </span>
          </div>
          
          {planInfo.aiLimit !== 'unlimited' && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, (planInfo.aiUsed / (planInfo.aiLimit as number)) * 100)}%` 
                }}
              />
            </div>
          )}
          
          {planInfo.aiLimit !== 'unlimited' && (planInfo.aiLimit as number) - planInfo.aiUsed <= 3 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>{aiRemaining} chats remaining today</span>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Upgrade Options */}
        {planInfo.id !== 'intelligence' && (
          <>
            <DropdownMenuLabel className="text-xs text-gray-500">
              Upgrade Available
            </DropdownMenuLabel>
            
            {PRICING_PLANS.filter(p => 
              PRICING_PLANS.indexOf(p) > PRICING_PLANS.findIndex(pl => pl.id === planInfo.id)
            ).slice(0, 2).map(plan => (
              <DropdownMenuItem 
                key={plan.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => window.location.href = `/settings/billing?plan=${plan.id}`}
              >
                <div className="flex items-center gap-2">
                  {planIcons[plan.id]}
                  <span>{plan.name}</span>
                </div>
                <span className="text-xs text-gray-500">{plan.priceDisplay}</span>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Manage Subscription */}
        <DropdownMenuItem onClick={() => window.location.href = '/settings/billing'}>
          <Sparkles className="w-4 h-4 mr-2" />
          Manage Subscription
        </DropdownMenuItem>
        
        {/* Plan Features */}
        <div className="px-2 py-2 text-xs text-gray-500">
          <div className="font-medium mb-1">Your Plan Includes:</div>
          <ul className="space-y-1">
            {PRICING_PLANS.find(p => p.id === planInfo.id)?.features.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span className={feature.included ? '' : 'text-gray-400 line-through'}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mini badge version for compact spaces
export function PlanBadge() {
  const [plan, setPlan] = useState<PlanId>('free');

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(data => setPlan(data.data?.plan || 'free'))
      .catch(() => setPlan('free'));
  }, []);

  const planData = PRICING_PLANS.find(p => p.id === plan) || PRICING_PLANS[0];

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${planColors[plan]}`}
    >
      {planIcons[plan]}
      {planData.name}
    </Badge>
  );
}

export default PlanIndicator;
