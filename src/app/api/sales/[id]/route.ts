// Hello Khata OS - Sale by ID API Routes
// GET: Get single sale, PATCH: Update sale status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { SaleStatus } from '@/types';

// GET /api/sales/[id] - Get single sale with items and party info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');

    // Build where clause
    const where: { id: string; businessId?: string } = { id };
    if (businessId) {
      where.businessId = businessId;
    }

    const sale = await db.sale.findFirst({
      where,
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                nameBn: true,
                sku: true,
                barcode: true,
                unit: true,
                currentStock: true,
              },
            },
          },
        },
        party: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            type: true,
            customerTier: true,
            currentBalance: true,
            creditLimit: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedSale = {
      ...sale,
      partyName: sale.party?.name || null,
      partyPhone: sale.party?.phone || null,
      branchName: sale.branch?.name || null,
      items: sale.items.map((item) => ({
        id: item.id,
        saleId: item.saleId,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        discount: item.discount,
        total: item.total,
        profit: item.profit,
        createdAt: item.createdAt,
        item: item.item,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedSale,
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch sale' } },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update sale status (for cancellations/returns)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');

    // Build where clause
    const where: { id: string; businessId?: string } = { id };
    if (businessId) {
      where.businessId = businessId;
    }

    // Check if sale exists
    const existingSale = await db.sale.findFirst({
      where,
      include: {
        items: true,
        party: true,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } },
        { status: 404 }
      );
    }

    // Validate status transition
    const validStatuses: SaleStatus[] = ['completed', 'pending', 'cancelled', 'returned'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid status. Valid values: ${validStatuses.join(', ')}` } },
        { status: 400 }
      );
    }

    // Prevent status changes on already cancelled or returned sales
    if (existingSale.status === 'cancelled' || existingSale.status === 'returned') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Cannot update a ${existingSale.status} sale`,
          },
        },
        { status: 403 }
      );
    }

    // Use transaction for data consistency
    const sale = await db.$transaction(async (tx) => {
      let updatedSale = existingSale;

      // Handle cancellation or return - restore stock and update party balance
      if (status === 'cancelled' || status === 'returned') {
        // Restore item stock
        for (const saleItem of existingSale.items) {
          const item = await tx.item.findUnique({
            where: { id: saleItem.itemId },
          });

          if (item) {
            const newStock = item.currentStock + saleItem.quantity;

            // Update item stock
            await tx.item.update({
              where: { id: saleItem.itemId },
              data: { currentStock: newStock },
            });

            // Create stock ledger entry for return
            await tx.stockLedger.create({
              data: {
                businessId: existingSale.businessId,
                branchId: existingSale.branchId,
                itemId: saleItem.itemId,
                type: status === 'cancelled' ? 'adjustment' : 'return',
                quantity: saleItem.quantity,
                previousStock: item.currentStock,
                newStock,
                referenceId: existingSale.id,
                referenceType: 'sale',
                reason: status === 'cancelled' ? 'Sale cancelled' : 'Sale returned',
                createdBy: userId || null,
              },
            });
          }
        }

        // Reverse party ledger entry if credit sale
        if (existingSale.partyId && existingSale.dueAmount > 0) {
          const party = await tx.party.findUnique({
            where: { id: existingSale.partyId },
          });

          if (party) {
            const newBalance = party.currentBalance - existingSale.dueAmount;

            // Update party balance
            await tx.party.update({
              where: { id: existingSale.partyId },
              data: { currentBalance: newBalance },
            });

            // Create party ledger entry for reversal
            await tx.partyLedger.create({
              data: {
                businessId: existingSale.businessId,
                branchId: existingSale.branchId,
                partyId: existingSale.partyId,
                type: 'adjustment',
                referenceId: existingSale.id,
                referenceType: 'sale',
                amount: -existingSale.dueAmount,
                balance: newBalance,
                description: `Sale ${status} - Invoice ${existingSale.invoiceNo}`,
                date: new Date(),
              },
            });
          }
        }
      }

      // Update sale status
      const updateData: {
        status?: SaleStatus;
        notes?: string | null;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (status) {
        updateData.status = status;
      }

      if (notes !== undefined) {
        updateData.notes = notes || null;
      }

      updatedSale = await tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          party: {
            select: {
              id: true,
              name: true,
              phone: true,
              type: true,
            },
          },
        },
      });

      return updatedSale;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        partyName: sale.party?.name || null,
        partyPhone: sale.party?.phone || null,
        items: sale.items.map((item) => ({
          id: item.id,
          saleId: item.saleId,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          discount: item.discount,
          total: item.total,
          profit: item.profit,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update sale' } },
      { status: 500 }
    );
  }
}
