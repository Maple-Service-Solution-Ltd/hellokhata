// Hello Khata OS - Party Categories API Routes
// GET: List party categories with party count

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parties/categories - List all party categories
export async function GET(request: NextRequest) {
  try {
    // Get businessId from header (multi-tenant isolation)
    const businessId = request.headers.get('x-business-id');

    // SECURITY: Require businessId - no demo business creation
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'BUSINESS_NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Fetch party categories with party count
    const categories = await db.partyCategory.findMany({
      where: {
        businessId,
      },
      include: {
        _count: {
          select: {
            parties: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform data for response
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      nameBn: category.nameBn,
      description: category.description,
      color: category.color,
      partyCount: category._count.parties,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCategories,
    });
  } catch (error) {
    console.error('Error fetching party categories:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch party categories' } },
      { status: 500 }
    );
  }
}
