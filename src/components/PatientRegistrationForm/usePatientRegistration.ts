
// @ts-nocheck
import { useState } from 'react';
import { PatientFormData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { generatePatientId } from '@/utils/patientIdGenerator';

export const usePatientRegistration = (onClose: () => void) => {
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<PatientFormData>({
    patientName: '',
    corporate: '',
    insurancePersonNo: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    secondEmergencyContactName: '',
    secondEmergencyContactMobile: '',
    aadharPassport: '',
    quarterPlotNo: '',
    ward: '',
    panchayat: '',
    relationshipManager: '',
    pinCode: '',
    state: '',
    cityTown: '',
    bloodGroup: '',
    spouseName: '',
    allergies: '',
    relativePhoneNo: '',
    instructions: '',
    identityType: '',
    email: '',
    privilegeCardNumber: '',
    billingLink: '',
    type: '',
    patientPhoto: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      patientName: '',
      corporate: '',
      insurancePersonNo: '',
      age: '',
      gender: '',
      phone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactMobile: '',
      secondEmergencyContactName: '',
      secondEmergencyContactMobile: '',
      aadharPassport: '',
      quarterPlotNo: '',
      ward: '',
      panchayat: '',
      relationshipManager: '',
      pinCode: '',
      state: '',
      cityTown: '',
      bloodGroup: '',
      spouseName: '',
      allergies: '',
      relativePhoneNo: '',
      instructions: '',
      identityType: '',
      email: '',
      privilegeCardNumber: '',
      billingLink: '',
      type: '',
      patientPhoto: ''
    });
    setDateOfBirth(undefined);
  };

  const validateForm = (): boolean => {
    if (!formData.patientName || !formData.corporate || !formData.age || !formData.gender || 
        !formData.phone || !formData.address || !formData.emergencyContactName || 
        !formData.emergencyContactMobile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return false;
    }

    // Check if ESIC is selected but Insurance Person No. is empty
    if (formData.corporate === 'esic' && !formData.insurancePersonNo) {
      toast({
        title: "Error",
        description: "Insurance Person No. is required for ESIC patients",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Generate custom patient ID
      const customPatientId = await generatePatientId();
      console.log('Generated custom patient ID:', customPatientId);

      // Create record in patients table
      const patientData = {
        patients_id: customPatientId,
        name: formData.patientName,
        insurance_person_no: formData.corporate === 'esic' ? formData.insurancePersonNo : null,
        corporate: formData.corporate,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_mobile: formData.emergencyContactMobile,
        second_emergency_contact_name: formData.secondEmergencyContactName || null,
        second_emergency_contact_mobile: formData.secondEmergencyContactMobile || null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        aadhar_passport: formData.aadharPassport || null,
        quarter_plot_no: formData.quarterPlotNo || null,
        ward: formData.ward || null,
        panchayat: formData.panchayat || null,
        relationship_manager: formData.relationshipManager || null,
        pin_code: formData.pinCode || null,
        state: formData.state || null,
        city_town: formData.cityTown || null,
        blood_group: formData.bloodGroup || null,
        spouse_name: formData.spouseName || null,
        allergies: formData.allergies || null,
        relative_phone_no: formData.relativePhoneNo || null,
        instructions: formData.instructions || null,
        identity_type: formData.identityType || null,
        email: formData.email || null,
        privilege_card_number: formData.privilegeCardNumber || null,
        billing_link: formData.billingLink || null
      };

      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        throw error;
      }

      console.log('Patient registered successfully in patients table:', newPatient);

      // IMPORTANT: Create initial record in patient_data table with proper patient_id
      try {
        const patientDataRecord = {
          patient_name: formData.patientName,
          patient_id: customPatientId, // CRITICAL: Use readable patient_id, not UUID
          age: formData.age || '',
          sex: formData.gender || '',
          patient_type: formData.corporate || '',
          // Set default values for required fields
          mrn: '', // Will be set when first visit is created
          sst_or_secondary_treatment: formData.corporate === 'esic' ? 'ESIC' : 'Private',
          referral_original_yes_no: 'No',
          e_pahachan_card_yes_no: 'No',
          hitlabh_or_entitelment_benefits_yes_no: 'No',
          adhar_card_yes_no: formData.aadharPassport ? 'Yes' : 'No',
          remark_1: `Patient ID: ${customPatientId}`,
          remark_2: `Registered: ${new Date().toLocaleDateString()}`
        };

        console.log('CREATING patient_data record with patient_id:', customPatientId);

        const { data: patientDataResult, error: patientDataError } = await supabase
          .from('patient_data')
          .insert(patientDataRecord)
          .select()
          .single();

        if (patientDataError) {
          console.error('Error creating patient_data record:', patientDataError);
          // Don't fail the whole process for this
        } else {
          console.log('Patient_data record created successfully:', patientDataResult);
          console.log('Stored patient_id in patient_data:', patientDataResult.patient_id);
        }
      } catch (patientDataError) {
        console.error('Error handling patient_data creation:', patientDataError);
      }

      toast({
        title: "Success",
        description: `Patient registered successfully! Patient ID: ${customPatientId}`,
      });

      // Refresh the patients list
      queryClient.invalidateQueries({ queryKey: ['dashboard-patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-data'] });
      queryClient.invalidateQueries({ queryKey: ['spreadsheet-data'] });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return {
    formData,
    dateOfBirth,
    isSubmitting,
    handleInputChange,
    setDateOfBirth,
    handleSubmit,
    handleCancel
  };
};
