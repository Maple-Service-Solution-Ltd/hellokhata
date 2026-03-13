// Hello Khata OS - New Expense Page with Bill Photo Upload
// Feature 6: Bill Photo Upload for expense entries

'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Receipt,
  Check,
  X,
  Zap,
  Droplets,
  Home,
  Truck,
  Users,
  MoreHorizontal,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  XCircle,
  Eye,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useExpenseCategories, useCreateExpense } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categoryIcons: Record<string, React.ReactNode> = {
  'Zap': <Zap className="h-4 w-4" />,
  'Droplets': <Droplets className="h-4 w-4" />,
  'Home': <Home className="h-4 w-4" />,
  'Truck': <Truck className="h-4 w-4" />,
  'Users': <Users className="h-4 w-4" />,
  'MoreHorizontal': <MoreHorizontal className="h-4 w-4" />,
};

// File upload state interface
interface UploadedFile {
  file: File;
  preview: string; // Object URL or base64
  type: 'image' | 'pdf';
  name: string;
  size: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const { t, isBangla } = useAppTranslation();
  const createExpense = useCreateExpense();
  
  const { data: categoriesData } = useExpenseCategories();
  const categories = categoriesData || [];
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    date: todayStr,
  });
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Check file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      toast.error(isBangla ? 'শুধুমাত্র ছবি বা PDF ফাইল আপলোড করতে পারবেন' : 'Only image or PDF files are allowed');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isBangla ? 'ফাইলের সাইজ ১০MB এর বেশি হতে পারবে না' : 'File size must be less than 10MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        file,
        preview: e.target?.result as string,
        type: isImage ? 'image' : 'pdf',
        name: file.name,
        size: formatFileSize(file.size),
      });
    };
    reader.readAsDataURL(file);
  }, [isBangla]);
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(isBangla ? 'পরিমাণ প্রয়োজন' : 'Amount is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error(isBangla ? 'বিবরণ প্রয়োজন' : 'Description is required');
      return;
    }
    
    try {
      await createExpense.mutateAsync({
        categoryId: formData.categoryId || categories[0]?.id || 'ec-6',
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date),
      });
      
      toast.success(isBangla ? 'খরচ সংরক্ষিত হয়েছে!' : 'Expense saved successfully!');
      router.push('/expenses');
    } catch (error) {
      toast.error(isBangla ? 'খরচ সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save expense');
    }
  };

  return (
    <>
      {/* Centered Page Container */}
      <div className="flex justify-center">
        <div className="w-full" style={{ maxWidth: '600px' }}>
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 mb-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{isBangla ? 'পেছনে' : 'Back'}</span>
          </button>
          
          {/* Page Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isBangla ? 'নতুন খরচ যোগ' : 'Add Expense'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isBangla ? 'নতুন খরচ এন্ট্রি করুন' : 'Record a new expense'}
            </p>
          </div>
          
          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isBangla ? 'খরচের তথ্য' : 'Expense Details'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-5">
              {/* Bill/Receipt Photo Upload Section */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'বিল/রশিদ ফটো' : 'Bill/Receipt Photo'}
                </Label>
                
                {!uploadedFile ? (
                  // Upload Zone
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                      'hover:border-primary/50 hover:bg-primary/5',
                      isDragOver 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border-subtle bg-muted/30'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn(
                        'h-14 w-14 rounded-xl flex items-center justify-center transition-all',
                        isDragOver 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isDragOver ? (
                          <Upload className="h-7 w-7" />
                        ) : (
                          <Camera className="h-7 w-7" />
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isBangla ? 'ফাইল আপলোড করতে ক্লিক করুন' : 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isBangla ? 'ছবি বা PDF (সর্বোচ্চ ১০MB)' : 'Image or PDF (max 10MB)'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // File Preview Card
                  <div className="border border-border-subtle rounded-xl p-4 bg-muted/30">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div 
                        className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted cursor-pointer group"
                        onClick={() => uploadedFile.type === 'image' && setIsImageModalOpen(true)}
                      >
                        {uploadedFile.type === 'image' ? (
                          <>
                            <img
                              src={uploadedFile.preview}
                              alt={uploadedFile.name}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <FileText className="h-8 w-8 text-destructive" />
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadedFile.size}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {uploadedFile.type === 'image' 
                            ? (isBangla ? 'ছবি ফাইল' : 'Image file')
                            : 'PDF file'
                          }
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          {uploadedFile.type === 'image' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setIsImageModalOpen(true)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              {isBangla ? 'দেখুন' : 'View'}
                            </Button>
                          )}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  disabled
                                >
                                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                                  {isBangla ? 'AI এক্সট্রাক্ট' : 'Extract (AI)'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isBangla ? 'শীঘ্রই আসছে' : 'Coming soon'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={handleRemoveFile}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Helper Text */}
                <p className="text-xs text-muted-foreground mt-2">
                  {isBangla 
                    ? 'বিল বা রশিদের ছবি আপলোড করুন। AI দ্রুত তথ্য এক্সট্রাক্ট করতে পারবে (শীঘ্রই আসছে)'
                    : 'Upload a photo of your bill or receipt. AI can extract details automatically (coming soon)'
                  }
                </p>
              </div>
              
              {/* Divider */}
              <div className="border-t border-border-subtle" />
              
              {/* Category */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'ক্যাটাগরি' : 'Category'}
                </Label>
                <Select value={formData.categoryId} onValueChange={(v) => updateForm('categoryId', v)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={isBangla ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: cat.color || '#6B7280' }}>
                            {categoryIcons[cat.icon || 'MoreHorizontal']}
                          </span>
                          <span>{cat.nameBn || cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Amount */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'পরিমাণ (৳)' : 'Amount (৳)'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateForm('amount', e.target.value)}
                  placeholder="0"
                  className="h-11 text-lg"
                />
              </div>
              
              {/* Date */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'তারিখ' : 'Date'}
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className="h-11"
                />
              </div>
              
              {/* Description */}
              <div>
                <Label className="mb-2 block">
                  {isBangla ? 'বিবরণ' : 'Description'} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={isBangla ? 'খরচের বিবরণ লিখুন...' : 'Enter expense description...'}
                  rows={3}
                />
              </div>
              
              {/* Total Preview */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {isBangla ? 'মোট খরচ' : 'Total Expense'}
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      ৳{parseFloat(formData.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex gap-3">
              <Button
                className="flex-1 h-11"
                onClick={handleSubmit}
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {isBangla ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isBangla ? 'সংরক্ষণ করুন' : 'Save'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => router.back()}
              >
                <X className="h-4 w-4 mr-2" />
                {isBangla ? 'বাতিল' : 'Cancel'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isBangla ? 'ছবি প্রিভিউ' : 'Image Preview'}
            </DialogTitle>
          </DialogHeader>
          {uploadedFile?.type === 'image' && (
            <div className="relative">
              <img
                src={uploadedFile.preview}
                alt={uploadedFile.name}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              {/* Close button overlay */}
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
