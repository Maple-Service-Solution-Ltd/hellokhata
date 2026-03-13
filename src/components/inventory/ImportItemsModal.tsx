// Hello Khata OS - Import Items Modal
// CSV import for bulk item creation

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSessionStore } from '@/stores/sessionStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportItemsModal({ isOpen, onClose, onSuccess }: ImportItemsModalProps) {
  const { isBangla } = useAppTranslation();
  const { business } = useSessionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error(isBangla ? 'শুধুমাত্র CSV ফাইল সমর্থিত' : 'Only CSV files are supported');
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
      
      // Read and preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(0, 6); // Preview first 5 rows + header
        const parsed = lines.map(line => line.split(',').map(cell => cell.trim()));
        setPreview(parsed);
      };
      reader.readAsText(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const template = `name,category,sku,barcode,unit,costPrice,sellingPrice,wholesalePrice,vipPrice,currentStock,minStock
দুধ,Dairy,MILK001,8901234567890,লিটার,80,100,90,95,100,20
চিনি,Grocery,SUGAR001,,কেজি,120,140,130,135,50,10
তেল,Grocery,OIL001,,লিটার,180,200,185,190,30,5`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'items_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/items/import', {
        method: 'POST',
        headers: {
          'x-business-id': business?.id || '',
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImportResult({
          success: data.data.imported,
          failed: data.data.failed,
          errors: data.data.errors || [],
        });
        
        if (data.data.imported > 0) {
          toast.success(isBangla 
            ? `${data.data.imported}টি পণ্য আমদানি সফল` 
            : `${data.data.imported} items imported successfully`);
          onSuccess();
        }
      } else {
        toast.error(data.error?.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(isBangla ? 'আমদানি ব্যর্থ হয়েছে' : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {isBangla ? 'পণ্য আমদানি করুন' : 'Import Items'}
          </DialogTitle>
          <DialogDescription>
            {isBangla 
              ? 'CSV ফাইল থেকে একবারে একাধিক পণ্য যোগ করুন' 
              : 'Add multiple items at once from a CSV file'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{isBangla ? 'টেমপ্লেট ডাউনলোড করুন' : 'Download Template'}</p>
                <p className="text-xs text-muted-foreground">
                  {isBangla ? 'সঠিক ফরম্যাটে ফাইল তৈরি করুন' : 'Create file in correct format'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              {isBangla ? 'ডাউনলোড' : 'Download'}
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Label className="mb-2 block">{isBangla ? 'ফাইল নির্বাচন করুন' : 'Select File'}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isBangla ? 'CSV ফাইল নির্বাচন করুন' : 'Select CSV file'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isBangla ? 'বা টেনে এখানে ছাড়ুন' : 'or drag and drop here'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-muted/50 text-xs font-medium">
                {isBangla ? 'প্রাকদর্শন (প্রথম ৫ সারি)' : 'Preview (first 5 rows)'}
              </div>
              <div className="overflow-x-auto max-h-[150px]">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? "bg-muted/30 font-medium" : ""}>
                        {row.slice(0, 5).map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1 border-r border-border last:border-r-0 truncate max-w-[100px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald" />
                <span>{isBangla ? `সফল: ${importResult.success}টি` : `Success: ${importResult.success}`}</span>
              </div>
              {importResult.failed > 0 && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertCircle className="h-4 w-4" />
                  <span>{isBangla ? `ব্যর্থ: ${importResult.failed}টি` : `Failed: ${importResult.failed}`}</span>
                </div>
              )}
              {importResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive max-h-[100px] overflow-y-auto">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <div>...{isBangla ? `আরও ${importResult.errors.length - 5}টি ত্রুটি` : `${importResult.errors.length - 5} more errors`}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {isBangla ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isBangla ? 'আমদানি হচ্ছে...' : 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {isBangla ? 'আমদানি করুন' : 'Import'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
