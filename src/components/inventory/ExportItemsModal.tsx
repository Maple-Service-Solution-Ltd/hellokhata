// Hello Khata OS - Export Items Modal
// Export items to CSV/Excel format

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

export function ExportItemsModal({ isOpen, onClose, items }: ExportItemsModalProps) {
  const { isBangla } = useAppTranslation();
  const { business } = useSessionStore();
  
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const formatConfig = {
    csv: {
      icon: FileText,
      label: 'CSV',
      labelBn: 'CSV',
      description: 'Comma-separated values',
    },
    excel: {
      icon: FileSpreadsheet,
      label: 'Excel',
      labelBn: 'এক্সেল',
      description: 'Microsoft Excel format',
    },
    pdf: {
      icon: FileText,
      label: 'PDF',
      labelBn: 'PDF',
      description: 'Portable document format',
    },
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      if (format === 'csv') {
        // Generate CSV
        const headers = ['Name', 'NameBn', 'Category', 'SKU', 'Barcode', 'Unit', 'Cost Price', 'Selling Price', 'Wholesale Price', 'VIP Price', 'Current Stock', 'Min Stock'];
        const csvRows = [
          headers.join(','),
          ...items.map(item => [
            `"${item.name || ''}"`,
            `"${item.nameBn || ''}"`,
            `"${item.category?.name || ''}"`,
            item.sku || '',
            item.barcode || '',
            item.unit || '',
            item.costPrice || 0,
            item.sellingPrice || 0,
            item.wholesalePrice || '',
            item.vipPrice || '',
            item.currentStock || 0,
            item.minStock || 0,
          ].join(','))
        ];
        
        const csvContent = '\ufeff' + csvRows.join('\n'); // Add BOM for Unicode
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
      } else if (format === 'excel') {
        // Generate Excel (HTML table format)
        const html = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head><meta charset="UTF-8"></head>
            <body>
              <table border="1">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Unit</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Current Stock</th>
                  <th>Stock Value</th>
                </tr>
                ${items.map(item => `
                  <tr>
                    <td>${item.name || ''}</td>
                    <td>${item.category?.name || ''}</td>
                    <td>${item.sku || ''}</td>
                    <td>${item.unit || ''}</td>
                    <td>${item.costPrice || 0}</td>
                    <td>${item.sellingPrice || 0}</td>
                    <td>${item.currentStock || 0}</td>
                    <td>${(item.costPrice * item.currentStock).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </body>
          </html>
        `;
        
        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory_${new Date().toISOString().slice(0, 10)}.xls`;
        link.click();
        URL.revokeObjectURL(url);
        
      } else if (format === 'pdf') {
        // For PDF, we'll create a printable HTML
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Inventory Report - ${business?.name || 'Hello Khata'}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #333; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f4f4f4; }
                  .low-stock { background-color: #fff3cd; }
                  .out-of-stock { background-color: #f8d7da; }
                </style>
              </head>
              <body>
                <h1>Inventory Report</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>Business: ${business?.name || ''}</p>
                <p>Total Items: ${items.length}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Unit</th>
                      <th>Cost</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr class="${item.currentStock === 0 ? 'out-of-stock' : item.currentStock <= item.minStock ? 'low-stock' : ''}">
                        <td>${item.name}</td>
                        <td>${item.sku || '-'}</td>
                        <td>${item.unit}</td>
                        <td>৳${item.costPrice}</td>
                        <td>৳${item.sellingPrice}</td>
                        <td>${item.currentStock}</td>
                        <td>৳${(item.costPrice * item.currentStock).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      
      setExportSuccess(true);
      toast.success(isBangla ? 'রপ্তানি সফল হয়েছে' : 'Export successful');
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isBangla ? 'রপ্তানি ব্যর্থ হয়েছে' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {isBangla ? 'পণ্য রপ্তানি করুন' : 'Export Items'}
          </DialogTitle>
          <DialogDescription>
            {isBangla 
              ? `${items.length}টি পণ্য রপ্তানি করুন` 
              : `Export ${items.length} items`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Format Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(formatConfig) as ExportFormat[]).map((fmt) => {
              const config = formatConfig[fmt];
              const Icon = config.icon;
              const isSelected = format === fmt;
              
              return (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{isBangla ? config.labelBn : config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Format Info */}
          <div className="p-3 rounded-lg bg-muted/30 text-sm text-center">
            {formatConfig[format].description}
          </div>

          {/* Export Success Message */}
          {exportSuccess && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald/10 text-emerald">
              <Check className="h-5 w-5" />
              <span>{isBangla ? 'রপ্তানি সম্পন্ন!' : 'Export complete!'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleExport} disabled={isExporting || items.length === 0}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isBangla ? 'রপ্তানি হচ্ছে...' : 'Exporting...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {isBangla ? 'রপ্তানি করুন' : 'Export'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
