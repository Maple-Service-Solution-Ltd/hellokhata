// Hello Khata OS - Party Categories API
// হ্যালো খাতা - পার্টি ক্যাটাগরি এপিআই

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all party categories
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Business ID required' } },
        { status: 401 }
      );
    }

    const categories = await db.partyCategory.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { parties: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include partyCount
    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      nameBn: cat.nameBn || cat.name,
      description: cat.description,
      color: cat.color,
      partyCount: cat._count.parties,
      createdAt: cat.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get party categories error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } },
      { status: 500 }
    );
  }
}

// POST - Create a new party category
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Business ID required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, nameBn, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category name is required' } },
        { status: 400 }
      );
    }

    // Check if category with same name already exists
    const existingCategory = await db.partyCategory.findFirst({
      where: {
        businessId,
        name: name.trim(),
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Category with this name already exists' } },
        { status: 400 }
      );
    }

    const newCategory = await db.partyCategory.create({
      data: {
        businessId,
        name: name.trim(),
        nameBn: nameBn?.trim() || name.trim(),
        description: description?.trim(),
        color: color || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newCategory.id,
        name: newCategory.name,
        nameBn: newCategory.nameBn || newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        partyCount: 0,
        createdAt: newCategory.createdAt.toISOString(),
      },
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Create party category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } },
      { status: 500 }
    );
  }
}
