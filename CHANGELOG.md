# SmartStore OS - Changelog

## [Unreleased] - 2025-01-XX

### Added Features

#### Feature 1: Low Stock Alert
- **Inventory Page**: Stock badge indicators (OK / LOW / OUT) on each item
- **Inventory Settings**: Default low stock threshold configuration (`/settings/inventory`)
- **Dashboard**: Low stock items card with count and link to filtered inventory view
- **Stock filters**: Filter items by stock status (All / Low Stock / Out of Stock)

#### Feature 2: Party Category + Opening Balance
- **Party Categories Management**: CRUD operations at `/settings/party-categories`
- **Party Form**: Opening balance amount and type (Receivable/Payable) fields
- **Party List**: Filter by category and receivable/payable status
- **Party Summary Cards**: Total Receivable, Total Payable, Net balance display

#### Feature 3: Quotation Module
- **Quotations List**: `/sales/quotations` - View all quotations with status badges
- **Create Quotation**: `/sales/quotations/new` - Full quotation creation form
  - Party selection
  - Item search and add
  - Quantity, unit price, discount per item
  - Tax and discount totals
  - Validity date picker
  - Notes field
  - Save Draft / Mark as Sent buttons
- **Quotation Status**: Draft, Sent, Accepted, Rejected, Converted
- **Actions**: View, Edit, Convert to Sale, Delete

#### Feature 4: Invoice Customization
- **Invoice Settings**: `/settings/invoice`
  - Logo upload with preview
  - Business info fields (name, address, phone)
  - Invoice number prefix with live preview
  - Footer note
  - Default paper size selection (A4/A5)
- **Print/Export UI**: Print A4, Print A5, Download PDF buttons (stub)

#### Feature 5: Enhanced Reports
- **Sales Report**: `/reports/sales` - Sales summary, charts, detailed table, export options
- **Party Ledger**: `/reports/party-ledger` - Full party transaction history with running balance
- **Stock Report**: `/reports/stock` - Inventory valuation and stock status
- **Expense Report**: `/reports/expenses` - Expense breakdown by category
- **Profit/Loss Report**: `/reports/profit` - P&L statement with margins
- **Export Options**: CSV, PDF, Print buttons on all reports

#### Feature 6: Bill Photo Upload
- **Expense Form**: Bill/receipt photo upload at `/expenses/new`
  - Drag & drop upload zone
  - Image and PDF file support
  - Preview thumbnail for images
  - Full-size image lightbox viewer
  - File metadata display (name, size, type)
  - "Extract details (AI)" button (Coming soon)
  - Remove file option

#### Feature 7: Multi-Price (MRP + Wholesale)
- **Item Form**: Multiple price fields at `/inventory/new`
  - Cost Price (purchase price)
  - Retail Price (MRP)
  - Wholesale Price (optional)
  - VIP Price (optional)
  - Minimum Price (optional)
  - Real-time margin preview for each price type
  - Best margin indicator
- **Inventory Page**: 
  - Wholesale/VIP price badges
  - Multi-price filter option
  - Price summary card

#### Feature 8: Backup + Export
- **Data Settings**: `/settings/data`
  - Create backup button with timestamp
  - Last backup timestamp display
  - Auto-backup toggle (Coming soon)
  - Export buttons: Sales CSV, Inventory CSV, Parties CSV, All Data JSON

### Navigation Updates
- Added "Quotations" menu item under Sales in sidebar
- Updated Settings page with new settings categories:
  - Invoice Settings
  - Party Categories
  - Inventory Settings
  - Data (Backup & Export)

### UI/UX Improvements
- Consistent dark theme styling across all new pages
- Bangla/English bilingual support throughout
- Responsive layouts for mobile and desktop
- Toast notifications for all actions

---

## Backend TODO Endpoints

The following backend API endpoints are needed for full functionality:

### Quotations
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `POST /api/quotations/:id/convert` - Convert to sale

### Invoice Settings
- `GET /api/settings/invoice` - Get invoice settings
- `PUT /api/settings/invoice` - Update invoice settings
- `POST /api/settings/invoice/logo` - Upload logo

### Party Categories
- `GET /api/party-categories` - List categories
- `POST /api/party-categories` - Create category
- `PUT /api/party-categories/:id` - Update category
- `DELETE /api/party-categories/:id` - Delete category

### Inventory Settings
- `GET /api/settings/inventory` - Get inventory settings
- `PUT /api/settings/inventory` - Update inventory settings

### Backup & Export
- `POST /api/backup/create` - Create backup
- `GET /api/backup/latest` - Get latest backup info
- `GET /api/export/sales` - Export sales CSV
- `GET /api/export/inventory` - Export inventory CSV
- `GET /api/export/parties` - Export parties CSV
- `GET /api/export/all` - Export all data JSON

### Reports
- `GET /api/reports/sales` - Sales report data
- `GET /api/reports/party-ledger/:id` - Party ledger data
- `GET /api/reports/stock` - Stock report data
- `GET /api/reports/expenses` - Expense report data
- `GET /api/reports/profit` - Profit/Loss report data

### Bill Upload
- `POST /api/expenses/:id/attachment` - Upload bill attachment
- `DELETE /api/expenses/:id/attachment` - Delete attachment

---

## Technical Notes

- All new pages follow existing component patterns
- Uses shadcn/ui components from `@/components/ui/premium`
- Maintains Elite SaaS design system consistency
- Supports both dark and light themes
- All forms include proper validation states
