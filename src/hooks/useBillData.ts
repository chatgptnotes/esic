
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBillData = (patientId: string | null, visitId: string | null) => {
  return useQuery({
    queryKey: ['bill-data', patientId, visitId],
    queryFn: async () => {
      if (!patientId || !visitId) return null;

      // Fetch bill data with items - use maybeSingle to handle no results
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select(`
          *,
          bill_items (
            *
          )
        `)
        .eq('patient_id', patientId)
        .maybeSingle();

      if (billError && billError.code !== 'PGRST116') {
        console.error('Error fetching bill data:', billError);
      }

      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) {
        console.error('Error fetching patient data:', patientError);
        throw patientError;
      }

      // Fetch visit data
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .eq('visit_id', visitId)
        .maybeSingle();

      if (visitError && visitError.code !== 'PGRST116') {
        console.error('Error fetching visit data:', visitError);
      }

      // Create default bill data if none exists
      const defaultBill = billData || {
        id: null,
        bill_no: 'BL24D-20196',
        claim_id: 'CLAIM-2025-1701',
        date: new Date().toISOString().split('T')[0],
        category: 'GENERAL',
        total_amount: 0,
        status: 'DRAFT'
      };

      return {
        bill: defaultBill,
        patient: patientData,
        visit: visitData
      };
    },
    enabled: !!patientId && !!visitId,
  });
};
