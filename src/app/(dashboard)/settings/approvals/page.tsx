'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  CreditCard,
  Receipt,
  Package,
  User,
  Calendar
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApprovalItem {
  id: string;
  type: 'purchase_order' | 'credit_note' | 'debit_note';
  entityNo: string;
  amount: number;
  status: string;
  createdBy: string | null;
  createdAt: Date;
}

export default function ApprovalsPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/approvals?status=pending');
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
        setCanApprove(data.canApprove);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (entityType: string, entityId: string, action: 'approve' | 'reject') => {
    setProcessingId(entityId);
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, action }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchApprovals();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return <Package className="h-5 w-5 text-indigo-600" />;
      case 'credit_note':
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case 'debit_note':
        return <Receipt className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      purchase_order: { bg: 'bg-indigo-100 text-indigo-700', text: isBangla ? 'ক্রয় অর্ডার' : 'Purchase Order' },
      credit_note: { bg: 'bg-emerald-100 text-emerald-700', text: isBangla ? 'ক্রেডিট নোট' : 'Credit Note' },
      debit_note: { bg: 'bg-red-100 text-red-700', text: isBangla ? 'ডেবিট নোট' : 'Debit Note' },
    };
    
    const style = styles[type] || { bg: 'bg-gray-100 text-gray-700', text: type };
    
    return (
      <Badge className={cn('text-xs', style.bg)}>
        {style.text}
      </Badge>
    );
  };

  const pendingCount = approvals.filter(a => a.status === 'pending' || a.status === 'submitted').length;
  const totalValue = approvals.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateTo('settings')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {isBangla ? 'অনুমোদন ড্যাশবোর্ড' : 'Approval Dashboard'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `${pendingCount}টি অপেক্ষমান অনুমোদন`
                    : `${pendingCount} pending approvals`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'অপেক্ষমান' : 'Pending'}
                  </p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">৳</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট মূল্য' : 'Total Value'}
                  </p>
                  <p className="text-xl font-bold">৳{totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  canApprove ? "bg-emerald-100" : "bg-gray-100"
                )}>
                  {canApprove 
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <AlertCircle className="h-5 w-5 text-gray-500" />
                  }
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'আপনার অনুমতি' : 'Your Permission'}
                  </p>
                  <p className={cn("text-xl font-bold", canApprove ? "text-emerald-600" : "text-gray-500")}>
                    {canApprove 
                      ? (isBangla ? 'অনুমোদন করতে পারেন' : 'Can Approve')
                      : (isBangla ? 'অনুমতি নেই' : 'No Permission')
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approvals List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <Clock className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
            </p>
          </div>
        ) : approvals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                {isBangla ? 'সব পরিষ্কার!' : 'All Clear!'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isBangla 
                  ? 'কোন অপেক্ষমান অনুমোদন নেই'
                  : 'No pending approvals at this time'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {approvals.map((item) => (
              <Card key={`${item.type}-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        {getTypeIcon(item.type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.entityNo}</h3>
                          {getTypeBadge(item.type)}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.createdBy || 'Unknown'}
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(item.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ৳{item.amount.toLocaleString()}
                        </p>
                      </div>
                      
                      {canApprove && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleAction(item.type, item.id, 'approve')}
                            disabled={processingId === item.id}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(item.type, item.id, 'reject')}
                            disabled={processingId === item.id}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
