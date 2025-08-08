import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

interface LabTest {
  name: string;
  observedValue: string;
  normalRange: string;
  unit?: string;
  description?: string;
}

interface LabReportPrintFormatProps {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientId?: string;
  reportDate?: string;
  reportType?: string;
  doctorName?: string;
  doctorQualification?: string;
  tests?: LabTest[];
}

const LabReportPrintFormat: React.FC<LabReportPrintFormatProps> = ({
  patientName = "John Doe",
  patientAge = "45",
  patientGender = "Male",
  patientId = "P001",
  reportDate = new Date().toLocaleDateString(),
  reportType = "Report on BIOCHEMISTRY",
  doctorName = "DR. ARUN AGRE",
  doctorQualification = "MD (PATHOLOGY)",
  tests = [
    {
      name: "CRP QUANTITATIVE",
      observedValue: "34 mg/L",
      normalRange: "- Up to 6.0 mg/L",
      description: "CRP is an acute phase reactant which is used in inflammatory disorders for monitoring course and effect of therapy. It is most useful as an indicator of activity in Rheumatoid arthritis, Rheumatic fever, tissue injury or necrosis and infections. As compared to ESR, CRP shows an earlier rise in inflammatory disorders which begins in 4-6 hrs, the intensity of the rise being higher than ESR and the recovery being earlier than ESR. Unlike ESR, CRP levels are not influenced by hematologic conditions like Anemia, Polycythemia etc."
    }
  ]
}) => {
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF functionality
    console.log('Downloading report as PDF...');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Print Controls */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow-lg print:shadow-none print:bg-white">
        <Card className="border-0 print:border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold underline mb-4">{reportType}</h1>
            </div>

            {/* Patient Info - Could be added if needed */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Patient Name:</strong> {patientName}
                </div>
                <div>
                  <strong>Patient ID:</strong> {patientId}
                </div>
                <div>
                  <strong>Age/Gender:</strong> {patientAge}/{patientGender}
                </div>
                <div>
                  <strong>Report Date:</strong> {reportDate}
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="border-t-2 border-b-2 border-black">
              <div className="grid grid-cols-3 py-3 font-bold text-center">
                <div className="border-r border-black">INVESTIGATION</div>
                <div className="border-r border-black">OBSERVED VALUE</div>
                <div>NORMAL RANGE</div>
              </div>
            </div>

            {/* Test Results */}
            {tests.map((test, index) => (
              <div key={index} className="border-b border-gray-300">
                {/* Test Name Row */}
                <div className="py-4">
                  <div className="font-bold text-lg mb-2">{test.name}</div>
                  <div className="grid grid-cols-3 items-center">
                    <div className="italic font-medium">{test.name}</div>
                    <div className="text-center font-bold">{test.observedValue}</div>
                    <div className="text-center">{test.normalRange}</div>
                  </div>
                </div>

                {/* Description */}
                {test.description && (
                  <div className="pb-4">
                    <p className="text-sm leading-relaxed text-justify">
                      {test.description}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Footer with Doctor Signature */}
            <div className="mt-16 flex justify-end">
              <div className="text-center">
                {/* Signature Space */}
                <div className="mb-4">
                  <div className="w-48 h-16 border-b border-gray-400 mb-2 flex items-end justify-center">
                    <span className="text-2xl font-cursive">Dr. Signature</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-bold">{doctorName}</div>
                  <div>{doctorQualification}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-0 {
            border: none !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          @page {
            margin: 1in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};

export default LabReportPrintFormat; 