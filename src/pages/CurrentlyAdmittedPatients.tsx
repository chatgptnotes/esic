import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Edit, Users, Calendar, Clock, FileText, Building2, Shield, AlertTriangle, Filter } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { DischargeWorkflowPanel } from '@/components/discharge/DischargeWorkflowPanel';
import { CascadingBillingStatusDropdown } from '@/components/shared/CascadingBillingStatusDropdown';

interface Visit {
  id: string;
  visit_id: string;
  visit_date: string;
  admission_date: string | null;
  discharge_date: string | null;
  surgery_date: string | null;
  sr_no: string | null;
  bunch_no: string | null;
  status: string;
  sst_treatment: string | null;
  intimation_done: string | null;
  cghs_code: string | null;
  package_amount: number | null;
  billing_executive: string | null;
  extension_taken: string | null;
  delay_waiver_intimation: string | null;
  surgical_approval: string | null;
  remark1: string | null;
  remark2: string | null;
  created_at: string;
  visit_type: string;
  billing_status: string | null;
  file_status: string | null;
  condonation_delay_submission: string | null;
  condonation_delay_intimation: string | null;
  extension_of_stay: string | null;
  additional_approvals: string | null;
  patients: {
    id: string;
    name: string;
    age: number;
    gender: string;
    patients_id: string;
    insurance_person_no: string | null;
  };
  visit_diagnoses: Array<{
    diagnoses: {
      name: string;
    };
  }>;
  visit_hope_surgeons: Array<{
    hope_surgeons: {
      name: string;
    };
  }>;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString('en-GB');
  } catch {
    return "-";
  }
};

const formatTime = (dateString?: string): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
};

const getDaysAdmitted = (admissionDate?: string): string => {
  if (!admissionDate) return "-";
  try {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } catch {
    return "-";
  }
};

// Input component for billing executive
const BillingExecutiveInput = ({ visit }: { visit: Visit }) => {
  const [value, setValue] = useState(visit.billing_executive || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from('visits')
        .update({ billing_executive: newValue })
        .eq('id', visit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Billing executive updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update billing executive",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleBlur = () => {
    if (value !== (visit.billing_executive || '')) {
      setIsUpdating(true);
      updateMutation.mutate(value);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        className="min-w-[150px]"
        placeholder="Enter billing executive"
        disabled={isUpdating}
      />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

// Dropdown component for billing status - now using shared cascading dropdown
const BillingStatusDropdown = ({ visit }: { visit: Visit }) => {
  return (
    <CascadingBillingStatusDropdown
      visit={visit}
      queryKey={['currently-admitted-visits']}
    />
  );
};

// Generic 3-state toggle component

// Generic 3-state toggle component
const ThreeStateToggle = ({
  visit,
  field,
  onUpdate
}: {
  visit: Visit;
  field: keyof Visit;
  onUpdate: (visitId: string, field: string, value: string) => void;
}) => {
  const value = visit[field] as string;

  const getNextState = (current: string | null) => {
    switch (current) {
      case 'taken': return 'not_taken';
      case 'not_taken': return 'not_required';
      case 'not_required': return 'taken';
      default: return 'taken';
    }
  };

  const getStateDisplay = (state: string | null) => {
    switch (state) {
      case 'taken': return { text: 'Taken', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'not_taken': return { text: 'Not Taken', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'not_required': return { text: 'Not Required', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
      default: return { text: 'Not Set', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const handleClick = () => {
    const nextState = getNextState(value);
    onUpdate(visit.id, field as string, nextState);
  };

  const display = getStateDisplay(value);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`px-3 py-1 rounded-full text-xs font-medium ${display.className}`}
    >
      {display.text}
    </Button>
  );
};

// Reusable multi-select column filter using DropdownMenu
const ColumnFilter = ({
  options,
  selected,
  onChange,
  buttonLabel = 'Filter'
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  buttonLabel?: string;
}) => {
  const toggleValue = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

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
          <DropdownMenuCheckboxItem
            key={opt}
            checked={selected.includes(opt)}
            onCheckedChange={() => onChange(toggleValue(selected, opt))}
          >
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


// Specific toggle components
const FileStatusToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="file_status" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CondonationDelayToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="condonation_delay_submission" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CondonationDelayIntimationToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="condonation_delay_intimation" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const ExtensionOfStayToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Extension of stay updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update extension of stay",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="extension_of_stay" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const AdditionalApprovalsToggle = ({ visit }: { visit: Visit }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ visitId, field, value }: { visitId: string; field: string; value: string }) => {
      const { error } = await supabase
        .from('visits')
        .update({ [field]: value })
        .eq('id', visitId);


      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currently-admitted-visits'] });
      toast({
        title: "Success",
        description: "Additional approvals updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update additional approvals",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleUpdate = (visitId: string, field: string, value: string) => {
    setIsUpdating(true);
    updateMutation.mutate({ visitId, field, value });
  };

  return (
    <div className="relative">
      <ThreeStateToggle visit={visit} field="additional_approvals" onUpdate={handleUpdate} />
      {isUpdating && (
        <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
      )}
    </div>
  );
};

const CurrentlyAdmittedPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Column filters state (multi-select)
  const [fileStatusFilter, setFileStatusFilter] = useState<string[]>([]);
  const [condonationSubmissionFilter, setCondonationSubmissionFilter] = useState<string[]>([]);
  const [condonationIntimationFilter, setCondonationIntimationFilter] = useState<string[]>([]);
  const [extensionOfStayFilter, setExtensionOfStayFilter] = useState<string[]>([]);
  const [additionalApprovalsFilter, setAdditionalApprovalsFilter] = useState<string[]>([]);



  const { data: visits = [], isLoading, error } = useQuery({
    queryKey: ['currently-admitted-visits'],
    queryFn: async () => {
      console.log('Fetching currently admitted visits...');


      // First get all visits with admission but that are not fully discharged
      const { data: visitsData, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients!inner(
            id,
            name,
            age,
            gender,
            patients_id,
            insurance_person_no
          ),
          visit_diagnoses(
            diagnoses(
              name
            )
          ),
          visit_hope_surgeons(
            hope_surgeons(
              name
            )
          )
        `)
        .not('admission_date', 'is', null) // Only get visits with admission date
        .order('admission_date', { ascending: false });

      if (error) {
        console.error('Error fetching visits:', error);
        throw error;
      }

      if (!visitsData || visitsData.length === 0) {
        console.log('No visits found');
        return [];
      }

      // Get discharge checklists for all visits
      const visitIds = visitsData.map(visit => visit.id);
      const { data: checklists, error: checklistError } = await supabase
        .from('discharge_checklist')
        .select('*')
        .in('visit_id', visitIds);

      if (checklistError) {
        console.error('Error fetching discharge checklists:', checklistError);
        // Continue without checklists if there's an error
      }

      // Filter visits based on discharge status
      const currentlyAdmittedVisits = visitsData.filter(visit => {
        // If no discharge date is set, patient is definitely still admitted
        if (!visit.discharge_date) {
          return true;
        }

        // If discharge date is set, check if discharge checklist is fully completed
        const checklist = checklists?.find(c => c.visit_id === visit.id);
        if (!checklist) {
          // No checklist means discharge process hasn't started properly
          return true;
        }

        // Check if ALL required checklist items are completed
        const isFullyDischarged =
          checklist.doctor_signature &&
          checklist.discharge_summary_uploaded &&
          checklist.nurse_clearance &&
          checklist.pharmacy_clearance &&
          checklist.final_bill_generated &&
          checklist.final_bill_printed &&
          checklist.payment_verified &&
          checklist.gate_pass_generated &&
          checklist.patient_signature;

        // Patient is still admitted if checklist is not fully completed
        return !isFullyDischarged;
      });

      console.log('Currently admitted visits fetched:', currentlyAdmittedVisits?.length);
      return currentlyAdmittedVisits || [];
    },
  });

  // Compute unique option lists for filters from current data (no hooks)
  const getDistinct = (arr: (string | null)[]) => Array.from(new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0)));
  const fileStatusOptions = getDistinct((visits || []).map((v: Visit) => v.file_status));
  const condonationSubmissionOptions = getDistinct((visits || []).map((v: Visit) => v.condonation_delay_submission));
  const condonationIntimationOptions = getDistinct((visits || []).map((v: Visit) => v.condonation_delay_intimation));
  const extensionOfStayOptions = getDistinct((visits || []).map((v: Visit) => v.extension_of_stay));
  const additionalApprovalsOptions = getDistinct((visits || []).map((v: Visit) => v.additional_approvals));

  const filteredVisits = (visits || []).filter((visit: Visit) => {
    const matchesSearch = !searchTerm ||
      visit.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patients?.patients_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visit_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visit.billing_status === statusFilter;

    const includeBy = (selected: string[], value?: string | null) =>
      selected.length === 0 || (value ? selected.includes(value) : false);

    const matchesFile = includeBy(fileStatusFilter, visit.file_status);
    const matchesCondSub = includeBy(condonationSubmissionFilter, visit.condonation_delay_submission);
    const matchesCondInt = includeBy(condonationIntimationFilter, visit.condonation_delay_intimation);
    const matchesExtStay = includeBy(extensionOfStayFilter, visit.extension_of_stay);
    const matchesAddAppr = includeBy(additionalApprovalsFilter, visit.additional_approvals);

    return matchesSearch && matchesStatus && matchesFile && matchesCondSub && matchesCondInt && matchesExtStay && matchesAddAppr;
  });

  const stats = (() => {
    const total = filteredVisits.length;
    const pending = filteredVisits.filter(v => v.billing_status === 'pending').length;
    const completed = filteredVisits.filter(v => v.billing_status === 'completed').length;
    const avgStay = filteredVisits.reduce((acc, visit) => {
      if (visit.admission_date) {
        const days = Math.ceil((Date.now() - new Date(visit.admission_date).getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }
      return acc;
    }, 0) / (total || 1);

    return { total, pending, completed, avgStay: Math.round(avgStay) };
  })();

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading currently admitted patients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Currently Admitted Patients</h1>
          <p className="text-gray-600 mt-1">Patients currently in the hospital (not discharged)</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admitted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Currently in hospital
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Billing</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Billing incomplete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Ready for discharge
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgStay}</div>
            <p className="text-xs text-muted-foreground">
              Days in hospital
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name, ID, or visit ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>


            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading currently admitted patients...</span>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center p-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No currently admitted patients</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No patients match your current filters.'
                  : 'There are no patients currently admitted to the hospital.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Visit ID</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">Discharge Workflow</TableHead>
                    <TableHead className="font-semibold">Bill</TableHead>
                    <TableHead className="font-semibold">Billing Executive</TableHead>
                    <TableHead className="font-semibold">Billing Status</TableHead>
                    <TableHead className="font-semibold">File Status</TableHead>
                    <TableHead className="font-semibold">Condonation Delay -submission</TableHead>
                    <TableHead className="font-semibold">Condonation Delay -intimation</TableHead>
                    <TableHead className="font-semibold">Extension of Stay</TableHead>
                    <TableHead className="font-semibold">Additional Approvals</TableHead>
                    <TableHead className="font-semibold">Admission Date</TableHead>
                    <TableHead className="font-semibold">Days Admitted</TableHead>
                    <TableHead className="font-semibold">Discharge Date</TableHead>
                    <TableHead className="font-semibold">Visit Type</TableHead>
                    <TableHead className="font-semibold">Doctor</TableHead>
                    <TableHead className="font-semibold">Diagnosis</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                  <TableRow>
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
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">{visit.visit_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{visit.patients?.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {visit.patients?.patients_id} | {visit.patients?.age}yrs | {visit.patients?.gender}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Shield className="h-4 w-4" />
                              {visit.discharge_date ? 'Manage Discharge' : 'Start Discharge'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Discharge Workflow Management</DialogTitle>
                            </DialogHeader>
                            <DischargeWorkflowPanel visit={visit} />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/final-bill/${visit.visit_id}`)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Bill
                        </Button>
                      </TableCell>
                      <TableCell>
                        <BillingExecutiveInput visit={visit} />
                      </TableCell>
                      <TableCell>
                        <BillingStatusDropdown visit={visit} />
                      </TableCell>
                      <TableCell>
                        <FileStatusToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <CondonationDelayToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <CondonationDelayIntimationToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <ExtensionOfStayToggle visit={visit} />
                      </TableCell>
                      <TableCell>
                        <AdditionalApprovalsToggle visit={visit} />
                      </TableCell>
                      <TableCell>{formatDate(visit.admission_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {getDaysAdmitted(visit.admission_date)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(visit.discharge_date || undefined)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {visit.visit_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {visit.visit_hope_surgeons?.map(vs => vs.hope_surgeons?.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {visit.visit_diagnoses?.map(vd => vd.diagnoses?.name).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        {formatTime(visit.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/patient-profile?patientId=${visit.patients?.id}&visitId=${visit.visit_id}`)}
                          >
                            <Edit className="h-4 w-4" />
                            View Patient
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentlyAdmittedPatients;