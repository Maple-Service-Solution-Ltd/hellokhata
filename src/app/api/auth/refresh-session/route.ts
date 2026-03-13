// Hello Khata OS - Refresh Session API
// Refreshes session data from the database

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PricingPlanId } from '@/stores/featureGateStore';

// Default features based on plan
const getDefaultFeatures = (plan: string) => {
  switch (plan) {
    case 'intelligence':
      return {
        aiAssistant: true,
        multiStaff: true,
        advancedReports: true,
        dataExport: true,
        unlimitedItems: true,
        unlimitedParties: true,
        multiBranch: true,
        creditControl: true,
        auditTrail: true,
        advancedPricing: true,
        healthScore: true,
        reconciliation: true,
        staffPerformance: true,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'growth':
      return {
        aiAssistant: true,
        multiStaff: true,
        advancedReports: true,
        dataExport: true,
        unlimitedItems: true,
        unlimitedParties: true,
        multiBranch: true,
        creditControl: true,
        auditTrail: false,
        advancedPricing: false,
        healthScore: true,
        reconciliation: true,
        staffPerformance: true,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'starter':
      return {
        aiAssistant: true,
        multiStaff: false,
        advancedReports: false,
        dataExport: true,
        unlimitedItems: true,
        unlimitedParties: false,
        multiBranch: false,
        creditControl: true,
        auditTrail: false,
        advancedPricing: false,
        healthScore: false,
        reconciliation: false,
        staffPerformance: false,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'free':
    default:
      return {
        aiAssistant: true,
        multiStaff: false,
        advancedReports: false,
        dataExport: false,
        unlimitedItems: false,
        unlimitedParties: false,
        multiBranch: false,
        creditControl: false,
        auditTrail: false,
        advancedPricing: false,
        healthScore: false,
        reconciliation: false,
        staffPerformance: false,
        deadStockAnalysis: false,
        globalSearch: true,
      };
  }
};

export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    // Get fresh business data
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      }, { status: 404 });
    }

    // Get user
    const userId = request.headers.get('x-user-id');
    let user = null;
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
      });
    }

    // Get first branch
    const branch = await db.branch.findFirst({
      where: { businessId, isMain: true },
    });

    const plan = (business.plan || 'free') as PricingPlanId;
    const features = getDefaultFeatures(plan);

    return NextResponse.json({
      success: true,
      data: {
        user: user ? {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
          branchId: user.branchId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } : null,
        business: {
          id: business.id,
          name: business.name,
          nameBn: business.nameBn,
          type: business.type,
          phone: business.phone,
          email: business.email,
          address: business.address,
          logo: business.logo,
          currency: business.currency,
          timezone: business.timezone,
          language: business.language,
          isActive: business.isActive,
          hasMultipleBranches: false,
          createdAt: business.createdAt,
          updatedAt: business.updatedAt,
        },
        branch: branch ? {
          id: branch.id,
          businessId: branch.businessId,
          name: branch.name,
          nameBn: branch.nameBn,
          type: branch.type,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.isActive,
          isMain: branch.isMain,
          openingCash: branch.openingCash,
          currentCash: branch.currentCash,
          createdAt: branch.createdAt,
          updatedAt: branch.updatedAt,
        } : undefined,
        plan,
        features,
      },
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh session' },
    }, { status: 500 });
  }
}
