// Hello Khata OS - Category by ID API
// Item categories CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const category = await db.category.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        itemCount: category._count.items,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch category' },
    }, { status: 500 });
  }
}

// PATCH /api/categories/[id] - Update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, nameBn, description } = body;

    // Check if category exists and belongs to business
    const existing = await db.category.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      }, { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await db.category.findFirst({
        where: { businessId, name, NOT: { id } },
      });

      if (duplicate) {
        return NextResponse.json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Category with this name already exists' },
        }, { status: 400 });
      }
    }

    const updateData: {
      name?: string;
      nameBn?: string;
      description?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (nameBn !== undefined) updateData.nameBn = nameBn.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const category = await db.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' },
    }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    // Check if category exists and belongs to business
    const category = await db.category.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      }, { status: 404 });
    }

    // Check if category has items
    if (category._count.items > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'HAS_ITEMS',
          message: `Cannot delete category with ${category._count.items} items`,
        },
      }, { status: 400 });
    }

    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' },
    }, { status: 500 });
  }
}
