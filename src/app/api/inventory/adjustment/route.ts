// Hello Khata OS - Stock Adjustment API
// Handles manual stock adjustments with proper transaction logging

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  ensureBranchForWrite,
  branchErrorResponse
} from '@/lib/branch-context';

interface AdjustmentInput {
  branchId: string;
  itemId: string;
  adjustmentType: 'increase' | 'decrease';
  quantity: number;
  reason: string;
  notes?: string;
}

// POST /api/inventory/adjustment - Create stock adjustment
export async function POST(request: NextRequest) {
  try {
    const body: AdjustmentInput = await request.json();
    const {
      branchId: providedBranchId,
      itemId,
      adjustmentType,
      quantity,
      reason,
      notes,
    } = body;

    // Validate required fields
    if (!itemId || !quantity || !reason) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Item, quantity, and reason are required' } },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Quantity must be greater than zero' } },
        { status: 400 }
      );
    }

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } },
        { status: 404 }
      );
    }

    // Enforce branch context
    const branchResult = await ensureBranchForWrite(businessId, providedBranchId, userId || undefined);
    if (branchResult.error) {
      return branchErrorResponse(branchResult.error);
    }
    const branchId = branchResult.branchId!;

    // Fetch the item
    const item = await db.item.findFirst({
      where: { id: itemId, businessId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } },
        { status: 404 }
      );
    }

    // Calculate new stock
    const previousStock = item.currentStock;
    let newStock: number;
    let quantityChange: number;

    if (adjustmentType === 'increase') {
      quantityChange = quantity;
      newStock = previousStock + quantity;
    } else {
      // Decrease - check for negative stock
      if (quantity > previousStock) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot decrease stock below zero' } },
          { status: 400 }
        );
      }
      quantityChange = -quantity;
      newStock = previousStock - quantity;
    }

    // Use transaction for data consistency
    const result = await db.$transaction(async (tx) => {
      // Update item stock
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: {
          currentStock: newStock,
          updatedAt: new Date(),
        },
      });

      // Create stock ledger entry
      const stockLedgerEntry = await tx.stockLedger.create({
        data: {
          businessId,
          branchId,
          itemId,
          type: 'adjustment',
          quantity: quantityChange,
          previousStock,
          newStock,
          referenceType: 'adjustment',
          reason: `${adjustmentType === 'increase' ? 'Increase' : 'Decrease'}: ${reason}`,
          notes: notes || null,
          createdBy: userId || null,
        },
      });

      return { item: updatedItem, stockLedger: stockLedgerEntry };
    });

    return NextResponse.json({
      success: true,
      data: {
        item: result.item,
        adjustment: {
          type: adjustmentType,
          quantity,
          previousStock,
          newStock,
          reason,
        },
      },
    });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create stock adjustment' } },
      { status: 500 }
    );
  }
}
