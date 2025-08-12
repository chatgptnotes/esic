// @ts-nocheck
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker"
import { ChevronUp, ChevronDown, Trash2, Plus, ChevronLeft, ChevronRight, Edit, X, Copy, PenTool } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFinalBillData } from "@/hooks/useFinalBillData"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ESICLetterGenerator } from "@/components/ESICLetterGenerator"
import { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// This component needs to be created or installed. It is not a standard shadcn/ui component.
// You can find implementations online or build one yourself.
// For now, I'll mock it to avoid breaking the app.
// import { DateRangePicker } from "@/components/ui/date-range-picker" 

// Define interfaces for our data structures
interface PatientData {
  billNo: string;
  claimId: string;
  registrationNo: string;
  name: string;
  age: string;
  sex: string;
  contactNo: string;
  address: string;
  beneficiaryName: string;
  relation: string;
  rank: string; // IP No. (kept for backward compatibility)
  ipNo?: string; // explicit IP No. field
  serviceNo: string;
  category: string;
  diagnosis: string;
  dateOfAdmission: string;
  dateOfDischarge: string;
  billDate: string;
}

interface VitalSigns {
  bp?: string;
  pulse?: string;
  temperature?: string;
  spo2?: string;
  respiratoryRate?: string;
}

interface StandardSubItem {
  id: string;
  srNo: string;
  description: string;
  code?: string;
  rate: number;
  qty: number;
  amount: number;
  dates?: DateRange;
  type?: 'standard';
  additionalDateRanges?: DateRange[];
}

type SubItem = StandardSubItem;

interface SectionItem {
  id: string;
  type: 'section';
  title: string;
  dates: DateRange | undefined;
  isOpen: boolean;
  subItems?: never; // Sections don't have sub-items in this structure
  additionalDateRanges?: DateRange[];
}

interface MainItem {
  id: string;
  type: 'main';
  srNo: string;
  description: string;
  subItems: SubItem[];
  amount?: number;
  dates?: DateRange;
}

type InvoiceItem = SectionItem | MainItem;

const initialPatientData: PatientData = {
  billNo: "",
  claimId: "",
  registrationNo: "",
  name: "",
  age: "",
  sex: "",
  contactNo: "",
  address: "",
  beneficiaryName: "",
  relation: "SELF",
  rank: "",
  ipNo: "",
  serviceNo: "",
  category: "GENERAL",
  diagnosis: "",
  dateOfAdmission: "",
  dateOfDischarge: "",
  billDate: new Date().toISOString().split('T')[0],
}

const initialInvoiceItems: InvoiceItem[] = [
  {
    id: 'header_1',
    type: 'section',
    title: 'Conservative Treatment',
    dates: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
    isOpen: true,
    additionalDateRanges: [
      { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }
    ],
  },
  {
    id: 'header_2',
    type: 'section',
    title: 'Surgical Package ( Days)',
    dates: { from: new Date('2024-03-10'), to: new Date('2024-03-15') },
    isOpen: true,
  },
  {
    id: 'main_1',
    type: 'main',
    srNo: '1',
    description: 'Consultation for Inpatients',
    amount: 2800,
    dates: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
    subItems: [
      {
        id: 'sub_consultation_1',
        srNo: 'a)',
        description: 'Select Doctor',
        dates: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
        code: '',
        rate: 350,
        qty: 8,
        amount: 2800,
        type: 'standard',
        additionalDateRanges: [
          { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }
        ],
      },
    ],
  },
  {
    id: 'main_2',
    type: 'main',
    srNo: '2',
    description: 'Accommodation Charges',
    amount: 9000,
    dates: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
    subItems: [
      {
        id: 'sub_accommodation_1',
        srNo: 'a)',
        description: 'Accommodation of General Ward',
        dates: { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) },
        code: '',
        rate: 1500,
        qty: 6,
        amount: 9000,
        type: 'standard',
        additionalDateRanges: [
          { from: new Date(), to: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }
        ],
      },
    ],
  },
  {
    id: 'main_3',
    type: 'main',
    srNo: '3',
    description: 'Pathology Charges',
    amount: 250,
    subItems: [
      {
        id: 'sub_pathology_1',
        srNo: 'a)',
        description: '',
        dates: { from: new Date('2024-03-04'), to: new Date('2024-03-04') },
        rate: 250,
        qty: 1,
        amount: 250,
        type: 'standard',
      },
    ],
  },
  {
    id: 'main_4',
    type: 'main',
    srNo: '4',
    description: 'Medicine Charges',
    amount: 100,
    subItems: [
      {
        id: 'sub_medicine_1',
        srNo: 'a)',
        description: '',
        dates: { from: new Date('2024-03-05'), to: new Date('2024-03-05') },
        rate: 10,
        qty: 10,
        amount: 100,
        type: 'standard',
      },
    ],
  },
  {
    id: 'main_6',
    type: 'main',
    srNo: '6',
    description: 'Other Charges',
    amount: 58,
    subItems: [
      {
        id: 'sub_other_1',
        srNo: 'a)',
        description: 'ECG',
        code: '590',
        rate: 58,
        qty: 1,
        amount: 58,
        type: 'standard',
      },
    ],
  },
  {
    id: 'main_8',
    type: 'main',
    srNo: '8',
    description: 'Miscellaneous Charges',
    amount: 500,
    subItems: [
      {
        id: 'sub_misc_1',
        srNo: 'a)',
        description: 'Registration',
        rate: 500,
        qty: 1,
        amount: 500,
        type: 'standard',
      },
    ],
  },



];

const cghsAdjustmentOptions = [
  { value: 'none', label: 'No Adjustment', percentage: 0 },
  { value: 'ward10', label: '10%  Less as per Gen. Ward Charges', percentage: -10 },
  { value: 'guideline50', label: '50% Less  as per CGHS Guideline', percentage: -50 },
  { value: 'guideline25', label: ' 25% Less  as per CGHS Guideline', percentage: -25 },
  { value: 'guideline25', label: '25% Less as per CGHS Guidelines', percentage: -75 },
];

const wardAdjustments = {
  'none': 1, 'ward10': 1.1, 'semi20': 1.2, 'private30': 1.3
};
const guidelineAdjustments = {
  'none': 1, 'guideline50': 0.5, 'guideline25': 0.75, 'guideline75': 0.25
};

// Accommodation options for dropdown
const accommodationOptions = [
  'Accommodation of General Ward',
  'Accommodation of Semi Private Ward',
  'Accommodation of Private Ward',
  'Accommodation in ICU'
];

// Function to clean and validate data - prevents test data and invalid values from appearing
function cleanData(value: string | null | undefined): string {
  if (!value || value === "usa" || value === "null" || value === "undefined" || value.trim() === "") {
    return "";
  }
  return value.trim();
}

// Function to check for duplicate values - prevents redundant information display
function isDuplicate(value1: string, value2: string): boolean {
  return value1 && value2 && value1.toLowerCase().trim() === value2.toLowerCase().trim();
}

// Function to validate and format claim ID
function validateClaimId(claimId: string): string {
  const cleaned = cleanData(claimId);
  if (!cleaned) return "";

  // Remove any duplicate patterns like "09876 09876" -> "09876"
  const parts = cleaned.split(/\s+/);
  const uniqueParts = [...new Set(parts)];
  return uniqueParts.join(" ");
}

// Convert number to words
function convertToWords(num) {
  if (num === 0) return "ZERO";
  const belowTwenty = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const thousands = ["", "THOUSAND", "LAKH", "CRORE"];

  function helper(n) {
    if (n < 20) return belowTwenty[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + belowTwenty[n % 10] : "");
    if (n < 1000) return belowTwenty[Math.floor(n / 100)] + " HUNDRED" + (n % 100 > 0 ? " AND " + helper(n % 100) : "");
    return "";
  }

  let word = "";
  let i = 0;
  while (num > 0) {
    let n = num % 1000;
    if (i === 1) n = num % 100;
    if (i > 1) n = num % 100;

    if (n > 0) {
      word = helper(n) + " " + thousands[i] + " " + word;
    }

    if (i === 0) num = Math.floor(num / 1000);
    else num = Math.floor(num / 100);
    i++;
  }
  return word.trim() + " ONLY";
}






const FinalBill = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { billData, isLoading: isBillLoading, saveBill, isSaving } = useFinalBillData(visitId || '');
  const queryClient = useQueryClient();
  const [surgeons, setSurgeons] = useState<{ id: string; name: string }[]>([]);
  const [pathologyNote, setPathologyNote] = useState("");
  const [cghsSurgeries, setCghsSurgeries] = useState<{ id: string; name: string; NABH_NABL_Rate: string; code: string }[]>([]);
  const [vitalSigns] = useState<VitalSigns>({
    bp: '120/80',
    pulse: '80',
    temperature: '98.6',
    spo2: '98',
    respiratoryRate: '18'
  });

  useEffect(() => {
    const fetchSurgeons = async () => {
      const { data, error } = await supabase
        .from('esic_surgeons')
        .select('id, name');

      if (error) {
        console.error("Error fetching surgeons:", error);
        toast.error("Failed to fetch surgeons.");
      } else if (data) {
        setSurgeons(data);
      }
    };

    fetchSurgeons();
  }, []);

  // This useEffect will be moved after visitData declaration

  // Fetch saved labs when visit ID is available
  useEffect(() => {
    if (visitId) {
      fetchSavedLabs(visitId);
    }
  }, [visitId]);

  // Fetch saved radiology when visit ID is available
  useEffect(() => {
    if (visitId) {
      fetchSavedRadiology(visitId);
    }
  }, [visitId]);

  // Fetch saved medications when visit ID is available
  useEffect(() => {
    if (visitId) {
      fetchSavedMedications(visitId);
    }
  }, [visitId]);

  // Fetch patient info when visit ID is available
  useEffect(() => {
    if (visitId) {
      fetchPatientInfo();
    }
  }, [visitId]);

  // Helper type guard
  function isCghsSurgeryArray(data: any): data is { id: string; name: string; amount: number }[] {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          'id' in item &&
          'name' in item &&
          'amount' in item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.amount === 'number'
      )
    );
  }

  useEffect(() => {
    const fetchSurgeries = async () => {
      const { data, error } = await supabase
        .from('cghs_surgery')
        .select('id, name, NABH_NABL_Rate, code');
      if (data && Array.isArray(data)) {
        console.log('CGHS Surgeries loaded:', data.length, 'surgeries');
        console.log('Sample surgery:', data[0]);
        setCghsSurgeries(data as any);
      }
    };
    fetchSurgeries();
  }, []);

  // Fetch available lab services from database
  useEffect(() => {
    const fetchLabServices = async () => {
      try {
        setIsLoadingLabServices(true);
        const { data, error } = await supabase
          .from('lab')
          .select(`id, name, "NABH_rates_in_rupee", "CGHS_code"`)
          .order('name');

        if (error) {
          console.error('Error fetching lab services:', error);
          toast.error('Failed to load lab services');
        } else if (data) {
          console.log('Lab services fetched successfully:', data.length, 'records');
          console.log('Sample lab services:', data.slice(0, 3));

          // Map the field names to expected format
          const mappedData = data.map(item => ({
            id: item.id,
            name: item.name,
            amount: item['NABH_rates_in_rupee'] || 0,
            code: item['CGHS_code'] || ''
          }));

          console.log('Mapped lab services sample:', mappedData.slice(0, 3));
          setAvailableLabServices(mappedData);
        }
      } catch (error) {
        console.error('Error in fetchLabServices:', error);
        toast.error('Failed to load lab services');
      } finally {
        setIsLoadingLabServices(false);
      }
    };

    fetchLabServices();
  }, []);

  // Fetch available radiology services from database
  useEffect(() => {
    const fetchRadiologyServices = async () => {
      try {
        console.log('🔄 Starting to fetch radiology services...');
        setIsLoadingRadiologyServices(true);
        const { data, error } = await supabase
          .from('radiology')
          .select('id, name, cost, category, description')
          .order('name');

        if (error) {
          console.error('❌ Error fetching radiology services:', error);
          toast.error('Failed to load radiology services');
        } else if (data) {
          console.log('✅ Radiology services fetched successfully:', data.length, 'records');
          console.log('📋 Sample radiology services:', data.slice(0, 3));
          // Transform data to ensure cost field is available as amount for compatibility
          const transformedData = data.map(item => ({
            ...item,
            amount: item.cost // Add amount field for backward compatibility
          }));
          setAvailableRadiologyServices(transformedData);
        } else {
          console.log('⚠️ No radiology data returned from database');
        }
      } catch (error) {
        console.error('❌ Error in fetchRadiologyServices:', error);
        toast.error('Failed to load radiology services');
      } finally {
        setIsLoadingRadiologyServices(false);
        console.log('🏁 Radiology services fetch completed');
      }
    };

    fetchRadiologyServices();
  }, []);

  // Fetch available pharmacy/medication services from database
  useEffect(() => {
    const fetchPharmacyServices = async () => {
      try {
        setIsLoadingPharmacyServices(true);
        const { data, error } = await supabase
          .from('medication')
          .select('id, name, price_per_strip, medicine_code, pack, barcode, stock, Exp_date, description')
          .order('name');

        if (error) {
          console.error('Error fetching pharmacy services:', error);
          toast.error('Failed to load pharmacy services');
        } else if (data) {
          console.log('Pharmacy services fetched successfully:', data.length, 'records');
          console.log('Sample pharmacy services:', data.slice(0, 3));
          // Transform data to ensure proper field mapping for compatibility
          const transformedData = data.map(item => ({
            ...item,
            amount: item.price_per_strip, // Map price_per_strip to amount
            code: item.medicine_code, // Map medicine_code to code
            mrp: item.price_per_strip, // Map price_per_strip to mrp
            batch_no: item.barcode, // Map barcode to batch_no
            expiry_date: item.Exp_date // Map Exp_date to expiry_date
          }));
          setAvailablePharmacyServices(transformedData);
        }
      } catch (error) {
        console.error('Error in fetchPharmacyServices:', error);
        toast.error('Failed to load pharmacy services');
      } finally {
        setIsLoadingPharmacyServices(false);
      }
    };

    fetchPharmacyServices();
  }, []);

  const {
    data: visitData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["finalBillData", visitId],
    queryFn: async () => {
      if (!visitId) return null
      const { data, error } = await supabase
        .from("visits")
        .select(
          `
                *,
                patients(*),
                diagnosis:diagnosis_id (
                  id,
                  name
                )
            `
        )
        .eq("visit_id", visitId)
        .single()

      if (error) {
        console.error("Error fetching visit data:", error)
        throw new Error(error.message)
      }
      return data
    },
    enabled: !!visitId,
  })

  // Auto-create bill when visit data is available
  useEffect(() => {
    const createBillIfNeeded = async () => {
      if (!visitData || !visitId || billData?.id) return;

      console.log('Creating new bill for visit:', visitId);
      try {
        const { data: newBill, error: billError } = await supabase
          .from('bills')
          .insert({
            patient_id: visitData.patients.id,
            bill_no: `BL-${visitId}`,
            claim_id: validateClaimId(visitData.claim_id || visitId || 'TEMP-CLAIM'),
            date: new Date().toISOString().split('T')[0],
            category: 'GENERAL',
            total_amount: 0,
            status: 'DRAFT'
          })
          .select()
          .single();

        if (billError) {
          console.error('Error creating bill:', billError);
          return;
        }

        console.log('Created new bill with ID:', newBill.id);
        // Invalidate the query cache to refresh billData
        queryClient.invalidateQueries({ queryKey: ['final-bill', visitId] });
      } catch (error) {
        console.error('Error creating bill:', error);
      }
    };

    createBillIfNeeded();
  }, [visitData, visitId, billData?.id, queryClient]);

  // Fetch saved data when visit is available
  useEffect(() => {
    const fetchAllSavedData = async () => {
      if (!visitId) return;

      console.log('Fetching all saved data for visit ID:', visitId);

      try {
        // Fetch visit-related data (surgeries, diagnoses, complications, labs, radiology, medications, AI recommendations)
        await Promise.all([
          fetchSavedSurgeriesFromVisit(visitId),
          fetchSavedDiagnoses(visitId),
          fetchSavedComplications(visitId),
          fetchSavedLabs(visitId),
          fetchSavedRadiology(visitId),
          fetchSavedMedications(visitId),
          fetchAIRecommendations(visitId),
          loadSelectedComplicationsFromDB(visitId)
        ]);

        console.log('All saved data fetched successfully');
      } catch (error) {
        console.error('Error fetching saved data:', error);
      }
    };

    fetchAllSavedData();
  }, [visitId]);

  const [patientData, setPatientData] = useState<PatientData>(initialPatientData)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(initialInvoiceItems)
  // Draft: load from localStorage on mount/visit change
  useEffect(() => {
    const key = `final_bill_draft_${visitId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setInvoiceItems(parsed as InvoiceItem[]);
        }
      }
    } catch {}
  }, [visitId]);

  const saveDraft = () => {
    const key = `final_bill_draft_${visitId}`;
    localStorage.setItem(key, JSON.stringify(invoiceItems));
    toast.success('Draft saved');
  };

  const clearDraft = () => {
    const key = `final_bill_draft_${visitId}`;
    localStorage.removeItem(key);
    toast.success('Draft cleared');
  };
  const [totalAmount, setTotalAmount] = useState(0);
  const [medicineNote, setMedicineNote] = useState("");

  // Surgery Treatment state
  interface SurgeryTreatmentItem {
    id: string;
    date: string;
    surgery: {
      id: string;
      name: string;
      code: string;
      rate: number;
    } | null;
    baseAmount: number;
    adjustment: {
      type: string;
      percentage: number;
      amount: number;
    };
    finalAmount: number;
    additionalDetails: string;
  }

  const [surgeryTreatmentItems, setSurgeryTreatmentItems] = useState<SurgeryTreatmentItem[]>([]);

  // Middle section state for search and selection
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [activeServiceTab, setActiveServiceTab] = useState("Laboratory services");
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState("");
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<any[]>([]);
  const [savedDiagnoses, setSavedDiagnoses] = useState<{ id: string; name: string; is_primary: boolean }[]>([]);

  // Helper function to get diagnosis text
  const getDiagnosisText = useCallback(() => {
    // First priority: saved diagnoses from visit_diagnoses table
    if (savedDiagnoses.length > 0) {
      const primaryDiagnosis = savedDiagnoses.find(d => d.is_primary);
      if (primaryDiagnosis) {
        return primaryDiagnosis.name;
      }
      // If no primary, return the first diagnosis
      return savedDiagnoses[0].name;
    }

    // Second priority: diagnosis from the diagnosis relationship
    if (visitData?.diagnosis && typeof visitData.diagnosis === 'object' && 'name' in visitData.diagnosis) {
      return visitData.diagnosis.name as string
    }

    // Third priority: manual diagnosis text
    if (patientData.diagnosis && patientData.diagnosis.trim()) {
      return patientData.diagnosis.trim();
    }

    // Fallback: No diagnosis
    return "No diagnosis recorded"
  }, [savedDiagnoses, visitData?.diagnosis, patientData.diagnosis])

  // Edit service modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editServiceData, setEditServiceData] = useState({
    name: '',
    amount: 0,
    status: 'completed'
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingServiceIndex, setDeletingServiceIndex] = useState<number | null>(null);
  const [surgerySearchTerm, setSurgerySearchTerm] = useState("");
  const [selectedSurgeries, setSelectedSurgeries] = useState<any[]>([]);
  const [savedSurgeries, setSavedSurgeries] = useState<{ id: string; name: string; code: string; nabh_nabl_rate: string; is_primary: boolean; sanction_status?: string; status?: string; notes?: string }[]>([]);

  // State for surgery treatment rows with adjustment dropdown
  const [surgeryRows, setSurgeryRows] = useState<{
    id: string;
    name: string;
    code: string;
    rate: number;
    quantity: number;
    adjustment: string;
    adjustmentPercent: number;
    secondAdjustment?: string;
    secondAdjustmentPercent?: number;
  }[]>([]);

  const [complicationSearchTerm, setComplicationSearchTerm] = useState("");
  const [selectedComplications, setSelectedComplications] = useState<any[]>([]);

  // Function to add new surgery row
  const addSurgeryRow = () => {
    const newRow = {
      id: `surgery-${Date.now()}`,
      name: "",
      code: "",
      rate: 0,
      quantity: 1,
      adjustment: "No Adjustment",
      adjustmentPercent: 0,
      secondAdjustment: "No Adjustment",
      secondAdjustmentPercent: 0
    };
    setSurgeryRows(prev => [...prev, newRow]);
  };

  // Function to update surgery row
  const updateSurgeryRow = (id: string, field: string, value: any) => {
    setSurgeryRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        // Update adjustment percentage based on selection
        if (field === 'adjustment') {
          console.log('🎯 Updating adjustment:', { field, value, rowId: row.id });
          switch (value) {
            case '10% Less  Gen. Ward Charges as per CGHS Guidelines':
              updatedRow.adjustmentPercent = 10;
              break;
            case '50% Less  as per CGHS Guidelines':
              updatedRow.adjustmentPercent = 50;
              break;
            case '25% Less as per CGHS Guidelines':
              updatedRow.adjustmentPercent = 75;
              break;
            default:
              updatedRow.adjustmentPercent = 0;
          }
          console.log('✅ Updated adjustmentPercent to:', updatedRow.adjustmentPercent);
        }

        // Update second adjustment percentage based on selection
        if (field === 'secondAdjustment') {
          switch (value) {
            case '10% Less  Gen. Ward Charges as per CGHS Guidelines':
              updatedRow.secondAdjustmentPercent = 10;
              break;
            case '50% Less  as per CGHS Guidelines':
              updatedRow.secondAdjustmentPercent = 50;
              break;
            case '25% Less as per CGHS Guidelines':
              updatedRow.secondAdjustmentPercent = 75;
              break;
            default:
              updatedRow.secondAdjustmentPercent = 0;
          }
        }
        return updatedRow;
      }
      return row;
    }));
  };

  // Function to move surgery row up
  const moveSurgeryRowUp = (index: number) => {
    if (index > 0) {
      setSurgeryRows(prev => {
        const newRows = [...prev];
        [newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];
        return newRows;
      });
    }
  };

  // Function to move surgery row down
  const moveSurgeryRowDown = (index: number) => {
    setSurgeryRows(prev => {
      if (index < prev.length - 1) {
        const newRows = [...prev];
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
        return newRows;
      }
      return prev;
    });
  };

  // Function to remove surgery row
  const removeSurgeryRow = (id: string) => {
    setSurgeryRows(prev => prev.filter(row => row.id !== id));
  };

  // Initialize surgery rows from saved surgeries
  useEffect(() => {
    if (savedSurgeries.length > 0) {
      const initialRows = savedSurgeries.map((surgery, index) => ({
        id: surgery.id || `surgery-${index}`,
        name: surgery.name,
        code: surgery.code,
        rate: parseFloat(surgery.nabh_nabl_rate?.replace(/[^\d.]/g, '') || '0'),
        quantity: 1,
        adjustment: "No Adjustment",
        adjustmentPercent: 0,
        secondAdjustment: "No Adjustment",
        secondAdjustmentPercent: 0
      }));
      setSurgeryRows(initialRows);
    }
  }, [savedSurgeries]);
  const [savedComplications, setSavedComplications] = useState<{ id: string; name: string; is_primary: boolean }[]>([]);

  // Helper function to get complications text
  const getComplicationsText = useCallback(() => {
    // First priority: saved complications from visit_complications table
    if (savedComplications.length > 0) {
      const primaryComplication = savedComplications.find(c => c.is_primary);
      if (primaryComplication) {
        return primaryComplication.name;
      }
      // If no primary, return the first complication
      return savedComplications[0].name;
    }

    // Fallback: No complications
    return "No complications recorded"
  }, [savedComplications])

  const [labSearchTerm, setLabSearchTerm] = useState("");
  const [selectedLabs, setSelectedLabs] = useState<any[]>([]);

  const [radiologySearchTerm, setRadiologySearchTerm] = useState("");
  const [selectedRadiology, setSelectedRadiology] = useState<any[]>([]);
  const [savedRadiology, setSavedRadiology] = useState<{ id: string; name: string; description: string }[]>([]);
  const [medicationSearchTerm, setMedicationSearchTerm] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  const [savedMedications, setSavedMedications] = useState<{ id: string; name: string; description: string }[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<{
    complications: string[];
    labs: string[];
    radiology: string[];
    medications: string[];
  }>({
    complications: [],
    labs: [],
    radiology: [],
    medications: []
  });

  // State for tracking selected AI complications
  const [selectedAIComplications, setSelectedAIComplications] = useState<string[]>([]);

  // State for persistently selected AI complications (saved to database)
  const [persistentSelectedComplications, setPersistentSelectedComplications] = useState<string[]>([]);

  // State for tracking selected AI medications
  const [selectedAIMedications, setSelectedAIMedications] = useState<string[]>([]);

  // State for persistently selected AI medications (saved to database)
  const [persistentSelectedMedications, setPersistentSelectedMedications] = useState<string[]>([]);

  // State for tracking selected AI labs
  const [selectedAILabs, setSelectedAILabs] = useState<string[]>([]);

  // State for persistently selected AI labs (saved to database)
  const [persistentSelectedLabs, setPersistentSelectedLabs] = useState<string[]>([]);

  // State for tracking selected AI radiology
  const [selectedAIRadiology, setSelectedAIRadiology] = useState<string[]>([]);

  // State for persistently selected AI radiology (saved to database)
  const [persistentSelectedRadiology, setPersistentSelectedRadiology] = useState<string[]>([]);

  // State for stored AI recommendations
  const [savedAIRecommendations, setSavedAIRecommendations] = useState<any[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // Available lab services data - fetched from database
  const [availableLabServices, setAvailableLabServices] = useState([]);
  const [isLoadingLabServices, setIsLoadingLabServices] = useState(true);

  // Available radiology services data - fetched from database
  const [availableRadiologyServices, setAvailableRadiologyServices] = useState([]);
  const [isLoadingRadiologyServices, setIsLoadingRadiologyServices] = useState(true);

  // Available pharmacy services data - fetched from database
  const [availablePharmacyServices, setAvailablePharmacyServices] = useState([]);
  const [isLoadingPharmacyServices, setIsLoadingPharmacyServices] = useState(true);

  // Collapsible sections state
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isMiddleSectionCollapsed, setIsMiddleSectionCollapsed] = useState(false);

  // State for editable visit dates
  const [editableVisitDates, setEditableVisitDates] = useState({
    admission_date: '',
    discharge_date: '',
    surgery_date: '',
    package_amount: ''
  });

  // Add state for package dates and days
  const [packageDates, setPackageDates] = useState({
    start_date: '',
    end_date: '',
    total_package_days: 7,
    total_admission_days: 0
  });

  // Function to calculate days between two dates
  const calculateDaysBetween = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    return daysDiff > 0 ? daysDiff : 0;
  };

  // Function to handle package date changes
  const handlePackageDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setPackageDates(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate total package days when both dates are available
      if (updated.start_date && updated.end_date) {
        updated.total_package_days = calculateDaysBetween(updated.start_date, updated.end_date);
      }

      return updated;
    });
  };

  // Effect to calculate total admission days when admission/discharge dates change
  useEffect(() => {
    if (editableVisitDates.admission_date && editableVisitDates.discharge_date) {
      const admissionDays = calculateDaysBetween(editableVisitDates.admission_date, editableVisitDates.discharge_date);
      setPackageDates(prev => ({ ...prev, total_admission_days: admissionDays }));
    }
  }, [editableVisitDates.admission_date, editableVisitDates.discharge_date]);

  // State for doctor's plan document management
  const [doctorPlanDocument, setDoctorPlanDocument] = useState<File | null>(null);
  const [doctorPlanNotes, setDoctorPlanNotes] = useState('');
  const [otNotes, setOtNotes] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [allPatientData, setAllPatientData] = useState('');
  const [finalDischargeSummary, setFinalDischargeSummary] = useState('');
  const [isGeneratingDischargeSummary, setIsGeneratingDischargeSummary] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [isFetchingExternalData, setIsFetchingExternalData] = useState(false);
  const [externalApiData, setExternalApiData] = useState<any>(null);
  const [showExternalDataModal, setShowExternalDataModal] = useState(false);

  // OT Notes state
  const [otNotesData, setOtNotesData] = useState({
    date: '',
    procedure: '',
    surgeon: '',
    anaesthetist: '',
    anaesthesia: '',
    description: ''
  });
  const [isGeneratingSurgeryNotes, setIsGeneratingSurgeryNotes] = useState(false);

  // State for treatment log data (simplified - no date functionality)
  const [treatmentLogData, setTreatmentLogData] = useState<{ [key: number]: { date: string, accommodation: string, medication: string, labAndRadiology: string } }>({});
  
  // State for additional approval fields
  const [additionalApprovalSurgery, setAdditionalApprovalSurgery] = useState('');
  const [additionalApprovalInvestigation, setAdditionalApprovalInvestigation] = useState('');
  const [extensionOfStayApproval, setExtensionOfStayApproval] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  
  // State for common fetch data box
  const [commonFetchData, setCommonFetchData] = useState('');
  const [autoPrompt, setAutoPrompt] = useState('');
  const [letterType, setLetterType] = useState<'surgery' | 'extension' | 'investigation' | null>(null);
  
  // State for additional approval dates
  const [additionalApprovalSurgeryDate, setAdditionalApprovalSurgeryDate] = useState<Date | undefined>();
  const [additionalApprovalInvestigationDate, setAdditionalApprovalInvestigationDate] = useState<Date | undefined>();
  const [extensionOfStayApprovalDate, setExtensionOfStayApprovalDate] = useState<Date | undefined>();
  
  // State for ESIC letter generator
  const [isESICLetterDialogOpen, setIsESICLetterDialogOpen] = useState(false);

  // State for saved data tabs
  const [savedDataTab, setSavedDataTab] = useState('labs');
  const [savedLabData, setSavedLabData] = useState<any[]>([]);
  const [savedRadiologyData, setSavedRadiologyData] = useState<any[]>([]);
  const [savedMedicationData, setSavedMedicationData] = useState<any[]>([]);

  // State for editable fields in tables
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [editingRadiologyId, setEditingRadiologyId] = useState<string | null>(null);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);

  // State for medication modal
  const [selectedMedication, setSelectedMedication] = useState<any>(null);

  // State for discharge view
  const [showDischargeView, setShowDischargeView] = useState(false);

  // Functions to update lab data
  const updateLabField = async (labId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visit_labs')
        .update({ [field]: value })
        .eq('id', labId);

      if (error) {
        console.error('Error updating lab field:', error);
        toast.error('Failed to update lab data');
        return;
      }

      // Update local state
      setSavedLabData(prev => prev.map(lab =>
        lab.id === labId ? { ...lab, [field]: value } : lab
      ));

      toast.success('Lab data updated successfully');
    } catch (error) {
      console.error('Error updating lab field:', error);
      toast.error('Failed to update lab data');
    }
  };

  // Functions to update radiology data
  const updateRadiologyField = async (radiologyId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visit_radiology')
        .update({ [field]: value })
        .eq('id', radiologyId);

      if (error) {
        console.error('Error updating radiology field:', error);
        toast.error('Failed to update radiology data');
        return;
      }

      // Update local state
      setSavedRadiologyData(prev => prev.map(radiology =>
        radiology.id === radiologyId ? { ...radiology, [field]: value } : radiology
      ));

      toast.success('Radiology data updated successfully');
    } catch (error) {
      console.error('Error updating radiology field:', error);
      toast.error('Failed to update radiology data');
    }
  };

  // Functions to update medication data
  const updateMedicationField = async (medicationId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visit_medications')
        .update({ [field]: value })
        .eq('id', medicationId);

      if (error) {
        console.error('Error updating medication field:', error);
        toast.error('Failed to update medication data');
        return;
      }

      // Update local state
      setSavedMedicationData(prev => prev.map(medication =>
        medication.id === medicationId ? { ...medication, [field]: value } : medication
      ));

      toast.success('Medication data updated successfully');
    } catch (error) {
      console.error('Error updating medication field:', error);
      toast.error('Failed to update medication data');
    }
  };



  // Load treatment log data from database when component mounts
  useEffect(() => {
    const loadDoctorPlanData = async () => {
      if (visitId) {
        try {
          // First get the actual visit UUID from the visits table
          const { data: visitData, error: visitError } = await supabase
            .from('visits')
            .select('id')
            .eq('visit_id', visitId)
            .single();

          if (visitError) {
            console.error('Error fetching visit UUID:', visitError);
            // Fallback to localStorage
            const storageKey = `doctor_plan_${visitId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
            const dataObject: { [key: number]: { date: string, accommodation: string, medication: string, labAndRadiology: string } } = {};
            parsedData.forEach((entry: any) => {
              dataObject[entry.day_number] = {
                date: entry.date_of_stay || '',
                accommodation: entry.accommodation || '',
                medication: entry.medication || '',
                labAndRadiology: entry.lab_and_radiology || ''
              };
            });
            setTreatmentLogData(dataObject);
            }
            return;
          }

          const actualVisitId = visitData.id;

          // Try to load from database using the actual UUID
          const { data: doctorPlanData, error } = await (supabase as any)
            .from('doctor_plan')
            .select('*')
            .eq('visit_id', actualVisitId)
            .order('day_number');

          if (error) {
            console.error('Error loading doctor plan from database:', error);
            // Fallback to localStorage
            const storageKey = `doctor_plan_${visitId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const parsedData = JSON.parse(savedData);
            const dataObject: { [key: number]: { date: string, accommodation: string, medication: string, labAndRadiology: string } } = {};
            parsedData.forEach((entry: any) => {
              dataObject[entry.day_number] = {
                date: entry.date_of_stay || '',
                accommodation: entry.accommodation || '',
                medication: entry.medication || '',
                labAndRadiology: entry.lab_and_radiology || ''
              };
            });
            setTreatmentLogData(dataObject);
            }
          } else if (doctorPlanData && doctorPlanData.length > 0) {
            // Convert database data to object format
            const dataObject: { [key: number]: { date: string, accommodation: string, medication: string, labAndRadiology: string } } = {};
            doctorPlanData.forEach((entry: any) => {
              dataObject[entry.day_number] = {
                date: entry.date_of_stay || '',
                accommodation: entry.accommodation || '',
                medication: entry.medication || '',
                labAndRadiology: entry.lab_and_radiology || ''
              };
            });
            setTreatmentLogData(dataObject);
          }
        } catch (error) {
          console.error('Error loading doctor plan data:', error);
        }
      }
    };

    loadDoctorPlanData();
  }, [visitId]);



  // Initialize editable dates from visitData
  useEffect(() => {
    if (visitData) {
      setEditableVisitDates({
        admission_date: visitData.admission_date || visitData.visit_date || '',
        discharge_date: visitData.discharge_date || '',
        surgery_date: visitData.surgery_date || '',
        package_amount: visitData.package_amount || ''
      });

      // Initialize package dates - default to surgery date as start
      const surgeryDate = visitData.surgery_date || '';
      const startDate = surgeryDate;
      const endDate = surgeryDate ?
        format(new Date(new Date(surgeryDate).getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') :
        '';

      setPackageDates({
        start_date: startDate,
        end_date: endDate,
        total_package_days: startDate && endDate ? calculateDaysBetween(startDate, endDate) : 7,
        total_admission_days: 0
      });
    }
  }, [visitData]);

  // Fetch saved data for the tabs
  useEffect(() => {
    const fetchSavedData = async () => {
      if (!visitId) return;

      try {
        // First get the actual visit UUID from the visits table
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (visitError || !visitData?.id) {
          console.error('Error fetching visit UUID for saved data:', visitError);
          return;
        }

        const visitUUID = visitData.id;

        // Fetch saved lab data
        const { data: labData, error: labError } = await supabase
          .from('visit_labs')
          .select('*')
          .eq('visit_id', visitUUID);

        if (!labError && labData) {
          // Fetch lab details for each lab_id
          const formattedLabData = await Promise.all(
            labData.map(async (item) => {
              if (item.lab_id) {
                const { data: labDetails } = await supabase
                  .from('lab')
                  .select('name, "NABH_rates_in_rupee", "CGHS_code", description')
                  .eq('id', item.lab_id)
                  .single();

                return {
                  ...item,
                  lab_name: labDetails?.name || 'Unknown Lab',
                  cost: labDetails?.['NABH_rates_in_rupee'] || 0,
                  description: labDetails?.description || ''
                };
              }
              return {
                ...item,
                lab_name: 'Unknown Lab',
                cost: 0,
                description: ''
              };
            })
          );
          setSavedLabData(formattedLabData);
        }

        // Fetch saved radiology data
        const { data: radiologyData, error: radiologyError } = await supabase
          .from('visit_radiology')
          .select('*')
          .eq('visit_id', visitUUID);

        if (!radiologyError && radiologyData) {
          // Fetch radiology details for each radiology_id
          const formattedRadiologyData = await Promise.all(
            radiologyData.map(async (item) => {
              if (item.radiology_id) {
                const { data: radiologyDetails } = await supabase
                  .from('radiology')
                  .select('name, cost, description')
                  .eq('id', item.radiology_id)
                  .single();

                return {
                  ...item,
                  radiology_name: radiologyDetails?.name || 'Unknown Radiology',
                  cost: radiologyDetails?.cost || 0,
                  description: radiologyDetails?.description || ''
                };
              }
              return {
                ...item,
                radiology_name: 'Unknown Radiology',
                cost: 0,
                description: ''
              };
            })
          );
          setSavedRadiologyData(formattedRadiologyData);
        }

        // Fetch saved medication data
        const { data: medicationData, error: medicationError } = await supabase
          .from('visit_medications')
          .select('*')
          .eq('visit_id', visitUUID);

        if (!medicationError && medicationData) {
          // Fetch medication details for each medication_id
          const formattedMedicationData = await Promise.all(
            medicationData.map(async (item) => {
              if (item.medication_id) {
                const { data: medicationDetails } = await supabase
                  .from('medication')
                  .select('name, price_per_strip, description')
                  .eq('id', item.medication_id)
                  .single();

                return {
                  ...item,
                  medication_name: medicationDetails?.name || 'Unknown Medication',
                  cost: medicationDetails?.price_per_strip || 0,
                  description: medicationDetails?.description || ''
                };
              }
              return {
                ...item,
                medication_name: 'Unknown Medication',
                cost: 0,
                description: ''
              };
            })
          );
          setSavedMedicationData(formattedMedicationData);
        }

      } catch (error) {
        console.error('Error fetching saved data:', error);
      }
    };

    fetchSavedData();
  }, [visitId]);

  // Additional useEffect to ensure individual fetch functions are called for data consistency
  useEffect(() => {
    if (visitId) {
      // Call individual fetch functions to ensure all saved data is loaded
      Promise.all([
        fetchSavedLabData(),
        fetchSavedRadiologyData(),
        fetchSavedMedicationData()
      ]).catch(error => {
        console.error('Error fetching individual saved data:', error);
      });
    }
  }, [visitId]);

  // Function to refresh saved data
  const refreshSavedData = async () => {
    if (!visitId) return;

    try {
      // Call individual fetch functions for consistency
      await Promise.all([
        fetchSavedLabData(),
        fetchSavedRadiologyData(),
        fetchSavedMedicationData()
      ]);
    } catch (error) {
      console.error('Error refreshing saved data:', error);
    }
  };

  // Legacy refresh function for backward compatibility
  const refreshSavedDataLegacy = async () => {
    if (!visitId) return;

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID for refresh:', visitError);
        return;
      }

      const visitUUID = visitData.id;

      // Refresh medication data
      const { data: medicationData, error: medicationError } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_id', visitUUID);

      if (!medicationError && medicationData) {
        const formattedMedicationData = await Promise.all(
          medicationData.map(async (item) => {
            if (item.medication_id) {
              const { data: medicationDetails } = await supabase
                .from('medication')
                .select('name, price_per_strip, description')
                .eq('id', item.medication_id)
                .single();

              return {
                ...item,
                medication_name: medicationDetails?.name || 'Unknown Medication',
                cost: medicationDetails?.price_per_strip || 0,
                description: medicationDetails?.description || ''
              };
            }
            return {
              ...item,
              medication_name: 'Unknown Medication',
              cost: 0,
              description: ''
            };
          })
        );
        setSavedMedicationData(formattedMedicationData);
      }

      // Refresh lab data
      const { data: labData, error: labError } = await supabase
        .from('visit_labs')
        .select('*')
        .eq('visit_id', visitUUID);

      if (!labError && labData) {
        const formattedLabData = await Promise.all(
          labData.map(async (item) => {
            if (item.lab_id) {
              const { data: labDetails } = await supabase
                .from('lab')
                .select('name, "NABH_rates_in_rupee", description')
                .eq('id', item.lab_id)
                .single();

              return {
                ...item,
                lab_name: labDetails?.name || 'Unknown Lab',
                cost: labDetails?.['NABH_rates_in_rupee'] || 0,
                description: labDetails?.description || ''
              };
            }
            return {
              ...item,
              lab_name: 'Unknown Lab',
              cost: 0,
              description: ''
            };
          })
        );
        setSavedLabData(formattedLabData);
      }

      // Refresh radiology data
      const { data: radiologyData, error: radiologyError } = await supabase
        .from('visit_radiology')
        .select('*')
        .eq('visit_id', visitUUID);

      if (!radiologyError && radiologyData) {
        const formattedRadiologyData = await Promise.all(
          radiologyData.map(async (item) => {
            if (item.radiology_id) {
              const { data: radiologyDetails } = await supabase
                .from('radiology')
                .select('name, cost, description')
                .eq('id', item.radiology_id)
                .single();

              return {
                ...item,
                radiology_name: radiologyDetails?.name || 'Unknown Radiology',
                cost: radiologyDetails?.cost || 0,
                description: radiologyDetails?.description || ''
              };
            }
            return {
              ...item,
              radiology_name: 'Unknown Radiology',
              cost: 0,
              description: ''
            };
          })
        );
        setSavedRadiologyData(formattedRadiologyData);
      }

    } catch (error) {
      console.error('Error refreshing saved data:', error);
    }
  };

  // Function to update treatment log data (simplified)
  const updateTreatmentLogData = useCallback((dayNumber: number, field: 'date' | 'accommodation' | 'medication' | 'labAndRadiology', value: string) => {
    console.log('Updating treatment log:', { dayNumber, field, value }); // Debug log
    setTreatmentLogData(prev => {
      const currentRow = prev[dayNumber] || { date: '', accommodation: '', medication: '', labAndRadiology: '' };
      const newData = {
        ...prev,
        [dayNumber]: {
          ...currentRow,
          [field]: value
        }
      };
      console.log('New treatment log data:', newData); // Debug log
      return newData;
    });
  }, []);

  // Function to save visit dates to database
  const saveVisitDates = async (field: string, value: string) => {
    if (!visitData?.id) {
      toast.error('Visit data not available');
      return;
    }

    try {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitData.id);

      if (error) {
        console.error('Error updating visit date:', error);
        toast.error(`Failed to save ${field.replace('_', ' ')}`);
      } else {
        toast.success(`${field.replace('_', ' ')} saved successfully`);
        // Invalidate and refetch visit data
        queryClient.invalidateQueries({ queryKey: ["finalBillData", visitId] });
      }
    } catch (error) {
      console.error('Error saving visit date:', error);
      toast.error(`Failed to save ${field.replace('_', ' ')}`);
    }
  };

  // Functions for doctor's plan buttons
  const handleScanDocument = () => {
    // Check if device supports camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          toast.success('Camera access granted. Scan functionality would be implemented here.');
          // Here you would implement actual camera/scanning functionality
        })
        .catch(() => {
          toast.error('Camera access denied or not available');
        });
    } else {
      toast.error('Camera not supported on this device');
    }
  };

  const handleUploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setDoctorPlanDocument(file);
        toast.success(`Image "${file.name}" uploaded successfully`);
        // Here you would implement actual file upload to storage
      }
    };
    input.click();
  };

  const handleAddOTNotes = () => {
    const notes = prompt('Enter OT Notes:');
    if (notes) {
      setOtNotes(notes);
      toast.success('OT Notes added successfully');
      // Here you would save the notes to the database
    }
  };

  const handleAddDischargeSummary = async () => {
    try {
      toast.info('Fetching all patient data for discharge summary...');

      // Fetch all patient data when discharge summary button is clicked
      await fetchAllPatientData();

      // Also fetch additional data for comprehensive summary
      await fetchPatientInfo();
      if (visitId) {
        await Promise.all([
          fetchSavedDiagnoses(visitId),
          fetchSavedComplications(visitId),
          fetchSavedSurgeriesFromVisit(visitId),
          fetchSavedLabs(visitId),
          fetchSavedRadiology(visitId),
          fetchSavedMedications(visitId),
          fetchAIRecommendations(visitId)
        ]);
      }

      toast.success('✅ All patient data fetched successfully! Data is now available in the text area below.');

      // Scroll to the data area to make it visible
      setTimeout(() => {
        const dataTextArea = document.querySelector('textarea[placeholder*="Click \'Discharge Summary\'"]');
        if (dataTextArea) {
          dataTextArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

    } catch (error) {
      console.error('Error in handleAddDischargeSummary:', error);
      toast.error('Failed to fetch some patient data. Please try again.');
    }
  };

  // Function to fetch patient info with surgery details
  const fetchPatientInfo = async () => {
    if (!visitId) return;

    try {
      // First get visit data with patient info
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*)
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError) throw visitError;

      // Get surgery details from visit_surgeries table
      const { data: surgeryData, error: surgeryError } = await supabase
        .from('visit_surgeries')
        .select(`
          *,
          cghs_surgery:surgery_id (
            name,
            code,
            NABH_NABL_Rate
          )
        `)
        .eq('visit_id', visitData.id);

      if (surgeryError) {
        console.error('Error fetching surgery data:', surgeryError);
      }

      // Combine patient info with surgery details
      const combinedInfo = {
        ...visitData.patients,
        surgeries: surgeryData || [],
        visitInfo: {
          admission_date: visitData.admission_date,
          discharge_date: visitData.discharge_date,
          surgery_date: visitData.surgery_date
        }
      };

      setPatientInfo(combinedInfo);
      
      // Auto-populate Additional Sanction Approval field with patient's lab and radiology data only
      let investigationText = '';
      let itemCount = 0;
      
      // Fetch lab data for this visit
      const { data: labData, error: labError } = await supabase
        .from('visit_labs')
        .select(`
          *,
          lab:lab_id (
            name,
            CGHS_code,
            NABH_rates_in_rupee
          )
        `)
        .eq('visit_id', visitData.id);
      
      if (!labError && labData && labData.length > 0) {
        labData.forEach((labItem) => {
          const labInfo = labItem.lab;
          if (labInfo) {
            itemCount++;
            investigationText += `${itemCount}. ${labInfo.name}\n`;
            investigationText += `   CODE: ${labInfo.CGHS_code || 'N/A'}\n`;
            investigationText += `   APPROXIMATE COST: ₹${labInfo.NABH_rates_in_rupee || 'N/A'}\n\n`;
          }
        });
      }
      
      // Fetch radiology data for this visit
      const { data: radiologyData, error: radiologyError } = await supabase
        .from('visit_radiology')
        .select(`
          *,
          radiology:radiology_id (
            name,
            cost
          )
        `)
        .eq('visit_id', visitData.id);
      
      if (!radiologyError && radiologyData && radiologyData.length > 0) {
        radiologyData.forEach((radiologyItem) => {
          const radiologyInfo = radiologyItem.radiology;
          if (radiologyInfo) {
            itemCount++;
            investigationText += `${itemCount}. ${radiologyInfo.name}\n`;
            investigationText += `   CODE: N/A\n`;
            investigationText += `   APPROXIMATE COST: ₹${radiologyInfo.cost || 'N/A'}\n\n`;
          }
        });
      }
      
      if (investigationText) {
        setAdditionalApprovalInvestigation(investigationText.trim());
      }
    } catch (error) {
      console.error('Error fetching patient info:', error);
    }
  };

  // Function to fetch patient data from external API by phone number via Supabase Edge Function
  const fetchPatientDataByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log('Invalid phone number:', phoneNumber);
      return;
    }

    setIsFetchingExternalData(true);
    try {
      console.log('🔄 Fetching patient data for phone:', phoneNumber);
      toast.info('🔄 Fetching patient data from external HIMS API...');

      const requestBody = { mobile: phoneNumber };
      console.log('📤 API Request:', requestBody);

      // Use Supabase Edge Function to avoid CORS issues
      const response = await fetch('https://xvkxccqaopbnkvwgyfjv.supabase.co/functions/v1/fetch-patient-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU`,
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Edge Function Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Edge Function error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 Edge Function Response:', result);

      if (result.success && result.data && Object.keys(result.data).length > 0) {
        const data = result.data;

        // Store the external API data for display
        setExternalApiData(data);

        // Update patient data with fetched information
        const updatedData = {
          ...patientData,
          name: data.name || data.patient_name || patientData.name,
          age: data.age ? String(data.age) : patientData.age,
          sex: data.gender || data.sex || patientData.sex,
          contactNo: phoneNumber,
          address: data.address || data.patient_address || patientData.address,
          registrationNo: data.registration_no || data.reg_no || patientData.registrationNo,
          claimId: data.claim_id || data.claimId || data.claim_no || patientData.claimId,
          // Add ESIC specific fields if available
          beneficiaryName: data.beneficiary_name || patientData.beneficiaryName,
          relation: data.relation || patientData.relation,
          // Add any other fields that match your API response
        };

        setPatientData(updatedData);

        toast.success(`✅ Patient data fetched: ${data.name || data.patient_name || 'Unknown'}`);
        console.log('✅ Patient data updated successfully');
      } else if (result.success) {
        toast.info('No patient data found for this phone number');
        console.log('⚠️ No data returned from API');
      } else {
        throw new Error(result.error || 'Unknown error from Edge Function');
      }
    } catch (error) {
      console.error('❌ Error fetching patient data via Edge Function:', error);
      toast.error(`Failed to fetch patient data: ${error.message}`);
    } finally {
      setIsFetchingExternalData(false);
    }
  };

  // Function to fetch all patient data from various tables
  const fetchAllPatientData = async () => {
    if (!visitId) {
      toast.error('No visit ID available');
      return;
    }

    try {
      toast.info('Fetching all patient data...');

      // First get the actual visit UUID from the visits table with patient data
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*)
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        console.error('Error fetching visit data:', visitError);
        toast.error('Failed to fetch visit data');
        return;
      }

      const dataArray: string[] = [];

      // Add patient basic information
      if (visitData.patients) {
        const patient = visitData.patients;
        dataArray.push(`PATIENT INFORMATION:
          Name: ${patient.name || 'N/A'}
          Age: ${patient.age || 'N/A'} years
          Gender: ${patient.gender || 'N/A'}
          Phone: ${patient.phone || 'N/A'}
          Address: ${patient.address || 'N/A'}
          ESIC Number: ${patient.esic_number || 'N/A'}`);
      }

      // Add visit information
      dataArray.push(`VISIT DETAILS:
        Visit ID: ${visitData.visit_id || 'N/A'}
        Admission Date: ${visitData.admission_date || 'N/A'}
        Discharge Date: ${visitData.discharge_date || 'N/A'}
        Surgery Date: ${visitData.surgery_date || 'N/A'}
        Package Start Date: ${visitData.package_start_date || 'N/A'}
        Package End Date: ${visitData.package_end_date || 'N/A'}
        Package Days: ${visitData.package_days || 'N/A'}
        Admission Days: ${visitData.admission_days || 'N/A'}`);

      // Fetch visit_diagnoses
      const { data: visitDiagnoses } = await supabase
        .from('visit_diagnoses')
        .select(`*, diagnoses:diagnosis_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitDiagnoses && visitDiagnoses.length > 0) {
        const diagnosesText = visitDiagnoses.map((item: any, index: number) =>
          `${index + 1}. ${item.diagnoses?.name || 'Unknown diagnosis'} ${item.is_primary ? '(Primary)' : ''}`
        ).join('\n');
        dataArray.push(`DIAGNOSES:\n${diagnosesText}`);
      }

      // Fetch visit_surgeries
      const { data: visitSurgeries } = await supabase
        .from('visit_surgeries')
        .select(`*, cghs_surgery:surgery_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitSurgeries && visitSurgeries.length > 0) {
        const surgeriesText = visitSurgeries.map((item: any, index: number) =>
          `${index + 1}. ${item.cghs_surgery?.name || 'Unknown surgery'} (Code: ${item.cghs_surgery?.code || 'N/A'}) - Status: ${item.sanction_status || 'N/A'} ${item.is_primary ? '(Primary)' : ''}`
        ).join('\n');
        dataArray.push(`SURGERIES:\n${surgeriesText}`);
      }

      // Fetch visit_complications
      const { data: visitComplications } = await supabase
        .from('visit_complications')
        .select(`*, diagnoses:complication_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitComplications && visitComplications.length > 0) {
        const complicationsText = visitComplications.map((item: any, index: number) =>
          `${index + 1}. ${item.diagnoses?.name || 'Unknown complication'}`
        ).join('\n');
        dataArray.push(`COMPLICATIONS:\n${complicationsText}`);
      }

      // Fetch visit_labs
      const { data: visitLabs } = await supabase
        .from('visit_labs')
        .select(`*, cghs_lab_services:lab_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitLabs && visitLabs.length > 0) {
        const labsText = visitLabs.map((item: any, index: number) =>
          `${index + 1}. ${item.cghs_lab_services?.name || 'Unknown lab test'}`
        ).join('\n');
        dataArray.push(`LABORATORY TESTS:\n${labsText}`);
      }

      // Fetch visit_radiology
      const { data: visitRadiology } = await supabase
        .from('visit_radiology')
        .select(`*, radiology:radiology_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitRadiology && visitRadiology.length > 0) {
        const radiologyText = visitRadiology.map((item: any, index: number) =>
          `${index + 1}. ${item.radiology?.name || 'Unknown radiology procedure'}`
        ).join('\n');
        dataArray.push(`RADIOLOGY PROCEDURES:\n${radiologyText}`);
      }

      // Fetch visit_medications
      const { data: visitMedications } = await supabase
        .from('visit_medications')
        .select(`*, medication:medication_id (*)`)
        .eq('visit_id', visitData.id);

      if (visitMedications && visitMedications.length > 0) {
        const medicationsText = visitMedications.map((item: any, index: number) =>
          `${index + 1}. ${item.medication?.name || 'Unknown medication'}`
        ).join('\n');
        dataArray.push(`MEDICATIONS:\n${medicationsText}`);
      }

      // Fetch ai_clinical_recommendations
      const { data: aiRecommendations } = await supabase
        .from('ai_clinical_recommendations')
        .select('*')
        .eq('visit_id', visitData.id);

      if (aiRecommendations && aiRecommendations.length > 0) {
        const aiText = aiRecommendations.map((item: any, index: number) => {
          const parts = [];
          if (item.recommendation_type) parts.push(`Type: ${item.recommendation_type}`);
          if (item.recommendation_text) parts.push(`Recommendation: ${item.recommendation_text}`);
          if (item.confidence_score) parts.push(`Confidence: ${item.confidence_score}%`);
          return `${index + 1}. ${parts.join(', ')}`;
        }).join('\n');
        dataArray.push(`AI CLINICAL RECOMMENDATIONS:\n${aiText}`);
      }

      // Join all data with double line breaks for better readability
      const allDataString = dataArray.join('\n\n');
      setAllPatientData(allDataString);

      toast.success('All patient data fetched successfully!');

    } catch (error) {
      console.error('Error fetching all patient data:', error);
      toast.error('Failed to fetch patient data');
    }
  };

  // Function to generate final discharge summary using AI
  const generateFinalDischargeSummary = async () => {
    // Check if we have patient data from external API or internal data
    const hasExternalData = patientData.contactNo && patientData.name;
    const hasInternalData = allPatientData.trim();

    if (!hasExternalData && !hasInternalData) {
      toast.error('No patient data available. Please fetch data using mobile number or click "Discharge Summary" button first.');
      return;
    }

    setIsGeneratingDischargeSummary(true);

    try {
      toast.info('Generating professional discharge summary using available patient data...');

//       const aiPrompt = `You are an expert medical professional creating a comprehensive discharge summary. Generate a detailed, professional medical document based on the provided patient data.

// **STRUCTURE REQUIREMENTS:**

// **1. DIAGNOSIS SECTION (First)**
// - Primary diagnosis based on patient data
// - Secondary diagnoses if applicable
// - ICD codes where relevant

// **2. MEDICATIONS TABLE (Second)**
// Create a properly formatted table:

// | Medication Name | Strength | Route | Dosage (English) | Dosage (Hindi) | Duration |
// |-----------------|----------|-------|------------------|----------------|----------|

// Guidelines:
// - Use Indian brand names for medications
// - Include detailed instructions (once/twice/thrice daily)
// - Add Hindi translation for dosage instructions
// - Specify number of days for each medication

// **3. INVESTIGATIONS SECTION**
// - **Normal Investigations:** List all normal findings
// - **Abnormal Investigations:** List abnormal findings with values

// **4. HOSPITAL COURSE**
// - Admission details and presenting complaints
// - Treatment provided during hospital stay
// - Patient's response to treatment
// - Any complications or events during stay

// **5. OPERATION NOTES (If Surgery Performed)**
// Create a properly formatted table:

// | Parameter | Details |
// |-----------|---------|
// | Date & Time of Surgery | [Actual date/time] |
// | Procedure Title | [Surgery name] |
// | Surgeon Name | [Surgeon details] |
// | Anaesthetist Name | [Anaesthetist details] |
// | Type of Anaesthesia | [Anaesthesia type] |
// | Detailed Procedure Description | [Comprehensive surgical details] |

// If no surgery performed, write: "No surgery was performed during this hospitalization."

// **6. DISCHARGE INSTRUCTIONS**
// - Home care precautions
// - Activity restrictions
// - Diet recommendations
// - Follow-up appointments

// **7. COMPLICATIONS TO WATCH FOR**
// - List specific symptoms and signs of potential complications
// - When to return to hospital immediately
// - Warning signs for emergency care

// **8. EMERGENCY CONTACT (Mandatory End)**
// "URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709"

// **FORMATTING GUIDELINES:**
// - Use proper medical terminology
// - Minimum 800 words
// - Use headings, subheadings, bullet points, and **bold** formatting
// - Professional tone suitable for doctor-to-doctor communication
// - Do not mention patient name, sex, or age
// - Base content on provided patient data but add relevant clinical details

// Patient Data from Internal System: ${allPatientData}

// Patient Data from External API:
// Name: ${patientData.name || 'N/A'}
// Age: ${patientData.age || 'N/A'}
// Gender: ${patientData.sex || 'N/A'}
// Phone: ${patientData.contactNo || 'N/A'}
// Address: ${patientData.address || 'N/A'}
// Registration No: ${patientData.registrationNo || 'N/A'}
// Beneficiary Name: ${patientData.beneficiaryName || 'N/A'}
// Relation: ${patientData.relation || 'N/A'}

// Data Source: ${hasExternalData ? 'External HIMS API + Internal System' : 'Internal System Only'}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-ud4gdaQUskHyAt2lSGbuFegjXAEEYBj1VSKgFg2Y2KT3BlbkFJGNve4BG40woRq7wP7bvAaWsw9Mmt6qqCW6oHuEkA8A'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert medical professional specializing in creating comprehensive discharge summaries. Generate detailed, professional medical documentation based on the provided patient data.'
            },
            // {
            //   role: 'user',
            //   content: aiPrompt
            // }
          ],
          max_tokens: 2000,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedSummary = data.choices[0].message.content;

      setFinalDischargeSummary(generatedSummary);
      toast.success('Professional discharge summary generated successfully!');

    } catch (error) {
      console.error('Error generating discharge summary:', error);
      toast.error('Failed to generate discharge summary. Please try again.');

      // Fallback summary with data source information
      const dataSourceInfo = patientData.contactNo && patientData.name
        ? `🌐 **DATA SOURCE: External HIMS API + Internal System**
Patient demographics fetched from External HIMS API (Mobile: ${patientData.contactNo})
Medical data from Internal Hospital System

**EXTERNAL API DATA:**
- Name: ${patientData.name}
- Age: ${patientData.age}
- Gender: ${patientData.sex}
- Phone: ${patientData.contactNo}
- Address: ${patientData.address}
- Registration No: ${patientData.registrationNo}
- Beneficiary: ${patientData.beneficiaryName || 'N/A'}
- Relation: ${patientData.relation || 'N/A'}

**INTERNAL SYSTEM DATA:**
- Medical records, diagnoses, surgeries, medications, lab results
`
        : `🏥 **DATA SOURCE: Internal Hospital System Only**
All patient data from internal hospital management system
`;

      setFinalDischargeSummary(`DISCHARGE SUMMARY

Generated on: ${new Date().toLocaleDateString('en-IN')}

${dataSourceInfo}

**1. DIAGNOSIS SECTION**

Primary diagnosis:
- ${savedDiagnoses?.filter(d => d.is_primary).map(d => `${d.name} (ICD-10 code: N18)`).join('\n- ') || 'No primary diagnosis recorded'}

Secondary Diagnosis:
- ${savedDiagnoses?.filter(d => !d.is_primary).map(d => `${d.name} (ICD-10 code: T82.4)`).join('\n- ') || 'No secondary diagnosis recorded'}

**2. MEDICATIONS TABLE**

| Medication Name | Strength | Route | Dosage (English) | Dosage (Hindi) | Duration |
|-----------------|----------|-------|------------------|----------------|----------|
${savedMedications?.map(med => `| ${med.name} | - | Oral | Twice daily | दिन में दो बार | 30 days |`).join('\n') || '| No medications prescribed | - | - | - | - | - |'}

**3. INVESTIGATIONS SECTION**

**Normal Investigations:**
- Hemoglobin: 12.6 g/dL
- Platelet count: 250,000 /cumm
- Serum sodium: 140 mEq/L

**Abnormal Investigations:**
- Serum creatinine: 2.8 mg/dL
- Blood urea nitrogen: 35 mg/dL
- Serum potassium: 5.6 mEq/L

**4. HOSPITAL COURSE**

The patient was admitted with a history of ${savedDiagnoses?.map(d => d.name).join(' and ') || 'presenting complaints'}. The patient received conservative management which included medications for controlling symptoms and improving clinical condition. The patient showed good response to the treatment with improved parameters. No significant complications or adverse events occurred during the hospital stay.

**5. OPERATION NOTES**

${savedSurgeries?.length > 0 ? savedSurgeries.map(surgery => `${surgery.name} was performed successfully.`).join('\n') : 'No surgery was performed during this hospitalization.'}

**6. DISCHARGE INSTRUCTIONS**

- Take all prescribed medications as directed
- Follow up with treating physician as advised  
- Maintain adequate rest and hydration
- Return to hospital if symptoms worsen or new symptoms develop
- Continue physiotherapy as advised
- Diet: Regular diet with adequate protein intake
- Activity: As tolerated, gradual return to normal activities

**7. COMPLICATIONS TO WATCH FOR:**
- Signs of infection (fever, increased pain, redness)
- Allergic reactions to medications  
- Worsening of original symptoms
- Any new concerning symptoms

**8. EMERGENCY CONTACT:**
URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709

**1. DIAGNOSIS:**
- Primary Diagnosis: Based on the provided patient data, comprehensive medical evaluation has been completed
- Secondary Diagnosis: None specified
- ICD Codes: To be updated based on final diagnosis

**2. MEDICATIONS:**

| Medication Name | Strength | Route | Dosage (English) | Dosage (Hindi) | Duration |
|-----------------|----------|-------|------------------|----------------|----------|
| Tab Paracetamol | 500mg | Oral | Twice daily | दिन में दो बार | 5 days |
| Tab Amoxicillin | 250mg | Oral | Thrice daily | दिन में तीन बार | 7 days |
| Tab Omeprazole | 20mg | Oral | Once daily | दिन में एक बार | 10 days |

**3. INVESTIGATIONS:**

**Normal Investigations:**
- Hemoglobin: 12.5 g/dL
- Blood Pressure: 120/80 mmHg
- Heart Rate: 72 bpm

**Abnormal Investigations:**
- To be updated based on patient reports

**4. HOSPITAL COURSE:**
The patient was admitted with presenting complaints and received appropriate medical care during the hospital stay. Treatment was initiated as per standard protocols. Patient responded well to the prescribed medications and showed improvement in clinical condition.

**5. OPERATION NOTES:**
No surgery was performed during this hospitalization.

**6. DISCHARGE INSTRUCTIONS:**
- Take all prescribed medications as directed
- Follow up with treating physician as advised
- Maintain adequate rest and hydration
- Return to hospital if symptoms worsen or new symptoms develop

**7. COMPLICATIONS TO WATCH FOR:**
- Signs of infection (fever, increased pain, redness)
- Allergic reactions to medications
- Worsening of original symptoms
- Any new concerning symptoms

**8. EMERGENCY CONTACT:**
URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709`);
    } finally {
      setIsGeneratingDischargeSummary(false);
    }
  };

  // Function to generate AI surgery notes
  const generateAISurgeryNotes = async () => {
    if (!visitId) {
      toast.error('No visit ID available');
      return;
    }

    setIsGeneratingSurgeryNotes(true);

    try {
      toast.info('Fetching surgery details and generating notes...');

      // First get visit data with patient information
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          id,
          patient_id,
          patients (
            name,
            age,
            gender
          )
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        toast.error('Failed to fetch visit data');
        setIsGeneratingSurgeryNotes(false);
        return;
      }

      // Fetch surgery details from visit_surgeries table
      const { data: surgeryData, error: surgeryError } = await supabase
        .from('visit_surgeries')
        .select(`
          *,
          cghs_surgery:surgery_id (
            name,
            code,
            NABH_NABL_Rate,
            description
          )
        `)
        .eq('visit_id', visitData.id);

      if (surgeryError) {
        console.error('Error fetching surgery data:', surgeryError);
        toast.error('Failed to fetch surgery details');
        setIsGeneratingSurgeryNotes(false);
        return;
      }

      // Prepare surgery information for AI prompt
      let surgeryInfo = '';
      if (surgeryData && surgeryData.length > 0) {
        surgeryInfo = surgeryData.map((surgery: any) => `
Surgery Name: ${surgery.cghs_surgery?.name || 'N/A'}
Surgery Code: ${surgery.cghs_surgery?.code || 'N/A'}
NABH/NABL Rate: ₹${surgery.cghs_surgery?.NABH_NABL_Rate || 'N/A'}
Sanction Status: ${surgery.sanction_status || 'N/A'}
Description: ${surgery.cghs_surgery?.description || 'Standard surgical procedure'}`).join('\n\n');
      } else {
        // Don't generate AI notes if no surgery is found
        toast.error('No surgery selected and saved. Please add surgery first to generate OT notes.');
        setIsGeneratingSurgeryNotes(false);
        return;
      }

      const surgeryPrompt = `OT Notes: Act like a surgeon. Make a detailed surgery/OT note. Include the implant used and the quantity of implant. Come up with creative detailed surgery notes based on the following information:

PATIENT INFORMATION:
Patient Name: ${visitData.patients?.name || '[Patient Name]'}
Age: ${visitData.patients?.age || '[Age]'}
Gender: ${visitData.patients?.gender || '[Gender]'}

SURGERY DETAILS FROM PATIENT RECORDS:
${surgeryInfo}

ADDITIONAL INFORMATION:
Surgeon: ${otNotesData.surgeon || 'Dr. [Surgeon Name]'}
Anaesthetist: ${otNotesData.anaesthetist || 'Dr. [Anaesthetist Name]'}
Anaesthesia: ${otNotesData.anaesthesia || 'General Anaesthesia'}
Date: ${otNotesData.date || new Date().toISOString()}

Generate a comprehensive surgical note that includes:
- Pre-operative findings
- Surgical technique and steps
- Implants used (with specific quantities and sizes)
- Post-operative condition
- Complications (if any)
- Instructions for post-operative care

Make it detailed and professional as if written by an experienced surgeon.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-ud4gdaQUskHyAt2lSGbuFegjXAEEYBj1VSKgFg2Y2KT3BlbkFJGNve4BG40woRq7wP7bvAaWsw9Mmt6qqCW6oHuEkA8A'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an experienced surgeon writing detailed operative notes. Generate comprehensive, professional surgical documentation with specific details about implants, quantities, and surgical techniques.'
            },
            {
              role: 'user',
              content: surgeryPrompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedNotes = data.choices[0].message.content;

      // Update the description field with AI generated notes
      setOtNotesData({ ...otNotesData, description: generatedNotes });
      toast.success('AI surgery notes generated successfully!');

    } catch (error) {
      console.error('Error generating surgery notes:', error);
      toast.error('Failed to generate surgery notes. Please try again.');

      // Fallback surgery notes
      const fallbackNotes = `OPERATIVE NOTE

PROCEDURE: ${otNotesData.procedure}
SURGEON: ${otNotesData.surgeon}
ANAESTHETIST: ${otNotesData.anaesthetist}
ANAESTHESIA: ${otNotesData.anaesthesia || 'General Anaesthesia'}

PRE-OPERATIVE DIAGNOSIS: ${otNotesData.procedure}

OPERATIVE FINDINGS:
- Patient positioned appropriately
- Surgical site prepared and draped in sterile fashion

PROCEDURE DETAILS:
- Standard surgical approach utilized
- Careful dissection performed
- Appropriate surgical technique employed
- Hemostasis achieved

IMPLANTS USED:
- Standard surgical implants as required
- Quantity: As per surgical requirement

POST-OPERATIVE CONDITION:
- Patient stable
- No immediate complications
- Wound closed in layers

INSTRUCTIONS:
- Post-operative monitoring
- Appropriate pain management
- Follow-up as scheduled`;

      setOtNotesData({ ...otNotesData, description: fallbackNotes });
    } finally {
      setIsGeneratingSurgeryNotes(false);
    }
  };

  // Function to save doctor's plan data to database
  const handleSaveTreatmentLog = async () => {
    if (!visitId) {
      toast.error("Visit ID not available");
      return;
    }

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID:', visitError);
        toast.error("Failed to find visit record");
        return;
      }

      const actualVisitId = visitData.id;

      // Prepare data for saving - only save rows that have data
      const doctorPlanEntries = Object.entries(treatmentLogData)
        .filter(([_, data]) => data.medication.trim() || data.labAndRadiology.trim() || data.date.trim() || data.accommodation.trim())
        .map(([dayNumber, data]) => ({
          visit_id: actualVisitId,
          day_number: parseInt(dayNumber),
          date_of_stay: data.date || '',
          accommodation: data.accommodation || '',
          medication: data.medication || '',
          lab_and_radiology: data.labAndRadiology || '',
          additional_approval_surgery: additionalApprovalSurgery || null,
          additional_approval_surgery_date: additionalApprovalSurgeryDate ? additionalApprovalSurgeryDate.toISOString().split('T')[0] : null,
          additional_approval_investigation: additionalApprovalInvestigation || null,
          additional_approval_investigation_date: additionalApprovalInvestigationDate ? additionalApprovalInvestigationDate.toISOString().split('T')[0] : null,
          extension_stay_approval: extensionOfStayApproval || null,
          extension_stay_approval_date: extensionOfStayApprovalDate ? extensionOfStayApprovalDate.toISOString().split('T')[0] : null
        }));

      if (doctorPlanEntries.length === 0) {
        toast.error("No doctor's plan data to save");
        return;
      }

      // Store in localStorage as backup
      const storageKey = `doctor_plan_${visitId}`;
      localStorage.setItem(storageKey, JSON.stringify(doctorPlanEntries));

      // First, delete existing doctor plan entries for this visit
      const { error: deleteError } = await (supabase as any)
        .from('doctor_plan')
        .delete()
        .eq('visit_id', actualVisitId);

      if (deleteError) {
        console.error('Error deleting existing doctor plan:', deleteError);
        toast.error("Failed to clear existing doctor plan data");
        return;
      }

      // Insert new doctor plan entries
      const { error: insertError } = await (supabase as any)
        .from('doctor_plan')
        .insert(doctorPlanEntries);

      if (insertError) {
        console.error('Error saving doctor plan:', insertError);
        toast.error("Failed to save doctor plan data");
        return;
      }

      toast.success(`Doctor's plan saved successfully! (${doctorPlanEntries.length} entries)`);
    } catch (error) {
      console.error('Error saving doctor plan:', error);
      toast.error("Failed to save doctor plan data");
    }
  };



  const getSectionTitle = (item: SectionItem) => {
    // Handle both formats: "( Days)" and "(X Days)" where X is any number
    if (item.title.includes('( Days)') || /\(\d+ Days\)/.test(item.title)) {
      let days = 0;
      if (item.dates?.from && item.dates?.to) {
        // Adding 1 to include both start and end dates
        days = differenceInDays(item.dates.to, item.dates.from) + 1;
      }

      // Replace both formats
      if (item.title.includes('( Days)')) {
        return item.title.replace('( Days)', `(${days} Days)`);
      } else {
        return item.title.replace(/\(\d+ Days\)/, `(${days} Days)`);
      }
    }
    return item.title;
  }

  // Ensure initial sections are always shown
  useEffect(() => {
    // Always start with initial sections
    if (invoiceItems.length === 0) {
      setInvoiceItems(initialInvoiceItems);
    }
  }, []);

  // Load bill data when available
  useEffect(() => {
    if (billData) {
      setPatientData(prev => ({
        ...prev,
        billNo: billData.bill_no,
        category: billData.category,
        billDate: billData.date,
      }));

      // Load sections and line items into invoiceItems (merge with existing)
      if (billData.sections && billData.line_items) {
        console.log('Loading saved bill data:', billData);

        const loadedItems: InvoiceItem[] = [];

        // Load sections
        billData.sections.forEach((section: any) => {
          loadedItems.push({
            id: section.id,
            type: 'section',
            title: section.section_title,
            isOpen: true
          } as SectionItem);
        });

        // Group line items by parent description to recreate main items
        const groupedItems: { [key: string]: any[] } = {};
        billData.line_items.forEach((lineItem: any) => {
          const parentDesc = lineItem.item_description;
          if (!groupedItems[parentDesc]) {
            groupedItems[parentDesc] = [];
          }
          groupedItems[parentDesc].push(lineItem);
        });

        // Create main items with their sub items
        Object.entries(groupedItems).forEach(([parentDesc, items]) => {
          const mainItem: MainItem = {
            id: `main-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'main',
            description: parentDesc,
            subItems: items.map((item: any) => {
              let parsedDates = undefined;
              if (item.dates_info) {
                try {
                  parsedDates = JSON.parse(item.dates_info);
                } catch (e) {
                  console.error('Error parsing dates_info:', e);
                }
              }

              return {
                id: item.id,
                srNo: item.sr_no,
                description: item.item_description,
                code: item.cghs_nabh_code,
                rate: item.cghs_nabh_rate,
                qty: item.qty,
                amount: item.amount,
                type: item.item_type || 'standard',
                dates: parsedDates,
                baseAmount: item.base_amount,
                primaryAdjustment: item.primary_adjustment,
                secondaryAdjustment: item.secondary_adjustment
              };
            })
          };
          loadedItems.push(mainItem);
        });

        console.log('Loaded invoice items:', loadedItems);
        // Merge saved data with initial sections
        setInvoiceItems([...initialInvoiceItems, ...loadedItems]);
      } else {
        // No saved data, use initial sections
        setInvoiceItems(initialInvoiceItems);
      }
    }
  }, [billData]);

  // Update Pathology Charges with saved lab data
  useEffect(() => {
    console.log('🔬 Pathology Charges Debug:', { 
      savedLabData, 
      savedLabDataLength: savedLabData?.length || 0,
      visitId 
    });
    
    setInvoiceItems(prev => prev.map(item => {
      if (item.type === 'main' && item.description === 'Pathology Charges') {
        if (savedLabData && savedLabData.length > 0) {
          console.log('📋 Updating Pathology Charges with lab data:', savedLabData);
          // Create sub-items from saved lab data
          const labSubItems = savedLabData.map((lab, index) => ({
            id: `pathology_${lab.id}`,
            srNo: `${String.fromCharCode(97 + index)})`, // a), b), c), etc.
            description: lab.lab_name,
            code: '',
            rate: parseFloat(lab.cost?.toString() || '0') || 0,
            qty: 1,
            amount: parseFloat(lab.cost?.toString() || '0') || 0,
            type: 'standard' as const,
            dates: { from: new Date(), to: new Date() }
          }));

          // Calculate total amount
          const totalAmount = labSubItems.reduce((sum, item) => sum + item.amount, 0);

          console.log('✅ Pathology Charges updated with lab items:', { labSubItems, totalAmount });

          return {
            ...item,
            subItems: labSubItems,
            amount: totalAmount
          };
        } else {
          console.log('⚠️ No lab tests found - updating Pathology Charges to show "No lab tests"');
          // No lab tests - show default message
          const defaultSubItem = {
            id: 'pathology_default',
            srNo: 'a)',
            description: 'No lab tests ordered for this visit',
            code: '',
            rate: 0,
            qty: 1,
            amount: 0,
            type: 'standard' as const,
            dates: { from: new Date(), to: new Date() }
          };

          return {
            ...item,
            subItems: [defaultSubItem],
            amount: 0
          };
        }
      }
      return item;
    }));
  }, [savedLabData, visitId]);

  // Update Medicine Charges with saved medication data
  useEffect(() => {
    console.log('💊 Medicine Charges Debug:', { 
      savedMedicationData, 
      savedMedicationDataLength: savedMedicationData?.length || 0,
      visitId 
    });
    
    setInvoiceItems(prev => prev.map(item => {
      if (item.type === 'main' && item.description === 'Medicine Charges') {
        if (savedMedicationData && savedMedicationData.length > 0) {
          console.log('💊 Updating Medicine Charges with medication data:', savedMedicationData);
          // Create sub-items from saved medication data
          const medicationSubItems = savedMedicationData.map((medication, index) => ({
            id: `medicine_${medication.id}`,
            srNo: `${String.fromCharCode(97 + index)})`, // a), b), c), etc.
            description: medication.medication_name,
            code: '',
            rate: parseFloat(medication.cost?.toString() || '0') || 0,
            qty: 1,
            amount: parseFloat(medication.cost?.toString() || '0') || 0,
            type: 'standard' as const,
            dates: { from: new Date(), to: new Date() }
          }));

          // Calculate total amount
          const totalAmount = medicationSubItems.reduce((sum, item) => sum + item.amount, 0);

          console.log('✅ Medicine Charges updated with medication items:', { medicationSubItems, totalAmount });

          return {
            ...item,
            subItems: medicationSubItems,
            amount: totalAmount
          };
        } else {
          console.log('⚠️ No medications found - updating Medicine Charges to show "No medications"');
          // No medications - show default message
          const defaultSubItem = {
            id: 'medicine_default',
            srNo: 'a)',
            description: 'No medications prescribed for this visit',
            code: '',
            rate: 0,
            qty: 1,
            amount: 0,
            type: 'standard' as const,
            dates: { from: new Date(), to: new Date() }
          };

          return {
            ...item,
            subItems: [defaultSubItem],
            amount: 0
          };
        }
      }
      return item;
    }));
  }, [savedMedicationData, visitId]);

  useEffect(() => {
    if (visitData) {
      const patient = visitData.patients;
      setPatientData(prev => {
        const diagnosisCandidate = getDiagnosisText();
        const diagnosisValue = prev.diagnosis && prev.diagnosis.trim().length > 0
          ? prev.diagnosis
          : (diagnosisCandidate !== 'No diagnosis recorded' ? diagnosisCandidate : prev.diagnosis);
        return {
          ...prev,
          claimId: validateClaimId(visitData.claim_id || visitId || ""),
          billNo: billData?.bill_no || `BL-${visitData.visit_id}`,
          registrationNo: cleanData(patient.patients_id) || patient.id || "",
          name: cleanData(patient.name),
          age: String(patient.age || ""),
          sex: cleanData(patient.gender),
          contactNo: cleanData(patient.phone),
          address: cleanData(patient.address),
          beneficiaryName: prev.beneficiaryName || "",
          relation: prev.relation || "SELF",
          rank: prev.rank || "",
          serviceNo: cleanData(patient.insurance_person_no) || prev.serviceNo,
          category: billData?.category || prev.category || "GENERAL",
          diagnosis: diagnosisValue || '',
          dateOfAdmission: prev.dateOfAdmission || (visitData.admission_date
            ? format(new Date(visitData.admission_date), "yyyy-MM-dd")
            : (patient.created_at ? format(new Date(patient.created_at), "yyyy-MM-dd") : "")),
          dateOfDischarge: prev.dateOfDischarge || (visitData.discharge_date
            ? format(new Date(visitData.discharge_date), "yyyy-MM-dd")
            : ""),
          billDate: prev.billDate || billData?.date || format(new Date(), "yyyy-MM-dd"),
        };
      })

      // Auto-sync dates with bill sections based on visit data
      if (visitData.admission_date || visitData.surgery_date || visitData.discharge_date) {
        console.log('🗓️ Auto-syncing dates from visit data:', {
          admission_date: visitData.admission_date,
          surgery_date: visitData.surgery_date,
          discharge_date: visitData.discharge_date
        });

        const admissionDate = visitData.admission_date ? new Date(visitData.admission_date) : null;
        const surgeryDate = visitData.surgery_date ? new Date(visitData.surgery_date) : null;
        const dischargeDate = visitData.discharge_date ? new Date(visitData.discharge_date) : null;

        // Use admission date as start, surgery date - 1 day as end for Conservative Treatment
        const conservativeStart = admissionDate || surgeryDate || new Date();
        const conservativeEnd = surgeryDate ? new Date(surgeryDate.getTime() - 24 * 60 * 60 * 1000) : (dischargeDate || new Date());

        // Use package dates from doctor's plan for Surgical Package
        const surgicalStart = packageDates.start_date ? new Date(packageDates.start_date) : (surgeryDate || admissionDate || new Date());
        const surgicalEnd = packageDates.end_date ? new Date(packageDates.end_date) : (surgeryDate ? new Date(surgeryDate.getTime() + 24 * 60 * 60 * 1000) : (dischargeDate || new Date()));

        // Update discharge date to match surgical end date
        const updatedDischargeDate = surgicalEnd;

        // Update patient data discharge date to match
        setPatientData(prev => ({
          ...prev,
          dateOfDischarge: surgicalEnd ? format(surgicalEnd, 'yyyy-MM-dd') : prev.dateOfDischarge
        }));

        setInvoiceItems(prev => prev.map(item => {
          if (item.type === 'section') {
            if (item.title === 'Conservative Treatment') {
              // Calculate Post-Surgical Conservative Treatment period
              const postSurgicalStart = packageDates.end_date ? 
                new Date(new Date(packageDates.end_date).getTime() + 24 * 60 * 60 * 1000) : 
                null;
              const postSurgicalEnd = dischargeDate;
              
              return {
                ...item,
                dates: { from: conservativeStart, to: conservativeEnd },
                additionalDateRanges: postSurgicalStart && postSurgicalEnd ? 
                  [{ from: postSurgicalStart, to: postSurgicalEnd }] : 
                  []
              };
            }
            if (item.title.includes('Surgical Package')) {
              return {
                ...item,
                dates: { from: surgicalStart, to: surgicalEnd }
              };
            }
          }
          if (item.type === 'main') {
            if (item.description === 'Consultation for Inpatients') {
              // Calculate Post-Surgical Conservative Treatment period for consultation
              const postSurgicalStart = packageDates.end_date ? 
                new Date(new Date(packageDates.end_date).getTime() + 24 * 60 * 60 * 1000) : 
                null;
              const postSurgicalEnd = dischargeDate;
              
              return {
                ...item,
                dates: { from: conservativeStart, to: conservativeEnd },
                subItems: item.subItems.map(subItem => ({
                  ...subItem,
                  dates: { from: conservativeStart, to: conservativeEnd },
                  additionalDateRanges: postSurgicalStart && postSurgicalEnd ? 
                    [{ from: postSurgicalStart, to: postSurgicalEnd }] : 
                    []
                }))
              };
            }
            if (item.description === 'Accommodation Charges') {
              // Calculate Post-Surgical Conservative Treatment period for accommodation
              const postSurgicalStart = packageDates.end_date ? 
                new Date(new Date(packageDates.end_date).getTime() + 24 * 60 * 60 * 1000) : 
                null;
              const postSurgicalEnd = dischargeDate;
              
              return {
                ...item,
                dates: { from: conservativeStart, to: conservativeEnd },
                subItems: item.subItems.map(subItem => ({
                  ...subItem,
                  dates: { from: conservativeStart, to: conservativeEnd },
                  additionalDateRanges: postSurgicalStart && postSurgicalEnd ? 
                    [{ from: postSurgicalStart, to: postSurgicalEnd }] : 
                    []
                }))
              };
            }
          }
          return item;
        }));
      }
    }
  }, [visitData, billData, getDiagnosisText])

  const handlePatientDataChange = (field: keyof PatientData, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }))
    if (field === 'diagnosis') {
      // Isolate diagnosis so it doesn't override other derived fields like IP No.
      // Do not trigger any auto-sync routines here
    }
  }

  // Populate diagnosis once saved/visit data is available, but only if empty
  useEffect(() => {
    if (!patientData.diagnosis || patientData.diagnosis.trim() === '') {
      const computed = getDiagnosisText();
      if (computed && computed !== 'No diagnosis recorded') {
        setPatientData(prev => ({ ...prev, diagnosis: computed }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDiagnoses, visitData?.diagnosis]);

  // Function to calculate days between two dates
  const calculateDaysBetweenDates = (dateRange: DateRange | undefined): number => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return 1; // Default to 1 if no date range
    }
    const days = differenceInDays(dateRange.to, dateRange.from) + 1; // +1 to include both start and end dates
    return Math.max(1, days); // Ensure minimum 1 day
  };

  const handleItemChange = (itemId: string, subItemId: string | null, field: string, value: any) => {
    setInvoiceItems(prev => prev.map((item): InvoiceItem => {
      if (item.type === 'main' && (item.id === itemId)) {
        if (field === 'description' && !subItemId) {
          return { ...item, description: value };
        }
        if (field === 'dates' && !subItemId) {
          return { ...item, dates: value as DateRange | undefined };
        }
        const newSubItems = item.subItems.map((subItem): SubItem => {
          if (subItemId && subItem.id === subItemId) {
            let processedValue = value;
            if (field === 'rate' || field === 'qty' || field === 'amount') {
              processedValue = parseFloat(value) || 0;
            }
            if (typeof subItem === 'object') {
              const updatedSubItem = { ...subItem, [field]: processedValue };

              // Auto-calculate days and amount when dates change
              if (field === 'dates') {
                const calculatedDays = calculateDaysBetweenDates(processedValue);
                updatedSubItem.qty = calculatedDays;
                const rate = (updatedSubItem as StandardSubItem).rate || 0;
                (updatedSubItem as StandardSubItem).amount = rate * calculatedDays;
              }

              // Auto-calculate amount when rate or qty changes
              if (field === 'rate' || field === 'qty') {
                const standardSubItem = updatedSubItem as StandardSubItem;
                const rate = field === 'rate' ? processedValue : standardSubItem.rate || 0;
                const qty = field === 'qty' ? processedValue : standardSubItem.qty || 0;
                standardSubItem.amount = rate * qty;
              }

              return updatedSubItem;
            }
            return subItem;
          }
          return subItem;
        });
        return { ...item, subItems: newSubItems };
      }
      if (item.type === 'section' && (item.id === itemId)) {
        if (field === 'dates') {
          const updatedItem = { ...item, dates: value as DateRange | undefined };

          // If this is Conservative Treatment section, sync dates to Consultation for Inpatients
          if (item.title === 'Conservative Treatment') {
            // Use setTimeout to ensure the state update happens after this one
            setTimeout(() => {
              syncConservativeTreatmentDates(value as DateRange | undefined, item.additionalDateRanges);
            }, 0);
          }

          return updatedItem;
        }
        if (field === 'additionalDateRanges') {
          const updatedItem = { ...item, additionalDateRanges: value as DateRange[] };

          // If this is Conservative Treatment section, sync dates to Consultation for Inpatients
          if (item.title === 'Conservative Treatment') {
            // Use setTimeout to ensure the state update happens after this one
            setTimeout(() => {
              syncConservativeTreatmentDates(item.dates, value as DateRange[]);
            }, 0);
          }

          return updatedItem;
        }
      }
      return item;
    }));
  };

  // Function to sync Conservative Treatment dates to Consultation for Inpatients
  const syncConservativeTreatmentDates = (mainDates: DateRange | undefined, additionalDates: DateRange[] | undefined) => {
    let hasUpdated = false;

    setInvoiceItems(prev => prev.map(item => {
      if (item.type === 'main' && item.description === 'Consultation for Inpatients') {
        const updatedSubItems = item.subItems.map(subItem => {
          // Update the main dates
          const updatedSubItem = { ...subItem };
          if (mainDates) {
            updatedSubItem.dates = mainDates;
            hasUpdated = true;
          }

          // Update additional date ranges
          if (additionalDates && additionalDates.length > 0) {
            updatedSubItem.additionalDateRanges = [...additionalDates];
            hasUpdated = true;
          }

          // Recalculate quantity and amount based on new dates
          if (updatedSubItem.dates && updatedSubItem.dates.from && updatedSubItem.dates.to) {
            const mainDays = Math.ceil((updatedSubItem.dates.to.getTime() - updatedSubItem.dates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            let totalDays = mainDays;

            // Add days from additional date ranges
            if (updatedSubItem.additionalDateRanges) {
              updatedSubItem.additionalDateRanges.forEach(dateRange => {
                if (dateRange.from && dateRange.to) {
                  const additionalDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  totalDays += additionalDays;
                }
              });
            }

            const rate = (updatedSubItem as StandardSubItem).rate || 0;
            updatedSubItem.qty = totalDays;
            updatedSubItem.amount = rate * totalDays;
          }

          return updatedSubItem;
        });

        return { ...item, subItems: updatedSubItems };
      }
      return item;
    }));

    // Show toast notification when dates are synced
    if (hasUpdated) {
      toast.success('📅 Conservative Treatment dates synced to Consultation for Inpatients');
    }
  };

  // Function to fetch saved radiology data
  const fetchSavedRadiologyData = async () => {
    if (!visitId) return;

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID for radiology:', visitError);
        return;
      }

      // Fetch saved radiology data
      const { data: radiologyData, error: radiologyError } = await supabase
        .from('visit_radiology')
        .select('*')
        .eq('visit_id', visitData.id);

      if (!radiologyError && radiologyData) {
        // Fetch radiology details for each radiology_id
        const formattedRadiologyData = await Promise.all(
          radiologyData.map(async (item) => {
            if (item.radiology_id) {
              const { data: radiologyDetail } = await supabase
                .from('radiology')
                .select('name, description, cost')
                .eq('id', item.radiology_id)
                .single();

              return {
                id: item.id,
                radiology_name: radiologyDetail?.name || `Radiology ID: ${item.radiology_id}`,
                description: radiologyDetail?.description || '',
                ordered_date: item.ordered_date,
                cost: parseFloat(radiologyDetail?.cost?.toString().replace(/[^\d.-]/g, '')) || 0,
                created_at: item.created_at
              };
            }
            return {
              id: item.id,
              radiology_name: `Unknown Radiology Test`,
              ordered_date: item.ordered_date,
              created_at: item.created_at,
              cost: 0,
              description: ''
            };
          })
        );
        setSavedRadiologyData(formattedRadiologyData);
      }
    } catch (error) {
      console.error('Error fetching saved radiology data:', error);
    }
  };

  // Function to delete saved radiology
  const handleDeleteRadiology = async (radiologyId: string) => {
    if (!confirm('Are you sure you want to delete this radiology test?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_radiology')
        .delete()
        .eq('id', radiologyId);

      if (error) {
        console.error('Error deleting radiology:', error);
        toast.error('Failed to delete radiology test');
        return;
      }

      // Refresh saved radiology data
      await fetchSavedRadiologyData();
      toast.success('Radiology test deleted successfully');
    } catch (error) {
      console.error('Error deleting radiology:', error);
      toast.error('Failed to delete radiology test');
    }
  };

  // Function to fetch saved lab data
  const fetchSavedLabData = async () => {
    if (!visitId) return;

    console.log('🔍 Fetching saved lab data for visit:', visitId);

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID for labs:', visitError);
        return;
      }

      // Fetch saved lab data
      const { data: labData, error: labError } = await supabase
        .from('visit_labs')
        .select('*')
        .eq('visit_id', visitData.id);

      console.log('📊 Lab data query result:', { labData, labError, visitUUID: visitData.id });

      if (!labError && labData) {
        console.log('🧪 Found lab data, formatting:', labData);
        // Fetch lab details for each lab_id
        const formattedLabData = await Promise.all(
          labData.map(async (item) => {
            if (item.lab_id) {
              const { data: labDetail } = await supabase
                .from('lab')
                .select('name, description, "NABH_rates_in_rupee"')
                .eq('id', item.lab_id)
                .single();

              return {
                id: item.id,
                lab_name: labDetail?.name || `Lab ID: ${item.lab_id}`,
                description: labDetail?.description || '',
                ordered_date: item.ordered_date,
                cost: labDetail?.['NABH_rates_in_rupee'] || 0,
                created_at: item.created_at
              };
            }
            return {
              id: item.id,
              lab_name: `Unknown Lab Test`,
              ordered_date: item.ordered_date,
              created_at: item.created_at,
              cost: 0,
              description: ''
            };
          })
        );
        console.log('✅ Formatted lab data:', formattedLabData);
        setSavedLabData(formattedLabData);
      } else {
        console.log('❌ No lab data found or error occurred');
        setSavedLabData([]);
      }
    } catch (error) {
      console.error('Error fetching saved lab data:', error);
    }
  };

  // Function to delete saved lab test
  const handleDeleteLabTest = async (labId: string) => {
    if (!confirm('Are you sure you want to delete this lab test?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_labs')
        .delete()
        .eq('id', labId);

      if (error) {
        console.error('Error deleting lab test:', error);
        toast.error('Failed to delete lab test');
        return;
      }

      // Refresh saved lab data
      await fetchSavedLabData();
      toast.success('Lab test deleted successfully');
    } catch (error) {
      console.error('Error deleting lab test:', error);
      toast.error('Failed to delete lab test');
    }
  };

  // Function to save single medication to visit_medications table
  const saveSingleMedicationToVisit = async (medication: any) => {
    if (!visitId) {
      toast.error('No visit ID available to save medication');
      return;
    }

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID for medication:', visitError);
        toast.error('Failed to find visit record. Cannot save medication.');
        return;
      }

      // Check if medication already exists for this visit
      const { data: existingMedication, error: checkError } = await supabase
        .from('visit_medications')
        .select('id')
        .eq('visit_id', visitData.id)
        .eq('medication_id', medication.id)
        .single();

      if (existingMedication) {
        toast.warning('This medication is already added to this visit');
        return;
      }

      // Insert medication to visit_medications table
      const { error: insertError } = await supabase
        .from('visit_medications')
        .insert({
          visit_id: visitData.id,
          medication_id: medication.id,
          status: 'prescribed',
          prescribed_date: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error saving medication:', insertError);
        toast.error('Failed to save medication');
        return;
      }

      // Refresh saved medication data
      await fetchSavedMedicationData();
      toast.success(`${medication.name} saved to visit successfully!`);

    } catch (error) {
      console.error('Error in saveSingleMedicationToVisit:', error);
      toast.error('Failed to save medication');
    }
  };

  // Function to fetch saved medication data
  const fetchSavedMedicationData = async () => {
    if (!visitId) return;

    try {
      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID for medications:', visitError);
        return;
      }

      // Fetch saved medication data
      const { data: medicationData, error: medicationError } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_id', visitData.id);

      if (!medicationError && medicationData) {
        // Fetch medication details for each medication_id
        const formattedMedicationData = await Promise.all(
          medicationData.map(async (item) => {
            if (item.medication_id) {
              const { data: medicationDetail } = await supabase
                .from('medication')
                .select('name, description, amount, cost, mrp')
                .eq('id', item.medication_id)
                .single();

              return {
                id: item.id,
                medication_name: medicationDetail?.name || `Medication ID: ${item.medication_id}`,
                description: medicationDetail?.description || '',
                created_at: item.created_at,
                prescribed_date: item.prescribed_date,
                cost: medicationDetail?.amount || medicationDetail?.cost || medicationDetail?.mrp || 0
              };
            }
            return {
              id: item.id,
              medication_name: `Unknown Medication`,
              created_at: item.created_at,
              prescribed_date: item.prescribed_date,
              cost: 0,
              description: ''
            };
          })
        );
        setSavedMedicationData(formattedMedicationData);
      }
    } catch (error) {
      console.error('Error fetching saved medication data:', error);
    }
  };

  // Function to delete saved medication
  const handleDeleteMedication = async (medicationId: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_medications')
        .delete()
        .eq('id', medicationId);

      if (error) {
        console.error('Error deleting medication:', error);
        toast.error('Failed to delete medication');
        return;
      }

      // Refresh saved medication data
      await fetchSavedMedicationData();
      toast.success('Medication deleted successfully');
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error('Failed to delete medication');
    }
  };



  const handleAddItem = (mainItemId: string) => {
    setInvoiceItems(prev => prev.map((item): InvoiceItem => {
      if (item.type === 'main' && item.id === mainItemId) {


        const newSubId = `sub${mainItemId.replace('main', '')}-${item.subItems.length + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        let description = 'Select Doctor'; // Default
        let addDatePicker = true;
        let addAdditionalDateRanges = false;

        if (item.description === 'Consultation for Inpatients') {
          description = 'Select Doctor';
          addAdditionalDateRanges = true;
        } else if (item.description === 'Accommodation Charges') {
          description = 'Accommodation of General Ward';
          addAdditionalDateRanges = true;
        } else if (item.description === 'Pathology Charges') {
          description = '';
        } else if (item.description === 'Medicine Charges') {
          description = '';
        } else if (item.description === 'Other Charges') {
          description = '';
          addDatePicker = false;
        } else if (item.description === 'Miscellaneous Charges') {
          description = '';
          addDatePicker = false;

        }

        const newSubItem: StandardSubItem = {
          id: newSubId,
          srNo: `${String.fromCharCode(97 + item.subItems.length)})`,
          description,
          rate: 0,
          qty: 1,
          amount: 0,
          type: 'standard',
        };

        if (addDatePicker) {
          newSubItem.dates = { from: new Date(), to: new Date() };
        }

        if (addAdditionalDateRanges) {
          newSubItem.additionalDateRanges = [
            { from: new Date(), to: new Date() }
          ];
        }

        return { ...item, subItems: [...item.subItems, newSubItem] };
      }
      return item;
    }));
  }

  const handleRemoveItem = (mainItemId: string, subItemId: string) => {
    setInvoiceItems(prev => prev.map((item): InvoiceItem => {
      if (item.type === 'main' && item.id === mainItemId) {
        const newSubItems = item.subItems.filter(si => si.id !== subItemId)
          .map((sub, idx) => {
            const surgeryLetter = String.fromCharCode(97 + idx);
            // Update description for surgical items to include new numbering
            const updatedDescription = sub.description;

            return {
              ...sub,
              srNo: `${surgeryLetter})`,
              description: updatedDescription
            };
          });
        return { ...item, subItems: newSubItems };
      }
      return item;
    }));
  }

  const moveItem = (mainItemId: string, subItemId: string, direction: number) => {
    setInvoiceItems(prev => prev.map((item): InvoiceItem => {
      if (item.type === 'main' && item.id === mainItemId) {
        const index = item.subItems.findIndex(si => si.id === subItemId);
        if (index === -1) return item;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= item.subItems.length) return item;

        const newSubItems = [...item.subItems];
        [newSubItems[index], newSubItems[newIndex]] = [newSubItems[newIndex], newSubItems[index]];

        const renumberedSubItems = newSubItems.map((sub, idx) => ({
          ...sub,
          srNo: `${String.fromCharCode(97 + idx)})`
        }));

        return { ...item, subItems: renumberedSubItems };
      }
      return item;
    }));
  }

  const toggleSection = (sectionId: string) => {
    setInvoiceItems(prev => prev.map((item): InvoiceItem =>
      item.id === sectionId && item.type === 'section' ? { ...item, isOpen: !item.isOpen } : item
    ));
  }

  const calculateTotalAmount = () => {
    const baseAmount = invoiceItems.reduce((total, item) => {
      if (item.type === 'main' && item.subItems) {
        return total + item.subItems.reduce((subTotal, subItem) => {
          const currentAmount = Number((subItem as StandardSubItem).amount) || 0;
          return subTotal + currentAmount;
        }, 0);
      }
      return total;
    }, 0);

    // Add surgery treatment amounts from surgeryRows
    const surgeryTreatmentTotal = surgeryRows.reduce((total, row) => {
      const baseAmount = row.rate * row.quantity;
      const firstDiscountAmount = baseAmount * (row.adjustmentPercent / 100);
      const amountAfterFirstDiscount = baseAmount - firstDiscountAmount;
      const secondDiscountAmount = amountAfterFirstDiscount * ((row.secondAdjustmentPercent || 0) / 100);
      const finalAmount = amountAfterFirstDiscount - secondDiscountAmount;
      
      console.log('🔧 Total Calculation for:', row.name, {
        baseAmount,
        adjustmentPercent: row.adjustmentPercent,
        firstDiscountAmount,
        amountAfterFirstDiscount,
        secondAdjustmentPercent: row.secondAdjustmentPercent,
        secondDiscountAmount,
        finalAmount
      });
      
      return total + finalAmount;
    }, 0);

    return baseAmount + surgeryTreatmentTotal;
  };

  // Surgery Treatment functions
  const addSurgeryTreatment = () => {
    const currentIndex = surgeryTreatmentItems.length;
    const currentSurgery = savedSurgeries[currentIndex];

    let baseAmount = 0;
    if (currentSurgery && currentSurgery.nabh_nabl_rate) {
      const rate = parseFloat(currentSurgery.nabh_nabl_rate.replace(/[^\d.]/g, '') || '0');
      baseAmount = rate;
    }

    const newItem: SurgeryTreatmentItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      surgery: currentSurgery ? {
        id: currentSurgery.id,
        name: currentSurgery.name,
        code: currentSurgery.code,
        rate: baseAmount
      } : null,
      baseAmount: baseAmount,
      adjustment: {
        type: 'No Adjustment',
        percentage: 0,
        amount: 0
      },
      finalAmount: baseAmount,
      additionalDetails: ''
    };
    setSurgeryTreatmentItems(prev => [...prev, newItem]);
  };

  const updateSurgeryTreatment = (id: string, field: string, value: any) => {
    setSurgeryTreatmentItems(prev => prev.map((item, index) => {
      if (item.id === id) {
        const updated = { ...item };

        // Get the current surgery from savedSurgeries based on index
        const currentSurgery = savedSurgeries[index];
        if (currentSurgery && currentSurgery.nabh_nabl_rate) {
          const rate = parseFloat(currentSurgery.nabh_nabl_rate.replace(/[^\d.]/g, '') || '0');
          updated.baseAmount = rate;
        }

        if (field === 'adjustment') {
          updated.adjustment = value;
        } else if (field === 'date') {
          updated.date = value;
        } else if (field === 'additionalDetails') {
          updated.additionalDetails = value;
        }

        // Recalculate final amount
        if (updated.adjustment.type === 'No Adjustment') {
          updated.finalAmount = updated.baseAmount;
        } else {
          const adjustmentAmount = (updated.baseAmount * updated.adjustment.percentage) / 100;
          updated.finalAmount = updated.baseAmount - adjustmentAmount;
          updated.adjustment.amount = adjustmentAmount;
        }

        return updated;
      }
      return item;
    }));
  };

  const deleteSurgeryTreatment = (id: string) => {
    setSurgeryTreatmentItems(prev => prev.filter(item => item.id !== id));
  };

  // Function to delete a sub-item from invoice
  const deleteSubItem = (mainItemId: string, subItemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setInvoiceItems(prev => prev.map(item => {
      if (item.id === mainItemId && item.type === 'main') {
        const mainItem = item as MainItem;
        return {
          ...mainItem,
          subItems: mainItem.subItems.filter(subItem => subItem.id !== subItemId)
        };
      }
      return item;
    }));
  };

  const adjustmentOptions = [
    { label: 'No Adjustment', percentage: 0 },
    { label: '10% Less  Gen. Ward Charges', percentage: 10 },
    { label: '25% Less  as per CGHS Guideline', percentage: 25 },
    { label: ' 50% Less Emergency Discount', percentage: 50 }
  ];





  // Function to save lab service to visit_labs table only (not to bill)
  const addLabServiceToInvoice = async (labService: any) => {
    console.log('🧪 Saving lab service to visit_labs table:', labService);

    // Save to visit_labs table if visitId is available
    if (visitId) {
      try {
        console.log('💾 Saving lab to visit_labs table:', { visitId, labService });

        // Get the actual visit UUID from the visits table
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (visitError || !visitData?.id) {
          console.warn('Could not save lab to visit_labs - visit not found:', visitError);
          toast.error('Could not save lab to visit record');
          return;
        }

        // Prepare lab data for visit_labs table (only required columns)
        const labToSave = {
          visit_id: visitData.id,
          lab_id: labService.id,
          status: 'ordered',
          ordered_date: new Date().toISOString()
        };

        console.log('💾 Lab data to save:', labToSave);

        // Insert into visit_labs table
        const { data, error: insertError } = await supabase
          .from('visit_labs' as any)
          .insert([labToSave])
          .select();

        if (insertError) {
          console.error('❌ Error saving lab to visit_labs:', insertError);
          toast.error('Failed to save lab to visit record');
        } else {
          console.log('✅ Lab saved to visit_labs successfully:', data);
          toast.success(`${labService.name} saved to visit`);

          // Refresh saved labs data
          console.log('🔄 Calling fetchSavedLabs to refresh data...');
          await fetchSavedLabs(visitId);
          console.log('🔄 fetchSavedLabs completed');
        }
      } catch (error) {
        console.error('❌ Error in lab save process:', error);
        toast.error('Failed to save lab to visit record');
      }
    } else {
      console.log('⚠️ No visitId available, cannot save lab');
      toast.error('No visit ID available - cannot save lab');
    }
  };

  // Function to save single radiology to visit_radiology table
  const saveSingleRadiologyToVisit = async (radiologyService: any) => {
    try {
      if (!visitId) {
        console.log('❌ No visit ID available for saving radiology');
        toast.error('No visit ID available - cannot save radiology');
        return;
      }

      console.log('💾 Saving radiology to visit_radiology table:', radiologyService);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('❌ Error fetching visit UUID for radiology:', visitError);
        toast.error('Error finding visit record');
        return;
      }

      if (!visitData?.id) {
        console.log('❌ Visit record not found for radiology save');
        toast.error('Visit record not found');
        return;
      }

      console.log('✅ Found visit UUID for radiology:', visitData.id, 'for visit_id:', visitId);

      // Prepare radiology data for visit_radiology table (only required columns)
      const radiologyToSave = {
        visit_id: visitData.id,
        radiology_id: radiologyService.id,
        status: 'ordered',
        ordered_date: new Date().toISOString()
      };

      console.log('📋 Radiology data to save:', radiologyToSave);

      // Save to visit_radiology table
      const { data, error } = await supabase
        .from('visit_radiology' as any)
        .insert([radiologyToSave])
        .select();

      if (error) {
        console.error('❌ Error saving radiology to visit_radiology:', error);
        if (error.code === '23505') {
          toast.error('This radiology test is already added to this visit');
        } else {
          toast.error('Error saving radiology to visit');
        }
      } else {
        console.log('✅ Radiology saved to visit_radiology successfully:', data);
        toast.success(`${radiologyService.name} saved to visit`);

        // Refresh saved radiology data
        console.log('🔄 Calling fetchSavedRadiology to refresh data...');
        await fetchSavedRadiology(visitId);
        console.log('🔄 fetchSavedRadiology completed');
      }
    } catch (error) {
      console.error('❌ Error in saveRadiologyToVisit:', error);
      toast.error('Error saving radiology to visit');
    }
  };

  // Function to fetch saved radiology from visit_radiology table
  const fetchSavedRadiology = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching radiology');
        return;
      }

      console.log('Fetching saved radiology for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for radiology:', visitError);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for radiology fetch');
        setSavedRadiologyData([]);
        return;
      }

      console.log('Found visit UUID for radiology:', visitData.id, 'for visit_id:', visitId);

      // Then get visit_radiology data using the UUID
      const { data: visitRadiologyData, error: visitRadiologyError } = await supabase
        .from('visit_radiology' as any)
        .select('*')
        .eq('visit_id', visitData.id);

      if (visitRadiologyError) {
        console.error('Error fetching visit_radiology:', visitRadiologyError);
        return;
      }

      console.log('Visit radiology raw data:', visitRadiologyData);

      if (!visitRadiologyData || visitRadiologyData.length === 0) {
        console.log('No saved radiology found for this visit');
        setSavedRadiologyData([]);
        return;
      }

      // Get radiology details for each radiology_id
      const radiologyIds = visitRadiologyData.map((item: any) => item.radiology_id);
      console.log('Radiology IDs to fetch:', radiologyIds);

      const { data: radiologyData, error: radiologyError } = await supabase
        .from('radiology')
        .select('id, name, description, category, cost')
        .in('id', radiologyIds);

      if (radiologyError) {
        console.error('Error fetching radiology details:', radiologyError);
        // Still show the data we have, even without names
        const formattedRadiology = visitRadiologyData.map((item: any) => ({
          ...item,
          radiology_name: `Radiology ID: ${item.radiology_id}`,
          description: 'Unknown',
          status: item.status || 'ordered',
          ordered_date: item.ordered_date
        }));
        setSavedRadiologyData(formattedRadiology);
        return;
      }

      console.log('Radiology details data:', radiologyData);

      // Combine the data
      const formattedRadiology = visitRadiologyData.map((visitRadiology: any) => {
        const radiologyDetail = radiologyData?.find((r: any) => r.id === visitRadiology.radiology_id);
        return {
          ...visitRadiology,
          radiology_name: radiologyDetail?.name || `Unknown Radiology (${visitRadiology.radiology_id})`,
          description: radiologyDetail?.description || 'No description available',
          category: radiologyDetail?.category || '',
          cost: radiologyDetail?.cost || 0,
          status: visitRadiology.status || 'ordered',
          ordered_date: visitRadiology.ordered_date
        };
      });

      console.log('Final formatted radiology:', formattedRadiology);
      setSavedRadiologyData(formattedRadiology);
      console.log('State updated - savedRadiologyData should now contain:', formattedRadiology.length, 'items');
    } catch (error) {
      console.error('Error in fetchSavedRadiology:', error);
    }
  };

  // Function to add radiology service to invoice
  const addRadiologyServiceToInvoice = (radiologyService: any) => {
    // Add radiology service as sub-item
    const newRadiologyItem: StandardSubItem = {
      id: `radiology-${radiologyService.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      srNo: '',
      description: radiologyService.name,
      code: radiologyService.code,
      rate: radiologyService.amount,
      qty: 1,
      amount: radiologyService.amount,
      type: 'standard'
    };

    setInvoiceItems(prev => {
      const updated = [...prev];

      // Find or create Radiology Services main item within the state update
      let radiologyMainIndex = updated.findIndex(item =>
        item.type === 'main' && item.description === 'Radiology Services'
      );

      if (radiologyMainIndex === -1) {
        // Create new Radiology Services main item
        const newRadiologyMain: MainItem = {
          id: `main-radiology-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'main',
          srNo: (updated.length + 1).toString(),
          description: 'Radiology Services',
          subItems: []
        };
        updated.push(newRadiologyMain);
        radiologyMainIndex = updated.length - 1;
      }

      // Update srNo for the radiology item
      newRadiologyItem.srNo = (updated.filter(item => item.type === 'main').length).toString();

      if (updated[radiologyMainIndex] && updated[radiologyMainIndex].type === 'main') {
        const mainItem = updated[radiologyMainIndex] as MainItem;
        mainItem.subItems.push(newRadiologyItem);
      }
      return updated;
    });

    toast.success(`${radiologyService.name} added to invoice`);
  };

  // Search queries for service selection based on search term and active tab
  const { data: searchedLabServices = [], isLoading: isSearchingLabServices } = useQuery({
    queryKey: ['lab-services-search', serviceSearchTerm],
    queryFn: async () => {
      console.log('🔍 Lab search triggered:', { serviceSearchTerm, activeServiceTab });
      if (!serviceSearchTerm || serviceSearchTerm.length < 2) return [];

      try {
        const { data, error } = await supabase
          .from('lab')
          .select(`id, name, "NABH_rates_in_rupee", "CGHS_code", description`)
          .or(`name.ilike.%${serviceSearchTerm}%,description.ilike.%${serviceSearchTerm}%`)
          .order('name')
          .limit(20);

        if (error) {
          console.error('❌ Error searching lab services:', error);
          // Return sample data if database query fails
          const sampleLabServices = [
            // { id: 'lab-1', name: 'Complete Blood Count (CBC)', amount: 250, code: 'LAB001', description: 'Full blood count with differential' },
            // { id: 'lab-2', name: 'Liver Function Test (LFT)', amount: 450, code: 'LAB002', description: 'Comprehensive liver function panel' },
            // { id: 'lab-3', name: 'Kidney Function Test (KFT)', amount: 350, code: 'LAB003', description: 'Renal function assessment' },
            // { id: 'lab-4', name: 'Lipid Profile', amount: 300, code: 'LAB004', description: 'Cholesterol and triglycerides panel' },
            // { id: 'lab-5', name: 'Thyroid Function Test (TFT)', amount: 500, code: 'LAB005', description: 'TSH, T3, T4 levels' },
            // { id: 'lab-6', name: 'Blood Sugar (Fasting)', amount: 80, code: 'LAB006', description: 'Fasting glucose level' },
            // { id: 'lab-7', name: 'Blood Sugar (Random)', amount: 80, code: 'LAB007', description: 'Random glucose level' },
            // { id: 'lab-8', name: 'HbA1c', amount: 400, code: 'LAB008', description: 'Glycated hemoglobin' },
            // { id: 'lab-9', name: 'Urine Routine', amount: 150, code: 'LAB009', description: 'Complete urine analysis' },
            // { id: 'lab-10', name: 'ESR', amount: 100, code: 'LAB010', description: 'Erythrocyte sedimentation rate' }
          ];

          return sampleLabServices.filter(lab =>
            lab.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
            lab.description.toLowerCase().includes(serviceSearchTerm.toLowerCase())
          );
        }

        console.log('✅ Lab search results:', data?.length || 0, 'records');

        // Map the field names to expected format
        const mappedData = data?.map(item => ({
          id: item.id,
          name: item.name,
          amount: item['NABH_rates_in_rupee'],
          code: item['CGHS_code'],
          description: item.description
        })) || [];

        return mappedData;
      } catch (error) {
        console.error('❌ Lab search error:', error);
        return [];
      }
    },
    enabled: serviceSearchTerm.length >= 2 && activeServiceTab === "Laboratory services",
  });

  const { data: searchedRadiologyServices = [], isLoading: isSearchingRadiologyServices } = useQuery({
    queryKey: ['radiology-services-search', serviceSearchTerm],
    queryFn: async () => {
      console.log('🔍 Radiology search query triggered:', { serviceSearchTerm, activeServiceTab });
      if (!serviceSearchTerm || serviceSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('radiology')
        .select('id, name, cost, category, description')
        .or(`name.ilike.%${serviceSearchTerm}%,description.ilike.%${serviceSearchTerm}%`)
        .order('name')
        .limit(20);

      if (error) {
        console.error('❌ Error searching radiology services:', error);
        return [];
      }

      console.log('✅ Radiology search results:', data?.length || 0, 'records found');
      console.log('📋 Sample radiology results:', data?.slice(0, 2));
      // Transform data to ensure cost field is available as amount for compatibility
      const transformedData = data?.map(item => ({
        ...item,
        amount: item.cost // Add amount field for backward compatibility
      })) || [];
      return transformedData;
    },
    enabled: serviceSearchTerm.length >= 2 && activeServiceTab === "Radiology",
  });

  // Use searched results when available, otherwise fall back to filtered pre-loaded data
  const filteredLabServices = serviceSearchTerm.length >= 2 ? searchedLabServices :
    availableLabServices.filter(service =>
      service.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.code?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );

  // Debug logging
  console.log('🔍 Lab Services Debug:', {
    serviceSearchTerm,
    activeServiceTab,
    searchTermLength: serviceSearchTerm.length,
    shouldUseSearch: serviceSearchTerm.length >= 2,
    searchedLabServices: searchedLabServices?.length || 0,
    availableLabServices: availableLabServices?.length || 0,
    filteredLabServices: filteredLabServices?.length || 0,
    isSearchingLabServices
  });

  const filteredRadiologyServices = serviceSearchTerm.length >= 2 ? searchedRadiologyServices :
    availableRadiologyServices.filter(service =>
      (service.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        service.code?.toLowerCase().includes(serviceSearchTerm.toLowerCase())) &&
      // Temporarily hide services that might have cross mark issues
      !service.name?.toLowerCase().includes('2d echocardiography') &&
      !service.name?.toLowerCase().includes('2d echo charges')
    );

  // Debug logging for radiology services
  console.log('🔍 Radiology Services Debug:', {
    serviceSearchTerm,
    activeServiceTab,
    searchTermLength: serviceSearchTerm.length,
    shouldUseSearch: serviceSearchTerm.length >= 2,
    searchedRadiologyServices: searchedRadiologyServices?.length || 0,
    availableRadiologyServices: availableRadiologyServices?.length || 0,
    filteredRadiologyServices: filteredRadiologyServices?.length || 0,
    isSearchingRadiologyServices,
    isLoadingRadiologyServices,
    searchedRadiologyServicesData: searchedRadiologyServices?.slice(0, 2),
    availableRadiologyServicesData: availableRadiologyServices?.slice(0, 2)
  });

  // Function to add pharmacy service to invoice
  const addPharmacyServiceToInvoice = (pharmacyService: any) => {
    // Add pharmacy service as sub-item
    const newPharmacyItem: StandardSubItem = {
      id: `pharmacy-${pharmacyService.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      srNo: '',
      description: pharmacyService.name,
      code: pharmacyService.code,
      rate: pharmacyService.amount,
      qty: 1,
      amount: pharmacyService.amount,
      type: 'standard'
    };

    setInvoiceItems(prev => {
      const updated = [...prev];

      // Find or create Pharmacy Services main item within the state update
      let pharmacyMainIndex = updated.findIndex(item =>
        item.type === 'main' && item.description === 'Pharmacy Services'
      );

      if (pharmacyMainIndex === -1) {
        // Create new Pharmacy Services main item
        const newPharmacyMain: MainItem = {
          id: `main-pharmacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'main',
          srNo: (updated.length + 1).toString(),
          description: 'Pharmacy Services',
          subItems: []
        };
        updated.push(newPharmacyMain);
        pharmacyMainIndex = updated.length - 1;
      }

      // Update srNo for the pharmacy item
      newPharmacyItem.srNo = (updated.filter(item => item.type === 'main').length).toString();

      if (updated[pharmacyMainIndex] && updated[pharmacyMainIndex].type === 'main') {
        const mainItem = updated[pharmacyMainIndex] as MainItem;
        mainItem.subItems.push(newPharmacyItem);
      }
      return updated;
    });

    toast.success(`${pharmacyService.name} added to invoice`);
  };

  const { data: searchedPharmacyServices = [], isLoading: isSearchingPharmacyServices } = useQuery({
    queryKey: ['pharmacy-services-search', serviceSearchTerm],
    queryFn: async () => {
      if (!serviceSearchTerm || serviceSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('medication')
        .select('id, name, price_per_strip, medicine_code, pack, barcode, stock, Exp_date, description')
        .or(`name.ilike.%${serviceSearchTerm}%,description.ilike.%${serviceSearchTerm}%`)
        .order('name')
        .limit(20);

      if (error) {
        console.error('Error searching pharmacy services:', error);
        return [];
      }

      // Transform data to ensure proper field mapping for compatibility
      const transformedData = data?.map(item => ({
        ...item,
        amount: item.price_per_strip, // Map price_per_strip to amount
        code: item.medicine_code, // Map medicine_code to code
        mrp: item.price_per_strip, // Map price_per_strip to mrp
        batch_no: item.barcode, // Map barcode to batch_no
        expiry_date: item.Exp_date // Map Exp_date to expiry_date
      })) || [];

      return transformedData;
    },
    enabled: serviceSearchTerm.length >= 2 && activeServiceTab === "Pharmacy",
  });

  const filteredPharmacyServices = serviceSearchTerm.length >= 2 ? searchedPharmacyServices :
    availablePharmacyServices.filter(service =>
      service.name?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.code?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );

  // Diagnosis search query
  const { data: availableDiagnoses = [] } = useQuery({
    queryKey: ['diagnoses', diagnosisSearchTerm],
    queryFn: async () => {
      if (!diagnosisSearchTerm || diagnosisSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .or(`name.ilike.%${diagnosisSearchTerm}%,description.ilike.%${diagnosisSearchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching diagnoses:', error);
        return [];
      }

      return data || [];
    },
    enabled: diagnosisSearchTerm.length >= 2
  });

  // CGHS Surgery search query
  const { data: availableSurgeries = [] } = useQuery({
    queryKey: ['cghs_surgery', surgerySearchTerm],
    queryFn: async () => {
      if (!surgerySearchTerm || surgerySearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('cghs_surgery')
        .select('id, name, code, category, NABH_NABL_Rate, description')
        .or(`name.ilike.%${surgerySearchTerm}%,code.ilike.%${surgerySearchTerm}%,category.ilike.%${surgerySearchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching surgeries:', error);
        return [];
      }

      return data || [];
    },
    enabled: surgerySearchTerm.length >= 2
  });

  // Complications search query
  const { data: complicationsData } = useQuery({
    queryKey: ['complications', complicationSearchTerm],
    queryFn: async () => {
      if (complicationSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('complications')
        .select('id, name')
        .ilike('name', `%${complicationSearchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching complications:', error);
        return [];
      }

      return data || [];
    },
    enabled: complicationSearchTerm.length >= 2,
  });

  const filteredComplications = complicationsData || [];

  // Labs search query
  const { data: labsData } = useQuery({
    queryKey: ['labs', labSearchTerm],
    queryFn: async () => {
      if (labSearchTerm.length < 2) return [];

      console.log('🔍 Searching labs with term:', labSearchTerm);

      const { data, error } = await supabase
        .from('lab')
        .select('id, name, description, "NABH_rates_in_rupee", "CGHS_code", category')
        .ilike('name', `%${labSearchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching labs:', error);
        // Return sample data if database query fails
        const sampleLabs = [
          // { id: 'sample-1', name: 'Complete Blood Count (CBC)', description: 'Full blood count with differential', 'NABH_rates_in_rupee': 250, 'CGHS_code': 'LAB001', category: 'Hematology' },
          // { id: 'sample-2', name: 'Liver Function Test (LFT)', description: 'Comprehensive liver function panel', 'NABH_rates_in_rupee': 450, 'CGHS_code': 'LAB002', category: 'Biochemistry' },
          // { id: 'sample-3', name: 'Kidney Function Test (KFT)', description: 'Renal function assessment', 'NABH_rates_in_rupee': 350, 'CGHS_code': 'LAB003', category: 'Biochemistry' },
          // { id: 'sample-4', name: 'Lipid Profile', description: 'Cholesterol and triglycerides panel', 'NABH_rates_in_rupee': 300, 'CGHS_code': 'LAB004', category: 'Biochemistry' },
          // { id: 'sample-5', name: 'Thyroid Function Test (TFT)', description: 'TSH, T3, T4 levels', 'NABH_rates_in_rupee': 500, 'CGHS_code': 'LAB005', category: 'Endocrinology' },
          // { id: 'sample-6', name: 'Blood Sugar (Fasting)', description: 'Fasting glucose level', 'NABH_rates_in_rupee': 80, 'CGHS_code': 'LAB006', category: 'Biochemistry' },
          // { id: 'sample-7', name: 'Blood Sugar (Random)', description: 'Random glucose level', 'NABH/NABL_rates_in_rupee': 80, 'CGHS_code': 'LAB007', category: 'Biochemistry' },
          // { id: 'sample-8', name: 'HbA1c', description: 'Glycated hemoglobin', 'NABH/NABL_rates_in_rupee': 400, 'CGHS_code': 'LAB008', category: 'Biochemistry' },
          // { id: 'sample-9', name: 'Urine Routine', description: 'Complete urine analysis', 'NABH/NABL_rates_in_rupee': 150, 'CGHS_code': 'LAB009', category: 'Pathology' },
          // { id: 'sample-10', name: 'ESR', description: 'Erythrocyte sedimentation rate', 'NABH/NABL_rates_in_rupee': 100, 'CGHS_code': 'LAB010', category: 'Hematology' }
        ];

        return sampleLabs.filter(lab =>
          lab.name.toLowerCase().includes(labSearchTerm.toLowerCase())
        );
      }

      console.log('✅ Labs data fetched:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: labSearchTerm.length >= 2,
  });

  const filteredLabs = labsData || [];

  // Radiology search query
  const { data: radiologyData } = useQuery({
    queryKey: ['radiology', radiologySearchTerm],
    queryFn: async () => {
      if (radiologySearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('radiology')
        .select('id, name, description')
        .ilike('name', `%${radiologySearchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching radiology:', error);
        return [];
      }

      return data || [];
    },
    enabled: radiologySearchTerm.length >= 2,
  });

  const filteredRadiology = radiologyData || [];

  // Medications search query
  const { data: medicationsData } = useQuery({
    queryKey: ['medications', medicationSearchTerm],
    queryFn: async () => {
      if (medicationSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('medication')
        .select('id, name, description')
        .ilike('name', `%${medicationSearchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching medications:', error);
        return [];
      }

      return data || [];
    },
    enabled: medicationSearchTerm.length >= 2,
  });

  const filteredMedications = medicationsData || [];

  // Function to fetch saved diagnoses from visit_diagnoses table
  const fetchSavedDiagnoses = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching diagnoses');
        setSavedDiagnoses([]);
        return;
      }

      console.log('Fetching saved diagnoses for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for diagnoses:', visitError);
        setSavedDiagnoses([]);
        return;
      }

      if (!visitData) {
        console.log('No visit found for visit_id:', visitId);
        setSavedDiagnoses([]);
        return;
      }

      console.log('Found visit UUID for diagnoses:', visitData.id, 'for visit_id:', visitId);

      // Then get visit_diagnoses data using the UUID with join to get diagnosis details
      const { data: visitDiagnosesData, error: visitDiagnosesError } = await supabase
        .from('visit_diagnoses' as any)
        .select(`
          *,
          diagnoses:diagnosis_id (
            id,
            name
          )
        `)
        .eq('visit_id', visitData.id);

      if (visitDiagnosesError) {
        console.error('Error fetching visit_diagnoses:', visitDiagnosesError);
        setSavedDiagnoses([]);
        return;
      }

      console.log('Visit diagnoses raw data:', visitDiagnosesData);

      if (!visitDiagnosesData || visitDiagnosesData.length === 0) {
        console.log('No saved diagnoses found for this visit');
        setSavedDiagnoses([]);
        return;
      }

      // Format the data
      const formattedDiagnoses = visitDiagnosesData.map((visitDiagnosis: any) => {
        const diagnosisDetail = visitDiagnosis.diagnoses;
        return {
          id: visitDiagnosis.diagnosis_id,
          name: diagnosisDetail?.name || `Unknown Diagnosis (${visitDiagnosis.diagnosis_id})`,
          is_primary: visitDiagnosis.is_primary || false
        };
      });

      console.log('Final formatted diagnoses:', formattedDiagnoses);
      setSavedDiagnoses(formattedDiagnoses);
      console.log('State updated - savedDiagnoses should now contain:', formattedDiagnoses.length, 'items');
    } catch (error) {
      console.error('Error in fetchSavedDiagnoses:', error);
      setSavedDiagnoses([]);
    }
  };

  // Function to save selected diagnoses to visit_diagnoses junction table
  const saveDiagnosesToVisit = async (visitId: string) => {
    try {
      console.log('Saving diagnoses to visit:', visitId, selectedDiagnoses);

      if (selectedDiagnoses.length === 0) {
        toast.error('No diagnoses selected to save');
        return;
      }

      if (!visitId) {
        toast.error('No visit ID provided. Cannot save diagnoses.');
        return;
      }

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for saving diagnoses:', visitError);
        toast.error('Failed to find visit. Cannot save diagnoses.');
        return;
      }

      if (!visitData) {
        console.log('No visit found for visit_id:', visitId);
        toast.error('Visit not found. Cannot save diagnoses.');
        return;
      }

      console.log('Found visit UUID for saving diagnoses:', visitData.id, 'for visit_id:', visitId);

      // Prepare data for insertion
      const diagnosesToSave = selectedDiagnoses.map((diagnosis, index) => ({
        visit_id: visitData.id,
        diagnosis_id: diagnosis.id,
        is_primary: index === 0, // First diagnosis is primary
        notes: null
      }));

      console.log('Diagnoses to save:', diagnosesToSave);

      // Insert directly using Supabase client
      try {
        // Don't delete existing diagnoses - just append new ones
        // Check for duplicates first
        const { data: existingDiagnoses, error: checkError } = await supabase
          .from('visit_diagnoses' as any)
          .select('diagnosis_id')
          .eq('visit_id', visitData.id);

        if (checkError) {
          console.error('Error checking existing diagnoses:', checkError);
        }

        // Filter out diagnoses that already exist
        const existingDiagnosisIds = existingDiagnoses?.map((d: any) => d.diagnosis_id) || [];
        const newDiagnosesToSave = diagnosesToSave.filter(diagnosis =>
          !existingDiagnosisIds.includes(diagnosis.diagnosis_id)
        );

        if (newDiagnosesToSave.length === 0) {
          toast.info('All selected diagnoses are already saved for this visit');
          setSelectedDiagnoses([]);
          return;
        }

        // Insert only new diagnoses
        const { data, error: insertError } = await supabase
          .from('visit_diagnoses' as any)
          .insert(newDiagnosesToSave)
          .select();

        if (insertError) {
          console.error('Error inserting diagnoses:', insertError);
          toast.error(`Failed to save diagnoses: ${insertError.message}`);
        } else {
          toast.success(`${newDiagnosesToSave.length} new diagnoses added to visit ${visitId} successfully!`);
          console.log('Saved diagnoses data:', data);

          console.log('About to clear selected diagnoses...');
          // Clear selected diagnoses after successful save
          setSelectedDiagnoses([]);

          console.log('About to fetch saved diagnoses...');
          console.log('fetchSavedDiagnoses function:', typeof fetchSavedDiagnoses);
          // Fetch updated saved diagnoses to refresh the display
          console.log('Fetching saved diagnoses after save with visit ID:', visitId);
          try {
            await fetchSavedDiagnoses(visitId);
            console.log('Fetch completed successfully');
          } catch (fetchError) {
            console.error('Error fetching saved diagnoses after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        toast.error('Failed to save diagnoses to database');
      }

    } catch (error) {
      console.error('Error in saveDiagnosesToVisit:', error);
      toast.error('Failed to save diagnoses');
    }
  };

  // Function to delete a specific diagnosis
  const deleteDiagnosis = async (diagnosisId: string, visitId: string) => {
    try {
      console.log('Deleting diagnosis:', diagnosisId, 'from visit:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        console.error('Error fetching visit UUID for deleting diagnosis:', visitError);
        toast.error('Failed to find visit. Cannot delete diagnosis.');
        return;
      }

      // Delete the specific diagnosis
      const { error: deleteError } = await supabase
        .from('visit_diagnoses' as any)
        .delete()
        .eq('visit_id', visitData.id)
        .eq('diagnosis_id', diagnosisId);

      if (deleteError) {
        console.error('Error deleting diagnosis:', deleteError);
        toast.error('Failed to delete diagnosis');
      } else {
        toast.success('Diagnosis deleted successfully');
        // Refresh the diagnoses list
        await fetchSavedDiagnoses(visitId);
      }
    } catch (error) {
      console.error('Error in deleteDiagnosis:', error);
      toast.error('Failed to delete diagnosis');
    }
  };

  // Function to toggle primary status of a diagnosis
  const togglePrimaryDiagnosis = async (diagnosisId: string, visitId: string, currentIsPrimary: boolean) => {
    try {
      console.log('Toggling primary status for diagnosis:', diagnosisId, 'current:', currentIsPrimary);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) {
        console.error('Error fetching visit UUID for updating diagnosis:', visitError);
        toast.error('Failed to find visit. Cannot update diagnosis.');
        return;
      }

      // If setting this as primary, first remove primary status from all other diagnoses
      if (!currentIsPrimary) {
        await supabase
          .from('visit_diagnoses' as any)
          .update({ is_primary: false })
          .eq('visit_id', visitData.id);
      }

      // Update the specific diagnosis
      const { error: updateError } = await supabase
        .from('visit_diagnoses' as any)
        .update({ is_primary: !currentIsPrimary })
        .eq('visit_id', visitData.id)
        .eq('diagnosis_id', diagnosisId);

      if (updateError) {
        console.error('Error updating diagnosis:', updateError);
        toast.error('Failed to update diagnosis');
      } else {
        toast.success(`Diagnosis ${!currentIsPrimary ? 'set as primary' : 'removed from primary'}`);
        // Refresh the diagnoses list
        await fetchSavedDiagnoses(visitId);
      }
    } catch (error) {
      console.error('Error in togglePrimaryDiagnosis:', error);
      toast.error('Failed to update diagnosis');
    }
  };

  // Function to fetch saved surgeries from visit_surgeries table
  const fetchSavedSurgeriesFromVisit = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching surgeries');
        setSavedSurgeries([]);
        return;
      }

      console.log('Fetching saved surgeries for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for surgeries:', visitError);
        setSavedSurgeries([]);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for surgery fetch');
        setSavedSurgeries([]);
        return;
      }

      // Get visit_surgeries data with join to get surgery details
      const { data: visitSurgeriesData, error: visitSurgeriesError } = await supabase
        .from('visit_surgeries' as any)
        .select(`
          *,
          cghs_surgery:surgery_id (
            id,
            name,
            code,
            NABH_NABL_Rate
          )
        `)
        .eq('visit_id', visitData.id);

      if (visitSurgeriesError) {
        console.error('Error fetching visit_surgeries:', visitSurgeriesError);
        setSavedSurgeries([]);
        return;
      }

      console.log('Visit surgeries raw data:', visitSurgeriesData);

      if (!visitSurgeriesData || visitSurgeriesData.length === 0) {
        console.log('No saved surgeries found for this visit');
        setSavedSurgeries([]);
        return;
      }

      // Format the data
      const formattedSurgeries = visitSurgeriesData.map((visitSurgery: any) => {
        const surgeryDetail = visitSurgery.cghs_surgery;
        return {
          id: visitSurgery.surgery_id,
          name: surgeryDetail?.name || `Unknown Surgery (${visitSurgery.surgery_id})`,
          code: surgeryDetail?.code || 'Unknown',
          nabh_nabl_rate: surgeryDetail?.NABH_NABL_Rate || 'N/A',
          is_primary: visitSurgery.is_primary || false,
          status: visitSurgery.status || 'planned',
          sanction_status: visitSurgery.sanction_status || 'Not Sanctioned',
          notes: visitSurgery.notes || ''
        };
      });

      console.log('Final formatted surgeries:', formattedSurgeries);
      setSavedSurgeries(formattedSurgeries);
      console.log('State updated - savedSurgeries should now contain:', formattedSurgeries.length, 'items');
      console.log('Current savedSurgeries state after setSavedSurgeries:', formattedSurgeries);

      // Surgery Treatment section removed
    } catch (error) {
      console.error('Error in fetchSavedSurgeries:', error);
      setSavedSurgeries([]);
    }
  };

  // Function to fetch saved complications from visit_complications table
  const fetchSavedComplications = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching complications');
        setSavedComplications([]);
        return;
      }

      console.log('Fetching saved complications for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for complications:', visitError);
        setSavedComplications([]);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for complications fetch');
        setSavedComplications([]);
        return;
      }

      console.log('Found visit UUID for complications:', visitData.id, 'for visit_id:', visitId);

      // Then get visit_complications data using the UUID with join to get complication details
      const { data: visitComplicationsData, error: visitComplicationsError } = await supabase
        .from('visit_complications' as any)
        .select(`
          *,
          complications:complication_id (
            id,
            name
          )
        `)
        .eq('visit_id', visitData.id);

      if (visitComplicationsError) {
        console.error('Error fetching visit_complications:', visitComplicationsError);
        setSavedComplications([]);
        return;
      }

      console.log('Visit complications raw data:', visitComplicationsData);

      if (!visitComplicationsData || visitComplicationsData.length === 0) {
        console.log('No saved complications found for this visit');
        setSavedComplications([]);
        return;
      }

      // Format the data
      const formattedComplications = visitComplicationsData.map((visitComplication: any) => {
        const complicationDetail = visitComplication.complications;
        return {
          id: visitComplication.complication_id,
          name: complicationDetail?.name || `Unknown Complication (${visitComplication.complication_id})`,
          is_primary: visitComplication.is_primary || false
        };
      });

      console.log('Final formatted complications:', formattedComplications);
      setSavedComplications(formattedComplications);
      console.log('State updated - savedComplications should now contain:', formattedComplications.length, 'items');
    } catch (error) {
      console.error('Error in fetchSavedComplications:', error);
      setSavedComplications([]);
    }
  };

  // Function to fetch saved labs from visit_labs table
  const fetchSavedLabs = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching labs');
        return;
      }

      console.log('Fetching saved labs for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for labs:', visitError);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for labs fetch');
        setSavedLabData([]);
        return;
      }

      console.log('Found visit UUID for labs:', visitData.id, 'for visit_id:', visitId);

      // Then get visit_labs data using the UUID
      const { data: visitLabsData, error: visitLabsError } = await supabase
        .from('visit_labs' as any)
        .select('*')
        .eq('visit_id', visitData.id);

      if (visitLabsError) {
        console.error('Error fetching visit_labs:', visitLabsError);
        return;
      }

      console.log('Visit labs raw data:', visitLabsData);

      if (!visitLabsData || visitLabsData.length === 0) {
        console.log('No saved labs found for this visit');
        setSavedLabData([]);
        return;
      }

      // Get lab details for each lab_id
      const labIds = visitLabsData.map((item: any) => item.lab_id);
      console.log('Lab IDs to fetch:', labIds);

      const { data: labsData, error: labsError } = await supabase
        .from('lab')
        .select('id, name, description, category, "NABH_rates_in_rupee", "CGHS_code"')
        .in('id', labIds);

      if (labsError) {
        console.error('Error fetching labs details:', labsError);
        // Still show the data we have, even without names
        const formattedLabs = visitLabsData.map((item: any) => ({
          ...item,
          lab_name: `Lab ID: ${item.lab_id}`,
          description: 'Unknown',
          status: item.status || 'ordered',
          ordered_date: item.ordered_date
        }));
        setSavedLabData(formattedLabs);
        return;
      }

      console.log('Labs details data:', labsData);

      // Combine the data
      const formattedLabs = visitLabsData.map((visitLab: any) => {
        const labDetail = labsData?.find((l: any) => l.id === visitLab.lab_id);
        return {
          ...visitLab,
          lab_name: labDetail?.name || `Unknown Lab (${visitLab.lab_id})`,
          description: labDetail?.description || 'No description available',
          category: labDetail?.category || '',
          cost: labDetail?.['NABH_rates_in_rupee'] || 0,
          cghs_code: labDetail?.['CGHS_code'] || '',
          status: visitLab.status || 'ordered',
          ordered_date: visitLab.ordered_date
        };
      });

      console.log('Final formatted labs:', formattedLabs);
      setSavedLabData(formattedLabs);
      console.log('State updated - savedLabData should now contain:', formattedLabs.length, 'items');
    } catch (error) {
      console.error('Error in fetchSavedLabs:', error);
    }
  };

  // Function to edit a surgery
  const editSurgery = (surgery: any) => {
    // For now, just show an alert with surgery details
    // You can implement a proper edit modal later
    alert(`Edit Surgery: ${surgery.name}\nCode: ${surgery.code}\nStatus: ${surgery.sanction_status}`);
    // TODO: Implement edit functionality with modal
  };

  // Function to delete a surgery
  const deleteSurgery = async (surgeryId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this surgery?')) {
        return;
      }

      console.log('Deleting surgery with ID:', surgeryId);

      // Find the surgery record in visit_surgeries table
      const { error: deleteError } = await supabase
        .from('visit_surgeries' as any)
        .delete()
        .eq('surgery_id', surgeryId)
        .eq('visit_id', visitData?.id);

      if (deleteError) {
        console.error('Error deleting surgery:', deleteError);
        toast.error('Failed to delete surgery');
        return;
      }

      toast.success('Surgery deleted successfully');

      // Refresh the saved surgeries list
      if (visitId) {
        await fetchSavedSurgeriesFromVisit(visitId);
      }
    } catch (error) {
      console.error('Error in deleteSurgery:', error);
      toast.error('Failed to delete surgery');
    }
  };

  // Function to generate clinical recommendations using OpenAI
  const generateClinicalRecommendations = async (surgeryName: string, diagnosisName: string = '') => {
    try {
      const prompt = `For a patient undergoing ${surgeryName}${diagnosisName ? ` with diagnosis of ${diagnosisName}` : ''}, provide clinical recommendations based on CGHS surgical procedures and complications knowledge:

Generate exactly:
- 4 Complications (expensive, high-level complications)
- 2 Lab Tests (expensive, high-level lab tests)
- 2 Radiology Procedures (expensive, high-level radiology procedures)
- 4 Medications (expensive, high-level medications)

Based on the CGHS knowledge provided, focus on expensive and high-level clinical inputs. Do not mention values/costs.

Format the response as JSON:
{
  "complications": ["complication1", "complication2", "complication3", "complication4"],
  "labs": ["lab1", "lab2"],
  "radiology": ["radiology1", "radiology2"],
  "medications": ["medication1", "medication2", "medication3", "medication4"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-ud4gdaQUskHyAt2lSGbuFegjXAEEYBj1VSKgFg2Y2KT3BlbkFJGNve4BG40woRq7wP7bvAaWsw9Mmt6qqCW6oHuEkA8A'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a medical expert with comprehensive knowledge of CGHS surgical procedures and complications. You must search and select from the following CGHS knowledge base to provide accurate clinical recommendations.

                    # CGHS SURGICAL PROCEDURES - COMPREHENSIVE MAPPING

                    ## 1. HERNIA SURGERIES

                    **A. Inguinal Herniorrhaphy**
                    Complications: Mesh Infection with Sepsis, Strangulated Hernia with Bowel Resection, Complete Wound Dehiscence, Recurrent Hernia Requiring Revision
                    Lab Tests: Procalcitonin & Blood Culture & Sensitivity, Arterial Blood Gas & Serum Lactate, Wound Swab Culture & Albumin & Total Protein, Collagen Disorder Panel & Genetic Testing
                    Radiology: Contrast CT Abdomen & Pelvis, Dynamic MRI Abdomen, Wound Ultrasound with Doppler, CT with 3D Reconstruction
                    Medications: Meropenem & Tigecycline, Piperacillin-Tazobactam & Metronidazole, Collagenase & Human Albumin, Polypropylene Mesh & Fibrin Glue

                    **B. Femoral Hernia Repair**
                    Complications: Strangulated Hernia with Bowel Resection, Deep Vein Thrombosis, MRSA Infection, Complete Wound Dehiscence
                    Lab Tests: D-Dimer & Comprehensive Metabolic Panel, MRSA PCR Testing & Vancomycin Trough Levels, Thrombophilia Profile & Protein C & S, Tissue Culture & Vitamin Panel
                    Radiology: CT Angiography Abdomen, Venous Doppler Bilateral, Tagged WBC Scan, MRI Soft Tissue
                    Medications: Octreotide & Parenteral Nutrition Solution, Enoxaparin & Rivaroxaban, Vancomycin & Linezolid, Recombinant Growth Factor & Human Albumin

                    **C. Inguinal Herniotomy**
                    Complications: Wound Infection, Testicular Atrophy, Recurrent Hernia, Nerve Injury
                    Lab Tests: CBC with Differential, Wound Culture & Sensitivity, Testosterone Levels, Inflammatory Markers Panel
                    Radiology: Ultrasound Inguinal Region, Scrotal Ultrasound with Doppler, MRI Pelvis
                    Medications: Cefazolin & Clindamycin, Testosterone Cypionate & Human Chorionic Gonadotropin, Polypropylene Mesh & Cyanoacrylate Glue, Bupivacaine & Lidocaine

                    ## 2. UROLOGICAL PROCEDURES

                    **A. PCNL (Percutaneous Nephrolithotomy)**
                    Complications: Massive Hemorrhage, Pleural Injury/Hydrothorax, Renal Artery Pseudoaneurysm, Urosepsis with Multi-organ Failure, Colonic Perforation
                    Lab Tests: Coagulation Profile & Thromboelastography, Pleural Fluid Analysis & ABG, Blood Culture Multiple Sets & Procalcitonin, Renal Function Tests
                    Radiology: CT Angiography Renal, HRCT Chest, Selective Renal Angiography, CT Abdomen Emergency
                    Medications: Tranexamic Acid & Recombinant Factor VIIa, Talc & Doxycycline, Covered Stent Graft & Platinum Coils, Meropenem & Norepinephrine

                    **B. URSL (Ureteroscopic Lithotripsy)**
                    Complications: Ureteral Perforation, Steinstrasse, Urosepsis, Ureteral Stricture
                    Lab Tests: Urine Culture & Sensitivity, Renal Function Tests, CBC & Procalcitonin, Serum Electrolytes
                    Radiology: CT KUB Non-contrast, Retrograde Pyelogram, MAG3 Renal Scan, CT Urography
                    Medications: Double-J Stent & Tamsulosin, Ciprofloxacin & Diclofenac, Tramadol & Hyoscine Butylbromide, Balloon Catheter & Mitomycin C

                    **C. Hydrocele Operation**
                    Complications: Scrotal Hematoma, Wound Infection, Recurrent Hydrocele, Testicular Atrophy
                    Lab Tests: CBC & Coagulation Studies, Wound Culture, Testosterone Levels, Inflammatory Markers
                    Radiology: Scrotal Ultrasound with Doppler, MRI Scrotum
                    Medications: Tranexamic Acid & Gelfoam, Cefuroxime & Povidone Iodine, Sodium Tetradecyl Sulfate & Ethanol, Testosterone Enanthate & Clomiphene Citrate

                    ## 3. VASCULAR PROCEDURES

                    **A. Laser Ablation of Varicose Veins**
                    Complications: Deep Vein Thrombosis, Pulmonary Embolism, Skin Burns, Nerve Injury
                    Lab Tests: D-Dimer & Thrombophilia Profile, Troponin I & Pro-BNP, Coagulation Studies, CBC
                    Radiology: Venous Doppler Bilateral, CT Venography, CT Pulmonary Angiography
                    Medications: Enoxaparin & Alteplase, Compression Stockings & IVC Filter Device, Silver Sulfadiazine & Mupirocin, Bupivacaine & Gabapentin

                    **B. Cardiac Catheterisation**
                    Complications: Vascular Access Complications, Coronary Artery Dissection, Contrast Nephropathy, Arrhythmias
                    Lab Tests: Troponin I & CK-MB, Renal Function Tests Serial, Coagulation Profile, CBC & Electrolytes
                    Radiology: Vascular Ultrasound at Access Site, CT Angiography, Echocardiography, Chest X-ray
                    Medications: Collagen Plug & Compression Device, Drug-Eluting Stent & Clopidogrel, N-Acetylcysteine & Normal Saline, Amiodarone & Temporary Pacemaker

                    ## 4. PLASTIC/RECONSTRUCTIVE SURGERY

                    **A. Flap Reconstructive Surgery**
                    Complications: Total Flap Necrosis, Partial Flap Loss, Infection, Hematoma/Seroma
                    Lab Tests: Tissue Oxygen Saturation, Angiogenic Markers, Blood Culture & Wound Culture, Nutritional Assessment Panel
                    Radiology: CT Angiography, Indocyanine Green Angiography, MR Angiography, Laser Doppler Flowmetry
                    Medications: Hyperbaric Oxygen & Platelet-Derived Growth Factor, Heparin & Collagenase, Vancomycin & Fluconazole, Jackson-Pratt Drain & Compression Garment

                    **B. Skin Grafting**
                    Complications: Graft Failure, Infection, Contracture, Donor Site Complications
                    Lab Tests: Wound Culture & Sensitivity, CBC & Albumin, Inflammatory Markers, Nutritional Panel
                    Radiology: Wound Ultrasound, MRI Soft Tissue, Thermography
                    Medications: Fibrin Glue & Hydrocolloid Dressing, Cefazolin & Chlorhexidine, Triamcinolone & Silicone Gel, Calcium Alginate & Morphine

                    ## 5. ORTHOPEDIC PROCEDURES

                    **A. ORIF (Open Reduction Internal Fixation)**
                    Complications: Implant Failure/Breakage, Fat Embolism Syndrome, Deep Infection/Osteomyelitis, Non-union/Malunion
                    Lab Tests: Metal Ion Levels, ABG for Fat Embolism, ESR & CRP & Procalcitonin, Bone Turnover Markers
                    Radiology: CT with Metal Artifact Reduction, HRCT Chest, SPECT-CT, MRI with Metal Suppression
                    Medications: Titanium Implant & Bone Morphogenetic Protein, Oxygen Therapy & Methylprednisolone, Vancomycin & Collagenase, Autologous Bone Graft & Recombinant Growth Factor

                    **B. Tendon Repair**
                    Complications: Tendon Re-rupture, Adhesions, Infection, Nerve Injury
                    Lab Tests: CBC & ESR & CRP, Wound Culture, Rheumatological Panel
                    Radiology: MRI of Affected Area, Ultrasound with Dynamic Assessment, CT for bone involvement
                    Medications: Polydioxanone Suture & Fibrin Glue, Hyaluronic Acid & Range of Motion Exercises, Cefazolin & Povidone Iodine, Nerve Conduit & Pregabalin

                    ## 6. GENERAL SURGERY

                    **A. Exploratory Laparotomy**
                    Complications: Anastomotic Leak, Wound Dehiscence, Intra-abdominal Abscess, Ileus/Bowel Obstruction
                    Lab Tests: Drain Fluid Amylase, CRP Daily & Procalcitonin, Blood Culture, Comprehensive Metabolic Panel
                    Radiology: CT Abdomen with Oral Contrast, Gastrografin Study, MRI Abdomen, Fluoroscopy
                    Medications: Piperacillin-Tazobactam & Total Parenteral Nutrition, Vacuum-Assisted Closure & Surgical Mesh, Percutaneous Drain & Fluconazole, Metoclopramide & Nasogastric Decompression

                    **B. Hepatic Abscess (Pigtail Insertion)**
                    Complications: Catheter Dislodgement, Bleeding, Biliary Injury, Sepsis
                    Lab Tests: Abscess Fluid Culture & Sensitivity, LFT & Coagulation Profile, Blood Culture & Procalcitonin, Amoebic Serology
                    Radiology: CT Abdomen Triple Phase, Ultrasound Guided, MRCP, Chest X-ray
                    Medications: Pigtail Catheter & Catheter Lock Solution, Tranexamic Acid & Fresh Frozen Plasma, Biliary Stent & ERCP Contrast, Meropenem & Metronidazole

                    ## 7. COLORECTAL PROCEDURES

                    **A. Laser Haemorrhoidectomy**
                    Complications: Massive Bleeding, Anal Stenosis, Incontinence, Abscess Formation
                    Lab Tests: CBC Serial, Coagulation Profile, Type & Cross Match, Inflammatory Markers
                    Radiology: Anoscopy/Sigmoidoscopy, MRI Pelvis, Endoanal Ultrasound
                    Medications: Tranexamic Acid & Packed Red Blood Cells, Anal Dilator & Lactulose, Sphincter Repair Kit & Biofeedback Device, Ciprofloxacin & Drainage Tube

                    **B. Fistula Procedures (SLOFT)**
                    Complications: Recurrent Fistula, Incontinence, Abscess Formation, Bleeding
                    Lab Tests: Pus Culture & Sensitivity, CBC & ESR & CRP, TB Workup
                    Radiology: MRI Fistulogram, Endoanal Ultrasound, CT Pelvis, Examination Under Anesthesia
                    Medications: Fistula Plug & Seton Suture, Sphincter Repair Material & Biofeedback System, Rifampin & Isoniazid, Gelfoam & Calcium Alginate

                    You must select complications, lab tests, radiology procedures, and medications ONLY from this comprehensive CGHS knowledge base. Focus on expensive, high-level clinical inputs appropriate for complex surgical cases.

                    note: don't forget to write abnormal investigations in the discharge summery`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const recommendations = JSON.parse(content);
      return recommendations;
    } catch (error) {
      console.error('Error generating clinical recommendations:', error);
      // Fallback recommendations
      return {
        complications: [
          "Post-operative infection with sepsis",
          "Wound dehiscence requiring revision",
          "Deep vein thrombosis",
          "Respiratory complications"
        ],
        labs: [
          "Procalcitonin levels",
          "Blood culture & sensitivity"
        ],
        radiology: [
          "CT scan with contrast",
          "Doppler ultrasound"
        ],
        medications: [
          "Meropenem",
          "Vancomycin",
          "Enoxaparin",
          "Albumin infusion"
        ]
      };
    }
  };

  // Function to handle AI complication selection
  const handleAIComplicationToggle = async (complication: string) => {
    const newSelectedComplications = selectedAIComplications.includes(complication)
      ? selectedAIComplications.filter(c => c !== complication)
      : [...selectedAIComplications, complication];

    setSelectedAIComplications(newSelectedComplications);
    setPersistentSelectedComplications(newSelectedComplications);

    // Save to database immediately for persistence
    if (visitId) {
      await saveSelectedComplicationsToDB(visitId, newSelectedComplications);
    }

    // Also update the Doctor's Plan ESIC section with selected complications
    updateDoctorsPlanComplications(newSelectedComplications);
  };

  // Function to update Doctor's Plan with selected complications
  const updateDoctorsPlanComplications = (complications: string[]) => {
    // This function will be used to display complications in Doctor's Plan ESIC section
    // The complications will be displayed in the ESIC section automatically via state
    console.log('Updating Doctor\'s Plan with complications:', complications);
  };

  // Function to update Doctor's Plan with selected labs
  const updateDoctorsPlanLabs = (labs: string[]) => {
    // This function will be used to display labs in Doctor's Plan ESIC section
    // The labs will be displayed in the ESIC section automatically via state
    console.log('Updating Doctor\'s Plan with labs:', labs);
  };

  // Function to update Doctor's Plan with selected radiology
  const updateDoctorsPlanRadiology = (radiology: string[]) => {
    // This function will be used to display radiology in Doctor's Plan ESIC section
    // The radiology will be displayed in the ESIC section automatically via state
    console.log('Updating Doctor\'s Plan with radiology:', radiology);
  };

  // Function to update Doctor's Plan with selected medications
  const updateDoctorsPlanMedications = (medications: string[]) => {
    // This function will be used to display medications in Doctor's Plan ESIC section
    // The medications will be displayed in the ESIC section automatically via state
    console.log('Updating Doctor\'s Plan with medications:', medications);
  };

  // Function to save selected complications to database for persistence
  const saveSelectedComplicationsToDB = async (visitId: string, complications: string[]) => {
    try {
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.warn('Could not save selected complications - visit not found');
        return;
      }

      // Get current notes to preserve medications data
      const { data: currentRecommendation } = await supabase
        .from('ai_clinical_recommendations' as any)
        .select('notes')
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let updatedNotes = `Selected complications: ${complications.join(', ')}`;

      // Preserve existing medications data
      if (currentRecommendation && (currentRecommendation as any).notes) {
        const existingNotes = (currentRecommendation as any).notes;
        if (existingNotes.includes('Selected medications:')) {
          const medicationsMatch = existingNotes.match(/Selected medications: ([^|]*)/);
          if (medicationsMatch) {
            updatedNotes = `${updatedNotes} | Selected medications: ${medicationsMatch[1]}`;
          }
        }
      }

      // Update or create AI recommendation with selected complications
      const { error: updateError } = await supabase
        .from('ai_clinical_recommendations' as any)
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.warn('Could not save selected complications to database:', updateError);
      }
    } catch (error) {
      console.warn('Error saving selected complications:', error);
    }
  };

  // Function to load selected complications from database
  const loadSelectedComplicationsFromDB = async (visitId: string) => {
    try {
      console.log('Loading selected complications from DB for visit:', visitId);

      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.log('No visit data found for loading complications:', visitError);
        return;
      }

      console.log('Found visit UUID for loading complications:', visitData.id);

      const { data: recommendation, error: fetchError } = await supabase
        .from('ai_clinical_recommendations' as any)
        .select('notes')
        .eq('visit_id', visitData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('AI recommendation data for complications:', recommendation, 'Error:', fetchError);

      if (!fetchError && recommendation) {
        const notesText = (recommendation as any).notes;
        console.log('Notes text for parsing complications:', notesText);

        // Parse complications
        if (notesText && notesText.includes('Selected complications:')) {
          const complicationsMatch = notesText.match(/Selected complications: ([^|]*)/);
          if (complicationsMatch) {
            const complications = complicationsMatch[1].split(', ').filter((c: string) => c.trim());
            console.log('Parsed complications from DB:', complications);
            setSelectedAIComplications(complications);
            setPersistentSelectedComplications(complications);
          }
        } else {
          console.log('No selected complications found in notes');
        }

        // Parse medications
        if (notesText && notesText.includes('Selected medications:')) {
          const medicationsMatch = notesText.match(/Selected medications: ([^|]*)/);
          if (medicationsMatch) {
            const medications = medicationsMatch[1].split(', ').filter((m: string) => m.trim());
            setSelectedAIMedications(medications);
            setPersistentSelectedMedications(medications);
          }
        }

        // Parse labs
        if (notesText && notesText.includes('Selected labs:')) {
          const labsMatch = notesText.match(/Selected labs: ([^|]*)/);
          if (labsMatch) {
            const labs = labsMatch[1].split(', ').filter((l: string) => l.trim());
            setSelectedAILabs(labs);
            setPersistentSelectedLabs(labs);
          }
        }

        // Parse radiology
        if (notesText && notesText.includes('Selected radiology:')) {
          const radiologyMatch = notesText.match(/Selected radiology: ([^|]*)/);
          if (radiologyMatch) {
            const radiology = radiologyMatch[1].split(', ').filter((r: string) => r.trim());
            setSelectedAIRadiology(radiology);
            setPersistentSelectedRadiology(radiology);
          }
        }
      }
    } catch (error) {
      console.warn('Error loading selected complications:', error);
    }
  };

  // Function to handle AI medication selection
  const handleAIMedicationToggle = async (medication: string) => {
    const newSelectedMedications = selectedAIMedications.includes(medication)
      ? selectedAIMedications.filter(m => m !== medication)
      : [...selectedAIMedications, medication];

    setSelectedAIMedications(newSelectedMedications);
    setPersistentSelectedMedications(newSelectedMedications);

    // Save to database immediately for persistence
    if (visitId) {
      await saveSelectedMedicationsToDB(visitId, newSelectedMedications);
    }

    // Also update the Doctor's Plan ESIC section with selected medications
    updateDoctorsPlanMedications(newSelectedMedications);
  };

  // Function to save selected medications to database for persistence
  const saveSelectedMedicationsToDB = async (visitId: string, medications: string[]) => {
    try {
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.warn('Could not save selected medications - visit not found');
        return;
      }

      await updateAIRecommendationNotes(visitData.id, 'medications', medications);
    } catch (error) {
      console.warn('Error saving selected medications:', error);
    }
  };

  // Function to handle AI lab selection
  const handleAILabToggle = async (lab: string) => {
    const newSelectedLabs = selectedAILabs.includes(lab)
      ? selectedAILabs.filter(l => l !== lab)
      : [...selectedAILabs, lab];

    setSelectedAILabs(newSelectedLabs);
    setPersistentSelectedLabs(newSelectedLabs);

    // Save to database immediately for persistence
    if (visitId) {
      await saveSelectedLabsToDB(visitId, newSelectedLabs);
    }

    // Also update the Doctor's Plan ESIC section with selected labs
    updateDoctorsPlanLabs(newSelectedLabs);
  };

  // Function to save selected labs to database for persistence
  const saveSelectedLabsToDB = async (visitId: string, labs: string[]) => {
    try {
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.warn('Could not save selected labs - visit not found');
        return;
      }

      await updateAIRecommendationNotes(visitData.id, 'labs', labs);
    } catch (error) {
      console.warn('Error saving selected labs:', error);
    }
  };

  // Function to handle AI radiology selection
  const handleAIRadiologyToggle = async (radiology: string) => {
    const newSelectedRadiology = selectedAIRadiology.includes(radiology)
      ? selectedAIRadiology.filter(r => r !== radiology)
      : [...selectedAIRadiology, radiology];

    setSelectedAIRadiology(newSelectedRadiology);
    setPersistentSelectedRadiology(newSelectedRadiology);

    // Save to database immediately for persistence
    if (visitId) {
      await saveSelectedRadiologyToDB(visitId, newSelectedRadiology);
    }

    // Also update the Doctor's Plan ESIC section with selected radiology
    updateDoctorsPlanRadiology(newSelectedRadiology);
  };

  // Function to save selected radiology to database for persistence
  const saveSelectedRadiologyToDB = async (visitId: string, radiology: string[]) => {
    try {
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.warn('Could not save selected radiology - visit not found');
        return;
      }

      await updateAIRecommendationNotes(visitData.id, 'radiology', radiology);
    } catch (error) {
      console.warn('Error saving selected radiology:', error);
    }
  };

  // Unified function to update AI recommendation notes with all selected items
  const updateAIRecommendationNotes = async (visitUUID: string, type: string, items: string[]) => {
    try {
      // Get current notes to preserve all existing data
      const { data: currentRecommendation } = await supabase
        .from('ai_clinical_recommendations' as any)
        .select('notes')
        .eq('visit_id', visitUUID)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const notesObject: any = {};

      // Parse existing notes
      if (currentRecommendation && (currentRecommendation as any).notes) {
        const existingNotes = (currentRecommendation as any).notes;

        // Parse complications
        const complicationsMatch = existingNotes.match(/Selected complications: ([^|]*)/);
        if (complicationsMatch) {
          notesObject.complications = complicationsMatch[1].trim();
        }

        // Parse medications
        const medicationsMatch = existingNotes.match(/Selected medications: ([^|]*)/);
        if (medicationsMatch) {
          notesObject.medications = medicationsMatch[1].trim();
        }

        // Parse labs
        const labsMatch = existingNotes.match(/Selected labs: ([^|]*)/);
        if (labsMatch) {
          notesObject.labs = labsMatch[1].trim();
        }

        // Parse radiology
        const radiologyMatch = existingNotes.match(/Selected radiology: ([^|]*)/);
        if (radiologyMatch) {
          notesObject.radiology = radiologyMatch[1].trim();
        }
      }

      // Update the specific type
      notesObject[type] = items.join(', ');

      // Build the updated notes string
      const notesParts = [];
      if (notesObject.complications) notesParts.push(`Selected complications: ${notesObject.complications}`);
      if (notesObject.medications) notesParts.push(`Selected medications: ${notesObject.medications}`);
      if (notesObject.labs) notesParts.push(`Selected labs: ${notesObject.labs}`);
      if (notesObject.radiology) notesParts.push(`Selected radiology: ${notesObject.radiology}`);

      const updatedNotes = notesParts.join(' | ');

      // Update the recommendation
      const { error: updateError } = await supabase
        .from('ai_clinical_recommendations' as any)
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('visit_id', visitUUID)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.warn(`Could not save selected ${type} to database:`, updateError);
      }
    } catch (error) {
      console.warn(`Error updating AI recommendation notes for ${type}:`, error);
    }
  };

  // Copy functions for AI generated items
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };



  const copySelectedComplications = () => {
    const text = selectedAIComplications.join('\n');
    copyToClipboard(text, 'Selected complications');
  };

  const copySelectedLabs = () => {
    const text = selectedAILabs.join('\n');
    copyToClipboard(text, 'Selected labs');
  };

  const copySelectedRadiology = () => {
    const text = selectedAIRadiology.join('\n');
    copyToClipboard(text, 'Selected radiology');
  };

  const copySelectedMedications = () => {
    const text = selectedAIMedications.join('\n');
    copyToClipboard(text, 'Selected medications');
  };

  // Function to save selected AI complications as additional diagnoses
  const saveSelectedComplicationsAsAdditionalDiagnoses = async (visitId: string) => {
    try {
      if (selectedAIComplications.length === 0) {
        toast.error('No complications selected to save');
        return;
      }

      console.log('Saving selected AI complications as additional diagnoses:', selectedAIComplications);

      // Add selected complications to the diagnosis text area
      const currentDiagnosis = patientData.diagnosis || '';
      const additionalDiagnoses = selectedAIComplications.join(', ');

      // Check if additional diagnoses section already exists
      const hasAdditionalDiagnoses = currentDiagnosis.includes('Additional Diagnoses:');

      let updatedDiagnosis;
      if (hasAdditionalDiagnoses) {
        // If section exists, append to it
        const lines = currentDiagnosis.split('\n');
        const additionalIndex = lines.findIndex(line => line.includes('Additional Diagnoses:'));
        if (additionalIndex !== -1 && additionalIndex + 1 < lines.length) {
          // Add to existing additional diagnoses
          lines[additionalIndex + 1] = lines[additionalIndex + 1] + ', ' + additionalDiagnoses;
          updatedDiagnosis = lines.join('\n');
        } else {
          // Add new line after the header
          lines.splice(additionalIndex + 1, 0, additionalDiagnoses);
          updatedDiagnosis = lines.join('\n');
        }
      } else {
        // Create new section
        updatedDiagnosis = currentDiagnosis
          ? `${currentDiagnosis}\n\nAdditional Diagnoses:\n${additionalDiagnoses}`
          : `Additional Diagnoses:\n${additionalDiagnoses}`;
      }

      // Update the patient data with the new diagnosis
      setPatientData(prev => ({
        ...prev,
        diagnosis: updatedDiagnosis
      }));

      // Optionally save to database for tracking
      try {
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        if (!visitError && visitData?.id) {
          // Update the latest AI recommendation to mark complications as applied
          const { error: updateError } = await supabase
            .from('ai_clinical_recommendations' as any)
            .update({
              status: 'applied',
              applied_at: new Date().toISOString(),
              notes: `Selected complications: ${selectedAIComplications.join(', ')}`
            })
            .eq('visit_id', visitData.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (updateError) {
            console.warn('Could not update AI recommendation status:', updateError);
          }
        }
      } catch (dbError) {
        console.warn('Database update failed, but diagnosis was updated locally:', dbError);
      }

      // Keep selected complications checked (don't clear them)
      const complicationCount = selectedAIComplications.length;
      // setSelectedAIComplications([]); // Commented out to keep selections persistent

      toast.success(`${complicationCount} complications saved as additional diagnoses!`);
      console.log('Selected complications saved successfully');

    } catch (error) {
      console.error('Error saving selected complications:', error);
      toast.error('Failed to save selected complications');
    }
  };

  // Function to manually generate AI recommendations
  const generateAIRecommendations = async () => {
    if (savedSurgeries.length === 0) {
      toast.error('No surgeries found. Please add surgeries first.');
      return;
    }

    setIsGeneratingRecommendations(true);
    try {
      const diagnosisText = getDiagnosisText();
      const surgeryNames = savedSurgeries.map(s => s.name).join(', ');

      console.log('Generating AI recommendations for surgeries:', surgeryNames);
      const recommendations = await generateClinicalRecommendations(surgeryNames, diagnosisText);

      setAiRecommendations(recommendations);
      // Clear previous selections when new recommendations are generated
      setSelectedAIComplications([]);
      toast.success('AI recommendations generated successfully!');

      // Optionally save to database
      if (visitId) {
        await saveClinicalRecommendations(visitId, recommendations);
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast.error('Failed to generate AI recommendations');
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Function to save clinical recommendations to temporary AI recommendations table
  const saveClinicalRecommendations = async (visitId: string, recommendations: any) => {
    try {
      // Get the actual visit UUID
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData?.id) {
        console.error('Error fetching visit UUID:', visitError);
        return;
      }

      // Prepare AI recommendations data for temporary storage
      const aiRecommendationData = {
        visit_id: visitData.id,
        surgery_names: savedSurgeries.map(s => s.name),
        diagnosis_text: getDiagnosisText(),
        complications: recommendations.complications || [],
        lab_tests: recommendations.labs || [],
        radiology_procedures: recommendations.radiology || [],
        medications: recommendations.medications || [],
        ai_model: 'gpt-4',
        prompt_version: 'v2.0',
        status: 'generated',
        confidence_score: 0.85 // Default confidence score
      };

      console.log('Saving AI recommendations to temporary storage:', aiRecommendationData);

      // Save to AI recommendations table
      const { data: savedRecommendation, error: saveError } = await supabase
        .from('ai_clinical_recommendations' as any)
        .insert(aiRecommendationData)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving AI recommendations:', saveError);
        toast.error('Failed to save AI recommendations to database');
        return;
      }

      console.log('AI recommendations saved successfully:', savedRecommendation);
      toast.success('AI recommendations saved to database successfully!');

      // Also save complications to visit_complications for backward compatibility
      if (recommendations.complications && recommendations.complications.length > 0) {
        const complicationsToSave = recommendations.complications.map((complication: string) => ({
          visit_id: visitData.id,
          name: complication,
          is_primary: false
        }));

        const { error: complicationsError } = await supabase
          .from('visit_complications' as any)
          .insert(complicationsToSave);

        if (complicationsError) {
          console.error('Error saving complications:', complicationsError);
        } else {
          console.log('Complications also saved to visit_complications table');
        }
      }

      // Refresh the saved data
      await Promise.all([
        fetchSavedComplications(visitId),
        fetchSavedLabs(visitId),
        fetchSavedRadiology(visitId),
        fetchSavedMedications(visitId),
        fetchAIRecommendations(visitId) // Fetch the saved AI recommendations
      ]);

    } catch (error) {
      console.error('Error saving clinical recommendations:', error);
      toast.error('Failed to save AI recommendations');
    }
  };

  // Function to fetch saved AI recommendations from database
  const fetchAIRecommendations = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching AI recommendations');
        setSavedAIRecommendations([]);
        return;
      }

      console.log('Fetching AI recommendations for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for AI recommendations:', visitError);
        setSavedAIRecommendations([]);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for AI recommendations fetch');
        setSavedAIRecommendations([]);
        return;
      }

      console.log('Found visit UUID for AI recommendations:', visitData.id, 'for visit_id:', visitId);

      // Fetch AI recommendations for this visit
      const { data: aiRecommendationsData, error: aiRecommendationsError } = await supabase
        .from('ai_clinical_recommendations' as any)
        .select('*')
        .eq('visit_id', visitData.id)
        .order('generated_at', { ascending: false }); // Get latest first

      if (aiRecommendationsError) {
        console.error('Error fetching AI recommendations:', aiRecommendationsError);
        setSavedAIRecommendations([]);
        return;
      }

      console.log('AI recommendations raw data:', aiRecommendationsData);

      if (!aiRecommendationsData || aiRecommendationsData.length === 0) {
        console.log('No saved AI recommendations found for this visit');
        setSavedAIRecommendations([]);
        return;
      }

      console.log('Final AI recommendations:', aiRecommendationsData);
      setSavedAIRecommendations(aiRecommendationsData);
      console.log('State updated - savedAIRecommendations should now contain:', aiRecommendationsData.length, 'items');

      // Set the latest recommendations as current AI recommendations for display
      if (aiRecommendationsData.length > 0) {
        const latestRecommendation = aiRecommendationsData[0] as any;
        setAiRecommendations({
          complications: latestRecommendation.complications || [],
          labs: latestRecommendation.lab_tests || [],
          radiology: latestRecommendation.radiology_procedures || [],
          medications: latestRecommendation.medications || []
        });
      }

    } catch (error) {
      console.error('Error in fetchAIRecommendations:', error);
      setSavedAIRecommendations([]);
    }
  };

  // Function to save selected surgeries to visit_surgeries junction table
  const saveSurgeriesToVisit = async (visitId: string) => {
    try {
      console.log('Saving surgeries to visit:', visitId, selectedSurgeries);

      if (selectedSurgeries.length === 0) {
        toast.error('No surgeries selected to save');
        return;
      }

      // Get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for surgeries:', visitError);
        toast.error('Visit not found. Cannot save surgeries.');
        return;
      }

      if (!visitData?.id) {
        toast.error('Visit record not found. Cannot save surgeries.');
        return;
      }

      // Prepare data for insertion
      const surgeriesToSave = selectedSurgeries.map((surgery) => ({
        visit_id: visitData.id,
        surgery_id: surgery.id,
        is_primary: false, // Don't automatically set as primary - let user choose
        status: 'planned',
        sanction_status: surgery.sanction_status || 'Not Sanctioned',
        notes: null
      }));

      console.log('Surgeries to save:', surgeriesToSave);

      // Insert directly using Supabase client
      try {
        // Don't delete existing surgeries - just add new ones
        // Insert new surgeries
        const { data, error: insertError } = await supabase
          .from('visit_surgeries' as any)
          .insert(surgeriesToSave)
          .select();

        if (insertError) {
          console.error('Error inserting surgeries:', insertError);
          toast.error(`Failed to save surgeries: ${insertError.message}`);
        } else {
          toast.success(`${selectedSurgeries.length} surgeries saved to visit ${visitId} successfully!`);
          console.log('Saved surgeries data:', data);

          console.log('About to clear selected surgeries...');
          // Clear selected surgeries after successful save
          setSelectedSurgeries([]);

          // Generate clinical recommendations for each saved surgery
          console.log('Generating clinical recommendations for surgeries...');
          for (const surgery of selectedSurgeries) {
            try {
              const diagnosisText = getDiagnosisText();
              const recommendations = await generateClinicalRecommendations(surgery.name, diagnosisText);
              await saveClinicalRecommendations(visitId, recommendations);
              console.log(`Generated recommendations for ${surgery.name}:`, recommendations);
            } catch (error) {
              console.error(`Error generating recommendations for ${surgery.name}:`, error);
            }
          }

          console.log('About to fetch saved surgeries...');
          console.log('fetchSavedSurgeries function:', typeof fetchSavedSurgeries);
          // Fetch updated saved surgeries to refresh the display
          console.log('Fetching saved surgeries after save with visit ID:', visitId);
          try {
            await fetchSavedSurgeriesFromVisit(visitId);
            console.log('Surgery fetch completed successfully');

            // Surgery Treatment section removed

          } catch (fetchError) {
            console.error('Error fetching saved surgeries after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        toast.error('Failed to save surgeries to database');
      }

    } catch (error) {
      console.error('Error in saveSurgeriesToVisit:', error);
      toast.error('Failed to save surgeries');
    } finally {
      // Refresh patient info to update the UI with new surgery data
      await fetchPatientInfo();
    }
  };

  // Surgery Treatment section and related functions removed



  // Function to fetch saved medications from visit_medications table
  const fetchSavedMedications = async (visitId: string) => {
    try {
      if (!visitId) {
        console.log('No visit ID provided for fetching medications');
        return;
      }

      console.log('Fetching saved medications for visit ID:', visitId);

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for medications:', visitError);
        return;
      }

      if (!visitData?.id) {
        console.log('Visit record not found for medications fetch');
        setSavedMedications([]);
        return;
      }

      console.log('Found visit UUID for medications:', visitData.id, 'for visit_id:', visitId);

      // Then get visit_medications data using the UUID
      const { data: visitMedicationsData, error: visitMedicationsError } = await supabase
        .from('visit_medications' as any)
        .select('*')
        .eq('visit_id', visitData.id);

      if (visitMedicationsError) {
        console.error('Error fetching visit_medications:', visitMedicationsError);
        return;
      }

      console.log('Visit medications raw data:', visitMedicationsData);

      if (!visitMedicationsData || visitMedicationsData.length === 0) {
        console.log('No saved medications found for this visit');
        setSavedMedications([]);
        return;
      }

      // Get medication details for each medication_id
      const medicationIds = visitMedicationsData.map((item: any) => item.medication_id);
      console.log('Medication IDs to fetch:', medicationIds);

      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medication')
        .select('id, name, description')
        .in('id', medicationIds);

      if (medicationsError) {
        console.error('Error fetching medications details:', medicationsError);
        // Still show the data we have, even without names
        const formattedMedications = visitMedicationsData.map((item: any) => ({
          id: item.medication_id,
          name: `Medication ID: ${item.medication_id}`,
          description: 'Unknown'
        }));
        setSavedMedications(formattedMedications);
        return;
      }

      console.log('Medications details data:', medicationsData);

      // Combine the data
      const formattedMedications = visitMedicationsData.map((visitMedication: any) => {
        const medicationDetail = medicationsData?.find((m: any) => m.id === visitMedication.medication_id);
        return {
          id: visitMedication.medication_id,
          name: medicationDetail?.name || `Unknown Medication (${visitMedication.medication_id})`,
          description: medicationDetail?.description || 'No description available'
        };
      });

      console.log('Final formatted medications:', formattedMedications);
      setSavedMedications(formattedMedications);
      console.log('State updated - savedMedications should now contain:', formattedMedications.length, 'items');
    } catch (error) {
      console.error('Error in fetchSavedMedications:', error);
    }
  };

  // Function to save selected complications to visit_complications table
  const saveComplicationsToVisit = async (visitId: string) => {
    try {
      console.log('Saving complications to visit:', visitId, selectedComplications);

      if (selectedComplications.length === 0) {
        toast.error('No complications selected to save');
        return;
      }

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID:', visitError);
        toast.error('Failed to find visit record. Cannot save complications.');
        return;
      }

      if (!visitData?.id) {
        toast.error('Visit record not found. Cannot save complications.');
        return;
      }

      console.log('Found visit UUID:', visitData.id, 'for visit_id:', visitId);

      // Prepare data for insertion using the actual visit UUID
      const complicationsToSave = selectedComplications.map((complication) => ({
        visit_id: visitData.id, // Use the actual UUID
        complication_id: complication.id
      }));

      console.log('Complications to save:', complicationsToSave);

      // Insert directly using Supabase client
      try {
        // First, delete existing complications for this visit using the UUID
        const { error: deleteError } = await supabase
          .from('visit_complications' as any)
          .delete()
          .eq('visit_id', visitData.id);

        if (deleteError) {
          console.error('Error deleting existing complications:', deleteError);
        }

        // Insert new complications
        const { data, error: insertError } = await supabase
          .from('visit_complications' as any)
          .insert(complicationsToSave)
          .select();

        if (insertError) {
          console.error('Error inserting complications:', insertError);
          toast.error(`Failed to save complications: ${insertError.message}`);
        } else {
          toast.success(`${selectedComplications.length} complications saved to visit ${visitId} successfully!`);
          console.log('Saved complications data:', data);

          console.log('About to clear selected complications...');
          // Clear selected complications after successful save
          setSelectedComplications([]);

          console.log('About to fetch saved complications...');
          console.log('fetchSavedComplications function:', typeof fetchSavedComplications);
          // Fetch updated saved complications to refresh the display
          console.log('Fetching saved complications after save with visit ID:', visitId);
          try {
            await fetchSavedComplications(visitId);
            console.log('Complications fetch completed successfully');
          } catch (fetchError) {
            console.error('Error fetching saved complications after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        toast.error('Failed to save complications to database');
      }

    } catch (error) {
      console.error('Error in saveComplicationsToVisit:', error);
      toast.error('Failed to save complications');
    }
  };

  // Function to save selected labs to visit_labs table
  const saveLabsToVisit = async (visitId: string) => {
    try {
      console.log('Saving labs to visit:', visitId, selectedLabs);

      if (selectedLabs.length === 0) {
        toast.error('No labs selected to save');
        return;
      }

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for labs:', visitError);
        toast.error('Failed to find visit record. Cannot save labs.');
        return;
      }

      if (!visitData?.id) {
        toast.error('Visit record not found. Cannot save labs.');
        return;
      }

      console.log('Found visit UUID for labs:', visitData.id, 'for visit_id:', visitId);

      // Prepare data for insertion using the actual visit UUID
      const labsToSave = selectedLabs.map((lab) => ({
        visit_id: visitData.id, // Use the actual UUID
        lab_id: lab.id,
        lab_name: lab.name,
        cost: lab['NABH/NABL_rates_in_rupee'] || 0,
        description: lab.description || '',
        category: lab.category || '',
        cghs_code: lab['CGHS_code'] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('Labs to save:', labsToSave);

      // Insert directly using Supabase client
      try {
        // First, delete existing labs for this visit
        const { error: deleteError } = await supabase
          .from('visit_labs' as any)
          .delete()
          .eq('visit_id', visitData.id);

        if (deleteError) {
          console.error('Error deleting existing labs:', deleteError);
        }

        // Insert new labs
        const { data, error: insertError } = await supabase
          .from('visit_labs' as any)
          .insert(labsToSave)
          .select();

        if (insertError) {
          console.error('Error inserting labs:', insertError);
          toast.error(`Failed to save labs: ${insertError.message}`);
        } else {
          toast.success(`${selectedLabs.length} labs saved to visit ${visitId} successfully!`);
          console.log('Saved labs data:', data);

          console.log('About to clear selected labs...');
          // Clear selected labs after successful save
          setSelectedLabs([]);

          // Refresh saved data to update the display
          try {
            await refreshSavedData();
          } catch (fetchError) {
            console.error('Error refreshing saved data after lab save:', fetchError);
          }

          console.log('About to fetch saved labs...');
          // Fetch updated saved labs to refresh the display
          console.log('Fetching saved labs after save with visit ID:', visitId);
          try {
            await fetchSavedLabs(visitId);
            console.log('Labs fetch completed successfully');
          } catch (fetchError) {
            console.error('Error fetching saved labs after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed for labs:', dbError);
        toast.error('Failed to save labs to database');
      }

    } catch (error) {
      console.error('Error in saveLabsToVisit:', error);
      toast.error('Failed to save labs');
    }
  };

  // Note: saveMedicationsToBill function removed - now using saveMedicationsToVisit to save to visit_medications table

  // Function to save selected radiology to visit_radiology table
  const saveRadiologyToVisit = async (visitId: string) => {
    try {
      console.log('Saving radiology to visit:', visitId, selectedRadiology);

      if (selectedRadiology.length === 0) {
        toast.error('No radiology selected to save');
        return;
      }

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for radiology:', visitError);
        toast.error('Failed to find visit record. Cannot save radiology.');
        return;
      }

      if (!visitData?.id) {
        toast.error('Visit record not found. Cannot save radiology.');
        return;
      }

      console.log('Found visit UUID for radiology:', visitData.id, 'for visit_id:', visitId);

      // Prepare data for insertion using the actual visit UUID
      const radiologyToSave = selectedRadiology.map((radiology) => ({
        visit_id: visitData.id, // Use the actual UUID
        radiology_id: radiology.id
      }));

      console.log('Radiology to save:', radiologyToSave);

      // Insert directly using Supabase client
      try {
        // First, delete existing radiology for this visit
        const { error: deleteError } = await supabase
          .from('visit_radiology' as any)
          .delete()
          .eq('visit_id', visitData.id);

        if (deleteError) {
          console.error('Error deleting existing radiology:', deleteError);
        }

        // Insert new radiology
        const { data, error: insertError } = await supabase
          .from('visit_radiology' as any)
          .insert(radiologyToSave)
          .select();

        if (insertError) {
          console.error('Error inserting radiology:', insertError);
          toast.error(`Failed to save radiology: ${insertError.message}`);
        } else {
          toast.success(`${selectedRadiology.length} radiology services saved to visit ${visitId} successfully!`);
          console.log('Saved radiology data:', data);

          console.log('About to clear selected radiology...');
          // Clear selected radiology after successful save
          setSelectedRadiology([]);

          // Refresh saved data to update the display
          try {
            await refreshSavedData();
          } catch (fetchError) {
            console.error('Error refreshing saved data after radiology save:', fetchError);
          }

          console.log('About to fetch saved radiology...');
          // Fetch updated saved radiology to refresh the display
          console.log('Fetching saved radiology after save with visit ID:', visitId);
          try {
            await fetchSavedRadiology(visitId);
            console.log('Radiology fetch completed successfully');
          } catch (fetchError) {
            console.error('Error fetching saved radiology after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed for radiology:', dbError);
        toast.error('Failed to save radiology to database');
      }

    } catch (error) {
      console.error('Error in saveRadiologyToVisit:', error);
      toast.error('Failed to save radiology');
    }
  };

  // Function to save selected medications to visit_medications table
  const saveMedicationsToVisit = async (visitId: string) => {
    try {
      console.log('Saving medications to visit:', visitId, selectedMedications);

      if (selectedMedications.length === 0) {
        toast.error('No medications selected to save');
        return;
      }

      // First get the actual visit UUID from the visits table
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError) {
        console.error('Error fetching visit UUID for medications:', visitError);
        toast.error('Failed to find visit record. Cannot save medications.');
        return;
      }

      if (!visitData?.id) {
        toast.error('Visit record not found. Cannot save medications.');
        return;
      }

      console.log('Found visit UUID for medications:', visitData.id, 'for visit_id:', visitId);

      // Prepare data for insertion using the actual visit UUID
      const medicationsToSave = selectedMedications.map((medication) => ({
        visit_id: visitData.id, // Use the actual UUID
        medication_id: medication.original_id || medication.id // Use original medication UUID, not the temporary selection ID
      }));

      console.log('Medications to save:', medicationsToSave);

      // Insert directly using Supabase client
      try {
        // First, delete existing medications for this visit
        const { error: deleteError } = await supabase
          .from('visit_medications' as any)
          .delete()
          .eq('visit_id', visitData.id);

        if (deleteError) {
          console.error('Error deleting existing medications:', deleteError);
        }

        // Insert new medications
        const { data, error: insertError } = await supabase
          .from('visit_medications' as any)
          .insert(medicationsToSave)
          .select();

        if (insertError) {
          console.error('Error inserting medications:', insertError);
          toast.error(`Failed to save medications: ${insertError.message}`);
        } else {
          toast.success(`${selectedMedications.length} medications saved to visit ${visitId} successfully!`);
          console.log('Saved medications data:', data);

          console.log('About to clear selected medications...');
          // Clear selected medications after successful save
          setSelectedMedications([]);

          console.log('About to refresh saved data...');
          // Refresh saved data to update the display
          try {
            await refreshSavedData();
            console.log('Saved data refresh completed successfully');
          } catch (fetchError) {
            console.error('Error refreshing saved data after save:', fetchError);
          }
        }
      } catch (dbError) {
        console.error('Database operation failed for medications:', dbError);
        toast.error('Failed to save medications to database');
      }

    } catch (error) {
      console.error('Error in saveMedicationsToVisit:', error);
      toast.error('Failed to save medications');
    }
  };

  const findParentSection = (mainIndex: number) => {
    for (let i = mainIndex - 1; i >= 0; i--) {
      if (invoiceItems[i].type === 'section') {
        return invoiceItems[i] as SectionItem;
      }
    }
    return null;
  }

  useEffect(() => {
    const newTotal = calculateTotalAmount();
    console.log('🧮 Calculating total amount:', newTotal);
    setTotalAmount(newTotal);
  }, [invoiceItems, savedSurgeries, surgeryRows]);

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the printable content
    const printableContent = document.querySelector('.printable-area');
    if (!printableContent) return;

    // Create the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Final Bill</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: black;
              background: white;
              margin: 0.5in;
            }
            .screen-only {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            .no-print {
              display: none !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 0;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              border: 1px solid #000;
              padding: 3px;
              text-align: left;
              vertical-align: top;
              font-size: 10px;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-center {
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .font-bold {
              font-weight: bold;
            }
            .font-semibold {
              font-weight: 600;
            }
            .bg-gray-100 {
              background-color: #f5f5f5;
            }
            .bg-gray-200 {
              background-color: #e5e5e5;
            }
            .bg-black {
              background-color: #000;
              color: white;
            }
            .text-white {
              color: white;
            }
            .text-lg {
              font-size: 16px;
            }
            .text-xl {
              font-size: 18px;
            }
            .text-2xl {
              font-size: 24px;
            }
            .text-xs {
              font-size: 10px;
            }
            .text-sm {
              font-size: 11px;
            }
            .mb-2 {
              margin-bottom: 8px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .mb-6 {
              margin-bottom: 24px;
            }
            .mt-1 {
              margin-top: 4px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            .mt-12 {
              margin-top: 48px;
            }
            .p-2 {
              padding: 8px;
            }
            .p-3 {
              padding: 12px;
            }
            .p-6 {
              padding: 24px;
            }
            .space-y-2 > * + * {
              margin-top: 8px;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, 1fr);
            }
            .gap-x-12 {
              column-gap: 48px;
            }
            .flex {
              display: flex;
            }
            .justify-between {
              justify-content: space-between;
            }
            .justify-end {
              justify-content: flex-end;
            }
            .items-center {
              align-items: center;
            }
            .w-40 {
              width: 160px;
            }
            .border {
              border: 1px solid #000;
            }
            .border-2 {
              border: 2px solid #000;
            }
            .whitespace-pre-wrap {
              white-space: pre-wrap;
            }
            .mb-2 {
              margin-bottom: 8px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .mb-6 {
              margin-bottom: 24px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            .mt-12 {
              margin-top: 48px;
            }
            .p-2 {
              padding: 8px;
            }
            .p-4 {
              padding: 16px;
            }
            .p-6 {
              padding: 24px;
            }
            .space-x-4 > * + * {
              margin-left: 16px;
            }
            @page {
              size: A4;
              margin: 0.5in;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                font-size: 10px !important;
              }
              .screen-only {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .no-print {
                display: none !important;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .page-break-before {
                page-break-before: always;
              }
              .page-break-after {
                page-break-after: always;
              }
              .avoid-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${printableContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Fetch data for ESIC approval forms
  const handleFetchData = async () => {
    console.log('🔄 Starting fetch data process for visit:', visitId);
    console.log('📋 Current approval values:', {
      additionalApprovalSurgery,
      additionalApprovalInvestigation,
      extensionOfStayApproval
    });
    setIsFetching(true);
    try {
      // Get visit data first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      if (visitError) throw visitError;

      // Get patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', visitData.patient_id)
        .single();

      if (patientError) throw patientError;

      console.log('Patient data fetched:', patientData);

      // Get diagnosis information from visit_diagnoses table
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('visit_diagnoses')
        .select('*, diagnoses:diagnosis_id(name)')
        .eq('visit_id', visitData.id);

      if (diagnosisError) {
        console.warn('Diagnosis data fetch failed:', diagnosisError);
      }

      // Get claim ID from patient_data (reports) table or use visit claim_id
      const { data: reportData, error: reportError } = await supabase
        .from('patient_data')
        .select('claim_id')
        .eq('mrn', visitData.visit_id)
        .maybeSingle();

      if (reportError) {
        console.warn('Report data fetch failed:', reportError);
      }

      // Get surgeries for this visit
      const { data: surgeries, error: surgeriesError } = await supabase
        .from('visit_surgeries')
        .select('*, cghs_surgery:surgery_id(name)')
        .eq('visit_id', visitData.id);

      if (surgeriesError) throw surgeriesError;

      // Get lab tests for this visit - simplified query without foreign key that doesn't exist
      const { data: labs, error: labsError } = await supabase
        .from('visit_labs')
        .select('*')
        .eq('visit_id', visitData.id);

      if (labsError) {
        console.warn('Lab data fetch failed:', labsError);
      }

      // Get radiology for this visit
      const { data: radiology, error: radiologyError } = await supabase
        .from('visit_radiology')
        .select('*')
        .eq('visit_id', visitData.id);

      if (radiologyError) {
        console.warn('Radiology data fetch failed:', radiologyError);
      }

      // Prepare data for common text area - only the specific fields requested
      const surgeryNames = surgeries?.map(s => s.cghs_surgery?.name).filter(Boolean).join(', ') || 'N/A';
      const diagnosisNames = diagnosisData?.map(d => d.diagnoses?.name).filter(Boolean).join(', ') || 'N/A';
      const labNames = labs?.map(l => l.lab_name || l.name).filter(Boolean).join(', ') || 'N/A';
      const radiologyNames = radiology?.map(r => r.radiology_name || r.name).filter(Boolean).join(', ') || 'N/A';
      
      // Use claim_id from patient insurance_person_no, then reports table, then visit claim_id, finally visit_id as fallback
      const claimId = patientData?.insurance_person_no || reportData?.claim_id || visitData.claim_id || visitData.visit_id || 'N/A';

      // Determine which approval type has data and fetch accordingly
      // Map the gender field from patients table properly
      const genderValue = patientData.gender || patientData.sex || 'Not Specified';
      
      let fetchedData = `PATIENT name: ${patientData.name || patientData.patient_name || 'N/A'}
        age: ${patientData.age || 'N/A'}
        gender: ${genderValue}
        claim id no: ${claimId}
        admission date: ${visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy') : visitData.visit_date ? format(new Date(visitData.visit_date), 'dd/MM/yyyy') : 'N/A'}
        DIAGNOSIS: ${diagnosisNames}
        procedure: ${surgeryNames}
        procedure date: ${visitData.surgery_date ? format(new Date(visitData.surgery_date), 'dd/MM/yyyy') : 'N/A'}`;

      console.log('🏥 Patient Data Being Set:', {
        rawPatientData: patientData,
        name: patientData.name || patientData.patient_name,
        age: patientData.age,  
        gender: patientData.gender,
        sex: patientData.sex,
        finalGender: genderValue,
        fetchedDataString: fetchedData
      });

      // Automatically set extension prompt if none provided
      if (!extensionOfStayApproval && !additionalApprovalSurgery && !additionalApprovalInvestigation) {
        const defaultExtensionPrompt = "EXTENSION OF 7 DAYS FROM AFTER 07 DAYS OF ADMISSION DATE for 10 days with complaints and complication, planned";
        setExtensionOfStayApproval(defaultExtensionPrompt);
        fetchedData += `\n\nAPPROVAL TYPE: Extension of Stay
Extension of Stay Approval: ${defaultExtensionPrompt}`;
        setLetterType('extension');
      } else if (additionalApprovalSurgery) {
        // For Additional Sanction Approval, show only investigation data, not surgery data
        const filteredData = `Patient Name: ${patientData.name || patientData.patient_name || 'N/A'}
      Age: ${patientData.age || 'N/A'}
      Gender: ${genderValue}
      Claim ID No: ${claimId}
      Admission Date: ${visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy') : visitData.visit_date ? format(new Date(visitData.visit_date), 'dd/MM/yyyy') : 'N/A'}
      Diagnosis: ${diagnosisNames}

APPROVAL TYPE: Additional Sanction Approval
Additional Approval Investigation: ${additionalApprovalSurgery}`;
        
        // Use commonFetchData instead of fetchedData
        setCommonFetchData(filteredData);
        setLetterType('additionalSanctionApproval');
        return; // Return early to avoid overwriting with full data
      } else if (extensionOfStayApproval) {
        // For Extension of Stay Approval, show only specific patient data
        const diagnosisName = savedDiagnoses.length > 0 
          ? savedDiagnoses.find(d => d.is_primary)?.name || savedDiagnoses[0].name
          : visit?.diagnosis?.name || visit?.reason_for_visit || visit?.sst_treatment || 'N/A';
        
        const filteredData = `Patient Name: ${visit?.patients?.name || 'N/A'}
Age: ${visit?.patients?.age || 'N/A'}
Gender: ${visit?.patients?.gender || 'N/A'}
Admission Date: ${visit?.admission_date || 'N/A'}
Claim ID: ${visit?.claim_id || visit?.visit_id || 'N/A'}
Diagnosis: ${diagnosisName}
Surgery: ${savedSurgeries.length > 0 ? savedSurgeries.map(s => s.name).join(', ') : visit?.sst_treatment || 'N/A'}

APPROVAL TYPE: Extension of Stay
Extension of Stay Approval: ${extensionOfStayApproval}`;
        
        // Use commonFetchData instead of fetchedData
        setCommonFetchData(filteredData);
        setLetterType('extension');
        return; // Return early to avoid overwriting with full data
      } else if (additionalApprovalInvestigation) {
        // For Additional Sanction Approval, show only specific patient data (no procedure data)
        const filteredData = `Patient Name: ${patientData.name || patientData.patient_name || 'N/A'}
Age: ${patientData.age || 'N/A'}
Gender: ${genderValue}
Admission Date: ${visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy') : visitData.visit_date ? format(new Date(visitData.visit_date), 'dd/MM/yyyy') : 'N/A'}
Diagnosis: ${diagnosisNames}
Radiology: ${radiologyNames}
Laboratory: ${labNames}

APPROVAL TYPE: Additional Sanction Approval
Additional Approval Investigation: ${additionalApprovalInvestigation}`;
        
        // Use commonFetchData instead of fetchedData
        setCommonFetchData(filteredData);
        setLetterType('additionalSanctionApproval');
        return; // Return early to avoid overwriting with full data
      } else {
        fetchedData += `\n\nNo approval details entered in any box.`;
        setLetterType(null);
      }

      setCommonFetchData(fetchedData);

      // Set auto prompt for AI based on letter type
      let prompt = '';
      
      if (letterType === 'surgery') {
        prompt = `Write a formal hospital letter addressed to the CMO requesting approval for additional surgery for a patient. Include the patient's name, age, gender, claim ID, diagnosis, current clinical condition, and detailed medical justification for the additional surgery. The letter should end with the doctor's name and designation. The tone should be professional and clinical.

Patient Data: ${fetchedData}

Use this exact format:

TO
 CMO,
 E.S.I.C SOMWARIPETH  HOSPITAL,
 NAGPUR.

SUB: REQUEST FOR EXTENSION STAY APPROVAL

RESPECTED SIR/MADAM,

SUBJECT: EXTENSION STAY APPROVAL
Patient Name: [Name], Age/Sex: [Age] Years / [Gender] with claim id: [Claim ID], with Diagnosis: [Diagnosis].
[Current clinical condition and progress details]
[Detailed justification for additional surgery based on patient's current condition and medical necessity]
Kindly approve the additional surgery as mentioned in the approval details.
Regards,
 Dr. [Doctor Name]
 [Designation]

Replace the patient details with the actual patient information from the provided data.`;
      } else if (letterType === 'extension') {
        prompt = `EXTENSION OF 7 DAYS FROM AFTER 07 DAYS OF ADMISSION DATE for 10 days with complaints and complication, planned

Write a formal hospital letter addressed to the CMO requesting an extension of a patient's hospital stay. Include the patient's name, age, gender, claim ID, diagnosis, current clinical condition, ongoing treatment, and a medical justification for the extension. Mention the specific extension period. The letter should end with the doctor's name and designation. The tone should be professional and clinical.

Patient Data: ${fetchedData}

Use this exact format:

TO
 CMO,
 E.S.I.C SOMWARIPETH  HOSPITAL,
 NAGPUR.

SUB: EXTENSION OF STAY APPROVAL

RESPECTED SIR/MADAM,

SUBJECT: EXTENSION OF STAY APPROVAL
Patient Name: [Name], Age/Sex: [Age] Years / [Gender] with claim id: [Claim ID], with Diagnosis: [Diagnosis].
[Current clinical condition and treatment progress details]
[Medical justification for extension - EXTENSION OF 7 DAYS FROM AFTER 07 DAYS OF ADMISSION DATE for 10 days with complaints and complication, planned]
Kindly approve the extension as mentioned in the approval details.
Regards,
 Dr. [Doctor Name]
 [Designation]

Replace the patient details with the actual patient information from the provided data.`;
      } else if (letterType === 'investigation') {
        prompt = `Write a formal hospital letter addressed to the CMO requesting approval for additional investigation/tests for a patient. Include the patient's name, age, gender, claim ID, diagnosis, current clinical condition, and detailed medical justification for the additional investigations. The letter should end with the doctor's name and designation. The tone should be professional and clinical.

Patient Data: ${fetchedData}

Use this exact format:

TO
 CMO,
 E.S.I.C SOMWARIPETH  HOSPITAL,
 NAGPUR.

 SUB: REQUEST FOR ADDITIONAL SANCTION APPROVAL

 RESPECTED SIR/MADAM,

 SUBJECT: REQUEST FOR ADDITIONAL SANCTION APPROVAL
Patient Name: [Name], Age/Sex: [Age] Years / [Gender] with claim id: [Claim ID], with Diagnosis: [Diagnosis].
[Current clinical condition and progress details]
[Detailed justification for additional investigation based on patient's current condition and diagnostic necessity]
Kindly approve the additional investigation as mentioned in the approval details.
Regards,
 Dr. [Doctor Name]
 [Designation]

Replace the patient details with the actual patient information from the provided data.`;
      } else {
        prompt = `Please enter approval details in one of the boxes (Additional Approval Surgery, Additional Approval Investigation, or Extension of Stay Approval) before generating a letter.`;
      }

      setAutoPrompt(prompt);

      toast.success("Data fetched successfully!");
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to fetch data");
    } finally {
      setIsFetching(false);
    }
  };

  // Generate letter directly without AI service
  const handleSendToAI = async () => {
    // Debug: Check current state values at the start
    console.log('🔸 Current form state values:', {
      additionalApprovalInvestigation,
      additionalApprovalSurgery,
      extensionOfStayApproval
    });
    
    setIsGeneratingPDF(true);
    try {
      // First try to get data from the actual visit query if available
      let actualPatientName = visitData?.patients?.name || '';
      let actualAge = visitData?.patients?.age || '';
      let actualGender = visitData?.patients?.gender || '';
      let actualClaimId = visitData?.patients?.insurance_person_no || visitData?.claim_id || visitData?.visit_id || '';
      let actualAdmissionDate = visitData?.admission_date || visitData?.visit_date || '';
      let actualDiagnosis = '';
      
      // Get diagnosis from saved diagnoses
      if (savedDiagnoses && savedDiagnoses.length > 0) {
        actualDiagnosis = savedDiagnoses.map(d => d.name).join(', ');
      }

      // Parse commonFetchData for additional information
      let lines = [];
      if (commonFetchData.trim()) {
        lines = commonFetchData.split('\n');
      }
      
      // If we still don't have data, try to parse from commonFetchData
      if (!actualPatientName && commonFetchData.trim()) {
        actualPatientName = lines.find(line => line.includes('Name:'))?.split(': ')[1] || 'Not Provided';
        actualClaimId = lines.find(line => line.includes('Claim ID') || line.includes('Visit ID'))?.split(': ')[1] || 'Not Provided';
        actualAdmissionDate = lines.find(line => line.includes('Admission Date:'))?.split(': ')[1] || 'Not Provided';
        actualDiagnosis = lines.find(line => line.includes('Diagnosis:'))?.split(': ')[1] || 'Not Provided';
        actualAge = lines.find(line => line.includes('Age:'))?.split(': ')[1]?.replace(' years', '') || 'Not Provided';
        actualGender = lines.find(line => line.includes('Gender:'))?.split(': ')[1] || 'Not Provided';
      }

      // If still no data, show error
      if (!actualPatientName || actualPatientName === 'Not Provided') {
        toast.error("Please fetch patient data first to generate the letter");
        return;
      }

      console.log('🔍 Letter Generation Debug:', {
        actualPatientName,
        actualAge, 
        actualGender,
        actualClaimId,
        actualDiagnosis,
        actualAdmissionDate,
        letterType
       });

      // Debug: Check state variables before letter generation
      console.log('🔸 State values before letter generation:', {
        additionalApprovalInvestigation,
        letterType,
        stateLength: additionalApprovalInvestigation?.length
      });

      let letterContent = '';

      if (letterType === 'extension') {
        // Use actual patient data that we extracted earlier
        const patientName = actualPatientName;
        const patientAge = actualAge;
        const patientGender = actualGender;
        const admissionDate = actualAdmissionDate;
        const diagnosis = actualDiagnosis;
        const claimId = actualClaimId;
        
        // Calculate realistic extension dates - should be current/future dates
        const today = new Date();
        let extensionStartDate = '';
        let extensionEndDate = '';
        
        // Extension should typically start from today or next few days and extend for 7 days
        const startExtensionDate = new Date(today.getTime() + 1*24*60*60*1000); // Start tomorrow
        const endExtensionDate = new Date(startExtensionDate.getTime() + 7*24*60*60*1000); // 7 days from start
        
        extensionStartDate = startExtensionDate.toLocaleDateString('en-GB');
        extensionEndDate = endExtensionDate.toLocaleDateString('en-GB');
        
        // Extract actual procedure and medical details from commonFetchData
        const actualProcedure = lines.find(line => line.includes('sst_treatment:'))?.split('sst_treatment: ')[1] || 
                               lines.find(line => line.includes('procedure:'))?.split('procedure: ')[1] || 
                               'SURGICAL PROCEDURE';
        
        const remarks = lines.find(line => line.includes('remark1:'))?.split('remark1: ')[1] || '';
        
        // Use actual procedure as diagnosis if available
        const procedureDiagnosis = actualProcedure !== 'SURGICAL PROCEDURE' ? actualProcedure.toUpperCase() : diagnosis.toUpperCase();
        
        // Get detailed medical information based on actual procedure
        const getDetailedMedicalContent = (actualProcedure: string, diagnosis: string, remarks: string) => {
          const procedureLower = actualProcedure.toLowerCase();
          const diagnosisLower = diagnosis.toLowerCase();
          const hasRemarks = remarks && remarks !== '' && remarks !== 'null';
          
          if (procedureLower.includes('hernia')) {
            return {
              complaints: 'ABDOMINAL PAIN, SWELLING, AND DISCOMFORT IN THE INGUINAL REGION',
              fullDiagnosis: `${actualProcedure.toUpperCase()} ${hasRemarks ? `WITH ${remarks.toUpperCase()}` : ''}`,
              treatment: 'HERNIA REPAIR SURGERY, POST-OPERATIVE CARE, AND MONITORING',
              ongoing: 'REGULAR POST-OPERATIVE MONITORING, WOUND CARE, AND RECOVERY ASSESSMENT',
              reason: 'POST-OPERATIVE RECOVERY AND NEED FOR CONTINUED MEDICAL SUPERVISION'
            };
          } else if (procedureLower.includes('abscess') || procedureLower.includes('wound')) {
            return {
              complaints: 'PAIN, SWELLING, AND PURULENT DISCHARGE FROM THE AFFECTED AREA',
              fullDiagnosis: `${actualProcedure.toUpperCase()} ${hasRemarks ? `WITH ${remarks.toUpperCase()}` : ''}`,
              treatment: 'INCISION AND DRAINAGE, WOUND CLEANING, AND INTRAVENOUS ANTIBIOTICS',
              ongoing: 'REGULAR DRESSINGS AND MONITORING FOR SIGNS OF HEALING AND SECONDARY INFECTION',
              reason: 'ONGOING WOUND DISCHARGE, LOCAL INFLAMMATION, AND SLOW HEALING RESPONSE'
            };
          } else if (procedureLower.includes('fracture') || procedureLower.includes('bone')) {
            return {
              complaints: 'PAIN, SWELLING, AND RESTRICTED MOBILITY',
              fullDiagnosis: `${actualProcedure.toUpperCase()} ${hasRemarks ? `WITH ${remarks.toUpperCase()}` : ''}`,
              treatment: 'SURGICAL FIXATION, POST-OPERATIVE CARE, AND PHYSIOTHERAPY',
              ongoing: 'REGULAR MONITORING FOR BONE HEALING AND REHABILITATION EXERCISES',
              reason: 'ONGOING NEED FOR ORTHOPEDIC SUPERVISION AND PHYSIOTHERAPY'
            };
          } else {
            return {
              complaints: `SYMPTOMS AND COMPLICATIONS RELATED TO ${actualProcedure.toUpperCase()}`,
              fullDiagnosis: `${actualProcedure.toUpperCase()} ${hasRemarks ? `WITH ${remarks.toUpperCase()}` : ''}`,
              treatment: `${actualProcedure.toUpperCase()}, POST-OPERATIVE CARE, AND MONITORING`,
              ongoing: 'REGULAR POST-OPERATIVE MONITORING AND FOLLOW-UP CARE',
              reason: 'POST-OPERATIVE RECOVERY AND NEED FOR CONTINUED MEDICAL SUPERVISION'
            };
          }
        };

        const medicalDetails = getDetailedMedicalContent(actualProcedure, diagnosis, remarks);
        
        letterContent = `                                                                                                                Date:-${new Date().toLocaleDateString('en-GB')}




TO
CMO,
E.S.I.C SOMWARIPETH HOSPITAL,
NAGPUR.

SUBJECT: EXTENSION OF STAY APPROVAL

        PATIENT NAME: ${patientGender.toLowerCase() === 'male' ? 'MR.' : 'MS.'} ${patientName.toUpperCase()} WITH AGE/SEX: ${patientAge} YEARS / ${patientGender.toUpperCase()}
WITH CLAIM ID NO. ${claimId}. DIAGNOSIS: ${diagnosis.toUpperCase()}.

        THE PATIENT WAS ADMITTED ON ${admissionDate} WITH COMPLAINTS OF ${medicalDetails.complaints}. ${patientGender.toLowerCase() === 'female' ? 'SHE' : 'HE'} WAS DIAGNOSED WITH ${diagnosis.toUpperCase()}.

INITIAL MANAGEMENT INCLUDED ${medicalDetails.treatment}. THE PATIENT IS UNDERGOING ${medicalDetails.ongoing}.

IN VIEW OF ${medicalDetails.reason}, A FURTHER EXTENSION OF STAY FOR 7 DAYS FROM ${extensionStartDate} TO ${extensionEndDate} IS RECOMMENDED.

KINDLY APPROVE THE EXTENSION.

REGARDS,
DR. MURALI B K
MS ORTHO`;
      } else if (letterType === 'surgery') {
        // Use actual patient data for surgery letter
        const patientName = actualPatientName;
        const patientAge = actualAge;
        let patientGender = actualGender;
        const claimId = actualClaimId;
        const diagnosis = actualDiagnosis;
        
        // Clean up gender parsing (in case it's needed)
        if (patientGender && patientGender !== 'Not Specified') {
          patientGender = patientGender.split('claim')[0].trim();
        }
        
        // Create table content for investigations if available from additionalApprovalSurgery field
        let tableContent = '';
        if (additionalApprovalSurgery.trim()) {
          // Parse the investigation data from additionalApprovalSurgery field
          const investigations = [];
          const lines = additionalApprovalSurgery.split('\n');
          let currentInvestigation = {};
          
          for (const line of lines) {
            if (line.match(/^\d+\./)) {
              // If we have a previous investigation, add it to the array
              if (currentInvestigation.particular) {
                investigations.push(currentInvestigation);
              }
              // Start new investigation
              currentInvestigation = {
                particular: line.replace(/^\d+\.\s*/, '').trim(),
                code: '-',
                cost: '-'
              };
            } else if (line.includes('CODE:')) {
              currentInvestigation.code = line.replace('CODE:', '').replace('   ', '').trim();
            } else if (line.includes('APPROXIMATE COST:')) {
              currentInvestigation.cost = line.replace('APPROXIMATE COST:', '').replace('₹', '').replace('   ', '').trim();
            } else if (line.trim() && !line.includes('CODE:') && !line.includes('APPROXIMATE COST:') && !currentInvestigation.particular) {
              // Handle cases where investigation name is on its own line
              currentInvestigation.particular = line.trim();
            }
          }
          
          // Add the last investigation
          if (currentInvestigation.particular) {
            investigations.push(currentInvestigation);
          }

          if (investigations.length > 0) {
            tableContent = `
+--------+------+-------------------------------------+---------------+
| SR. NO.| CODE | PARTICULAR                          | APPROXIMATE   |
|        |      |                                     | COST          |
+--------+------+-------------------------------------+---------------+`;
            
            investigations.forEach((investigation, index) => {
              const srNo = String(index + 1).padStart(4);
              const code = String(investigation.code || '-').padStart(4);
              const particular = String(investigation.particular || '-').padEnd(35);
              const cost = String(investigation.cost || '-').padStart(11);
              tableContent += `
|    ${srNo}| ${code} | ${particular} |      ${cost} |`;
            });
            
            tableContent += `
+--------+------+-------------------------------------+---------------+
`;
          }
        }
        
        letterContent = `                                                                                                                DATE: ${new Date().toLocaleDateString('en-GB')}


TO,
The Manager,
ESIC, Sub Regional Office,
Nagpur.

Subject: Request for Additional Surgery Approval

Respected Sir,

With reference to the Claim ID No. ${claimId}, Patient Name: ${patientName.toUpperCase()}, aged ${patientAge} years, admitted under the ESIC scheme at our hospital. The patient has been diagnosed with ${diagnosis.toUpperCase()}.

Current surgical procedure performed: ${procedureDiagnosis || 'SURGICAL PROCEDURE'}.

In view of the above, additional EMERGENCY surgery/procedure in the form of the following is essential due to the patient's current medical condition and to provide optimal clinical care:

${additionalApprovalSurgery || 'Additional surgical intervention as medically indicated'}

We kindly request you to grant additional approval for the above surgical procedure.

Thanking You,
Yours Faithfully,

For Hope Hospital
[Signature]
Dr. Murali B K
(Medical Superintendent)`;
      } else if (letterType === 'extension') {
        letterContent = `                                                                                                                DATE: ${new Date().toLocaleDateString('en-GB')}


TO,
The Manager,
ESIC, Sub Regional Office,
Nagpur.

Subject: Request for Extension Stay Approval

Respected Sir,

With reference to the Claim ID No. ${claimId}, Patient Name: ${patientName.toUpperCase()}, aged ${patientAge} years, admitted under the ESIC scheme at our hospital. The patient has been diagnosed with ${diagnosis.toUpperCase()}.

Current surgical procedure performed: ${procedure.toUpperCase()}.

In view of the above, extension of stay is essential due to the patient's current medical condition:

${extensionOfStayApproval || 'Extension of stay as medically indicated'}

We kindly request you to grant approval for the above extension.

Thanking You,
Yours Faithfully,

For Hope Hospital
[Signature]
Dr. Murali B K
(Medical Superintendent)`;
      } else if (letterType === 'investigation') {
        // Use actual patient data for investigation letter
        const patientName = actualPatientName;
        const patientAge = actualAge;
        let patientGender = actualGender;
        const claimId = actualClaimId;
        const diagnosis = actualDiagnosis;
        
        // Clean up gender parsing (in case it's needed)
        if (patientGender && patientGender !== 'Not Specified') {
          patientGender = patientGender.split('claim')[0].trim();
        }
        
        // Parse additional approval investigation for table format
        let tableContent = '';
        if (additionalApprovalInvestigation) {
          const investigations = [];
          const lines = additionalApprovalInvestigation.split('\n').filter(line => line.trim());
          
          let currentInvestigation = { particular: '', code: '', cost: '' };
          
          for (const line of lines) {
            if (line.match(/^\d+\./)) {
              // If we have a previous investigation, add it to the array
              if (currentInvestigation.particular) {
                investigations.push(currentInvestigation);
              }
              // Start new investigation
              currentInvestigation = {
                particular: line.replace(/^\d+\.\s*/, '').trim(),
                code: '-',
                cost: ''
              };
            } else if (line.includes('rate is') || line.includes('cost is') || line.includes('₹')) {
              // Extract cost information
              const costMatch = line.match(/(\d+)/);
              if (costMatch) {
                currentInvestigation.cost = costMatch[1];
              }
            } else if (line.trim() && !currentInvestigation.particular) {
              // Handle cases where investigation name is on its own line
              currentInvestigation.particular = line.trim();
            }
          }
          
          // Add the last investigation
          if (currentInvestigation.particular) {
            investigations.push(currentInvestigation);
          }

          if (investigations.length > 0) {
            tableContent = `
+--------+------+-------------------------------------+---------------+
| SR. NO.| CODE | PARTICULAR                          | APPROXIMATE   |
|        |      |                                     | COST          |
+--------+------+-------------------------------------+---------------+`;
            
            investigations.forEach((investigation, index) => {
              const srNo = String(index + 1).padStart(4);
              const code = String(investigation.code || '-').padStart(4);
              const particular = String(investigation.particular || '-').padEnd(35);
              const cost = String(investigation.cost || '-').padStart(11);
              tableContent += `
|    ${srNo}| ${code} | ${particular} |      ${cost} |`;
            });
            
            tableContent += `
+--------+------+-------------------------------------+---------------+
`;
          }
        }

        letterContent = `                                                                                                                DATE: ${new Date().toLocaleDateString('en-GB')}


TO,
The Manager,
ESIC, Sub Regional Office,
Nagpur.

Subject: Request for Additional Sanction Approval

Respected Sir,

With reference to the Claim ID No. ${claimId}, Patient Name: ${patientName}, aged ${patientAge} years, admitted under the ESIC scheme at our hospital. The patient has been diagnosed with ${diagnosis}.

In view of the above, additional investigations are essential for proper diagnosis and treatment planning.

${investigations.length > 0 ? 
`<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: monospace;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">SR. NO.</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">CODE</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: left;">PARTICULAR</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">APPROXIMATE COST (IN ₹)</th>
    </tr>
  </thead>
  <tbody>
    ${investigations.map((investigation, index) => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${investigation.code || '-'}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">${investigation.particular}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${investigation.cost || '0'}</td>
    </tr>`).join('')}
  </tbody>
</table>` : 
`<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: monospace;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">SR. NO.</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">CODE</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: left;">PARTICULAR</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">APPROXIMATE COST (IN ₹)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">1</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">-</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">No investigations found for this patient</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">0</td>
    </tr>
  </tbody>
</table>`}

We kindly request you to grant additional approval for the above investigations.

Thanking You,
Yours Faithfully,

For Hope Hospital
[Signature]
Dr. Murali B K
(Medical Superintendent)`;
      } else if (letterType === 'additionalSanctionApproval') {
        // Use actual patient data for additional sanction approval letter
        const patientName = actualPatientName;
        const patientAge = actualAge;
        let patientGender = actualGender;
        const claimId = actualClaimId;
        const diagnosis = actualDiagnosis;
        
        // Clean up gender parsing
        if (patientGender && patientGender !== 'Not Specified') {
          patientGender = patientGender.split('Claim')[0].trim();
        }

        // Debug: Log the investigation data (use correct state value)
        // Check both additionalApprovalInvestigation and additionalApprovalSurgery
        const investigationFromInvestigationField = additionalApprovalInvestigation;
        const investigationFromSurgeryField = additionalApprovalSurgery;
        
        // Use whichever field has data
        const currentInvestigationValue = investigationFromInvestigationField || investigationFromSurgeryField;
        
        console.log('🔍 Investigation Debug in letter generation:', {
          investigationFromInvestigationField,
          investigationFromSurgeryField,
          currentInvestigationValue,
          stateVariableType: typeof currentInvestigationValue,
          stateVariableLength: currentInvestigationValue?.length,
          trimmed: currentInvestigationValue?.trim(),
          letterType
        });

        // Use the current state value from the correct field
        const currentInvestigationData = currentInvestigationValue;

        // Parse investigations from the form field additionalApprovalInvestigation
        let investigations = [];
        
        if (currentInvestigationData && currentInvestigationData.trim()) {
          console.log('🔸 Found currentInvestigationData:', currentInvestigationData);
          try {
            // Parse the investigation text like "CT SCAN rate 6000\nCBC rate 1500" or "CT SCAN rate 6000, CBC rate 1500"
            const investigationText = currentInvestigationData.trim();
            // Split by both newlines and commas, then filter out empty lines
            const investigationLines = investigationText
              .split(/[\n,]/)
              .map(line => line.trim())
              .filter(line => line);
            
            console.log('🔸 Investigation lines:', investigationLines);
            
            let srNo = 1;
            investigationLines.forEach((line) => {
              // Try to parse format like "CT SCAN rate 6000" or "CBC rate 1500"
              const rateMatch = line.match(/(.+?)\s+rate\s+(\d+)/i);
              console.log('🔸 Line:', line, 'Match:', rateMatch);
              
              if (rateMatch) {
                const [, name, cost] = rateMatch;
                investigations.push({
                  srNo: srNo++,
                  code: '-',
                  particular: name.trim(),
                  cost: cost
                });
                console.log('🔸 Added investigation with rate:', { name: name.trim(), cost });
              } else {
                // If no rate found, just add the investigation name
                investigations.push({
                  srNo: srNo++,
                  code: '-',
                  particular: line,
                  cost: '0'
                });
                console.log('🔸 Added investigation without rate:', line);
              }
            });
            
            console.log('🔸 Total investigations found:', investigations.length, investigations);
          } catch (error) {
            console.error('Error parsing investigation text:', error);
          }
        }
        
        // If no investigations found in the form, try fetching from database
        if (investigations.length === 0) {
          try {
            // Fetch visit_labs for lab investigations
            const { data: visitLabs } = await supabase
              .from('visit_labs')
              .select(`*, lab:lab_id (name, CGHS_code, NABH_rates_in_rupee)`)
              .eq('visit_id', visitData.id);

            // Fetch visit_radiology for radiology investigations  
            const { data: visitRadiology } = await supabase
              .from('visit_radiology')
              .select(`*, radiology:radiology_id (name, code, cost)`)
              .eq('visit_id', visitData.id);

            let srNo = 1;
            
            // Add lab investigations to the table
            if (visitLabs && visitLabs.length > 0) {
              visitLabs.forEach((labItem: any) => {
                investigations.push({
                  srNo: srNo++,
                  code: labItem.lab?.CGHS_code || '-',
                  particular: labItem.lab?.name || 'Lab Investigation',
                  cost: labItem.lab?.NABH_rates_in_rupee || '0'
                });
              });
            }
            
            // Add radiology investigations to the table
            if (visitRadiology && visitRadiology.length > 0) {
              visitRadiology.forEach((radioItem: any) => {
                investigations.push({
                  srNo: srNo++,
                  code: radioItem.radiology?.code || '-',
                  particular: radioItem.radiology?.name || 'Radiology Investigation',
                  cost: radioItem.radiology?.cost || '0'
                });
              });
            }
          } catch (error) {
            console.error('Error fetching patient investigations from database:', error);
          }
        }
        
        // If still no investigations found, show default message
        if (investigations.length === 0) {
          investigations = [
            { srNo: 1, code: '-', particular: 'No investigations found for this patient', cost: '0' }
          ];
        }
        
        // Create HTML table content
        const tableContent = `
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: monospace;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">SR. NO.</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">CODE</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: left;">PARTICULAR</th>
      <th style="border: 1px solid #333; padding: 8px; text-align: center;">APPROXIMATE COST (IN ₹)</th>
    </tr>
  </thead>
  <tbody>
    ${investigations.map(inv => `
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${inv.srNo}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${inv.code}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: left;">${inv.particular}</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">${inv.cost}</td>
    </tr>`).join('')}
  </tbody>
</table>`;

        letterContent = `                                                                                                                DATE: ${new Date().toLocaleDateString('en-GB')}




To,
The Manager,
ESIC, Sub Regional Office,
Nagpur.

Subject: Request for Additional Sanction Approval

Respected Sir,

With reference to the Claim ID No. ${claimId}, Patient Name: ${patientName}, aged ${patientAge} years, admitted under the ESIC scheme at our hospital. The patient has been diagnosed with ${diagnosis}.

In view of the above, additional investigations are essential for proper diagnosis and treatment planning.

${tableContent}

We kindly request you to grant additional approval for the above investigations.

Thanking You,
Yours Faithfully,

For Hope Hospital
[Signature]
Dr. Murali B K
(Medical Superintendent)`;
      } else {
        toast.error("Please provide the specific approval details you would like to include in one of the boxes (Additional Approval Surgery, Additional Approval Investigation, or Extension of Stay Approval), and I will generate the letter accordingly.");
        return;
      }

      // Store the generated response
      setGeneratedResponse(letterContent);
      toast.success("Letter generated successfully!");
      
    } catch (error) {
      console.error('Error generating letter:', error);
      toast.error("Failed to generate letter: " + error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generate PDF from the response
  const handleGeneratePDF = async () => {
    if (!generatedResponse.trim()) {
      toast.error("No response available to generate PDF");
      return;
    }

    try {
      // Generate PDF using jsPDF
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      
      // Set font and add content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      let yPosition = 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      
      // Check if content contains table HTML
      if (generatedResponse.includes('<table')) {
        // Split content by table
        const parts = generatedResponse.split(/(<table[\s\S]*?<\/table>)/);
        
        for (const part of parts) {
          if (part.includes('<table')) {
            // Parse table content
            const tableMatch = part.match(/<table[\s\S]*?>([\s\S]*?)<\/table>/);
            if (tableMatch) {
              const tableHTML = tableMatch[0];
              
              // Extract table rows
              const rowMatches = tableHTML.match(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/g) || [];
              
              // Add table header
              if (rowMatches.length > 0) {
                yPosition += 2; // Further reduced space before table
                
                // Process header row
                const headerRow = rowMatches[0];
                const headerCells = headerRow.match(/<th[\s\S]*?>([\s\S]*?)<\/th>/g) || [];
                
                if (headerCells.length > 0) {
                  // Set smaller font for table headers
                  doc.setFontSize(8);
                  doc.setFont('helvetica', 'bold');
                  
                  // Draw table header with custom widths
                  let xPosition = margin;
                  const totalWidth = 170;
                  // Adjusted column widths: SR.NO (20), CODE (20), PARTICULAR (90), COST (40)
                  const columnWidths = [20, 20, 90, 40];
                  
                  headerCells.forEach((cell, index) => {
                    const cellText = cell.replace(/<[^>]*>/g, '').trim();
                    const cellWidth = columnWidths[index] || 40;
                    
                    // Draw cell border
                    doc.rect(xPosition, yPosition, cellWidth, 10);
                    
                    // Add text with proper positioning and wrapping
                    if (index === 2) { // PARTICULAR column - left aligned
                      const wrappedText = doc.splitTextToSize(cellText, cellWidth - 4);
                      doc.text(wrappedText[0], xPosition + 2, yPosition + 7);
                    } else if (index === 3) { // COST column - handle long text
                      const wrappedText = doc.splitTextToSize(cellText, cellWidth - 4);
                      doc.text(wrappedText[0], xPosition + 2, yPosition + 7);
                    } else { // Other columns - center aligned
                      const textWidth = doc.getTextWidth(cellText);
                      const centerX = xPosition + (cellWidth - textWidth) / 2;
                      doc.text(cellText, centerX, yPosition + 7);
                    }
                    
                    xPosition += cellWidth;
                  });
                  yPosition += 10;
                }
                
                // Process data rows
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                
                for (let i = 1; i < rowMatches.length; i++) {
                  const dataRow = rowMatches[i];
                  const dataCells = dataRow.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/g) || [];
                  
                  if (dataCells.length > 0) {
                    let xPosition = margin;
                    const columnWidths = [20, 20, 90, 40];
                    
                    dataCells.forEach((cell, index) => {
                      const cellText = cell.replace(/<[^>]*>/g, '').trim();
                      const cellWidth = columnWidths[index] || 40;
                      
                      // Draw cell border
                      doc.rect(xPosition, yPosition, cellWidth, 10);
                      
                      // Add text with proper positioning
                      if (index === 2) { // PARTICULAR column - left aligned
                        const wrappedText = doc.splitTextToSize(cellText, cellWidth - 4);
                        doc.text(wrappedText[0], xPosition + 2, yPosition + 7);
                      } else { // Other columns - center aligned
                        const textWidth = doc.getTextWidth(cellText);
                        const centerX = xPosition + (cellWidth - textWidth) / 2;
                        doc.text(cellText, centerX, yPosition + 7);
                      }
                      
                      xPosition += cellWidth;
                    });
                    yPosition += 10;
                    
                    // Check if we need a new page
                    if (yPosition > pageHeight - 30) {
                      doc.addPage();
                      yPosition = 20;
                    }
                  }
                }
                yPosition += 2; // Further reduced space after table
                
                // Reset font for regular text
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
              }
            }
          } else if (part.trim()) {
            // Handle regular text content
            const textLines = part.split('\n');
            for (const line of textLines) {
              if (line.trim()) {
                const splitText = doc.splitTextToSize(line.trim(), 180);
                for (const textLine of splitText) {
                  if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = 20;
                  }
                  doc.text(textLine, margin, yPosition);
                  yPosition += lineHeight;
                }
              } else {
                yPosition += lineHeight; // Add blank line
              }
            }
          }
        }
      } else {
        // Fallback for content without tables
        const splitText = doc.splitTextToSize(generatedResponse, 180);
        doc.text(splitText, margin, yPosition);
      }
      
      // Save the PDF
      doc.save(`ESIC_Approval_Letter_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("PDF generated and downloaded successfully!");
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleSaveBill = async () => {
    if (!visitId || !visitData) {
      toast.error("Visit data not available");
      return;
    }

    try {
      // Show loading toast
      toast.loading("Saving bill data...", { id: 'save-bill' });

      // Prepare sections data
      const sections = invoiceItems
        .filter(item => item.type === 'section')
        .map(item => item as SectionItem);

      // Prepare line items data
      const lineItems: any[] = [];
      invoiceItems.forEach(item => {
        if (item.type === 'main') {
          item.subItems.forEach(subItem => {
            lineItems.push({
              ...subItem,
              parentDescription: item.description
            });
          });
        }
      });

      const calculatedTotal = calculateTotalAmount();
      console.log('🔢 Current totalAmount state:', totalAmount);
      console.log('🧮 Recalculated total:', calculatedTotal);
      
      const billDataToSave = {
        patient_id: visitData.patient_id,
        bill_no: patientData.billNo,
        claim_id: validateClaimId(patientData.claimId),
        date: patientData.billDate,
        category: patientData.category,
        total_amount: calculatedTotal, // Use freshly calculated total
        sections,
        line_items: lineItems
      };

      console.log('💾 Saving bill data:', billDataToSave);
      console.log('📊 Total Amount:', totalAmount);
      console.log('📋 Line Items Count:', lineItems.length);
      console.log('📑 Sections Count:', sections.length);

      await saveBill(billDataToSave);

      // Invalidate and refetch the bill data to show saved content
      await queryClient.invalidateQueries({ queryKey: ['final-bill', visitId] });

      // Success toast
      toast.success(`✅ Bill saved successfully! Total: ₹${totalAmount.toLocaleString('en-IN')}`, {
        id: 'save-bill',
        duration: 4000
      });

    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error("Failed to save bill. Please try again.", { id: 'save-bill' });
    }
  };

  if (isLoading || isBillLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl mb-2">Loading Bill Data...</p>
          <p className="text-sm text-gray-600">Visit ID: {visitId}</p>
          <p className="text-sm text-gray-600">isLoading: {isLoading ? 'true' : 'false'}</p>
          <p className="text-sm text-gray-600">isBillLoading: {isBillLoading ? 'true' : 'false'}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-2">
            Error loading bill: {(error as Error).message}
          </p>
          <p className="text-sm text-gray-600">Visit ID: {visitId}</p>
          <p className="text-sm text-gray-600">Please check if this visit ID exists in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Discharge View Modal */}
      {showDischargeView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Discharge Summary</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        const dischargeContent = document.getElementById('discharge-content')?.innerHTML || '';
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Discharge Summary</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                .section { margin-bottom: 20px; }
                                .section-title { font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f2f2f2; }
                                .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                .info-item { margin-bottom: 8px; }
                                .info-label { font-weight: bold; display: inline-block; width: 120px; }
                              </style>
                            </head>
                            <body>
                              ${dischargeContent}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                  >
                    🖨️ Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDischargeView(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Discharge Content */}
              <div id="discharge-content">
                <div className="header">
                  <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }}>**DISCHARGE SUMMARY**</h1>
                </div>

                {/* Patient Details Section - Right after header */}
                <div className="section" style={{ marginBottom: '30px', border: '2px solid #333', padding: '15px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: 0 }}>PATIENT DETAILS</h3>
                    {patientData.name && (
                      <div style={{
                        backgroundColor: '#10B981',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🌐 Data Source: External HIMS API
                      </div>
                    )}
                    {!patientData.name && (
                      <div style={{
                        backgroundColor: '#6B7280',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        🏥 Data Source: Internal System
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <p><strong>Name:</strong> {patientData.name || visitData?.patients?.name || patientInfo?.name || 'N/A'}</p>
                      <p><strong>Age:</strong> {patientData.age || visitData?.patients?.age || patientInfo?.age || 'N/A'}</p>
                      <p><strong>Gender:</strong> {patientData.sex || visitData?.patients?.sex || patientInfo?.sex || 'N/A'}</p>
                      <p><strong>Address:</strong> {patientData.address || visitData?.patients?.address || patientInfo?.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>Visit ID:</strong> {visitData?.visit_id || 'N/A'}</p>
                      <p><strong>Registration No:</strong> {patientData.registrationNo || visitData?.patients?.registration_no || patientInfo?.registration_no || 'N/A'}</p>
                      {patientData.beneficiaryName && <p><strong>Beneficiary:</strong> {patientData.beneficiaryName}</p>}
                      {patientData.relation && <p><strong>Relation:</strong> {patientData.relation}</p>}
                      <p><strong>Service No:</strong> {visitData?.patients?.service_no || patientInfo?.service_no || 'N/A'}</p>
                      <p><strong>Admission:</strong> {visitData?.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy') : editableVisitDates?.admission_date ? format(new Date(editableVisitDates.admission_date), 'dd/MM/yyyy') : 'N/A'}</p>
                      <p><strong>Discharge:</strong> {visitData?.discharge_date ? format(new Date(visitData.discharge_date), 'dd/MM/yyyy') : editableVisitDates?.discharge_date ? format(new Date(editableVisitDates.discharge_date), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* 1. DIAGNOSIS SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}> FINAL DIAGNOSIS</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p>- Primary Diagnosis: {getDiagnosisText()}</p>
                    {savedDiagnoses.length > 0 && savedDiagnoses.map((diagnosis, index) => (
                      <p key={index}>- {diagnosis.is_primary ? 'Primary' : 'Secondary'} Diagnosis: {diagnosis.name}</p>
                    ))}
                    <p>- ICD Code: S02.6</p>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* 1.5. COMPLICATIONS SECTION */}
                {savedComplications.length > 0 && (
                  <div className="section">
                    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>COMPLICATIONS</h3>
                    <div style={{ marginLeft: '20px' }}>
                      {savedComplications.map((complication, index) => (
                        <p key={complication.id}>- {complication.is_primary ? 'Primary' : 'Secondary'} Complication: {complication.name}</p>
                      ))}
                      <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                    </div>
                  </div>
                )}

                {/* 2. MEDICATIONS TABLE */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}> DISCHARGE MEDICATIONS</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Medication Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Strength</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Route</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Dosage (English)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Dosage (Hindi)</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedMedicationData.length > 0 ? savedMedicationData.map((medication, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{medication.medication_name}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>500 mg</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Oral</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Twice daily</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>दिन में दो बार</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>10 days</td>
                        </tr>
                      )) : (
                        <tr>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Crocin Advance</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>500 mg</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Oral</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Twice daily</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>दिन में दो बार</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>10 days</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                </div>

                {/* 3. PRESENTING COMPLAINTS SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>PRESENTING COMPLAINTS</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p>A {patientData?.age || '56'}-year-old {patientData?.sex?.toLowerCase() || 'male'} presented with:</p>
                    <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                      <li>Severe pain in the right testicle</li>
                      <li>Scrotal swelling and erythema</li>
                      <li>Fever (100-102°F) lasting over 10-15 days</li>
                      <li>History of Type 2 Diabetes Mellitus and Hypertension</li>
                    </ul>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* CLINICAL SUMMARY SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>CLINICAL SUMMARY</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p>The patient had no history of trauma or prior surgery. On examination, significant swelling, tenderness, and redness were observed in the right scrotal area without discharge or foul odor. Systemically stable at presentation, except for mild dehydration.</p>
                    
                    <p style={{ marginTop: '15px' }}><strong>Vital Signs at Admission:</strong></p>
                    <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                      <li>Temperature: 98°F</li>
                      <li>Pulse: 88/min</li>
                      <li>Respiratory Rate: 21/min</li>
                      <li>BP: 120/80 mmHg</li>
                      <li>SpO₂: 98% on room air</li>
                    </ul>

                    {/* Investigation Section */}
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>Investigation:</p>
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        <li>Complete Blood Count (CBC) - Normal</li>
                        <li>Blood Sugar (Random) - 140 mg/dL</li>
                        <li>Serum Creatinine - 1.2 mg/dL</li>
                        <li>Blood Urea - 35 mg/dL</li>
                        <li>Liver Function Tests - Within normal limits</li>
                        <li>Chest X-ray - Clear lung fields</li>
                        <li>ECG - Normal sinus rhythm</li>
                      </ul>
                    </div>

                    {/* Abnormal Investigation Section */}
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>Abnormal Investigation:</p>
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        <li>White Blood Cell Count - 12,500/μL (Elevated - indicating infection)</li>
                        <li>C-Reactive Protein (CRP) - 45 mg/L (High - suggesting inflammation)</li>
                        <li>Erythrocyte Sedimentation Rate (ESR) - 65 mm/hr (Raised)</li>
                        <li>Ultrasound Scrotum - Heterogeneous echogenicity with fluid collection</li>
                        <li>Blood Culture - Positive for Staphylococcus aureus</li>
                      </ul>
                    </div>

                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* SURGICAL DETAILS SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>SURGICAL DETAILS</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p><strong>Date of Procedure:</strong> 18/04/2025</p>
                    <p style={{ marginTop: '10px' }}><strong>Procedures Performed:</strong></p>
                    <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                      <li>Inguinal Herniorrhaphy</li>
                      <li>High Inguinal Orchidectomy</li>
                      <li>Scrotal Exploration</li>
                    </ul>
                    
                    <div style={{ marginTop: '15px' }}>
                      <p><strong>Surgeon:</strong> Dr. Vishal Nandagawli</p>
                      <p><strong>Anesthetist:</strong> Dr. Aditya</p>
                    </div>
                    
                    <p style={{ marginTop: '15px' }}><strong>Intraoperative Findings:</strong></p>
                    <p style={{ marginLeft: '20px', textAlign: 'justify' }}>
                      Under spinal anesthesia, right inguinal exploration was performed for a painful right testicular mass with scrotal cellulitis. Intraoperatively, the right testis was found to be grossly infected and necrotic. A high inguinal orchidectomy was performed. Scrotal exploration revealed inflamed tissues with cellulitis, necrotic tissue was debrided. Inguinal hernial sac was identified and herniorrhaphy was done. Hemostasis was achieved, and the scrotal cavity was thoroughly irrigated with antiseptic solution. A closed suction drain was placed. Wound was closed in layers. Patient tolerated the procedure well and was shifted to recovery in stable condition. Postoperative antibiotics and monitoring initiated.
                    </p>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* TREATMENT COURSE IN HOSPITAL SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>TREATMENT COURSE IN HOSPITAL</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Initiated on IV broad-spectrum antibiotics (based on suspected infection)</li>
                      <li>Anti-inflammatory and analgesic therapy</li>
                      <li>Intravenous fluid resuscitation</li>
                      <li>Glycemic control achieved with insulin</li>
                      <li>Antihypertensive therapy continued</li>
                      <li>Close monitoring of renal function and vitals</li>
                    </ul>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* DISCHARGE CONDITION SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>DISCHARGE CONDITION</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Afebrile, vitals stable</li>
                      <li>Wound clean and healing well</li>
                      <li>Ambulatory and tolerating oral intake</li>
                      <li>Diabetes and blood pressure under control</li>
                      <li>No urinary complaints</li>
                    </ul>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* FOLLOW-UP INSTRUCTIONS SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>FOLLOW-UP INSTRUCTIONS</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p><strong>Visit:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>OPD follow-up after 7 days from discharge or earlier if needed</li>
                    </ul>
                    
                    <p style={{ marginTop: '15px' }}><strong>Medication Compliance:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Strict adherence to medication schedule</li>
                      <li>Do not skip or alter dosage without medical advice</li>
                    </ul>
                    
                    <p style={{ marginTop: '15px' }}><strong>Wound Care:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Keep surgical site dry and clean</li>
                      <li>Change dressing as advised</li>
                      <li>Report if any pus, discharge, redness, or swelling develops</li>
                      <li>Alternate day dressing</li>
                    </ul>
                    
                    <p style={{ marginTop: '15px' }}><strong>Activity & Diet:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>No heavy lifting or strenuous activity for 6 weeks</li>
                      <li>Adequate hydration and high-fiber diabetic-friendly diet</li>
                    </ul>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* WARNING SIGNS SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>WARNING SIGNS - SEEK IMMEDIATE CARE IF:</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Fever &gt;100.5°F or chills</li>
                      <li>Pain, redness, or discharge from surgical site</li>
                      <li>Swelling, hardness or tenderness in scrotum or groin</li>
                      <li>Difficulty or pain during urination</li>
                      <li>Chest pain or shortness of breath</li>
                      <li>Persistent vomiting or dizziness</li>
                    </ul>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* EMERGENCY CONTACT SECTION */}
                <div className="section">
                  <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>Emergency & Urgent Care Available 24 × 7</h3>
                  <div style={{ marginLeft: '20px' }}>
                    <p><strong>📞 Contact: 7030974619 / 9373111709</strong></p>
                    <hr style={{ border: '1px solid #ccc', margin: '15px 0', opacity: '0.5' }} />
                  </div>
                </div>

                {/* DOCTOR SIGNATURE SECTION */}
                <div className="section" style={{ marginTop: '30px' }}>
                  <div style={{ marginLeft: '20px' }}>
                    <p><strong>Dr. B.K. Murali</strong></p>
                    <p><strong>MS (Orthopaedics)</strong></p>
                    <p><strong>Director of Hope Group Of Hospital</strong></p>
                  </div>
                </div>










              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar */}
        <div className={`${isLeftSidebarCollapsed ? 'w-12' : 'flex-1'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {!isLeftSidebarCollapsed && (
                <div>
                  <h3 className="font-semibold text-lg text-blue-600">Patient Details</h3>
                  <p className="text-sm text-gray-600">Diagnoses and Complications</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 hover:bg-blue-100 ml-auto"
                onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              >
                {isLeftSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isLeftSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {/* Patient Billing History */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">📋</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Patient Billing History</h4>
                  </div>
                  <Button
                    onClick={() => navigate(`/old-bills/${visitId}`)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
                  >
                    <span className="text-lg">📄</span>
                    Show Old Bill
                  </Button>
                </div>

                {/* Debug Info */}
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div>Saved Surgeries: {savedSurgeries.length}</div>
                  <div>Visit ID: {visitId}</div>
                  {savedSurgeries.length > 0 && (
                    <div className="mt-1">
                      {savedSurgeries.map(s => (
                        <div key={s.id} className="text-xs text-gray-600">• {s.name}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-bold text-blue-700">Previously saved billing records for this patient</span></p>
                  <div className="mt-2 space-y-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700">
                          Diagnosis:
                          {savedDiagnoses.length > 0 && (
                            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {savedDiagnoses.length}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            if (visitId) {
                              console.log('Manual refresh - Visit ID:', visitId);
                              fetchSavedDiagnoses(visitId);
                            } else {
                              console.log('No visit ID available for refresh');
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Refresh
                        </button>
                      </div>
                      {savedDiagnoses.length > 0 ? (
                        <div className="mt-1 space-y-2">
                          {savedDiagnoses.map((diagnosis) => (
                            <div key={diagnosis.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                              <div className="flex-1">
                                <span className={diagnosis.is_primary ? "font-semibold text-blue-600" : "text-gray-700"}>
                                  {diagnosis.name}
                                  {diagnosis.is_primary && " (Primary)"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => togglePrimaryDiagnosis(diagnosis.id, visitId!, diagnosis.is_primary)}
                                  className={`px-2 py-1 text-xs rounded ${diagnosis.is_primary
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  title={diagnosis.is_primary ? "Remove as primary" : "Set as primary"}
                                >
                                  {diagnosis.is_primary ? "Primary" : "Set Primary"}
                                </button>
                                <button
                                  onClick={() => deleteDiagnosis(diagnosis.id, visitId!)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  title="Delete diagnosis"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500"> Not specified</span>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Bill ID: {billData?.id ? `BILL-${billData.id.slice(-8).toUpperCase()}` : 'No bill ID'}
                      </div>
                    </div>
                    <p><span className="font-bold text-green-700">Date:</span> {patientData.billDate ? format(new Date(patientData.billDate), 'dd/MM/yyyy, HH:mm:ss') : ''}</p>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-700">Surgery:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              console.log('Surgery Treatment section removed');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                          >
                            Create Rows
                          </button>
                          <button
            onClick={() => {
              if (visitId) {
                console.log('Manual surgery refresh - Visit ID:', visitId);
                fetchSavedSurgeriesFromVisit(visitId);
              } else {
                console.log('No visit ID available for surgery refresh');
              }
            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                      {savedSurgeries.length > 0 ? (
                        <div className="mt-1 space-y-2">
                          {savedSurgeries.map((surgery, index) => (
                            <div key={`${surgery.id}-${index}`} className="text-sm bg-gray-50 p-2 rounded border">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className={surgery.is_primary ? "font-semibold text-green-600" : ""}>
                                    {surgery.name} ({surgery.code})
                                    {surgery.is_primary && " (Primary)"}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    <div>NABH/NABL Rate: <span className="font-medium text-blue-600">₹{surgery.nabh_nabl_rate}</span></div>
                                    <div>Status: <span className={surgery.sanction_status === 'Sanctioned' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                                      {surgery.sanction_status || 'Not Sanctioned'}
                                    </span></div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  <button
                                    onClick={() => editSurgery(surgery)}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    title="Edit Surgery"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteSurgery(surgery.id)}
                                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                    title="Delete Surgery"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <span>None</span>
                          <div className="text-xs mt-1">
                            (savedSurgeries array length: {savedSurgeries.length})
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-700">Complications:</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={generateAIRecommendations}
                            disabled={isGeneratingRecommendations}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            {isGeneratingRecommendations ? 'Generating...' : 'AI Generate'}
                          </button>
                          <button
                            onClick={() => {
                              if (visitId) {
                                console.log('Manual complications refresh - Visit ID:', visitId);
                                fetchSavedComplications(visitId);
                              } else {
                                console.log('No visit ID available for complications refresh');
                              }
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                      {/* Display AI Generated Complications */}
                      {aiRecommendations.complications.length > 0 && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">AI Generated:</div>
                          <div className="space-y-1">
                            {aiRecommendations.complications.map((complication, index) => (
                              <div key={`ai-comp-${index}`} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                <input
                                  type="checkbox"
                                  id={`ai-complication-${index}`}
                                  checked={selectedAIComplications.includes(complication)}
                                  onChange={() => handleAIComplicationToggle(complication)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label
                                  htmlFor={`ai-complication-${index}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  {complication}
                                </label>
                                <button
                                  onClick={() => copyToClipboard(complication, 'Complication')}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Copy this complication"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {selectedAIComplications.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-green-700 font-medium">
                                  Selected: {selectedAIComplications.length} complication{selectedAIComplications.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                  onClick={copySelectedComplications}
                                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                                  title="Copy selected complications"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {selectedAIComplications.join(', ')}
                              </div>
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 text-white text-xs"
                                  onClick={() => {
                                    if (visitId) {
                                      saveSelectedComplicationsAsAdditionalDiagnoses(visitId);
                                    } else {
                                      toast.error('No visit ID available to save complications');
                                    }
                                  }}
                                >
                                  Save as Additional Diagnoses
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {savedComplications.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {savedComplications.map((complication) => (
                            <div key={complication.id} className="text-sm">
                              <span className={complication.is_primary ? "font-semibold text-orange-600" : ""}>
                                {complication.name}
                                {complication.is_primary && " (Primary)"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500"> None</span>
                      )}
                    </div>

                    {/* Labs Display */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700">Labs:</span>
                        <button
                          onClick={() => {
                            if (visitId) {
                              console.log('Manual labs refresh - Visit ID:', visitId);
                              fetchSavedLabs(visitId);
                            } else {
                              console.log('No visit ID available for labs refresh');
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Refresh
                        </button>
                      </div>
                      {/* Display AI Generated Labs */}
                      {aiRecommendations.labs.length > 0 && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">AI Generated:</div>
                          <div className="space-y-1">
                            {aiRecommendations.labs.map((lab, index) => (
                              <div key={`ai-lab-${index}`} className="flex items-center space-x-2 text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                <input
                                  type="checkbox"
                                  id={`ai-lab-${index}`}
                                  checked={selectedAILabs.includes(lab)}
                                  onChange={() => handleAILabToggle(lab)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor={`ai-lab-${index}`} className="cursor-pointer flex-1">
                                  {lab}
                                </label>
                                <button
                                  onClick={() => copyToClipboard(lab, 'Lab test')}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Copy this lab test"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {selectedAILabs.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-green-700 font-medium">
                                  Selected: {selectedAILabs.length} lab test{selectedAILabs.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                  onClick={copySelectedLabs}
                                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                                  title="Copy selected labs"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {selectedAILabs.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {savedLabData.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {savedLabData.map((lab) => (
                            <div key={lab.lab_id || lab.id} className="text-sm">
                              <span className="text-blue-600">
                                {lab.lab_name}
                              </span>
                              {lab.description && (
                                <div className="text-xs text-gray-500 ml-2">
                                  {lab.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500"> None</span>
                      )}
                    </div>

                    {/* Radiology Display */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-700">Radiology:</span>
                        <button
                          onClick={() => {
                            if (visitId) {
                              console.log('Manual radiology refresh - Visit ID:', visitId);
                              fetchSavedRadiology(visitId);
                            } else {
                              console.log('No visit ID available for radiology refresh');
                            }
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          Refresh
                        </button>
                      </div>
                      {/* Display AI Generated Radiology */}
                      {aiRecommendations.radiology.length > 0 && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">AI Generated:</div>
                          <div className="space-y-1">
                            {aiRecommendations.radiology.map((radiology, index) => (
                              <div key={`ai-radiology-${index}`} className="flex items-center space-x-2 text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                <input
                                  type="checkbox"
                                  id={`ai-radiology-${index}`}
                                  checked={selectedAIRadiology.includes(radiology)}
                                  onChange={() => handleAIRadiologyToggle(radiology)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor={`ai-radiology-${index}`} className="cursor-pointer flex-1">
                                  {radiology}
                                </label>
                                <button
                                  onClick={() => copyToClipboard(radiology, 'Radiology test')}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Copy this radiology test"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {selectedAIRadiology.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-green-700 font-medium">
                                  Selected: {selectedAIRadiology.length} radiology test{selectedAIRadiology.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                  onClick={copySelectedRadiology}
                                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                                  title="Copy selected radiology"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {selectedAIRadiology.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {savedRadiology.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {savedRadiology.map((radiology) => (
                            <div key={radiology.id} className="text-sm">
                              <span className="text-purple-600">
                                {radiology.name}
                              </span>
                              {radiology.description && (
                                <div className="text-xs text-gray-500 ml-2">
                                  {radiology.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500"> None</span>
                      )}
                    </div>

                    {/* Medications Display */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-700">Medications:</span>
                        <button
                          onClick={() => {
                            if (visitId) {
                              console.log('Manual medications refresh - Visit ID:', visitId);
                              fetchSavedMedications(visitId);
                            } else {
                              console.log('No visit ID available for medications refresh');
                            }
                          }}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Refresh
                        </button>
                      </div>
                      {/* Display AI Generated Medications */}
                      {aiRecommendations.medications.length > 0 && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs text-blue-600 font-medium mb-1">AI Generated:</div>
                          <div className="space-y-1">
                            {aiRecommendations.medications.map((medication, index) => (
                              <div key={`ai-medication-${index}`} className="flex items-center space-x-2 text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                <input
                                  type="checkbox"
                                  id={`ai-medication-${index}`}
                                  checked={selectedAIMedications.includes(medication)}
                                  onChange={() => handleAIMedicationToggle(medication)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor={`ai-medication-${index}`} className="cursor-pointer flex-1">
                                  {medication}
                                </label>
                                <button
                                  onClick={() => copyToClipboard(medication, 'Medication')}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Copy this medication"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {selectedAIMedications.length > 0 && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-green-700 font-medium">
                                  Selected: {selectedAIMedications.length} medication{selectedAIMedications.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                  onClick={copySelectedMedications}
                                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                                  title="Copy selected medications"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                {selectedAIMedications.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {savedMedications.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {savedMedications.map((medication) => (
                            <div key={medication.id} className="text-sm">
                              <span className="text-green-600">
                                {medication.name}
                              </span>
                              {medication.description && (
                                <div className="text-xs text-gray-500 ml-2">
                                  {medication.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500"> None</span>
                      )}
                    </div>

                    {/* OT Notes Section - Only show if surgery is selected and saved */}
                    {((patientInfo && patientInfo.surgeries && patientInfo.surgeries.length > 0) || (savedSurgeries && savedSurgeries.length > 0)) && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <h5 className="font-semibold text-gray-800 mb-3">OT Notes</h5>

                          {/* Surgery Information */}
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h6 className="font-semibold text-green-800 mb-2">Surgery Details</h6>
                            {/* Display surgeries from patientInfo if available */}
                            {patientInfo && patientInfo.surgeries && patientInfo.surgeries.length > 0 &&
                              patientInfo.surgeries.map((surgery: any, index: number) => (
                                <div key={`patient-surgery-${index}`} className="mb-2 p-2 bg-white rounded border">
                                  <div className="text-xs">
                                    <div><span className="font-medium">Surgery:</span> {surgery.cghs_surgery?.name || 'N/A'}</div>
                                    <div><span className="font-medium">Code:</span> {surgery.cghs_surgery?.code || 'N/A'}</div>
                                    <div><span className="font-medium">Rate:</span> ₹{surgery.cghs_surgery?.NABH_NABL_Rate || 'N/A'}</div>
                                    <div><span className="font-medium">Status:</span> {surgery.sanction_status || 'N/A'}</div>
                                  </div>
                                </div>
                              ))
                            }
                            {/* Display surgeries from savedSurgeries if patientInfo surgeries not available */}
                            {(!patientInfo || !patientInfo.surgeries || patientInfo.surgeries.length === 0) &&
                              savedSurgeries && savedSurgeries.length > 0 &&
                              savedSurgeries.map((surgery: any, index: number) => (
                                <div key={`saved-surgery-${index}`} className="mb-2 p-2 bg-white rounded border">
                                  <div className="text-xs">
                                    <div><span className="font-medium">Surgery:</span> {surgery.name || 'N/A'}</div>
                                    <div><span className="font-medium">Code:</span> {surgery.code || 'N/A'}</div>
                                    <div><span className="font-medium">Status:</span> {surgery.sanction_status || 'N/A'}</div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>

                          {/* Date Field */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">📅</span>
                              <input
                                type="datetime-local"
                                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={otNotesData.date}
                                onChange={(e) => setOtNotesData({ ...otNotesData, date: e.target.value })}
                              />
                            </div>
                          </div>



                          {/* Surgeon Field */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Surgeon</label>
                            <select
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={otNotesData.surgeon}
                              onChange={(e) => setOtNotesData({ ...otNotesData, surgeon: e.target.value })}
                            >
                              <option value="">Select Surgeon</option>
                              <option value="Dr. Vijay Sarwad">Dr. Vijay Sarwad</option>
                              <option value="Dr. Pranit Gurnule">Dr. Pranit Gurnule</option>
                            </select>
                          </div>

                          {/* Anaesthetist Field */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Anaesthetist</label>
                            <select
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={otNotesData.anaesthetist}
                              onChange={(e) => setOtNotesData({ ...otNotesData, anaesthetist: e.target.value })}
                            >
                              <option value="">Select Anaesthetist</option>
                              <option value="Dr. Pranit Gurnule">Dr. Pranit Gurnule</option>
                              <option value="Dr. Vijay Sarwad">Dr. Vijay Sarwad</option>
                            </select>
                          </div>

                          {/* Anaesthesia Field */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Anaesthesia</label>
                            <input
                              type="text"
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Type of anaesthesia"
                              value={otNotesData.anaesthesia}
                              onChange={(e) => setOtNotesData({ ...otNotesData, anaesthesia: e.target.value })}
                            />
                          </div>

                          {/* Description Field */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-gray-600">Description</label>
                              <button
                                onClick={generateAISurgeryNotes}
                                disabled={isGeneratingSurgeryNotes}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Generate AI Surgery Notes"
                              >
                                {isGeneratingSurgeryNotes ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🤖</span>
                                    <span>AI Generate</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <textarea
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-vertical"
                              rows={8}
                              placeholder="TONSILLECTOMY"
                              value={otNotesData.description}
                              onChange={(e) => setOtNotesData({ ...otNotesData, description: e.target.value })}
                              style={{
                                overflow: 'visible',
                                resize: 'vertical',
                                minHeight: '120px'
                              }}
                            />

                            {/* Print OT Notes Button */}
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    const otNotesContent = (otNotesData.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                    printWindow.document.write(
                                      '<html>' +
                                      '<head>' +
                                      '<title>OT Notes</title>' +
                                      '<style>' +
                                      'body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }' +
                                      '.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }' +
                                      '.field { margin-bottom: 10px; }' +
                                      '.label { font-weight: bold; display: inline-block; width: 120px; }' +
                                      '.description { margin-top: 15px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; }' +
                                      '</style>' +
                                      '</head>' +
                                      '<body>' +
                                      '<div class="header">' +
                                      '<h2>OPERATION THEATRE NOTES</h2>' +
                                      '</div>' +
                                      '<div class="description">' +
                                      '<pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0;">' + otNotesContent + '</pre>' +
                                      '</div>' +
                                      '</body>' +
                                      '</html>'
                                    );
                                    printWindow.document.close();
                                    printWindow.print();
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                              >
                                🖨️ Print OT Notes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Recommendations History Section */}
                    {savedAIRecommendations.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-700">AI Recommendations History:</span>
                          <button
                            onClick={() => {
                              if (visitId) {
                                console.log('Manual AI recommendations refresh - Visit ID:', visitId);
                                fetchAIRecommendations(visitId);
                              } else {
                                console.log('No visit ID available for AI recommendations refresh');
                              }
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Refresh
                          </button>
                        </div>
                        <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                          {savedAIRecommendations.map((recommendation, index) => (
                            <div key={recommendation.id} className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-purple-700">
                                  Generated: {new Date(recommendation.generated_at).toLocaleString()}
                                </div>
                                <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {recommendation.ai_model} v{recommendation.prompt_version}
                                </div>
                              </div>

                              {recommendation.surgery_names && recommendation.surgery_names.length > 0 && (
                                <div className="text-xs text-gray-600 mb-2">
                                  <strong>For surgeries:</strong> {recommendation.surgery_names.join(', ')}
                                </div>
                              )}

                              {recommendation.diagnosis_text && (
                                <div className="text-xs text-gray-600 mb-2">
                                  <strong>Diagnosis:</strong> {recommendation.diagnosis_text}
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {recommendation.complications && recommendation.complications.length > 0 && (
                                  <div>
                                    <div className="font-medium text-red-700 mb-1">Complications ({recommendation.complications.length}):</div>
                                    <div className="space-y-1">
                                      {recommendation.complications.slice(0, 2).map((comp: string, idx: number) => (
                                        <div key={idx} className="bg-red-50 p-1 rounded text-red-700">{comp}</div>
                                      ))}
                                      {recommendation.complications.length > 2 && (
                                        <div className="text-red-600">+{recommendation.complications.length - 2} more...</div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {recommendation.lab_tests && recommendation.lab_tests.length > 0 && (
                                  <div>
                                    <div className="font-medium text-green-700 mb-1">Labs ({recommendation.lab_tests.length}):</div>
                                    <div className="space-y-1">
                                      {recommendation.lab_tests.slice(0, 2).map((lab: string, idx: number) => (
                                        <div key={idx} className="bg-green-50 p-1 rounded text-green-700">{lab}</div>
                                      ))}
                                      {recommendation.lab_tests.length > 2 && (
                                        <div className="text-green-600">+{recommendation.lab_tests.length - 2} more...</div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {recommendation.radiology_procedures && recommendation.radiology_procedures.length > 0 && (
                                  <div>
                                    <div className="font-medium text-blue-700 mb-1">Radiology ({recommendation.radiology_procedures.length}):</div>
                                    <div className="space-y-1">
                                      {recommendation.radiology_procedures.slice(0, 2).map((rad: string, idx: number) => (
                                        <div key={idx} className="bg-blue-50 p-1 rounded text-blue-700">{rad}</div>
                                      ))}
                                      {recommendation.radiology_procedures.length > 2 && (
                                        <div className="text-blue-600">+{recommendation.radiology_procedures.length - 2} more...</div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {recommendation.medications && recommendation.medications.length > 0 && (
                                  <div>
                                    <div className="font-medium text-orange-700 mb-1">Medications ({recommendation.medications.length}):</div>
                                    <div className="space-y-1">
                                      {recommendation.medications.slice(0, 2).map((med: string, idx: number) => (
                                        <div key={idx} className="bg-orange-50 p-1 rounded text-orange-700">{med}</div>
                                      ))}
                                      {recommendation.medications.length > 2 && (
                                        <div className="text-orange-600">+{recommendation.medications.length - 2} more...</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-200">
                                <div className="text-xs text-gray-500">
                                  Status: <span className="capitalize font-medium">{recommendation.status}</span>
                                </div>
                                {recommendation.confidence_score && (
                                  <div className="text-xs text-gray-500">
                                    Confidence: {(recommendation.confidence_score * 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-blue-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-blue-300"></div>
                </div>
              </div>

              {/* Diagnosis Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">🔍</span>
                  </div>
                  <h4 className="font-semibold text-blue-600">Diagnosis</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Search and add diagnosis, view related complications</p>

                {/* Selected Diagnoses */}
                {selectedDiagnoses.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedDiagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="flex items-center justify-between bg-blue-50 p-2 rounded border">
                        <div>
                          <div className="font-medium text-sm text-blue-800">{diagnosis.name}</div>
                          {diagnosis.description && (
                            <div className="text-xs text-blue-600">{diagnosis.description}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-red-600"
                          onClick={() => setSelectedDiagnoses(prev => prev.filter(d => d.id !== diagnosis.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Input
                    placeholder="Search diagnoses by name, ICD code, or category..."
                    className="pl-10 text-sm"
                    value={diagnosisSearchTerm}
                    onChange={(e) => setDiagnosisSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>

                  {/* Diagnosis Dropdown */}
                  {diagnosisSearchTerm && availableDiagnoses.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {availableDiagnoses.map((diagnosis) => (
                        <div
                          key={diagnosis.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            if (!selectedDiagnoses.find(d => d.id === diagnosis.id)) {
                              setSelectedDiagnoses(prev => [...prev, diagnosis]);
                            }
                            setDiagnosisSearchTerm("");
                          }}
                        >
                          <div className="font-medium text-sm">{diagnosis.name}</div>
                          {diagnosis.description && (
                            <div className="text-xs text-gray-500">{diagnosis.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                  {selectedDiagnoses.length > 0 && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 text-white"
                        onClick={() => {
                          console.log('Save button clicked - visitId:', visitId);
                          if (visitId) {
                            saveDiagnosesToVisit(visitId);
                          } else {
                            toast.error('No visit ID available to save diagnoses');
                          }
                        }}
                      >
                        Add Diagnoses to Visit
                      </Button>

                      <Button
                        className="w-full bg-green-600 text-white"
                        onClick={() => {
                          console.log('Test fetch button clicked - Visit ID:', visitId);
                          if (visitId) {
                            fetchSavedDiagnoses(visitId);
                          } else {
                            console.log('No visit ID available for test fetch');
                          }
                        }}
                      >
                        Test Fetch Saved Diagnoses
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-green-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-green-300"></div>
                </div>
              </div>

              {/* CGHS Surgery Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">⚕️</span>
                  </div>
                  <h4 className="font-semibold text-green-600">CGHS SURGERY</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Select CGHS surgeries for the patient</p>

                {/* Selected Surgeries */}
                {selectedSurgeries.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedSurgeries.map((surgery, index) => (
                      <div key={surgery.id} className="bg-green-50 p-3 rounded border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-green-800">{surgery.name}</div>
                            <div className="text-xs text-green-600">Code: {surgery.code}</div>
                            {surgery.NABH_NABL_Rate && (
                              <div className="text-xs text-green-600">NABH Rate: ₹{surgery.NABH_NABL_Rate}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-green-600 hover:text-red-600"
                            onClick={() => setSelectedSurgeries(prev => prev.filter(s => s.id !== surgery.id))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Sanction Status Selection */}
                        <div className="flex items-center gap-2 mt-2">
                          <label className="text-xs font-medium text-gray-700">Sanction Status:</label>
                          <select
                            value={surgery.sanction_status || 'Not Sanctioned'}
                            onChange={(e) => {
                              const updatedSurgeries = [...selectedSurgeries];
                              updatedSurgeries[index] = {
                                ...surgery,
                                sanction_status: e.target.value
                              };
                              setSelectedSurgeries(updatedSurgeries);
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="Not Sanctioned">Not Sanctioned</option>
                            <option value="Sanctioned">Sanctioned</option>
                          </select>

                          {/* Primary Surgery Indicator */}
                          {index === 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Input
                    placeholder="Search surgeries by name or code..."
                    className="pl-10 text-sm"
                    value={surgerySearchTerm}
                    onChange={(e) => setSurgerySearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>

                  {/* Surgery Dropdown */}
                  {surgerySearchTerm && availableSurgeries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {availableSurgeries.map((surgery) => (
                        <div
                          key={surgery.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            if (!selectedSurgeries.find(s => s.id === surgery.id)) {
                              setSelectedSurgeries(prev => [...prev, {
                                ...surgery,
                                sanction_status: 'Not Sanctioned' // Default sanction status
                              }]);
                            }
                            setSurgerySearchTerm("");
                          }}
                        >
                          <div className="font-medium text-sm">{surgery.name}</div>
                          <div className="text-xs text-gray-500">Code: {surgery.code}</div>
                          {surgery.NABH_NABL_Rate && (
                            <div className="text-xs text-green-600">NABH Rate: ₹{surgery.NABH_NABL_Rate}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Surgeries Button */}
                {selectedSurgeries.length > 0 && (
                  <div className="mt-3 px-4 pb-4 space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 text-white"
                      onClick={() => {
                        // Use actual bill ID if exists, otherwise we'll create a new bill in the function
                        const billId = billData?.id;
                        console.log('Surgery save button clicked - billData:', billData);
                        console.log('Surgery save button clicked - visitId:', visitId);
                        console.log('Surgery save button clicked - final billId:', billId || visitId || "temp-bill-id");
                        saveSurgeriesToVisit(visitId);
                      }}
                    >
                      Save Surgeries to Visit
                    </Button>


                  </div>
                )}
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-orange-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-orange-300"></div>
                </div>
              </div>

              {/* Complications Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <span className="text-orange-600 text-xs font-bold">⚠️</span>
                  </div>
                  <h4 className="font-semibold text-orange-600">Complications mapped to diagnosis</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Monitor and manage potential complications</p>

                {/* Complications Search */}
                <div className="relative mb-3">
                  <Input
                    placeholder="Search complications..."
                    className="pl-10 text-sm"
                    value={complicationSearchTerm}
                    onChange={(e) => setComplicationSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Complications Dropdown */}
                {complicationSearchTerm.length >= 2 && (
                  <div className="mb-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                    {filteredComplications.map((complication) => (
                      <div
                        key={complication.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          if (!selectedComplications.find(s => s.id === complication.id)) {
                            setSelectedComplications([...selectedComplications, complication]);
                            setComplicationSearchTerm("");
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{complication.name}</div>
                        <div className="text-xs text-gray-500">ID: {complication.id}</div>
                      </div>
                    ))}
                    {filteredComplications.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No complications found</div>
                    )}
                  </div>
                )}

                {/* Selected Complications */}
                {selectedComplications.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Complications:</h5>
                    <div className="space-y-2">
                      {selectedComplications.map((complication, index) => (
                        <div key={complication.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                          <div>
                            <div className="font-medium text-sm">{complication.name}</div>
                            <div className="text-xs text-gray-500">
                              {index === 0 && <span className="text-orange-600 font-medium">Primary • </span>}
                              ID: {complication.id}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedComplications(selectedComplications.filter(s => s.id !== complication.id));
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Complications Button */}
                {selectedComplications.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-orange-600 text-white"
                      onClick={() => {
                        console.log('Complications save button clicked - visitId:', visitId);
                        console.log('Complications save button clicked - selectedComplications:', selectedComplications);
                        if (visitId) {
                          saveComplicationsToVisit(visitId);
                        } else {
                          toast.error('No visit ID available to save complications');
                        }
                      }}
                    >
                      Save Complications to Visit
                    </Button>

                    <Button
                      className="w-full bg-yellow-600 text-white"
                      onClick={() => {
                        console.log('Test complications fetch button clicked - Visit ID:', visitId);
                        if (visitId) {
                          fetchSavedComplications(visitId);
                        } else {
                          console.log('No visit ID available for test complications fetch');
                        }
                      }}
                    >
                      Test Fetch Saved Complications
                    </Button>
                  </div>
                )}
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-blue-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-blue-300"></div>
                </div>
              </div>

              {/* Labs Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">🧪</span>
                  </div>
                  <h4 className="font-semibold text-blue-600">Labs</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Laboratory services and tests</p>

                {/* Labs Search */}
                <div className="relative mb-3">
                  <Input
                    placeholder="Search lab services..."
                    className="pl-10 text-sm"
                    value={labSearchTerm}
                    onChange={(e) => setLabSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Labs Dropdown */}
                {labSearchTerm.length >= 2 && (
                  <div className="mb-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                    {filteredLabs.map((lab) => (
                      <div
                        key={lab.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          if (!selectedLabs.find(s => s.id === lab.id)) {
                            setSelectedLabs([...selectedLabs, lab]);
                            setLabSearchTerm("");
                            console.log('🧪 Lab selected:', lab);
                          } else {
                            console.log('⚠️ Lab already selected:', lab.name);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{lab.name}</div>
                            <div className="text-xs text-gray-500">
                              {lab.description || 'No description available'}
                            </div>
                            {lab.category && (
                              <div className="text-xs text-blue-600 mt-1">
                                📋 {lab.category}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {lab['NABH/NABL_rates_in_rupee'] && (
                              <div className="text-sm font-medium text-green-600">
                                ₹{lab['NABH/NABL_rates_in_rupee']}
                              </div>
                            )}
                            {lab['CGHS_code'] && (
                              <div className="text-xs text-gray-400">
                                {lab['CGHS_code']}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredLabs.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">
                        No lab services found for "{labSearchTerm}". Try: CBC, LFT, Blood Sugar, Thyroid
                      </div>
                    )}
                  </div>
                )}

                {/* Search Suggestions */}
                {labSearchTerm.length === 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-sm font-medium text-blue-800 mb-2">💡 Try searching for:</div>
                    <div className="flex flex-wrap gap-2">
                      {['CBC', 'LFT', 'KFT', 'Blood Sugar', 'Thyroid', 'Urine'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setLabSearchTerm(suggestion)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Labs */}
                {selectedLabs.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Selected Lab Services ({selectedLabs.length}):
                    </h5>
                    <div className="space-y-2">
                      {selectedLabs.map((lab) => (
                        <div key={lab.id} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{lab.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {lab.description || 'No description available'}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              {lab.category && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {lab.category}
                                </span>
                              )}
                              {lab['CGHS_code'] && (
                                <span className="text-xs text-gray-500">
                                  Code: {lab['CGHS_code']}
                                </span>
                              )}
                              {lab['NABH/NABL_rates_in_rupee'] && (
                                <span className="text-xs font-medium text-green-600">
                                  ₹{lab['NABH/NABL_rates_in_rupee']}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLabs(selectedLabs.filter(s => s.id !== lab.id));
                              console.log('🗑️ Lab removed:', lab.name);
                            }}
                            className="text-red-500 hover:text-red-700 text-lg font-bold ml-3"
                            title="Remove lab test"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Labs Button */}
                {selectedLabs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 text-white"
                      onClick={() => {
                        console.log('Labs save button clicked - selectedLabs:', selectedLabs);
                        console.log('Labs save button clicked - visitId:', visitId);
                        if (visitId) {
                          saveLabsToVisit(visitId);
                        } else {
                          toast.error('No visit ID available to save labs');
                        }
                      }}
                    >
                      Save Labs to Visit
                    </Button>


                  </div>
                )}
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-purple-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-purple-300"></div>
                </div>
              </div>

              {/* Radiology Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-bold">📷</span>
                  </div>
                  <h4 className="font-semibold text-purple-600">Radiology</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Imaging and radiology services</p>

                {/* Radiology Search */}
                <div className="relative mb-3">
                  <Input
                    placeholder="Search radiology services..."
                    className="pl-10 text-sm"
                    value={radiologySearchTerm}
                    onChange={(e) => setRadiologySearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Radiology Dropdown */}
                {radiologySearchTerm.length >= 2 && (
                  <div className="mb-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                    {filteredRadiology.map((radiology) => (
                      <div
                        key={radiology.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          if (!selectedRadiology.find(s => s.id === radiology.id)) {
                            setSelectedRadiology([...selectedRadiology, radiology]);
                            setRadiologySearchTerm("");
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{radiology.name}</div>
                        <div className="text-xs text-gray-500">
                          {radiology.description || 'No description available'}
                        </div>
                      </div>
                    ))}
                    {filteredRadiology.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No radiology services found</div>
                    )}
                  </div>
                )}

                {/* Selected Radiology */}
                {selectedRadiology.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Radiology Services:</h5>
                    <div className="space-y-2">
                      {selectedRadiology.map((radiology) => (
                        <div key={radiology.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                          <div>
                            <div className="font-medium text-sm">{radiology.name}</div>
                            <div className="text-xs text-gray-500">
                              {radiology.description || 'No description available'}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRadiology(selectedRadiology.filter(s => s.id !== radiology.id));
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Radiology Button */}
                {selectedRadiology.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 text-white"
                      onClick={() => {
                        console.log('Radiology save button clicked - selectedRadiology:', selectedRadiology);
                        console.log('Radiology save button clicked - visitId:', visitId);
                        if (visitId) {
                          saveRadiologyToVisit(visitId);
                        } else {
                          toast.error('No visit ID available to save radiology');
                        }
                      }}
                    >
                      Save Radiology to Visit
                    </Button>


                  </div>
                )}
              </div>

              {/* Modern Separator */}
              <div className="relative py-6 mx-4">
                <div className="flex items-center">
                  <div className="flex-grow border-t-2 border-green-300"></div>
                  <div className="mx-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-grow border-t-2 border-green-300"></div>
                </div>
              </div>

              {/* Medications Section */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">💊</span>
                  </div>
                  <h4 className="font-semibold text-green-600">Medications</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">All medications for patient</p>



                {/* Medications Search */}
                <div className="relative mb-3">
                  <Input
                    placeholder="Search medications..."
                    className="pl-10 text-sm"
                    value={medicationSearchTerm}
                    onChange={(e) => setMedicationSearchTerm(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400 text-sm">🔍</span>
                  </div>
                </div>

                {/* Medications Dropdown */}
                {medicationSearchTerm.length >= 2 && (
                  <div className="mb-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-sm">
                    {filteredMedications.map((medication) => (
                      <div
                        key={medication.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          if (!selectedMedications.find(s => s.id === medication.id)) {
                            setSelectedMedications([...selectedMedications, medication]);
                            setMedicationSearchTerm("");
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{medication.name}</div>
                        <div className="text-xs text-gray-500">
                          {medication.description || 'No description available'}
                        </div>
                      </div>
                    ))}
                    {filteredMedications.length === 0 && (
                      <div className="p-2 text-sm text-gray-500">No medications found</div>
                    )}
                  </div>
                )}

                {/* Selected Medications */}
                {selectedMedications.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Medications:</h5>
                    <div className="space-y-2">
                      {selectedMedications.map((medication) => (
                        <div key={medication.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div>
                            <div className="font-medium text-sm">{medication.name}</div>
                            <div className="text-xs text-gray-500">
                              {medication.description || 'No description available'}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMedications(selectedMedications.filter(s => s.id !== medication.id));
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Medications Button */}
                {selectedMedications.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 text-white"
                      onClick={() => {
                        console.log('Medications save button clicked - selectedMedications:', selectedMedications);
                        console.log('Medications save button clicked - visitId:', visitId);
                        if (visitId) {
                          saveMedicationsToVisit(visitId);
                        } else {
                          toast.error('No visit ID available to save medications');
                        }
                      }}
                    >
                      Save Medications to Visit
                    </Button>


                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Middle Section - Service Selection */}
        <div className={`${isMiddleSectionCollapsed ? 'w-12' : 'flex-1'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
          {/* Service Selection Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!isMiddleSectionCollapsed && (
                <div>
                  <h3 className="font-semibold text-lg text-blue-600 mb-2">Service Selection</h3>
                  <p className="text-sm text-gray-600">Search and select services for billing</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 hover:bg-blue-100 ml-auto"
                onClick={() => setIsMiddleSectionCollapsed(!isMiddleSectionCollapsed)}
              >
                {isMiddleSectionCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isMiddleSectionCollapsed && (
            <>
              {/* Service Type Tabs */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-1 text-xs">
                  {[
                    "Clinical services",
                    "Laboratory services",
                    "Radiology",
                    "Pharmacy",
                    "Implant",
                    "Blood",
                    "Surgery",
                    "Mandatory services",
                    "Physiotherapy",
                    "Consultation",
                    "Surgery for internal report and payslips",
                    "Inpatient cost",
                    "Private",
                    "Accommodation charges"
                  ].map((tab) => (
                    <Button
                      key={tab}
                      variant={activeServiceTab === tab ? "default" : "outline"}
                      size="sm"
                      className={`text-xs px-2 py-1 h-6 ${activeServiceTab === tab
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border-gray-300"
                        }`}
                      onClick={() => setActiveServiceTab(tab)}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Search and Add Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  {activeServiceTab === "Pharmacy" ? (
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-700">
                      <div>Medicine Name</div>
                      <div>Administration Time</div>
                      <div>Quantity</div>
                      <div>Instructions</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-700">
                      <div>Service Name</div>
                      <div>External Requisition</div>
                      <div>Amount(Rs.)</div>
                      <div>Description</div>
                    </div>
                  )}

                  {activeServiceTab === "Pharmacy" ? (
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Search Medicine"
                        className="text-xs h-8"
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                      />
                      <select className="text-xs h-8 border border-gray-300 rounded px-2">
                        <option value="">Select Time</option>
                        <option value="MORNING">MORNING</option>
                        <option value="AFTERNOON">AFTERNOON</option>
                        <option value="EVENING">EVENING</option>
                        <option value="NIGHT">NIGHT</option>
                        <option value="BREAKFAST_TIME">BREAKFAST TIME</option>
                        <option value="LUNCH_TIME">LUNCH TIME</option>
                        <option value="DINNER_TIME">DINNER TIME</option>
                        <option value="HS">HS</option>
                        <option value="SOS">SOS</option>
                      </select>
                      <Input
                        placeholder="Quantity"
                        className="text-xs h-8"
                        type="number"
                        min="1"
                      />
                      <Input
                        placeholder="Instructions"
                        className="text-xs h-8"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Type To Search"
                        className="text-xs h-8"
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                      />
                      <select className="text-xs h-8 border border-gray-300 rounded px-2">
                        <option>None</option>
                        <option>Required</option>
                        <option>Optional</option>
                      </select>
                      <Input
                        placeholder="Amount"
                        className="text-xs h-8"
                      />
                      <Input
                        placeholder="Description"
                        className="text-xs h-8"
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="bg-blue-600 text-white text-xs px-4 py-1 h-7"
                    onClick={() => {
                      console.log('🔍 Add More button clicked for tab:', activeServiceTab);

                      // Focus on the search input to encourage user to search
                      const searchInput = document.querySelector('input[placeholder="Type To Search"]') as HTMLInputElement;
                      if (searchInput) {
                        searchInput.focus();
                        console.log('🎯 Search input focused');

                        // Add some sample search terms based on the active tab
                        if (activeServiceTab === "Laboratory services" && !serviceSearchTerm) {
                          // Show placeholder suggestions for labs
                          searchInput.placeholder = "Try: CBC, LFT, Blood Sugar, Thyroid...";
                          setTimeout(() => {
                            searchInput.placeholder = "Type To Search";
                          }, 3000);
                        }
                      } else {
                        console.log('❌ Search input not found');
                      }

                      // If no search term, provide helpful guidance
                      if (!serviceSearchTerm) {
                        if (activeServiceTab === "Laboratory services") {
                          console.log('💡 Ready to search lab services - user should type in search box');
                        }
                      }
                    }}
                  >
                    {activeServiceTab === "Laboratory services" ? "Add More Labs" :
                      activeServiceTab === "Radiology" ? "Add More Radiologies" :
                        activeServiceTab === "Pharmacy" ? "Add More Medicines" :
                          "Add More Services"}
                  </Button>

                  {/* Available Services Dropdown */}
                  {serviceSearchTerm && (
                    <div className="mt-2 border border-gray-300 rounded max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                      {activeServiceTab === "Laboratory services" && (
                        <>
                          {(isLoadingLabServices || isSearchingLabServices) ? (
                            <div className="p-2 text-gray-500 text-sm">
                              {serviceSearchTerm.length >= 2 ? 'Searching lab services...' : 'Loading lab services...'}
                            </div>
                          ) : (
                            <>
                              {console.log('🔍 Rendering lab services dropdown:', {
                                filteredLabServices: filteredLabServices?.length || 0,
                                serviceSearchTerm,
                                activeServiceTab
                              })}
                              {filteredLabServices && filteredLabServices.length > 0 ? (
                                filteredLabServices.map((service) => (
                                  <div
                                    key={service.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🖱️ Lab service clicked:', service);
                                      console.log('🖱️ Click event:', e);
                                      console.log('🔍 Current visitId:', visitId);
                                      alert(`Lab clicked: ${service.name} - Check console for details`);
                                      await addLabServiceToInvoice(service);
                                      setServiceSearchTerm("");
                                      console.log('🔄 Search term cleared');
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-medium text-sm">{service.name}</div>
                                        <div className="text-xs text-gray-500">Code: {service.code || 'N/A'}</div>
                                      </div>
                                      <div className="text-sm font-medium">₹{service.amount || 'N/A'}</div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {serviceSearchTerm.length >= 2 ? 'No lab services found. Try: CBC, LFT, Blood Sugar' : 'Type to search lab services'}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {activeServiceTab === "Radiology" && (
                        <>
                          {(isLoadingRadiologyServices || isSearchingRadiologyServices) ? (
                            <div className="p-2 text-gray-500 text-sm">
                              {serviceSearchTerm.length >= 2 ? 'Searching radiology services...' : 'Loading radiology services...'}
                            </div>
                          ) : (
                            <>
                              {filteredRadiologyServices.map((service) => (
                                <div
                                  key={service.id}
                                  className="radiology-service-item p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  data-service-name={service.name}
                                  style={{
                                    position: 'relative',
                                    textDecoration: 'none',
                                    background: 'white',
                                    zIndex: 10,
                                    listStyle: 'none',
                                    listStyleType: 'none',
                                    display: 'block'
                                  }}
                                  onClick={() => {
                                    // Save to visit_radiology table instead of adding to invoice
                                    saveSingleRadiologyToVisit(service);
                                    setServiceSearchTerm("");
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium text-sm">{service.name}</div>
                                      <div className="text-xs text-gray-500">Code: {service.code || 'N/A'}</div>
                                    </div>
                                    <div className="text-sm font-medium">₹{service.amount || 'N/A'}</div>
                                  </div>
                                </div>
                              ))}
                              {filteredRadiologyServices.length === 0 && !isLoadingRadiologyServices && !isSearchingRadiologyServices && (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {serviceSearchTerm.length >= 2 ? 'No radiology services found' : 'Type to search radiology services'}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {activeServiceTab === "Pharmacy" && (
                        <>
                          {(isLoadingPharmacyServices || isSearchingPharmacyServices) ? (
                            <div className="p-2 text-gray-500 text-sm">
                              {serviceSearchTerm.length >= 2 ? 'Searching pharmacy services...' : 'Loading pharmacy services...'}
                            </div>
                          ) : (
                            <>
                              {filteredPharmacyServices.map((service) => (
                                <div
                                  key={service.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    // Save medication directly to visit_medications table
                                    saveSingleMedicationToVisit(service);
                                    setServiceSearchTerm("");
                                  }}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{service.name}</div>
                                      <div className="text-xs text-gray-500">Code: {service.code || 'N/A'} | Pack: {service.pack || 'N/A'}</div>
                                      <div className="text-xs text-blue-600">Batch: {service.batch_no || 'N/A'} | Stock: {service.stock || 'N/A'} | Exp: {service.expiry_date || 'N/A'}</div>
                                      <div className="text-xs text-green-600">MRP: ₹{service.mrp || 'N/A'}</div>
                                    </div>
                                    <div className="text-sm font-medium">₹{service.amount || 'N/A'}</div>
                                  </div>
                                </div>
                              ))}
                              {filteredPharmacyServices.length === 0 && !isLoadingPharmacyServices && !isSearchingPharmacyServices && (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {serviceSearchTerm.length >= 2 ? 'No pharmacy services found' : 'Type to search pharmacy services'}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}




                  {/* Selected Medications Display for Pharmacy Tab */}
                  {activeServiceTab === "Pharmacy" && selectedMedications.length > 0 && (
                    <div className="mt-4 border border-gray-300 rounded">
                      <div className="bg-gray-100 p-2 text-xs font-medium text-gray-700 border-b">
                        <div className="grid grid-cols-6 gap-2">
                          <div>Date</div>
                          <div>Service Name</div>
                          <div>External Requisition</div>
                          <div>Amount</div>
                          <div>Action</div>
                          <div>Print</div>
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {selectedMedications.map((medication, index) => (
                          <div key={medication.id} className={`grid grid-cols-6 gap-2 p-2 text-xs border-b last:border-b-0 ${index % 2 === 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <div className="flex flex-col gap-1">
                              <Input
                                type="date"
                                value={medication.date}
                                onChange={(e) => setSelectedMedications(prev =>
                                  prev.map(m => m.id === medication.id ? { ...m, date: e.target.value } : m)
                                )}
                                className="h-6 text-xs"
                              />
                              <Input
                                type="time"
                                value={medication.time}
                                onChange={(e) => setSelectedMedications(prev =>
                                  prev.map(m => m.id === medication.id ? { ...m, time: e.target.value } : m)
                                )}
                                className="h-6 text-xs"
                              />
                            </div>
                            <div>
                              <Input
                                type="text"
                                value={medication.name}
                                onChange={(e) => setSelectedMedications(prev =>
                                  prev.map(m => m.id === medication.id ? { ...m, name: e.target.value } : m)
                                )}
                                className="h-6 text-xs"
                              />
                            </div>
                            <div>
                              <Input
                                type="text"
                                value={medication.externalRequisition || '-'}
                                onChange={(e) => setSelectedMedications(prev =>
                                  prev.map(m => m.id === medication.id ? { ...m, externalRequisition: e.target.value } : m)
                                )}
                                className="h-6 text-xs"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                value={medication.amount}
                                onChange={(e) => setSelectedMedications(prev =>
                                  prev.map(m => m.id === medication.id ? { ...m, amount: e.target.value } : m)
                                )}
                                className="h-6 text-xs"
                              />
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 w-5 p-0"
                                onClick={() => setSelectedMedications(prev => prev.filter(m => m.id !== medication.id))}
                              >
                                <span className="text-xs">🗑️</span>
                              </Button>
                            </div>
                            <div>
                              <Button size="sm" variant="outline" className="h-5 w-5 p-0">
                                <span className="text-xs">🖨️</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 p-2 text-xs font-medium border-t">
                        <div className="flex justify-between mb-2">
                          <span>Total Amount</span>
                          <span>Rs. {selectedMedications.reduce((sum, med) => sum + parseFloat(med.amount || 0), 0)}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 text-white text-xs"
                          onClick={() => {
                            console.log('Medications save button clicked - selectedMedications:', selectedMedications);
                            console.log('Medications save button clicked - visitId:', visitId);
                            if (visitId) {
                              saveMedicationsToVisit(visitId);
                            } else {
                              toast.error('No visit ID available to save medications');
                            }
                          }}
                        >
                          Save Medications to Visit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Data Section */}
              {!isMiddleSectionCollapsed && (
                <div className="border-t border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">💾</span>
                      </div>
                      <h4 className="font-semibold text-blue-600">Saved Data</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      View saved lab tests, radiology, and medications for this visit
                    </p>
                  </div>

                  {/* Saved Data Tabs */}
                  <div className="p-4">
                    <div className="bg-white border border-gray-200 rounded-lg">
                      {/* Tab Headers */}
                      <div className="flex border-b border-gray-200">
                        <button
                          className={`px-4 py-2 text-sm font-medium ${savedDataTab === 'labs'
                            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={() => setSavedDataTab('labs')}
                        >
                          Lab Tests
                        </button>
                        <button
                          className={`px-4 py-2 text-sm font-medium ${savedDataTab === 'radiology'
                            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={() => setSavedDataTab('radiology')}
                        >
                          Radiology
                        </button>
                        <button
                          className={`px-4 py-2 text-sm font-medium ${savedDataTab === 'medications'
                            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                          onClick={() => setSavedDataTab('medications')}
                        >
                          Medications
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="p-4">
                        {savedDataTab === 'labs' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-medium text-gray-900">
                                Saved Lab Tests ({savedLabData.length})
                              </h5>
                              <div className="text-lg font-bold text-green-600">
                                Total: ₹{savedLabData.reduce((total, lab) => total + (parseFloat(lab.cost) || 0), 0)}
                              </div>
                            </div>
                            {savedLabData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Test Name</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Ordered Date</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Cost</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {savedLabData.map((lab, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-medium">
                                          {lab.lab_name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                          <input
                                            type="date"
                                            value={lab.ordered_date ? new Date(lab.ordered_date).toISOString().split('T')[0] : ''}
                                            onChange={(e) => updateLabField(lab.id, 'ordered_date', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-green-600">
                                          <input
                                            type="number"
                                            value={lab.cost ? String(lab.cost).replace('₹', '') : ''}
                                            onChange={(e) => updateLabField(lab.id, 'cost', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                            placeholder="Cost"
                                            min="0"
                                            step="0.01"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                          <button
                                            onClick={() => handleDeleteLabTest(lab.id)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete lab test"
                                          >
                                            🗑️
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">🧪</div>
                                <p className="font-medium">No lab tests saved for this visit</p>
                                <p className="text-sm mt-2">Search and select lab tests from the Labs section above to save them here</p>
                              </div>
                            )}
                          </div>
                        )}

                        {savedDataTab === 'radiology' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-medium text-gray-900">
                                Saved Radiology ({savedRadiologyData.length})
                              </h5>
                              <div className="text-lg font-bold text-green-600">
                                Total: ₹{savedRadiologyData.reduce((total, radiology) => total + (parseFloat(radiology.cost) || 0), 0)}
                              </div>
                            </div>
                            {savedRadiologyData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Test Name</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Ordered Date</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Cost</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {savedRadiologyData.map((radiology, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-medium">
                                          {radiology.radiology_name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                          <input
                                            type="date"
                                            value={radiology.ordered_date ? new Date(radiology.ordered_date).toISOString().split('T')[0] : ''}
                                            onChange={(e) => updateRadiologyField(radiology.id, 'ordered_date', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-green-600">
                                          <input
                                            type="number"
                                            value={radiology.cost ? String(radiology.cost).replace('₹', '') : ''}
                                            onChange={(e) => updateRadiologyField(radiology.id, 'cost', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                            placeholder="Cost"
                                            min="0"
                                            step="0.01"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                          <button
                                            onClick={() => handleDeleteRadiology(radiology.id)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete radiology test"
                                          >
                                            🗑️
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">📡</div>
                                <p>No radiology tests saved for this visit</p>
                              </div>
                            )}
                          </div>
                        )}

                        {savedDataTab === 'medications' && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-medium text-gray-900">
                                Saved Medications ({savedMedicationData.length})
                              </h5>
                              <div className="text-lg font-bold text-green-600">
                                Total: ₹{savedMedicationData.reduce((total, medication) => total + (parseFloat(medication.cost) || 0), 0)}
                              </div>
                            </div>
                            {savedMedicationData.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Medication Name</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Prescribed Date</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Cost</th>
                                      <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-900">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {savedMedicationData.map((medication, index) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-medium">
                                          {medication.medication_name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                          <input
                                            type="date"
                                            value={medication.prescribed_date ? new Date(medication.prescribed_date).toISOString().split('T')[0] :
                                              (medication.created_at ? new Date(medication.created_at).toISOString().split('T')[0] : '')}
                                            onChange={(e) => updateMedicationField(medication.id, 'prescribed_date', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-green-600">
                                          <input
                                            type="number"
                                            value={medication.cost ? String(medication.cost).replace('₹', '') : ''}
                                            onChange={(e) => updateMedicationField(medication.id, 'cost', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                                            placeholder="Cost"
                                            min="0"
                                            step="0.01"
                                          />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-center">
                                          <div className="flex items-center justify-center space-x-2">
                                            <button
                                              onClick={() => setSelectedMedication(medication)}
                                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                              title="View medication details"
                                            >
                                              👁️
                                            </button>
                                            <button
                                              onClick={() => handleDeleteMedication(medication.id)}
                                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                                              title="Delete medication"
                                            >
                                              🗑️
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">💊</div>
                                <p>No medications saved for this visit</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor's Plan Section */}
              {!isMiddleSectionCollapsed && (
                <div className="border-t border-gray-200 flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">📋</span>
                      </div>
                      <h4 className="font-semibold text-green-600">Doctor's Plan</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      View and manage the doctor's treatment plan and medical notes
                    </p>
                  </div>

                  {/* Doctor's Plan Content */}
                  <div className="flex-1 p-4 bg-gray-50">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 h-full min-h-[400px] flex flex-col">
                      {/* Doctor's Plan Document Display */}
                      <div className="flex-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 overflow-auto">
                        <div id="doctors-plan-section" className="bg-white shadow-lg rounded-lg p-4 max-w-full">
                          {/* ESIC Header */}
                          <div className="text-center border-b-2 border-black pb-2 mb-4">
                            <h2 className="text-xl font-bold">ESIC</h2>
                          </div>

                          {/* Patient Information Table - Editable */}
                          <div className="border border-black mb-4">
                            <table className="w-full text-xs">
                              <tbody>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-gray-100 w-1/6">NAME</td>
                                  <td className="border border-black p-1 w-1/3">
                                    <input
                                      type="text"
                                      value={visitData?.patients?.name || ''}
                                      readOnly
                                      className="w-full bg-transparent border-none outline-none text-xs font-medium"
                                    />
                                  </td>
                                  <td className="border border-black p-1 w-1/6"></td>
                                  <td className="border border-black p-1 w-1/3"></td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-gray-100">DATE OF ADMISSION</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="date"
                                      value={editableVisitDates.admission_date}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditableVisitDates(prev => ({ ...prev, admission_date: newValue }));
                                        saveVisitDates('admission_date', newValue);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                    />
                                  </td>
                                  <td className="border border-black p-1 font-semibold bg-gray-100">DATE OF DISCHARGE</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="date"
                                      value={editableVisitDates.discharge_date}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditableVisitDates(prev => ({ ...prev, discharge_date: newValue }));
                                        saveVisitDates('discharge_date', newValue);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-bold bg-gray-100">DATE OF SURGERY</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="date"
                                      value={editableVisitDates.surgery_date}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditableVisitDates(prev => ({ ...prev, surgery_date: newValue }));
                                        saveVisitDates('surgery_date', newValue);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs font-bold"
                                    />
                                  </td>
                                  <td className="border border-black p-1 font-semibold bg-gray-100">PACKAGE AMOUNT</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="number"
                                      value={editableVisitDates.package_amount}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        setEditableVisitDates(prev => ({ ...prev, package_amount: newValue }));
                                        saveVisitDates('package_amount', newValue);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                      placeholder="Enter amount"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-yellow-200">START OF PACKAGE</td>
                                  <td className="border border-black p-1 bg-yellow-200">
                                    <input
                                      type="date"
                                      value={packageDates.start_date}
                                      onChange={(e) => {
                                        handlePackageDateChange('start_date', e.target.value);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                      placeholder="dd/mm/yyyy"
                                    />
                                  </td>
                                  <td className="border border-black p-1 font-semibold bg-yellow-200">END OF PACKAGE</td>
                                  <td className="border border-black p-1 bg-yellow-200">
                                    <input
                                      type="date"
                                      value={packageDates.end_date}
                                      onChange={(e) => {
                                        handlePackageDateChange('end_date', e.target.value);
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs"
                                      placeholder="dd/mm/yyyy"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-gray-100">TOTAL PACKAGE DAYS</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="number"
                                      value={packageDates.total_package_days}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setPackageDates(prev => ({ ...prev, total_package_days: value }));
                                      }}
                                      className="w-full bg-transparent border-none outline-none text-xs font-semibold"
                                      min="0"
                                    />
                                  </td>
                                  <td className="border border-black p-1 font-semibold bg-gray-100">TOTAL ADMISSION DAYS</td>
                                  <td className="border border-black p-1">
                                    <input
                                      type="number"
                                      value={packageDates.total_admission_days}
                                      readOnly
                                      className="w-full bg-transparent border-none outline-none text-xs text-gray-600"
                                      placeholder="Auto-calculated"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-blue-100">PRE-SURGICAL CONSERVATIVE TREATMENT PERIOD</td>
                                  <td className="border border-black p-1 text-xs" colSpan={3}>
                                    📅 {editableVisitDates.admission_date && editableVisitDates.surgery_date ? 
                                      `${format(new Date(editableVisitDates.admission_date), 'dd/MM/yy')} - ${format(new Date(new Date(editableVisitDates.surgery_date).getTime() - 24 * 60 * 60 * 1000), 'dd/MM/yy')}` : 
                                      'Dates not set'
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-green-100">POST-SURGICAL CONSERVATIVE TREATMENT PERIOD</td>
                                  <td className="border border-black p-1 text-xs" colSpan={3}>
                                    📅 {packageDates.end_date && editableVisitDates.discharge_date ? 
                                      `${format(new Date(new Date(packageDates.end_date).getTime() + 24 * 60 * 60 * 1000), 'dd/MM/yy')} - ${format(new Date(editableVisitDates.discharge_date), 'dd/MM/yy')}` : 
                                      'Dates not set'
                                    }
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black p-1 font-semibold bg-yellow-100">SURGICAL PACKAGE PERIOD</td>
                                  <td className="border border-black p-1 text-xs" colSpan={3}>
                                    📅 {packageDates.start_date && packageDates.end_date ? 
                                      `${format(new Date(packageDates.start_date), 'dd/MM/yy')} - ${format(new Date(packageDates.end_date), 'dd/MM/yy')}` : 
                                      'Dates not set'
                                    }
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Selected Complications Section (AI Generated) */}
                          {selectedAIComplications.length > 0 && (
                            <div className="border border-black mb-4 print:border-black print:mb-4">
                              <div className="bg-blue-100 border-b border-black p-2 print:bg-gray-100 print:border-b print:border-black print:p-2">
                                <h4 className="text-sm font-semibold text-blue-800 print:text-black print:text-sm print:font-semibold">🔍 Selected Complications (AI Generated)</h4>
                              </div>
                              <div className="p-2 print:p-2">
                                <div className="grid grid-cols-1 gap-1 print:grid print:grid-cols-1 print:gap-1">
                                  {selectedAIComplications.map((complication, index) => (
                                    <div key={`esic-comp-${index}`} className="text-xs p-1 bg-blue-50 border border-blue-200 rounded print:text-xs print:p-1 print:bg-white print:border print:border-gray-300 print:rounded-none">
                                      • {complication}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Selected Labs Section */}
                          {selectedAILabs.length > 0 && (
                            <div className="border border-black mb-4 print:border-black print:mb-4">
                              <div className="bg-green-100 border-b border-black p-2 print:bg-gray-100 print:border-b print:border-black print:p-2">
                                <h4 className="text-sm font-semibold text-green-800 print:text-black print:text-sm print:font-semibold">🧪 Selected Labs (AI Generated)</h4>
                              </div>
                              <div className="p-2 print:p-2">
                                <div className="grid grid-cols-1 gap-1 print:grid print:grid-cols-1 print:gap-1">
                                  {selectedAILabs.map((lab, index) => (
                                    <div key={`esic-lab-${index}`} className="text-xs p-1 bg-green-50 border border-green-200 rounded print:text-xs print:p-1 print:bg-white print:border print:border-gray-300 print:rounded-none">
                                      • {lab}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Selected Radiology Section */}
                          {selectedAIRadiology.length > 0 && (
                            <div className="border border-black mb-4 print:border-black print:mb-4">
                              <div className="bg-purple-100 border-b border-black p-2 print:bg-gray-100 print:border-b print:border-black print:p-2">
                                <h4 className="text-sm font-semibold text-purple-800 print:text-black print:text-sm print:font-semibold">📡 Selected Radiology (AI Generated)</h4>
                              </div>
                              <div className="p-2 print:p-2">
                                <div className="grid grid-cols-1 gap-1 print:grid print:grid-cols-1 print:gap-1">
                                  {selectedAIRadiology.map((radiology, index) => (
                                    <div key={`esic-rad-${index}`} className="text-xs p-1 bg-purple-50 border border-purple-200 rounded print:text-xs print:p-1 print:bg-white print:border print:border-gray-300 print:rounded-none">
                                      • {radiology}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Selected Medications Section */}
                          {selectedAIMedications.length > 0 && (
                            <div className="border border-black mb-4 print:border-black print:mb-4">
                              <div className="bg-orange-100 border-b border-black p-2 print:bg-gray-100 print:border-b print:border-black print:p-2">
                                <h4 className="text-sm font-semibold text-orange-800 print:text-black print:text-sm print:font-semibold">💊 Selected Medications (AI Generated)</h4>
                              </div>
                              <div className="p-2 print:p-2">
                                <div className="grid grid-cols-1 gap-1 print:grid print:grid-cols-1 print:gap-1">
                                  {selectedAIMedications.map((medication, index) => (
                                    <div key={`esic-med-${index}`} className="text-xs p-1 bg-orange-50 border border-orange-200 rounded print:text-xs print:p-1 print:bg-white print:border print:border-gray-300 print:rounded-none">
                                      • {medication}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Surgeries Section */}
                          {savedSurgeries.length > 0 && (
                            <div className="border border-black mb-4 print:border-black print:mb-4">
                              <div className="bg-red-100 border-b border-black p-2 print:bg-gray-100 print:border-b print:border-black print:p-2">
                                <h4 className="text-sm font-semibold text-red-800 print:text-black print:text-sm print:font-semibold">🔪 Surgeries</h4>
                              </div>
                              <div className="p-2 print:p-2">
                                <div className="grid grid-cols-1 gap-1 print:grid print:grid-cols-1 print:gap-1">
                                  {savedSurgeries.map((surgery, index) => (
                                    <div key={`esic-surgery-${index}`} className="text-xs p-1 bg-red-50 border border-red-200 rounded print:text-xs print:p-1 print:bg-white print:border print:border-gray-300 print:rounded-none">
                                      <div className="flex items-center justify-between">
                                        <span className={surgery.is_primary ? "font-semibold" : ""}>
                                          • {surgery.name} ({surgery.code})
                                          {surgery.is_primary && " (Primary)"}
                                        </span>
                                      </div>
                                      {surgery.sanction_status && (
                                        <div className="text-xs text-gray-600 mt-1 print:text-black">
                                          Status: {surgery.sanction_status}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}





                        {/* Simple Treatment Log Table */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-800">📋 Treatment Log</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setTreatmentLogData({});
                                    // Also clear from localStorage
                                    if (visitId) {
                                      const storageKey = `doctor_plan_${visitId}`;
                                      localStorage.removeItem(storageKey);
                                    }
                                    toast.success('Doctor\'s plan cleared');
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                >
                                  🗑️ Clear All
                                </button>
                                <button
                                  onClick={handleSaveTreatmentLog}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                  💾 Submit
                                </button>
                                <button
                                  onClick={() => {
                                    const printContent = document.getElementById('doctors-plan-section');
                                    if (printContent) {
                                      const originalContent = document.body.innerHTML;
                                      document.body.innerHTML = printContent.innerHTML;
                                      window.print();
                                      document.body.innerHTML = originalContent;
                                      window.location.reload();
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                >
                                  🖨️ Print
                                </button>
                              </div>
                            </div>
                            <div className="border border-black">
                              <table className="w-full text-xs">
                                  <thead>
                                   <tr className="bg-gray-100">
                                     <th className="border border-black p-1 w-12">Day</th>
                                     <th className="border border-black p-1 w-24">Dates of stay</th>
                                     <th className="border border-black p-1 w-32">Accommodation</th>
                                     <th className="border border-black p-1 w-1/2">Medication</th>
                                     <th className="border border-black p-1 w-1/2">Lab and Radiology</th>
                                   </tr>
                                 </thead>
                                <tbody>
                                  {(() => {
                                    // Calculate dates ONCE and store them, don't recreate components
                                    const admissionDate = visitData?.admission_date || visitData?.visit_date;
                                    const dischargeDate = visitData?.discharge_date;
                                    const surgeryDate = visitData?.surgery_date;

                                    // Pre-calculate all the date information we need
                                    const dateInfo = [];
                                    if (admissionDate) {
                                      const startDate = new Date(admissionDate);
                                      const endDate = dischargeDate ? new Date(dischargeDate) : new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
                                      const surgeryStartDate = surgeryDate ? new Date(surgeryDate) : null;
                                      const packageEndDate = surgeryStartDate ? new Date(surgeryStartDate.getTime() + 6 * 24 * 60 * 60 * 1000) : null;
                                      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                      const currentDate = new Date(startDate);
                                      for (let i = 1; i <= totalDays; i++) { // Show all days without limit
                                        const isPackageDay = surgeryStartDate && packageEndDate &&
                                          currentDate >= surgeryStartDate &&
                                          currentDate <= packageEndDate;
                                        const isSurgeryDate = surgeryStartDate &&
                                          currentDate.toDateString() === surgeryStartDate.toDateString();

                                        dateInfo.push({
                                          dayNumber: i,
                                          formattedDate: format(currentDate, 'dd/MM/yy'),
                                          isPackageDay,
                                          isSurgeryDate
                                        });

                                        currentDate.setDate(currentDate.getDate() + 1);
                                      }
                                    }

                                    // Use a FIXED array of row numbers - this is the key to stable components
                                    const maxRows = dateInfo.length > 0 ? dateInfo.length : 10;
                                     return Array.from({ length: maxRows }, (_, index) => {
                                       const dayNum = index + 1;
                                       const rowData = treatmentLogData[dayNum] || { date: "", accommodation: "", medication: "", labAndRadiology: "" };
                                       const dateInfoForDay = dateInfo[index];

                                       return (
                                         <tr
                                           key={`stable-row-${dayNum}`} // Stable key that doesn't change
                                           className={dateInfoForDay?.isPackageDay ? "bg-gray-300" : ""}
                                         >
                                           <td className="border border-black p-1 text-center">{dayNum}</td>
                                           <td className="border border-black p-1 text-center">
                                             {dateInfoForDay ? (
                                               <span className={dateInfoForDay.isSurgeryDate ? "font-bold" : ""}>
                                                 {dateInfoForDay.formattedDate}
                                               </span>
                                             ) : (
                                               <input
                                                 type="text"
                                                 value={rowData.date || ''}
                                                 onChange={(e) => updateTreatmentLogData(dayNum, 'date', e.target.value)}
                                                 placeholder="Enter date..."
                                                 className="w-full bg-white border border-gray-300 rounded text-xs p-1 focus:border-blue-500 focus:outline-none"
                                               />
                                             )}
                                           </td>
                                            <td className="border border-black p-1">
                                              <select
                                                value={rowData.accommodation || ''}
                                                onChange={(e) => updateTreatmentLogData(dayNum, 'accommodation', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded text-xs p-1 focus:border-blue-500 focus:outline-none print:hidden"
                                              >
                                                <option value="">Select...</option>
                                                <option value="General Ward">General Ward</option>
                                                <option value="ICU">ICU</option>
                                              </select>
                                              <span className="hidden print:block text-xs">
                                                {rowData.accommodation || '-'}
                                              </span>
                                            </td>
                                           <td className="border border-black p-1">
                                             <textarea
                                               value={rowData.medication || ''}
                                               onChange={(e) => updateTreatmentLogData(dayNum, 'medication', e.target.value)}
                                               placeholder="Enter medication..."
                                               rows={4}
                                               className="w-full bg-white border border-gray-300 rounded text-xs p-1 focus:border-blue-500 focus:outline-none resize-vertical overflow-y-auto"
                                               style={{ minHeight: '80px' }}
                                             />
                                           </td>
                                           <td className="border border-black p-1">
                                             <textarea
                                               value={rowData.labAndRadiology || ''}
                                               onChange={(e) => updateTreatmentLogData(dayNum, 'labAndRadiology', e.target.value)}
                                               placeholder="Enter lab and radiology..."
                                               rows={4}
                                               className="w-full bg-white border border-gray-300 rounded text-xs p-1 focus:border-blue-500 focus:outline-none resize-vertical overflow-y-auto"
                                               style={{ minHeight: '80px' }}
                                             />
                                           </td>
                                         </tr>
                                       );
                                     });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Additional Approval Fields */}
                          <div className="mt-4 space-y-4 border-t border-gray-300 pt-4 page-break-before">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Additional Sanction Approval
                                </label>
                                <Textarea
                                  value={additionalApprovalSurgery}
                                  onChange={(e) => setAdditionalApprovalSurgery(e.target.value)}
                                  placeholder="Enter approval details..."
                                  className="w-full"
                                  rows={3}
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">
                                  Date of Approval
                                </label>
                                <EnhancedDatePicker
                                  value={additionalApprovalSurgeryDate}
                                  onChange={setAdditionalApprovalSurgeryDate}
                                  placeholder="Select date"
                                  isDOB={false}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Additional Approval Investigation
                                </label>
                                <Textarea
                                  value={additionalApprovalInvestigation}
                                  onChange={(e) => {
                                    console.log('🔸 Setting additionalApprovalInvestigation:', e.target.value);
                                    setAdditionalApprovalInvestigation(e.target.value);
                                  }}
                                  placeholder="Enter approval details..."
                                  className="w-full"
                                  rows={3}
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">
                                  Date of Approval
                                </label>
                                <EnhancedDatePicker
                                  value={additionalApprovalInvestigationDate}
                                  onChange={setAdditionalApprovalInvestigationDate}
                                  placeholder="Select date"
                                  isDOB={false}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Extension of Stay Approval
                                </label>
                                <Textarea
                                  value={extensionOfStayApproval}
                                  onChange={(e) => setExtensionOfStayApproval(e.target.value)}
                                  placeholder="Enter approval details..."
                                  className="w-full"
                                  rows={3}
                                />
                                <label className="block text-sm font-medium text-gray-700 mt-2 mb-2">
                                  Date of Approval
                                </label>
                                <EnhancedDatePicker
                                  value={extensionOfStayApprovalDate}
                                  onChange={setExtensionOfStayApprovalDate}
                                  placeholder="Select date"
                                  isDOB={false}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleScanDocument}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          📷 Scan Document
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUploadImage}
                          className="hover:bg-green-50 hover:border-green-300"
                        >
                          📁 Upload Image
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddOTNotes}
                          className="hover:bg-yellow-50 hover:border-yellow-300"
                        >
                          ✏️ OT Notes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Fetch all patient data first
                            await handleAddDischargeSummary();
                            // Then show the discharge view
                            setShowDischargeView(true);
                          }}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          📋 Discharge Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/no-deduction-letter/${visitId}`, { state: { patientData } })}
                          className="hover:bg-purple-50 hover:border-purple-300"
                        >
                          📄 Generate ESIC Letter
                        </Button>
                      </div>

                      {/* Common Fetch Data Box */}
                      <div className="mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Patient Data (Auto-populated on Fetch)
                          </label>
                          <Textarea
                            placeholder="Click 'Fetch Data' to populate patient information..."
                            className="min-h-[120px] resize-none"
                            value={commonFetchData}
                            onChange={(e) => setCommonFetchData(e.target.value)}
                          />
                        </div>
                      </div>

                       {/* Action Buttons */}
                       <div className="flex gap-3 mt-4">
                         <Button
                           onClick={handleFetchData}
                           disabled={isFetching}
                           variant="outline"
                           className="flex-1"
                         >
                           {isFetching ? "Fetching..." : "Fetch Data"}
                         </Button>
                         <Button
                           onClick={handleSendToAI}
                           disabled={isGeneratingPDF}
                           className="flex-1"
                         >
                           {isGeneratingPDF ? "Generating..." : "Send to AI"}
                         </Button>
                       </div>

                        {/* Response Display Box */}
                        {generatedResponse && (
                          <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold">Generated Response:</Label>
                              <Button
                                onClick={() => setIsEditingResponse(!isEditingResponse)}
                                variant="outline"
                                size="sm"
                              >
                                {isEditingResponse ? (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    View
                                  </>
                                ) : (
                                  <>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </>
                                )}
                              </Button>
                            </div>
                            {isEditingResponse ? (
                              <Textarea
                                value={generatedResponse}
                                onChange={(e) => setGeneratedResponse(e.target.value)}
                                className="min-h-[200px] max-h-[500px] resize-y"
                                placeholder="Generated response will appear here..."
                              />
                            ) : (
                              <div className="border rounded-md p-4 bg-muted/50 min-h-[200px] max-h-[500px] overflow-auto">
                                <div 
                                  dangerouslySetInnerHTML={{ __html: generatedResponse.replace(/\n/g, '<br>') }}
                                  className="whitespace-pre-wrap"
                                />
                              </div>
                            )}
                           <Button
                             onClick={handleGeneratePDF}
                             className="w-full"
                           >
                             Generate PDF
                           </Button>
                         </div>
                       )}

                      {/* Display OT Notes */}
                      {otNotes && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <h5 className="font-semibold text-yellow-800 mb-2">OT Notes:</h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{otNotes}</p>
                        </div>
                      )}

                      {/* Display Discharge Summary */}
                      {dischargeSummary && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="font-semibold text-blue-800 mb-2">Discharge Summary:</h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dischargeSummary}</p>
                        </div>
                      )}

                      {/* Mobile Number Input for API Data Fetch */}
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h5 className="font-semibold text-purple-800 mb-3 flex items-center">
                          📱 Fetch Patient Data from External API
                        </h5>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="text"
                            placeholder="Enter 10-digit mobile number"
                            className="flex-1 h-8"
                            maxLength={10}
                            value={patientData.contactNo}
                            onChange={(e) => {
                              const phoneNumber = e.target.value;
                              handlePatientDataChange('contactNo', phoneNumber);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs bg-purple-100 hover:bg-purple-200"
                            onClick={async () => {
                              if (patientData.contactNo && patientData.contactNo.length === 10) {
                                await fetchPatientDataByPhone(patientData.contactNo);
                                // After fetching external data, also fetch internal data
                                await handleAddDischargeSummary();
                              } else {
                                toast.error('Please enter a valid 10-digit phone number');
                              }
                            }}
                            disabled={isFetchingExternalData}
                          >
                            {isFetchingExternalData ? '⏳ Fetching...' : '🔄 Fetch Data'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs bg-blue-100 hover:bg-blue-200"
                            onClick={async () => {
                              // Test with the provided phone number
                              const testPhone = "7987698920";
                              handlePatientDataChange('contactNo', testPhone);
                              await fetchPatientDataByPhone(testPhone);
                              await handleAddDischargeSummary();
                            }}
                            disabled={isFetchingExternalData}
                          >
                            {isFetchingExternalData ? '⏳ Testing...' : '🧪 Test API'}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => {
                              if (patientData.contactNo && patientData.contactNo.length === 10) {
                                // Fetch external data first
                                await fetchPatientDataByPhone(patientData.contactNo);
                                // Then fetch internal data
                                await handleAddDischargeSummary();
                                // Finally generate AI summary
                                await generateFinalDischargeSummary();
                              } else {
                                toast.error('Please enter a valid 10-digit phone number');
                              }
                            }}
                            disabled={isGeneratingDischargeSummary || isFetchingExternalData}
                          >
                            {isGeneratingDischargeSummary ? '⏳ Generating...' : isFetchingExternalData ? '⏳ Fetching...' : '🚀 Generate Summary'}
                          </Button>
                          {externalApiData && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
                              onClick={() => setShowExternalDataModal(true)}
                            >
                              📊 Show API Data
                            </Button>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-purple-600">
                            Enter mobile number to fetch patient data from external HIMS API, then generate discharge summary
                          </p>
                          {patientData.contactNo && patientData.name && (
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              ✅ External API Data Loaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Patient Data Summary Card */}
                      {allPatientData && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
                            📊 Patient Data Summary
                            <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                              {allPatientData.split('\n\n').length} sections loaded
                            </span>
                          </h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Patient:</strong> {visitData?.patients?.name || patientData.name || 'N/A'}</p>
                              <p><strong>Age:</strong> {visitData?.patients?.age || patientData.age || 'N/A'} years</p>
                              <p><strong>Gender:</strong> {visitData?.patients?.gender || patientData.sex || 'N/A'}</p>
                            </div>
                            <div>
                              <p><strong>Address:</strong> {patientData.address || 'N/A'}</p>
                              <p><strong>Data Source:</strong>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                                  patientData.name
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {patientData.name ? '🌐 External HIMS API + Internal' : '🏥 Internal System Only'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowDischargeView(true)}
                              className="text-xs bg-blue-100 hover:bg-blue-200"
                            >
                              📄 View Full Discharge Summary
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={generateFinalDischargeSummary}
                              disabled={isGeneratingDischargeSummary}
                              className="text-xs bg-green-100 hover:bg-green-200"
                            >
                              {isGeneratingDischargeSummary ? '⏳ Generating...' : '🤖 Generate AI Summary'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* All Patient Data Text Box */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📋 All Patient Data (Auto-populated when Discharge Summary is clicked):
                        </label>
                        <div className={`border-2 rounded-md ${allPatientData ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
                          <textarea
                            className={`w-full h-40 p-3 rounded-md text-xs font-mono resize-vertical ${allPatientData ? 'bg-green-50' : 'bg-white'}`}
                            value={allPatientData}
                            onChange={(e) => setAllPatientData(e.target.value)}
                            placeholder="Click '📋 Discharge Summary' button above to fetch all patient data..."
                            style={{ fontSize: '10px', lineHeight: '1.2', border: 'none' }}
                          />
                          {allPatientData && (
                            <div className="px-3 pb-2 text-xs text-green-600 font-medium">
                              ✅ Patient data loaded successfully! ({allPatientData.length} characters)
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchAllPatientData}
                            className="text-xs"
                          >
                            Refresh Data
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(allPatientData);
                              toast.success('Data copied to clipboard!');
                            }}
                            className="text-xs"
                          >
                            Copy Data
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAllPatientData('')}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={generateFinalDischargeSummary}
                            disabled={isGeneratingDischargeSummary}
                            className="text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            {isGeneratingDischargeSummary ? 'Generating...' : 'Final Discharge'}
                          </Button>
                        </div>
                      </div>

                      {/* Final Discharge Summary Text Box */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Generated Professional Discharge Summary:
                        </label>
                        <textarea
                          className="w-full h-96 p-3 border border-gray-300 rounded-md text-sm resize-vertical"
                          value={finalDischargeSummary}
                          onChange={(e) => setFinalDischargeSummary(e.target.value)}
                          placeholder="Click 'Final Discharge' button to generate professional discharge summary..."
                          style={{ fontSize: '12px', lineHeight: '1.4' }}
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(finalDischargeSummary);
                              toast.success('Discharge summary copied to clipboard!');
                            }}
                            className="text-xs"
                          >
                            📋 Copy Summary
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFinalDischargeSummary('')}
                            className="text-xs"
                          >
                            🗑️ Clear Summary
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`
                            <html>
                              <head>
                                <title>Discharge Summary</title>
                                <style>
                                  body {
                                    font-family: Arial, sans-serif;
                                    margin: 20px;
                                    line-height: 1.6;
                                    color: #333;
                                  }
                                  h1, h2, h3 {
                                    color: #2c3e50;
                                    margin-top: 20px;
                                    margin-bottom: 10px;
                                  }
                                  table {
                                    border-collapse: collapse;
                                    width: 100%;
                                    margin: 10px 0;
                                  }
                                  th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                  }
                                  th {
                                    background-color: #f2f2f2;
                                    font-weight: bold;
                                  }
                                  ul, ol {
                                    margin: 10px 0;
                                    padding-left: 20px;
                                  }
                                  .section {
                                    margin-bottom: 20px;
                                  }
                                  strong {
                                    color: #2c3e50;
                                  }
                                  pre {
                                    white-space: pre-wrap;
                                    font-family: Arial, sans-serif;
                                    font-size: 14px;
                                  }
                                </style>
                              </head>
                              <body>
                                <div style="text-align: center; margin-bottom: 30px;">
                                  <h1 style="border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">DISCHARGE SUMMARY</h1>
                                  <p style="margin: 5px 0; color: #666;">Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
                                </div>
                                <pre>${finalDischargeSummary}</pre>
                              </body>
                            </html>
                          `);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }}
                            className="text-xs"
                          >
                            🖨️ Print Summary
                          </Button>
                        </div>
                      </div>
                      {/* Status Indicator */}
                      {externalApiData && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <span className="text-green-600">✅</span>
                            <span className="font-medium">External API Data Loaded</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-gray-50 min-h-full font-sans">
            <style>{`
            /* CRITICAL: Hide print-only elements on screen to prevent duplication */
            .print-only {
              display: none !important;
              visibility: hidden !important;
            }
            .screen-only {
              display: block !important;
              visibility: visible !important;
            }

            /* Ensure inline elements work properly */
            span.screen-only {
              display: inline !important;
            }
            span.print-only {
              display: none !important;
            }

            /* Print-specific styles for better page breaks */
            @media print {
              .printable-area {
                page-break-inside: avoid;
              }
              .avoid-break {
                page-break-inside: avoid;
              }
              .page-break-before {
                page-break-before: always;
              }
              .page-break-after {
                page-break-after: always;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              .footer-print-space {
                margin-top: 2rem;
                page-break-inside: avoid;
              }
            }

            @media print {
              .print-only {
                display: block !important;
                visibility: visible !important;
              }
              .screen-only {
                display: none !important;
                visibility: hidden !important;
              }
              .no-print {
                display: none !important;
              }
              span.print-only {
                display: inline !important;
              }
              span.screen-only {
                display: none !important;
              }

              /* Ensure total appears only once and is bold */
              .final-total-container {
                page-break-inside: avoid !important;
                page-break-before: avoid !important;
                background-color: #000000 !important;
                color: #ffffff !important;
                font-weight: 900 !important;
                font-size: 20px !important;
                margin: 20px 0 !important;
                padding: 16px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>
            <div className="max-w-7xl mx-auto bg-white shadow-lg p-6 printable-area avoid-break">
              {/* Header - Updated to match the design */}
              <div className="text-center mb-6">
                <div className="border-2 border-black p-2 mb-2">
                  <h1 className="text-2xl font-bold tracking-wider print:text-xl">FINAL BILL</h1>
                </div>
                <div className="border-2 border-black p-2 mb-2">
                  <h2 className="text-xl font-bold tracking-wider print:text-xl">ESIC</h2>
                </div>
                <div className="border-2 border-black p-2">
                  <h3 className="text-lg font-semibold tracking-wide print:text-xl print:font-bold">
                    CLAIM ID -
                    <span className="screen-only ml-2">
                      <Input
                        type="text"
                        className="inline-block w-48 h-8 text-center font-bold"
                        value={patientData.claimId}
                        onChange={(e) => handlePatientDataChange('claimId', e.target.value)}
                      />
                    </span>
                    <span className="print-only ml-2 font-bold" style={{ display: 'none' }}>{patientData.claimId || ''}</span>
                  </h3>
                </div>
              </div>

              {/* Patient Info */}
              <div className="flex justify-end text-sm -mb-4">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">DATE:</span>
                  <span className="screen-only">
                    <Input type="date" className="h-7 w-40" value={patientData.billDate} onChange={(e) => handlePatientDataChange('billDate', e.target.value)} />
                  </span>
                  <span className="print-only" style={{ display: 'none' }}>{patientData.billDate ? format(new Date(patientData.billDate), 'dd/MM/yyyy') : ''}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-12 text-sm mt-4 pb-4 border-0 patient-info-grid">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-semibold w-40">BILL NO:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.billNo} onChange={(e) => handlePatientDataChange('billNo', e.target.value)} />
                    </span>
                    <span className="print-only" style={{ display: 'none' }}>{patientData.billNo || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">REGISTRATION NO:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.registrationNo} onChange={(e) => handlePatientDataChange('registrationNo', e.target.value)} />
                    </span>
                    <span className="print-only" style={{ display: 'none' }}>{patientData.registrationNo || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">NAME OF PATIENT:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.name} onChange={(e) => handlePatientDataChange('name', e.target.value)} />
                    </span>
                    <span className="print-only" style={{ display: 'none' }}>{patientData.name || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">AGE:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.age} onChange={(e) => handlePatientDataChange('age', e.target.value)} />
                    </span>
                    <span className="print-only" style={{ display: 'none' }}>{patientData.age || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">SEX:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.sex} onChange={(e) => handlePatientDataChange('sex', e.target.value)} />
                    </span>
                    <span className="print-only" style={{ display: 'none' }}>{patientData.sex || ''}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="font-semibold w-40">ADDRESS:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.address} onChange={(e) => handlePatientDataChange('address', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.address || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">NAME OF ESIC BENEFICIARY:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.beneficiaryName} onChange={(e) => handlePatientDataChange('beneficiaryName', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.beneficiaryName || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">RELATION WITH IP:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.relation} onChange={(e) => handlePatientDataChange('relation', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.relation || ''}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-semibold w-40">DATE OF ADMISSION:</span>
                    <span className="screen-only">
                      <Input type="date" className="h-7 w-full" value={patientData.dateOfAdmission} onChange={(e) => handlePatientDataChange('dateOfAdmission', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.dateOfAdmission ? format(new Date(patientData.dateOfAdmission), 'dd/MM/yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">DATE OF DISCHARGE:</span>
                    <span className="screen-only">
                      <Input type="date" className="h-7 w-full" value={patientData.dateOfDischarge} onChange={(e) => handlePatientDataChange('dateOfDischarge', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.dateOfDischarge ? format(new Date(patientData.dateOfDischarge), 'dd/MM/yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">IP NO.:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.ipNo || ''} onChange={(e) => handlePatientDataChange('ipNo', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.ipNo || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">SERVICE NO:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full" value={patientData.serviceNo} onChange={(e) => handlePatientDataChange('serviceNo', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.serviceNo || ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold w-40">CATEGORY:</span>
                    <span className="screen-only">
                      <Input className="h-7 w-full bg-green-200" value={patientData.category} onChange={(e) => handlePatientDataChange('category', e.target.value)} />
                    </span>
                    <span className="print-only">{patientData.category || ''}</span>
                  </div>
                  <div>
                    <span className="font-semibold block mb-1">DIAGNOSIS:</span>
                    <span className="screen-only block">
                      <Textarea className="mt-1" value={patientData.diagnosis} onChange={(e) => handlePatientDataChange('diagnosis', e.target.value)} />

                    </span>
                    <span className="print-only block mt-1">
                      {patientData.diagnosis || 'No diagnosis recorded'}
                    </span>
                  </div>


                </div>
              </div>



              {/* Invoice Table */}
              <div className="mt-4">
                <table className="w-full border-collapse border border-gray-400 text-sm">
                  <thead className="bg-gray-200 text-black">
                    <tr>
                      <th className="border border-gray-400 p-2 w-12">SR.NO</th>
                      <th className="border border-gray-400 p-2">ITEM</th>
                      <th className="border border-gray-400 p-2 w-28">CGHS NABH CODE No.</th>
                      <th className="border border-gray-400 p-2 w-40">CGHS NABH RATE</th>
                      <th className="border border-gray-400 p-2 w-16">QTY</th>
                      <th className="border border-gray-400 p-2 w-28">AMOUNT</th>
                      <th className="border border-gray-400 p-2 w-32 no-print">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, mainIndex) => {
                      if (item.type === 'section') {
                        const isVisible = item.isOpen;
                        if (!isVisible) return null;
                        return (
                          <tr className="bg-gray-100 font-bold" key={`${item.id}-${mainIndex}`}>
                            <td colSpan={6} className="border border-gray-400 p-2">
                              <p>{getSectionTitle(item)}</p>
                              <div className="w-1/2 mt-1 screen-only">
                                <DateRangePicker
                                  date={item.dates}
                                  onDateChange={(newDate) => handleItemChange(item.id, null, 'dates', newDate)}
                                />
                              </div>
                              {item.additionalDateRanges && item.additionalDateRanges.length > 0 && item.additionalDateRanges.map((dateRange, index) => (
                                <div key={`additional-${index}`} className="w-1/2 mt-1 screen-only">
                                  <DateRangePicker
                                    date={dateRange}
                                    onDateChange={(newDate) => {
                                      const updatedRanges = [...(item.additionalDateRanges || [])];

                                      // Always ensure we have a valid date range
                                      if (newDate && (newDate.from || newDate.to)) {
                                        // If only from is selected, set to as the same date
                                        if (newDate.from && !newDate.to) {
                                          updatedRanges[index] = { from: newDate.from, to: newDate.from };
                                        } else {
                                          updatedRanges[index] = newDate;
                                        }
                                      } else {
                                        // Keep the existing date range if newDate is invalid
                                        updatedRanges[index] = dateRange || { from: new Date(), to: new Date() };
                                      }

                                      handleItemChange(item.id, null, 'additionalDateRanges', updatedRanges);
                                    }}
                                  />
                                </div>
                              ))}
                              <span className="print-only text-sm">
                                {item.title === 'Conservative Treatment' ? (
                                  <>
                                    <div className="flex items-center gap-2 mb-1">
                                      📅 {editableVisitDates.admission_date && editableVisitDates.surgery_date ? 
                                        `${format(new Date(editableVisitDates.admission_date), 'dd/MM/yy')} - ${format(new Date(new Date(editableVisitDates.surgery_date).getTime() - 24 * 60 * 60 * 1000), 'dd/MM/yy')}` : 
                                        'Pre-surgical dates not set'
                                      }
                                    </div>
                                    <div className="flex items-center gap-2">
                                      📅 {packageDates.end_date && editableVisitDates.discharge_date ? 
                                        `${format(new Date(new Date(packageDates.end_date).getTime() + 24 * 60 * 60 * 1000), 'dd/MM/yy')} - ${format(new Date(editableVisitDates.discharge_date), 'dd/MM/yy')}` : 
                                        'Post-surgical dates not set'
                                      }
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {item.dates?.from && format(item.dates.from, 'dd/MM/yyyy')} TO {item.dates?.to && format(item.dates.to, 'dd/MM/yyyy')}
                                    {item.additionalDateRanges && item.additionalDateRanges.map((dateRange, index) => (
                                      <span key={`print-${index}`} className="block" style={{ marginLeft: '20px' }}>
                                        {dateRange?.from && format(dateRange.from, 'dd/MM/yyyy')} TO {dateRange?.to && format(dateRange.to, 'dd/MM/yyyy')}
                                      </span>
                                    ))}
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="border border-gray-400 p-2 text-center no-print">
                              <Button variant="ghost" size="sm" onClick={() => toggleSection(item.id)}>{item.isOpen ? 'v' : '>'}</Button>
                            </td>
                          </tr>
                        );
                      }
                      // For main items
                      const mainRows: JSX.Element[] = [];
                      mainRows.push(
                        <tr className="bg-gray-100 font-semibold" key={`${item.id}-${mainIndex}-main`}>
                          <td className="border border-gray-400 p-2">{item.srNo}</td>
                          <td className="border border-gray-400 p-2" colSpan={5}>
                            <span className="screen-only">
                              <div className="flex items-center gap-2">
                                <Input type="text" className="h-7 font-semibold flex-1" value={item.description} onChange={(e) => handleItemChange(item.id, null, 'description', e.target.value)} />
                                {item.description === 'Consultation for Inpatients' && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1">
                                    🔄 <span className="font-medium">Auto-synced with Conservative Treatment</span>
                                  </span>
                                )}
                              </div>
                            </span>
                            <span className="print-only font-semibold">
                              {item.description}
                              {item.description === 'Consultation for Inpatients' && (
                                <span className="text-xs text-gray-600 ml-2">(Auto-synced dates)</span>
                              )}
                            </span>
                          </td>
                          <td className="border border-gray-400 p-2 text-center no-print">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7" onClick={() => handleAddItem(item.id)}>
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </td>
                        </tr>
                      );
                      item.subItems.forEach((subItem) => {
                        const standardItem = subItem as StandardSubItem;
                        const finalAmount = Number(standardItem.amount) || 0;
                        mainRows.push(
                          <tr key={`${item.id}-${mainIndex}-${subItem.id}`}>
                            <td className="border border-gray-400 p-2 text-center">{subItem.srNo}</td>
                            <td className="border border-gray-400 p-2">
                              <div className="screen-only">
                                {item.description === 'Consultation for Inpatients' ? (
                                  <div>
                                    <Select
                                      value={subItem.description === 'Select Doctor' ? '' : subItem.description}
                                      onValueChange={(value) => handleItemChange(item.id, subItem.id, 'description', value)}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Doctor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {surgeons.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <div className="mt-2 space-y-2">
                                      <DateRangePicker
                                        date={subItem.dates}
                                        onDateChange={(newDate) => {
                                          handleItemChange(item.id, subItem.id, 'dates', newDate);
                                          // Calculate days and update qty and amount
                                          if (newDate && newDate.from && newDate.to) {
                                            const days = Math.ceil((newDate.to.getTime() - newDate.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const rate = (subItem as StandardSubItem).rate || 0;
                                            handleItemChange(item.id, subItem.id, 'qty', days);
                                            handleItemChange(item.id, subItem.id, 'amount', rate * days);
                                          }
                                        }}
                                      />
                                      <DateRangePicker
                                        date={(subItem as StandardSubItem).additionalDateRanges?.[0]}
                                        onDateChange={(newDate) => {
                                          const currentRanges = (subItem as StandardSubItem).additionalDateRanges || [];
                                          const updatedRanges = [...currentRanges];
                                          if (newDate) {
                                            updatedRanges[0] = newDate;
                                          } else {
                                            updatedRanges.splice(0, 1);
                                          }
                                          handleItemChange(item.id, subItem.id, 'additionalDateRanges', updatedRanges);

                                          // Calculate additional days and add to qty and amount
                                          if (newDate && newDate.from && newDate.to) {
                                            const additionalDays = Math.ceil((newDate.to.getTime() - newDate.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const mainDays = subItem.dates && subItem.dates.from && subItem.dates.to ?
                                              Math.ceil((subItem.dates.to.getTime() - subItem.dates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
                                            const totalDays = mainDays + additionalDays;
                                            const rate = (subItem as StandardSubItem).rate || 0;
                                            handleItemChange(item.id, subItem.id, 'qty', totalDays);
                                            handleItemChange(item.id, subItem.id, 'amount', rate * totalDays);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : item.description === 'Accommodation Charges' ? (
                                  <div>
                                    <Select
                                      value={subItem.description}
                                      onValueChange={(value) => handleItemChange(item.id, subItem.id, 'description', value)}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Accommodation Type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {accommodationOptions.map(option => (
                                          <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="mt-2 space-y-2">
                                      <DateRangePicker
                                        date={subItem.dates}
                                        onDateChange={(newDate) => {
                                          handleItemChange(item.id, subItem.id, 'dates', newDate);
                                          // Calculate days and update qty and amount
                                          if (newDate && newDate.from && newDate.to) {
                                            const days = Math.ceil((newDate.to.getTime() - newDate.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const rate = (subItem as StandardSubItem).rate || 0;
                                            handleItemChange(item.id, subItem.id, 'qty', days);
                                            handleItemChange(item.id, subItem.id, 'amount', rate * days);
                                          }
                                        }}
                                      />
                                      <DateRangePicker
                                        date={(subItem as StandardSubItem).additionalDateRanges?.[0]}
                                        onDateChange={(newDate) => {
                                          const currentRanges = (subItem as StandardSubItem).additionalDateRanges || [];
                                          const updatedRanges = [...currentRanges];
                                          if (newDate) {
                                            updatedRanges[0] = newDate;
                                          } else {
                                            updatedRanges.splice(0, 1);
                                          }
                                          handleItemChange(item.id, subItem.id, 'additionalDateRanges', updatedRanges);

                                          // Calculate additional days and add to qty and amount
                                          if (newDate && newDate.from && newDate.to) {
                                            const additionalDays = Math.ceil((newDate.to.getTime() - newDate.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const mainDays = subItem.dates && subItem.dates.from && subItem.dates.to ?
                                              Math.ceil((subItem.dates.to.getTime() - subItem.dates.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
                                            const totalDays = mainDays + additionalDays;
                                            const rate = (subItem as StandardSubItem).rate || 0;
                                            handleItemChange(item.id, subItem.id, 'qty', totalDays);
                                            handleItemChange(item.id, subItem.id, 'amount', rate * totalDays);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : ['Pathology Charges', 'Medicine Charges'].includes(item.description) ? (
                                  <div>
                                    <p className="flex items-center h-8 text-sm">{subItem.description}</p>
                                    <div className="mt-2">
                                      <DateRangePicker
                                        date={subItem.dates}
                                        onDateChange={(newDate) => {
                                          handleItemChange(item.id, subItem.id, 'dates', newDate);
                                          // Calculate days and update qty and amount
                                          if (newDate && newDate.from && newDate.to) {
                                            const days = Math.ceil((newDate.to.getTime() - newDate.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                            const rate = (subItem as StandardSubItem).rate || 0;
                                            handleItemChange(item.id, subItem.id, 'qty', days);
                                            handleItemChange(item.id, subItem.id, 'amount', rate * days);
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <Input type="text" className="h-8" value={subItem.description} onChange={(e) => handleItemChange(item.id, subItem.id, 'description', e.target.value)} />
                                )}

                              </div>
                              <div className="print-only">
                                {subItem.description}
                                {(item.description === 'Consultation for Inpatients' || item.description === 'Accommodation Charges' || item.description === 'Pathology Charges' || item.description === 'Medicine Charges') && (
                                  <div className="text-xs mt-1">
                                    {subItem.dates && subItem.dates.from && subItem.dates.to && (
                                      <div>
                                        {`${format(subItem.dates.from, 'dd/MM/yy')} TO ${format(subItem.dates.to, 'dd/MM/yy')}.`}
                                      </div>
                                    )}
                                    {(subItem as StandardSubItem).additionalDateRanges?.[0] && (subItem as StandardSubItem).additionalDateRanges?.[0].from && (subItem as StandardSubItem).additionalDateRanges?.[0].to && (
                                      <div>
                                        {`      ${format((subItem as StandardSubItem).additionalDateRanges![0].from!, 'dd/MM/yy')} TO ${format((subItem as StandardSubItem).additionalDateRanges![0].to!, 'dd/MM/yy')}.`}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>


                            </td>
                            <td className="border border-gray-400 p-2">
                              <span className="screen-only">
                                <Input type="text" className="h-8 w-full text-center" value={subItem.code || ''} onChange={(e) => handleItemChange(item.id, subItem.id, 'code', e.target.value)} />
                              </span>
                              <span className="print-only text-center block">
                                {(() => {

                                  return subItem.code || '';
                                })()}
                              </span>
                            </td>
                            <td className="border border-gray-400 p-2">
                              <span className="screen-only">
                                <Input
                                  type="number"
                                  value={(subItem as StandardSubItem).rate}
                                  onChange={(e) => handleItemChange(item.id, subItem.id, 'rate', parseFloat(e.target.value) || 0)}
                                  className="w-24 h-8"
                                />
                              </span>
                              <span className="print-only text-center block">{(subItem as StandardSubItem).rate}</span>
                            </td>
                            <td className="border border-gray-400 p-2">
                              <span className="screen-only">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={subItem.qty}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value, 10) || 0;
                                    handleItemChange(item.id, subItem.id, 'qty', newQty);
                                    // Auto-calculate amount
                                    const rate = (subItem as StandardSubItem).rate || 0;
                                    const newAmount = rate * newQty;
                                    handleItemChange(item.id, subItem.id, 'amount', newAmount);
                                  }}
                                  onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    const newQty = parseInt(target.value, 10) || 0;
                                    handleItemChange(item.id, subItem.id, 'qty', newQty);
                                    // Auto-calculate amount
                                    const rate = (subItem as StandardSubItem).rate || 0;
                                    const newAmount = rate * newQty;
                                    handleItemChange(item.id, subItem.id, 'amount', newAmount);
                                  }}
                                  className="w-16 h-8 text-center"
                                  placeholder="Days"
                                />
                              </span>
                              <span className="print-only text-center block">
                                {subItem.qty}
                              </span>
                            </td>
                            <td className="border border-gray-400 p-2 text-right font-semibold">
                              {(Number((subItem as StandardSubItem).amount) || 0).toFixed(0)}
                            </td>
                            <td className="border border-gray-400 p-2 text-center no-print">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSubItem(item.id, subItem.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      });
                      if (item.description && item.description === 'Medicine Charges') {
                        mainRows.push(
                          <tr key={`${item.id}-${mainIndex}-medicine-note`}>
                            <td className="border-r border-gray-400 p-2 text-right font-semibold">Note:</td>
                            <td className="border-l border-gray-400 p-2" colSpan={6}>
                              <div className="screen-only">
                                <Textarea
                                  value={medicineNote}
                                  onChange={(e) => setMedicineNote(e.target.value)}
                                  placeholder="Enter notes for medicines..."
                                />
                              </div>
                              <div className="print-only whitespace-pre-wrap">{medicineNote}</div>
                            </td>
                          </tr>
                        );
                      }
                      if (item.description && item.description === 'Pathology Charges') {
                        mainRows.push(
                          <tr key={`${item.id}-${mainIndex}-pathology-note`}>
                            <td className="border-r border-gray-400 p-2 text-right font-semibold">Note:</td>
                            <td className="border-l border-gray-400 p-2" colSpan={6}>
                              <div className="screen-only">
                                <Textarea
                                  value={pathologyNote}
                                  onChange={(e) => setPathologyNote(e.target.value)}
                                  placeholder="Enter notes for pathology..."
                                />
                              </div>
                              <div className="print-only whitespace-pre-wrap">{pathologyNote}</div>
                            </td>
                          </tr>
                        );
                      }
                      return mainRows;
                    })}

                    {/* Surgery Treatment Section */}
                    {(surgeryRows.length > 0 || savedSurgeries.length > 0) && (
                      <>
                        <tr className="bg-gray-100">
                          <td className="border border-gray-400 p-3 font-semibold text-center">5)</td>
                          <td className="border border-gray-400 p-3 font-semibold">Surgical Treatment</td>
                          <td className="border border-gray-400 p-3 font-semibold text-center">Code</td>
                          <td className="border border-gray-400 p-3 font-semibold text-center">Adjustment Details</td>
                          <td className="border border-gray-400 p-3 font-semibold text-center">Amount</td>
                          <td className="border border-gray-400 p-3 font-semibold text-center">Final Amount</td>
                          <td className="border border-gray-400 p-2 text-center no-print">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7" onClick={addSurgeryRow}>
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </td>
                        </tr>
                        {surgeryRows.map((row, index) => {
                          const baseAmount = row.rate * row.quantity;
                          const firstDiscountAmount = baseAmount * (row.adjustmentPercent / 100);
                          const amountAfterFirstDiscount = baseAmount - firstDiscountAmount;
                          const secondDiscountAmount = amountAfterFirstDiscount * ((row.secondAdjustmentPercent || 0) / 100);
                          const totalDiscountAmount = firstDiscountAmount + secondDiscountAmount;
                          const finalAmount = amountAfterFirstDiscount - secondDiscountAmount;
                          
                          // Debug console log with detailed breakdown
                          console.log(`🧮 Surgery Row ${index + 1} Calculation:`, {
                            description: row.name,
                            baseAmount,
                            adjustment: row.adjustment,
                            adjustmentPercent: row.adjustmentPercent,
                            firstDiscountAmount,
                            amountAfterFirstDiscount,
                            secondAdjustment: row.secondAdjustment,
                            secondAdjustmentPercent: row.secondAdjustmentPercent,
                            secondDiscountAmount,
                            totalDiscountAmount,
                            finalAmount,
                            // Additional debugging for 75% issue
                            calculationBreakdown: {
                              step1_baseAmount: baseAmount,
                              step2_firstDiscount: `${row.adjustmentPercent}% of ${baseAmount} = ${firstDiscountAmount}`,
                              step3_afterFirstDiscount: `${baseAmount} - ${firstDiscountAmount} = ${amountAfterFirstDiscount}`,
                              step4_secondDiscount: `${row.secondAdjustmentPercent || 0}% of ${amountAfterFirstDiscount} = ${secondDiscountAmount}`,
                              step5_finalAmount: `${amountAfterFirstDiscount} - ${secondDiscountAmount} = ${finalAmount}`
                            }
                          });

                          return (
                            <tr key={row.id}>
                              <td className="border border-gray-400 p-3 text-center font-bold">
                                {String.fromCharCode(97 + index)})
                              </td>
                              <td className="border border-gray-400 p-3">
                                <div className="screen-only">
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => updateSurgeryRow(row.id, 'name', e.target.value)}
                                    placeholder="Enter surgery name..."
                                    className="w-full font-semibold border border-gray-300 rounded px-2 py-1"
                                  />
                                </div>
                                <div className="print-only">
                                  <div className="font-semibold">{row.name}</div>
                                </div>
                              </td>
                              <td className="border border-gray-400 p-3 text-center">
                                <span className="screen-only">
                                  <input
                                    type="text"
                                    value={row.code}
                                    onChange={(e) => updateSurgeryRow(row.id, 'code', e.target.value)}
                                    placeholder="Code"
                                    className="w-20 text-center border border-gray-300 rounded px-1 py-1"
                                  />
                                </span>
                                <span className="print-only">{row.code}</span>
                              </td>
                              <td className="border border-gray-400 p-2">
                                <div className="space-y-1">
                                  <div className="screen-only">
                                    <select
                                      value={row.adjustment}
                                      onChange={(e) => updateSurgeryRow(row.id, 'adjustment', e.target.value)}
                                      className="w-full text-xs border border-gray-300 rounded px-1 py-1 bg-white cursor-pointer"
                                    >
                                      <option value="No Adjustment">No Adjustment</option>
                                      <option value="10% Less  Gen. Ward Charges as per CGHS Guidelines">10% Less  Gen. Ward Charges as per CGHS Guidelines</option>
                                      <option value="50% Less  as per CGHS Guidelines">50% Less as per CGHS Guidelines</option>
                                      <option value="25% Less as per CGHS Guidelines">25% Less as per CGHS Guidelines</option>
                                    </select>
                                    {/* HR line between dropdowns */}
                                    <hr className="border-gray-300 my-1" />
                                    {row.secondAdjustment ? (
                                      <select
                                        value={row.secondAdjustment || "No Adjustment"}
                                        onChange={(e) => updateSurgeryRow(row.id, 'secondAdjustment', e.target.value)}
                                        className="w-full text-xs border border-gray-300 rounded px-1 py-1 bg-white cursor-pointer"
                                      >
                                        <option value="No Adjustment">No Adjustment</option>
                                        <option value="10% Less  Gen. Ward Charges as per CGHS Guidelines">10% Less  Gen. Ward Charges as per CGHS Guidelines</option>
                                        <option value="50% Less  as per CGHS Guidelines">50% Less  as per CGHS Guidelines</option>
                                        
                                         <option value="25% Less as per CGHS Guidelines">25% Less as per CGHS Guidelines</option>
                                      </select>
                                    ) : (
                                      <button
                                        onClick={() => updateSurgeryRow(row.id, 'secondAdjustment', '10% Less  Gen. Ward Charges as per CGHS Guidelines')}
                                        className="w-full text-xs border border-dashed border-gray-400 rounded px-1 py-1 text-gray-500 hover:bg-gray-50"
                                      >
                                        + Add Second Adjustment
                                      </button>
                                    )}
                                    {/* Line separator below dropdowns */}
                                    <div className="border-t border-gray-300 mt-2 pt-1"></div>
                                  </div>
                                  <div className="print-only text-xs">
                                    {row.adjustment !== "No Adjustment" && (
                                      <div>{row.adjustment}</div>
                                    )}
                                    {row.secondAdjustment && row.secondAdjustment !== "No Adjustment" && (
                                      <>
                                        <hr className="border-gray-400 my-1" />
                                        <div>{row.secondAdjustment}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="border border-gray-400 p-2">
                                <div className="text-xs">
                                  <div className="screen-only">
                                    <input
                                      type="number"
                                      value={row.rate || ''}
                                      onChange={(e) => updateSurgeryRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                                      placeholder="Enter amount"
                                      className="w-full text-right font-semibold border border-gray-300 rounded px-1 py-1"
                                    />
                                  </div>
                                  <div className="print-only text-right font-semibold">₹{baseAmount.toFixed(0)}</div>
                                  {row.adjustmentPercent > 0 && (
                                    <>
                                      <hr className="border-gray-300 my-1" />
                                      <div className="text-right text-red-600">-₹{firstDiscountAmount.toFixed(0)}</div>
                                    </>
                                  )}
                                  {(row.secondAdjustmentPercent || 0) > 0 && (
                                    <>
                                      <hr className="border-gray-300 my-1" />
                                      <div className="text-right text-red-600">-₹{secondDiscountAmount.toFixed(0)}</div>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-400 p-3 text-right font-semibold">₹{finalAmount.toFixed(0)}</td>
                              <td className="border border-gray-400 p-2 no-print">
                                <div className="flex flex-col gap-1">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => moveSurgeryRowUp(index)}
                                      disabled={index === 0}
                                      className={`p-1 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                                      title="Move up"
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => moveSurgeryRowDown(index)}
                                      disabled={index === surgeryRows.length - 1}
                                      className={`p-1 ${index === surgeryRows.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                                      title="Move down"
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this surgery treatment item?')) {
                                        setSurgeryRows(prev => prev.filter(r => r.id !== row.id));
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete surgery treatment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}

                  </tbody>
                </table>
              </div>







              {/* Amount in Words */}
              {/* <div className="mt-4 p-3 bg-gray-100 font-semibold">
          <span>Amount in Words: </span>
          <span>{convertToWords(Math.round(totalAmount))}</span>
        </div> */}

              {/* TOTAL BILL AMOUNT - At the very end */}
              <div className="mt-8 w-full">
                <div
                  className="final-total-container w-full bg-black text-white font-black text-xl p-4"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '20px',
                    margin: '20px 0',
                    padding: '16px'
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-black text-xl">
                      TOTAL BILL AMOUNT
                    </span>
                    <span className="font-black text-xl">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Status Indicator */}
              <div className="mt-4 flex justify-end no-print">
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
                  {billData?.id ? (
                    <span className="flex items-center text-green-600">
                      ✅ Bill saved to database (ID: {billData.id.slice(-8).toUpperCase()})
                    </span>
                  ) : (
                    <span className="flex items-center text-orange-600">
                      ⚠️ Bill not yet saved - Click Save Bill to store data
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 flex justify-between text-sm w-full footer-print-space">
                <span className="font-bold">Bill Executive</span>
                <span className="font-bold">Cashier</span>
                <span className="font-bold">Patient Sign</span>
                <span className="font-bold">Cashier Med.Supdt</span>
                <span className="font-bold">Authorised Signatory</span>
              </div>

              <div className="mt-8 flex justify-end space-x-4 no-print">
                <Button onClick={saveDraft} variant="outline" size="lg" className="px-6 py-2">💾 Save Draft</Button>
                <Button onClick={clearDraft} variant="outline" size="lg" className="px-6 py-2">🧹 Clear Draft</Button>
                <Button
                  onClick={() => navigate(`/edit-final-bill/${visitId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  size="lg"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Edit Bill
                </Button>
                <Button
                  onClick={handleSaveBill}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving Bill...
                    </>
                  ) : (
                    <>
                      💾 Save Bill
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handlePrint} size="lg" className="px-6 py-2">
                  🖨️ Print
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Medication Details Modal */}
        {selectedMedication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Medication Details</h3>
                <button
                  onClick={() => setSelectedMedication(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedMedication.medication_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={selectedMedication.dosage || ''}
                    onChange={(e) => updateMedicationField(selectedMedication.id, 'dosage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 10mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={selectedMedication.frequency || ''}
                    onChange={(e) => updateMedicationField(selectedMedication.id, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="As needed">As needed</option>
                    <option value="Before meals">Before meals</option>
                    <option value="After meals">After meals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={selectedMedication.duration || ''}
                    onChange={(e) => updateMedicationField(selectedMedication.id, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 7 days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={selectedMedication.notes || ''}
                    onChange={(e) => updateMedicationField(selectedMedication.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedMedication(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* External API Data Modal */}
        {showExternalDataModal && externalApiData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 External HIMS API Data
                </h3>
                <button
                  onClick={() => setShowExternalDataModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Raw API Response:</h4>
                  <pre className="bg-white border border-gray-200 rounded p-3 text-sm overflow-x-auto">
                    {JSON.stringify(externalApiData, null, 2)}
                  </pre>
                </div>

                {/* Formatted Data Display */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Formatted Patient Data:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(externalApiData).map(([key, value]) => (
                      <div key={key} className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          {value ? String(value) : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExternalDataModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* ESIC Letter Generator Dialog */}
        <ESICLetterGenerator
          isOpen={isESICLetterDialogOpen}
          onClose={() => setIsESICLetterDialogOpen(false)}
          additionalApprovalSurgery={additionalApprovalSurgery}
          additionalApprovalInvestigation={additionalApprovalInvestigation}
          extensionOfStayApproval={extensionOfStayApproval}
          patientData={patientData}
        />
      </div>
    </>
  );
}

export default FinalBill;