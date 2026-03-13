// Hello Khata OS - Single Expense API
// GET, PATCH, DELETE for individual expenses

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const expense = await db.expense.findFirst({
      where: { id, businessId },
      include: {
        category: {
          select: { id: true, name: true, nameBn: true, icon: true, color: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' },
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch expense' },
    }, { status: 500 });
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const existing = await db.expense.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' },
      }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.categoryId) updateData.categoryId = body.categoryId;
    if (body.accountId) updateData.accountId = body.accountId;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.description) updateData.description = body.description;
    if (body.date) updateData.date = new Date(body.date);
    if (body.receipt !== undefined) updateData.receipt = body.receipt;

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, nameBn: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update expense' },
    }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const expense = await db.expense.findFirst({
      where: { id, businessId },
    });

    if (!expense) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' },
      }, { status: 404 });
    }

    await db.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete expense' },
    }, { status: 500 });
  }
}
