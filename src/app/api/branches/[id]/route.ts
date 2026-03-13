// Hello Khata OS - Branch API (Single Branch Operations)
// Update and Delete branch endpoints

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/branches/:id - Get single branch
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

    const branch = await db.branch.findFirst({
      where: { id, businessId },
    });

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error('Get branch error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch branch' },
    }, { status: 500 });
  }
}

// PATCH /api/branches/:id - Update branch
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

    // Check branch exists and belongs to business
    const existingBranch = await db.branch.findFirst({
      where: { id, businessId },
    });

    if (!existingBranch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' },
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, nameBn, type, address, phone, managerId, isActive, openingCash } = body;

    // Prevent deactivating the main branch
    if (existingBranch.isMain && isActive === false) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot deactivate the main branch' },
      }, { status: 400 });
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameBn !== undefined && { nameBn }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(managerId !== undefined && { managerId }),
        ...(isActive !== undefined && { isActive }),
        ...(openingCash !== undefined && { 
          openingCash: parseFloat(openingCash),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    console.error('Update branch error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update branch' },
    }, { status: 500 });
  }
}

// DELETE /api/branches/:id - Delete branch
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

    // Check branch exists and belongs to business
    const existingBranch = await db.branch.findFirst({
      where: { id, businessId },
    });

    if (!existingBranch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' },
      }, { status: 404 });
    }

    // Prevent deleting the main branch
    if (existingBranch.isMain) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cannot delete the main branch. Transfer main status first.' },
      }, { status: 400 });
    }

    // Check if branch has transactions
    const [salesCount, expensesCount, itemsCount] = await Promise.all([
      db.sale.count({ where: { branchId: id } }),
      db.expense.count({ where: { branchId: id } }),
      db.item.count({ where: { branchId: id } }),
    ]);

    if (salesCount > 0 || expensesCount > 0 || itemsCount > 0) {
      // Instead of deleting, just deactivate
      const branch = await db.branch.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        data: branch,
        message: 'Branch has associated data. It has been deactivated instead of deleted.',
      });
    }

    // Safe to delete
    await db.branch.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete branch' },
    }, { status: 500 });
  }
}
