import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { clientService } from '../../services/clientService';
import { debtorService } from '../../services/debtorService';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiBriefcase, FiUpload, FiFilter, FiFile, FiX, FiEye, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ClientManagement = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDebtors, setClientDebtors] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const fileRef = useRef(null);
    const csvRef = useRef(null);

    const [filters, setFilters] = useState({ search: '', name: '', email: '', phone: '', contact_person: '', industry_type: '' });
    const [form, setForm] = useState({ company_name: '', contact_person_name: '', email: '', phone_number: '', address: '', industry_type: '', notes: '' });

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const params = {};
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            const r = await clientService.getClients(params);
            setClients(r.results || []);
        } catch { toast.error('Failed to fetch clients'); }
        finally { setLoading(false); }
    };

    useEffect(() => { const t = setTimeout(fetchClients, 300); return () => clearTimeout(t); }, [filters]);

    const openAdd = () => { setEditClient(null); setForm({ company_name: '', contact_person_name: '', email: '', phone_number: '', address: '', industry_type: '', notes: '' }); setDocuments([]); setShowModal(true); };
    const openEdit = (c) => { setEditClient(c); setForm({ company_name: c.company_name, contact_person_name: c.contact_person_name, email: c.email, phone_number: c.phone_number, address: c.address || '', industry_type: c.industry_type || '', notes: c.notes || '' }); setDocuments([]); setShowModal(true); };

    const viewClientDetails = async (client) => {
        try {
            setSelectedClient(client);
            setShowDetailModal(true);
            const debtors = await debtorService.getDebtors({ client_id: client.id, page_size: 100 });
            setClientDebtors(debtors.results || []);
        } catch { toast.error('Failed to load client details'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        documents.forEach(d => fd.append('documents', d));
        try {
            if (editClient) { await clientService.updateClient(editClient.id, fd); toast.success('Client updated!'); }
            else { await clientService.createClient(fd); toast.success('Client created!'); }
            setShowModal(false); fetchClients();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const confirmDelete = (client) => { setDeleteTarget(client); setShowDeleteConfirm(true); };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await clientService.deleteClient(deleteTarget.id);
            toast.success('Client deleted successfully');
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            fetchClients();
        } catch { toast.error('Failed to delete client'); }
    };

    const handleBulkImport = async () => {
        const file = csvRef.current?.files[0];
        if (!file) { toast.error('Select a CSV file'); return; }
        try { const r = await clientService.bulkImport(file); toast.success(r.message || `Imported: ${r.summary?.successful} clients`); setShowBulkModal(false); fetchClients(); }
        catch { toast.error('Import failed'); }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div><h1 className="page-title">Clients</h1><p className="page-subtitle">{clients.length} total clients</p></div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={() => setShowBulkModal(true)} className="btn-secondary btn-sm"><FiUpload size={14} />CSV Import</button>
                    <button onClick={openAdd} className="btn-primary btn-sm"><FiPlus size={14} />Add Client</button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="card p-4 mb-6">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} /><input type="text" placeholder="Search clients..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="input-field pl-9 text-sm" /></div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`btn-ghost btn-sm ${showFilters ? 'bg-orange-50 text-orange-600' : ''}`}><FiFilter size={14} />Filters</button>
                </div>
                {showFilters && <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100 animate-slideUp">
                    <input placeholder="Company Name" value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Email" value={filters.email} onChange={e => setFilters({ ...filters, email: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Phone" value={filters.phone} onChange={e => setFilters({ ...filters, phone: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Contact Person" value={filters.contact_person} onChange={e => setFilters({ ...filters, contact_person: e.target.value })} className="input-field text-xs" />
                    <input placeholder="Industry Type" value={filters.industry_type} onChange={e => setFilters({ ...filters, industry_type: e.target.value })} className="input-field text-xs" />
                </div>}
            </div>

            {/* Client Grid */}
            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}</div>
                : clients.length === 0 ? <div className="empty-state"><FiBriefcase size={40} /><p className="mt-3 text-sm font-medium">No clients found</p><button onClick={openAdd} className="btn-primary btn-sm mt-4"><FiPlus size={14} />Add First Client</button></div>
                    : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {clients.map((c, i) => (
                            <div key={c.id} className="card-hover p-5 animate-slideUp cursor-pointer" style={{ animationDelay: `${i * 30}ms` }} onClick={() => viewClientDetails(c)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20"><span className="text-white font-bold text-sm">{c.company_name?.charAt(0)}</span></div>
                                        <div>
                                            <p className="text-[10px] text-orange-600 font-semibold">{c.client_id}</p>
                                            <h3 className="font-bold text-gray-900 text-sm">{c.company_name}</h3>
                                            <p className="text-xs text-gray-400">{c.contact_person_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><FiEdit2 size={13} /></button>
                                        <button onClick={() => confirmDelete(c)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FiTrash2 size={13} /></button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <p className="text-xs text-gray-500">{c.email}</p>
                                    <p className="text-xs text-gray-500">{c.phone_number}</p>
                                    {c.industry_type && <span className="badge badge-orange">{c.industry_type}</span>}
                                </div>
                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                                    <div><p className="text-[10px] text-gray-400 uppercase">Debtors</p><p className="text-lg font-bold text-gray-900">{c.total_debtors || 0}</p></div>
                                    <div><p className="text-[10px] text-gray-400 uppercase">Recovered</p><p className="text-lg font-bold text-emerald-600">${(c.total_recovered || 0).toLocaleString()}</p></div>
                                    <div><p className="text-[10px] text-gray-400 uppercase">Pending</p><p className="text-lg font-bold text-orange-500">${(c.total_pending || 0).toLocaleString()}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>}

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editClient ? 'Edit Client' : 'Add New Client'} subtitle={editClient ? 'Update client information' : 'Fill in client details'} maxWidth="max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Company Name *</label><input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Contact Person *</label><input required value={form.contact_person_name} onChange={e => setForm({ ...form, contact_person_name: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Email *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone *</label><input required value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Industry</label><input value={form.industry_type} onChange={e => setForm({ ...form, industry_type: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
                        <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="textarea-field" rows="2" /></div>
                    </div>

                    {/* Document Upload */}
                    <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-3"><FiFile size={12} className="inline mr-1" />Attach Documents</p>
                        <input ref={fileRef} type="file" multiple onChange={e => setDocuments([...documents, ...Array.from(e.target.files)])} className="hidden" />
                        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary btn-xs"><FiUpload size={12} />Choose Files</button>
                        {documents.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{documents.map((d, i) => (
                            <span key={i} className="badge badge-blue flex items-center gap-1">{d.name}<button type="button" onClick={() => setDocuments(documents.filter((_, j) => j !== i))} className="hover:text-red-500"><FiX size={10} /></button></span>
                        ))}</div>}
                    </div>

                    <div className="flex gap-3 mt-6"><button type="submit" className="btn-primary flex-1">{editClient ? 'Update' : 'Create'} Client</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button></div>
                </form>
            </Modal>

            {/* Client Detail Modal */}
            {showDetailModal && selectedClient && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-lg">{selectedClient.company_name?.charAt(0)}</span></div>
                                <div>
                                    <p className="text-xs text-orange-600 font-semibold">{selectedClient.client_id}</p>
                                    <h2 className="text-lg font-bold text-gray-900">{selectedClient.company_name}</h2>
                                    <p className="text-xs text-gray-400">{selectedClient.contact_person_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="btn-ghost btn-xs"><FiX size={18} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Client Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                                    <div><p className="text-[10px] text-gray-400 uppercase">Email</p><p className="text-sm font-medium text-gray-800">{selectedClient.email}</p></div>
                                    <div><p className="text-[10px] text-gray-400 uppercase">Phone</p><p className="text-sm font-medium text-gray-800">{selectedClient.phone_number}</p></div>
                                    {selectedClient.address && <div><p className="text-[10px] text-gray-400 uppercase">Address</p><p className="text-sm font-medium text-gray-800">{selectedClient.address}</p></div>}
                                    {selectedClient.industry_type && <div><p className="text-[10px] text-gray-400 uppercase">Industry</p><p className="text-sm font-medium text-gray-800">{selectedClient.industry_type}</p></div>}
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Summary</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-blue-50 rounded-xl"><p className="text-[10px] text-blue-500 uppercase font-semibold">Total Debtors</p><p className="text-2xl font-bold text-blue-700">{selectedClient.total_debtors || 0}</p></div>
                                        <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-[10px] text-emerald-500 uppercase font-semibold">Active</p><p className="text-2xl font-bold text-emerald-700">{selectedClient.active_debtors || 0}</p></div>
                                        <div className="p-3 bg-green-50 rounded-xl"><p className="text-[10px] text-green-500 uppercase font-semibold">Recovered</p><p className="text-xl font-bold text-green-700">${(selectedClient.total_recovered || 0).toLocaleString()}</p></div>
                                        <div className="p-3 bg-orange-50 rounded-xl"><p className="text-[10px] text-orange-500 uppercase font-semibold">Pending</p><p className="text-xl font-bold text-orange-700">${(selectedClient.total_pending || 0).toLocaleString()}</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            {selectedClient.documents && selectedClient.documents.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedClient.documents.map(doc => (
                                            <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="badge badge-blue flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-colors">
                                                <FiFile size={10} />{doc.file_name}<FiExternalLink size={10} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Debtors List */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Debtors ({clientDebtors.length})</h3>
                                {clientDebtors.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-6">No debtors found for this client</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {clientDebtors.map(debtor => (
                                            <div key={debtor.id} className="card p-3 flex items-center justify-between hover:shadow-md transition-shadow">
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{debtor.full_name}</p>
                                                    <p className="text-xs text-gray-500">{debtor.debtor_id} · {debtor.email}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-900">${parseFloat(debtor.loan_amount).toLocaleString()}</p>
                                                    <p className="text-xs text-orange-600">Pending: ${parseFloat(debtor.remaining_balance).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deleteTarget && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Client?</h3>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Are you sure you want to delete <span className="font-semibold">{deleteTarget.company_name}</span>? This action cannot be undone.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                                <p className="text-xs text-amber-800"><strong>Warning:</strong> All associated debtors and data will also be deleted.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleDelete} className="btn-primary bg-red-600 hover:bg-red-700 flex-1">Delete</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Import Clients" subtitle="Upload a CSV file with client data" maxWidth="max-w-md">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mb-4">
                    <p className="text-xs text-orange-700 font-medium">CSV must have headers: company_name, contact_person_name, email, phone_number, address, industry_type, notes</p>
                </div>
                <input ref={csvRef} type="file" accept=".csv" className="input-field text-sm" />
                <div className="flex gap-3 mt-5"><button onClick={handleBulkImport} className="btn-primary flex-1"><FiUpload size={14} />Import</button><button onClick={() => setShowBulkModal(false)} className="btn-secondary flex-1">Cancel</button></div>
            </Modal>
        </Layout>
    );
};

export default ClientManagement;
