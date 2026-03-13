// Usage Tracking API
// GET - Get usage stats
// POST - Record usage

import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, recordUsage, getUsageStats, type UsageType } from '@/lib/pricing/usageTracking';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as UsageType | null;
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID required' },
        { status: 400 }
      );
    }
    
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { plan: true },
    });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // If specific type requested, check that limit
    if (type) {
      const result = await checkUsageLimit(businessId, business.plan as any, type);
      return NextResponse.json({ success: true, data: result });
    }
    
    // Otherwise return full stats
    const stats = await getUsageStats(businessId, business.plan as any);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get usage' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    const { type, checkOnly = false } = body as { type: UsageType; checkOnly?: boolean };
    
    if (!businessId || !type) {
      return NextResponse.json(
        { success: false, error: 'Business ID and type required' },
        { status: 400 }
      );
    }
    
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { plan: true },
    });
    
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Check limit first
    const checkResult = await checkUsageLimit(businessId, business.plan as any, type);
    
    if (!checkResult.allowed) {
      return NextResponse.json({
        success: false,
        error: checkResult.message || 'Limit exceeded',
        errorBn: checkResult.messageBn,
        data: checkResult,
      }, { status: 403 });
    }
    
    // If checkOnly, don't record
    if (checkOnly) {
      return NextResponse.json({ success: true, data: checkResult });
    }
    
    // Record the usage
    await recordUsage(businessId, type);
    
    return NextResponse.json({
      success: true,
      data: {
        ...checkResult,
        currentUsage: checkResult.currentUsage + 1,
        remaining: checkResult.remaining === 'unlimited' 
          ? 'unlimited' 
          : Math.max(0, (checkResult.remaining as number) - 1),
      },
    });
  } catch (error) {
    console.error('Record usage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}
