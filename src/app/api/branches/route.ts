// Hello Khata OS - Branches API
// Multi-branch management with plan limit enforcement

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PLAN_LIMITS } from '@/stores/featureGateStore';
import type { PricingPlanId } from '@/stores/featureGateStore';

// GET /api/branches - List branches
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const branches = await db.branch.findMany({
      where: { businessId },
      orderBy: { isMain: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch branches' },
    }, { status: 500 });
  }
}

// POST /api/branches - Create branch
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    // Get business and check plan
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      }, { status: 404 });
    }

    // Get current branch count
    const existingBranches = await db.branch.count({
      where: { businessId },
    });

    // Check plan limits
    const planId = (business.plan || 'free') as PricingPlanId;
    const planLimits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
    const branchLimit = planLimits.branchLimit;

    if (branchLimit !== 'unlimited' && existingBranches >= branchLimit) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: `Your ${planId} plan allows maximum ${branchLimit} branch(s). Upgrade to add more branches.`,
          limit: branchLimit,
          current: existingBranches,
        },
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, nameBn, type, address, phone, managerId, openingCash } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Branch name is required' },
      }, { status: 400 });
    }

    const branch = await db.branch.create({
      data: {
        businessId,
        name,
        nameBn,
        type: type || 'retail',
        address,
        phone,
        managerId,
        openingCash: openingCash ? parseFloat(openingCash) : 0,
        currentCash: openingCash ? parseFloat(openingCash) : 0,
        isMain: existingBranches === 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: branch,
      meta: {
        branchLimit,
        currentBranchCount: existingBranches + 1,
        canAddMore: branchLimit === 'unlimited' || existingBranches + 1 < branchLimit,
      },
    });
  } catch (error) {
    console.error('Create branch error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create branch' },
    }, { status: 500 });
  }
}
