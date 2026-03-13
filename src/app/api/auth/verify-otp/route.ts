// Hello Khata OS - Verify OTP API
// Authenticates user and creates session
// Updated: Force rebuild

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAX_OTP_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, name, businessName, businessType } = body;

    if (!phone || !otp) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Phone and OTP are required',
          messageBn: 'ফোন এবং OTP প্রয়োজন',
        },
      }, { status: 400 });
    }

    // Find valid OTP
    const otpRecord = await db.otp.findFirst({
      where: {
        phone,
        code: otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      // Increment attempts on existing OTP
      const existingOtp = await db.otp.findFirst({
        where: { phone, verified: false, expiresAt: { gt: new Date() } },
      });

      if (existingOtp) {
        await db.otp.update({
          where: { id: existingOtp.id },
          data: { attempts: { increment: 1 } },
        });

        if (existingOtp.attempts + 1 >= MAX_OTP_ATTEMPTS) {
          await db.otp.delete({ where: { id: existingOtp.id } });
        }
      }

      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired OTP',
          messageBn: 'ভুল বা মেয়াদোত্তীর্ণ OTP',
        },
      }, { status: 400 });
    }

    // Mark OTP as verified
    await db.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find or create user - use findFirst to be compatible with schema changes
    let user = await db.user.findFirst({
      where: { phone },
      include: { business: true },
    });

    let isNewUser = false;

    if (!user) {
      // Create new business and user (registration)
      isNewUser = true;

      const business = await db.business.create({
        data: {
          name: businessName || `Business of ${phone}`,
          nameBn: businessName ? undefined : `${phone} এর ব্যবসা`,
          type: businessType || 'retail',
          phone,
          plan: 'free',
        },
      });

      user = await db.user.create({
        data: {
          businessId: business.id,
          phone,
          name: name || phone,
          role: 'owner',
          isActive: true,
        },
        include: { business: true },
      });

      // Create default item categories for new business
      const defaultCategories = [
        // Grocery & Food
        { name: 'Rice & Grains', nameBn: 'চাল ও শস্য', description: 'Rice, wheat, flour, puffed rice' },
        { name: 'Cooking Oil & Ghee', nameBn: 'তেল ও ঘি', description: 'Mustard oil, soybean oil, sunflower oil, ghee' },
        { name: 'Spices', nameBn: 'মসলা', description: 'Turmeric, cumin, chili, coriander, pepper' },
        { name: 'Pulses & Lentils', nameBn: 'ডাল', description: 'Red lentils, chickpeas, mung beans' },
        { name: 'Sugar & Salt', nameBn: 'চিনি ও লবণ', description: 'Sugar, jaggery, salt' },
        { name: 'Tea & Coffee', nameBn: 'চা ও কফি', description: 'Tea leaves, coffee, milk powder' },
        // Snacks & Beverages
        { name: 'Biscuits & Bakery', nameBn: 'বিস্কুট ও বেকারি', description: 'Biscuits, cakes, bread' },
        { name: 'Snacks', nameBn: 'স্ন্যাকস', description: 'Chips, chanachur, nimki' },
        { name: 'Beverages', nameBn: 'পানীয়', description: 'Soft drinks, juice, mineral water' },
        { name: 'Sweets & Confectionery', nameBn: 'মিষ্টি ও মিঠাই', description: 'Candy, chocolate, sweets' },
        // Personal Care
        { name: 'Soaps & Shampoos', nameBn: 'সাবান ও শ্যাম্পু', description: 'Bathing soap, shampoo, conditioner' },
        { name: 'Oral Care', nameBn: 'দাঁতের যত্ন', description: 'Toothpaste, toothbrush, mouthwash' },
        { name: 'Skin Care', nameBn: 'ত্বক যত্ন', description: 'Cream, lotion, powder, petroleum jelly' },
        { name: 'Hair Care', nameBn: 'চুলের যত্ন', description: 'Hair oil, hair cream, comb' },
        // Household
        { name: 'Detergents', nameBn: 'ডিটারজেন্ট', description: 'Washing powder, liquid detergent' },
        { name: 'Cleaning Supplies', nameBn: 'পরিষ্কারের সামগ্রী', description: 'Floor cleaner, dish wash, brush' },
        { name: 'Kitchen Items', nameBn: 'রান্নাঘরের সামগ্রী', description: 'Match box, lighter, foil, tissue' },
        { name: 'Mosquito Repellent', nameBn: 'মশা নিরোধক', description: 'Coils, mats, sprays, nets' },
        // Baby Products
        { name: 'Baby Food', nameBn: 'শিশু খাবার', description: 'Baby formula, cerelac, baby food' },
        { name: 'Baby Care', nameBn: 'শিশু যত্ন', description: 'Diapers, baby powder, lotion, wipes' },
        // Electronics & Stationery
        { name: 'Mobile Accessories', nameBn: 'মোবাইল এক্সেসরিজ', description: 'Chargers, covers, earphones' },
        { name: 'Batteries & Electrical', nameBn: 'ব্যাটারি ও বৈদ্যুতিক', description: 'Batteries, bulbs, switches' },
        { name: 'Stationery', nameBn: 'স্টেশনারি', description: 'Notebooks, pens, pencils, paper' },
        // General
        { name: 'General Items', nameBn: 'সাধারণ পণ্য', description: 'Miscellaneous items' },
        { name: 'Gift Items', nameBn: 'উপহার সামগ্রী', description: 'Gifts and showpieces' },
      ];

      await db.category.createMany({
        data: defaultCategories.map(cat => ({
          businessId: business.id,
          name: cat.name,
          nameBn: cat.nameBn,
          description: cat.description,
        })),
      });

      // Create default expense categories for new business
      const defaultExpenseCategories = [
        { name: 'বিদ্যুৎ বিল', nameBn: 'বিদ্যুৎ বিল', icon: 'Zap', color: '#F59E0B', isDefault: true },
        { name: 'পানি বিল', nameBn: 'পানি বিল', icon: 'Droplets', color: '#3B82F6', isDefault: true },
        { name: 'ভাড়া', nameBn: 'ভাড়া', icon: 'Home', color: '#8B5CF6', isDefault: true },
        { name: 'পরিবহন', nameBn: 'পরিবহন', icon: 'Truck', color: '#10B981', isDefault: true },
        { name: 'বেতন', nameBn: 'বেতন', icon: 'Users', color: '#EC4899', isDefault: true },
        { name: 'অন্যান্য', nameBn: 'অন্যান্য', icon: 'MoreHorizontal', color: '#6B7280', isDefault: true },
      ];

      await db.expenseCategory.createMany({
        data: defaultExpenseCategories.map(cat => ({
          businessId: business.id,
          name: cat.name,
          nameBn: cat.nameBn,
          icon: cat.icon,
          color: cat.color,
          isDefault: cat.isDefault,
        })),
      });

      // Create default cash account for new business
      await db.account.create({
        data: {
          businessId: business.id,
          name: 'ক্যাশ ড্রয়ার',
          nameBn: 'ক্যাশ ড্রয়ার',
          type: 'cash',
          currentBalance: 0,
          openingBalance: 0,
          status: 'active',
          isDefault: true,
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled',
          messageBn: 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে',
        },
      }, { status: 403 });
    }

    // Generate session token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Get features based on plan
    const planFeatures: Record<string, string[]> = {
      free: ['globalSearch'],
      business: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 'staffPerformance'],
      pro: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 'staffPerformance', 'auditTrail', 'advancedPricing', 'healthScore', 'deadStockAnalysis', 'dataExport', 'advancedReports'],
      ai: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 'staffPerformance', 'auditTrail', 'advancedPricing', 'healthScore', 'deadStockAnalysis', 'dataExport', 'advancedReports', 'aiAssistant'],
    };

    const features = planFeatures[user.business.plan] || planFeatures.free;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
          branchId: user.branchId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        business: {
          id: user.business.id,
          name: user.business.name,
          nameBn: user.business.nameBn,
          type: user.business.type,
          phone: user.business.phone,
          email: user.business.email,
          address: user.business.address,
          currency: user.business.currency,
          timezone: user.business.timezone,
          language: user.business.language,
          isActive: user.business.isActive,
          hasMultipleBranches: false,
          createdAt: user.business.createdAt,
          updatedAt: user.business.updatedAt,
        },
        plan: user.business.plan,
        features: {
          aiAssistant: features.includes('aiAssistant'),
          multiStaff: features.includes('staffPerformance'),
          advancedReports: features.includes('advancedReports'),
          dataExport: features.includes('dataExport'),
          unlimitedItems: features.includes('unlimitedItems') || user.business.plan !== 'free',
          unlimitedParties: features.includes('unlimitedParties') || user.business.plan !== 'free',
          multiBranch: features.includes('multiBranch'),
          creditControl: features.includes('creditControl'),
          auditTrail: features.includes('auditTrail'),
          advancedPricing: features.includes('advancedPricing'),
          healthScore: features.includes('healthScore'),
          reconciliation: features.includes('reconciliation'),
          staffPerformance: features.includes('staffPerformance'),
          deadStockAnalysis: features.includes('deadStockAnalysis'),
          globalSearch: features.includes('globalSearch'),
        },
        isNewUser,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        messageBn: 'প্রমাণীকরণ ব্যর্থ হয়েছে',
      },
    }, { status: 500 });
  }
}
