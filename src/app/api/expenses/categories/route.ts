// Hello Khata OS - Expense Categories API
// Expense categories with multi-tenant isolation

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default expense categories for new businesses
const DEFAULT_CATEGORIES = [
  { name: 'Rent', nameBn: 'ভাড়া', icon: 'home', color: '#4F46E5' },
  { name: 'Utilities', nameBn: 'ইউটিলিটি', icon: 'zap', color: '#F59E0B' },
  { name: 'Salaries', nameBn: 'বেতন', icon: 'users', color: '#10B981' },
  { name: 'Supplies', nameBn: 'সাপ্লাই', icon: 'package', color: '#6366F1' },
  { name: 'Transport', nameBn: 'পরিবহন', icon: 'truck', color: '#EC4899' },
  { name: 'Marketing', nameBn: 'মার্কেটিং', icon: 'megaphone', color: '#8B5CF6' },
  { name: 'Maintenance', nameBn: 'রক্ষণাবেক্ষণ', icon: 'tool', color: '#14B8A6' },
  { name: 'Other', nameBn: 'অন্যান্য', icon: 'more-horizontal', color: '#6B7280' },
];

// GET /api/expenses/categories - List expense categories
export async function GET(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    let categories = await db.expenseCategory.findMany({
      where: { businessId },
      orderBy: { name: 'asc' },
    });

    // Create default categories if none exist
    if (categories.length === 0) {
      categories = await Promise.all(
        DEFAULT_CATEGORIES.map((cat) =>
          db.expenseCategory.create({
            data: {
              businessId,
              ...cat,
              isDefault: true,
            },
          })
        )
      );
    }

    // Get expense count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await db.expense.count({
          where: { categoryId: cat.id },
        });
        return { ...cat, expenseCount: count };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Get expense categories error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch expense categories' },
    }, { status: 500 });
  }
}

// POST /api/expenses/categories - Create expense category
export async function POST(request: NextRequest) {
  try {
    const businessId = request.headers.get('x-business-id');

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business ID required' },
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, nameBn, icon, color } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Category name is required' },
      }, { status: 400 });
    }

    // Check for duplicate
    const existing = await db.expenseCategory.findFirst({
      where: { businessId, name },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: { code: 'DUPLICATE', message: 'Category already exists' },
      }, { status: 400 });
    }

    const category = await db.expenseCategory.create({
      data: {
        businessId,
        name,
        nameBn,
        icon,
        color,
        isDefault: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Create expense category error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create expense category' },
    }, { status: 500 });
  }
}
