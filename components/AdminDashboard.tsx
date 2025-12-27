import React, { useState, useEffect } from 'react';
import { callApi } from '../services/api';
import { TokenData, OrderData } from '../types';
import Swal from 'sweetalert2';
import { Button } from './Button';

interface Props {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [tab, setTab] = useState<'TOKENS' | 'ORDERS' | 'SETTINGS'>('TOKENS');
  const [loading, setLoading] = useState(false);

  // Tokens Data
  const [tokens, setTokens] = useState<TokenData[]>([]);
  // Orders Data
  const [orders, setOrders] = useState<OrderData[]>([]);
  // Settings Data
  const [webhookUrl, setWebhookUrl] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  
  // Forms
  const [storeName, setStoreName] = useState('');
  const [duration, setDuration] = useState('1m');

  // Security Form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (tab === 'TOKENS') fetchTokens();
    if (tab === 'ORDERS') fetchOrders();
    if (tab === 'SETTINGS') fetchSettings();
  }, [tab]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const data = await callApi('adminGetTokens', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED' });
      setTokens(data);
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await callApi('adminGetOrders', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED' });
      setOrders(data);
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await callApi('adminGetSettings', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED' });
      setWebhookUrl(data.webhookUrl || '');
      setPaymentInfo(data.paymentInfo || '');
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  // --- ACTIONS ---

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!storeName) return;
    setLoading(true);
    try {
      await callApi('adminGenerateToken', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED', storeName, duration });
      Swal.fire('Success', 'Token Generated', 'success');
      setStoreName('');
      fetchTokens();
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  const handleResetDevice = async (token: string) => {
    if ((await Swal.fire({ title: 'Reset Device Lock?', icon: 'warning', showCancelButton: true })).isConfirmed) {
      setLoading(true);
      try {
        await callApi('adminResetDevice', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED', targetToken: token });
        Swal.fire('Unlocked', 'Device ID cleared.', 'success');
        fetchTokens();
      } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    }
  };

  const handleProcessOrder = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    setLoading(true);
    try {
      await callApi('adminProcessOrder', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED', orderId, action });
      Swal.fire('Success', `Order ${action}D`, 'success');
      fetchOrders();
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await callApi('adminSaveSettings', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED', webhookUrl, paymentInfo });
      Swal.fire('Saved', 'Settings updated.', 'success');
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    if ((await Swal.fire({ title: 'Change Login?', icon: 'warning', showCancelButton: true })).isConfirmed) {
      setLoading(true);
      try {
        await callApi('updateAdminCredentials', { adminSessionToken: 'ADMIN_SESSION_AUTHORIZED', newUsername, newPassword });
        Swal.fire('Success', 'Admin credentials updated.', 'success');
        setNewUsername('');
        setNewPassword('');
      } catch (e: any) { Swal.fire('Error', e.message, 'error'); } finally { setLoading(false); }
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center bg-slate-800 text-white p-4 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex gap-4">
          <nav className="flex bg-slate-700 rounded-lg p-1">
            <button onClick={() => setTab('TOKENS')} className={`px-4 py-2 rounded ${tab==='TOKENS' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}>Tokens</button>
            <button onClick={() => setTab('ORDERS')} className={`px-4 py-2 rounded ${tab==='ORDERS' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}>Orders</button>
            <button onClick={() => setTab('SETTINGS')} className={`px-4 py-2 rounded ${tab==='SETTINGS' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}>Settings</button>
          </nav>
          <Button variant="danger" onClick={onLogout}>Exit</Button>
        </div>
      </div>

      {tab === 'TOKENS' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <h2 className="text-lg font-bold mb-4 text-slate-700">Token Generator</h2>
              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                <input className="p-3 border rounded-lg" placeholder="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} />
                <select className="p-3 border rounded-lg" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="1m">1 Month</option>
                  <option value="6m">6 Months</option>
                  <option value="1y">1 Year</option>
                </select>
                <Button type="submit" isLoading={loading}>Generate Token</Button>
              </form>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 border-l-4 border-l-purple-500">
               <h2 className="text-lg font-bold mb-4 text-slate-700">Update Admin Login</h2>
               <form onSubmit={handleUpdateCredentials} className="flex flex-col gap-4">
                 <input className="p-3 border rounded-lg" placeholder="New Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                 <input type="password" className="p-3 border rounded-lg" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                 <Button variant="secondary" type="submit" isLoading={loading}>Update</Button>
               </form>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Active Tokens</h2>
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-100 text-slate-600"><th className="p-3">Token</th><th className="p-3">Store</th><th className="p-3">Expiry</th><th className="p-3">Device</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {tokens.map((t, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-blue-600">{t.token}</td>
                    <td className="p-3">{t.storeName}</td>
                    <td className="p-3 text-sm">{new Date(t.expiry).toLocaleDateString()}</td>
                    <td className="p-3 text-xs">{t.deviceId ? 'LOCKED' : 'OPEN'}</td>
                    <td className="p-3"><Button variant="secondary" onClick={() => handleResetDevice(t.token)} disabled={!t.deviceId}>Reset</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'ORDERS' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4 text-slate-700">Incoming Orders</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="p-3">Order ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Store</th>
                <th className="p-3">WhatsApp</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-400">No orders yet.</td></tr>}
              {orders.map((o, i) => (
                <tr key={i} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold">{o.orderId}</td>
                  <td className="p-3 text-sm">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="p-3">{o.storeName}</td>
                  <td className="p-3 text-sm">{o.whatsapp}</td>
                  <td className="p-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{o.plan}</span></td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${o.status==='APPROVED'?'bg-green-100 text-green-700':o.status==='REJECTED'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                      {o.status}
                    </span>
                    {o.status === 'APPROVED' && <div className="text-xs font-mono mt-1 text-slate-400 select-all">{o.generatedToken}</div>}
                  </td>
                  <td className="p-3 flex gap-2">
                    {o.status === 'PENDING' && (
                      <>
                        <Button variant="success" className="py-1 px-2 text-sm" onClick={() => handleProcessOrder(o.orderId, 'APPROVE')} isLoading={loading}>✓</Button>
                        <Button variant="danger" className="py-1 px-2 text-sm" onClick={() => handleProcessOrder(o.orderId, 'REJECT')} isLoading={loading}>✕</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'SETTINGS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Webhook Integration</h2>
            <div className="mb-4 text-sm text-slate-500">
              System will send a POST request with JSON body <code>{`{ event: 'NEW_ORDER', ... }`}</code> to this URL when a new order is placed.
              Perfect for Telegram Bots (via Make/n8n) or Discord Webhooks.
            </div>
            <input className="w-full p-3 border rounded-lg font-mono text-sm" placeholder="https://api.telegram.org/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Payment Instructions</h2>
            <div className="mb-4 text-sm text-slate-500">
              Enter bank details or instructions. This will be shown to users when they click "Buy Token".
            </div>
            <textarea className="w-full p-3 border rounded-lg h-32" placeholder="e.g., Bank BCA: 123456789 (ARB Corp). Please transfer exact amount." value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} />
          </div>

          <Button onClick={handleSaveSettings} isLoading={loading}>Save All Settings</Button>
        </div>
      )}
    </div>
  );
};
