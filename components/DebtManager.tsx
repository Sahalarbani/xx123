import React, { useState } from 'react';
import { callApi } from '../services/api';
import { Customer } from '../types';
import { Button } from './Button';
import Swal from 'sweetalert2';

interface Props {
  authToken: string;
  onClose: () => void;
}

export const DebtManager: React.FC<Props> = ({ authToken, onClose }) => {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query) return;
    
    setLoading(true);
    try {
      const res = await callApi('searchCustomer', { token: authToken, query });
      setCustomers(res);
      if(res.length === 0) Swal.fire('Info', 'No customers found', 'info');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = async () => {
    if (!selectedCust || !payAmount) return;
    
    const amount = parseInt(payAmount);
    if (isNaN(amount) || amount <= 0) return Swal.fire('Error', 'Invalid amount', 'error');

    setLoading(true);
    try {
      const res = await callApi('processDebtPayment', {
        token: authToken,
        customerId: selectedCust.id,
        amount
      });
      
      Swal.fire('Success', `Payment processed. New Balance: ${res.newBalance}`, 'success');
      setSelectedCust(null);
      setPayAmount('');
      setCustomers([]); // Reset list
      setQuery('');
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg">Debt (Hutang) Manager</h2>
          <button onClick={onClose} className="hover:bg-purple-700 p-2 rounded">✕</button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {!selectedCust ? (
            <>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                  autoFocus
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Search customer name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <Button type="submit" isLoading={loading}>Search</Button>
              </form>

              <div className="space-y-2">
                {customers.map(c => (
                  <div key={c.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCust(c)}>
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-sm text-slate-500">ID: {c.id.substring(0,6)}</div>
                    </div>
                    <div className="text-red-600 font-mono font-bold">
                      Debt: ${c.debt.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="text-sm text-slate-500">Selected Customer</div>
                <div className="text-xl font-bold">{selectedCust.name}</div>
                <div className="text-2xl text-red-600 font-mono mt-2">
                  Current Debt: ${selectedCust.debt.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Amount</label>
                <input 
                  type="number"
                  className="w-full p-3 border rounded-lg text-lg"
                  placeholder="0"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setSelectedCust(null)} className="flex-1">Back</Button>
                <Button variant="success" onClick={handlePayDebt} isLoading={loading} className="flex-1">Pay Debt</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
