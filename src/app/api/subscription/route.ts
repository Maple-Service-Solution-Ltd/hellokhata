// Subscription Management API
// GET - Get current subscription
// POST - Create/upgrade subscription
// PATCH - Update subscription (cancel, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRICING_PLANS, type PlanId } from '@/lib/pricing/plans';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID required' },
        { status: 400 }
      );
    }
    
    // Get business with subscription info
    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    const currentPlan = PRICING_PLANS.find(p => p.id === business.plan);
    const activeSubscription = business.subscriptions[0];
    
    return NextResponse.json({
      success: true,
      data: {
        plan: business.plan,
        planStatus: business.planStatus,
        planStartDate: business.planStartDate,
        planEndDate: business.planEndDate,
        trialEndsAt: business.trialEndsAt,
        currentPlan,
        subscription: activeSubscription,
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    const { planId } = body as { planId: PlanId };
    
    if (!businessId || !planId) {
      return NextResponse.json(
        { success: false, error: 'Business ID and plan ID required' },
        { status: 400 }
      );
    }
    
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }
    
    // Update business plan
    const business = await db.business.update({
      where: { id: businessId },
      data: {
        plan: planId,
        planStatus: 'active',
        planStartDate: new Date(),
        planEndDate: plan.price > 0 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : null,
      },
    });
    
    // Create subscription record
    const subscription = await db.subscription.create({
      data: {
        businessId,
        plan: planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: plan.price > 0
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: { business, subscription },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    const { action } = body as { action: 'cancel' | 'reactivate' };
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID required' },
        { status: 400 }
      );
    }
    
    if (action === 'cancel') {
      const business = await db.business.update({
        where: { id: businessId },
        data: {
          planStatus: 'cancelled',
        },
      });
      
      await db.subscription.updateMany({
        where: { businessId, status: 'active' },
        data: {
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      });
      
      return NextResponse.json({ success: true, data: business });
    }
    
    if (action === 'reactivate') {
      const business = await db.business.update({
        where: { id: businessId },
        data: {
          planStatus: 'active',
        },
      });
      
      return NextResponse.json({ success: true, data: business });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
