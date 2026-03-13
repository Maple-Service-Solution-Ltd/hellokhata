// Hello Khata OS - Expenses API
// Expense management with multi-tenant isolation and branch enforcement

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  validateBranchAccess, 
  ensureBranchForWrite,
  buildBranchWhereClause,
  branchErrorResponse 
} from '@/lib/branch-context';

// GET /api/expenses - List expenses with filtering
// Supports branch-scoped and all-branches mode
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const headerBranchId = request.headers.get('x-branch-id') || null; // null = All Branches mode

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate branch access if branchId provided
    if (headerBranchId) {
      const branchValidation = await validateBranchAccess(businessId, headerBranchId);
      if (!branchValidation.valid) {
        return branchErrorResponse(branchValidation.error!);
      }
    }

    // Build where clause with branch scope
    const where: any = buildBranchWhereClause(businessId, headerBranchId);

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, nameBn: true, icon: true, color: true },
          },
          branch: {
            select: { id: true, name: true, nameBn: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    // Calculate totals
    const totals = await db.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: expenses.map(expense => ({
        ...expense,
        branchName: expense.branch?.name || expense.branch?.nameBn || null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalAmount: totals._sum.amount || 0,
        branchScope: headerBranchId ? 'single' : 'all',
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch expenses' },
    }, { status: 500 });
  }
}

// POST /api/expenses - Create new expense
// REQUIRES a specific branch - All Branches mode is not allowed for writes
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    const headerBranchId = request.headers.get('x-branch-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      categoryId,
      accountId,
      amount,
      description,
      date,
      receipt,
      branchId: providedBranchId,
    } = body;

    if (!categoryId || !amount || !description) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Category, amount, and description are required' },
      }, { status: 400 });
    }

    // ENFORCE branchId for write operations
    const branchIdToUse = providedBranchId || headerBranchId || null;
    const branchResult = await ensureBranchForWrite(businessId, branchIdToUse, userId || undefined);
    
    if (branchResult.error) {
      return branchErrorResponse(branchResult.error);
    }
    
    const branchId = branchResult.branchId!; // Guaranteed to be set

    // Verify category exists
    const category = await db.expenseCategory.findFirst({
      where: { id: categoryId, businessId },
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Expense category not found' },
      }, { status: 400 });
    }

    // Use transaction to create expense and update account balance
    const expense = await db.$transaction(async (tx) => {
      // Create the expense with MANDATORY branchId
      const newExpense = await tx.expense.create({
        data: {
          businessId,
          categoryId,
          accountId,
          amount: parseFloat(amount),
          description,
          date: date ? new Date(date) : new Date(),
          receipt,
          branchId, // ALWAYS set for branch isolation
          createdBy: userId,
        },
        include: {
          category: {
            select: { id: true, name: true, nameBn: true, icon: true, color: true },
          },
          branch: {
            select: { id: true, name: true, nameBn: true },
          },
        },
      });

      // If accountId is provided, deduct from account balance
      if (accountId) {
        const account = await tx.account.findUnique({
          where: { id: accountId },
        });

        if (account) {
          await tx.account.update({
            where: { id: accountId },
            data: {
              currentBalance: account.currentBalance - parseFloat(amount),
            },
          });
        }
      } else {
        // If no account specified, deduct from default cash account for the branch
        const cashAccount = await tx.account.findFirst({
          where: { businessId, type: 'cash', branchId },
        });

        if (cashAccount) {
          await tx.account.update({
            where: { id: cashAccount.id },
            data: {
              currentBalance: cashAccount.currentBalance - parseFloat(amount),
            },
          });
        }
      }

      return newExpense;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...expense,
        branchName: expense.branch?.name || expense.branch?.nameBn || null,
      },
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create expense' },
    }, { status: 500 });
  }
}
