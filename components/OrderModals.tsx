import React, { useState, useEffect } from 'react';
import { callApi } from '../services/api';
import { Button } from './Button';
import Swal from 'sweetalert2';

interface ModalProps {
  onClose: () => void;
}

// --- CONFIGURATION: EDIT PRICES HERE ---
const PLANS = [
  { id: '1m', duration: '1 Month', price: 'Rp 50.000', raw: 50000, label: 'Starter', color: 'bg-slate-100 border-slate-200' },
  { id: '6m', duration: '6 Months', price: 'Rp 250.000', raw: 250000, label: 'Saver', color: 'bg-blue-50 border-blue-200' },
  { id: '1y', duration: '1 Year', price: 'Rp 450.000', raw: 450000, label: 'Best Value', isPopular: true, color: 'bg-purple-50 border-purple-200' },
];

export const BuyTokenModal: React.FC<ModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('Loading payment info...');
  
  // Form
  const [storeName, setStoreName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  useEffect(() => {
    callApi('getPublicSettings').then(res => setPaymentInfo(res.paymentInfo)).catch(() => setPaymentInfo('Error loading info'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!storeName || !whatsapp) return;
    
    setLoading(true);
    try {
      const res = await callApi('createOrder', { 
        storeName, 
        whatsapp, 
        plan: selectedPlan.id 
      });
      setCreatedOrder(res);
      setStep(2);
    } catch (e: any) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black z-10 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
        
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Choose Your Plan</h2>
                <p className="text-slate-500 mt-2">Unlock the full power of ARB POS securely.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Plan Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`
                        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 flex flex-col items-center justify-center text-center group
                        ${selectedPlan.id === plan.id 
                          ? `border-blue-500 shadow-xl shadow-blue-500/10 scale-105 bg-white z-10` 
                          : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 grayscale hover:grayscale-0'
                        }
                      `}
                    >
                      {plan.isPopular && (
                        <span className="absolute -top-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                          BEST VALUE
                        </span>
                      )}
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{plan.label}</div>
                      <div className="text-lg font-bold text-slate-800">{plan.duration}</div>
                      <div className={`text-xl font-bold mt-2 ${selectedPlan.id === plan.id ? 'text-blue-600' : 'text-slate-600'}`}>
                        {plan.price}
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full mt-4 border-2 flex items-center justify-center ${selectedPlan.id === plan.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {selectedPlan.id === plan.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">Store Name</label>
                    <input 
                      required 
                      className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                      placeholder="e.g. Toko Berkah"
                      value={storeName} 
                      onChange={e => setStoreName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 ml-1">WhatsApp Number</label>
                    <input 
                      required 
                      type="tel"
                      className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" 
                      placeholder="e.g. 08123456789" 
                      value={whatsapp} 
                      onChange={e => setWhatsapp(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                       <div className="text-xs font-bold uppercase text-slate-400">Total Payment</div>
                       <div className="text-2xl font-bold text-slate-800">{selectedPlan.price}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-xs text-slate-400">Plan Selected</div>
                       <div className="font-semibold text-blue-600">{selectedPlan.duration}</div>
                     </div>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-4 mt-2">
                    <div className="text-xs font-bold uppercase text-slate-400 mb-2">Transfer To:</div>
                    <pre className="font-sans text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{paymentInfo}</pre>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  isLoading={loading} 
                  className="w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition hover:-translate-y-1"
                >
                  Place Order
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Order Received!</h2>
              <p className="text-slate-500 mb-8 max-w-md">Your Order ID has been generated. Please complete your payment to activate your token.</p>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 w-full max-w-sm mb-8 relative group">
                <div className="text-xs uppercase text-slate-400 font-bold mb-2">Order ID</div>
                <div className="font-mono text-3xl font-bold text-slate-800 tracking-wider select-all">{createdOrder?.orderId}</div>
                <div className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition">Double click to copy</div>
              </div>

              <p className="text-sm text-slate-400 mb-8 max-w-sm">
                After payment, send the proof to Admin. Your token will be sent to <strong>{whatsapp}</strong>.
              </p>
              <Button onClick={onClose} variant="secondary" className="w-full max-w-xs">Return to Login</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CheckStatusModal: React.FC<ModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query) return;
    setLoading(true);
    try {
      const res = await callApi('checkOrderStatus', { query });
      setResult(res);
    } catch (e: any) {
      Swal.fire('Not Found', 'Order ID or WhatsApp not found.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black">✕</button>
        
        <h2 className="text-xl font-bold mb-1">Track Order</h2>
        <p className="text-sm text-slate-500 mb-6">Enter your Order ID or WhatsApp number.</p>
        
        <form onSubmit={handleCheck} className="flex gap-2 mb-6">
          <input 
            className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Order ID / WA..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button type="submit" isLoading={loading} className="rounded-xl px-6">Check</Button>
        </form>

        {result && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold">Store</div>
                <div className="font-bold text-slate-800">{result.storeName}</div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${result.status==='APPROVED'?'bg-green-100 text-green-700':result.status==='REJECTED'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                {result.status}
              </span>
            </div>

            {result.status === 'APPROVED' ? (
               <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                 <div className="text-center mb-2">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">✓</div>
                    <div className="text-xs text-green-800 font-bold uppercase">Token Activated</div>
                 </div>
                 <div className="bg-slate-100 p-3 rounded-lg text-center">
                    <div className="font-mono text-lg font-bold select-all break-all text-slate-800 tracking-wider">{result.token}</div>
                 </div>
                 <div className="text-center text-[10px] text-slate-400 mt-2">Use this token to login</div>
               </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-4 bg-white rounded-xl border border-slate-100">
                {result.status === 'PENDING' ? '⏳ Waiting for admin confirmation.' : '✕ Order rejected. Contact admin.'}
              </div>
            )}
            
            <div className="mt-4 text-[10px] text-slate-400 text-center font-mono">ID: {result.orderId}</div>
          </div>
        )}
      </div>
    </div>
  );
};
