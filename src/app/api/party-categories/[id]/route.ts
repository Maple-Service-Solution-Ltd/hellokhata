// Hello Khata OS - Party Category by ID API
// হ্যালো খাতা - পার্টি ক্যাটাগরি আইডি এপিআই

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get a single party category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Business ID required' } },
        { status: 401 }
      );
    }

    const category = await db.partyCategory.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { parties: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        nameBn: category.nameBn || category.name,
        description: category.description,
        color: category.color,
        partyCount: category._count.parties,
        createdAt: category.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get party category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch category' } },
      { status: 500 }
    );
  }
}

// PUT - Update a party category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if category exists and belongs to this business
    const existingCategory = await db.partyCategory.findFirst({
      where: { id, businessId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    // Check if another category with same name exists
    const duplicateCategory = await db.partyCategory.findFirst({
      where: {
        businessId,
        name: name.trim(),
        NOT: { id },
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Category with this name already exists' } },
        { status: 400 }
      );
    }

    const updatedCategory = await db.partyCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        nameBn: nameBn?.trim() || name.trim(),
        description: description?.trim(),
        color: color || null,
      },
      include: {
        _count: {
          select: { parties: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        nameBn: updatedCategory.nameBn || updatedCategory.name,
        description: updatedCategory.description,
        color: updatedCategory.color,
        partyCount: updatedCategory._count.parties,
        createdAt: updatedCategory.createdAt.toISOString(),
      },
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Update party category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } },
      { status: 500 }
    );
  }
}

// DELETE - Delete a party category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Business ID required' } },
        { status: 401 }
      );
    }

    // Check if category exists and belongs to this business
    const category = await db.partyCategory.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { parties: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    // Check if category has parties
    if (category._count.parties > 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'HAS_PARTIES', message: `Cannot delete category with ${category._count.parties} parties` },
        },
        { status: 400 }
      );
    }

    await db.partyCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete party category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } },
      { status: 500 }
    );
  }
}
