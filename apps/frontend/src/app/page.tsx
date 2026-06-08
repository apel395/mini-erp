"use client";
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api/v1';

export default function page() {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // App States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Entities Data
  const [summary, setSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // CRM Customer Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Invoice Form State
  const [selectedCustId, setSelectedCustId] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, price: 0 }]);

  // Load Session on init
  useEffect(() => {
    const savedToken = localStorage.getItem('nexus_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Fetch core telemetry when Token is valid
  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchCustomers();
      fetchInvoices();
    }
  }, [token]);

  // Network Fetch Implementations
  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSummary(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setInvoices(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const pathUrl = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering ? { email, password, name } : { email, password };

    try {
      const res = await fetch(`${API_BASE}${pathUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication error');
      }

      if (isRegistering) {
        setSuccessMsg('Account registered successfully! Please log in.');
        setIsRegistering(false);
      } else {
        localStorage.setItem('nexus_token', data.token);
        setToken(data.token);
        setSuccessMsg('Logged into ERP engine successfully!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection to ERP engine failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
  };

  // CRM Create handler
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: custName, email: custEmail, phone: custPhone, address: custAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Customer creation error');
      
      setSuccessMsg('Customer catalog record saved.');
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustAddress('');
      fetchCustomers();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // CRM Delete handler
  const handleDeleteCustomer = async (id: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Unable to delete client record');
      }
      setSuccessMsg('Customer record removed.');
      fetchCustomers();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Invoices creator logic
  const handleItemRowChange = (idx: number, field: string, value: any) => {
    const updated = items.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustId,
          dueDate: invoiceDueDate,
          items
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invoice generation compilation failure');

      setSuccessMsg('New Invoice generated & calculated successfully.');
      setSelectedCustId('');
      setInvoiceDueDate('');
      setItems([{ description: '', quantity: 1, price: 0 }]);
      fetchInvoices();
      fetchDashboardData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuccessMsg('Invoice status logs updated.');
        fetchInvoices();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Financial aggregates summary for form view
  const localFormSubtotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.price || 0)), 0);

  // --- RENDERING VIEWS ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs bg-indigo-500/10 text-indigo-400 font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500/20">Nexus Access</span>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">ERP Invoicing Center</h1>
          </div>

          {errorMsg && <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl">{errorMsg}</div>}
          {successMsg && <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">{successMsg}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">User Name</label>
                <input required type="text" placeholder="Arief" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email address</label>
              <input required type="email" placeholder="user@erp.com" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Access Password</label>
              <input required type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" />
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20">
              {isRegistering ? 'Create Administrative Account' : 'Authenticate Console Session'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
              {isRegistering ? 'Already registered? Authenticate here' : 'New operator? Construct schema User'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Upper Navigation Row */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m-9 0H3m2 0H3" /></svg>
            </div>
            <span className="font-extrabold tracking-tight text-white text-base">NEXUS CONSOLE</span>
          </div>
          <button onClick={handleLogout} className="text-xs border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 px-4 py-2 rounded-xl font-bold transition text-slate-300">
            Terminate Session
          </button>
        </div>
      </header>

      {/* Main Container Dashboard UI */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Workspace Modules</p>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>Live Dashboard</button>
          <button onClick={() => setActiveTab('invoices')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${activeTab === 'invoices' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>Invoice Manager</button>
          <button onClick={() => setActiveTab('customers')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${activeTab === 'customers' ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>Client Directory (CRM)</button>
        </aside>

        {/* Workspace Display */}
        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col">
          {errorMsg && <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl">{errorMsg}</div>}
          {successMsg && <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">{successMsg}</div>}

          {/* VIEW TAB 1: LIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">System Executive Dashboard</h1>
                <p className="text-slate-400 text-xs">Real-time database analytics processed directly from the NestJS Core API.</p>
              </div>

              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Income (Paid)</p>
                    <p className="text-xl font-black text-emerald-400 mt-2">$${summary.totalRevenue.toFixed(2)}</p>
                    <span className="text-[9px] text-emerald-500/80 block mt-1">{summary.paidInvoicesCount} Cleared Invoices</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uncollected Receivables</p>
                    <p className="text-xl font-black text-amber-500 mt-2">$${summary.outstanding.toFixed(2)}</p>
                    <span className="text-[9px] text-amber-500/80 block mt-1">{summary.sentInvoicesCount} Pending Claims</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Accounts</p>
                    <p className="text-xl font-black text-white mt-2">{summary.customersCount}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">Registered Organizations</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Overdues</p>
                    <p className="text-xl font-black text-red-500 mt-2">{summary.overdueInvoicesCount}</p>
                    <span className="text-[9px] text-red-400 block mt-1">Requires Immediate Contact</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW TAB 2: INVOICES MANAGER */}
          {activeTab === 'invoices' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">Invoice Records & Ledger</h1>
                <p className="text-slate-400 text-xs">Dynamic invoice compiling flow with immediate database synchronization.</p>
              </div>

              {/* Dynamic Creator Form */}
              <form onSubmit={handleCreateInvoice} className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-6">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Generate New Invoice</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target B2B Account</label>
                    <select required value={selectedCustId} onChange={e=>setSelectedCustId(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200">
                      <option value="">-- Select Client Organization --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Settlement Due Date</label>
                    <input required type="date" value={invoiceDueDate} onChange={e=>setInvoiceDueDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200" />
                  </div>
                </div>

                {/* Invoice Items Sub-array list */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items Ledger</label>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                      <input required type="text" placeholder="Service or Product name" value={item.description} onChange={e=>handleItemRowChange(idx, 'description', e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 w-full" />
                      <input required type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e=>handleItemRowChange(idx, 'quantity', Number(e.target.value))} className="w-20 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                      <input required type="number" step="0.01" placeholder="Price" value={item.price} onChange={e=>handleItemRowChange(idx, 'price', Number(e.target.value))} className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200" />
                      <div className="w-20 text-right text-xs font-mono text-slate-400 px-2">$${(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, price: 0 }])} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition">+ Append line element</button>
                </div>

                <div className="flex justify-between items-center border-t border-slate-900 pt-4">
                  <div className="text-xs text-slate-400">VAT computed securely at 10%: <span className="font-mono text-white font-bold">$${(localFormSubtotal * 0.10).toFixed(2)}</span></div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Grand Charge</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">$${(localFormSubtotal * 1.10).toFixed(2)}</span>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-xl text-xs font-bold transition">Deploy Invoicing Claims</button>
              </form>

              {/* Invoices History Table */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Invoices Ledger History</h2>
                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Grand Total</th>
                        <th className="p-4">Status Log</th>
                        <th className="p-4 text-right">Lifecycle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-900/30">
                          <td className="p-4 font-mono font-bold text-indigo-400">{inv.invoiceNo}</td>
                          <td className="p-4 font-semibold">{inv.customer?.name}</td>
                          <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-white font-mono">$${inv.grandTotal.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : inv.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>{inv.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <select value={inv.status} onChange={e => handleUpdateStatus(inv.id, e.target.value)} className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300">
                              <option value="DRAFT">DRAFT</option>
                              <option value="SENT">SENT</option>
                              <option value="PAID">PAID</option>
                              <option value="OVERDUE">OVERDUE</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW TAB 3: CLIENT CRM DIRECTORY */}
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-xl font-extrabold text-white">Customers Relationship Portal</h1>
                <p className="text-slate-400 text-xs">Direct database pipeline for onboarding client organizations.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Form to onboarding client */}
                <form onSubmit={handleAddCustomer} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-900">Add New Account</h3>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                    <input required type="text" value={custName} onChange={e=>setCustName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Email</label>
                    <input required type="email" value={custEmail} onChange={e=>setCustEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Phone</label>
                    <input type="text" value={custPhone} onChange={e=>setCustPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Address</label>
                    <textarea value={custAddress} onChange={e=>setCustAddress(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 min-h-[50px]" />
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold transition">Onboard Organization</button>
                </form>

                {/* Registry View */}
                <div className="lg:col-span-2 border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-900/40 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Client Directory Ledger</span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {customers.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-900/10">
                        <div>
                          <div className="font-bold text-white text-sm">{c.name}</div>
                          <div className="text-slate-400 mt-0.5">{c.email}</div>
                          {c.phone && <div className="text-slate-500 mt-0.5">📞 {c.phone}</div>}
                        </div>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="text-red-400 hover:text-red-300 font-bold tracking-wide transition">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}