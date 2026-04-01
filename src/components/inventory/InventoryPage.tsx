// Hello Khata OS - Premium Inventory Page
// Elite SaaS Design - Dark Theme First
// Multi-Price Support

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, KPICard, Divider, EmptyState, Progress } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Box,
  Eye,
  Edit,
  MoreVertical,
  ChevronRight,
  BarChart3,
  DollarSign,
  Crown,
  Star,
  Tag,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Truck,
  Settings,
  Upload,
  Download,
  Tags,
  Trash2,
} from 'lucide-react';
import { useItems, useCategories } from '@/hooks/queries';
import { useCurrency, useDateFormat } from '@/hooks/useAppTranslation';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { DetailModal, DetailRow, DetailSection } from '@/components/shared/DetailModal';
import type { Item } from '@/types';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportItemsModal } from './ImportItemsModal';
import { ExportItemsModal } from './ExportItemsModal';
import { CategoriesModal } from './CategoriesModal';
import { useRouter } from 'next/navigation';
import { useDeleteItem, useGetItems, useGetItemsCategories } from '@/hooks/api/useItems';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function InventoryPage() {
  const { t, isBangla } = useAppTranslation();
  const { formatCurrency, formatNumber } = useCurrency();
  const { navigateTo } = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  const { data: itemsData, isLoading: itemsLoading, refetch } = useGetItems();
  const { data: categoriesData } = useGetItemsCategories();
  const router = useRouter();

  const items = itemsData?.data;
  const categories = categoriesData?.data;

  // Filter items
  const filteredItems = (items || [])?.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && item.currentStock <= item.minStock) ||
      (stockFilter === 'out' && item.currentStock === 0);

    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'wholesale' && item.wholesalePrice && item.wholesalePrice > 0) ||
      (priceFilter === 'vip' && item.vipPrice && item.vipPrice > 0) ||
      (priceFilter === 'multi' && (item.wholesalePrice || item.vipPrice || item.minimumPrice));

    return matchesSearch && matchesCategory && matchesStock && matchesPrice;
  });

  // Calculate stats
  const totalItems = (items || []).length;
  const totalStock = (items || []).reduce((sum, item) => sum + item.currentStock, 0);
  const stockValue = (items || []).reduce((sum, item) => sum + (item.costPrice * item.currentStock), 0);
  const lowStockCount = (items || []).filter((item) => item.currentStock <= item.minStock).length;

  // Multi-price stats
  const wholesaleItems = (items || []).filter((item) => item.wholesalePrice && item.wholesalePrice > 0).length;
  const vipItems = (items || []).filter((item) => item.vipPrice && item.vipPrice > 0).length;
  const multiPriceItems = (items || []).filter((item) => item.wholesalePrice || item.vipPrice || item.minimumPrice).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              {t('inventory.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
              {isBangla ? 'পণ্য ও স্টক ব্যবস্থাপনা' : 'Product & stock management'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isBangla ? 'পণ্য আমদানি' : 'Import Items'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  {isBangla ? 'পণ্য রপ্তানি' : 'Export Items'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCategoriesModal(true)}>
                  <Tags className="h-4 w-4 mr-2" />
                  {isBangla ? 'ক্যাটাগরি ব্যবস্থাপনা' : 'Manage Categories'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo('settings-inventory')}>
                  <Settings className="h-4 w-4 mr-2" />
                  {isBangla ? 'উন্নত সেটিংস' : 'Advanced Settings'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stock Actions */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => router.push('/inventory/stock-adjustment')}>
                <ArrowUpCircle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline whitespace-nowrap">{isBangla ? 'সংশোধন' : 'Adjust'}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('inventory/stock-transfer')}>
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline whitespace-nowrap">{isBangla ? 'স্থানান্তর' : 'Transfer'}</span>
              </Button>
            </div>
            <Button onClick={() => router.push('/purchases/new')} variant="secondary" className="shrink-0">
              <Truck className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">{isBangla ? 'স্টক যোগ' : 'Add Stock'}</span>
            </Button>
            <Button onClick={() => router.push('/inventory/new')} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">{t('inventory.addItem')}</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Items"
            titleBn="মোট পণ্য"
            value={totalItems}
            icon={<Package className="h-5 w-5" />}
            iconColor="indigo"
            isBangla={isBangla}
          />
          <KPICard
            title="Total Stock"
            titleBn="মোট স্টক"
            value={totalStock}
            icon={<Box className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
          <KPICard
            title="Stock Value"
            titleBn="স্টকের মূল্য"
            value={stockValue}
            prefix="৳"
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="emerald"
            isBangla={isBangla}
          />
          <KPICard
            title="Low Stock"
            titleBn="স্টক কম"
            value={lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconColor={lowStockCount > 0 ? 'warning' : 'emerald'}
            isBangla={isBangla}
          />
        </div>

        {/* Multi-Price Summary */}
        {multiPriceItems > 0 && (
          <Card variant="elevated" padding="default">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {isBangla ? 'মাল্টি-প্রাইস পণ্য' : 'Multi-Price Items'}
                </h3>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {isBangla
                    ? `${multiPriceItems}টি পণ্যে একাধিক মূল্য সেট করা আছে`
                    : `${multiPriceItems} items have multiple price tiers`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {wholesaleItems > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo/10 whitespace-nowrap">
                    <Package className="h-3.5 w-3.5 text-indigo shrink-0" />
                    <span className="text-xs font-medium text-indigo">{wholesaleItems}</span>
                    <span className="text-xs text-muted-foreground">{isBangla ? 'পাইকারি' : 'Wholesale'}</span>
                  </div>
                )}
                {vipItems > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 whitespace-nowrap">
                    <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span className="text-xs font-medium text-warning">{vipItems}</span>
                    <span className="text-xs text-muted-foreground">VIP</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card variant="elevated" padding="default">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                placeholder={isBangla ? 'পণ্যের নাম, SKU বা বারকোড খুঁজুন...' : 'Search by name, SKU or barcode...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={isBangla ? 'ক্যাটাগরি' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব ক্যাটাগরি' : 'All Categories'}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nameBn || cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder={isBangla ? 'স্টক' : 'Stock'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব' : 'All'}</SelectItem>
                <SelectItem value="low">{isBangla ? 'স্টক কম' : 'Low Stock'}</SelectItem>
                <SelectItem value="out">{isBangla ? 'স্টক শেষ' : 'Out of Stock'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder={isBangla ? 'মূল্য' : 'Price'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isBangla ? 'সব মূল্য' : 'All Prices'}</SelectItem>
                <SelectItem value="wholesale">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Package className="h-3.5 w-3.5 text-indigo shrink-0" />
                    {isBangla ? 'পাইকারি' : 'Wholesale'}
                  </div>
                </SelectItem>
                <SelectItem value="vip">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
                    VIP
                  </div>
                </SelectItem>
                <SelectItem value="multi">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    {isBangla ? 'মাল্টি-প্রাইস' : 'Multi-Price'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Items List */}
        <Card variant="elevated" padding="none">
          <CardHeader className="px-6 pt-6 pb-3">
            <CardTitle className="text-base whitespace-nowrap">{isBangla ? 'পণ্য তালিকা' : 'Item List'}</CardTitle>
          </CardHeader>
          <Divider />
          <CardContent className="p-0">
            {itemsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={<Package className="h-8 w-8" />}
                title={isBangla ? 'কোনো পণ্য নেই' : 'No items found'}
                description={isBangla ? 'নতুন পণ্য যোগ করুন' : 'Add your first item'}
                isBangla={isBangla}
                action={
                  <Button onClick={() => router.push('/inventory/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">{t('inventory.addItem')}</span>
                  </Button>
                }
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="divide-y divide-border-subtle">
                  {filteredItems.map((item, index) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      isBangla={isBangla}
                      index={index}
                      onView={() => setSelectedItem(item)}
                      refetchItems={refetch}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Item Detail Modal */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || ''}
        subtitle={selectedItem?.sku || ''}
        width="lg"
      >
        {selectedItem && (
          <>
            <DetailSection title={isBangla ? 'পণ্যের তথ্য' : 'Item Information'}>
              <DetailRow
                label={isBangla ? 'বর্তমান স্টক' : 'Current Stock'}
                value={
                  <span className={cn(
                    'text-xl font-bold',
                    selectedItem.currentStock === 0 ? 'text-red-600' :
                      selectedItem.currentStock <= selectedItem.minStock ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {selectedItem.currentStock} {selectedItem.unit}
                  </span>
                }
                icon={<Package className="h-5 w-5 text-emerald-600" />}
              />
              <DetailRow
                label={isBangla ? 'বিক্রয় মূল্য' : 'Selling Price'}
                value={<span className="font-bold">{formatCurrency(selectedItem.sellingPrice)}</span>}
                icon={<DollarSign className="h-5 w-5 text-blue-600" />}
              />
              <DetailRow
                label={isBangla ? 'ক্রয় মূল্য' : 'Cost Price'}
                value={formatCurrency(selectedItem.costPrice)}
                icon={<Tag className="h-5 w-5 text-gray-600" />}
              />
              {selectedItem.margin !== undefined && (
                <DetailRow
                  label={isBangla ? 'মার্জিন' : 'Margin'}
                  value={
                    <span className={cn(
                      'font-bold',
                      selectedItem.margin > 20 ? 'text-emerald-600' :
                        selectedItem.margin > 10 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {selectedItem.margin.toFixed(1)}%
                    </span>
                  }
                  icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                />
              )}
            </DetailSection>

            {/* Multi-Price Section */}
            {(selectedItem.wholesalePrice || selectedItem.vipPrice || selectedItem.minimumPrice) && (
              <DetailSection title={isBangla ? 'মাল্টি-প্রাইস' : 'Multi-Price'}>
                {selectedItem.wholesalePrice && (
                  <DetailRow
                    label={isBangla ? 'পাইকারি মূল্য' : 'Wholesale Price'}
                    value={<span className="font-bold text-indigo-600">{formatCurrency(selectedItem.wholesalePrice)}</span>}
                    icon={<Package className="h-5 w-5 text-indigo" />}
                  />
                )}
                {selectedItem.vipPrice && (
                  <DetailRow
                    label="VIP Price"
                    value={<span className="font-bold text-amber-600">{formatCurrency(selectedItem.vipPrice)}</span>}
                    icon={<Crown className="h-5 w-5 text-amber-600" />}
                  />
                )}
                {selectedItem.minimumPrice && (
                  <DetailRow
                    label={isBangla ? 'সর্বনিম্ন মূল্য' : 'Minimum Price'}
                    value={<span className="font-bold text-red-600">{formatCurrency(selectedItem.minimumPrice)}</span>}
                    icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                  />
                )}
              </DetailSection>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                className="flex-1"
                onClick={() => router.push(`/inventory/${selectedItem.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">{isBangla ? 'সম্পাদনা' : 'Edit'}</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  toast.info(isBangla ? 'স্টক ইতিহাস শীঘ্রই আসছে' : 'Stock history coming soon');
                }}
              >
                <Layers className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">{isBangla ? 'স্টক ইতিহাস' : 'Stock History'}</span>
              </Button>
            </div>
          </>
        )}
      </DetailModal>

      {/* Import Items Modal */}
      <ImportItemsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Export Items Modal */}
      <ExportItemsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        items={items || []}
      />

      {/* Categories Management Modal */}
      <CategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />
    </>
  );
}

// Item Row Component
function ItemRow({
  item,
  isBangla,
  index,
  onView,
  refetchItems
}: {
  item: Item;
  isBangla: boolean;
  index: number;
  onView: () => void;
  refetchItems: () => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { formatCurrency } = useCurrency();
  const deleteItem = useDeleteItem()
  const getStockStatus = () => {
    if (item.currentStock === 0) {
      return { variant: 'destructive' as const, label: isBangla ? 'স্টক শেষ' : 'Out of Stock' };
    }
    if (item.currentStock <= item.minStock) {
      return { variant: 'warning' as const, label: isBangla ? 'স্টক কম' : 'Low Stock' };
    }
    return { variant: 'success' as const, label: isBangla ? 'স্টক আছে' : 'In Stock' };
  };

  const stockStatus = getStockStatus();
  const stockPercentage = Math.min((item.currentStock / (item.minStock * 3)) * 100, 100);

  const hasWholesale = item.wholesalePrice && item.wholesalePrice > 0;
  const hasVip = item.vipPrice && item.vipPrice > 0;
  const hasMinimum = item.minimumPrice && item.minimumPrice > 0;
  const hasMultiPrice = hasWholesale || hasVip || hasMinimum;

  const router = useRouter()
  // FIX 1: Stop propagation on the delete button click so the row's onView doesn't fire
  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    // onDelete(item.id);
    deleteItem.mutate(item.id, {
      onSuccess: data => {
        if (data.success) {
          toast.success('Item deleted successfully!');
          refetchItems()
          setDeleteOpen(false);

        }
      }
    })

  };

  // FIX 1 (cont): Stop propagation on the row click when delete dialog is open
  const handleRowClick = () => {
    if (deleteOpen) return;
    onView();
  };

  return (
    <>
      {/* Delete Confirmation — rendered outside row to prevent click bubbling */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm overflow-hidden !max-h-none">
          <div className="flex flex-col items-center gap-3 pt-2">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1">
              <DialogTitle className="text-base font-semibold">
                {isBangla ? 'পণ্য মুছে ফেলবেন?' : 'Delete this item?'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isBangla
                  ? `"${item.name}" স্থায়ীভাবে মুছে ফেলা হবে।`
                  : `"${item.name}" will be permanently deleted.`}
              </DialogDescription>
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isBangla ? 'মুছে ফেলুন' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group stagger-item gap-4"
        style={{ animationDelay: `${index * 30}ms` }}
        onClick={handleRowClick}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground truncate">{item.name}</p>
              <Badge variant={stockStatus.variant} size="sm" className="whitespace-nowrap">{stockStatus.label}</Badge>
              {hasMultiPrice && (
                <>
                  {hasWholesale && (
                    <Badge variant="indigo" size="sm" icon={<Package className="h-3 w-3" />} className="whitespace-nowrap">
                      {isBangla ? 'পাইকারি' : 'Wholesale'}
                    </Badge>
                  )}
                  {hasVip && (
                    <Badge variant="warning" size="sm" icon={<Crown className="h-3 w-3" />} className="whitespace-nowrap">
                      VIP
                    </Badge>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {item.sku && <span className="whitespace-nowrap">SKU: {item.sku}</span>}
              <span className="text-border">•</span>
              <span className="whitespace-nowrap">{item.unit}</span>
            </div>
            <div className="mt-2 max-w-[200px]">
              <Progress
                value={stockPercentage}
                size="sm"
                color={item.currentStock === 0 ? 'destructive' : item.currentStock <= item.minStock ? 'warning' : 'emerald'}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right min-w-0">
            <p className="font-bold text-foreground whitespace-nowrap">
              {item.currentStock} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
            </p>
            <div className="flex items-center gap-2 justify-end mt-0.5 flex-wrap">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatCurrency(item.sellingPrice)}
              </span>
              <span className="text-xs text-primary font-medium whitespace-nowrap">
                {item.margin?.toFixed(1) || '0'}%
              </span>
            </div>
            {hasWholesale && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <Tag className="h-3 w-3 text-indigo shrink-0" />
                <span className="text-xs text-indigo whitespace-nowrap">
                  {isBangla ? 'পাইকারি' : 'Wholesale'}: {formatCurrency(item.wholesalePrice!)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {/* FIX 1: stopPropagation on all action buttons */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.stopPropagation(); onView(); }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => { e.stopPropagation(); router.push(`/inventory/${item.id}/edit`) }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteButtonClick}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </div>
    </>
  );
}