
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface FinalBillTabProps {
  patient: any;
}

const FinalBillTab = ({ patient }: FinalBillTabProps) => {
  // Fetch patient visits to get admission date
  const { data: visits } = useQuery({
    queryKey: ['patient-visits', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching visits:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!patient?.id
  });

  const admissionDate = visits && visits.length > 0 
    ? format(new Date(visits[0].visit_date), 'dd/MM/yyyy')
    : 'Not available';

  return (
    <div className="w-full bg-white p-6 border border-gray-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-2xl font-bold mb-2 py-2 border-b border-gray-300">
          {/* FINAL BILL */}
        </div>
        <div className="text-xl font-bold mb-2 py-2 border-b border-gray-300">
          ESIC
        </div>
        <div className="text-lg font-bold py-2">
          CLAIM ID - CLAIM-2025-1701
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="space-y-2 text-sm">
          <div><strong>BILL NO:</strong> BL340-2096</div>
          <div><strong>REGISTRATION NO:</strong> {/* Set to null/empty */}</div>
          <div><strong>NAME OF PATIENT:</strong> {patient?.name || 'N/A'}</div>
          <div><strong>AGE:</strong> {patient?.age || 'N/A'} YEARS</div>
          <div><strong>SEX:</strong> {patient?.gender || 'N/A'}</div>
          <div><strong>NAME OF ESIC BENEFICIARY:</strong> {patient?.name || 'N/A'}</div>
          <div><strong>RELATION WITH ESIC EMPLOYEE:</strong> SELF</div>
          <div><strong>RANK:</strong> Sep (RETD)</div>
          <div><strong>SERVICE NO:</strong> 12312807F</div>
          <div><strong>CATEGORY:</strong> <span className="bg-green-200 px-2 py-1 rounded text-xs">GENERAL</span></div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-right"><strong>DATE:</strong> {format(new Date(), 'dd/MM/yyyy')}</div>
          <div className="mt-8">
            <div><strong>DIAGNOSIS</strong></div>
            <div className="border border-gray-300 p-3 h-16 bg-gray-50 text-sm">
              {patient?.primaryDiagnosis || 'Abdominal Injury - Penetrating'}
            </div>
          </div>
          <div className="mt-4"><strong>DATE OF ADMISSION:</strong> {admissionDate}</div>
          <div><strong>DATE OF DISCHARGE:</strong> {patient?.dischargeDate ? format(new Date(patient.dischargeDate), 'dd/MM/yyyy') : 'Not discharged'}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-gray-300 mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left font-bold w-16">SR NO</th>
              <th className="border border-gray-300 p-2 text-left font-bold">ITEM</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">ESIC NABH CODE No.</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">ESIC NABH RATE</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-16">QTY</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-24">AMOUNT</th>
              <th className="border border-gray-300 p-2 text-left font-bold w-20">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 */}
            <tr>
              <td className="border border-gray-300 p-2 text-center">1)</td>
              <td className="border border-gray-300 p-2">
                <div className="font-medium">Pre-Surgical Consultation for Inpatients</div>
                <div className="text-xs text-gray-600">Dt.(04/03/2024 TO 09/03/2024)</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">350</td>
              <td className="border border-gray-300 p-2 text-center">8</td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">2800.00</td>
              <td className="border border-gray-300 p-2"></td>
            </tr>
            
            {/* Row 2 */}
            <tr>
              <td className="border border-gray-300 p-2 text-center">2)</td>
              <td className="border border-gray-300 p-2">
                <div className="font-medium">Pre-Surgical Accommodation Charges</div>
                <div className="text-xs text-gray-600">Accommodation For General Ward</div>
                <div className="text-xs text-gray-600">Dt.(04/03/2024 TO 09/03/2024)</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">1500</td>
              <td className="border border-gray-300 p-2 text-center">6</td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">12000.00</td>
              <td className="border border-gray-300 p-2"></td>
            </tr>
            
            {/* Row 9 */}
            <tr>
              <td className="border border-gray-300 p-2 text-center">9)</td>
              <td className="border border-gray-300 p-2">
                <div className="font-medium">Surgical Treatment (10/03/2024)</div>
                <div className="text-xs">Resection Bladder Neck Endoscopic</div>
                <div className="text-xs text-gray-600">Base Amount: 11308</div>
                <div className="text-xs text-gray-600">Less 10% Gen. Ward Charges as per ESIC</div>
                <div className="text-xs text-gray-600">Final Amount: 10177</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">674</td>
              <td className="border border-gray-300 p-2 text-center">
                <div className="text-xs">ward10</div>
                <div className="text-xs">11308</div>
                <div className="text-xs">1131</div>
              </td>
              <td className="border border-gray-300 p-2 text-center">1</td>
              <td className="border border-gray-300 p-2 text-center">10177.00</td>
              <td className="border border-gray-300 p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total Amount */}
      <div className="bg-black text-white p-4 font-bold text-xl flex justify-between mb-6">
        <span>TOTAL BILL AMOUNT</span>
        <span>125,882.00</span>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-5 gap-4 text-center text-sm">
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Bill Manager</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Cashier</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Patient/Attender Sign</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Med Supdt</div>
          </div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 mt-8">
            <div className="font-medium">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalBillTab;
