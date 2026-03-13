// SmartStore OS - Database Seed
// Pre-populate common inventory categories for new businesses

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common inventory categories for Bangladeshi SMEs
const defaultCategories = [
  // Grocery & Food Items
  { name: 'Rice & Grains', nameBn: 'চাল ও শস্য', description: 'Rice, wheat, and other grains' },
  { name: 'Cooking Oil', nameBn: 'রান্নার তেল', description: 'Mustard oil, soybean oil, sunflower oil' },
  { name: 'Spices', nameBn: 'মসলা', description: 'Turmeric, cumin, chili, coriander, etc.' },
  { name: 'Pulses & Lentils', nameBn: 'ডাল', description: 'Red lentils, chickpeas, mung beans' },
  { name: 'Sugar & Sweeteners', nameBn: 'চিনি ও মিষ্টি', description: 'Sugar, jaggery, honey' },
  { name: 'Flour & Atta', nameBn: 'আটা ও ময়দা', description: 'Wheat flour, rice flour, semolina' },
  { name: 'Salt', nameBn: 'লবণ', description: 'Table salt, sea salt' },

  // Snacks & Beverages
  { name: 'Biscuits & Cookies', nameBn: 'বিস্কুট', description: 'Packaged biscuits and cookies' },
  { name: 'Snacks', nameBn: 'স্ন্যাকস', description: 'Chips, chanachur, nimki' },
  { name: 'Tea & Coffee', nameBn: 'চা ও কফি', description: 'Tea leaves, coffee powder' },
  { name: 'Beverages', nameBn: 'পানীয়', description: 'Soft drinks, juice, water' },

  // Dairy & Frozen
  { name: 'Dairy Products', nameBn: 'দুগ্ধজাত পণ্য', description: 'Milk, curd, butter, cheese' },
  { name: 'Frozen Foods', nameBn: 'হিমায়িত খাবার', description: 'Frozen vegetables, fish, meat' },

  // Personal Care
  { name: 'Soaps & Shampoos', nameBn: 'সাবান ও শ্যাম্পু', description: 'Bathing soap, shampoo, conditioner' },
  { name: 'Toothpaste & Brush', nameBn: 'টুথপেস্ট ও ব্রাশ', description: 'Oral care products' },
  { name: 'Skin Care', nameBn: 'ত্বক যত্ন', description: 'Cream, lotion, powder' },
  { name: 'Hair Care', nameBn: 'চুলের যত্ন', description: 'Hair oil, hair cream' },

  // Household Items
  { name: 'Detergents', nameBn: 'ডিটারজেন্ট', description: 'Washing powder, liquid detergent' },
  { name: 'Cleaning Supplies', nameBn: 'পরিষ্কারের সামগ্রী', description: 'Floor cleaner, dish wash' },
  { name: 'Mosquito Repellent', nameBn: 'মশা নিরোধক', description: 'Coils, mats, sprays' },
  { name: 'Kitchen Items', nameBn: 'রান্নাঘরের সামগ্রী', description: 'Match boxes, lighters' },

  // Stationery
  { name: 'Notebooks & Paper', nameBn: 'খাতা ও কাগজ', description: 'Notebooks, exam pads' },
  { name: 'Pens & Pencils', nameBn: 'কলম ও পেন্সিল', description: 'Ball pens, gel pens, pencils' },
  { name: 'Office Supplies', nameBn: 'অফিস সরঞ্জাম', description: 'Staplers, folders, clips' },

  // Baby Products
  { name: 'Baby Food', nameBn: 'শিশু খাবার', description: 'Baby formula, cerelac' },
  { name: 'Baby Care', nameBn: 'শিশু যত্ন', description: 'Diapers, baby powder, lotion' },

  // Electronics & Accessories
  { name: 'Mobile Accessories', nameBn: 'মোবাইল এক্সেসরিজ', description: 'Chargers, covers, earphones' },
  { name: 'Batteries', nameBn: 'ব্যাটারি', description: 'AA, AAA, button cells' },
  { name: 'Electrical Items', nameBn: 'বৈদ্যুতিক সামগ্রী', description: 'Bulbs, switches, cables' },

  // Clothing & Textiles
  { name: 'Men\'s Clothing', nameBn: 'পুরুষদের পোশাক', description: 'Shirts, pants, t-shirts' },
  { name: 'Women\'s Clothing', nameBn: 'মহিলাদের পোশাক', description: 'Sarees, salwar, kameez' },
  { name: 'Kids\' Clothing', nameBn: 'বাচ্চাদের পোশাক', description: 'Kids wear' },
  { name: 'Fabrics', nameBn: 'কাপড়', description: 'Cotton, silk, synthetic fabrics' },

  // General
  { name: 'General Items', nameBn: 'সাধারণ পণ্য', description: 'Miscellaneous items' },
  { name: 'Gift Items', nameBn: 'উপহার সামগ্রী', description: 'Gift items and showpieces' },
];

async function seedCategories(businessId: string) {
  console.log('Seeding categories for business:', businessId);

  for (const category of defaultCategories) {
    try {
      await prisma.category.create({
        data: {
          businessId,
          name: category.name,
          nameBn: category.nameBn,
          description: category.description,
          itemCount: 0,
        },
      });
      console.log(`Created category: ${category.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`Category already exists: ${category.name}`);
      } else {
        console.error(`Error creating category ${category.name}:`, error);
      }
    }
  }
}

async function main() {
  console.log('Starting seed...');

  // Get all businesses
  const businesses = await prisma.business.findMany();

  if (businesses.length === 0) {
    console.log('No businesses found. Creating demo business...');

    // Create a demo business
    const business = await prisma.business.create({
      data: {
        name: 'Demo Store',
        nameBn: 'ডেমো স্টোর',
        type: 'retail',
        phone: '01700000000',
        email: 'demo@example.com',
        address: 'Dhaka, Bangladesh',
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
        language: 'bn',
        plan: 'free',
        isActive: true,
      },
    });

    // Create default user for demo business
    await prisma.user.create({
      data: {
        businessId: business.id,
        phone: '01700000000',
        name: 'Demo User',
        role: 'owner',
        isActive: true,
      },
    });

    // Create default account
    await prisma.account.create({
      data: {
        businessId: business.id,
        name: 'Cash',
        nameBn: 'নগদ',
        type: 'cash',
        currentBalance: 0,
        openingBalance: 0,
        status: 'active',
        isDefault: true,
      },
    });

    // Seed categories for demo business
    await seedCategories(business.id);
  } else {
    // Seed categories for all existing businesses
    for (const business of businesses) {
      await seedCategories(business.id);
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
