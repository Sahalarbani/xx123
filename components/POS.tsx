import React, { useState, useEffect, useMemo } from 'react';
import { callApi } from '../services/api';
import { Product, CartItem, AuthState } from '../types';
import Swal from 'sweetalert2';
import { Button } from './Button';
import { DebtManager } from './DebtManager';
import { ProductManager } from './ProductManager';
import { TransactionHistory } from './TransactionHistory';
import { Receipt } from './Receipt';

interface Props {
  auth: AuthState;
  onLogout: () => void;
}

type Tab = 'CASHIER' | 'INVENTORY' | 'HISTORY' | 'DEBT';

export const POS: React.FC<Props> = ({ auth, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CASHIER');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState(''); 
  const [paymentType, setPaymentType] = useState<'CASH' | 'DEBT'>('CASH');
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await callApi('getStoreData', { token: auth.token });
      setProducts(data.products || []);
    } catch (e: any) {
      Swal.fire('Error', 'Failed to load products: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Max stock reached', timer: 1500, showConfirmButton: false });
          return prev;
        }
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const newQty = p.qty + delta;
          if (newQty <= 0) return p;
          const original = products.find(prod => prod.id === id);
          if (original && newQty > original.stock) return p;
          return { ...p, qty: newQty };
        }
        return p;
      });
    });
  };

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.qty), 0), [cart]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'DEBT' && !customerName.trim()) {
      Swal.fire('Validation', 'Customer name required for debt.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await callApi('processTransaction', {
        token: auth.token,
        cart: cart.map(c => ({ id: c.id, qty: c.qty, name: c.name, price: c.price })),
        total,
        paymentType,
        customerName: paymentType === 'DEBT' ? customerName : 'Walk-in'
      });

      // Show Receipt
      setLastReceipt({
        id: res.transactionId,
        date: res.date,
        items: [...cart],
        total,
        type: paymentType,
        customer: paymentType === 'DEBT' ? customerName : 'Walk-in'
      });

      // Reset
      setCart([]);
      setIsCheckingOut(false);
      setCustomerName('');
      loadProducts(); // Refresh stock
    } catch (e: any) {
      Swal.fire('Transaction Failed', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white p-3 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase opacity-80">ARB POS</h1>
            <div className="text-lg font-bold leading-none">{auth.storeName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden md:flex bg-slate-800 rounded-lg p-1 mr-4">
             {[
               {id: 'CASHIER', label: 'Cashier', icon: '🛒'},
               {id: 'INVENTORY', label: 'Inventory', icon: '📦'},
               {id: 'HISTORY', label: 'History', icon: '📜'},
               {id: 'DEBT', label: 'Debt', icon: '📓'},
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as Tab)}
                 className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
               >
                 <span>{tab.icon}</span>
                 {tab.label}
               </button>
             ))}
           </div>
           <Button variant="danger" className="text-xs" onClick={onLogout}>Logout</Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        
        {/* MOBILE NAVIGATION DROPDOWN (Visible only on small screens) */}
        <div className="md:hidden mb-4">
           <select 
             className="w-full p-3 rounded-lg border bg-white font-bold"
             value={activeTab}
             onChange={(e) => setActiveTab(e.target.value as Tab)}
           >
             <option value="CASHIER">🛒 Cashier</option>
             <option value="INVENTORY">📦 Inventory</option>
             <option value="HISTORY">📜 History</option>
             <option value="DEBT">📓 Debt Manager</option>
           </select>
        </div>

        {/* --- VIEW: CASHIER --- */}
        {activeTab === 'CASHIER' && (
          <div className="flex flex-col md:flex-row h-full gap-4">
            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b">
                <input 
                  className="w-full p-3 rounded-lg border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => p.stock > 0 && addToCart(p)}
                    className={`bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between transition active:scale-95 cursor-pointer relative group ${p.stock === 0 ? 'opacity-50 grayscale' : 'hover:border-blue-400 hover:shadow-md'}`}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                       <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">+</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{p.name}</h3>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{p.category}</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-dashed flex justify-between items-end">
                      <span className="font-bold text-blue-600">{p.price.toLocaleString()}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Cart */}
            <div className="w-full md:w-96 bg-white rounded-xl shadow-xl flex flex-col border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                 <span className="font-bold text-slate-700">Current Order</span>
                 <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{cart.length} Items</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span>Cart is empty</span>
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.price.toLocaleString()} x {item.qty}</div>
                    </div>
                    <div className="flex items-center gap-1 mx-2">
                      <button className="w-6 h-6 bg-white border rounded hover:bg-slate-100 font-bold text-slate-500" onClick={() => updateQty(item.id, -1)}>-</button>
                      <span className="font-mono w-6 text-center text-sm">{item.qty}</span>
                      <button className="w-6 h-6 bg-white border rounded hover:bg-slate-100 font-bold text-slate-500" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <div className="font-mono text-sm font-bold min-w-[3rem] text-right">
                      {(item.price * item.qty).toLocaleString()}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="ml-1 text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t bg-slate-50 space-y-3">
                 <div className="flex justify-between text-2xl font-bold text-slate-800">
                   <span>Total</span>
                   <span>{total.toLocaleString()}</span>
                 </div>
                 <Button className="w-full py-3 text-lg shadow-lg shadow-blue-500/20" disabled={cart.length === 0} onClick={() => setIsCheckingOut(true)}>
                   Charge {total.toLocaleString()}
                 </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: INVENTORY --- */}
        {activeTab === 'INVENTORY' && (
          <ProductManager authToken={auth.token} products={products} onRefresh={loadProducts} />
        )}

        {/* --- VIEW: HISTORY --- */}
        {activeTab === 'HISTORY' && (
          <TransactionHistory authToken={auth.token} storeName={auth.storeName} />
        )}

        {/* --- VIEW: DEBT --- */}
        {activeTab === 'DEBT' && (
           <div className="h-full bg-white rounded-lg shadow border p-4">
             <div className="max-w-xl mx-auto mt-10">
                <Button onClick={() => setActiveTab('CASHIER')} className="mb-4">← Back to Cashier</Button>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 text-center mb-6">
                  <h2 className="text-2xl font-bold text-purple-800">Debt Manager</h2>
                  <p className="text-purple-600">Search customers and manage payments</p>
                </div>
                {/* Embed Debt Manager Logic Here - Reusing the Modal Logic but inline */}
                <button 
                  onClick={() => { /* This is a bit hacky, normally we'd refactor DebtManager to be inlineable */ 
                    const btn = document.getElementById('open-debt-modal');
                    if(btn) btn.click();
                  }}
                  className="w-full p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-500 hover:text-purple-600 transition flex items-center justify-center gap-2 font-bold text-slate-500"
                >
                  Click to Open Debt Tool Overlay
                </button>
                <DebtManager authToken={auth.token} onClose={() => setActiveTab('CASHIER')} />
             </div>
           </div>
        )}

      </div>

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 text-center">Payment Method</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentType('CASH')}
                  className={`p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${paymentType === 'CASH' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  <span className="text-2xl">💵</span>
                  Cash
                </button>
                <button 
                   onClick={() => setPaymentType('DEBT')}
                   className={`p-4 rounded-xl border-2 font-bold transition flex flex-col items-center gap-2 ${paymentType === 'DEBT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                   <span className="text-2xl">📝</span>
                   Debt / Hutang
                </button>
              </div>

              {paymentType === 'DEBT' && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                  <label className="block text-xs font-bold uppercase text-red-500 mb-1">Customer Name</label>
                  <input 
                    className="w-full p-3 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" 
                    placeholder="Enter name..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="py-4 text-center">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Amount</div>
                <div className="text-4xl font-bold text-slate-800 mt-1">{total.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsCheckingOut(false)}>Cancel</Button>
              <Button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCheckout} isLoading={loading}>Complete Sale</Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-200 p-4 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
             <Receipt {...lastReceipt} storeName={auth.storeName} />
             <div className="flex gap-2 mt-4 justify-center">
               <Button onClick={() => setLastReceipt(null)} variant="secondary">Close</Button>
               <Button onClick={() => window.print()}>Print</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};