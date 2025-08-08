import React from 'react';
import { useParams } from 'react-router-dom';

export default function DischargeSummaryPrint() {
  const { visitId } = useParams<{ visitId: string }>();

  const handlePrint = () => {
    window.print();
  };

  if (!visitId) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Visit ID is required to display discharge summary.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Print Button - Hidden in print */}
      <div className="no-print mb-4 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Print Discharge Summary
        </button>
      </div>

      {/* Discharge Summary Content */}
      <div className="max-w-4xl mx-auto border-2 border-black p-8">
        {/* Hospital Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">ADAMRIT HOSPITAL</h1>
          <p className="text-gray-600">Hospital Management Information System</p>
          <div className="mt-4 p-4 border-2 border-black">
            <h2 className="text-2xl font-bold">DISCHARGE SUMMARY</h2>
            <p className="text-lg">Visit ID: {visitId}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            PATIENT INFORMATION
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> ___________________</p>
              <p><strong>Age/Gender:</strong> ___________________</p>
              <p><strong>Patient ID:</strong> ___________________</p>
            </div>
            <div>
              <p><strong>Admission Date:</strong> ___________________</p>
              <p><strong>Discharge Date:</strong> ___________________</p>
              <p><strong>Length of Stay:</strong> ___________________</p>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            CLINICAL INFORMATION
          </h3>
          <div className="space-y-4">
            <div>
              <p><strong>Primary Diagnosis:</strong></p>
              <div className="border-b border-dotted border-black h-8 w-full"></div>
            </div>
            <div>
              <p><strong>Secondary Diagnosis:</strong></p>
              <div className="border-b border-dotted border-black h-8 w-full"></div>
            </div>
            <div>
              <p><strong>Procedures Performed:</strong></p>
              <div className="border-b border-dotted border-black h-8 w-full"></div>
              <div className="border-b border-dotted border-black h-8 w-full mt-2"></div>
            </div>
          </div>
        </div>

        {/* Hospital Course */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            HOSPITAL COURSE
          </h3>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
            ))}
          </div>
        </div>

        {/* Discharge Instructions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold border-b-2 border-black pb-2 mb-4">
            DISCHARGE INSTRUCTIONS
          </h3>
          <div className="space-y-4">
            <div>
              <p><strong>Medications:</strong></p>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
                ))}
              </div>
            </div>
            <div>
              <p><strong>Activity Restrictions:</strong></p>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
                ))}
              </div>
            </div>
            <div>
              <p><strong>Follow-up Instructions:</strong></p>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-dotted border-black h-6 w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <div className="border-b-2 border-black h-16 mb-2"></div>
            <p className="font-semibold">ATTENDING PHYSICIAN</p>
            <p className="text-sm text-gray-600">Name & Signature</p>
            <p className="text-sm text-gray-600">Date: ___________</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-black h-16 mb-2"></div>
            <p className="font-semibold">MEDICAL OFFICER</p>
            <p className="text-sm text-gray-600">Name & Signature</p>
            <p className="text-sm text-gray-600">Date: ___________</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Generated on: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}