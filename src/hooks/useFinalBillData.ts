
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillSection {
  id: string;
  section_title: string;
  date_from: string | null;
  date_to: string | null;
  section_order: number;
}

export interface BillLineItem {
  id: string;
  bill_section_id: string | null;
  sr_no: string;
  item_description: string;
  cghs_nabh_code: string | null;
  cghs_nabh_rate: number | null;
  qty: number;
  amount: number;
  item_type: 'standard' | 'surgical';
  base_amount: number | null;
  primary_adjustment: string | null;
  secondary_adjustment: string | null;
  dates_info: string | null;
  item_order: number;
}

export interface BillData {
  id: string;
  bill_no: string;
  claim_id: string;
  date: string;
  category: string;
  total_amount: number;
  status: string;
  sections: BillSection[];
  line_items: BillLineItem[];
}

export const useFinalBillData = (visitId: string) => {
  const queryClient = useQueryClient();

  const { data: billData, isLoading, error } = useQuery({
    queryKey: ['final-bill', visitId],
    queryFn: async () => {
      // First get patient ID from visit
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
        return null;
      }

      // Then get the most recent bill for this patient
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('patient_id', visitData.patient_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (billsError) {
        console.error('Error fetching bill:', billsError);
        throw billsError;
      }

      if (!billsData) {
        return null;
      }

      // Get sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('bill_sections')
        .select('*')
        .eq('bill_id', billsData.id)
        .order('section_order');

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        throw sectionsError;
      }

      // Get line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('bill_line_items')
        .select('*')
        .eq('bill_id', billsData.id)
        .order('item_order');

      if (lineItemsError) {
        console.error('Error fetching line items:', lineItemsError);
        throw lineItemsError;
      }

      return {
        ...billsData,
        sections: sectionsData || [],
        line_items: lineItemsData || []
      } as BillData;
    },
    enabled: !!visitId,
  });

  const saveBillMutation = useMutation({
    mutationFn: async (billData: {
      patient_id: string;
      bill_no: string;
      claim_id: string;
      date: string;
      category: string;
      total_amount: number;
      sections: any[];
      line_items: any[];
    }) => {
      console.log('💾 Starting bill save with total_amount:', billData.total_amount);
      console.log('📊 Full bill data:', billData);
      
      // First, create or update the main bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .upsert({
          patient_id: billData.patient_id,
          bill_no: billData.bill_no,
          claim_id: billData.claim_id,
          date: billData.date,
          category: billData.category,
          total_amount: billData.total_amount,
          status: 'DRAFT'
        })
        .select()
        .single();

      if (billError) {
        console.error('Error saving bill:', billError);
        throw billError;
      }

      // Delete existing sections and line items
      await supabase.from('bill_sections').delete().eq('bill_id', bill.id);
      await supabase.from('bill_line_items').delete().eq('bill_id', bill.id);

      // Save sections
      if (billData.sections.length > 0) {
        const sectionsToInsert = billData.sections.map((section, index) => ({
          bill_id: bill.id,
          section_title: section.title,
          date_from: section.dates?.from ? new Date(section.dates.from).toISOString().split('T')[0] : null,
          date_to: section.dates?.to ? new Date(section.dates.to).toISOString().split('T')[0] : null,
          section_order: index
        }));

        const { error: sectionsError } = await supabase
          .from('bill_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          console.error('Error saving sections:', sectionsError);
          throw sectionsError;
        }
      }

      // Save line items
      if (billData.line_items.length > 0) {
        const lineItemsToInsert = billData.line_items.map((item, index) => ({
          bill_id: bill.id,
          bill_section_id: null, // We'll need to map this properly if needed
          sr_no: item.srNo || `${index + 1}`,
          item_description: item.description || '',
          cghs_nabh_code: item.code || null,
          cghs_nabh_rate: item.rate ? parseFloat(item.rate.toString()) : null,
          qty: item.qty || 1,
          amount: item.amount ? parseFloat(item.amount.toString()) : 0,
          item_type: item.type || 'standard',
          base_amount: item.type === 'surgical' && item.baseAmount ? parseFloat(item.baseAmount.toString()) : null,
          primary_adjustment: item.type === 'surgical' ? item.primaryAdjustment : null,
          secondary_adjustment: item.type === 'surgical' ? item.secondaryAdjustment : null,
          dates_info: item.dates ? JSON.stringify(item.dates) : null,
          item_order: index
        }));

        const { error: lineItemsError } = await supabase
          .from('bill_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) {
          console.error('Error saving line items:', lineItemsError);
          throw lineItemsError;
        }
      }

      console.log('✅ Bill saved successfully with ID:', bill.id);
      console.log('✅ Saved total_amount:', bill.total_amount);
      
      return bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-bill', visitId] });
    },
  });

  return {
    billData,
    isLoading,
    error,
    saveBill: saveBillMutation.mutate,
    isSaving: saveBillMutation.isPending
  };
};
