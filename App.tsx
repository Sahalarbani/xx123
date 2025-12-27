import React, { useState, useEffect } from 'react';
import { AuthState, ViewState } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { POS } from './components/POS';
import { BuyTokenModal, CheckStatusModal } from './components/OrderModals';
import { callApi, getDeviceId } from './services/api';
import Swal from 'sweetalert2';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    storeName: '',
    token: ''
  });
  
  // Login State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  
  // Admin Login Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Modals
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdminMode) {
        // Admin Login with Username/Password
        const data = await callApi('adminLogin', { username, password });
        setAuth({ isAuthenticated: true, isAdmin: true, storeName: 'ADMIN', token: data.token });
        setView(ViewState.ADMIN_DASHBOARD);
      } else {
        // POS Login with Token
        const data = await callApi('login', { token: tokenInput, deviceId: getDeviceId() });
        setAuth({
          isAuthenticated: true,
          isAdmin: false,
          storeName: data.storeName,
          token: data.token
        });
        setView(ViewState.POS);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: err.message,
        footer: 'Code: SEC_FAIL'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, isAdmin: false, storeName: '', token: '' });
    setView(ViewState.LOGIN);
    setTokenInput('');
    setUsername('');
    setPassword('');
  };

  // --- RENDER VIEWS ---

  if (view === ViewState.ADMIN_DASHBOARD) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === ViewState.POS) {
    return <POS auth={auth} onLogout={handleLogout} />;
  }

  // LOGIN VIEW
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-wider">ARB MANAGER</h1>
          <p className="text-blue-200 text-sm mt-2">Secure POS Environment</p>
        </div>

        {/* Toggle Login Mode */}
        <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition ${!isAdminMode ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setIsAdminMode(false)}
          >
            Store Login
          </button>
          <button 
             type="button"
             className={`flex-1 py-2 text-sm font-bold rounded-md transition ${isAdminMode ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             onClick={() => setIsAdminMode(true)}
          >
            Admin Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {!isAdminMode ? (
            <div>
              <label className="block text-blue-200 text-xs font-bold uppercase mb-2 tracking-wide">Access Token</label>
              <input 
                type="text" 
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-center tracking-widest placeholder-slate-500"
                placeholder="XXXX-XXXX-XXXX"
              />
              <div className="flex justify-between mt-2">
                 <button type="button" onClick={() => setShowBuyModal(true)} className="text-xs text-green-400 hover:text-green-300 underline cursor-pointer">Buy Token / Subscribe</button>
                 <button type="button" onClick={() => setShowCheckModal(true)} className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer">Check Order Status</button>
              </div>
            </div>
          ) : (
             <div className="space-y-4">
               <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase mb-2 tracking-wide">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-lg p-4 focus:ring-2 focus:ring-purple-500 outline-none transition"
                    placeholder="admin"
                  />
               </div>
               <div>
                  <label className="block text-purple-200 text-xs font-bold uppercase mb-2 tracking-wide">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-lg p-4 focus:ring-2 focus:ring-purple-500 outline-none transition"
                    placeholder="••••••••"
                  />
               </div>
             </div>
          )}

          {!isAdminMode && (
            <div className="text-xs text-center text-slate-400">
              Device ID: <span className="font-mono text-slate-300">{getDeviceId().substring(0, 8)}...</span>
            </div>
          )}

          <Button 
            type="submit" 
            isLoading={loading} 
            className={`w-full py-4 text-lg shadow-lg ${isAdminMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/50' : 'shadow-blue-900/50'}`}
          >
            {isAdminMode ? 'Admin Access' : 'Authenticate Device'}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} ARB Security Systems. All connections logged.
      </div>

      {showBuyModal && <BuyTokenModal onClose={() => setShowBuyModal(false)} />}
      {showCheckModal && <CheckStatusModal onClose={() => setShowCheckModal(false)} />}
    </div>
  );
};

export default App;