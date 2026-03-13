// Hello Khata OS - Quotation by ID API Routes
// DELETE: Delete quotation, PATCH: Update quotation status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { QuotationItem } from '@/types/quotation';

// DELETE /api/quotations/[id] - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if quotation exists
    const existingQuotation = await db.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Only allow deleting draft quotations
    if (existingQuotation.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only draft quotations can be deleted' } },
        { status: 403 }
      );
    }

    await db.quotation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DELETE_ERROR', message: 'Failed to delete quotation' } },
      { status: 500 }
    );
  }
}

// PATCH /api/quotations/[id] - Update quotation (status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, convertedToSaleId } = body;

    // Check if quotation exists
    const existingQuotation = await db.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      status?: string;
      convertedToSaleId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (convertedToSaleId !== undefined) {
      updateData.convertedToSaleId = convertedToSaleId;
    }

    const quotation = await db.quotation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...quotation,
        items: JSON.parse(quotation.items) as QuotationItem[],
      },
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update quotation' } },
      { status: 500 }
    );
  }
}

// GET /api/quotations/[id] - Get single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quotation = await db.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Quotation not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...quotation,
        items: JSON.parse(quotation.items) as QuotationItem[],
      },
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch quotation' } },
      { status: 500 }
    );
  }
}
