// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Filter, RotateCcw, Plus, Search, Trash2, Edit, Eye, FileText, User, Phone, Clock, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PatientSearchWithVisit from './PatientSearchWithVisit';
import { safeArrayAccess } from '@/utils/arrayHelpers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LabTest {
  id: string;
  name: string;
  test_code: string;
  category: string;
  sample_type: string;
  price: number;
  turnaround_time: number;
  preparation_instructions?: string;
}

interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  order_date: string;
  order_status: string;
  priority: string;
  ordering_doctor: string;
  total_amount: number;
  payment_status: string;
  collection_date?: string;
  collection_time?: string;
  clinical_history?: string;
  provisional_diagnosis?: string;
  special_instructions?: string;
  patient_id?: string;
}

interface LabTestRow {
  id: string;
  order_id: string;
  test_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  order_number: string;
  test_name: string;
  test_category: string;
  test_method?: string;
  order_date: string;
  order_status: string;
  ordering_doctor: string;
  clinical_history?: string;
  sample_status: 'not_taken' | 'taken' | 'saved';
}

interface PatientWithVisit {
  id: string;
  name: string;
  patients_id: string;
  visitId: string;
  visitDate: string;
  visitType: string;
  status: string;
  appointmentWith: string;
  reasonForVisit: string;
  admissionDate?: string;
  dischargeDate?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  primaryDiagnosis?: string;
  consultant?: string;
  corporate?: string;
  insurancePersonNo?: string;
}

const LabOrders = () => {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Sample taken and included states (now for individual tests)
  const [sampleTakenTests, setSampleTakenTests] = useState<string[]>([]);
  const [includedTests, setIncludedTests] = useState<string[]>([]);
  const [isEntryModeOpen, setIsEntryModeOpen] = useState(false);
  const [selectedTestsForEntry, setSelectedTestsForEntry] = useState<LabTestRow[]>([]);
  
  // Track test sample status
  const [testSampleStatus, setTestSampleStatus] = useState<Record<string, 'not_taken' | 'taken' | 'saved'>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Lab Results Entry Form States
  const [labResultsForm, setLabResultsForm] = useState<Record<string, {
    result_value: string;
    result_unit: string;
    reference_range: string;
    comments: string;
    is_abnormal: boolean;
    result_status: 'Preliminary' | 'Final';
  }>>({});
  
  // NEW: State for saved results (for print preview)
  const [savedLabResults, setSavedLabResults] = useState<Record<string, {
    result_value: string;
    result_unit: string;
    reference_range: string;
    comments: string;
    is_abnormal: boolean;
    result_status: 'Preliminary' | 'Final';
    saved_at: string;
    patient_info: any;
    authenticated: boolean;
  }>>({});
  
  // NEW: Track if current form has been saved
  const [isFormSaved, setIsFormSaved] = useState(false);
  
  const [authenticatedResult, setAuthenticatedResult] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  
  // Form states for new order
  const [selectedPatient, setSelectedPatient] = useState<PatientWithVisit | null>(null);
  const [orderForm, setOrderForm] = useState({
    priority: 'Normal',
    orderingDoctor: '',
    clinicalHistory: '',
    provisionalDiagnosis: '',
    specialInstructions: '',
    collectionDate: new Date(),
    collectionTime: '09:00'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // NEW: Function to calculate reference range from lab table attributes
  const calculateReferenceRange = useCallback(async (testName: string, patientAge: number, patientGender: string) => {
    try {
      console.log('🔍 Calculating reference range for:', { testName, patientAge, patientGender });
      
      // Fetch lab test data with attributes
      const { data: labData, error: labError } = await supabase
        .from('lab')
        .select('attributes')
        .eq('name', testName)
        .maybeSingle();

      if (labError || !labData) {
        console.log('⚠️ Lab test not found:', testName);
        return getDefaultReferenceRange(testName, patientAge, patientGender);
      }

      // Check if attributes exist and have normalRange data
      const attributes = (labData as any).attributes as any[];
      if (attributes && 
          Array.isArray(attributes) && 
          attributes.length > 0 &&
          attributes[0]?.normalRange) {
        
        const attributeData = attributes[0];
        const normalRange = attributeData.normalRange;
        const units = attributeData.units || ''; // Get units from attributes
        
        console.log('📊 Lab attributes found:', attributeData);

        // Determine gender category (male/female/child)
        const genderKey = patientGender.toLowerCase() === 'male' ? 'male' : 
                         patientGender.toLowerCase() === 'female' ? 'female' : 'child';

        // Check if there's gender-specific range
        if (normalRange[genderKey] && (normalRange[genderKey].ll || normalRange[genderKey].ul || normalRange[genderKey].default)) {
          const range = normalRange[genderKey];
          let rangeText = '';
          
          if (range.default) {
            rangeText = range.default;
          } else if (range.ll && range.ul) {
            rangeText = `${range.ll} - ${range.ul}`;
          } else if (range.ll) {
            rangeText = `> ${range.ll}`;
          } else if (range.ul) {
            rangeText = `< ${range.ul}`;
          }
          
          // Add units if available
          return units ? `${rangeText} ${units}` : rangeText;
        }

        // Check age-based ranges
        if (normalRange.ageRanges && normalRange.ageRanges.length > 0) {
          for (const ageRange of normalRange.ageRanges) {
            let rangeText = '';
            // Simple age matching - can be enhanced based on your age range format
            if (ageRange.ll && ageRange.ul) {
              rangeText = `${ageRange.ll} - ${ageRange.ul}`;
            } else if (ageRange.default) {
              rangeText = ageRange.default;
            }
            
            // Add units if available
            return units ? `${rangeText} ${units}` : rangeText;
          }
        }

        // Check general ranges
        if (normalRange.ranges && normalRange.ranges.length > 0) {
          const range = normalRange.ranges[0]; // Use first range as default
          let rangeText = '';
          
          if (range.ll && range.ul) {
            rangeText = `${range.ll} - ${range.ul}`;
          } else if (range.default) {
            rangeText = range.default;
          }
          
          // Add units if available
          return units ? `${rangeText} ${units}` : rangeText;
        }
      }

      // Fallback to default ranges if no attributes data found
      return getDefaultReferenceRange(testName, patientAge, patientGender);
    } catch (error) {
      console.error('Error calculating reference range:', error);
      return getDefaultReferenceRange(testName, patientAge, patientGender);
    }
  }, []);

  // NEW: Fallback function for common test reference ranges
  const getDefaultReferenceRange = useCallback((testName: string, patientAge: number, patientGender: string) => {
    const testNameLower = testName.toLowerCase();
    const isMale = patientGender.toLowerCase() === 'male';
    
    // Common lab test reference ranges
    const commonRanges: Record<string, string | ((age: number, isMale: boolean) => string)> = {
      'complete blood count': 'See individual parameters',
      'cbc': 'See individual parameters',
      'hemoglobin': (age: number, isMale: boolean) => {
        if (isMale) return '13.5-17.5 g/dL';
        return '12.0-15.5 g/dL';
      },
      'hematocrit': (age: number, isMale: boolean) => {
        if (isMale) return '41-50 %';
        return '36-44 %';
      },
      'wbc': '4,000-11,000 /μL',
      'white blood cell': '4,000-11,000 /μL',
      'platelet': '150,000-450,000 /μL',
      'blood sugar (f)': '70-100 mg/dL',
      'blood sugar (pp)': '< 140 mg/dL',
      'blood sugar (r)': '70-140 mg/dL',
      'glucose': '70-100 mg/dL',
      'creatinine': (age: number, isMale: boolean) => {
        if (isMale) return '0.7-1.3 mg/dL';
        return '0.6-1.1 mg/dL';
      },
      'urea': '15-40 mg/dL',
      'bun': '7-20 mg/dL',
      'cholesterol': '< 200 mg/dL',
      'triglycerides': '< 150 mg/dL',
      'hdl': (age: number, isMale: boolean) => {
        if (isMale) return '> 40 mg/dL';
        return '> 50 mg/dL';
      },
      'ldl': '< 100 mg/dL',
      'alt': '7-56 U/L',
      'ast': '10-40 U/L',
      'alkaline phosphatase': '44-147 U/L',
      'bilirubin': '0.2-1.2 mg/dL',
      'total protein': '6.0-8.3 g/dL',
      'albumin': '3.5-5.0 g/dL',
      'calcium': '8.5-10.5 mg/dL',
      'phosphorus': '2.5-4.5 mg/dL',
      'magnesium': '1.7-2.2 mg/dL',
      'sodium': '136-145 mEq/L',
      'potassium': '3.5-5.0 mEq/L',
      'chloride': '98-107 mEq/L',
      'tsh': '0.4-4.0 mIU/L',
      'thyroid stimulating hormone': '0.4-4.0 mIU/L',
      'vitamin d': '30-100 ng/mL',
      'vitamin b12': '200-900 pg/mL',
      'iron': (age: number, isMale: boolean) => {
        if (isMale) return '65-175 μg/dL';
        return '50-170 μg/dL';
      },
      'ferritin': (age: number, isMale: boolean) => {
        if (isMale) return '12-300 ng/mL';
        return '12-150 ng/mL';
      },
      // Additional common tests
      'hba1c': '< 5.7 %',
      'esr': (age: number, isMale: boolean) => {
        if (isMale) return '0-15 mm/hr';
        return '0-20 mm/hr';
      },
      'c-reactive protein': '< 3.0 mg/L',
      'crp': '< 3.0 mg/L',
      'uric acid': (age: number, isMale: boolean) => {
        if (isMale) return '3.4-7.0 mg/dL';
        return '2.4-6.0 mg/dL';
      },
      'troponin': '< 0.04 ng/mL',
      'ck-mb': '0-6.3 ng/mL',
      'ldh': '140-280 U/L',
      'amylase': '30-110 U/L',
      'lipase': '10-140 U/L'
    };

    // Try to find matching test name
    for (const [key, range] of Object.entries(commonRanges)) {
      if (testNameLower.includes(key)) {
        if (typeof range === 'function') {
          return range(patientAge, isMale);
        }
        return range;
      }
    }

    // Default fallback
    return 'Consult reference values';
  }, []);

  // NEW: State to store calculated reference ranges
  const [calculatedRanges, setCalculatedRanges] = useState<Record<string, string>>({});

  // NEW: Effect to calculate reference ranges when tests are selected for entry
  useEffect(() => {
    if (selectedTestsForEntry.length > 0) {
      const calculateRanges = async () => {
        const ranges: Record<string, string> = {};
        
        for (const testRow of selectedTestsForEntry) {
          const range = await calculateReferenceRange(
            testRow.test_name,
            testRow.patient_age || 30, // Default age if not available
            testRow.patient_gender || 'Male' // Default gender if not available
          );
          ranges[testRow.id] = range;
        }
        
        setCalculatedRanges(ranges);
      };

      calculateRanges();
    }
  }, [selectedTestsForEntry, calculateReferenceRange]);

  // Sample save mutation
  const saveSamplesMutation = useMutation({
    mutationFn: async (testIds: string[]) => {
      // Mark all selected tests as saved
      const updatedStatus: Record<string, 'saved'> = {};
      testIds.forEach(testId => {
        updatedStatus[testId] = 'saved';
      });
      
      setTestSampleStatus(prev => ({ ...prev, ...updatedStatus }));
      
      return testIds;
    },
    onSuccess: (testIds) => {
      // Clear sample taken tests and reset included tests
      setSampleTakenTests([]);
      setIncludedTests([]);
      
      toast({
        title: "Samples Saved Successfully",
        description: `${testIds.length} test sample(s) status updated. Now you can select Incl. checkbox for entry mode.`,
      });
    },
    onError: (error) => {
      console.error('Save samples error:', error);
      toast({
        title: "Error",
        description: "Failed to save samples. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Lab Results Save Mutation - Store in visit_labs table
  const saveLabResultsMutation = useMutation({
    mutationFn: async (resultsData: any[]) => {
      console.log('🔍 Starting lab results save process...', resultsData);
      const results = [];
      
      for (const result of resultsData) {
        console.log('📝 Processing result:', result);
        
        try {
          // First, get the order data to extract visit ID and patient ID
          console.log('1️⃣ Fetching order data for order_id:', result.order_id);
          const { data: orderData, error: orderError } = await supabase
            .from('lab_orders')
            .select('internal_notes, patient_id')
            .eq('id', result.order_id)
            .single();

          if (orderError) {
            console.error('❌ Error fetching order data:', orderError);
            throw new Error(`Failed to fetch order data: ${orderError.message}`);
          }

          console.log('✅ Order data fetched:', orderData);

          // Extract visit ID from internal_notes (format: "Visit ID: IH25E02010")
          let visitIdText = orderData.internal_notes?.replace('Visit ID: ', '') || '';
          console.log('2️⃣ Extracted visit ID text:', visitIdText);
          
          // If no visit ID in internal_notes, try to get from patient selection
          if (!visitIdText) {
            console.log('⚠️ No visit ID in internal_notes, trying alternative approach...');
            
            // Try to get patient data and find latest visit
            const { data: patientData, error: patientError } = await supabase
              .from('patients')
              .select('id, patients_id')
              .eq('id', orderData.patient_id)  // Use UUID lookup, not patients_id
              .single();

            if (patientError) {
              console.error('❌ Error fetching patient:', patientError);
              throw new Error(`No visit ID available and cannot fetch patient: ${patientError.message}`);
            }

            // Get latest visit for this patient
            const { data: latestVisit, error: visitFetchError } = await supabase
              .from('visits')
              .select('id, visit_id')
              .eq('patient_id', patientData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (visitFetchError || !latestVisit) {
              console.error('❌ Error fetching latest visit:', visitFetchError);
              throw new Error('No visit found for this patient. Please create a visit first.');
            }

            visitIdText = latestVisit.visit_id;
            console.log('✅ Found latest visit ID:', visitIdText);
          }
          
          // Get visit UUID from visit_id (text)
          console.log('3️⃣ Fetching visit UUID for visit_id:', visitIdText);
          const { data: visitData, error: visitError } = await supabase
            .from('visits')
            .select('id')
            .eq('visit_id', visitIdText)
            .single();

          if (visitError) {
            console.error('❌ Error fetching visit data:', visitError);
            throw new Error(`Failed to fetch visit data for ${visitIdText}: ${visitError.message}`);
          }

          console.log('✅ Visit data fetched:', visitData);

          // Find corresponding lab in the lab table
          console.log('4️⃣ Searching for lab with name:', result.test_name);
          const { data: labData, error: labError } = await supabase
            .from('lab')
            .select('id')
            .eq('name', result.test_name)
            .maybeSingle();

          if (labError) {
            console.error('❌ Error fetching lab data:', labError);
            throw new Error(`Failed to fetch lab data: ${labError.message}`);
          }

          console.log('🔬 Lab data found:', labData);

          let labId = labData?.id;
          
          // If lab doesn't exist, create it
          if (!labId) {
            console.log('5️⃣ Creating new lab record for:', result.test_name);
            
            // Ensure we have a valid test name
            const testName = result.test_name || `Lab Test ${result.test_id}` || 'Unknown Test';
            const testCategory = result.test_category || 'General';
            
            console.log('📝 Lab creation data:', { name: testName, category: testCategory });
            
            const { data: newLab, error: createLabError } = await supabase
              .from('lab')
              .insert({
                name: testName,
                category: testCategory,
                description: 'Auto-created from lab results'
              })
              .select('id')
              .single();

            if (createLabError) {
              console.error('❌ Error creating lab:', createLabError);
              throw new Error(`Failed to create lab: ${createLabError.message}`);
            }
            
            labId = newLab.id;
            console.log('✅ New lab created with ID:', labId);
          }

          // Prepare visit_labs data
          const visitLabData = {
            visit_id: visitData.id, // UUID
            lab_id: labId, // UUID
            status: authenticatedResult ? 'completed' : 'in_progress', // Note: underscore, not hyphen
            result_value: result.result_value,
            normal_range: result.reference_range,
            notes: result.comments,
            collected_date: new Date().toISOString(),
            completed_date: authenticatedResult ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          };

          console.log('6️⃣ Prepared visit_labs data:', visitLabData);

          // Try to update existing record first, then insert if not found
          console.log('7️⃣ Checking for existing visit_labs record...');
          const { data: existingRecord, error: checkError } = await supabase
            .from('visit_labs')
            .select('id')
            .eq('visit_id', visitData.id)
            .eq('lab_id', labId)
            .maybeSingle();

          if (checkError) {
            console.error('❌ Error checking existing record:', checkError);
            // Continue with insert anyway
          }

          console.log('🔍 Existing record check result:', existingRecord);

          let finalResult;
          if (existingRecord) {
            // Update existing record
            console.log('8️⃣ Updating existing visit_labs record...');
            const { data, error } = await supabase
              .from('visit_labs')
              .update(visitLabData)
              .eq('id', existingRecord.id)
              .select()
              .single();

            if (error) {
              console.error('❌ Error updating visit_labs:', error);
              throw new Error(`Failed to update visit_labs: ${error.message}`);
            }
            finalResult = data;
            console.log('✅ Visit_labs record updated:', finalResult);
          } else {
            // Insert new record
            console.log('9️⃣ Inserting new visit_labs record...');
            const { data, error } = await supabase
              .from('visit_labs')
              .insert(visitLabData)
              .select()
              .single();

            if (error) {
              console.error('❌ Error inserting visit_labs:', error);
              console.error('❌ Failed data:', visitLabData);
              throw new Error(`Failed to insert visit_labs: ${error.message}`);
            }
            finalResult = data;
            console.log('✅ Visit_labs record inserted:', finalResult);
          }

          // Add patient and visit info to result for print usage
          // Get complete patient data from the fetched patient info
          console.log('🔍 Fetching enhanced patient data for patient_id:', orderData.patient_id);
          const { data: currentPatientData, error: currentPatientError } = await supabase
            .from('patients')
            .select('id, patients_id, name, age, gender, phone')
            .eq('id', orderData.patient_id)
            .single();

          if (currentPatientError) {
            console.error('❌ Error fetching patient data:', currentPatientError);
          } else {
            console.log('✅ Enhanced patient data:', currentPatientData);
          }

          // Get visit data for additional info
          console.log('🔍 Fetching enhanced visit data for visit_id:', visitData.id);
          const { data: currentVisitData, error: currentVisitError } = await supabase
            .from('visits')
            .select('id, visit_id, appointment_with, reason_for_visit')
            .eq('id', visitData.id)
            .single();

          if (currentVisitError) {
            console.error('❌ Error fetching visit data:', currentVisitError);
          } else {
            console.log('✅ Enhanced visit data:', currentVisitData);
          }

          const resultWithPatientInfo = {
            ...finalResult,
            patient_uid: currentPatientData?.patients_id || 'N/A',
            visit_id: visitIdText,
            patient_age: currentPatientData?.age || 'N/A',
            patient_gender: currentPatientData?.gender || 'N/A',
            patient_name: currentPatientData?.name || 'N/A',
            patient_phone: currentPatientData?.phone || 'N/A',
            ref_by: currentVisitData?.appointment_with || 'Not specified',
            consultant_name: currentVisitData?.appointment_with || 'Not specified',
            clinical_history: currentVisitData?.reason_for_visit || 'Not specified'
          };

          console.log('📋 Final result with patient info:', resultWithPatientInfo);
          
          results.push(resultWithPatientInfo);
          console.log('🎉 Result processed successfully!');
          
        } catch (error) {
          console.error('💥 Error processing result:', error);
          throw error; // Re-throw to trigger onError
        }
      }
      
      console.log('🚀 All results processed successfully:', results);
      return results;
    },
    onSuccess: (results) => {
      // NEW: Store saved results for print preview with enhanced patient data
      const savedResults: typeof savedLabResults = {};
      const patientInfo = selectedTestsForEntry[0];
      
      selectedTestsForEntry.forEach(testRow => {
        const formData = labResultsForm[testRow.id];
        if (formData) {
          savedResults[testRow.id] = {
            ...formData,
            result_status: authenticatedResult ? 'Final' : 'Preliminary',
            saved_at: new Date().toISOString(),
            patient_info: {
              ...patientInfo,
              // Store additional patient data for print
              actual_patient_uid: results[0]?.patient_uid || 'N/A',
              actual_visit_id: results[0]?.visit_id || 'N/A',
              actual_age: results[0]?.patient_age || patientInfo?.patient_age,
              actual_gender: results[0]?.patient_gender || patientInfo?.patient_gender,
              actual_patient_name: results[0]?.patient_name || patientInfo?.patient_name,
              actual_phone: results[0]?.patient_phone || patientInfo?.patient_phone,
              actual_ref_by: results[0]?.ref_by || patientInfo?.ordering_doctor,
              actual_consultant: results[0]?.consultant_name || patientInfo?.ordering_doctor,
              actual_clinical_history: results[0]?.clinical_history || patientInfo?.clinical_history
            },
            authenticated: authenticatedResult
          };
        }
      });
      
      setSavedLabResults(savedResults);
      setIsFormSaved(true);
      
      toast({
        title: "Lab Results Saved Successfully",
        description: `${results.length} test result(s) have been saved. You can now print the report.`,
      });
      
      // DON'T reset form immediately - keep it visible with saved data
      // setLabResultsForm({});
      // setAuthenticatedResult(false);
      // setUploadedFiles([]);
      // setIsEntryModeOpen(false);
      
      // Refresh the lab orders data
      queryClient.invalidateQueries({ queryKey: ['lab-test-rows'] });
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
    },
    onError: (error) => {
      console.error('Save lab results error:', error);
      toast({
        title: "Error",
        description: "Failed to save lab results. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch lab tests
  const { data: labTests = [], isLoading: testsLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('test_name');

      if (error) {
        console.error('Error fetching lab tests:', error);
        throw error;
      }

      return data?.map(test => ({
        id: test.id,
        name: test.test_name,
        test_code: test.test_code,
        category: test.category_id || 'General',
        sample_type: test.sample_type || 'Blood',
        price: test.test_price || 0,
        turnaround_time: test.processing_time_hours || 24,
        preparation_instructions: test.preparation_instructions
      })) || [];
    }
  });

  // Fetch lab test rows from visit_labs table (JOIN with visits and lab tables)
  const { data: labTestRows = [], isLoading: testRowsLoading } = useQuery({
    queryKey: ['visit-lab-orders'],
    queryFn: async () => {
      console.log('🔍 Fetching lab test data from visit_labs...');
      
      // Fetch from visit_labs table with JOINs
      const { data, error } = await supabase
        .from('visit_labs')
        .select(`
          id,
          visit_id,
          lab_id,
          status,
          ordered_date,
          collected_date,
          completed_date,
          result_value,
          normal_range,
          notes,
          created_at,
          updated_at,
          visits!inner(
            id,
            visit_id,
            patient_id,
            visit_date,
            appointment_with,
            reason_for_visit,
            patients!inner(
              id,
              patients_id,
              name,
              age,
              gender,
              phone
            )
          ),
          lab!inner(
            id,
            name,
            category,
            sample_type,
            test_method
          )
        `)
        .order('ordered_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching visit labs:', error);
        throw error;
      }

      console.log('✅ Fetched', data?.length || 0, 'lab entries from visit_labs');

             // Transform data to match LabTestRow interface
       const testRows: LabTestRow[] = data?.map((entry) => ({
         id: entry.id,
         order_id: entry.visit_id,
         test_id: entry.lab_id,
         patient_name: entry.visits?.patients?.name || 'Unknown Patient',
         patient_phone: entry.visits?.patients?.phone,
         patient_age: entry.visits?.patients?.age,
         patient_gender: entry.visits?.patients?.gender,
         order_number: entry.visit_id, // Using visit_id as order number
         test_name: entry.lab?.name || 'Unknown Test',
         test_category: entry.lab?.category || 'LAB',
         test_method: entry.lab?.test_method || 'Standard Method',
         order_date: entry.ordered_date || entry.created_at,
         order_status: entry.status || 'ordered',
         ordering_doctor: entry.visits?.appointment_with || 'Dr. Unknown',
         clinical_history: entry.visits?.reason_for_visit,
         sample_status: entry.collected_date ? 'taken' : 'not_taken' as const
       })) || [];

      return testRows;
    }
  });

  // Group tests by patient for hierarchical display
  const groupedTests = labTestRows.reduce((groups, test) => {
    const patientKey = `${test.patient_name}_${test.order_number}`;
    if (!groups[patientKey]) {
      groups[patientKey] = {
        patient: {
          name: test.patient_name,
          order_number: test.order_number,
          patient_age: test.patient_age,
          patient_gender: test.patient_gender,
          order_date: test.order_date
        },
        tests: []
      };
    }
    groups[patientKey].tests.push(test);
    return groups;
  }, {} as Record<string, { patient: any, tests: LabTestRow[] }>);

  // Since we're now using visit_labs, we can derive orders from test data
  // This is just for backward compatibility with existing code
  const labOrders = labTestRows.reduce((orders, testRow) => {
    const orderKey = testRow.order_number;
    if (!orders.find(o => o.order_number === orderKey)) {
      orders.push({
        id: testRow.order_id,
        order_number: testRow.order_number,
        patient_name: testRow.patient_name,
        patient_phone: testRow.patient_phone,
        patient_age: testRow.patient_age,
        patient_gender: testRow.patient_gender,
        order_date: testRow.order_date,
        order_status: testRow.order_status,
        priority: 'Normal', // Default priority
        ordering_doctor: testRow.ordering_doctor,
        total_amount: 0, // Will calculate separately
        payment_status: 'Pending',
        collection_date: testRow.collected_date,
        collection_time: null,
        clinical_history: testRow.clinical_history,
        provisional_diagnosis: '',
        special_instructions: '',
        patient_id: testRow.order_id
      });
    }
    return orders;
  }, [] as LabOrder[]);
  
  const ordersLoading = testRowsLoading;

  // Check which orders already have samples collected
  const orderHasSample = (orderId: string) => {
    const order = labOrders.find(o => o.id === orderId);
    return order?.order_status === 'Sample_Collected' || 
           order?.order_status === 'In_Progress' || 
           order?.order_status === 'Results_Ready' ||
           order?.order_status === 'Completed';
  };

  // Create order mutation - now creates entries in visit_labs table
  const createOrderMutation = useMutation({
    mutationFn: async (visitLabEntries: any[]) => {
      console.log('🔄 Creating visit_labs entries:', visitLabEntries);
      
      const { data, error } = await supabase
        .from('visit_labs')
        .insert(visitLabEntries)
        .select();

      if (error) {
        console.error('❌ Error creating visit_labs entries:', error);
        throw error;
      }

      console.log('✅ Created', data?.length || 0, 'visit_labs entries');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-lab-orders'] });
      toast({
        title: "Success",
        description: `Lab order created successfully with ${data?.length || 0} tests`,
      });
      setIsCreateOrderOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create order error:', error);
      toast({
        title: "Error",
        description: "Failed to create lab order",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedTests([]);
    setOrderForm({
      priority: 'Normal',
      orderingDoctor: '',
      clinicalHistory: '',
      provisionalDiagnosis: '',
      specialInstructions: '',
      collectionDate: new Date(),
      collectionTime: '09:00'
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive"
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive"
      });
      return;
    }

    const selectedTestsData = labTests.filter(test => selectedTests.includes(test.id));

    // Create individual visit_labs entries for each selected test
    const visitLabEntries = selectedTestsData.map(test => ({
      visit_id: selectedPatient.visitId,
      lab_id: test.id,
      status: 'ordered',
      ordered_date: new Date().toISOString(),
      notes: `Ordered by ${orderForm.orderingDoctor}. Clinical History: ${orderForm.clinicalHistory}`
    }));

    await createOrderMutation.mutateAsync(visitLabEntries);
  };

  const handlePatientSelect = (patient: PatientWithVisit) => {
    setSelectedPatient(patient);
    // Auto-fill form data from patient
    setOrderForm(prev => ({
      ...prev,
      orderingDoctor: patient.appointmentWith || '',
      clinicalHistory: patient.reasonForVisit || '',
      provisionalDiagnosis: safeArrayAccess(patient, 'primary_diagnosis') || ''
    }));
    
    // Store patient data for later use in print
    console.log('Selected patient data:', {
      name: patient.name,
      patients_id: patient.patients_id,
      visitId: patient.visitId,
      age: patient.age,
      gender: patient.gender
    });
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredTests = labTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.test_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter test rows for hierarchical display
  const filteredTestRows = labTestRows.filter(testRow => {
    const matchesSearch = testRow.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testRow.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testRow.test_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || testRow.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group filtered tests by patient
  const filteredGroupedTests = filteredTestRows.reduce((groups, test) => {
    const patientKey = `${test.patient_name}_${test.order_number}`;
    if (!groups[patientKey]) {
      groups[patientKey] = {
        patient: {
          name: test.patient_name,
          order_number: test.order_number,
          patient_age: test.patient_age,
          patient_gender: test.patient_gender,
          order_date: test.order_date
        },
        tests: []
      };
    }
    groups[patientKey].tests.push(test);
    return groups;
  }, {} as Record<string, { patient: any, tests: LabTestRow[] }>);

  // Pagination logic
  const patientGroups = Object.entries(filteredGroupedTests);
  const totalPatients = patientGroups.length;
  const totalPages = Math.ceil(totalPatients / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPatientGroups = patientGroups.slice(startIndex, endIndex);

  // Calculate total tests for display
  const totalTests = filteredTestRows.length;

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleTestSelect = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAllTests = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(test => test.id));
    }
  };

  const getTotalAmount = () => {
    return labTests
      .filter(test => selectedTests.includes(test.id))
      .reduce((sum, test) => sum + test.price, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  // Lab Results Form Handlers
  const handleLabResultChange = (testId: string, field: string, value: string | boolean) => {
    setLabResultsForm(prev => ({
      ...prev,
      [testId]: {
        result_value: '',
        result_unit: '',
        reference_range: '',
        comments: '',
        is_abnormal: false,
        result_status: 'Preliminary' as 'Preliminary' | 'Final',
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const handleSaveLabResults = async () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to save results for.",
        variant: "destructive"
      });
      return;
    }

    // Prepare results data for saving
    const resultsData = selectedTestsForEntry.map(testRow => {
      const formData = labResultsForm[testRow.id] || {
        result_value: '',
        result_unit: '',
        reference_range: '',
        comments: '',
        is_abnormal: false,
        result_status: 'Preliminary' as 'Preliminary' | 'Final'
      };
      
      // Use calculated reference range if available, otherwise use form data
      const referenceRange = calculatedRanges[testRow.id] || formData.reference_range || '';
      
      return {
        order_id: testRow.order_id,
        test_id: testRow.test_id,
        test_name: testRow.test_name, // Add test name for lab creation
        test_category: testRow.test_category, // Add test category
        result_value: formData.result_value || '',
        result_unit: formData.result_unit || '',
        reference_range: referenceRange,
        comments: formData.comments || '',
        is_abnormal: formData.is_abnormal || false,
        result_status: authenticatedResult ? 'Final' : 'Preliminary'
      };
    });

    // Filter out empty results (optional - you might want to save empty results too)
    const validResults = resultsData.filter(result => result.result_value.trim() !== '');

    if (validResults.length === 0) {
      toast({
        title: "No Results to Save",
        description: "Please enter at least one test result.",
        variant: "destructive"
      });
      return;
    }

    await saveLabResultsMutation.mutateAsync(validResults);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  // Preview & Print Handler
  const handlePreviewAndPrint = () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to preview and print.",
        variant: "destructive"
      });
      return;
    }

    if (!isFormSaved) {
      toast({
        title: "Please Save First",
        description: "You must save the lab results before printing.",
        variant: "destructive"
      });
      return;
    }

    if (Object.keys(savedLabResults).length === 0) {
      toast({
        title: "No Saved Data",
        description: "No saved lab results found to print.",
        variant: "destructive"
      });
      return;
    }

    // Create print content
    const printContent = generatePrintContent();
    
    // Open print preview and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then automatically print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
      
      toast({
        title: "Print Started",
        description: "Report is being prepared for printing.",
      });
    } else {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive"
      });
    }
  };

  // Generate Print Content
  const generatePrintContent = () => {
    if (selectedTestsForEntry.length === 0) return '';
    
    const patientInfo = selectedTestsForEntry[0];
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laboratory Report</title>
        <style>
          @page {
            margin: 20mm;
            size: A4;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .report-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .hospital-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .hospital-details {
            font-size: 10px;
            margin-bottom: 10px;
          }
          
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 11px;
            border: 2px solid #000;
            padding: 15px;
            border-radius: 5px;
          }
          
          .patient-info div {
            margin-bottom: 3px;
          }
          
          .patient-info strong {
            display: inline-block;
            width: 120px;
            font-weight: bold;
          }
          
          .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
          }
          
          .test-section {
            margin-bottom: 30px;
          }
          
          .test-header {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .results-table th,
          .results-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          
          .results-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .abnormal {
            color: #d32f2f;
            font-weight: bold;
          }
          
          .method-section {
            margin: 20px 0;
            font-size: 11px;
          }
          
          .interpretation-section {
            margin: 20px 0;
            font-size: 11px;
          }
          
          .interpretation-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
          }
          
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 5px;
            width: 200px;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.05);
            z-index: -1;
            pointer-events: none;
          }
          
          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">ESIC HOSPITAL</div>
        
        
        
                <div class="patient-info">
          <div>
            <div><strong>Patient Name :</strong> ${patientInfo?.patient_name || 'N/A'}</div>
            <div><strong>Patient ID :</strong> ${(() => {
              // Try to get actual patient UID from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_patient_uid || patientInfo?.order_number?.split('-')[0] || 'Not Available';
            })()}</div>
            <div><strong>Ref By :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_ref_by || patientInfo?.ordering_doctor || 'Not specified';
            })()}</div>
            <div><strong>Sample Received :</strong> ${reportDate} ${reportTime}</div>
            <div><strong>Request No. :</strong> ${patientInfo?.order_number?.split('-').pop() || 'N/A'}</div>
          </div>
          <div>
            <div><strong>Age/Sex :</strong> ${(() => {
              // Try to get actual age/gender from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              const age = savedResult?.patient_info?.actual_age || patientInfo?.patient_age || 'N/A';
              const gender = savedResult?.patient_info?.actual_gender || patientInfo?.patient_gender || 'N/A';
              return `${age}Y ${gender}`;
            })()}</div>
            <div><strong>MRN NO :</strong> ${(() => {
              // Try to get actual visit ID from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_visit_id || patientInfo?.order_number || 'Not Available';
            })()}</div>
            <div><strong>Report Date :</strong> ${reportDate} ${reportTime}</div>
            <div><strong>Consultant Name :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_consultant || patientInfo?.ordering_doctor || 'Not specified';
            })()}</div>
            <div><strong>Provisional Diagnosis :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_clinical_history || patientInfo?.clinical_history || 'Not Specified';
            })()}</div>
          </div>
        </div>
        
        <div class="report-title">Report on ${selectedTestsForEntry.map(test => test.test_name).join(', ').toUpperCase()}</div>
        
        <table class="results-table">
          <thead>
            <tr>
              <th style="width: 40%;">INVESTIGATION</th>
              <th style="width: 25%;">OBSERVED VALUE</th>
              <th style="width: 35%;">NORMAL RANGE</th>
            </tr>
          </thead>
          <tbody>
            ${selectedTestsForEntry.map(testRow => {
              const formData = savedLabResults[testRow.id] || labResultsForm[testRow.id] || {
                result_value: '',
                result_unit: '',
                reference_range: '',
                comments: '',
                is_abnormal: false,
                result_status: 'Preliminary'
              };
              
              const displayValue = formData.result_value ? 
                `${formData.result_value} ${formData.result_unit || ''}`.trim() : 
                'Not Available';
              
              // Use calculated reference range or fallback to stored range
              const referenceRange = calculatedRanges[testRow.id] || formData.reference_range || 'Not Specified';
              
              return `
                <tr>
                  <td>
                    <strong>${testRow.test_name}</strong>
                    ${formData.comments ? `<br><small><em>${formData.comments}</em></small>` : ''}
                  </td>
                  <td class="${formData.is_abnormal ? 'abnormal' : ''}" style="text-align: center;">
                    ${displayValue}
                  </td>
                  <td style="text-align: center;">
                    ${referenceRange}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="method-section">
          <strong>Method :</strong> Competitive Chemi Luminescent Immuno Assay
        </div>
        
        <div class="interpretation-section">
          <div class="interpretation-title">INTERPRETATION :</div>
          <div>
            ${selectedTestsForEntry.map(testRow => {
              const formData = savedLabResults[testRow.id] || labResultsForm[testRow.id];
              if (formData?.comments) {
                return `<p><strong>${testRow.test_name}:</strong> ${formData.comments}</p>`;
              }
              return '';
            }).join('')}
            
            <p>
              1) Results should be correlated with clinical findings and other diagnostic investigations.
            </p>
            <p>
              2) Any significant changes in values require clinical correlation or repeat testing with fresh sample.
            </p>
            <p>
              3) Critical values have been immediately communicated to the requesting physician.
            </p>
            <p>
              4) Reference ranges may vary based on methodology, age, and clinical conditions.
            </p>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div>Lab Technician</div>
            <div style="font-size: 10px; margin-top: 20px;">
              Date: ${reportDate}<br>
              Time: ${reportTime}
            </div>
          </div>
          <div class="signature-box">
            <div>Consultant Pathologist</div>
            <div style="font-size: 10px; margin-top: 20px;">
              Dr. ${patientInfo?.ordering_doctor || 'N/A'}<br>
              MD (Pathology)
            </div>
          </div>
        </div>
        
      </body>
      </html>
    `;
  };

  // Download Files Handler
  const handleDownloadFiles = () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to download report.",
        variant: "destructive"
      });
      return;
    }

    if (!isFormSaved) {
      toast({
        title: "Please Save First",
        description: "You must save the lab results before downloading.",
        variant: "destructive"
      });
      return;
    }

    // Generate report content
    const reportContent = generatePrintContent();
    
    // Create blob and download HTML
    const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const patientInfo = selectedTestsForEntry[0];
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `Lab_Report_${patientInfo?.patient_name?.replace(/\s+/g, '_') || 'Patient'}_${dateStr}_${timeStr}.html`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Also create a print version for PDF
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        
        toast({
          title: "Files Ready for Download",
          description: `HTML report downloaded. Print window opened for PDF save.`,
        });
      }
    }, 500);

    // Also download uploaded files if any
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file, index) => {
        setTimeout(() => {
          const fileUrl = URL.createObjectURL(file);
          const fileLink = document.createElement('a');
          fileLink.href = fileUrl;
          fileLink.download = file.name;
          document.body.appendChild(fileLink);
          fileLink.click();
          document.body.removeChild(fileLink);
          URL.revokeObjectURL(fileUrl);
        }, (index + 1) * 200); // Stagger downloads
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Orders Management</h1>
          <p className="text-gray-600">Manage laboratory test orders and results</p>
        </div>
        <Button onClick={() => setIsCreateOrderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Lab Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Tests Table (Grouped by Patient) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Lab Tests ({totalTests} tests, {totalPatients} patients)
              {(testRowsLoading || ordersLoading) && (
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Show:</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">patients per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Test ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sample Taken</TableHead>
                <TableHead>Incl.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(testRowsLoading || ordersLoading) ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading patient lab data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedPatientGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No lab orders found. Create a new lab order to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatientGroups.map(([patientKey, patientGroup], patientIndex) => (
                <React.Fragment key={patientKey}>
                  {/* Patient Header Row */}
                  <TableRow className="bg-blue-50 hover:bg-blue-100">
                    <TableCell className="font-bold">{startIndex + patientIndex + 1}</TableCell>
                    <TableCell colSpan={8} className="font-bold text-blue-900">
                      {patientGroup.patient.name} ({patientGroup.patient.order_number})
                    </TableCell>
                  </TableRow>
                  
                  {/* Individual Test Rows for this Patient */}
                  {patientGroup.tests.map((testRow, testIndex) => (
                    <TableRow key={testRow.id} className="hover:bg-gray-50">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-medium">{testRow.order_number}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{testRow.test_category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{testRow.test_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(testRow.order_date)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(testRow.order_status)}>
                          {testRow.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={sampleTakenTests.includes(testRow.id) || testSampleStatus[testRow.id] === 'saved'}
                            disabled={testSampleStatus[testRow.id] === 'saved'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSampleTakenTests(prev => [...prev, testRow.id]);
                                setTestSampleStatus(prev => ({ ...prev, [testRow.id]: 'taken' }));
                              } else {
                                setSampleTakenTests(prev => prev.filter(id => id !== testRow.id));
                                setTestSampleStatus(prev => ({ ...prev, [testRow.id]: 'not_taken' }));
                                setIncludedTests(prev => prev.filter(id => id !== testRow.id));
                              }
                            }}
                          />
                          {testSampleStatus[testRow.id] === 'saved' && (
                            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={includedTests.includes(testRow.id)}
                          disabled={testSampleStatus[testRow.id] !== 'saved'}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setIncludedTests(prev => [...prev, testRow.id]);
                            } else {
                              setIncludedTests(prev => prev.filter(id => id !== testRow.id));
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, totalPatients)} of {totalPatients} patients
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="px-2"
              >
                ««
              </Button>
              
              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-2"
              >
                ‹
              </Button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="px-3"
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                ›
              </Button>
              
              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                »»
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sample Management Actions */}
      {(sampleTakenTests.length > 0 || includedTests.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sampleTakenTests.length > 0 && (
                  <span className="text-sm font-medium">
                    Samples to Save: {sampleTakenTests.length} test(s)
                  </span>
                )}
                {includedTests.length > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Ready for Entry: {includedTests.length} test(s) included
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {sampleTakenTests.length > 0 && (
                  <Button 
                    variant="outline"
                    disabled={saveSamplesMutation.isPending}
                    onClick={() => {
                      saveSamplesMutation.mutate(sampleTakenTests);
                    }}
                  >
                    {saveSamplesMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                )}
                <Button 
                  disabled={includedTests.length === 0}
                  onClick={() => {
                    if (includedTests.length > 0) {
                      const selectedTests = labTestRows.filter(testRow => includedTests.includes(testRow.id));
                      setSelectedTestsForEntry(selectedTests);
                      setIsEntryModeOpen(true);
                    }
                  }}
                >
                  Entry Mode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lab Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <PatientSearchWithVisit
                value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.visitId})` : ''}
                onChange={(value, patient) => {
                  if (patient) {
                    handlePatientSelect(patient);
                  }
                }}
                placeholder="Search and select patient with visit"
              />
            </div>

            {selectedPatient && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Patient:</strong> {selectedPatient.name}</div>
                    <div><strong>Visit ID:</strong> {selectedPatient.visitId}</div>
                    <div><strong>Age/Gender:</strong> {selectedPatient.age}y, {selectedPatient.gender}</div>
                    <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                    <div><strong>Consultant:</strong> {selectedPatient.appointmentWith}</div>
                    <div><strong>Visit Date:</strong> {formatDate(selectedPatient.visitDate)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={orderForm.priority} onValueChange={(value) => 
                  setOrderForm(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordering Doctor</Label>
                <Input
                  value={orderForm.orderingDoctor}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, orderingDoctor: e.target.value }))}
                  placeholder="Enter doctor name"
                />
              </div>
            </div>

            {/* Clinical Information */}
            <div className="space-y-4">
              <div>
                <Label>Clinical History</Label>
                <Textarea
                  value={orderForm.clinicalHistory}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, clinicalHistory: e.target.value }))}
                  placeholder="Enter clinical history"
                  rows={3}
                />
              </div>

              <div>
                <Label>Provisional Diagnosis</Label>
                <Textarea
                  value={orderForm.provisionalDiagnosis}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                  placeholder="Enter provisional diagnosis"
                  rows={2}
                />
              </div>

              <div>
                <Label>Special Instructions</Label>
                <Textarea
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Enter special instructions"
                  rows={2}
                />
              </div>
            </div>

            {/* Collection Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collection Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !orderForm.collectionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderForm.collectionDate ? format(orderForm.collectionDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={orderForm.collectionDate}
                      onSelect={(date) => date && setOrderForm(prev => ({ ...prev, collectionDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Collection Time</Label>
                <Input
                  type="time"
                  value={orderForm.collectionTime}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, collectionTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Test Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Tests</Label>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedTests.length === filteredTests.length}
                    onCheckedChange={handleSelectAllTests}
                  />
                  <span className="text-sm">Select All ({filteredTests.length})</span>
                </div>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Sample Type</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={() => handleTestSelect(test.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{test.name}</TableCell>
                        <TableCell>{test.test_code}</TableCell>
                        <TableCell>{test.sample_type}</TableCell>
                        <TableCell>₹{test.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedTests.length > 0 && (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Selected Tests: {selectedTests.length}</span>
                  <span className="font-bold text-lg">Total Amount: ₹{getTotalAmount()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOrderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Order Number:</strong> {selectedOrder.order_number}</div>
                <div><strong>Patient:</strong> {selectedOrder.patient_name}</div>
                <div><strong>Order Date:</strong> {formatDate(selectedOrder.order_date)}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${getStatusColor(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status}
                  </Badge>
                </div>
                <div><strong>Priority:</strong>
                  <Badge className={`ml-2 ${getPriorityColor(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div><strong>Doctor:</strong> {selectedOrder.ordering_doctor}</div>
                <div><strong>Total Amount:</strong> ₹{selectedOrder.total_amount}</div>
                <div><strong>Payment Status:</strong>
                  <Badge className={`ml-2 ${selectedOrder.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>

              {selectedOrder.clinical_history && (
                <div>
                  <strong>Clinical History:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.clinical_history}</p>
                </div>
              )}

              {selectedOrder.provisional_diagnosis && (
                <div>
                  <strong>Provisional Diagnosis:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.provisional_diagnosis}</p>
                </div>
              )}

              {selectedOrder.special_instructions && (
                <div>
                  <strong>Special Instructions:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entry Mode Dialog */}
      <Dialog open={isEntryModeOpen} onOpenChange={setIsEntryModeOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Lab Results Entry Form</DialogTitle>
          </DialogHeader>
          
          {selectedTestsForEntry.length > 0 && (
            <div className="space-y-4">
              {/* Header Info Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div><strong>Patient Name:</strong> {selectedTestsForEntry[0]?.patient_name}</div>
                  <div><strong>Age/Sex:</strong> {selectedTestsForEntry[0]?.patient_age}Y {selectedTestsForEntry[0]?.patient_gender}</div>
                  <div><strong>Type:</strong> OPD / BSNL</div>
                  <div><strong>Ref By:</strong> {selectedTestsForEntry[0]?.ordering_doctor}</div>
                  <div><strong>Lab Sample ID:</strong> {selectedTestsForEntry[0]?.order_number}</div>
                  <div><strong>Date:</strong> {formatDate(selectedTestsForEntry[0]?.order_date || '')}</div>
                </div>
              </div>

              {/* Date/Time and Lab Results Header */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                  <Badge variant="secondary">Lab Results</Badge>
                  {isFormSaved && (
                    <Badge className="bg-green-600 hover:bg-green-700">✓ Saved</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="authenticated" 
                    className="w-4 h-4"
                    checked={authenticatedResult}
                    onChange={(e) => setAuthenticatedResult(e.target.checked)}
                    disabled={isFormSaved}
                  />
                  <label htmlFor="authenticated" className="text-sm">Authenticated Result</label>
                </div>
              </div>

                             {/* Dynamic Test Sections for Selected Tests */}
               {selectedTestsForEntry.map((testRow) => {
                 const formData = labResultsForm[testRow.id] || {
                   result_value: '',
                   result_unit: '',
                   reference_range: '',
                   comments: '',
                   is_abnormal: false,
                   result_status: 'Preliminary' as 'Preliminary' | 'Final'
                 };
                 
                 return (
                   <div key={testRow.id} className="border rounded-lg">
                     <div className="bg-gray-100 p-3 border-b">
                       <h3 className="font-semibold">{testRow.test_name}</h3>
                     </div>
                     <div className="p-4 space-y-3">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="text-sm font-medium text-gray-700">Result Value</label>
                           <input 
                             type="text" 
                             className={`mt-1 px-3 py-2 border rounded w-full ${isFormSaved ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                             placeholder="Enter result"
                             value={formData.result_value}
                             onChange={(e) => handleLabResultChange(testRow.id, 'result_value', e.target.value)}
                             disabled={isFormSaved}
                           />
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-700">Reference Range</label>
                           <div 
                             className={`mt-1 px-3 py-2 border rounded w-full bg-blue-50 text-blue-800 font-medium ${isFormSaved ? 'bg-gray-100' : ''}`}
                           >
                             {calculatedRanges[testRow.id] || 'Loading...'}
                           </div>
                         </div>
                       </div>
                       <div>
                         <label className="text-sm font-medium text-gray-700">Comments</label>
                         <textarea 
                           className={`mt-1 px-3 py-2 border rounded w-full ${isFormSaved ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                           rows={2}
                           placeholder="Enter any comments or notes"
                           value={formData.comments}
                           onChange={(e) => handleLabResultChange(testRow.id, 'comments', e.target.value)}
                           disabled={isFormSaved}
                         />
                       </div>
                       <div className="flex items-center gap-2">
                         <input 
                           type="checkbox" 
                           id={`abnormal-${testRow.id}`}
                           className="w-4 h-4"
                           checked={formData.is_abnormal}
                           onChange={(e) => handleLabResultChange(testRow.id, 'is_abnormal', e.target.checked)}
                           disabled={isFormSaved}
                         />
                         <label htmlFor={`abnormal-${testRow.id}`} className={`text-sm ${isFormSaved ? 'text-gray-500' : ''}`}>Mark as Abnormal</label>
                       </div>
                     </div>
                   </div>
                 );
               })}

              {/* File Upload Section */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-gray-200 rounded border text-sm cursor-pointer hover:bg-gray-300"
                  >
                    Choose File
                  </label>
                  <span className="text-sm text-gray-600">
                    {uploadedFiles.length > 0 
                      ? `${uploadedFiles.length} file(s) selected: ${uploadedFiles.map(f => f.name).join(', ')}`
                      : 'No file chosen'
                    }
                  </span>
                </div>
              </div>

                             {/* Add More Section */}
               <div className="p-4">
                 <button className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800">
                   Add more
                 </button>
               </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4 border-t">
                <Button 
                  className={`${isFormSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  onClick={handleSaveLabResults}
                  disabled={saveLabResultsMutation.isPending || isFormSaved}
                >
                  {saveLabResultsMutation.isPending ? '🔄 Saving...' : (isFormSaved ? '✅ Saved' : '💾 Save Results')}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    const printContent = generatePrintContent();
                    const printWindow = window.open('', '_blank', 'width=800,height=600');
                    if (printWindow) {
                      printWindow.document.write(printContent);
                      printWindow.document.close();
                      toast({
                        title: "Preview Opened",
                        description: "Report preview opened in new window.",
                      });
                    } else {
                      toast({
                        title: "Popup Blocked",
                        description: "Please allow popups for this site to preview reports.",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={selectedTestsForEntry.length === 0}
                  title="Preview how the report will look when printed"
                >
                  👁️ Preview Report
                </Button>
                
                <Button variant="outline" onClick={() => {
                  // Reset states when closing
                  setIsEntryModeOpen(false);
                  setIsFormSaved(false);
                  setSavedLabResults({});
                  setLabResultsForm({});
                  setAuthenticatedResult(false);
                  setUploadedFiles([]);
                }}>
                  ⬅️ Back
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`${isFormSaved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  onClick={handlePreviewAndPrint}
                  disabled={!isFormSaved}
                  title={!isFormSaved ? "Please save the results first" : "Print saved results"}
                >
                  {isFormSaved ? '🖨️ Print Report' : '🖨️ Print Report'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`${isFormSaved ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  onClick={handleDownloadFiles}
                  disabled={!isFormSaved}
                  title={!isFormSaved ? "Please save the results first" : "Download files"}
                >
                  {isFormSaved ? '📁 Download Files' : '📁 Download Files'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabOrders;
