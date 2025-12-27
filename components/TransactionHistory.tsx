import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { callApi } from '../services/api';
import { Button } from './Button';
import { Receipt } from './Receipt';
import Swal from 'sweetalert2';

interface Props {
  authToken: string;
  storeName: string;
}

export const TransactionHistory: React.FC<Props> = ({ authToken, storeName }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await callApi('getStoreHistory', { token: authToken });
      setTransactions(res);
    } catch (e: any) {
      Swal.fire('Error', 'Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700">Transaction History (Last 100)</h2>
        <Button onClick={fetchHistory} variant="secondary" isLoading={loading}>Refresh</Button>
      </div>

      <div className="flex-1 overflow-auto flex">
        {/* List */}
        <div className={`${selectedTx ? 'hidden md:block w-1/2' : 'w-full'} overflow-y-auto border-r`}>
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Date</th>
                <th className="p-3 border-b">Total</th>
                <th className="p-3 border-b">Customer</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => setSelectedTx(t)}
                  className={`cursor-pointer hover:bg-blue-50 border-b ${selectedTx?.id === t.id ? 'bg-blue-100' : ''}`}
                >
                  <td className="p-3 font-mono text-xs">{t.id}</td>
                  <td className="p-3 text-xs">{t.date}</td>
                  <td className="p-3 font-bold">{t.total.toLocaleString()}</td>
                  <td className="p-3 text-sm">{t.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && !loading && (
             <div className="p-10 text-center text-slate-400">No transactions found.</div>
          )}
        </div>

        {/* Detail / Receipt View */}
        {selectedTx && (
          <div className="flex-1 bg-slate-100 p-6 flex flex-col items-center overflow-y-auto">
            <div className="mb-4 flex justify-between w-[300px]">
               <Button variant="secondary" onClick={() => setSelectedTx(null)} className="md:hidden">Back</Button>
               <Button onClick={handlePrint} className="ml-auto">🖨 Print</Button>
            </div>
            
            <Receipt 
              storeName={storeName}
              id={selectedTx.id}
              date={selectedTx.date}
              total={selectedTx.total}
              type={selectedTx.type}
              customer={selectedTx.customer}
              items={selectedTx.items}
            />
          </div>
        )}
      </div>
    </div>
  );
};