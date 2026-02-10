import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/common/Layout';
import { debtorService } from '../../services/debtorService';
import { paymentService } from '../../services/paymentService';
import { FiDollarSign, FiExternalLink, FiLink, FiCopy, FiPlus, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TeamPaymentLinks = () => {
  const [assignedDebtors, setAssignedDebtors] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ debtor_id: '', amount: '', description: '', send_email: true });

  const fetchAssigned = async () => {
    try {
      const r = await debtorService.getMyAssignedDebtors({ page_size: 200 });
      setAssignedDebtors(r.results || r.data || []);
      if (!form.debtor_id && (r.results?.[0]?.id || r.data?.[0]?.id)) {
        setForm(f => ({ ...f, debtor_id: r.results?.[0]?.id || r.data?.[0]?.id }));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load assigned debtors');
    }
  };

  const fetchLinks = async () => {
    try {
      const r = await paymentService.getMyPaymentLinks({ page_size: 100 });
      setLinks(r.results || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssigned(); fetchLinks(); }, []);
  useEffect(() => { const i=setInterval(fetchLinks,30000); return ()=>clearInterval(i); }, []);

  const copyLink = async (url) => { try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.error('Copy failed'); } };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.debtor_id || !form.amount) return toast.error('Please select debtor and amount');
    try {
      const res = await paymentService.generatePaymentLink({ debtor_id: form.debtor_id, amount: form.amount, description: form.description, send_email: form.send_email });
      toast.success('Payment link generated');
      setForm(f => ({ ...f, amount: '', description: '' }));
      fetchLinks();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate link');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Payment Links</h1>
        <p className="page-subtitle">Generate and track links for your assigned debtors</p>
      </div>

      {/* Generate Form */}
      <div className="card p-5 mb-6">
        <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" onSubmit={submit}>
          <div>
            <label className="label">Select Debtor</label>
            <select value={form.debtor_id} onChange={e=>setForm({...form, debtor_id:e.target.value})} className="select-field">
              {assignedDebtors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} · {d.debtor_id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="input-field" placeholder="Enter amount" />
          </div>
          <div className="lg:col-span-2">
            <label className="label">Description (optional)</label>
            <input type="text" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} className="input-field" placeholder="Payment for invoice/arrears" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.send_email} onChange={e=>setForm({...form, send_email:e.target.checked})} />
              Send email to debtor
            </label>
            <button type="submit" className="btn-primary btn-sm ml-auto flex items-center gap-2"><FiPlus size={14}/>Generate Link</button>
          </div>
        </form>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : links.length === 0 ? (
        <div className="empty-state"><FiLink size={40}/><p className="mt-3 text-sm font-medium">No links found</p><p className="text-xs text-gray-400 mt-1">Generated links will appear here</p></div>
      ) : (
        <div className="space-y-4">
          {links.map((l,i)=> {
            const isExpired = l.status==='expired' || (l.expires_at && new Date(l.expires_at) < new Date() && l.status==='active');
            const daysLeft = l.expires_at ? Math.ceil((new Date(l.expires_at) - new Date())/(1000*60*60*24)) : null;
            const isSoon = !isExpired && daysLeft !== null && daysLeft <= 2 && daysLeft > 0;
            return (
              <div key={l.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 animate-slideUp" style={{animationDelay:`${i*20}ms`}}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><FiDollarSign size={22} className="text-white"/></div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{l.debtor_details?.full_name || l.debtor?.full_name || 'Unknown'}</h3>
                        <p className="text-xs text-gray-500 font-medium">{l.debtor_details?.debtor_id || l.debtor?.debtor_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${parseFloat(l.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Payment Amount</p>
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${l.status==='completed'?'badge-green':l.status==='expired'?'badge-red':'badge-yellow'}`}>{l.status}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 mb-1 font-medium">Views</p>
                      <p className="text-xl font-bold text-blue-700">{l.view_count || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-1 font-medium">Clicks</p>
                      <p className="text-xl font-bold text-green-700">{l.click_count || 0}</p>
                    </div>
                    <div className={`${isExpired?'bg-red-50':isSoon?'bg-yellow-50':'bg-purple-50'} rounded-lg p-3`}>
                      <p className={`text-xs mb-1 font-medium ${isExpired?'text-red-600':isSoon?'text-yellow-700':'text-purple-600'}`}>Expiry</p>
                      <p className={`text-sm font-bold ${isExpired?'text-red-700':isSoon?'text-yellow-700':'text-purple-700'}`}>
                        {l.expires_at ? (isExpired ? 'Expired' : (isSoon ? `${daysLeft}d left` : new Date(l.expires_at).toLocaleDateString())) : '—'}
                      </p>
                    </div>
                  </div>

                  {l.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Description</p>
                      <p className="text-sm text-gray-700">{l.description}</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 mb-2 font-medium">Payment Link</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-700 flex-1 truncate font-mono bg-white px-3 py-2 rounded border border-blue-200">{l.payment_url}</code>
                      <button onClick={()=>copyLink(l.payment_url)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm">Copy</button>
                      <a href={l.payment_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm">Open</a>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                    <span>Created: {l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
                    {l.created_by_name && <span>By: {l.created_by_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default TeamPaymentLinks;
