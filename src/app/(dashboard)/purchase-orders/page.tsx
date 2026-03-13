'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Plus,
  Eye,
  Calendar,
  FileText,
  Package,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Truck,
  AlertCircle
} from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useNavigation } from '@/stores/uiStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId?: string;
  supplier?: {
    name: string;
  };
  total: number;
  status: string;
  expectedDate?: string;
  createdAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    total: number;
    receivedQty: number;
    status: string;
  }>;
}

export default function PurchaseOrdersPage() {
  const { t, isBangla } = useAppTranslation();
  const { navigateTo } = useNavigation();
  
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/purchase-orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      draft: { bg: 'bg-gray-100 text-gray-700', text: isBangla ? 'খসড়া' : 'Draft', icon: FileText },
      submitted: { bg: 'bg-blue-100 text-blue-700', text: isBangla ? 'জমা দেওয়া' : 'Submitted', icon: Send },
      approved: { bg: 'bg-amber-100 text-amber-700', text: isBangla ? 'অনুমোদিত' : 'Approved', icon: CheckCircle2 },
      partially_received: { bg: 'bg-purple-100 text-purple-700', text: isBangla ? 'আংশিক গৃহীত' : 'Partial', icon: Truck },
      received: { bg: 'bg-emerald-100 text-emerald-700', text: isBangla ? 'গৃহীত' : 'Received', icon: Package },
      rejected: { bg: 'bg-red-100 text-red-700', text: isBangla ? 'প্রত্যাখ্যাত' : 'Rejected', icon: XCircle },
      cancelled: { bg: 'bg-gray-100 text-gray-500', text: isBangla ? 'বাতিল' : 'Cancelled', icon: XCircle },
    };
    
    const style = styles[status] || styles.draft;
    const Icon = style.icon;
    
    return (
      <Badge className={cn('gap-1', style.bg)}>
        <Icon className="h-3 w-3" />
        {style.text}
      </Badge>
    );
  };

  const pendingApprovals = orders.filter(o => o.status === 'submitted').length;
  const totalValue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

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
                onClick={() => navigateTo('purchases')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isBangla ? 'ক্রয় অর্ডার' : 'Purchase Orders'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isBangla 
                    ? `${filteredOrders.length}টি অর্ডার` 
                    : `${filteredOrders.length} orders`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => navigateTo('purchases-new')}>
                <Plus className="h-4 w-4 mr-2" />
                {isBangla ? 'নতুন অর্ডার' : 'New Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'মোট অর্ডার' : 'Total Orders'}
                  </p>
                  <p className="text-xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'অপেক্ষমান অনুমোদন' : 'Pending Approval'}
                  </p>
                  <p className="text-xl font-bold">{pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'গৃহীত' : 'Received'}
                  </p>
                  <p className="text-xl font-bold">
                    {orders.filter(o => o.status === 'received').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-600">৳</span>
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
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isBangla ? 'PO নম্বর বা সরবরাহকারী খুঁজুন...' : 'Search by PO no or supplier...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{isBangla ? 'সব স্ট্যাটাস' : 'All Status'}</option>
            <option value="draft">{isBangla ? 'খসড়া' : 'Draft'}</option>
            <option value="submitted">{isBangla ? 'জমা দেওয়া' : 'Submitted'}</option>
            <option value="approved">{isBangla ? 'অনুমোদিত' : 'Approved'}</option>
            <option value="received">{isBangla ? 'গৃহীত' : 'Received'}</option>
            <option value="cancelled">{isBangla ? 'বাতিল' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12">
            <Package className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                {isBangla ? 'কোন অর্ডার নেই' : 'No orders found'}
              </h3>
              <Button className="mt-4" onClick={() => navigateTo('purchases-new')}>
                <Plus className="h-4 w-4 mr-2" />
                {isBangla ? 'প্রথম অর্ডার তৈরি করুন' : 'Create First Order'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-indigo-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.poNo}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          {order.supplier && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {order.supplier.name}
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(order.createdAt), 'dd MMM yyyy')}
                          </span>
                          
                          {order.expectedDate && (
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {isBangla ? 'প্রত্যাশিত' : 'Expected'}: {format(new Date(order.expectedDate), 'dd MMM')}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          {order.items.length} {isBangla ? 'আইটেম' : 'items'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ৳{order.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                {selectedOrder.poNo}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'সরবরাহকারী' : 'Supplier'}
                  </p>
                  <p className="font-medium">{selectedOrder.supplier?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'স্ট্যাটাস' : 'Status'}
                  </p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'তৈরির তারিখ' : 'Created Date'}
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy')}
                  </p>
                </div>
                
                {selectedOrder.expectedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isBangla ? 'প্রত্যাশিত তারিখ' : 'Expected Date'}
                    </p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.expectedDate), 'dd MMMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Items Table */}
              <div>
                <h4 className="font-medium mb-3">
                  {isBangla ? 'অর্ডার আইটেম' : 'Order Items'}
                </h4>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3">{isBangla ? 'আইটেম' : 'Item'}</th>
                        <th className="text-center p-3">{isBangla ? 'পরিমাণ' : 'Qty'}</th>
                        <th className="text-right p-3">{isBangla ? 'দর' : 'Cost'}</th>
                        <th className="text-right p-3">{isBangla ? 'মোট' : 'Total'}</th>
                        <th className="text-center p-3">{isBangla ? 'গৃহীত' : 'Received'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.itemName}</td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">৳{item.unitCost.toLocaleString()}</td>
                          <td className="text-right p-3 font-medium">৳{item.total.toLocaleString()}</td>
                          <td className="text-center p-3">
                            <Badge variant={item.receivedQty >= item.quantity ? 'success' : 'outline'}>
                              {item.receivedQty}/{item.quantity}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t">
                        <td colSpan={3} className="p-3 text-right font-medium">
                          {isBangla ? 'মোট' : 'Total'}
                        </td>
                        <td className="p-3 text-right font-bold">
                          ৳{selectedOrder.total.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedOrder.status === 'draft' && (
                  <Button 
                    onClick={() => handleAction(selectedOrder.id, 'submit')}
                    disabled={actionLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isBangla ? 'জমা দিন' : 'Submit for Approval'}
                  </Button>
                )}
                
                {selectedOrder.status === 'submitted' && (
                  <>
                    <Button 
                      onClick={() => handleAction(selectedOrder.id, 'approve')}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {isBangla ? 'অনুমোদন' : 'Approve'}
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleAction(selectedOrder.id, 'reject')}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isBangla ? 'প্রত্যাখ্যান' : 'Reject'}
                    </Button>
                  </>
                )}
                
                {selectedOrder.status === 'approved' && (
                  <Button 
                    onClick={() => navigateTo('purchases-new')}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {isBangla ? 'গ্রহণ করুন' : 'Receive Goods'}
                  </Button>
                )}
                
                {['draft', 'submitted', 'approved'].includes(selectedOrder.status) && (
                  <Button 
                    variant="outline"
                    onClick={() => handleAction(selectedOrder.id, 'cancel')}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isBangla ? 'বাতিল' : 'Cancel'}
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  {isBangla ? 'বন্ধ করুন' : 'Close'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
