import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';
import { EditPatientRegistrationDialog } from '@/components/EditPatientRegistrationDialog';
import { VisitRegistrationForm } from '@/components/VisitRegistrationForm';
import { PatientDetailsModal } from '@/components/PatientDetailsModal';
import { PatientLookup } from '@/components/PatientLookup';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { NavigationTabs } from '@/components/dashboard/NavigationTabs';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { PatientsTable } from '@/components/dashboard/PatientsTable';
import { PatientWorkflowVisual } from '@/components/dashboard/PatientWorkflowVisual';
import { DeletePatientDialog } from '@/components/dashboard/DeletePatientDialog';

const PatientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; patients_id?: string } | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<any>(null);
  const [patientToDelete, setPatientToDelete] = useState<{ id: string; name: string; patients_id?: string } | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['dashboard-patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, patients_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }

      return data || [];
    }
  });

  const handleViewPatient = (patient: { id: string; name: string; patients_id?: string }) => {
    setSelectedPatient(patient);
    setIsPatientDetailsOpen(true);
  };

  const handleVisitRegistration = (patient: { id: string; name: string; patients_id?: string }) => {
    setSelectedPatient(patient);
    setIsVisitFormOpen(true);
  };

  const handleEditPatient = (patient: any) => {
    setPatientToEdit(patient);
    setIsEditDialogOpen(true);
  };

  const handleDeletePatient = (patient: { id: string; name: string; patients_id?: string }) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const handlePatientDeleted = () => {
    window.location.reload();
  };

  const handlePatientLookupSelect = (patient: any) => {
    // Use patients_id if available, otherwise fallback to id
    const patientForVisit = {
      id: patient.id,
      name: patient.name,
      patients_id: patient.patients_id
    };
    setSelectedPatient(patientForVisit);
    setIsVisitFormOpen(true);
  };

  const handleNewPatientFromLookup = () => {
    setIsRegistrationFormOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patients_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading patients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <NavigationTabs activeTab="Patients" />

        <ActionButtons 
          onNewPatientClick={() => setIsRegistrationFormOpen(true)}
          onPatientLookupClick={() => setIsPatientLookupOpen(true)}
        />

        <PatientWorkflowVisual />

        <PatientsTable 
          patients={filteredPatients}
          onViewPatient={handleViewPatient}
          onVisitRegistration={handleVisitRegistration}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
        />

        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No patients found matching your search criteria.
          </div>
        )}

        <PatientRegistrationForm
          isOpen={isRegistrationFormOpen}
          onClose={() => setIsRegistrationFormOpen(false)}
        />

        <EditPatientRegistrationDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setPatientToEdit(null);
          }}
          patient={patientToEdit}
        />

        <PatientLookup
          isOpen={isPatientLookupOpen}
          onClose={() => setIsPatientLookupOpen(false)}
          onPatientSelected={handlePatientLookupSelect}
          onNewPatientRegistration={handleNewPatientFromLookup}
        />

        {selectedPatient && (
          <VisitRegistrationForm
            isOpen={isVisitFormOpen}
            onClose={() => {
              setIsVisitFormOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
          />
        )}

        {selectedPatient && (
          <PatientDetailsModal
            isOpen={isPatientDetailsOpen}
            onClose={() => {
              setIsPatientDetailsOpen(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
          />
        )}

        <DeletePatientDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setPatientToDelete(null);
          }}
          patient={patientToDelete}
          onPatientDeleted={handlePatientDeleted}
        />
      </div>
    </div>
  );
};

export default PatientDashboard;
