
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FormActionsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  formData,
  onInputChange,
  isSubmitting,
  onCancel
}) => {
  return (
    <>
      {/* Type Section */}
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">
          Type
        </Label>
        <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Please Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ipd">IPD</SelectItem>
            <SelectItem value="opd">OPD</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save And Next'}
        </Button>
      </div>
    </>
  );
};
