import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { supabase } from '@/integrations/supabase/client';

interface VisitDetailsSectionProps {
  visitDate: Date;
  setVisitDate: (date: Date) => void;
  formData: {
    visitType: string;
    appointmentWith: string;
    reasonForVisit: string;
    relationWithEmployee: string;
    status: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

export const VisitDetailsSection: React.FC<VisitDetailsSectionProps> = ({
  visitDate,
  setVisitDate,
  formData,
  handleInputChange
}) => {
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching doctors from hope_surgeons table...');
        
        const { data, error } = await supabase
          .from('hope_surgeons')
          .select('id, name, specialty')
          .order('name');
        
        if (error) {
          console.error('Error fetching doctors:', error);
          setError('Failed to load doctors');
          setDoctors([]);
        } else {
          console.log('Doctors fetched successfully:', data);
          setDoctors(data || []);
        }
      } catch (error) {
        console.error('Exception while fetching doctors:', error);
        setError('Failed to load doctors');
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setVisitDate(date);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-700 mb-4">Visit Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-2">
          <EnhancedDatePicker
            label="Visit Date"
            value={visitDate}
            onChange={handleDateChange}
            placeholder="Select visit date"
            isDOB={false}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitType" className="text-sm font-medium">
            Visit Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.visitType} onValueChange={(value) => handleInputChange('visitType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Visit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
              <SelectItem value="patient-admission">Patient Admission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 2 */}
        <div className="space-y-2">
          <Label htmlFor="appointmentWith" className="text-sm font-medium">
            Appointment With <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={formData.appointmentWith} 
            onValueChange={(value) => handleInputChange('appointmentWith', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  isLoading 
                    ? "Loading doctors..." 
                    : error 
                    ? "Error loading doctors"
                    : doctors.length === 0 
                    ? "No doctors available" 
                    : "Select Doctor"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {!isLoading && !error && doctors.length > 0 && doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.name}>
                  {doctor.name}{doctor.specialty ? ` (${doctor.specialty})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!isLoading && !error && doctors.length === 0 && (
            <p className="text-sm text-gray-500">No doctors found in the database</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reasonForVisit" className="text-sm font-medium">
            Reason for Visit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reasonForVisit"
            placeholder="Reason for visit"
            value={formData.reasonForVisit}
            onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
          />
        </div>

        {/* Row 3 */}
        <div className="space-y-2">
          <Label htmlFor="relationWithEmployee" className="text-sm font-medium">
            Relation with Employee
          </Label>
          <Select value={formData.relationWithEmployee} onValueChange={(value) => handleInputChange('relationWithEmployee', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Relation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Self</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="dependent">Dependent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
