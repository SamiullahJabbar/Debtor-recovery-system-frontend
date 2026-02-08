import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { debtorService } from '../../services/debtorService';
import { communicationService } from '../../services/communicationService';
import { paymentService } from '../../services/paymentService';
import { FiSearch, FiUsers, FiX, FiPlus, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';

const MyDebtors = () => {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showDetail, setShowDetail] = useState(false);
    const [sel, setSel] = useState(null);
    const [tab, setTab] = useState('info');
    const [notes, setNotes] = useState([]);
    const [history, setHistory] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [payments, setPayments] = useState([]);
    const [noteForm, setNoteForm] = useState({note_type:'outbound',content:'',communication_method:'phone'});
    const [commForm, setCommForm] = useState({communication_type:'email',template_id:'',custom_message:''});

    useEffect(()=>{(async()=>{try{const r=await debtorService.getDebtors({page_size:100});setDebtors(r.results||[]);}catch{toast.error('Failed');}finally{setLoading(false);}})();},[]);

    const view = async d => {
        try{const r=await debtorService.getDebtor(d.id);setSel(r.data);setTab('info');setShowDetail(true);
        const[n,h,t,p]=await Promise.all([communicationService.getNotes(d.id).catch(()=>({results:[]})),communicationService.getHistory(d.id).catch(()=>({results:[]})),communicationService.getTemplates().catch(()=>({results:[]})),paymentService.getDebtorPayments(d.id).catch(()=>({results:[]}))]);
        setNotes(n.results||[]);setHistory(h.results||[]);setTemplates(t.results||[]);setPayments(p.results||[]);}catch{toast.error('Failed');}
    };

    const addNote = async()=>{if(!noteForm.content)return;try{await communicationService.addNote(sel.id,noteForm);toast.success('Added');setNoteForm({...noteForm,content:''});const r=await communicationService.getNotes(sel.id);setNotes(r.results||[]);}catch{toast.error('Failed');}};
    const send = async()=>{try{await communicationService.sendCommunication(sel.id,commForm);toast.success('Sent!');const r=await communicationService.getHistory(sel.id);setHistory(r.results||[]);}catch{toast.error('Failed');}};

    const filtered = debtors.filter(d=>d.full_name.toLowerCase().includes(search.toLowerCase())||d.debtor_id.toLowerCase().includes(search.toLowerCase()));
    const badge = s => ({new:'badge-blue',in_progress:'badge-orange',settled:'badge-green',closed:'badge-gray'}[s]||'badge-gray');

    return (
        <Layout>
            <div className="page-header"><h1 className="page-title">My Debtors</h1><p className="page-subtitle">{debtors.length} assigned</p></div>
            <div className="relative max-w-md mb-6"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="input-field pl-9 text-sm"/></div>

            {loading?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-48 rounded-2xl"/>)}</div>
            :filtered.length===0?<div className="empty-state"><FiUsers size={40}/><p className="mt-3 text-sm">No debtors assigned</p></div>
            :<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((d,i)=>(
                <div key={d.id} className="card-hover p-5 cursor-pointer animate-slideUp" style={{animationDelay:`${i*30}ms`}} onClick={()=>view(d)}>
                    <div className="flex justify-between mb-3"><div><p className="text-xs text-orange-500 font-semibold">{d.debtor_id}</p><h3 className="font-bold text-gray-900">{d.full_name}</h3></div><span className={`badge ${badge(d.status)} capitalize`}>{d.status?.replace('_',' ')}</span></div>
                    <p className="text-xs text-gray-500">{d.email} · {d.phone_number}</p><p className="text-xs text-gray-400 mb-3">Client: {d.client_name}</p>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100"><div><p className="text-[10px] text-gray-400 uppercase">Loan</p><p className="font-bold text-gray-900">${parseFloat(d.loan_amount).toLocaleString()}</p></div><div><p className="text-[10px] text-gray-400 uppercase">Remaining</p><p className="font-bold text-orange-600">${parseFloat(d.remaining_balance).toLocaleString()}</p></div></div>
                </div>))}</div>}

            {/* Detail Modal */}
            {showDetail&&sel&&<div className="modal-overlay" onClick={()=>setShowDetail(false)}><div className="modal-content max-w-4xl w-full" onClick={e=>e.stopPropagation()}>
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">{sel.full_name?.charAt(0)}</span></div>
                        <div><h2 className="font-bold text-gray-900">{sel.full_name}</h2><p className="text-xs text-gray-400">{sel.debtor_id}</p></div>
                    </div>
                    <button onClick={()=>setShowDetail(false)} className="btn-ghost btn-xs"><FiX size={16}/></button>
                </div>

                <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
                    {[['info','Info'],['notes','Notes'],['send','Send'],['history','History'],['payments','Payments']].map(([k,l])=>
                        <button key={k} onClick={()=>setTab(k)} className={`tab-btn ${tab===k?'tab-active':'tab-inactive'}`}>{l}</button>
                    )}
                </div>

                <div className="p-6">
                    {tab==='info'&&<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal</h3>
                            {[['Name',sel.full_name],['Email',sel.email],['Phone',sel.phone_number],['Home',sel.home_number],['Work',sel.work_number],['Company',sel.company],['DOB',sel.date_of_birth],['Address',sel.address]].map(([l,v])=>v&&<div key={l}><p className="text-[10px] text-gray-400 uppercase">{l}</p><p className="text-sm font-medium text-gray-800">{v}</p></div>)}
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-blue-50 rounded-xl"><p className="text-[10px] text-blue-500 uppercase font-semibold">Loan</p><p className="text-xl font-bold text-blue-700">${parseFloat(sel.loan_amount).toLocaleString()}</p></div>
                                <div className="p-4 bg-emerald-50 rounded-xl"><p className="text-[10px] text-emerald-500 uppercase font-semibold">Paid</p><p className="text-xl font-bold text-emerald-700">${parseFloat(sel.amount_paid).toLocaleString()}</p></div>
                                <div className="p-4 bg-orange-50 rounded-xl"><p className="text-[10px] text-orange-500 uppercase font-semibold">Remaining</p><p className="text-xl font-bold text-orange-700">${parseFloat(sel.remaining_balance).toLocaleString()}</p></div>
                                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-500 uppercase font-semibold">Due</p><p className="text-xl font-bold text-gray-700">{sel.due_date}</p></div>
                            </div>
                            {sel.client_details&&<div><p className="text-[10px] text-gray-400 uppercase">Client</p><p className="text-sm font-medium">{sel.client_details.company_name}</p></div>}
                            {sel.special_notes&&<div><p className="text-[10px] text-gray-400 uppercase">Notes</p><p className="text-sm text-gray-700">{sel.special_notes}</p></div>}
                        </div>
                    </div>}

                    {tab==='notes'&&<div>
                        <div className="flex gap-2 mb-5">
                            <select value={noteForm.note_type} onChange={e=>setNoteForm({...noteForm,note_type:e.target.value})} className="select-field w-28 text-xs"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select>
                            <select value={noteForm.communication_method} onChange={e=>setNoteForm({...noteForm,communication_method:e.target.value})} className="select-field w-24 text-xs"><option value="phone">Phone</option><option value="email">Email</option><option value="sms">SMS</option></select>
                            <input value={noteForm.content} onChange={e=>setNoteForm({...noteForm,content:e.target.value})} className="input-field flex-1 text-sm" placeholder="Add a note..." onKeyDown={e=>e.key==='Enter'&&addNote()}/>
                            <button onClick={addNote} className="btn-primary btn-sm"><FiPlus size={14}/></button>
                        </div>
                        <div className="space-y-2">{notes.map(n=><div key={n.id} className={`p-3 rounded-xl border-l-[3px] ${n.note_type==='inbound'?'bg-blue-50/50 border-blue-400':'bg-orange-50/50 border-orange-400'}`}>
                            <div className="flex justify-between mb-1"><span className="badge badge-orange text-[10px]">{n.note_type} · {n.communication_method}</span><span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</span></div>
                            <p className="text-sm text-gray-800">{n.content}</p>
                        </div>)}{notes.length===0&&<p className="text-center text-gray-400 text-sm py-10">No notes yet</p>}</div>
                    </div>}

                    {tab==='send'&&<div className="max-w-lg space-y-4">
                        <select value={commForm.communication_type} onChange={e=>setCommForm({...commForm,communication_type:e.target.value})} className="select-field"><option value="email">Email</option><option value="sms">SMS</option><option value="letter">Letter</option></select>
                        <select value={commForm.template_id} onChange={e=>setCommForm({...commForm,template_id:e.target.value})} className="select-field"><option value="">No Template</option>{templates.filter(t=>t.type===commForm.communication_type).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
                        <textarea value={commForm.custom_message} onChange={e=>setCommForm({...commForm,custom_message:e.target.value})} className="textarea-field" rows="5" placeholder="Type message..."/>
                        <button onClick={send} className="btn-primary"><FiSend size={14}/>Send</button>
                    </div>}

                    {tab==='history'&&<div className="space-y-2">{history.map(h=><div key={h.id} className="card p-3">
                        <div className="flex items-center justify-between"><div className="flex gap-2"><span className="badge badge-blue">{h.communication_type}</span><span className={`badge ${h.status==='delivered'?'badge-green':h.status==='failed'?'badge-red':'badge-yellow'}`}>{h.status}</span></div><span className="text-[10px] text-gray-400">{new Date(h.sent_at).toLocaleString()}</span></div>
                        {h.template_name&&<p className="text-xs text-gray-500 mt-1">Template: {h.template_name}</p>}
                    </div>)}{history.length===0&&<p className="text-center text-gray-400 text-sm py-10">No history</p>}</div>}

                    {tab==='payments'&&<div className="space-y-2">{payments.map(p=><div key={p.id} className="card p-4 flex justify-between items-center">
                        <div><p className="font-bold text-lg">${parseFloat(p.amount).toLocaleString()}</p><p className="text-xs text-gray-500">{p.payment_method} · {p.payment_date}</p></div>
                        <span className={`badge ${p.status==='verified'?'badge-green':p.status==='rejected'?'badge-red':'badge-yellow'}`}>{p.status?.replace('_',' ')}</span>
                    </div>)}{payments.length===0&&<p className="text-center text-gray-400 text-sm py-10">No payments</p>}</div>}
                </div>
            </div></div>}
        </Layout>
    );
};

export default MyDebtors;
