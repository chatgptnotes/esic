
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from '../types/patient';

// Function to fetch all patients and format them like the Google Sheet
async function fetchPatients(): Promise<Patient[]> {
  console.log('Fetching patients with usePatientData hook...');
  
  const { data, error } = await supabase
    .from('patient_data')
    .select(`
      sr_no,
      patient_name,
      sst_or_secondary_treatment,
      mrn,
      patient_id,
      age,
      referral_original_yes_no,
      e_pahachan_card_yes_no,
      hitlabh_or_entitelment_benefits_yes_no,
      adhar_card_yes_no,
      sex,
      patient_type,
      reff_dr_name,
      date_of_admission,
      date_of_discharge
    `)
    .order('sr_no', { ascending: false });
  
  if (error) {
    console.error('Error in fetchPatients:', error);
    throw error;
  }
  
  console.log('Fetched data in usePatientData:', data);
  
  if (!data) {
    return [];
  }
  
  // Format data to match Patient interface
  return data.map((row, index) => ({
    id: row.patient_id || `patient-${index}`,
    name: row.patient_name || '',
    patients_id: row.patient_id || '',
    srNo: row.sr_no || index + 1,
    patientName: row.patient_name || '',
    sstOrSecondaryTreatment: row.sst_or_secondary_treatment || '',
    mrn: row.mrn || '',
    patientId: row.patient_id || '',
    age: row.age || '',
    referralOriginalYesNo: row.referral_original_yes_no || '',
    ePahachanCardYesNo: row.e_pahachan_card_yes_no || '',
    entitlementBenefitsYes: row.hitlabh_or_entitelment_benefits_yes_no || '',
    adharCardYesNo: row.adhar_card_yes_no || '',
    sex: row.sex || '',
    patientType: row.patient_type || '',
    reffDrName: row.reff_dr_name || '',
    dateOfAdmission: row.date_of_admission || ''
  }));
}

// Hook to use patient data
export function usePatientData() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  });
}

// Function to fetch a single patient by sr_no
export async function fetchPatientById(srNo: number) {
  const { data, error } = await supabase
    .from('patient_data')
    .select('*')
    .eq('sr_no', srNo)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Function to fetch patients with filters
export async function fetchPatientsWithFilters(filters: {
  name?: string;
  mrn?: string;
  patientId?: string;
}) {
  let query = supabase.from('patient_data').select('*');

  if (filters.name) {
    query = query.ilike('patient_name', `%${filters.name}%`);
  }

  if (filters.mrn) {
    query = query.eq('mrn', filters.mrn);
  }

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data;
}
