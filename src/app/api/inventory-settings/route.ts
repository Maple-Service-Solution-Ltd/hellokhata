// Hello Khata OS - Inventory Settings API
// হ্যালো খাতা - ইনভেন্টরি সেটিংস এপিআই

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo purposes
// In production, this would be stored in database per business
let inventorySettings = {
  lowStockThreshold: 10,
  lowStockAlerts: true,
  stockWarningNotifications: true,
  updatedAt: new Date().toISOString(),
};

// GET - Get inventory settings
export async function GET() {
  return NextResponse.json({
    success: true,
    data: inventorySettings,
  });
}

// PUT - Update inventory settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lowStockThreshold, lowStockAlerts, stockWarningNotifications } = body;

    // Validation
    if (typeof lowStockThreshold !== 'undefined') {
      if (typeof lowStockThreshold !== 'number' || lowStockThreshold < 0) {
        return NextResponse.json(
          { success: false, error: 'Low stock threshold must be a positive number' },
          { status: 400 }
        );
      }
    }

    inventorySettings = {
      ...inventorySettings,
      ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      ...(lowStockAlerts !== undefined && { lowStockAlerts }),
      ...(stockWarningNotifications !== undefined && { stockWarningNotifications }),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: inventorySettings,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Update inventory settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
