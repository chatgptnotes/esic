import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Trash2, Calendar, Clock, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const OldBills = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  // Fetch all bills for this visit
  const { data: bills, isLoading, refetch } = useQuery({
    queryKey: ['old-bills', visitId],
    queryFn: async () => {
      if (!visitId) return [];

      // First get the visit to find the patient_id
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('patient_id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit:', visitError);
        throw visitError;
      }

      if (!visitData?.patient_id) {
        return [];
      }

      // Then get all bills for this patient
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_sections(*),
          bill_line_items(*)
        `)
        .eq('patient_id', visitData.patient_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bills:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch visit details for context
  const { data: visitDetails } = useQuery({
    queryKey: ['visit-details', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients(name, patients_id)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) {
        console.error('Error fetching visit details:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  const handleViewBill = (billId: string) => {
    // Navigate to view bill page (we'll implement this)
    navigate(`/view-bill/${billId}`);
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      return;
    }

    setDeletingBillId(billId);
    
    try {
      // Delete bill line items first
      await supabase
        .from('bill_line_items')
        .delete()
        .eq('bill_id', billId);

      // Delete bill sections
      await supabase
        .from('bill_sections')
        .delete()
        .eq('bill_id', billId);

      // Delete the main bill
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;

      toast({
        title: "Bill Deleted",
        description: "The bill has been successfully deleted.",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete the bill. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingBillId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading bills...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/final-bill/${visitId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Current Bill
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Previous Bills</h1>
              {visitDetails && (
                <p className="text-gray-600 mt-1">
                  Patient: <span className="font-semibold">{visitDetails.patients?.name}</span> 
                  {visitDetails.patients?.patients_id && (
                    <span className="ml-2 text-sm">({visitDetails.patients.patients_id})</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bills List */}
        {!bills || bills.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Previous Bills</h3>
              <p className="text-gray-600">No bills have been saved for this visit yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-lg">
                        Bill #{bill.bill_number || bill.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="secondary">
                        {formatCurrency(bill.total_amount || 0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBill(bill.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBill(bill.id)}
                        disabled={deletingBillId === bill.id}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingBillId === bill.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">
                          {format(new Date(bill.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-medium">
                          {format(new Date(bill.created_at), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Total Amount</p>
                        <p className="font-medium">
                          {formatCurrency(bill.total_amount || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Claim ID</p>
                        <p className="font-medium">
                          {bill.claim_id || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {bill.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {bill.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OldBills;
