import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { debtorService } from '../../services/debtorService';
import { clientService } from '../../services/clientService';
import { userService } from '../../services/userService';
import { communicationService } from '../../services/communicationService';
import { paymentService } from '../../services/paymentService';
import { FiPlus, FiSearch, FiFilter, FiUsers, FiX, FiEye, FiEdit2, FiTrash2, FiSend, FiDollarSign, FiUpload, FiFile } from 'react-icons/fi';
import { toast } from 'react-toastify';

const DebtorManagement = () => {
    const [debtors, setDebtors] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selected, setSelected] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [tab, setTab] = useState('info');
    const [notes, setNotes] = useState([]);
    const [commHistory, setCommHistory] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [payments, setPayments] = useState([]);
    const [docs, setDocs] = useState([]);
    const csvRef = useRef(null);
    const docRef = useRef(null);

    const [filters, setFilters] = useState({ search: '', status: '', client_id: '', assigned_collector_id: '', debtor_id: '', name: '', email: '', phone_number: '', is_active: '' });
    const emptyForm = { full_name: '', company: '', date_of_birth: '', email: '', phone_number: '', home_number: '', work_number: '', other_number: '', address: '', loan_amount: '', due_date: '', client: '', assigned_collector: '', special_notes: '', status: 'new' };
    const [form, setForm] = useState(emptyForm);
    const [noteForm, setNoteForm] = useState({ note_type: 'outbound', content: '', communication_method: 'phone' });
    const [commForm, setCommForm] = useState({ communication_type: 'email', template_id: '', custom_message: '' });
    const [arrForm, setArrForm] = useState({ payment_type: 'manual', frequency: 'monthly', installment_amount: '', start_date: '', total_installments: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [dr, cr, ur] = await Promise.all([debtorService.getDebtors({ page_size: 200 }), clientService.getClients({ page_size: 200 }), userService.getUsers({ page_size: 100 }).catch(() => ({ results: [] }))]);
            setDebtors(dr.results || []); setClients(cr.results || []); setUsers(ur.results || []);
        } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
    };

    const fetchFiltered = async () => {
        try {
            const p = { page_size: 200 };
            Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
            const r = await debtorService.getDebtors(p);
            setDebtors(r.results || []);
        } catch { }
    };

    useEffect(() => { const t = setTimeout(fetchFiltered, 300); return () => clearTimeout(t); }, [filters]);

    const openAdd = () => { setEditMode(false); setForm(emptyForm); setDocs([]); setShowAdd(true); };

    const handleCreate = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        docs.forEach(d => fd.append('documents', d));
        try { await debtorService.createDebtor(fd); toast.success('Debtor created!'); setShowAdd(false); fetchAll(); }
        catch (err) { toast.error(err.response?.data?.message || JSON.stringify(err.response?.data?.errors) || 'Failed'); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        docs.forEach(d => fd.append('documents', d));
        try { await debtorService.updateDebtor(selected.id, fd); toast.success('Updated!'); const r = await debtorService.getDebtor(selected.id); setSelected(r.data); setEditMode(false); fetchAll(); }
        catch { toast.error('Failed'); }
    };

    const viewDebtor = async (d) => {
        try {
            const r = await debtorService.getDebtor(d.id); setSelected(r.data); setTab('info'); setShowDetail(true); setEditMode(false);
            const [nr, hr, tr, pr] = await Promise.all([communicationService.getNotes(d.id).catch(() => ({ results: [] })), communicationService.getHistory(d.id).catch(() => ({ results: [] })), communicationService.getTemplates().catch(() => ({ results: [] })), paymentService.getDebtorPayments(d.id).catch(() => ({ results: [] }))]);
            setNotes(nr.results || nr || []); setCommHistory(hr.results || hr || []); setTemplates(tr.results || tr || []); setPayments(pr.results || pr || []);
        } catch { toast.error('Failed'); }
    };

    const openEditMode = () => {
        setForm({ full_name: selected.full_name, company: selected.company || '', date_of_birth: selected.date_of_birth || '', email: selected.email, phone_number: selected.phone_number, home_number: selected.home_number || '', work_number: selected.work_number || '', other_number: selected.other_number || '', address: selected.address || '', loan_amount: selected.loan_amount, due_date: selected.due_date, client: selected.client, assigned_collector: selected.assigned_collector || '', special_notes: selected.special_notes || '' });
        setDocs([]); setEditMode(true); setTab('edit');
    };

    const addNote = async () => { if (!noteForm.content) return; try { await communicationService.addNote(selected.id, noteForm); toast.success('Note added'); setNoteForm({ ...noteForm, content: '' }); const r = await communicationService.getNotes(selected.id); setNotes(r.results || []); } catch { toast.error('Failed'); } };
    const sendComm = async () => { try { await communicationService.sendCommunication(selected.id, commForm); toast.success('Sent!'); const r = await communicationService.getHistory(selected.id); setCommHistory(r.results || []); } catch { toast.error('Failed'); } };
    const setArrangement = async () => { try { await debtorService.setPaymentArrangement(selected.id, arrForm); toast.success('Arrangement set!'); const r = await debtorService.getDebtor(selected.id); setSelected(r.data); } catch { toast.error('Failed'); } };
    const handleBulk = async () => { const f = csvRef.current?.files[0]; if (!f) { toast.error('Select CSV'); return; } try { const r = await debtorService.bulkImport(f); toast.success(r.message || 'Imported'); setShowBulk(false); fetchAll(); } catch { toast.error('Failed'); } };
    const updateStatus = async (newStatus) => { try { await debtorService.updateDebtorStatus(selected.id, newStatus); toast.success('Status updated!'); const r = await debtorService.getDebtor(selected.id); setSelected(r.data); fetchAll(); } catch { toast.error('Failed to update status'); } };

    const badge = s => ({ new: 'badge-blue', in_progress: 'badge-orange', settled: 'badge-green', closed: 'badge-gray' }[s] || 'badge-gray');

    const InfoField = ({ label, value }) => value ? <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p><p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p></div> : null;

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div><h1 className="page-title">Debtors</h1><p className="page-subtitle">{debtors.length} debtor records</p></div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={() => setShowBulk(true)} className="btn-secondary btn-sm"><FiUpload size={14} />CSV Import</button>
                    <button onClick={openAdd} className="btn-primary btn-sm"><FiPlus size={14} />Add Debtor</button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex gap-3 items-center flex-wrap">
                    <div className="relative flex-1 min-w-[200px]"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} /><input placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="input-field pl-9 text-sm" /></div>
                    <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="select-field text-sm w-36"><option value="">All Status</option><option value="new">New</option><option value="in_progress">In Progress</option><option value="settled">Settled</option><option value="closed">Closed</option></select>
                    <select value={filters.client_id} onChange={e => setFilters({ ...filters, client_id: e.target.value })} className="select-field text-sm w-44"><option value="">All Clients</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select>
                    <button onClick={() => setShowFilters(!showFilters)} className={`btn-ghost btn-sm ${showFilters ? 'bg-orange-50 text-orange-600' : ''}`}><FiFilter size={14} />More</button>
                </div>
                {showFilters && <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100 animate-slideUp">
                    <input placeholder="Debtor ID" value={filters.debtor_id} onChange={e => setFilters({ ...filters, debtor_id: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Name" value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Email" value={filters.email} onChange={e => setFilters({ ...filters, email: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Phone" value={filters.phone_number} onChange={e => setFilters({ ...filters, phone_number: e.target.value })} className="input-field text-xs" />
                    <select value={filters.is_active} onChange={e => setFilters({ ...filters, is_active: e.target.value })} className="select-field text-xs"><option value="">All Active</option><option value="true">Active</option><option value="false">Inactive</option></select>
                </div>}
            </div>

            {/* Table */}
            {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
                : debtors.length === 0 ? <div className="empty-state"><FiUsers size={40} /><p className="mt-3 text-sm font-medium">No debtors found</p></div>
                    : <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
                        <thead><tr>{['Debtor ID', 'Name', 'Client', 'Loan', 'Remaining', 'Status', 'Collector', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                        <tbody>{debtors.map((d, i) => (
                            <tr key={d.id} className="table-row animate-slideUp" style={{ animationDelay: `${i * 20}ms` }} onClick={() => viewDebtor(d)}>
                                <td className="table-cell font-semibold text-orange-600">{d.debtor_id}</td>
                                <td className="table-cell"><p className="font-semibold text-gray-900">{d.full_name}</p><p className="text-xs text-gray-400">{d.email}</p></td>
                                <td className="table-cell text-gray-600">{d.client_name}</td>
                                <td className="table-cell font-semibold">${parseFloat(d.loan_amount).toLocaleString()}</td>
                                <td className="table-cell font-bold text-orange-600">${parseFloat(d.remaining_balance).toLocaleString()}</td>
                                <td className="table-cell"><span className={`badge ${badge(d.status)}`}>{d.status?.replace('_', ' ')}</span></td>
                                <td className="table-cell text-gray-500 text-xs">{d.assigned_collector_name || '—'}</td>
                                <td className="table-cell"><button className="btn-ghost btn-xs"><FiEye size={13} /></button></td>
                            </tr>))}</tbody>
                    </table></div></div>}

            {/* Add Modal */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Debtor" maxWidth="max-w-3xl">
                <form onSubmit={handleCreate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label><input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Phone *</label><input required value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Home Phone</label><input value={form.home_number} onChange={e => setForm({ ...form, home_number: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Work Phone</label><input value={form.work_number} onChange={e => setForm({ ...form, work_number: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Loan Amount *</label><input type="number" step="0.01" required value={form.loan_amount} onChange={e => setForm({ ...form, loan_amount: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Due Date *</label><input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Client *</label><select required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="select-field"><option value="">Select</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Collector</label><select value={form.assigned_collector} onChange={e => setForm({ ...form, assigned_collector: e.target.value })} className="select-field"><option value="">Unassigned</option>{users.filter(u => u.role === 'team_member').map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="select-field"><option value="new">New</option><option value="in_progress">In Progress</option><option value="settled">Settled</option><option value="closed">Closed</option></select></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">DOB</label><input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1">Other Phone</label><input value={form.other_number} onChange={e => setForm({ ...form, other_number: e.target.value })} className="input-field" /></div>
                        <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="textarea-field" rows="2" /></div>
                        <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label><textarea value={form.special_notes} onChange={e => setForm({ ...form, special_notes: e.target.value })} className="textarea-field" rows="2" /></div>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <input ref={docRef} type="file" multiple onChange={e => setDocs([...docs, ...Array.from(e.target.files)])} className="hidden" />
                        <button type="button" onClick={() => docRef.current?.click()} className="btn-secondary btn-xs"><FiUpload size={12} />Attach Documents</button>
                        {docs.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{docs.map((d, i) => <span key={i} className="badge badge-blue">{d.name}<button type="button" onClick={() => setDocs(docs.filter((_, j) => j !== i))} className="ml-1"><FiX size={10} /></button></span>)}</div>}
                    </div>
                    <div className="flex gap-3 mt-6"><button type="submit" className="btn-primary flex-1">Create Debtor</button><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button></div>
                </form>
            </Modal>

            {/* Detail Modal */}
            {showDetail && selected && <div className="modal-overlay" onClick={() => setShowDetail(false)}><div className="modal-content max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">{selected.full_name?.charAt(0)}</span></div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selected.full_name}</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400">{selected.debtor_id}</p>
                                <select value={selected.status} onChange={(e) => updateStatus(e.target.value)} className="text-xs px-2 py-0.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500">
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="settled">Settled</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2"><button onClick={openEditMode} className="btn-secondary btn-xs"><FiEdit2 size={12} />Edit</button><button onClick={() => setShowDetail(false)} className="btn-ghost btn-xs"><FiX size={16} /></button></div>
                </div>

                <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
                    {[['info', 'Info'], ['notes', 'Notes'], ['send', 'Send'], ['history', 'History'], ['payments', 'Payments'], ['arrangement', 'Arrangement'], ['edit', 'Edit']].filter(([k]) => k !== 'edit' || editMode).map(([k, l]) =>
                        <button key={k} onClick={() => setTab(k)} className={`tab-btn ${tab === k ? 'tab-active' : 'tab-inactive'}`}>{l}</button>
                    )}
                </div>

                <div className="p-6">
                    {tab === 'info' && <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal</h3>
                            <div className="grid grid-cols-2 gap-4">{[['Name', selected.full_name], ['Email', selected.email], ['Phone', selected.phone_number], ['Home', selected.home_number], ['Work', selected.work_number], ['Other', selected.other_number], ['DOB', selected.date_of_birth], ['Company', selected.company]].map(([l, v]) => <InfoField key={l} label={l} value={v} />)}</div>
                            {selected.address && <InfoField label="Address" value={selected.address} />}
                            {selected.special_notes && <InfoField label="Notes" value={selected.special_notes} />}
                        </div>
                        <div className="space-y-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Financial</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-blue-50 rounded-xl"><p className="text-[10px] text-blue-500 uppercase font-semibold">Loan</p><p className="text-xl font-bold text-blue-700">${parseFloat(selected.loan_amount).toLocaleString()}</p></div>
                                <div className="p-4 bg-emerald-50 rounded-xl"><p className="text-[10px] text-emerald-500 uppercase font-semibold">Paid</p><p className="text-xl font-bold text-emerald-700">${parseFloat(selected.amount_paid).toLocaleString()}</p></div>
                                <div className="p-4 bg-orange-50 rounded-xl"><p className="text-[10px] text-orange-500 uppercase font-semibold">Remaining</p><p className="text-xl font-bold text-orange-700">${parseFloat(selected.remaining_balance).toLocaleString()}</p></div>
                                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-500 uppercase font-semibold">Due Date</p><p className="text-xl font-bold text-gray-700">{selected.due_date}</p></div>
                            </div>
                            {selected.client_details && <InfoField label="Client" value={selected.client_details.company_name} />}
                            {selected.assigned_collector_details && <InfoField label="Collector" value={selected.assigned_collector_details.full_name} />}
                            {selected.documents?.length > 0 && <div><p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Documents</p>{selected.documents.map(d => <a key={d.id} href={d.file_url} target="_blank" className="badge badge-blue mr-1 mb-1"><FiFile size={10} />{d.file_name}</a>)}</div>}
                            {selected.payment_arrangement && <div className="p-4 bg-emerald-50 rounded-xl"><p className="text-[10px] text-emerald-600 uppercase font-semibold mb-2">Payment Arrangement</p><div className="grid grid-cols-2 gap-2 text-sm"><p><span className="text-gray-500">Type:</span> {selected.payment_arrangement.payment_type}</p><p><span className="text-gray-500">Freq:</span> {selected.payment_arrangement.frequency}</p><p><span className="text-gray-500">Amount:</span> ${parseFloat(selected.payment_arrangement.installment_amount).toLocaleString()}</p><p><span className="text-gray-500">Progress:</span> {selected.payment_arrangement.completed_installments}/{selected.payment_arrangement.total_installments}</p></div></div>}
                        </div>
                    </div>}

                    {tab === 'notes' && <div><div className="flex gap-2 mb-5"><select value={noteForm.note_type} onChange={e => setNoteForm({ ...noteForm, note_type: e.target.value })} className="select-field w-28 text-xs"><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select><select value={noteForm.communication_method} onChange={e => setNoteForm({ ...noteForm, communication_method: e.target.value })} className="select-field w-24 text-xs"><option value="phone">Phone</option><option value="email">Email</option><option value="sms">SMS</option></select><input value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} className="input-field flex-1 text-sm" placeholder="Add a note..." onKeyDown={e => e.key === 'Enter' && addNote()} /><button onClick={addNote} className="btn-primary btn-sm"><FiPlus size={14} /></button></div>
                        <div className="space-y-2">{notes.map(n => <div key={n.id} className={`p-3 rounded-xl border-l-[3px] ${n.note_type === 'inbound' ? 'bg-blue-50/50 border-blue-400' : 'bg-orange-50/50 border-orange-400'} animate-slideUp`}><div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2"><span className="badge badge-orange text-[10px]">{n.note_type} · {n.communication_method}</span>{n.created_by_name && <span className="text-[10px] text-gray-600 font-semibold">by {n.created_by_name}</span>}</div><span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</span></div><p className="text-sm text-gray-800">{n.content}</p></div>)}{notes.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No notes yet</p>}</div>
                    </div>}

                    {tab === 'send' && <div className="max-w-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-semibold text-gray-500 mb-2 block">Communication Type</label><select value={commForm.communication_type} onChange={e => setCommForm({ ...commForm, communication_type: e.target.value, template_id: '' })} className="select-field"><option value="email">Email</option><option value="sms">SMS</option><option value="letter">Letter</option></select></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-2 block">Select Template</label><select value={commForm.template_id} onChange={e => setCommForm({ ...commForm, template_id: e.target.value })} className="select-field"><option value="">No Template</option>{templates.filter(t => t.type === commForm.communication_type).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                        </div>
                        {commForm.template_id && (() => { const selectedTemplate = templates.find(t => t.id === parseInt(commForm.template_id)); return selectedTemplate ? (<div className="p-4 bg-gray-50 rounded-xl border border-gray-200"><div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold text-gray-700 uppercase">Template Preview</h4>{selectedTemplate.image_url && <a href={selectedTemplate.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"><FiEye size={12} />View Full Image</a>}</div>{selectedTemplate.content_type === 'image' && selectedTemplate.image_url ? (<div className="bg-white p-3 rounded-lg"><img src={selectedTemplate.image_url} alt={selectedTemplate.name} className="max-w-full h-auto rounded-lg shadow-sm" /></div>) : selectedTemplate.content ? (<div className="bg-white p-3 rounded-lg"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTemplate.content}</p></div>) : <p className="text-xs text-gray-400 italic">No preview available</p>}</div>) : null; })()}
                        <div><label className="text-xs font-semibold text-gray-500 mb-2 block">Custom Message (Optional)</label><textarea value={commForm.custom_message} onChange={e => setCommForm({ ...commForm, custom_message: e.target.value })} className="textarea-field" rows="5" placeholder="Add custom message or leave empty to use template..." /></div>
                        <button onClick={sendComm} className="btn-primary w-full"><FiSend size={14} />Send Communication</button>
                    </div>}

                    {tab === 'history' && <div className="space-y-2">{commHistory.map(h => <div key={h.id} className="card p-3"><div className="flex items-center justify-between"><div className="flex gap-2"><span className="badge badge-blue">{h.communication_type}</span><span className={`badge ${h.status === 'delivered' ? 'badge-green' : h.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>{h.status}</span></div><span className="text-[10px] text-gray-400">{new Date(h.sent_at).toLocaleString()}</span></div>{h.template_name && <p className="text-xs text-gray-500 mt-1">Template: {h.template_name}</p>}</div>)}{commHistory.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No history</p>}</div>}

                    {tab === 'payments' && <div className="space-y-2">{payments.map(p => <div key={p.id} className="card p-4 flex justify-between items-center"><div><p className="font-bold text-lg">${parseFloat(p.amount).toLocaleString()}</p><p className="text-xs text-gray-500">{p.payment_method} · {p.payment_date}</p></div><span className={`badge ${p.status === 'verified' ? 'badge-green' : p.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>{p.status?.replace('_', ' ')}</span></div>)}{payments.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No payments</p>}</div>}

                    {tab === 'arrangement' && <div className="max-w-lg">
                        {selected.payment_arrangement && <div className="p-4 bg-emerald-50 rounded-xl mb-6"><h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Current</h4><div className="grid grid-cols-2 gap-3 text-sm"><p>{selected.payment_arrangement.payment_type}</p><p>{selected.payment_arrangement.frequency}</p><p>${parseFloat(selected.payment_arrangement.installment_amount).toLocaleString()}/inst</p><p>{selected.payment_arrangement.completed_installments}/{selected.payment_arrangement.total_installments}</p></div></div>}
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label><select value={arrForm.payment_type} onChange={e => setArrForm({ ...arrForm, payment_type: e.target.value })} className="select-field"><option value="auto">Auto</option><option value="manual">Manual</option></select></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Frequency</label><select value={arrForm.frequency} onChange={e => setArrForm({ ...arrForm, frequency: e.target.value })} className="select-field"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Amount</label><input type="number" step="0.01" value={arrForm.installment_amount} onChange={e => setArrForm({ ...arrForm, installment_amount: e.target.value })} className="input-field" /></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Start</label><input type="date" value={arrForm.start_date} onChange={e => setArrForm({ ...arrForm, start_date: e.target.value })} className="input-field" /></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Installments</label><input type="number" value={arrForm.total_installments} onChange={e => setArrForm({ ...arrForm, total_installments: e.target.value })} className="input-field" /></div>
                        </div>
                        <button onClick={setArrangement} className="btn-primary mt-4">Save Arrangement</button>
                    </div>}

                    {tab === 'edit' && editMode && <form onSubmit={handleUpdate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[['Full Name', 'full_name', true], ['Email', 'email', true], ['Phone', 'phone_number', true], ['Company', 'company'], ['Home', 'home_number'], ['Work', 'work_number'], ['Other', 'other_number'], ['Loan Amount', 'loan_amount', true], ['Due Date', 'due_date', true]].map(([l, k, r]) =>
                                <div key={k}><label className="text-xs font-semibold text-gray-500 mb-1 block">{l}{r && ' *'}</label><input required={r} type={k.includes('amount') ? 'number' : k.includes('date') ? 'date' : 'text'} step={k.includes('amount') ? '0.01' : undefined} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="input-field" /></div>
                            )}
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Client</label><select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="select-field">{clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>
                            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Collector</label><select value={form.assigned_collector} onChange={e => setForm({ ...form, assigned_collector: e.target.value })} className="select-field"><option value="">None</option>{users.filter(u => u.role === 'team_member').map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
                            <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Address</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="textarea-field" rows="2" /></div>
                            <div className="md:col-span-2"><label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label><textarea value={form.special_notes} onChange={e => setForm({ ...form, special_notes: e.target.value })} className="textarea-field" rows="2" /></div>
                        </div>
                        <div className="flex gap-3 mt-6"><button type="submit" className="btn-primary flex-1">Update Debtor</button><button type="button" onClick={() => { setEditMode(false); setTab('info'); }} className="btn-secondary flex-1">Cancel</button></div>
                    </form>}
                </div>
            </div></div>}

            {/* Bulk Modal */}
            <Modal isOpen={showBulk} onClose={() => setShowBulk(false)} title="Bulk Import Debtors" maxWidth="max-w-md">
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 mb-4 text-xs text-orange-700">CSV headers: full_name, email, phone_number, loan_amount, due_date, client_id, status, special_notes</div>
                <input ref={csvRef} type="file" accept=".csv" className="input-field text-sm" />
                <div className="flex gap-3 mt-4"><button onClick={handleBulk} className="btn-primary flex-1"><FiUpload size={14} />Import</button><button onClick={() => setShowBulk(false)} className="btn-secondary flex-1">Cancel</button></div>
            </Modal>
        </Layout>
    );
};

export default DebtorManagement;
