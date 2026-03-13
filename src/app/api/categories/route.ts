// Hello Khata OS - Categories API
// Item categories with multi-tenant isolation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const categories = await db.category.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' },
    }, { status: 500 });
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, nameBn, description, parentId } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Category name is required' },
      }, { status: 400 });
    }

    // Check for duplicate
    const existing = await db.category.findFirst({
      where: { businessId, name },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Category already exists' },
      }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        businessId,
        name,
        nameBn,
        description,
        parentId,
        itemCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' },
    }, { status: 500 });
  }
}
