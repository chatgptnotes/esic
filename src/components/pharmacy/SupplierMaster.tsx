// Supplier Master Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Textarea 
} from '@/components/ui/textarea';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Filter,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  Pencil
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  accountNumber: string;
  dlNo: string;
  cstNo: string;
  sTaxNo: string;
  phone: string;
}

const dummySuppliers: Supplier[] = [
  { id: '1', name: 'A.R MEDICAL & SURGICALS', accountNumber: 'PHDQ7J3YH', dlNo: '20B-MH-NAG-68619,21B-MH-NAG-68620', cstNo: '27011458794P', sTaxNo: '27011458794C', phone: '9923272868 9371987473' },
  { id: '2', name: 'ABHAYANKAR AUSHADI VYAVASAI.', accountNumber: 'ABH001', dlNo: 'B 10315', cstNo: '', sTaxNo: '440002/S/1654', phone: '' },
  { id: '3', name: 'ADARSH SALES WHOLESALE DEALER IN MEDICINES', accountNumber: 'PHDSYR19C', dlNo: '20B-10394 21B-3274', cstNo: '', sTaxNo: '', phone: '0712-2768330,2764330' },
  { id: '4', name: 'ADVANTAGE SURGICALS CO.', accountNumber: 'ASC002', dlNo: '', cstNo: '', sTaxNo: '', phone: '9422122658' },
  { id: '5', name: 'AGRAWAL AGENCIES', accountNumber: 'PHF24LH69', dlNo: '20-136/09,21-136/09', cstNo: '', sTaxNo: '', phone: '07122763246,2766886' },
  { id: '6', name: 'ajay medical stors', accountNumber: 'PH1XYUE2S', dlNo: '20/nag/1203/2002 21/nag/1203/2002', cstNo: '', sTaxNo: '', phone: '2634310' },
  { id: '7', name: 'AJIT PHARMATICS', accountNumber: 'PH4Y3PFSQ', dlNo: '20/MH/NAG/136/2009 21/MH/NAG/136/2009', cstNo: '', sTaxNo: '', phone: '9028058600,8087087360' },
];

// Accept an optional prop 'activeTab' to control which tab is shown
interface SupplierMasterProps {
  activeTab?: 'supplier' | 'manufacturer';
    }

const SupplierMaster: React.FC<SupplierMasterProps> = ({ activeTab: propActiveTab }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [suppliers] = useState(dummySuppliers);
  const [search, setSearch] = useState('');
  // Remove local dropdownOpen and activeTab state
  const activeTab = propActiveTab ?? 'supplier';

  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      {/* Only show supplier table if activeTab is supplier */}
      {activeTab === 'supplier' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 items-center">
                  <input
                className="border rounded px-2 py-1 w-64"
                placeholder="Types to Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">Search</Button>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowDialog(true)}>Add Supplier</Button>
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-100 border border-gray-300">
              <thead>
                <tr className="bg-gray-400 text-white text-sm">
                  <th className="px-2 py-1 border">Supplier Name</th>
                  <th className="px-2 py-1 border">Account Number</th>
                  <th className="px-2 py-1 border">DL No.</th>
                  <th className="px-2 py-1 border">CST No.</th>
                  <th className="px-2 py-1 border">S.Tax No.</th>
                  <th className="px-2 py-1 border">Phone</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id} className={idx % 2 === 0 ? 'bg-gray-200' : 'bg-white'}>
                    <td className="px-2 py-1 border font-semibold">{s.name}</td>
                    <td className="px-2 py-1 border">{s.accountNumber}</td>
                    <td className="px-2 py-1 border">{s.dlNo}</td>
                    <td className="px-2 py-1 border">{s.cstNo}</td>
                    <td className="px-2 py-1 border">{s.sTaxNo}</td>
                    <td className="px-2 py-1 border">{s.phone}</td>
                    <td className="px-2 py-1 border text-center">
                      <button className="inline-block mx-1 text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                      <button className="inline-block mx-1 text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* Add Supplier Dialog (full form as per screenshot) */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-5xl">
            <h3 className="text-lg font-bold mb-4">Add Supplier</h3>
            <form className="grid grid-cols-2 gap-x-8 gap-y-3">
              {/* Left column */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <span>Supplier Name<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Supplier Code<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Supplier Type</span>
                  <select className="border rounded px-2 py-1 flex-1">
                    <option>Please select</option>
                    <option>Distributor</option>
                    <option>Wholesaler</option>
                    <option>Retailer</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span>Phone</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Credit Limit<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Email</span>
                  <input className="border rounded px-2 py-1 flex-1" type="email" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Pin</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>DL No.<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Account Group<span className="text-red-500">*</span></span>
                  <select className="border rounded px-2 py-1 flex-1" required>
                    <option>Please Select</option>
                    <option>Pharmacy</option>
                    <option>General</option>
                  </select>
                </label>
              </div>
              {/* Right column */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2">
                  <span>CST<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>S. Tax No.<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2 items-start">
                  <span>Address</span>
                  <textarea className="border rounded px-2 py-1 flex-1 min-h-[60px]" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Credit Day<span className="text-red-500">*</span></span>
                  <input className="border rounded px-2 py-1 flex-1" required />
                </label>
                <label className="flex items-center gap-2">
                  <span>Bank or Branch</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
                <label className="flex items-center gap-2">
                  <span>Mobile</span>
                  <input className="border rounded px-2 py-1 flex-1" />
                </label>
              </div>
              {/* Submit button */}
              <div className="col-span-2 flex justify-end mt-4">
                <Button type="button" className="bg-gray-300 text-black mr-2" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">Submit</Button>
              </div>
            </form>
              </div>
            </div>
      )}
      {/* Add after the supplier section */}
      {activeTab === 'manufacturer' && (
        <div className="w-full">
          <h2 className="text-xl font-bold text-green-800 mb-0">Manufacturing Company</h2>
          <div className="h-1 w-full mb-6" style={{background: 'linear-gradient(90deg, #ff9800, #e91e63, #3f51b5, #4caf50)'}}></div>
          <form className="flex items-center justify-end gap-4 mb-6">
            <label className="font-semibold text-gray-700 mr-2 whitespace-nowrap">Manufacture Company Name<span className="text-red-500">*</span></label>
              <input
              className="border border-gray-400 rounded px-4 py-2 text-lg flex-1 max-w-2xl"
              placeholder="add new manufacturer company name"
              // value and onChange for controlled input (dummy for now)
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Submit</button>
            <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Back</button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-blue-100 text-blue-900 text-base font-bold">
                  <th className="px-4 py-2 border">Manufacture Company Name</th>
                  <th className="px-4 py-2 border">Edit</th>
                  <th className="px-4 py-2 border">Delete</th>
                </tr>
              </thead>
              <tbody>
                {/* Dummy manufacturer data */}
                {['AALAY','AALTRA MED','AAN PHARMA','ABARIS HEALTHCARE PVT LTD','ABBOTT INDIA LTD','accilex creirical care','ACETOP HEALTH CARE','ACIDWALA & COMPANY','ACME LIFESCIENCE','ACTIVE HEALTH CARE','ACULIFE HEALTHCARE PVT.LTD','adalbart','ADDONIS LAB','ADOKAN PHARMA','ADROIT LTD'].map((name, idx) => (
                  <tr key={idx} className="bg-gray-100 border-b">
                    <td className="px-4 py-2 border font-semibold">{name}</td>
                    <td className="px-4 py-2 border text-center">
                      <span className="inline-block cursor-pointer"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6v-6l9.293-9.293a1 1 0 00-1.414-1.414L9 13.586V21z" /></svg></span>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <span className="inline-block cursor-pointer"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm0 0V3m0 2v2" /></svg></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierMaster; 