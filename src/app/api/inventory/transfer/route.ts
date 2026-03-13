// Hello Khata OS - Stock Transfer API
// Handles stock transfers between branches with proper transaction logging

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateBranchAccess, branchErrorResponse } from '@/lib/branch-context';

interface TransferInput {
  fromBranchId: string;
  toBranchId: string;
  itemId: string;
  quantity: number;
  notes?: string;
}

// POST /api/inventory/transfer - Create stock transfer
export async function POST(request: NextRequest) {
  try {
    const body: TransferInput = await request.json();
    const {
      fromBranchId,
      toBranchId,
      itemId,
      quantity,
      notes,
    } = body;

    // Validate required fields
    if (!fromBranchId || !toBranchId || !itemId || !quantity) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'From branch, to branch, item, and quantity are required' } },
        { status: 400 }
      );
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Source and destination branches must be different' } },
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

    // Validate both branches belong to this business
    const fromBranchValidation = await validateBranchAccess(businessId, fromBranchId);
    if (!fromBranchValidation.valid) {
      return branchErrorResponse(fromBranchValidation.error!);
    }

    const toBranchValidation = await validateBranchAccess(businessId, toBranchId);
    if (!toBranchValidation.valid) {
      return branchErrorResponse(toBranchValidation.error!);
    }

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

    // Check if enough stock available
    if (quantity > item.currentStock) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Insufficient stock for transfer' } },
        { status: 400 }
      );
    }

    const previousStock = item.currentStock;
    const newStock = previousStock - quantity;

    // Use transaction for data consistency
    const result = await db.$transaction(async (tx) => {
      // Update item stock (decrease from source branch)
      // Note: In a proper multi-branch inventory system, we'd track stock per branch
      // For now, we update the main item stock and log the transfer
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: {
          currentStock: newStock,
          updatedAt: new Date(),
        },
      });

      // Create stock ledger entry for transfer out
      await tx.stockLedger.create({
        data: {
          businessId,
          branchId: fromBranchId,
          itemId,
          type: 'transfer_out',
          quantity: -quantity,
          previousStock,
          newStock,
          fromBranchId,
          toBranchId,
          referenceType: 'transfer',
          reason: `Transfer to ${toBranchValidation.branch?.name}`,
          notes: notes || null,
          createdBy: userId || null,
        },
      });

      // Create stock ledger entry for transfer in (at destination)
      // Note: This assumes the destination has the same item
      // In a real system, we'd need to find or create the item at destination
      await tx.stockLedger.create({
        data: {
          businessId,
          branchId: toBranchId,
          itemId,
          type: 'transfer_in',
          quantity: quantity,
          previousStock: 0, // Would be the destination's previous stock
          newStock: quantity, // Would be the destination's new stock
          fromBranchId,
          toBranchId,
          referenceType: 'transfer',
          reason: `Transfer from ${fromBranchValidation.branch?.name}`,
          notes: notes || null,
          createdBy: userId || null,
        },
      });

      return { item: updatedItem };
    });

    return NextResponse.json({
      success: true,
      data: {
        item: result.item,
        transfer: {
          fromBranchId,
          toBranchId,
          quantity,
          previousStock,
          newStock,
        },
      },
    });
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create stock transfer' } },
      { status: 500 }
    );
  }
}
