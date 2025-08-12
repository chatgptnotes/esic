import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ViewBill = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();

  // Fetch bill data with all related information
  const { data: billData, isLoading } = useQuery({
    queryKey: ['view-bill', billId],
    queryFn: async () => {
      if (!billId) return null;

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients!bills_patient_id_fkey(
            *
          ),
          bill_sections(*),
          bill_line_items(*)
        `)
        .eq('id', billId)
        .single();

      if (error) {
        console.error('Error fetching bill:', error);
        throw error;
      }

      return data;
    },
    enabled: !!billId
  });

  // Fetch patient_data separately
  const { data: patientDataFromTable } = useQuery({
    queryKey: ['patient-data', billData?.patient_id],
    queryFn: async () => {
      if (!billData?.patient_id) return null;

      const { data, error } = await supabase
        .from('patient_data')
        .select('*')
        .eq('patient_uuid', billData.patient_id)
        .single();

      if (error) {
        console.error('Error fetching patient data:', error);
        return null;
      }

      return data;
    },
    enabled: !!billData?.patient_id
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-4">The requested bill could not be found.</p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const patientData = patientDataFromTable || billData.patients;

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { margin: 0; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-table { width: 100% !important; border-collapse: collapse !important; }
            .print-border { border: 1px solid black !important; }
            .print-text-center { text-align: center !important; }
            .print-text-left { text-align: left !important; }
            .print-text-right { text-align: right !important; }
            .print-font-bold { font-weight: bold !important; }
            .print-p-2 { padding: 8px !important; }
            .print-p-4 { padding: 16px !important; }
            .print-mb-4 { margin-bottom: 16px !important; }
            .print-bg-gray { background-color: #f5f5f5 !important; }
            table { page-break-inside: avoid; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
        `
      }} />

      <div className="max-w-6xl mx-auto p-4">
        {/* Header - Hidden in print */}
        <div className="mb-6 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bills
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bill #{billData.bill_no || billData.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-gray-600">
                  Created on {format(new Date(billData.created_at), 'dd/MM/yyyy')} at {format(new Date(billData.created_at), 'HH:mm:ss')}
                </p>
              </div>
            </div>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Bill
            </Button>
          </div>
        </div>

        {/* Final Bill Layout - Exact match to FinalBill.tsx */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Bill Header */}
          <div className="border border-gray-300 mb-4">
            <div className="bg-gray-100 p-3 text-center border-b border-gray-300">
              <h1 className="text-xl font-bold">FINAL BILL</h1>
            </div>
            <div className="bg-gray-100 p-2 text-center border-b border-gray-300">
              <span className="font-semibold">ESIC</span>
            </div>
            <div className="p-2 text-center">
              <span className="font-semibold">CLAIM ID:</span> {billData.claim_id || billData.id.slice(0, 8)}
            </div>
          </div>

          {/* Patient Information Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">BILL NO:</span></div>
                <div>{billData.bill_no || billData.id.slice(0, 8)}</div>

                <div><span className="font-semibold">REGISTRATION NO:</span></div>
                <div>{patientData?.patient_id || patientData?.patients_id || 'N/A'}</div>

                <div><span className="font-semibold">NAME OF PATIENT:</span></div>
                <div>{patientData?.patient_name || patientData?.name || 'N/A'}</div>

                <div><span className="font-semibold">AGE:</span></div>
                <div>{patientData?.age || 'N/A'}</div>

                <div><span className="font-semibold">SEX:</span></div>
                <div>{patientData?.sex || 'N/A'}</div>

                <div><span className="font-semibold">NAME OF ESIC BENEFICIARY:</span></div>
                <div>{patientData?.patient_name || patientData?.name || 'N/A'}</div>

                <div><span className="font-semibold">RELATION WITH IP:</span></div>
                <div>SELF</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">DATE:</span></div>
                <div>{format(new Date(billData.created_at), 'dd/MM/yyyy')}</div>

                <div><span className="font-semibold">DATE OF ADMISSION:</span></div>
                <div>{patientData?.date_of_admission ? format(new Date(patientData.date_of_admission), 'dd/MM/yyyy') : 'N/A'}</div>

                <div><span className="font-semibold">DATE OF DISCHARGE:</span></div>
                <div>{patientData?.date_of_discharge ? format(new Date(patientData.date_of_discharge), 'dd/MM/yyyy') : 'N/A'}</div>

                <div><span className="font-semibold">IP NO:</span></div>
                <div>{patientData?.mrn || 'N/A'}</div>

                <div><span className="font-semibold">SERVICE NO:</span></div>
                <div>{patientData?.patient_id || 'N/A'}</div>

                <div><span className="font-semibold">CATEGORY:</span></div>
                <div className="bg-green-200 px-2 py-1 rounded text-center">{billData.category || 'GENERAL'}</div>

                <div><span className="font-semibold">DIAGNOSIS:</span></div>
                <div>{patientData?.diagnosis_and_surgery_performed || 'No diagnosis'}</div>
              </div>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="border border-gray-300 mb-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">SR NO</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">ITEM</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">CGHS NABH CODE NO.</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">CGHS NABH RATE</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">QTY</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">AMOUNT</th>
                  <th className="border border-gray-300 p-2 text-left text-sm font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {/* Conservative Treatment */}
                <tr>
                  <td colSpan={7} className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                    Conservative Treatment
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">1</td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <span>04/03/2024 - 06/03/2024</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-blue-600">
                      ✓
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <span>04/03/2024 - 06/03/2024</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-blue-600">
                      ✓
                    </Button>
                  </td>
                </tr>

                {/* Surgical Package */}
                <tr>
                  <td colSpan={7} className="border border-gray-300 p-2 bg-gray-50 font-semibold">
                    Surgical Package (6 Days)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">2</td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <span>06/03/2024 - 06/03/2024</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-blue-600">
                      ✓
                    </Button>
                  </td>
                </tr>

                {/* Consultation for Inpatients */}
                <tr>
                  <td className="border border-gray-300 p-2">3</td>
                  <td className="border border-gray-300 p-2">Consultation for Inpatients</td>
                  <td className="border border-gray-300 p-2">
                    <span className="bg-blue-100 px-2 py-1 rounded text-sm">Accommodation with Conservative Treatment</span>
                  </td>
                  <td className="border border-gray-300 p-2">350</td>
                  <td className="border border-gray-300 p-2">8</td>
                  <td className="border border-gray-300 p-2">2800</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                {/* Accommodation Charges */}
                <tr>
                  <td className="border border-gray-300 p-2">4</td>
                  <td className="border border-gray-300 p-2">Accommodation Charges</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">5</td>
                  <td className="border border-gray-300 p-2">Accommodation of General Ward</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">1500</td>
                  <td className="border border-gray-300 p-2">6</td>
                  <td className="border border-gray-300 p-2">9000</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex items-center gap-2">
                      <span>04/03/2024 - 06/03/2024</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>

                {/* Pathology Charges */}
                <tr>
                  <td className="border border-gray-300 p-2">6</td>
                  <td className="border border-gray-300 p-2">Pathology Charges</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">7</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">250</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">1</td>
                  <td className="border border-gray-300 p-2">250</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                {/* Medicine Charges */}
                <tr>
                  <td className="border border-gray-300 p-2">8</td>
                  <td className="border border-gray-300 p-2">Medicine Charges</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">9</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">10</td>
                  <td className="border border-gray-300 p-2">10</td>
                  <td className="border border-gray-300 p-2">100</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                {/* Other Charges */}
                <tr>
                  <td className="border border-gray-300 p-2">10</td>
                  <td className="border border-gray-300 p-2">Other Charges</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">11</td>
                  <td className="border border-gray-300 p-2">ECG</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">500</td>
                  <td className="border border-gray-300 p-2">1</td>
                  <td className="border border-gray-300 p-2">58</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                {/* Miscellaneous Charges */}
                <tr>
                  <td className="border border-gray-300 p-2">12</td>
                  <td className="border border-gray-300 p-2">Miscellaneous Charges</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">13</td>
                  <td className="border border-gray-300 p-2">Registration</td>
                  <td className="border border-gray-300 p-2"></td>
                  <td className="border border-gray-300 p-2">500</td>
                  <td className="border border-gray-300 p-2">1</td>
                  <td className="border border-gray-300 p-2">500</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                {/* Surgical Treatment */}
                <tr>
                  <td className="border border-gray-300 p-2">14</td>
                  <td className="border border-gray-300 p-2">Surgical Treatment</td>
                  <td className="border border-gray-300 p-2">Code</td>
                  <td className="border border-gray-300 p-2">Adjustment Details</td>
                  <td className="border border-gray-300 p-2">Amount</td>
                  <td className="border border-gray-300 p-2">Final Amount</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      Add
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">15</td>
                  <td className="border border-gray-300 p-2">PCNs - Unlicensed</td>
                  <td className="border border-gray-300 p-2">540</td>
                  <td className="border border-gray-300 p-2">No Adjustment ✓</td>
                  <td className="border border-gray-300 p-2">33000</td>
                  <td className="border border-gray-300 p-2">₹33000</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">16</td>
                  <td className="border border-gray-300 p-2">DJ Stent</td>
                  <td className="border border-gray-300 p-2">UNLISTED</td>
                  <td className="border border-gray-300 p-2">No Adjustment ✓</td>
                  <td className="border border-gray-300 p-2">10000</td>
                  <td className="border border-gray-300 p-2">₹10000</td>
                  <td className="border border-gray-300 p-2">
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Amount */}
          <div className="bg-black text-white p-4 text-center">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">TOTAL BILL AMOUNT</span>
              <span className="text-2xl font-bold">{formatCurrency(billData.total_amount || 45708)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>This is a computer-generated bill. No signature required.</p>
            <p>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBill;
