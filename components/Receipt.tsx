import React from 'react';
import { CartItem } from '../types';

interface Props {
  storeName: string;
  customHeader?: string;
  items: CartItem[] | { n: string; q: number; p: number }[];
  total: number;
  date: string;
  id: string;
  type: string;
  customer: string;
}

// Helper to normalize item structure whether from Cart or History
const normalize = (items: any[]) => {
  if (!Array.isArray(items)) return [];
  return items.map(i => ({
    name: i.name || i.n || 'Unknown Item',
    qty: Number(i.qty || i.q || 0),
    price: Number(i.price || i.p || 0)
  }));
};

export const Receipt: React.FC<Props> = ({ storeName, customHeader, items, total, date, id, type, customer }) => {
  const normalizedItems = normalize(items);

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            margin: 0;
            padding: 10px;
            width: 100%;
            max-width: 100%;
            background: white;
            border: none;
            box-shadow: none;
            z-index: 99999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div id="printable-receipt" className="bg-white p-4 font-mono text-sm w-[300px] mx-auto border border-gray-200 shadow-lg mb-4 text-black relative">
        <div className="text-center border-b pb-2 mb-2 border-dashed border-gray-400">
          <h2 className="text-xl font-bold uppercase">{storeName}</h2>
          {customHeader && (
            <div className="text-xs text-gray-600 mb-1 whitespace-pre-wrap leading-tight">
              {customHeader}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">{date}</div>
          <div className="text-xs text-gray-500">ID: {id}</div>
        </div>

        <div className="space-y-2 mb-4">
          {normalizedItems.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-xs text-gray-500">{item.qty} x {item.price.toLocaleString()}</div>
              </div>
              <div className="text-right">
                {(item.qty * item.price).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span>{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Payment</span>
            <span>{type}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Customer</span>
            <span>{customer}</span>
          </div>
        </div>
        
        <div className="text-center mt-6 text-xs text-gray-500">
          Thank you for shopping!
          <br />
          Powered by ARB POS
        </div>
      </div>
    </>
  );
};