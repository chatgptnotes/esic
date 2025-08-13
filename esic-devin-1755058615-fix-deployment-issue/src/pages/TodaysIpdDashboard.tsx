import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Search, Calendar, DollarSign, Trash2, FolderOpen, FolderX, CheckCircle, XCircle, Clock, MinusCircle, RotateCcw, Printer, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ImportRegistrationData } from '@/components/ImportRegistrationData';
import { EditPatientDialog } from '@/components/EditPatientDialog';
import { usePatients } from '@/hooks/usePatients';
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const TodaysIpdDashboard = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState(null);
  const [srNo, setSrNo] = useState('');
  const [billingExecutiveInputs, setBillingExecutiveInputs] = useState({});
  const [billingExecutiveFilter, setBillingExecutiveFilter] = useState('');
  const [billingStatusInputs, setBillingStatusInputs] = useState({});
  const [billingStatusFilter, setBillingStatusFilter] = useState('');
  const [bunchNumberInputs, setBunchNumberInputs] = useState({});
  const [bunchFilter, setBunchFilter] = useState('');
  const navigate = useNavigate();

  const { diagnoses, updatePatient } = usePatients();

  // Column filter states (top-level)
  const [fileStatusFilter, setFileStatusFilter] = useState<string[]>([]);
  const [condonationSubmissionFilter, setCondonationSubmissionFilter] = useState<string[]>([]);
  const [condonationIntimationFilter, setCondonationIntimationFilter] = useState<string[]>([]);
  const [extensionOfStayFilter, setExtensionOfStayFilter] = useState<string[]>([]);
  const [additionalApprovalsFilter, setAdditionalApprovalsFilter] = useState<string[]>([]);

  // Reusable multi-select column filter using DropdownMenu
  const ColumnFilter = ({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) => {
    const toggleValue = (value: string) => {
      onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
    };
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <Filter className="h-3 w-3 mr-1" />
            {selected.length ? `${selected.length} selected` : 'All'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => onChange([])}>Clear</DropdownMenuItem>
          <DropdownMenuSeparator />
          {options.map((opt) => (
            <DropdownMenuCheckboxItem key={opt} checked={selected.includes(opt)} onCheckedChange={() => toggleValue(opt)}>
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Custom component for billing executive dropdown with options
  const BillingExecutiveInput = ({ visit, isAdmin }) => {
    const [selectedValue, setSelectedValue] = useState(visit.billing_executive || '');
    const [debouncedValue] = useDebounce(selectedValue, 2000); // 2 seconds delay

    const billingExecutiveOptions = [
      'Dr.B.K.Murali',
      'Ruby',
      'Shrikant',
      'Gaurav',
      'Dr. Swapnil',
      'Dr.Sachin',
      'Dr.Shiraj',
      'Dr. Sharad',
      'Shashank',
      'Shweta',
      'Suraj',
      'Nitin',
      'Sonali',
      'Ruchika',
      'Pragati',
      'Rachana',
      'Kashish',
      'Aman',
      'Dolly',
      'Ruchi',
      'Gayatri',
      'Noor',
      'Neesha',
      'Diksha',
      'Ayush',
      'Kiran',
      'Pratik',
      'Azhar',
      'Tejas',
      'Abhishek',
      'Chandrprakash'
    ];




    useEffect(() => {
      if (!isAdmin) return; // do not submit changes when not admin
      if (debouncedValue !== (visit.billing_executive || '')) {
        handleBillingExecutiveSubmit(visit.visit_id, debouncedValue);
      }
    }, [isAdmin, debouncedValue, visit.billing_executive, visit.visit_id]);

    return (
      <select
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        disabled={!isAdmin}
        className="w-32 h-8 text-sm border border-gray-300 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Executive</option>
        {billingExecutiveOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  // Custom component for billing status dropdown - now using shared cascading dropdown
  const BillingStatusDropdown = ({ visit, disabled = false }) => {
    if (disabled) {
      return (
        <div className="text-xs">
          <div>{visit.billing_status || '-'}</div>
          {visit.billing_sub_status ? (
            <div className="text-muted-foreground">{visit.billing_sub_status}</div>
          ) : null}
        </div>
      );
    }
    return (
      <CascadingBillingStatusDropdown
        visit={visit}
        queryKey={['todays-ipd-visits']}
        onUpdate={() => refetch()}
      />
    );
  };

  // Custom component for Sr No input with debouncing
  const SrNoInput = ({ visit }) => {
    const [value, setValue] = useState(visit.sr_no || '');
    const [debouncedValue] = useDebounce(value, 2000); // 2 seconds delay

    useEffect(() => {
      if (debouncedValue !== (visit.sr_no || '')) {
        handleSrNoSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.sr_no, visit.visit_id]);

    // Sync with server updates
    useEffect(() => {
      setValue(visit.sr_no || '');
    }, [visit.sr_no]);

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleSrNoSubmit(visit.visit_id, value)}
        placeholder="Enter Sr No"
        className="w-20 h-8 text-sm"
      />
    );
  };

  // Custom component for bunch number input with debouncing
  const BunchNumberInput = ({ visit, isAdmin }) => {
    const [selectedValue, setSelectedValue] = useState(visit.bunch_no || '');
    const [debouncedValue] = useDebounce(selectedValue, 2000); // 2 seconds delay

    useEffect(() => {
      if (debouncedValue !== (visit.bunch_no || '')) {
        handleBunchNumberSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.bunch_no, visit.visit_id]);

    if (!isAdmin) return <span className="text-sm">{visit.bunch_no || '-'}</span>;
    return (
      <Input
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        placeholder="Enter Bunch No"
        className="w-24 h-8 text-sm"
      />
    );
  };

  // Custom component for Claim ID input with debouncing
  const ClaimIdInput = ({ visit }) => {
    const [value, setValue] = useState(visit.claim_id || '');
    const [debouncedValue] = useDebounce(value, 7000);

    useEffect(() => {
      if (debouncedValue !== (visit.claim_id || '')) {
        handleClaimIdSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.claim_id, visit.visit_id]);

    // Sync with server updates
    useEffect(() => {
      setValue(visit.claim_id || '');
    }, [visit.claim_id]);

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleClaimIdSubmit(visit.visit_id, value)}
        placeholder="Enter Claim ID"
        className="w-36 h-8 text-sm"
      />
    );
  };

  // Custom component for ESIC UHID input with debouncing
  const EsicUhidInput = ({ visit }) => {
    const [value, setValue] = useState(visit.esic_uh_id || '');
    const [debouncedValue] = useDebounce(value, 7000);

    useEffect(() => {
      if (debouncedValue !== (visit.esic_uh_id || '')) {
        handleEsicUhidSubmit(visit.visit_id, debouncedValue);
      }
    }, [debouncedValue, visit.esic_uh_id, visit.visit_id]);

    // Sync with server updates
    useEffect(() => {
      setValue(visit.esic_uh_id || '');
    }, [visit.esic_uh_id]);

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => handleEsicUhidSubmit(visit.visit_id, value)}
        placeholder="Enter ESIC UHID"
        className="w-40 h-8 text-sm"
      />
    );
  };

  // File Status Toggle Component
  const FileStatusToggle = ({ visit }) => {
    const [fileStatus, setFileStatus] = useState(visit.file_status || 'available');

    const handleToggleFileStatus = async () => {
      const newStatus = fileStatus === 'available' ? 'missing' : 'available';
      setFileStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ file_status: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating file status:', error);
          // Revert the state on error
          setFileStatus(fileStatus);
          return;
        }

        console.log('File status updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating file status:', error);
        setFileStatus(fileStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          fileStatus === 'available'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleFileStatus}
        title={fileStatus === 'available' ? 'File Available - Click to mark as Missing' : 'File Missing - Click to mark as Available'}
      >
        {fileStatus === 'available' ? (
          <>
            <FolderOpen className="h-3 w-3 mr-1" />
            Available
          </>
        ) : (
          <>
            <FolderX className="h-3 w-3 mr-1" />
            Missing
          </>
        )}
      </Button>
    );
  };

  // Condonation Delay Claim Toggle Component
  const CondonationDelayToggle = ({ visit }) => {
    const [condonationStatus, setCondonationStatus] = useState(visit.condonation_delay_claim || 'not_present');

    const handleToggleCondonation = async () => {
      const newStatus = condonationStatus === 'present' ? 'not_present' : 'present';
      setCondonationStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ condonation_delay_claim: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating condonation delay claim:', error);
          // Revert the state on error
          setCondonationStatus(condonationStatus);
          return;
        }

        console.log('Condonation delay claim updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating condonation delay claim:', error);
        setCondonationStatus(condonationStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          condonationStatus === 'present'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleCondonation}
        title={condonationStatus === 'present' ? 'Condonation Present - Click to mark as Not Present' : 'Condonation Not Present - Click to mark as Present'}
      >
        {condonationStatus === 'present' ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Not Present
          </>
        )}
      </Button>
    );
  };

  // Condonation Delay Intimation Toggle Component
  const CondonationDelayIntimationToggle = ({ visit }) => {
    const [intimationStatus, setIntimationStatus] = useState(visit.condonation_delay_intimation || 'not_present');

    const handleToggleIntimation = async () => {
      const newStatus = intimationStatus === 'present' ? 'not_present' : 'present';
      setIntimationStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ condonation_delay_intimation: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating condonation delay intimation:', error);
          // Revert the state on error
          setIntimationStatus(intimationStatus);
          return;
        }

        console.log('Condonation delay intimation updated successfully for visit:', visit.visit_id);
        refetch(); // Refresh the data
      } catch (error) {
        console.error('Error updating condonation delay intimation:', error);
        setIntimationStatus(intimationStatus);
      }
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${
          intimationStatus === 'present'
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
        onClick={handleToggleIntimation}
        title={intimationStatus === 'present' ? 'Intimation Present - Click to mark as Not Present' : 'Intimation Not Present - Click to mark as Present'}
      >
        {intimationStatus === 'present' ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Not Present
          </>
        )}
      </Button>
    );
  };

  // Extension of Stay 3-State Toggle Component
  const ExtensionOfStayToggle = ({ visit }) => {
    const [extensionStatus, setExtensionStatus] = useState(visit.extension_of_stay || 'not_required');

    const handleToggleExtension = async () => {
      let newStatus: 'not_required' | 'taken' | 'not_taken';
      if (extensionStatus === 'not_required') {
        newStatus = 'taken';
      } else if (extensionStatus === 'taken') {
        newStatus = 'not_taken';
      } else {
        newStatus = 'not_required';
      }

      setExtensionStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ extension_of_stay: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating extension of stay:', error);
          setExtensionStatus(extensionStatus);
          return;
        }

        console.log('Extension of stay updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating extension of stay:', error);
        setExtensionStatus(extensionStatus);
      }
    };

    const getStatusConfig = () => {
      switch (extensionStatus) {
        case 'taken':
          return {
            className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            icon: <CheckCircle className="h-3 w-3 mr-1" />,
            text: 'Taken'
          };
        case 'not_taken':
          return {
            className: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
            icon: <XCircle className="h-3 w-3 mr-1" />,
            text: 'Not Taken'
          };
        default:
          return {
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
            icon: <MinusCircle className="h-3 w-3 mr-1" />,
            text: 'Not Required'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${config.className}`}
        onClick={handleToggleExtension}
        title={`Extension of Stay: ${config.text} - Click to cycle through states`}
      >
        {config.icon}
        {config.text}
      </Button>
    );
  };

  // Additional Approvals 3-State Toggle Component
  const AdditionalApprovalsToggle = ({ visit }) => {
    const [approvalsStatus, setApprovalsStatus] = useState(visit.additional_approvals || 'not_required');

    const handleToggleApprovals = async () => {
      let newStatus: 'not_required' | 'taken' | 'not_taken';
      if (approvalsStatus === 'not_required') {
        newStatus = 'taken';
      } else if (approvalsStatus === 'taken') {
        newStatus = 'not_taken';
      } else {
        newStatus = 'not_required';
      }

      setApprovalsStatus(newStatus);

      try {
        const { error } = await supabase
          .from('visits')
          .update({ additional_approvals: newStatus })
          .eq('visit_id', visit.visit_id);

        if (error) {
          console.error('Error updating additional approvals:', error);
          setApprovalsStatus(approvalsStatus);
          return;
        }

        console.log('Additional approvals updated successfully for visit:', visit.visit_id);
        refetch();
      } catch (error) {
        console.error('Error updating additional approvals:', error);
        setApprovalsStatus(approvalsStatus);
      }
    };

    const getStatusConfig = () => {
      switch (approvalsStatus) {
        case 'taken':
          return {
            className: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
            icon: <CheckCircle className="h-3 w-3 mr-1" />,
            text: 'Taken'
          };
        case 'not_taken':
          return {
            className: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
            icon: <XCircle className="h-3 w-3 mr-1" />,
            text: 'Not Taken'
          };
        default:
          return {
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
            icon: <MinusCircle className="h-3 w-3 mr-1" />,
            text: 'Not Required'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-20 p-2 text-xs font-medium transition-all duration-200 ${config.className}`}
        onClick={handleToggleApprovals}
        title={`Additional Approvals: ${config.text} - Click to cycle through states`}
      >
        {config.icon}
        {config.text}
      </Button>
    );
  };

  const { data: todaysVisits = [], isLoading, refetch } = useQuery({
    queryKey: ['todays-visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            name,
            patients_id
          )
        `)
        .order('sr_no', { ascending: true, nullsFirst: false })
        .order('visit_date', { ascending: true });

      if (error) {
        console.error('Error fetching today\'s visits:', error);
        throw error;
      }

      // Sort manually to ensure patients with sr_no come first, then patients without sr_no
      const sortedData = (data || []).sort((a, b) => {
        // If both have sr_no, sort numerically
        if (a.sr_no && b.sr_no) {
          return parseInt(a.sr_no) - parseInt(b.sr_no);
        }
        // If only a has sr_no, a comes first (starting)
        if (a.sr_no && !b.sr_no) {
          return -1;
        }
        // If only b has sr_no, b comes first (starting)
        if (!a.sr_no && b.sr_no) {
          return 1;
        }
        // If neither has sr_no, both go to end, maintain original order
        return 0;
      });

      return sortedData;
    }
  });

  // Compute unique options for column filters from current data
  const fileStatusOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.file_status).filter(Boolean))) as string[], [todaysVisits]);
  const condonationSubmissionOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.condonation_delay_claim).filter(Boolean))) as string[], [todaysVisits]);
  const condonationIntimationOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.condonation_delay_intimation).filter(Boolean))) as string[], [todaysVisits]);
  const extensionOfStayOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.extension_of_stay).filter(Boolean))) as string[], [todaysVisits]);
  const additionalApprovalsOptions = useMemo(() => Array.from(new Set((todaysVisits || []).map((v) => v.additional_approvals).filter(Boolean))) as string[], [todaysVisits]);

  const filteredVisits = todaysVisits.filter(visit => {
    const matchesSearch = visit.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visit_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.appointment_with?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBillingExecutive = !billingExecutiveFilter ||
      visit.billing_executive === billingExecutiveFilter;

    const matchesBillingStatus = !billingStatusFilter ||
      visit.billing_status === billingStatusFilter;

    const matchesBunch = !bunchFilter ||
      visit.bunch_no === bunchFilter;

    const includeBy = (selected: string[], value?: string | null) =>
      selected.length === 0 || (value ? selected.includes(value) : false);

    const matchesFile = includeBy(fileStatusFilter, visit.file_status);
    const matchesCondSub = includeBy(condonationSubmissionFilter, visit.condonation_delay_claim);
    const matchesCondInt = includeBy(condonationIntimationFilter, visit.condonation_delay_intimation);
    const matchesExtStay = includeBy(extensionOfStayFilter, visit.extension_of_stay);
    const matchesAddAppr = includeBy(additionalApprovalsFilter, visit.additional_approvals);

    return matchesSearch && matchesBillingExecutive && matchesBillingStatus && matchesBunch && matchesFile && matchesCondSub && matchesCondInt && matchesExtStay && matchesAddAppr;
  });

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge
        variant="secondary"
        className={statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}
      >
        {status || 'Scheduled'}
      </Badge>
    );
  };

  const handleVisitIdClick = (patientId: string, visitId: string) => {
    // Navigate to patient profile with the specific patient and visit selected
    navigate(`/patient-profile?patient=${patientId}&visit=${visitId}`);
  };

  const handleBillClick = (visit) => {
    // Navigate to final bill page with patient and visit data
    navigate(`/final-bill/${visit.visit_id}`);
  };

  const handleEditPatientClick = (visit) => {
    const patient = visit.patients;
    if (patient) {
      const patientForEdit = {
        id: patient.id,
        patientUuid: patient.id,
        name: patient.name,
        patients_id: patient.patients_id,
        primaryDiagnosis: '',
        complications: '',
        surgery: '',
        labs: '',
        radiology: '',
        labsRadiology: '',
        antibiotics: '',
        otherMedications: '',
        surgeon: '',
        consultant: '',
        hopeSurgeon: '',
        hopeConsultants: '',
        admissionDate: '',
        surgeryDate: '',
        dischargeDate: '',
        visitId: visit.id
      };
      setSelectedPatientForEdit(patientForEdit);
      setShowEditPatientDialog(true);
    }
  };

  const handleSavePatient = (updatedPatient) => {
    updatePatient(updatedPatient);
    setShowEditPatientDialog(false);
    setSelectedPatientForEdit(null);
  };

  const handleSrNoSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ sr_no: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating sr_no:', error);
        return;
      }

      console.log('Sr No updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating sr_no:', error);
    }
  };

  const handleBillingExecutiveSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_executive: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating billing_executive:', error);
        return;
      }

      console.log('Billing Executive updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating billing_executive:', error);
    }
  };

  const handleBillingStatusSubmit = async (visitId: string, value: string) => {
    console.log('🔄 Starting billing status update for visitId:', visitId, 'value:', value);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_status: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('❌ Error updating billing_status:', error);
        return;
      }

      console.log('✅ Billing Status updated successfully for visit:', visitId, 'with value:', value);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('❌ Exception during billing_status update:', error);
    }
  };

  const handleBillingSubStatusSubmit = async (visitId: string, value: string) => {
    console.log('🔄 Starting billing sub status update for visitId:', visitId, 'value:', value);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ billing_sub_status: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('❌ Error updating billing_sub_status:', error);
        return;
      }

      console.log('✅ Billing Sub Status updated successfully for visit:', visitId, 'with value:', value);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('❌ Exception during billing_sub_status update:', error);
    }
  };

  const handleClaimIdSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ claim_id: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating claim_id:', error);
        return;
      }

      console.log('Claim ID updated successfully for visit:', visitId);
      refetch();
    } catch (error) {
      console.error('Error updating claim_id:', error);
    }
  };

  const handleEsicUhidSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ esic_uh_id: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating esic_uh_id:', error);
        return;
      }

      console.log('ESIC UHID updated successfully for visit:', visitId);
      refetch();
    } catch (error) {
      console.error('Error updating esic_uh_id:', error);
    }
  };

  const handleBunchNumberSubmit = async (visitId: string, value: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({ bunch_no: value })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error updating bunch_no:', error);
        return;
      }

      console.log('Bunch Number updated successfully for visit:', visitId);
      refetch(); // Refresh the data
    } catch (error) {
      console.error('Error updating bunch_no:', error);
    }
  };

  const handleRevokeDischarge = async (visitId: string, patientName: string) => {
    try {
      const { error } = await supabase
        .from('visits')
        .update({
          discharge_date: null
        })
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error revoking discharge:', error);
        alert('Failed to revoke discharge. Please try again.');
        return;
      }

      console.log('Discharge revoked successfully for visit:', visitId);
      refetch(); // Refresh the data
      alert(`Discharge revoked for ${patientName}. Patient moved back to currently admitted.`);
    } catch (error) {
      console.error('Error revoking discharge:', error);
      alert('Failed to revoke discharge. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (window.confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      try {
        console.log('Deleting visit and related data for visit ID:', visitId);

        // First get the UUID for this visit_id
        const { data: visitData, error: visitFetchError } = await supabase
          .from('visits')
          .select('id, patient_id')
          .eq('visit_id', visitId)
          .single();

        if (visitFetchError || !visitData) {
          console.error('Error fetching visit data:', visitFetchError);
          alert('Failed to find visit. Please try again.');
          return;
        }

        const visitUUID = visitData.id;
        console.log('Found visit UUID:', visitUUID);

        // Tables with NO ACTION constraint - must delete manually FIRST
        const noActionTables = [
          'visit_complications',
          'visit_surgeons',
          'visit_consultants',
          'doctor_plan'
        ];

        // Tables with CASCADE constraint - will auto-delete when visit is deleted
        // Note: ai_clinical_recommendations also has CASCADE but uses UUID visit_id

        // Tables that might use text visit_id (need to check if they exist)
        const textVisitIdTables = [
          'patient_documents',
          'pharmacy_sales'
        ];

        // STEP 1: Delete from NO ACTION tables first (to avoid constraint violations)
        console.log('🗑️ Step 1: Deleting from NO ACTION constraint tables...');

        for (const tableName of noActionTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('visit_id', visitUUID);

            if (error) {
              console.error(`❌ Error deleting from ${tableName}:`, error);
              // Continue with other tables even if one fails
            } else {
              console.log(`✅ Deleted data from ${tableName}`);
            }
          } catch (tableError) {
            console.error(`❌ Exception deleting from ${tableName}:`, tableError);
            // Continue with other tables
          }
        }

        // STEP 2: Delete from text-based tables (if they exist)
        console.log('🗑️ Step 2: Deleting from text-based tables...');

        for (const tableName of textVisitIdTables) {
          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq('visit_id', visitId);

            if (error) {
              console.error(`❌ Error deleting from ${tableName}:`, error);
              // Continue with other tables even if one fails
            } else {
              console.log(`✅ Deleted data from ${tableName}`);
            }
          } catch (tableError) {
            console.error(`❌ Exception deleting from ${tableName}:`, tableError);
            // Continue with other tables
          }
        }

        // Note: CASCADE tables will be automatically deleted when main visit is deleted

        // Delete from bills table (uses patient_id, not visit_id)
        const { error: billsError } = await supabase
          .from('bills')
          .delete()
          .eq('patient_id', visitData.patient_id);

        if (billsError) {
          console.error('Error deleting bills for visit:', billsError);
        } else {
          console.log('✅ Deleted bills data for visit');
        }

        // Finally, delete the visit record itself using UUID
        console.log('Deleting visit record...');
        const { error: visitError } = await supabase
          .from('visits')
          .delete()
          .eq('id', visitUUID);

        if (visitError) {
          console.error('Error deleting visit:', visitError);
          alert('Failed to delete visit. Please try again.');
          return;
        }

        console.log('✅ Successfully deleted visit and all related data');

        // Refresh the visits list
        refetch();
        alert('Visit and all related data deleted successfully.');
      } catch (error) {
        console.error('Error deleting visit:', error);
        alert('Failed to delete visit. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading today's visits...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Today's IPD Dashboard</h1>
              <p className="text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM do, yyyy')} - {filteredVisits.length} visits scheduled
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print List
            </Button>
            <ImportRegistrationData />
            <select
              value={billingExecutiveFilter}
              onChange={(e) => {
                console.log('Billing Executive selected:', e.target.value);
                setBillingExecutiveFilter(e.target.value);
              }}
              className="w-48 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Billing Executives</option>
              <option value="Dr.B.K.Murali">Dr.B.K.Murali</option>
              <option value="Ruby">Ruby</option>
              <option value="Shrikant">Shrikant</option>
              <option value="Gaurav">Gaurav</option>
              <option value="Dr. Swapnil">Dr. Swapnil</option>
              <option value="Dr.Sachin">Dr.Sachin</option>
              <option value="Dr.Shiraj">Dr.Shiraj</option>
              <option value="Dr. Sharad">Dr. Sharad</option>
              <option value="Shashank">Shashank</option>
              <option value="Shweta">Shweta</option>
              <option value="Suraj">Suraj</option>
              <option value="Nitin">Nitin</option>
              <option value="Sonali">Sonali</option>
              <option value="Ruchika">Ruchika</option>
              <option value="Pragati">Pragati</option>
              <option value="Rachana">Rachana</option>
              <option value="Kashish">Kashish</option>
              <option value="Aman">Aman</option>
              <option value="Dolly">Dolly</option>
              <option value="Ruchi">Ruchi</option>
              <option value="Gayatri">Gayatri</option>
              <option value="Noor">Noor</option>
              <option value="Neesha">Neesha</option>
              <option value="Diksha">Diksha</option>
              <option value="Ayush">Ayush</option>
              <option value="Kiran">Kiran</option>
              <option value="Pratik">Pratik</option>
              <option value="Azhar">Azhar</option>
              <option value="Tejas">Tejas</option>
              <option value="Abhishek">Abhishek</option>
              <option value="Chandrprakash">Chandrprakash</option>
            </select>

            <select
              value={billingStatusFilter}
              onChange={(e) => setBillingStatusFilter(e.target.value)}
              className="w-48 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Billing Status</option>
              {[
                'Approval Pending',
                'ID Pending',
                'Doctor Planning Done',
                'Bill Completed',
                'Bill Submitted',
                'Bill uploaded, not couriered',
                'Bill uploaded, couriered',
                'Payment received'
              ].map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Bill Completed' ? 'Bill PDF Completed' : (opt === 'Bill Submitted' ? 'Bill submitted - DSC done' : opt)}
                </option>
              ))}
            </select>
            <select
              value={bunchFilter}
              onChange={(e) => setBunchFilter(e.target.value)}
              className="w-36 h-10 text-sm border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Bunches</option>
              {Array.from(new Set(todaysVisits.map(visit => visit.bunch_no).filter(Boolean))).sort().map((bunchNo) => (
                <option key={bunchNo} value={bunchNo}>
                  Bunch {bunchNo}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {todaysVisits.filter(v => v.status === 'scheduled' || !v.status).length}
            </div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">
              {todaysVisits.filter(v => v.status === 'in-progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>

	              {/* Filters row under headers */}
	              <TableRow className="bg-muted/30">
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead>
	                  <ColumnFilter options={fileStatusOptions} selected={fileStatusFilter} onChange={setFileStatusFilter} />
	                </TableHead>
	                <TableHead>
	                  <ColumnFilter options={condonationSubmissionOptions} selected={condonationSubmissionFilter} onChange={setCondonationSubmissionFilter} />
	                </TableHead>
	                <TableHead>
	                  <ColumnFilter options={condonationIntimationOptions} selected={condonationIntimationFilter} onChange={setCondonationIntimationFilter} />
	                </TableHead>
	                <TableHead>
	                  <ColumnFilter options={extensionOfStayOptions} selected={extensionOfStayFilter} onChange={setExtensionOfStayFilter} />
	                </TableHead>
	                <TableHead>
	                  <ColumnFilter options={additionalApprovalsOptions} selected={additionalApprovalsFilter} onChange={setAdditionalApprovalsFilter} />
	                </TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	                <TableHead></TableHead>
	              </TableRow>

          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {todaysVisits.filter(v => v.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">
              {todaysVisits.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </div>
        </div>

        {/* Print Info - Only visible when printing */}
        <div className="print-info">
          <h3 className="font-semibold">Applied Filters:</h3>
          {billingExecutiveFilter && <p>Billing Executive: {billingExecutiveFilter}</p>}
          {billingStatusFilter && <p>Billing Status: {billingStatusFilter}</p>}
          {bunchFilter && <p>Bunch: {bunchFilter}</p>}
          {searchTerm && <p>Search: {searchTerm}</p>}
          {!billingExecutiveFilter && !billingStatusFilter && !bunchFilter && !searchTerm && <p>No filters applied - Showing all visits</p>}
        </div>

        {/* Visits Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Today's Visit Schedule</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Sr No</TableHead>
                <TableHead className="font-semibold">Bunch No.</TableHead>
                <TableHead className="font-semibold">Visit ID</TableHead>
                <TableHead className="font-semibold">Patient Name</TableHead>
                <TableHead className="font-semibold">Claim ID</TableHead>
                <TableHead className="font-semibold">ESIC UHID</TableHead>
                <TableHead className="font-semibold">Bill</TableHead>
                <TableHead className="font-semibold">Billing Executive</TableHead>
                <TableHead className="font-semibold">Billing Status</TableHead>
                <TableHead className="font-semibold">File Status</TableHead>
                <TableHead className="font-semibold">Condonation Delay -submission</TableHead>
                <TableHead className="font-semibold">Condonation Delay -intimation</TableHead>
                <TableHead className="font-semibold">Extension of Stay</TableHead>
                <TableHead className="font-semibold">Additional Approvals</TableHead>
                <TableHead className="font-semibold">Visit Type</TableHead>
                <TableHead className="font-semibold">Doctor</TableHead>
                <TableHead className="font-semibold">Diagnosis</TableHead>
                <TableHead className="font-semibold">Admission Date</TableHead>
                <TableHead className="font-semibold">Days Admitted</TableHead>
                <TableHead className="font-semibold">Discharge Date</TableHead>
                {isAdmin && <TableHead className="font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            {/* Filters row under headers */}
            <TableRow className="bg-muted/30">
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead>
                <ColumnFilter options={fileStatusOptions} selected={fileStatusFilter} onChange={setFileStatusFilter} />
              </TableHead>
              <TableHead>
                <ColumnFilter options={condonationSubmissionOptions} selected={condonationSubmissionFilter} onChange={setCondonationSubmissionFilter} />
              </TableHead>
              <TableHead>
                <ColumnFilter options={condonationIntimationOptions} selected={condonationIntimationFilter} onChange={setCondonationIntimationFilter} />
              </TableHead>
              <TableHead>
                <ColumnFilter options={extensionOfStayOptions} selected={extensionOfStayFilter} onChange={setExtensionOfStayFilter} />
              </TableHead>
              <TableHead>
                <ColumnFilter options={additionalApprovalsOptions} selected={additionalApprovalsFilter} onChange={setAdditionalApprovalsFilter} />
              </TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>

            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit.id} className="hover:bg-muted/50">
                  <TableCell>
                    <SrNoInput visit={visit} />
                  </TableCell>
                  <TableCell>
                    <BunchNumberInput visit={visit} isAdmin={isAdmin} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <button
                      onClick={() => handleVisitIdClick(visit.patient_id, visit.visit_id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                    >
                      {visit.visit_id}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {visit.patients?.name}
                  </TableCell>
                  <TableCell>
                    <ClaimIdInput visit={visit} />
                  </TableCell>
                  <TableCell>
                    <EsicUhidInput visit={visit} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleBillClick(visit)}
                      title="View Bill"
                    >
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <BillingExecutiveInput visit={visit} isAdmin={isAdmin} />
                  </TableCell>
                  <TableCell>
                    <BillingStatusDropdown visit={visit} disabled={!isAdmin} />
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <FileStatusToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.file_status || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <CondonationDelayToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.condonation_delay_claim || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <CondonationDelayIntimationToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.condonation_delay_intimation || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <ExtensionOfStayToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.extension_of_stay || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? <AdditionalApprovalsToggle visit={visit} /> : (
                      <Badge variant="outline" className="capitalize">{visit.additional_approvals || '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {visit.visit_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {visit.appointment_with}
                  </TableCell>
                  <TableCell>
                    General
                  </TableCell>
                  <TableCell>
                    {visit.admission_date ? format(new Date(visit.admission_date), 'MMM dd, yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell>
                    {visit.admission_date ? `${Math.ceil((((visit.discharge_date ? new Date(visit.discharge_date).getTime() : Date.now()) - new Date(visit.admission_date).getTime())) / (1000 * 60 * 60 * 24))} days` : '—'}
                  </TableCell>
                  <TableCell>
                    {visit.discharge_date ? format(new Date(visit.discharge_date), 'MMM dd, yyyy HH:mm') : '—'}
                  </TableCell>
                  {isAdmin && (
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 w-8 p-0"
                       >
                         <Eye className="h-4 w-4 text-blue-600" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-10 w-10 p-0 relative bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 rounded-full animate-pulse hover:scale-110 transition-all duration-200 shadow-lg shadow-blue-500/50"
                         onClick={() => handleEditPatientClick(visit)}
                         title="Edit Patient Details"
                       >
                         <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping"></div>
                         <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping animation-delay-75"></div>
                         <FileText className="h-5 w-5 text-blue-600 relative z-10 animate-bounce" />
                       </Button>
                       {/* Show Revoke Discharge button only for discharged patients */}
                       {visit.discharge_date && (
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-8 w-8 p-0 hover:bg-orange-50"
                               title="Revoke Discharge - Move back to Currently Admitted"
                             >
                               <RotateCcw className="h-4 w-4 text-orange-600" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Revoke Discharge</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Are you sure you want to revoke the discharge for <strong>{visit.patients?.name}</strong>?
                                 This will remove the discharge date/time and move the patient back to "Currently Admitted Patients" list.
                                 This action is typically used for correcting accidental or wrong discharge entries.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction
                                 onClick={() => handleRevokeDischarge(visit.visit_id, visit.patients?.name)}
                                 className="bg-orange-600 hover:bg-orange-700"
                               >
                                 Revoke Discharge
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       )}
                       <Button
                         variant="ghost"
                         size="sm"
                         className="h-8 w-8 p-0 hover:bg-red-50"
                         onClick={() => handleDeleteVisit(visit.visit_id)}
                         title="Delete Visit"
                       >
                         <Trash2 className="h-4 w-4 text-red-600" />
                       </Button>
                     </div>
                   </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredVisits.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No visits scheduled for today.</p>
            <p className="text-sm">Registered visits will appear here.</p>
          </div>
        )}

        {/* Edit Patient Dialog */}
        {selectedPatientForEdit && (
          <EditPatientDialog
            isOpen={showEditPatientDialog}
            onClose={() => {
              setShowEditPatientDialog(false);
              setSelectedPatientForEdit(null);
            }}
            patient={selectedPatientForEdit}
            onSave={handleSavePatient}
          />
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except the table */
          body * {
            visibility: hidden !important;
          }

          /* Show only the table container and its contents */
          .bg-card.rounded-lg.border:last-child,
          .bg-card.rounded-lg.border:last-child *,
          .print-info,
          .print-info * {
            visibility: visible !important;
          }

          /* Hide sidebar and navigation */
          [data-sidebar],
          [data-sidebar="sidebar"],
          aside,
          nav,
          button,
          select,
          input,
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Hide the header section completely */
          .flex.flex-col.md\\:flex-row.justify-between.items-start.md\\:items-center.mb-6,
          .grid.grid-cols-1.md\\:grid-cols-4.gap-4,
          .p-4.border-b {
            display: none !important;
            visibility: hidden !important;
          }

          /* Reset layout for print */
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .min-h-screen.flex.w-full {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          main {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .max-w-7xl.mx-auto.space-y-6 {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            space-y: 0 !important;
          }

          /* Position table at top of page */
          .bg-card.rounded-lg.border:last-child {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
          }

          /* Style the table */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 !important;
            font-size: 10px !important;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 4px !important;
            text-align: left !important;
            background: white !important;
          }

          thead th {
            background: #f5f5f5 !important;
            font-weight: bold !important;
          }

          /* Show print info at top */
          .print-info {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            padding: 10px !important;
            font-size: 12px !important;
            border-bottom: 1px solid #000 !important;
            margin-bottom: 10px !important;
          }

          /* Adjust table position when print-info is present */
          .bg-card.rounded-lg.border:last-child {
            top: 60px !important;
          }

          /* Page settings */
          @page {
            margin: 0.5in !important;
            size: A4 !important;
          }

          /* Optimize table for printing */
          .min-h-screen {
            min-height: auto !important;
          }

          .bg-background {
            background: white !important;
          }

          table {
            break-inside: auto !important;
            font-size: 10px !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Make text smaller for better fit */
          .text-3xl {
            font-size: 20px !important;
          }

          .text-lg {
            font-size: 14px !important;
          }

          /* Hide actions column in print */
          th:last-child,
          td:last-child {
            display: none !important;
          }

          /* Ensure proper margins */
          @page {
            margin: 0.5in;
            size: A4;
          }

          /* Show filter info in print */
          .print-info {
            display: block !important;
            margin-bottom: 10px;
            font-size: 12px;
            color: #666;
          }
        }

        /* Hide print info by default */
        .print-info {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TodaysIpdDashboard;
