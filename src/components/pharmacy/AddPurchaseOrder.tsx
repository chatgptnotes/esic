import React from 'react';
import { Button } from '@/components/ui/button';

const AddPurchaseOrder: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded shadow-md w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-blue-800">Add Purchase Order</h2>
        <div className="flex gap-2">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Back</Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">Add Product</Button>
        </div>
      </div>
      {/* Colored line */}
      <div className="h-1 w-full mb-4 bg-gradient-to-r from-lime-400 via-pink-500 to-blue-500 rounded" />
      <form className="flex flex-wrap gap-6 items-center">
        <div className="flex flex-col">
          <label className="mb-1 font-medium">PO ID:</label>
          <input type="text" value="PO/25-12916" className="border border-green-700 rounded px-2 py-1 min-w-[180px]" readOnly />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Order Date: <span className="text-red-500">*</span></label>
          <input type="datetime-local" value="2025-06-24T14:16:48" className="border border-green-700 rounded px-2 py-1 min-w-[220px]" />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Order For: <span className="text-red-500">*</span></label>
          <select className="border border-green-700 rounded px-2 py-1 min-w-[200px]">
            <option>Pharmacy</option>
            <option>Lab</option>
            <option>Radiology</option>
            <option>OT</option>
          </select>
        </div>
        <div className="flex flex-col flex-1 min-w-[250px]">
          <label className="mb-1 font-medium">Supplier: <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Type To Search" className="border border-green-700 rounded px-2 py-1 w-full" />
        </div>
      </form>
    </div>
  );
};

export default AddPurchaseOrder; 