// Stock Management Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Eye,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Truck,
  Factory,
  MapPin,
  ShoppingCart
} from 'lucide-react';

interface StockItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  received_quantity: number;
  current_stock: number;
  reserved_stock: number;
  damaged_stock: number;
  supplier_name?: string;
  purchase_rate?: number;
  mrp: number;
  rack_number?: string;
  shelf_location?: string;
  minimum_stock_level: number;
  reorder_level: number;
  is_active: boolean;
  days_to_expiry: number;
}

interface StockMovement {
  id: string;
  medicine_name: string;
  batch_number: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'DAMAGE' | 'EXPIRY';
  reference_type?: string;
  quantity_before: number;
  quantity_changed: number;
  quantity_after: number;
  reason?: string;
  performed_by: string;
  movement_date: string;
}

interface StockAlert {
  id: string;
  medicine_name: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY';
  current_stock: number;
  threshold?: number;
  days_to_expiry?: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  batch_number?: string;
  expiry_date?: string;
}

const StockManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('ADJUSTMENT');

  // Mock data - will be replaced with real data from hooks
  const stockItems: StockItem[] = [
    {
      id: '1',
      medicine_id: 'med_001',
      medicine_name: 'Paracetamol',
      generic_name: 'Acetaminophen',
      strength: '500mg',
      dosage_form: 'Tablet',
      batch_number: 'PAR2024001',
      manufacturing_date: '2024-01-15',
      expiry_date: '2025-12-31',
      received_quantity: 1500,
      current_stock: 1250,
      reserved_stock: 50,
      damaged_stock: 0,
      supplier_name: 'GSK Pharmaceuticals',
      purchase_rate: 4.50,
      mrp: 5.50,
      rack_number: 'A1',
      shelf_location: 'Level 2',
      minimum_stock_level: 100,
      reorder_level: 200,
      is_active: true,
      days_to_expiry: 565
    },
    {
      id: '2',
      medicine_id: 'med_002',
      medicine_name: 'Amoxicillin',
      generic_name: 'Amoxicillin',
      strength: '250mg',
      dosage_form: 'Capsule',
      batch_number: 'AMX2024001',
      manufacturing_date: '2023-12-01',
      expiry_date: '2024-08-15',
      received_quantity: 100,
      current_stock: 45,
      reserved_stock: 15,
      damaged_stock: 2,
      supplier_name: 'Cipla Ltd',
      purchase_rate: 10.00,
      mrp: 12.00,
      rack_number: 'B2',
      shelf_location: 'Level 1',
      minimum_stock_level: 50,
      reorder_level: 75,
      is_active: true,
      days_to_expiry: 63
    },
    {
      id: '3',
      medicine_id: 'med_003',
      medicine_name: 'Ibuprofen',
      generic_name: 'Ibuprofen',
      strength: '400mg',
      dosage_form: 'Tablet',
      batch_number: 'IBU2024001',
      manufacturing_date: '2024-03-01',
      expiry_date: '2026-03-20',
      received_quantity: 1000,
      current_stock: 890,
      reserved_stock: 25,
      damaged_stock: 0,
      supplier_name: 'Abbott Healthcare',
      purchase_rate: 7.00,
      mrp: 8.75,
      rack_number: 'A3',
      shelf_location: 'Level 3',
      minimum_stock_level: 75,
      reorder_level: 150,
      is_active: true,
      days_to_expiry: 645
    },
    {
      id: '4',
      medicine_id: 'med_004',
      medicine_name: 'Aspirin',
      generic_name: 'Acetylsalicylic Acid',
      strength: '75mg',
      dosage_form: 'Tablet',
      batch_number: 'ASP2024001',
      manufacturing_date: '2023-06-01',
      expiry_date: '2024-06-30',
      received_quantity: 200,
      current_stock: 0,
      reserved_stock: 0,
      damaged_stock: 5,
      supplier_name: 'Bayer Pharmaceuticals',
      purchase_rate: 3.50,
      mrp: 4.25,
      rack_number: 'C1',
      shelf_location: 'Level 1',
      minimum_stock_level: 25,
      reorder_level: 50,
      is_active: true,
      days_to_expiry: 17
    }
  ];

  const stockMovements: StockMovement[] = [
    {
      id: '1',
      medicine_name: 'Paracetamol',
      batch_number: 'PAR2024001',
      movement_type: 'OUT',
      reference_type: 'SALE',
      quantity_before: 1280,
      quantity_changed: -30,
      quantity_after: 1250,
      reason: 'Sale to customer',
      performed_by: 'Pharmacist John',
      movement_date: '2025-06-13T10:30:00Z'
    },
    {
      id: '2',
      medicine_name: 'Amoxicillin',
      batch_number: 'AMX2024001',
      movement_type: 'OUT',
      reference_type: 'PRESCRIPTION',
      quantity_before: 60,
      quantity_changed: -15,
      quantity_after: 45,
      reason: 'Prescription dispensing',
      performed_by: 'Pharmacist Jane',
      movement_date: '2025-06-13T09:15:00Z'
    },
    {
      id: '3',
      medicine_name: 'Ibuprofen',
      batch_number: 'IBU2024001',
      movement_type: 'ADJUSTMENT',
      quantity_before: 885,
      quantity_changed: 5,
      quantity_after: 890,
      reason: 'Stock count adjustment',
      performed_by: 'Store Manager',
      movement_date: '2025-06-13T08:00:00Z'
    },
    {
      id: '4',
      medicine_name: 'Aspirin',
      batch_number: 'ASP2024001',
      movement_type: 'DAMAGE',
      quantity_before: 5,
      quantity_changed: -5,
      quantity_after: 0,
      reason: 'Damaged packaging',
      performed_by: 'Quality Control',
      movement_date: '2025-06-12T16:45:00Z'
    }
  ];

  const generateAlerts = (): StockAlert[] => {
    const alerts: StockAlert[] = [];
    
    stockItems.forEach(item => {
      // Out of stock alert
      if (item.current_stock === 0) {
        alerts.push({
          id: `alert_${item.id}_out`,
          medicine_name: item.medicine_name,
          alert_type: 'OUT_OF_STOCK',
          current_stock: item.current_stock,
          threshold: item.minimum_stock_level,
          severity: 'CRITICAL',
          batch_number: item.batch_number
        });
      }
      // Low stock alert
      else if (item.current_stock <= item.minimum_stock_level) {
        alerts.push({
          id: `alert_${item.id}_low`,
          medicine_name: item.medicine_name,
          alert_type: 'LOW_STOCK',
          current_stock: item.current_stock,
          threshold: item.minimum_stock_level,
          severity: item.current_stock <= item.reorder_level ? 'HIGH' : 'MEDIUM',
          batch_number: item.batch_number
        });
      }
      
      // Expiry alerts
      if (item.days_to_expiry < 0) {
        alerts.push({
          id: `alert_${item.id}_expired`,
          medicine_name: item.medicine_name,
          alert_type: 'EXPIRED',
          current_stock: item.current_stock,
          days_to_expiry: item.days_to_expiry,
          severity: 'CRITICAL',
          batch_number: item.batch_number,
          expiry_date: item.expiry_date
        });
      } else if (item.days_to_expiry <= 90) {
        alerts.push({
          id: `alert_${item.id}_expiring`,
          medicine_name: item.medicine_name,
          alert_type: 'NEAR_EXPIRY',
          current_stock: item.current_stock,
          days_to_expiry: item.days_to_expiry,
          severity: item.days_to_expiry <= 30 ? 'HIGH' : 'MEDIUM',
          batch_number: item.batch_number,
          expiry_date: item.expiry_date
        });
      }
    });
    
    return alerts;
  };

  const stockAlerts = generateAlerts();

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const getStockStatus = (current: number, minimum: number, reorder: number) => {
    if (current === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (current <= minimum) return { status: 'Critical Low', color: 'bg-red-100 text-red-800' };
    if (current <= reorder) return { status: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    if (current <= reorder * 2) return { status: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Good Stock', color: 'bg-green-100 text-green-800' };
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    if (days <= 30) return { status: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    if (days <= 90) return { status: 'Expires in 3 months', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Good', color: 'bg-green-100 text-green-800' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT': return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER': return <Truck className="h-4 w-4 text-purple-600" />;
      case 'DAMAGE': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXPIRY': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = stockFilter === 'all' || 
                              (stockFilter === 'low' && item.current_stock <= item.minimum_stock_level) ||
                              (stockFilter === 'out' && item.current_stock === 0) ||
                              (stockFilter === 'expiring' && item.days_to_expiry <= 90);
    
    return matchesSearch && matchesStockFilter;
  });

  const filteredAlerts = stockAlerts.filter(alert => {
    return alertFilter === 'all' || alert.alert_type === alertFilter;
  });

  const stockStats = {
    totalItems: stockItems.length,
    lowStockItems: stockItems.filter(item => item.current_stock <= item.minimum_stock_level).length,
    outOfStockItems: stockItems.filter(item => item.current_stock === 0).length,
    expiringItems: stockItems.filter(item => item.days_to_expiry <= 90 && item.days_to_expiry >= 0).length,
    expiredItems: stockItems.filter(item => item.days_to_expiry < 0).length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.current_stock * (item.purchase_rate || item.mrp)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Stock Management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor inventory levels, track stock movements, and manage alerts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Stock Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
              </DialogHeader>
              <StockAdjustmentForm onSuccess={() => setIsAdjustmentDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stockStats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stockStats.lowStockItems}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stockStats.outOfStockItems}</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stockStats.expiringItems}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stockStats.expiredItems}</div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{formatCurrency(stockStats.totalValue)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({stockAlerts.length})</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by medicine name, generic name, or batch number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All Stock Levels</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Items ({filteredStockItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine Details</TableHead>
                      <TableHead>Batch Info</TableHead>
                      <TableHead>Stock Levels</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expiry Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockItems.map((item) => {
                      const stockStatus = getStockStatus(item.current_stock, item.minimum_stock_level, item.reorder_level);
                      const expiryStatus = getExpiryStatus(item.days_to_expiry);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.medicine_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.generic_name} • {item.strength} • {item.dosage_form}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-mono text-sm">{item.batch_number}</div>
                              <div className="text-xs text-muted-foreground">
                                MFG: {item.manufacturing_date}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                EXP: {item.expiry_date}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Current: {item.current_stock}</div>
                              <div className="text-sm text-muted-foreground">
                                Reserved: {item.reserved_stock}
                              </div>
                              {item.damaged_stock > 0 && (
                                <div className="text-sm text-red-600">
                                  Damaged: {item.damaged_stock}
                                </div>
                              )}
                              <Badge className={stockStatus.color}>
                                {stockStatus.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <div className="text-sm">
                                <div>{item.rack_number}</div>
                                <div className="text-muted-foreground">{item.shelf_location}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{item.days_to_expiry} days</div>
                              <Badge className={expiryStatus.color}>
                                {expiryStatus.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(item.current_stock * (item.purchase_rate || item.mrp))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Rate: {formatCurrency(item.purchase_rate || item.mrp)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedStockItem(item)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <select
                  className="px-3 py-2 border rounded-md"
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                >
                  <option value="all">All Alerts</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="NEAR_EXPIRY">Near Expiry</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`h-6 w-6 ${
                        alert.severity === 'CRITICAL' ? 'text-red-600' :
                        alert.severity === 'HIGH' ? 'text-orange-600' :
                        alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div>
                        <div className="font-medium">{alert.medicine_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Batch: {alert.batch_number}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {alert.alert_type === 'LOW_STOCK' && `Stock: ${alert.current_stock}/${alert.threshold}`}
                        {alert.alert_type === 'OUT_OF_STOCK' && 'No stock available'}
                        {alert.alert_type === 'NEAR_EXPIRY' && `Expires in ${alert.days_to_expiry} days`}
                        {alert.alert_type === 'EXPIRED' && `Expired ${Math.abs(alert.days_to_expiry!)} days ago`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredAlerts.length === 0 && (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts matching your criteria</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center gap-4 p-3 border rounded">
                    {getMovementIcon(movement.movement_type)}
                    <div className="flex-1">
                      <div className="font-medium">{movement.medicine_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Batch: {movement.batch_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {movement.quantity_changed > 0 ? '+' : ''}{movement.quantity_changed}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.quantity_before} → {movement.quantity_after}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(movement.movement_date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Stock Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Inventory Valuation Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Low Stock Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Expiry Analysis Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <ArrowUpDown className="h-6 w-6 mb-2" />
                  <span>Stock Movement Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Item Details Dialog */}
      <Dialog open={!!selectedStockItem} onOpenChange={() => setSelectedStockItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Item Details</DialogTitle>
          </DialogHeader>
          {selectedStockItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medicine Name</label>
                  <p className="font-medium">{selectedStockItem.medicine_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Batch Number</label>
                  <p className="font-mono">{selectedStockItem.batch_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                  <p className="text-2xl font-bold">{selectedStockItem.current_stock} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reserved Stock</label>
                  <p>{selectedStockItem.reserved_stock} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                  <p>{selectedStockItem.supplier_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p>{selectedStockItem.rack_number} - {selectedStockItem.shelf_location}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stock Adjustment Form Component
const StockAdjustmentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    medicine_id: '',
    batch_number: '',
    adjustment_type: 'ADJUSTMENT' as const,
    quantity_change: 0,
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Stock adjustment:', formData);
    alert('Stock adjustment recorded successfully! (Demo mode)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Medicine *</label>
        <Input
          required
          placeholder="Search and select medicine"
          value={formData.medicine_id}
          onChange={(e) => setFormData(prev => ({ ...prev, medicine_id: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Batch Number *</label>
        <Input
          required
          value={formData.batch_number}
          onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
          placeholder="Enter batch number"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Adjustment Type</label>
        <select
          className="w-full p-2 border rounded"
          value={formData.adjustment_type}
          onChange={(e) => setFormData(prev => ({ ...prev, adjustment_type: e.target.value as any }))}
        >
          <option value="ADJUSTMENT">Stock Adjustment</option>
          <option value="DAMAGE">Damage/Loss</option>
          <option value="EXPIRY">Expiry Removal</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Quantity Change *</label>
        <Input
          type="number"
          required
          value={formData.quantity_change}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
          placeholder="Enter quantity (positive for increase, negative for decrease)"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Reason *</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          required
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Enter reason for adjustment"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Record Adjustment</Button>
      </div>
    </form>
  );
};

export default StockManagement;