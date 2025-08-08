import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ESICLetterGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  additionalApprovalSurgery?: string;
  additionalApprovalInvestigation?: string;
  extensionOfStayApproval?: string;
  patientData?: any;
}

export const ESICLetterGenerator: React.FC<ESICLetterGeneratorProps> = ({
  isOpen,
  onClose,
  additionalApprovalSurgery,
  additionalApprovalInvestigation,
  extensionOfStayApproval,
  patientData
}) => {
  const [formData, setFormData] = useState({
    patientName: patientData?.name || '',
    patientAge: patientData?.age || '',
    ipNumber: patientData?.insurance_person_no || '',
    diagnosis: '',
    requestType: 'extension', // 'extension', 'surgery', 'investigation'
    daysRequested: '10',
    effectiveDate: '',
    additionalDetails: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateLetter = async () => {
    setIsGenerating(true);
    
    try {
      // Use patient data to fill the template
      const patientName = formData.patientName || 'Not Provided';
      const patientAge = formData.patientAge || 'Not Provided';
      const claimId = formData.ipNumber || 'Not Provided';
      const diagnosis = formData.diagnosis || 'Not Provided';
      const daysRequested = formData.daysRequested || '10';
      const effectiveDate = formData.effectiveDate || new Date().toLocaleDateString('en-GB');

      // Create the exact template format
      const letterContent = `TO
 CMO,
 E.S.I.C SOMWARIPETH  HOSPITAL,
 NAGPUR.

SUB: REGARDING ENHANCEMENT FOR HOSPITALISATION

RESPECTED SIR/MADAM,

SUBJECT: EXTENSION OF STAY APPROVAL
Patient Name: ${patientName}, Age/Sex: ${patientAge} Years / Male with claim id : ${claimId}, with Diagnosis: ${diagnosis}.
The patient continues to require medical attention and monitoring. The current treatment plan includes ongoing medication management, regular assessments, and monitoring for potential complications. Medical management remains necessary for optimal patient outcomes.
In view of ongoing medical needs and required monitoring, a further extension of stay for ${daysRequested} days from ${effectiveDate} is recommended.${formData.additionalDetails ? `\nAdditional notes: ${formData.additionalDetails}` : ''}
Kindly approve the extension.
Regards,
 Dr. Murali B K
 MS Ortho`;

      // Generate PDF directly without calling the AI service
      generatePDF(letterContent);

      
      toast.success('ESIC letter generated successfully!');
      onClose();
    } catch (error) {
      console.error('Error generating letter:', error);
      toast.error('Failed to generate letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = (letterContent: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set font
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    
    // Split text into lines
    const lines = pdf.splitTextToSize(letterContent, pageWidth - 40);
    
    let yPosition = 30;
    const lineHeight = 7;
    
    lines.forEach((line: string, index: number) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(line, 20, yPosition);
      yPosition += lineHeight;
    });
    
    // Save the PDF
    const fileName = `ESIC_Letter_${formData.patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate ESIC Approval Letter</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                placeholder="Enter patient name"
              />
            </div>
            <div>
              <Label htmlFor="patientAge">Age *</Label>
              <Input
                id="patientAge"
                value={formData.patientAge}
                onChange={(e) => handleInputChange('patientAge', e.target.value)}
                placeholder="Enter age"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="ipNumber">IP Number *</Label>
            <Input
              id="ipNumber"
              value={formData.ipNumber}
              onChange={(e) => handleInputChange('ipNumber', e.target.value)}
              placeholder="Enter IP number"
            />
          </div>
          
          <div>
            <Label htmlFor="diagnosis">Diagnosis/Procedure *</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              placeholder="Enter diagnosis or procedure details"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="daysRequested">Days Requested (for extension)</Label>
              <Input
                id="daysRequested"
                value={formData.daysRequested}
                onChange={(e) => handleInputChange('daysRequested', e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="additionalDetails">Additional Details</Label>
            <Textarea
              id="additionalDetails"
              value={formData.additionalDetails}
              onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
              placeholder="Any additional medical details to include in the letter"
              rows={3}
            />
          </div>

          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={generateLetter}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating...' : 'Generate Letter & PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};