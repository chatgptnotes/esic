import React, { useState, useEffect } from 'react';
import TreatmentSheetForm from './TreatmentSheetForm';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const dummyData = [
  {
    name: 'Shankar Patel',
    id: 'IH23D13024',
    tariff: 'Private',
    total: 0,
    paid: 0,
    discount: 0,
    refund: 0,
    return: 0,
    bal: 0,
  },
  {
    name: 'Amit Sharma',
    id: 'IH23D13025',
    tariff: 'ESIC',
    total: 1000,
    paid: 800,
    discount: 50,
    refund: 0,
    return: 0,
    bal: 150,
  },
  {
    name: 'Priya Singh',
    id: 'IH23D13026',
    tariff: 'Private',
    total: 500,
    paid: 500,
    discount: 0,
    refund: 0,
    return: 0,
    bal: 0,
  },
  {
    name: 'Rahul Verma',
    id: 'IH23D13027',
    tariff: 'ESIC',
    total: 200,
    paid: 100,
    discount: 20,
    refund: 0,
    return: 0,
    bal: 80,
  },
];

export const SalesDetails: React.FC = () => {
  const [billNo, setBillNo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [allEncounter, setAllEncounter] = useState(false);
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  // Patient search state
  const [patientResults, setPatientResults] = useState<{name: string, patients_id: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Table data state
  const [tableData, setTableData] = useState<any[]>([]);

  // Fetch patients as user types
  useEffect(() => {
    const fetchPatients = async () => {
      if (patientName.length < 2) {
        setPatientResults([]);
        setShowDropdown(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('name, patients_id')
        .or(`name.ilike.%${patientName}%,patients_id.ilike.%${patientName}%`)
        .limit(10);
      if (!error && data) {
        setPatientResults(data);
        setShowDropdown(true);
      } else {
        setPatientResults([]);
        setShowDropdown(false);
      }
      setIsLoading(false);
    };
    fetchPatients();
  }, [patientName]);

  const handleSelectPatient = (patient: {name: string, patients_id: string}) => {
    setPatientName(`${patient.name} (${patient.patients_id})`);
    setShowDropdown(false);
  };

  // Fetch sales data from pharmacy_sales on mount
  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from('pharmacy_sales')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data) {
        setTableData(data);
      } else {
        setTableData([]);
      }
    };
    fetchSales();
  }, []);

  // Search handler for patient or bill
  const handlePatientSearch = async () => {
    if (!patientName.trim() && !billNo.trim()) {
      // If no search, fetch all
      const { data, error } = await supabase
        .from('pharmacy_sales')
        .select('*')
        .order('date', { ascending: false });
      setTableData(!error && data ? data : []);
      return;
    }
    let query = supabase.from('pharmacy_sales').select('*');
    if (patientName.trim()) {
      query = query.ilike('patient_name', `%${patientName.trim()}%`);
    }
    if (billNo.trim()) {
      query = query.ilike('bill_no', `%${billNo.trim()}%`);
    }
    const { data, error } = await query.order('date', { ascending: false });
    setTableData(!error && data ? data : []);
  };

  const totalBalance = dummyData.reduce((sum, row) => sum + row.bal, 0);

  return (
    <div className="p-4">
      {/* Sales Details Title */}
      <div className="text-lg font-bold text-cyan-700 mb-2">Sales Details</div>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-2 rounded mb-2">
        <label className="font-semibold">Bill No.</label>
        <input
          className="border px-2 py-1 rounded min-w-[180px]"
          placeholder="Type To Search"
          value={billNo}
          onChange={e => setBillNo(e.target.value)}
        />
        <label className="font-semibold ml-4">Patient Name/ID</label>
        <div className="relative min-w-[180px]">
        <input
            className="border px-2 py-1 rounded w-full"
          placeholder="Type To Search"
          value={patientName}
          onChange={e => setPatientName(e.target.value)}
            onFocus={() => { if (patientResults.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && (
            <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto shadow">
              {isLoading && <div className="p-2 text-gray-500">Loading...</div>}
              {!isLoading && patientResults.length === 0 && <div className="p-2 text-gray-500">No results</div>}
              {!isLoading && patientResults.map((p) => (
                <div
                  key={p.patients_id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onMouseDown={() => handleSelectPatient(p)}
                >
                  <span className="font-semibold">{p.name}</span> <span className="text-xs text-gray-500">({p.patients_id})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <label className="flex items-center ml-4">
          <input
            type="checkbox"
            className="mr-1"
            checked={allEncounter}
            onChange={e => setAllEncounter(e.target.checked)}
          />
          All Encounter
        </label>
        <label className="font-semibold ml-4">Date</label>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-1 rounded ml-2" onClick={handlePatientSearch}>Search</button>
        <button className="bg-blue-500 text-white px-4 py-1 rounded ml-2">Back</button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-400 text-white">
              <th className="px-2 py-1 text-left">Bill No.</th>
              <th className="px-2 py-1 text-left">Patient Name/ID</th>
              <th className="px-2 py-1 text-left">Total</th>
              <th className="px-2 py-1 text-left">Paid</th>
              <th className="px-2 py-1 text-left">Discount</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={row.id || idx} className="bg-gray-200 border-b">
                <td className="px-2 py-1">{row.bill_no}</td>
                <td className="px-2 py-1">
                  <div className="font-semibold">{row.patient_name}</div>
                  <div className="text-xs text-gray-700">{row.patient_id}</div>
                </td>
                <td className="px-2 py-1">{row.total?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.paid?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.discount?.toFixed(2) ?? '0.00'}</td>
                <td className="px-2 py-1">{row.date ? new Date(row.date).toLocaleDateString() : ''}</td>
                <td className="px-2 py-1 flex gap-1">
                  <span title="View Daywise Bills" className="cursor-pointer" onClick={() => navigate(`/daywise-bills?id=${row.patient_id}`)}>🔍</span>
                  <span title="Pay" className="cursor-pointer">💰</span>
                  <span title="Download" className="cursor-pointer">⬇️</span>
                  <span title="Edit" className="cursor-pointer text-gray-400">✏️</span>
                </td>
              </tr>
            ))}
            {/* Total Balance Amount row */}
            <tr className="bg-white">
              <td colSpan={6} className="px-2 py-1 font-semibold text-right">Total Balance Amount:</td>
              <td className="px-2 py-1 font-semibold">{tableData.reduce((sum, row) => sum + (row.total || 0), 0).toFixed(2)}</td>
            </tr>
            {/* Pagination row */}
            <tr className="bg-gray-300">
              <td colSpan={7} className="px-2 py-1 text-center">
                <span className="mx-2">◀ Previous</span>
                <span className="mx-2">Next ▶</span>
                <span className="mx-2">1 of 1</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesDetails; 