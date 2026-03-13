'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Crown, Rocket, Star } from 'lucide-react';
import { PRICING_PLANS, type PlanId } from '@/lib/pricing/plans';
import { useRouter } from 'next/navigation';

const planIcons: Record<PlanId, React.ReactNode> = {
  free: <Star className="w-6 h-6" />,
  starter: <Rocket className="w-6 h-6" />,
  growth: <Zap className="w-6 h-6" />,
  intelligence: <Crown className="w-6 h-6" />,
};

const planColors: Record<PlanId, string> = {
  free: 'border-gray-200 bg-gray-50',
  starter: 'border-blue-200 bg-blue-50',
  growth: 'border-purple-500 bg-purple-50 ring-2 ring-purple-500',
  intelligence: 'border-red-200 bg-gradient-to-b from-red-50 to-orange-50',
};

export function PricingPage() {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');
  const router = useRouter();

  const handleSelectPlan = async (planId: PlanId) => {
    setLoading(planId);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      if (response.ok) {
        setCurrentPlan(planId);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to select plan:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your business
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isLoading = loading === plan.id;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${planColors[plan.id]} ${
                  plan.highlight ? 'transform scale-105 z-10' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-white shadow-sm">
                    {planIcons[plan.id]}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 text-sm block">{plan.priceDisplayBn}</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2 text-left">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.name}
                          {feature.description && feature.included && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({feature.description})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                    disabled={isCurrent || isLoading}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isLoading ? 'Processing...' : isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b">Feature</th>
                  {PRICING_PLANS.map(plan => (
                    <th key={plan.id} className="p-4 border-b text-center">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="p-4 border-b font-medium">AI Chats/day</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.aiChatsPerDay === 'unlimited' ? '∞' : plan.limits.aiChatsPerDay}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Staff Members</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.staffLimit === 'unlimited' ? '∞' : plan.limits.staffLimit}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border-b font-medium">Branches</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.branchLimit === 'unlimited' ? '∞' : plan.limits.branchLimit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Health Score</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.healthScore ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border-b font-medium">Export CSV/Excel</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.exportCSV ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">AI Forecasting</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.aiForecasting ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 border-b font-medium">API Access</td>
                  {PRICING_PLANS.map(plan => (
                    <td key={plan.id} className="p-4 border-b text-center">
                      {plan.limits.apiAccess ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions?</h2>
          <p className="text-gray-600">
            Contact us at <a href="mailto:support@smartstoreos.com" className="text-blue-600">support@smartstoreos.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
