// Hello Khata OS - Sales API Routes
// GET: List sales with filtering, POST: Create new sale
// Branch-scoped with strict multi-tenant isolation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { SaleStatus, PaymentMethod, PricingTier } from '@/types';
import { 
  validateBranchAccess, 
  validateBranchForWrite,
  ensureBranchForWrite,
  buildBranchWhereClause,
  branchErrorResponse 
} from '@/lib/branch-context';

// Input type for creating a sale item
interface SaleItemInput {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Input type for creating a sale
interface CreateSaleInput {
  partyId?: string;
  branchId?: string; // Optional - will use current branch context if not provided
  items: SaleItemInput[];
  discount?: number;
  tax?: number;
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  pricingTier?: PricingTier;
  notes?: string;
}

// GET /api/sales - List all sales with filtering
// Supports branch-scoped and all-branches mode
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partyId = searchParams.get('partyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status') as SaleStatus | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get business ID from headers for multi-tenant isolation
    const businessId = request.headers.get('x-business-id');
    const branchId = request.headers.get('x-branch-id') || null; // null = All Branches mode

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
    const where: Prisma.SaleWhereInput = buildBranchWhereClause(businessId, branchId);

    // Apply filters
    if (partyId) {
      where.partyId = partyId;
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

    // Search by invoice number
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { party: { name: { contains: search } } },
      ];
    }

    // Get total count for pagination
    const total = await db.sale.count({ where });

    // Fetch sales with items and party info
    const sales = await db.sale.findMany({
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
        party: {
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

    // Transform sales for response
    const transformedSales = sales.map((sale) => ({
      ...sale,
      partyName: sale.party?.name || null,
      partyPhone: sale.party?.phone || null,
      branchName: sale.branch?.name || sale.branch?.nameBn || null,
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
    }));

    return NextResponse.json({
      success: true,
      data: transformedSales,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        branchScope: branchId ? 'single' : 'all',
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch sales' } },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create new sale
// REQUIRES a specific branch - All Branches mode is not allowed for writes
export async function POST(request: NextRequest) {
  try {
    const body: CreateSaleInput = await request.json();
    const {
      partyId,
      branchId: providedBranchId,
      items,
      discount = 0,
      tax = 0,
      paymentMethod = 'cash',
      paidAmount = 0,
      pricingTier,
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
    // Priority: providedBranchId > headerBranchId > default branch
    const branchIdToUse = providedBranchId || headerBranchId || null;
    
    const branchResult = await ensureBranchForWrite(businessId, branchIdToUse, userId || undefined);
    
    if (branchResult.error) {
      return branchErrorResponse(branchResult.error);
    }
    
    const branchId = branchResult.branchId!; // Guaranteed to be set after ensureBranchForWrite

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

    // Validate stock availability and prepare sale items
    const saleItemsData: Array<{
      itemId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      discount: number;
      total: number;
      profit: number;
      newStock: number;
    }> = [];

    for (const inputItem of items) {
      const dbItem = itemMap.get(inputItem.itemId);
      if (!dbItem) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Item not found: ${inputItem.itemId}` } },
          { status: 400 }
        );
      }

      // Check stock availability
      if (dbItem.currentStock < inputItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for ${dbItem.name}. Available: ${dbItem.currentStock}, Requested: ${inputItem.quantity}`,
            },
          },
          { status: 400 }
        );
      }

      const itemDiscount = inputItem.discount || 0;
      const itemTotal = inputItem.quantity * inputItem.unitPrice - itemDiscount;
      const itemProfit = (inputItem.unitPrice - dbItem.costPrice) * inputItem.quantity - itemDiscount;

      saleItemsData.push({
        itemId: dbItem.id,
        itemName: inputItem.itemName || dbItem.name,
        quantity: inputItem.quantity,
        unitPrice: inputItem.unitPrice,
        costPrice: dbItem.costPrice,
        discount: itemDiscount,
        total: itemTotal,
        profit: itemProfit,
        newStock: dbItem.currentStock - inputItem.quantity,
      });
    }

    // Calculate totals
    const subtotal = saleItemsData.reduce((sum, item) => sum + item.total, 0);
    const totalProfit = saleItemsData.reduce((sum, item) => sum + item.profit, 0);
    const total = subtotal - discount + tax;
    const dueAmount = total - paidAmount;

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const invoicePrefix = `INV-${dateStr}-`;

    // Find the last invoice number for today
    const lastSale = await db.sale.findFirst({
      where: {
        businessId,
        invoiceNo: { startsWith: invoicePrefix },
      },
      orderBy: { invoiceNo: 'desc' },
    });

    let invoiceNumber = `${invoicePrefix}0001`;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.invoiceNo.slice(-4), 10);
      invoiceNumber = `${invoicePrefix}${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Use Prisma transaction for data consistency
    const sale = await db.$transaction(async (tx) => {
      // Create the sale with MANDATORY branchId
      const newSale = await tx.sale.create({
        data: {
          businessId,
          branchId, // ALWAYS set - required for branch isolation
          invoiceNo: invoiceNumber,
          partyId: partyId || null,
          subtotal,
          discount,
          tax,
          total,
          paidAmount,
          dueAmount,
          paymentMethod,
          pricingTier: pricingTier || null,
          status: dueAmount > 0 ? 'pending' : 'completed',
          profit: totalProfit,
          notes: notes || null,
          createdBy: userId || null,
          items: {
            create: saleItemsData.map((item) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              discount: item.discount,
              total: item.total,
              profit: item.profit,
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
          party: {
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
      for (const itemData of saleItemsData) {
        const dbItem = itemMap.get(itemData.itemId)!;

        // Update item stock
        await tx.item.update({
          where: { id: itemData.itemId },
          data: {
            currentStock: itemData.newStock,
            lastSaleDate: new Date(),
          },
        });

        // Create stock ledger entry with branchId
        await tx.stockLedger.create({
          data: {
            businessId,
            branchId, // ALWAYS set for stock movements
            itemId: itemData.itemId,
            type: 'sale',
            quantity: -itemData.quantity,
            previousStock: dbItem.currentStock,
            newStock: itemData.newStock,
            referenceId: newSale.id,
            referenceType: 'sale',
            createdBy: userId || null,
          },
        });
      }

      // Create party ledger entry for credit sales
      if (partyId && dueAmount > 0) {
        const party = await tx.party.findUnique({
          where: { id: partyId },
        });

        if (party) {
          const newBalance = party.currentBalance + dueAmount;

          await tx.party.update({
            where: { id: partyId },
            data: { currentBalance: newBalance },
          });

          await tx.partyLedger.create({
            data: {
              businessId,
              branchId, // ALWAYS set for party ledger
              partyId,
              type: 'sale',
              referenceId: newSale.id,
              referenceType: 'sale',
              amount: dueAmount,
              balance: newBalance,
              description: `Credit sale - Invoice ${invoiceNumber}`,
              date: new Date(),
            },
          });
        }
      }

      // Update account balance when payment is received
      if (paidAmount > 0) {
        const accountType = paymentMethod === 'cash' ? 'cash' : 
                           paymentMethod === 'card' ? 'bank' : 
                           paymentMethod === 'mobile_banking' ? 'mobile_wallet' : 'cash';

        let account = await tx.account.findFirst({
          where: { businessId, type: accountType, branchId },
        });

        if (!account) {
          const accountNames: Record<string, { name: string; nameBn: string }> = {
            cash: { name: 'Cash', nameBn: 'নগদ' },
            bank: { name: 'Bank', nameBn: 'ব্যাংক' },
            mobile_wallet: { name: 'Mobile Wallet', nameBn: 'মোবাইল ওয়ালেট' },
          };
          
          account = await tx.account.create({
            data: {
              businessId,
              branchId, // Set branch for account
              name: accountNames[accountType]?.name || 'Cash',
              nameBn: accountNames[accountType]?.nameBn || 'নগদ',
              type: accountType,
              isDefault: true,
              status: 'active',
              currentBalance: 0,
            },
          });
        }

        await tx.account.update({
          where: { id: account.id },
          data: { 
            currentBalance: account.currentBalance + paidAmount,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...sale,
        partyName: sale.party?.name || null,
        partyPhone: sale.party?.phone || null,
        branchName: sale.branch?.name || sale.branch?.nameBn || null,
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
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create sale' } },
      { status: 500 }
    );
  }
}
