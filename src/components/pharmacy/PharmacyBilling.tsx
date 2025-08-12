// Pharmacy Billing and Dispensing Component
import React, { useState, useEffect } from 'react';
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
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Scan,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  FileText,
  Calculator,
  Trash2,
  Edit,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  Users,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';

interface CartItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  batch_number: string;
  expiry_date: string;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  available_stock: number;
  prescription_required: boolean;
}

interface Sale {
  id: string;
  bill_number: string;
  patient_id?: string;
  patient_name?: string;
  prescription_id?: string;
  sale_date: string;
  sale_type: 'antibiotic' | 'other';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CREDIT';
  payment_reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  cashier_name?: string;
  items: CartItem[];
}

const PharmacyBilling: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saleType, setSaleType] = useState<'antibiotic' | 'other'>('other');
  const [patientInfo, setPatientInfo] = useState({ id: '', name: '', phone: '' });
  const [prescriptionId, setPrescriptionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CREDIT'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [debouncedPatientName] = useDebounce(patientInfo.name, 300);
  const [debouncedPatientId] = useDebounce(patientInfo.id, 300);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [visitId, setVisitId] = useState('');
  const [visitOptions, setVisitOptions] = useState<string[]>([]);

  // Sale type options for allowed values (as per DB constraint)
  const saleTypeOptions = [
    { value: 'antibiotic', label: 'Antibiotic' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const searchMedicines = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('medication')
        .select('*, name, generic_name, strength, dosage, stock, price_per_strip')
        .or(`name.ilike.%${debouncedSearchTerm}%,generic_name.ilike.%${debouncedSearchTerm}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching for medicines:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
      setIsSearching(false);
    };

    searchMedicines();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const searchPatientsByName = async () => {
      if (debouncedPatientName.length < 2) {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
        return;
      }
      
      const justSelected = patientSearchResults.find(p => p.name === debouncedPatientName);
      if (justSelected && justSelected.patients_id === patientInfo.id) {
          return;
      }

      setIsSearchingPatient(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .ilike('name', `%${debouncedPatientName}%`)
        .limit(5);

      if (!error) {
        setPatientSearchResults(data || []);
        setShowPatientDropdown(true);
      }
      setIsSearchingPatient(false);
    };

    searchPatientsByName();
  }, [debouncedPatientName]);

  useEffect(() => {
    const searchPatientsById = async () => {
      if (debouncedPatientId.length < 2) {
        return;
      }
      
      if (patientInfo.name && patientInfo.id === debouncedPatientId) {
          return;
      }

      setIsSearchingPatient(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .eq('patients_id', debouncedPatientId)
        .single();

      if (data) {
        setPatientInfo({ id: data.patients_id, name: data.name, phone: '' });
        setShowPatientDropdown(false);
      }
      setIsSearchingPatient(false);
    };

    searchPatientsById();
  }, [debouncedPatientId]);

  useEffect(() => {
    const fetchVisitsForPatient = async () => {
      if (!patientInfo.id || patientInfo.id.length < 2) {
        setVisitOptions([]);
        setVisitId('');
        return;
      }
      // 1. Get patient row from patients table using patients_id
      const { data: patientRows, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('patients_id', patientInfo.id)
        .limit(1);
      if (patientError || !patientRows || patientRows.length === 0) {
        setVisitOptions([]);
        setVisitId('');
        return;
      }
      const patientRow = patientRows[0];
      // 2. Use id to get visits, sorted by created_at DESC
      const { data: visits, error: visitError } = await supabase
        .from('visits')
        .select('visit_id, created_at')
        .eq('patient_id', patientRow.id)
        .order('created_at', { ascending: false });
      if (visitError || !visits || visits.length === 0) {
        setVisitOptions([]);
        setVisitId('');
        return;
      }
      setVisitOptions(visits.map(v => v.visit_id));
      setVisitId(visits[0].visit_id); // Auto-select latest
    };
    fetchVisitsForPatient();
  }, [patientInfo.id]);

  const handleSelectPatient = (patient: { name: string, patients_id: string }) => {
    setPatientInfo({ name: patient.name, id: patient.patients_id, phone: '' });
    setShowPatientDropdown(false);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const addToCart = (medicine: any) => {
    const existingItem = cart.find(item => item.medicine_id === medicine.id && item.batch_number === medicine.batch_number);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        generic_name: medicine.generic_name,
        strength: medicine.strength,
        dosage_form: medicine.dosage,
        batch_number: medicine.batch_number,
        expiry_date: medicine.expiry_date,
        unit_price: medicine.price_per_strip || 0,
        quantity: 1,
        discount_percentage: 0,
        discount_amount: 0,
        tax_percentage: medicine.tax_percentage || 12,
        tax_amount: 0,
        total_amount: 0,
        available_stock: medicine.stock,
        prescription_required: medicine.prescription_required
      };
      
      // Calculate amounts
      const subtotal = newItem.unit_price * newItem.quantity;
      const discountAmount = (subtotal * newItem.discount_percentage) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * newItem.tax_percentage) / 100;
      const totalAmount = taxableAmount + taxAmount;
      
      newItem.discount_amount = discountAmount;
      newItem.tax_amount = taxAmount;
      newItem.total_amount = totalAmount;
      
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unit_price * newQuantity;
        const discountAmount = (subtotal * item.discount_percentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax_percentage) / 100;
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          quantity: newQuantity,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount
        };
      }
      return item;
    }));
  };

  const updateDiscount = (itemId: string, discountPercentage: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unit_price * item.quantity;
        const discountAmount = (subtotal * discountPercentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax_percentage) / 100;
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount
        };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setPatientInfo({ id: '', name: '', phone: '' });
    setPrescriptionId('');
    setDiscountPercentage(0);
    setPaymentReference('');
    setVisitId('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.total_amount, 0);
    
    return { subtotal, totalDiscount, totalTax, totalAmount };
  };

  const getVisitUUID = async (visitIdString: string) => {
    // Fetch the UUID (id) for the selected visit_id string
    const { data, error } = await supabase
      .from('visits')
      .select('id')
      .eq('visit_id', visitIdString)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].id;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (!visitId) {
      alert('Please enter Visit ID');
      return;
    }
    setIsProcessingPayment(true);
    // Get the UUID for the selected visit_id string
    const visitUUID = await getVisitUUID(visitId);
    if (!visitUUID) {
      alert('Could not find visit UUID for selected Visit ID.');
      setIsProcessingPayment(false);
      return;
    }
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const totals = calculateTotals();
    const billNumber = `BILL${Date.now()}`;
    const sale: Sale = {
      id: Date.now().toString(),
      bill_number: billNumber,
      patient_id: patientInfo.id || undefined,
      patient_name: patientInfo.name || undefined,
      prescription_id: prescriptionId || undefined,
      sale_date: new Date().toISOString(),
      sale_type: saleType,
      subtotal: totals.subtotal,
      discount_amount: totals.totalDiscount,
      tax_amount: totals.totalTax,
      total_amount: totals.totalAmount,
      paid_amount: totals.totalAmount,
      balance_amount: 0,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      status: 'COMPLETED',
      cashier_name: 'Current User',
      items: [...cart]
    };
    // Insert into visit_medications (one row per medicine)
    console.log('Saving medication_type:', saleType);
    const now = new Date().toISOString();
    const rowsToInsert = [];
    for (const item of cart) {
      // Check for duplicate
      const { data: existing, error: checkError } = await supabase
        .from('visit_medications')
        .select('id')
        .eq('visit_id', visitUUID)
        .eq('medication_id', item.medicine_id)
        .eq('medication_type', saleType);
      if (checkError) {
        alert('Error checking for duplicates: ' + checkError.message);
        setIsProcessingPayment(false);
        return;
      }
      if (existing && existing.length > 0) {
        alert(`This medicine (${item.medicine_name}) is already added for this visit and type.`);
        setIsProcessingPayment(false);
        return;
      }
      rowsToInsert.push({
        visit_id: visitUUID, // Use UUID
        medication_id: item.medicine_id,
        prescribed_date: now,
        start_date: null,
        end_date: null,
        created_at: now,
        updated_at: now,
        status: 'dispensed', // Use allowed value
        notes: `Pharmacy bill for patient ${patientInfo.name} (${patientInfo.id})`,
        medication_type: saleType,
        dosage: item.strength || null,
        frequency: null,
        duration: null,
        route: null,
      });
    }
    if (rowsToInsert.length === 0) {
      setIsProcessingPayment(false);
      return;
    }
    console.log('Rows to insert:', rowsToInsert);
    const { error: insertError } = await supabase
      .from('visit_medications')
      .insert(rowsToInsert);
    if (insertError) {
      alert('Error saving bill to visit_medications: ' + insertError.message);
      setIsProcessingPayment(false);
      return;
    }
    // Insert summary into pharmacy_sales
    const billSummary = {
      bill_no: billNumber,
      patient_id: patientInfo.id,
      visit_id: visitId,
      patient_name: patientInfo.name,
      total: totals.totalAmount,
      paid: totals.totalAmount, // You can adjust if partial payment
      discount: totals.totalDiscount,
      date: now,
      created_at: now,
      updated_at: now,
    };
    const { error: salesError } = await supabase
      .from('pharmacy_sales')
      .insert([billSummary]);
    if (salesError) {
      alert('Error saving bill summary to pharmacy_sales: ' + salesError.message);
      setIsProcessingPayment(false);
      return;
    }
    setCompletedSale(sale);
    setIsProcessingPayment(false);
    clearCart();
  };

  const filteredMedicines = searchResults.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Pharmacy Billing & Dispensing</h2>
            <p className="text-sm text-muted-foreground">
              Process sales, dispense medications, and manage payments
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button variant="outline">
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Search and Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Type and Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Sale Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value as any)}
                  >
                    {saleTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <Input
                    placeholder="Enter patient ID"
                    value={patientInfo.id}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Visit ID</label>
                  {visitOptions.length > 0 ? (
                    <select
                      className="w-full p-2 border rounded"
                      value={visitId}
                      onChange={e => setVisitId(e.target.value)}
                    >
                      <option value="">Select visit ID</option>
                      {visitOptions.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Enter visit ID"
                      value={visitId}
                      onChange={e => setVisitId(e.target.value)}
                    />
                  )}
                </div>
                <div className="relative">
                  <label className="text-sm font-medium">Patient Name</label>
                  <Input
                    placeholder="Enter patient name"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo(prev => ({...prev, name: e.target.value}))}
                    onFocus={() => { if (patientInfo.name) setShowPatientDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 100)}
                  />
                  {showPatientDropdown && patientSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-y-auto">
                      {isSearchingPatient 
                        ? <div className="p-2">Searching...</div>
                        : patientSearchResults.map(p => (
                            <div 
                              key={p.patients_id} 
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => handleSelectPatient(p)}
                            >
                              {p.name} ({p.patients_id})
                            </div>
                          ))
                      }
                    </div>
                  )}
                </div>
              </div>
              {saleType === 'antibiotic' && (
                <div>
                  <label className="text-sm font-medium">Prescription ID</label>
                  <Input
                    placeholder="Enter prescription ID"
                    value={prescriptionId}
                    onChange={(e) => setPrescriptionId(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicine Search */}
          <Card>
            <CardHeader>
              <CardTitle>Add Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search medicines by name or generic name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchTerm && (
                  <div className="max-h-60 overflow-y-auto border rounded">
                    {isSearching && <div className="p-4 text-center">Searching...</div>}
                    {!isSearching && searchResults.map((medicine) => (
                      <div 
                        key={medicine.id}
                        className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => addToCart(medicine)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {medicine.strength} • {medicine.dosage}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {medicine.stock}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(medicine.price_per_strip || 0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!isSearching && searchResults.length === 0 && searchTerm.length > 1 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No medicines found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart ({cart.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground">Search and add medicines to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.medicine_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.strength} • {item.dosage_form} • Batch: {item.batch_number}
                        </div>
                        <div className="text-sm">
                          {formatCurrency(item.unit_price)} each
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Disc %"
                          value={item.discount_percentage}
                          onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                          className="text-xs"
                        />
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <div className="font-medium">{formatCurrency(item.total_amount)}</div>
                        {item.discount_amount > 0 && (
                          <div className="text-xs text-green-600">
                            -{formatCurrency(item.discount_amount)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary and Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatCurrency(totals.totalDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST):</span>
                <span>{formatCurrency(totals.totalTax)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['CASH', 'CARD', 'UPI', 'INSURANCE'].map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method as any)}
                    className="h-12"
                  >
                    {method === 'CASH' && <DollarSign className="h-4 w-4 mr-2" />}
                    {method === 'CARD' && <CreditCard className="h-4 w-4 mr-2" />}
                    {method}
                  </Button>
                ))}
              </div>
              
              {paymentMethod !== 'CASH' && (
                <Input
                  placeholder="Payment reference/transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          {/* Process Payment */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full h-12 text-lg"
                onClick={processSale}
                disabled={cart.length === 0 || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Sale - {formatCurrency(totals.totalAmount)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Sales:</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue:</span>
                <span className="font-medium">{formatCurrency(125750)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Bill:</span>
                <span className="font-medium">{formatCurrency(2794)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sale Completion Dialog */}
      <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              Sale Completed Successfully!
            </DialogTitle>
          </DialogHeader>
          {completedSale && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedSale.bill_number}</div>
                <div className="text-muted-foreground">
                  {new Date(completedSale.sale_date).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">{formatCurrency(completedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{completedSale.payment_method}</span>
                </div>
                {completedSale.patient_name && (
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span>{completedSale.patient_name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Email Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyBilling;