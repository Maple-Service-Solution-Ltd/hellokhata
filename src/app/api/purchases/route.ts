// Hello Khata OS - Purchases API Routes
// GET: List purchases with filtering, POST: Create new purchase
// Branch-scoped with strict multi-tenant isolation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  validateBranchAccess,
  ensureBranchForWrite,
  buildBranchWhereClause,
  branchErrorResponse
} from '@/lib/branch-context';

// Input type for creating a purchase item
interface PurchaseItemInput {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
}

// Input type for creating a purchase
interface CreatePurchaseInput {
  supplierId?: string;
  branchId?: string;
  items: PurchaseItemInput[];
  invoiceNo?: string;
  discount?: number;
  tax?: number;
  paidAmount?: number;
  notes?: string;
}

// GET /api/purchases - List all purchases with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');
    const branchId = request.headers.get('x-branch-id') || null;

    // SECURITY: Require businessId
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

    // Validate branch access if branchId provided
    if (branchId) {
      const branchValidation = await validateBranchAccess(businessId, branchId);
      if (!branchValidation.valid) {
        return branchErrorResponse(branchValidation.error!);
      }
    }

    // Build where clause with multi-tenant isolation
    const where: Prisma.PurchaseWhereInput = buildBranchWhereClause(businessId, branchId);

    // Apply filters
    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // Search by invoice number or supplier name
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    // Get total count for pagination
    const total = await db.purchase.count({ where });

    // Fetch purchases with items and supplier info
    const purchases = await db.purchase.findMany({
      where,
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
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            type: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            nameBn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform purchases for response
    const transformedPurchases = purchases.map((purchase) => ({
      ...purchase,
      supplierName: purchase.supplier?.name || null,
      supplierPhone: purchase.supplier?.phone || null,
      branchName: purchase.branch?.name || purchase.branch?.nameBn || null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPurchases,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        branchScope: branchId ? 'single' : 'all',
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch purchases' } },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const body: CreatePurchaseInput = await request.json();
    const {
      supplierId,
      branchId: providedBranchId,
      items,
      invoiceNo,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      notes,
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one item is required' } },
        { status: 400 }
      );
    }

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const headerBranchId = request.headers.get('x-branch-id');

    // SECURITY: Require businessId
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

    // ENFORCE branchId for write operations
    const branchIdToUse = providedBranchId || headerBranchId || null;

    const branchResult = await ensureBranchForWrite(businessId, branchIdToUse, userId || undefined);

    if (branchResult.error) {
      return branchErrorResponse(branchResult.error);
    }

    const branchId = branchResult.branchId!;

    // Validate and fetch all items
    const itemIds = items.map((item) => item.itemId);
    const dbItems = await db.item.findMany({
      where: {
        id: { in: itemIds },
        businessId,
      },
    });

    // Check all items exist
    if (dbItems.length !== itemIds.length) {
      const foundIds = dbItems.map((i) => i.id);
      const missingIds = itemIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Items not found: ${missingIds.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Create a map for quick item lookup
    const itemMap = new Map(dbItems.map((item) => [item.id, item]));

    // Prepare purchase items data
    const purchaseItemsData: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unitCost: number;
      total: number;
      newStock: number;
      previousStock: number;
    }> = [];

    for (const inputItem of items) {
      const dbItem = itemMap.get(inputItem.itemId);
      if (!dbItem) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Item not found: ${inputItem.itemId}` } },
          { status: 400 }
        );
      }

      const itemTotal = inputItem.quantity * inputItem.unitCost;

      purchaseItemsData.push({
        itemId: dbItem.id,
        itemName: inputItem.itemName || dbItem.name,
        quantity: inputItem.quantity,
        unitCost: inputItem.unitCost,
        total: itemTotal,
        newStock: dbItem.currentStock + inputItem.quantity,
        previousStock: dbItem.currentStock,
      });
    }

    // Calculate totals
    const subtotal = purchaseItemsData.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount + tax;
    const dueAmount = total - paidAmount;

    // Generate purchase number (format: PUR-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const purchasePrefix = `PUR-${dateStr}-`;

    // Find the last purchase number for today
    const lastPurchase = await db.purchase.findFirst({
      where: {
        businessId,
        invoiceNo: { startsWith: purchasePrefix },
      },
      orderBy: { invoiceNo: 'desc' },
    });

    let purchaseNumber = `${purchasePrefix}0001`;
    if (lastPurchase && lastPurchase.invoiceNo) {
      const lastNumber = parseInt(lastPurchase.invoiceNo.slice(-4), 10);
      purchaseNumber = `${purchasePrefix}${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Use Prisma transaction for data consistency
    const purchase = await db.$transaction(async (tx) => {
      // Create the purchase with MANDATORY branchId
      const newPurchase = await tx.purchase.create({
        data: {
          businessId,
          branchId,
          invoiceNo: invoiceNo || purchaseNumber,
          supplierId: supplierId || null,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          dueAmount,
          status: dueAmount > 0 ? 'pending' : 'received',
          notes: notes || null,
          createdBy: userId || null,
          items: {
            create: purchaseItemsData.map((item) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitCost: item.unitCost,
              total: item.total,
            })),
          },
        },
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
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
              type: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              nameBn: true,
            },
          },
        },
      });

      // Update item stock and create stock ledger entries
      for (const itemData of purchaseItemsData) {
        const dbItem = itemMap.get(itemData.itemId)!;

        // Update item stock and cost price
        await tx.item.update({
          where: { id: itemData.itemId },
          data: {
            currentStock: itemData.newStock,
            costPrice: itemData.unitCost, // Update cost price to latest purchase price
            lastPurchaseDate: new Date(),
          },
        });

        // Create stock ledger entry with branchId
        await tx.stockLedger.create({
          data: {
            businessId,
            branchId,
            itemId: itemData.itemId,
            type: 'purchase',
            quantity: itemData.quantity,
            previousStock: itemData.previousStock,
            newStock: itemData.newStock,
            referenceId: newPurchase.id,
            referenceType: 'purchase',
            createdBy: userId || null,
          },
        });
      }

      // Create party ledger entry for credit purchases
      if (supplierId && dueAmount > 0) {
        const supplier = await tx.party.findUnique({
          where: { id: supplierId },
        });

        if (supplier) {
          const newBalance = supplier.currentBalance + dueAmount;

          await tx.party.update({
            where: { id: supplierId },
            data: { currentBalance: newBalance },
          });

          await tx.partyLedger.create({
            data: {
              businessId,
              branchId,
              partyId: supplierId,
              type: 'purchase',
              referenceId: newPurchase.id,
              referenceType: 'purchase',
              amount: dueAmount,
              balance: newBalance,
              description: `Credit purchase - ${newPurchase.invoiceNo}`,
              date: new Date(),
            },
          });
        }
      }

      return newPurchase;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...purchase,
        supplierName: purchase.supplier?.name || null,
        supplierPhone: purchase.supplier?.phone || null,
        branchName: purchase.branch?.name || purchase.branch?.nameBn || null,
      },
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create purchase' } },
      { status: 500 }
    );
  }
}
