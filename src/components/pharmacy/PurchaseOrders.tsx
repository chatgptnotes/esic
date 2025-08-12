// Purchase Orders Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

const dummyOrders = [
  { sr: 1, po: 'PO/22-12881', orderFor: 'Pharmacy', supplier: 'ASIAN SURGICALS CO.', type: 'Pharmacy', status: 'Pending', created: '24/03/2022 18:20:27' },
  { sr: 2, po: 'PO/22-12764', orderFor: 'Pharmacy', supplier: 'NEW METRO MEDICAL AGENCIES', type: 'Pharmacy', status: 'Pending', created: '21/02/2022 20:31:53' },
  { sr: 3, po: 'PO/21-12010', orderFor: 'Pharmacy', supplier: 'FIRST PHARMACY', type: 'Pharmacy', status: 'Pending', created: '24/03/2021 14:22:54' },
  { sr: 4, po: 'PO/21-11968', orderFor: 'Pharmacy', supplier: 'FIRST PHARMACY', type: 'Pharmacy', status: 'Pending', created: '14/03/2021 15:59:35' },
  { sr: 5, po: 'PO/21-11948', orderFor: 'Pharmacy', supplier: 'ASIAN SURGICALS CO.', type: 'Pharmacy', status: 'Pending', created: '08/03/2021 19:14:59' },
  { sr: 6, po: 'PO/21-11938', orderFor: 'Pharmacy', supplier: 'FIRST PHARMACY', type: 'Pharmacy', status: 'Pending', created: '04/03/2021 10:01:21' },
  { sr: 7, po: 'PO/21-11925', orderFor: 'Pharmacy', supplier: 'FIRST PHARMACY', type: 'Pharmacy', status: 'Pending', created: '01/03/2021 13:46:25' },
  { sr: 8, po: 'PO/21-11915', orderFor: 'Pharmacy', supplier: 'ASIAN SURGICALS CO.', type: 'Pharmacy', status: 'Pending', created: '24/02/2021 19:03:38' },
  { sr: 9, po: 'PO/21-11854', orderFor: 'Pharmacy', supplier: 'ASIAN SURGICALS CO.', type: 'Pharmacy', status: 'Pending', created: '07/02/2021 07:31:08' },
  { sr: 10, po: 'PO/21-11833', orderFor: 'Pharmacy', supplier: 'WAHI MEDICINE POINT', type: 'Pharmacy', status: 'Pending', created: '30/01/2021 22:19:12' },
  { sr: 11, po: 'PO/21-11814', orderFor: 'Pharmacy', supplier: 'ASIAN SURGICALS CO.', type: 'Pharmacy', status: 'Pending', created: '27/01/2021 07:41:55' },
  { sr: 12, po: 'PO/21-11807', orderFor: 'Pharmacy', supplier: 'WAHI MEDICINE POINT', type: 'Pharmacy', status: 'Pending', created: '24/01/2021 21:50:55' },
  { sr: 13, po: 'PO/21-11802', orderFor: 'Pharmacy', supplier: 'JAISWAL MEDICAL STORES CHEMIST DRUGGIST', type: 'Pharmacy', status: 'Pending', created: '23/01/2021 21:12:28' },
];

const PurchaseOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-800">Purchase Orders list</h2>
        <div className="flex gap-2">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Add Purchase Order</Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Back</Button>
        </div>
      </div>
      <div className="h-1 w-full mb-2 bg-gradient-to-r from-lime-400 via-pink-500 to-blue-500 rounded" />
      <div className="bg-gray-200 p-4 rounded flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span>Service Provider :</span>
          <input type="text" placeholder="Type To Search" className="border px-2 py-1 rounded min-w-[180px]" />
        </div>
        <div className="flex items-center gap-2">
          <span>Purchase Order No :</span>
          <input type="text" placeholder="Type To Search" className="border px-2 py-1 rounded min-w-[180px]" />
        </div>
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <select className="border px-2 py-1 rounded" value={status} onChange={e => setStatus(e.target.value)}>
            <option>All</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">Search</Button>
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full border border-gray-400 text-sm">
          <thead className="bg-gray-300 text-black">
            <tr>
              <th className="border border-gray-400 p-2">Sr.No.</th>
              <th className="border border-gray-400 p-2">Purchase Order No.</th>
              <th className="border border-gray-400 p-2">Order For.</th>
              <th className="border border-gray-400 p-2">Supplier</th>
              <th className="border border-gray-400 p-2">Type</th>
              <th className="border border-gray-400 p-2">Status</th>
              <th className="border border-gray-400 p-2">Created Date</th>
              <th className="border border-gray-400 p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {dummyOrders.map(order => (
              <tr key={order.sr} className="even:bg-gray-100">
                <td className="border border-gray-400 p-2 text-center">{order.sr}</td>
                <td className="border border-gray-400 p-2">{order.po}</td>
                <td className="border border-gray-400 p-2">{order.orderFor}</td>
                <td className="border border-gray-400 p-2">{order.supplier}</td>
                <td className="border border-gray-400 p-2">{order.type}</td>
                <td className="border border-gray-400 p-2">{order.status}</td>
                <td className="border border-gray-400 p-2">{order.created}</td>
                <td className="border border-gray-400 p-2 text-center">
                  <span className="inline-flex gap-2">
                    <span title="View" className="cursor-pointer text-blue-600">🔍</span>
                    <span title="Edit" className="cursor-pointer text-green-600">✏️</span>
                    <span title="Delete" className="cursor-pointer text-red-600">🗑️</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span>1</span>
        <span>|</span>
        <span>2</span>
        <span>|</span>
        <span>3</span>
        <span>|</span>
        <span>4</span>
        <span>|</span>
        <span>5</span>
        <span>|</span>
        <span>6</span>
        <span>|</span>
        <span>7</span>
        <span>|</span>
        <span>8</span>
        <span>|</span>
        <span>9</span>
        <span className="ml-2 text-blue-600 cursor-pointer">&laquo; Previous</span>
        <span className="text-blue-600 cursor-pointer">Next &raquo;</span>
        <span className="ml-2">1 of 642</span>
      </div>
    </div>
  );
};

export default PurchaseOrders; 