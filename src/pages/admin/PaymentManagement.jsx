import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { paymentService } from '../../services/paymentService';
import { FiDollarSign, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [summary, setSummary] = useState({});

    useEffect(() => { fetch(); }, [filter]);
    const fetch = async () => { try { const r = await paymentService.getPaymentRequests({status:filter||undefined,page_size:100}); setPayments(r.results||[]); setSummary(r.summary||{}); } catch{toast.error('Failed');} finally{setLoading(false);} };

    const verify = async (id, action, reason='') => { try { await paymentService.verifyPayment(id, {action,reason,notes:reason}); toast.success(action==='approve'?'Approved!':'Rejected'); fetch(); } catch{toast.error('Failed');} };

    const stats = [
        {label:'Verified',value:summary.total_verified||0,color:'text-emerald-600',bg:'bg-emerald-50'},
        {label:'Pending',value:summary.total_pending||0,color:'text-amber-600',bg:'bg-amber-50'},
        {label:'Rejected',value:summary.total_rejected||0,color:'text-red-600',bg:'bg-red-50'},
        {label:'Amount Verified',value:`$${(summary.total_amount_verified||0).toLocaleString()}`,color:'text-orange-600',bg:'bg-orange-50'},
    ];

    return (
        <Layout>
            <div className="page-header"><h1 className="page-title">Payments</h1><p className="page-subtitle">Review and verify payment requests</p></div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{stats.map((s,i)=><div key={i} className={`card p-4 ${s.bg} border-0`}><p className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</p><p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p></div>)}</div>

            <select value={filter} onChange={e=>setFilter(e.target.value)} className="select-field max-w-xs mb-6 text-sm"><option value="">All Payments</option><option value="pending_verification">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select>

            {loading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
            : payments.length===0 ? <div className="empty-state"><FiDollarSign size={40}/><p className="mt-3 text-sm font-medium">No payments found</p></div>
            : <div className="space-y-3">{payments.map((p,i) => (
                <div key={p.id} className="card-hover p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slideUp" style={{animationDelay:`${i*30}ms`}}>
                    <div><p className="text-xl font-bold text-gray-900">${parseFloat(p.amount).toLocaleString()}</p><p className="text-sm text-gray-500">{p.debtor_name} · {p.debtor_id_str}</p><p className="text-xs text-gray-400">{p.payment_method} · {p.payment_date} · Ref: {p.reference_number||'N/A'}</p></div>
                    <div className="flex items-center gap-3">
                        <span className={`badge ${p.status==='verified'?'badge-green':p.status==='rejected'?'badge-red':'badge-yellow'}`}>{p.status?.replace('_',' ')}</span>
                        {p.status==='pending_verification'&&<div className="flex gap-2">
                            <button onClick={()=>verify(p.id,'approve')} className="btn-success btn-xs"><FiCheck size={12}/>Approve</button>
                            <button onClick={()=>{const r=prompt('Rejection reason:');if(r)verify(p.id,'reject',r);}} className="btn-danger btn-xs"><FiX size={12}/>Reject</button>
                        </div>}
                    </div>
                </div>
            ))}</div>}
        </Layout>
    );
};

export default PaymentManagement;
