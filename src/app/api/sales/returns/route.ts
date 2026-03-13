// Sales Returns API
// Handles customer returns with inventory reversal

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Simple session extraction from headers
function getSession(request: NextRequest) {
  const businessId = request.headers.get('x-business-id');
  const userId = request.headers.get('x-user-id');
  return { businessId, userId };
}

// GET /api/sales/returns - List all returns
export async function GET(request: NextRequest) {
  try {
    const { businessId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const saleId = searchParams.get('saleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Prisma.SaleReturnWhereInput = {
      businessId,
      deletedAt: null,
      ...(branchId && { branchId }),
      ...(saleId && { saleId }),
      ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate) } }),
    };

    const [returns, total] = await Promise.all([
      db.saleReturn.findMany({
        where,
        include: {
          items: {
            where: { deletedAt: null },
          },
          party: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.saleReturn.count({ where }),
    ]);

    // Transform for frontend
    const transformedReturns = returns.map(r => ({
      id: r.id,
      invoiceNo: r.returnNo,
      originalSaleId: r.saleId,
      partyId: r.partyId,
      partyName: r.party?.name || 'Unknown',
      items: r.items.map(item => ({
        id: item.id,
        returnId: item.saleReturnId,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        reason: item.reason || undefined,
      })),
      totalAmount: r.total,
      status: 'completed',
      reason: r.reason || undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(transformedReturns);
  } catch (error) {
    console.error('Error fetching sale returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sale returns' },
      { status: 500 }
    );
  }
}

// POST /api/sales/returns - Create a new return
export async function POST(request: NextRequest) {
  try {
    const { businessId, userId } = getSession(request);
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      saleId,
      branchId,
      items,
      reason,
      notes,
      refundMethod = 'cash',
    } = body;

    // Validate sale exists
    const sale = await db.sale.findFirst({
      where: {
        id: saleId,
        businessId,
        deletedAt: null,
        status: { not: 'cancelled' },
      },
      include: {
        items: {
          where: { deletedAt: null },
        },
        party: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const returnItems: Array<{
      saleItemId: string;
      itemId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      discount: number;
      total: number;
      reason?: string;
    }> = [];

    for (const item of items) {
      const saleItem = sale.items.find(si => si.id === item.saleItemId);
      if (!saleItem) {
        return NextResponse.json(
          { error: `Sale item ${item.saleItemId} not found` },
          { status: 400 }
        );
      }

      const itemTotal = (item.quantity * saleItem.unitPrice) - (item.discount || 0);
      subtotal += itemTotal;

      returnItems.push({
        saleItemId: item.saleItemId,
        itemId: saleItem.itemId,
        itemName: saleItem.itemName,
        quantity: item.quantity,
        unitPrice: saleItem.unitPrice,
        costPrice: saleItem.costPrice,
        discount: item.discount || 0,
        total: itemTotal,
        reason: item.reason,
      });
    }

    const total = subtotal;

    // Generate return number
    const returnCount = await db.saleReturn.count({
      where: { businessId },
    });
    const returnNo = `SRN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(returnCount + 1).padStart(4, '0')}`;

    // Create return in transaction
    const result = await db.$transaction(async (tx) => {
      // Create sale return
      const saleReturn = await tx.saleReturn.create({
        data: {
          businessId,
          branchId: branchId || sale.branchId,
          saleId,
          returnNo,
          partyId: sale.partyId,
          subtotal,
          total,
          refundAmount: total,
          refundMethod,
          reason,
          notes,
          createdBy: userId,
          items: {
            create: returnItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Update sale items and return stock
      for (const item of returnItems) {
        await tx.saleItem.update({
          where: { id: item.saleItemId },
          data: {
            returnedQty: { increment: item.quantity },
          },
        });

        const stockItem = await tx.item.findUnique({
          where: { id: item.itemId },
          select: { currentStock: true },
        });

        if (stockItem) {
          await tx.item.update({
            where: { id: item.itemId },
            data: {
              currentStock: { increment: item.quantity },
            },
          });

          await tx.stockLedger.create({
            data: {
              businessId,
              branchId: branchId || sale.branchId,
              itemId: item.itemId,
              type: 'return_in',
              quantity: item.quantity,
              previousStock: stockItem.currentStock,
              newStock: stockItem.currentStock + item.quantity,
              referenceId: saleReturn.id,
              referenceType: 'sale_return',
              reason: `Return: ${returnNo}`,
              createdBy: userId,
            },
          });
        }
      }

      return saleReturn;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Return processed successfully',
    });
  } catch (error) {
    console.error('Error creating sale return:', error);
    return NextResponse.json(
      { error: 'Failed to process return' },
      { status: 500 }
    );
  }
}
