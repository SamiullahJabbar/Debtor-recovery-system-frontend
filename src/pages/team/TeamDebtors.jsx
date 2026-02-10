import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { debtorService } from '../../services/debtorService';
import { communicationService } from '../../services/communicationService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiFilter, FiEye, FiUsers, FiPhone, FiMail, FiMessageSquare, FiDollarSign, FiFileText, FiCalendar, FiPlus, FiX, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TeamDebtors = () => {
    const { user } = useAuth();
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: '', is_active: '' });
    
    // Detail modal states
    const [showDetail, setShowDetail] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    
    // Notes
    const [notes, setNotes] = useState([]);
    const [noteForm, setNoteForm] = useState({ note_type: 'outbound', content: '', communication_method: 'phone' });
    
    // Payments
    const [payments, setPayments] = useState([]);
    
    // Arrangement
    const [arrangement, setArrangement] = useState(null);

    useEffect(() => {
        fetchDebtors();
    }, []);

    const fetchDebtors = async () => {
        try {
            const params = {
                assigned_collector_id: user?.id,
                page_size: 100
            };
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            const r = await debtorService.getDebtors(params);
            setDebtors(r.results || []);
        } catch {
            // Hide API errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchDebtors, 300);
        return () => clearTimeout(t);
    }, [filters]);

    const viewDebtorDetail = async (debtor) => {
        setSelectedDebtor(debtor);
        setShowDetail(true);
        setActiveTab('info');
        
        // Fetch related data
        try {
            const [notesRes, paymentsRes] = await Promise.all([
                communicationService.getNotes(debtor.id).catch(() => ({ results: [] })),
                paymentService.getDebtorPayments(debtor.id).catch(() => ({ results: [] }))
            ]);
            setNotes(notesRes.results || []);
            setPayments(paymentsRes.results || []);
            
            // Fetch full debtor details to get arrangement
            const debtorRes = await debtorService.getDebtor(debtor.id);
            if (debtorRes.data) {
                setSelectedDebtor(debtorRes.data);
                setArrangement(debtorRes.data.payment_arrangement || null);
            }
        } catch (error) {
            console.error('Error fetching debtor details:', error);
        }
    };

    const addNote = async () => {
        if (!noteForm.content.trim()) {
            toast.error('Please enter note content');
            return;
        }
        
        try {
            await communicationService.addNote(selectedDebtor.id, noteForm);
            toast.success('Note added successfully');
            setNoteForm({ ...noteForm, content: '' });
            
            // Refresh notes
            const notesRes = await communicationService.getNotes(selectedDebtor.id);
            setNotes(notesRes.results || []);
        } catch (error) {
            // Hide API errors
        }
    };

    const badge = s => ({
        new: 'badge-blue',
        in_progress: 'badge-orange',
        settled: 'badge-green',
        closed: 'badge-gray'
    }[s] || 'badge-gray');

    const noteTypeBadge = type => ({
        inbound: 'badge-green',
        outbound: 'badge-blue'
    }[type] || 'badge-gray');

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Debtors</h1>
                    <p className="page-subtitle">{debtors.length} assigned debtors</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="card p-4 mb-6">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search debtors..."
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                            className="input-field pl-9 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-ghost btn-sm ${showFilters ? 'bg-orange-50 text-orange-600' : ''}`}
                    >
                        <FiFilter size={14} />Filters
                    </button>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 animate-slideUp">
                        <select
                            value={filters.status}
                            onChange={e => setFilters({ ...filters, status: e.target.value })}
                            className="select-field text-xs"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="settled">Settled</option>
                            <option value="closed">Closed</option>
                        </select>
                        <select
                            value={filters.is_active}
                            onChange={e => setFilters({ ...filters, is_active: e.target.value })}
                            className="select-field text-xs"
                        >
                            <option value="">All</option>
                            <option value="true">Active Only</option>
                            <option value="false">Inactive Only</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Debtors List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                </div>
            ) : debtors.length === 0 ? (
                <div className="empty-state">
                    <FiUsers size={40} />
                    <p className="mt-3 text-sm font-medium">No debtors assigned</p>
                    <p className="text-xs text-gray-400 mt-1">Contact your admin to get debtors assigned</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {debtors.map((d, i) => (
                        <div key={d.id} className="card-hover p-5 animate-slideUp" style={{ animationDelay: `${i * 20}ms` }}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20">
                                            <span className="text-white font-bold text-sm">{d.full_name?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-orange-600 font-semibold">{d.debtor_id}</p>
                                            <h3 className="font-bold text-gray-900 text-sm">{d.full_name}</h3>
                                            <p className="text-xs text-gray-400">{d.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <span className={`badge ${badge(d.status)}`}>{d.status?.replace('_', ' ')}</span>
                                        {d.is_active && <span className="badge badge-green">Active</span>}
                                        {d.client_details && <span className="badge badge-blue">{d.client_details.company_name}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-400 uppercase mb-1">Loan Amount</p>
                                        <p className="text-lg font-bold text-gray-900">${parseFloat(d.loan_amount).toLocaleString()}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <p className="text-[9px] text-green-500 uppercase font-semibold">Paid</p>
                                            <p className="text-sm font-bold text-green-700">${parseFloat(d.amount_paid).toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-orange-50 rounded-lg">
                                            <p className="text-[9px] text-orange-500 uppercase font-semibold">Pending</p>
                                            <p className="text-sm font-bold text-orange-700">${parseFloat(d.remaining_balance).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                <a href={`tel:${d.phone_number}`} className="btn-ghost btn-xs flex-1"><FiPhone size={12} />Call</a>
                                <a href={`mailto:${d.email}`} className="btn-ghost btn-xs flex-1"><FiMail size={12} />Email</a>
                                <button 
                                    onClick={() => viewDebtorDetail(d)} 
                                    className="btn-primary btn-xs flex-1"
                                >
                                    <FiEye size={12} />View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && selectedDebtor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">{selectedDebtor.full_name?.charAt(0)}</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedDebtor.full_name}</h2>
                                    <p className="text-sm text-gray-500">{selectedDebtor.debtor_id} · {selectedDebtor.email}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`badge ${badge(selectedDebtor.status)} text-xs`}>
                                            {selectedDebtor.status?.replace('_', ' ')}
                                        </span>
                                        {selectedDebtor.is_active && <span className="badge badge-green text-xs">Active</span>}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowDetail(false)} 
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <FiX size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 bg-white">
                            {[
                                { id: 'info', label: 'Information', icon: FiUsers },
                                { id: 'notes', label: 'Notes', icon: FiMessageSquare },
                                { id: 'payments', label: 'Payments', icon: FiDollarSign },
                                { id: 'arrangement', label: 'Arrangement', icon: FiCalendar }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                                        activeTab === tab.id 
                                            ? 'text-orange-600 border-orange-600 bg-orange-50' 
                                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase mb-1">Phone Number</p>
                                            <p className="text-sm font-semibold text-gray-800">{selectedDebtor.phone_number || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
                                            <p className="text-sm font-semibold text-gray-800">{selectedDebtor.email || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase mb-1">Address</p>
                                            <p className="text-sm font-semibold text-gray-800">{selectedDebtor.address || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <p className="text-xs text-gray-400 uppercase mb-1">Client</p>
                                            <p className="text-sm font-semibold text-gray-800">
                                                {selectedDebtor.client_details?.company_name || selectedDebtor.client?.company_name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-orange-50 p-4 rounded-xl text-center">
                                            <p className="text-xs text-orange-600 uppercase mb-1">Loan Amount</p>
                                            <p className="text-2xl font-bold text-orange-700">
                                                ${parseFloat(selectedDebtor.loan_amount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl text-center">
                                            <p className="text-xs text-green-600 uppercase mb-1">Amount Paid</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                ${parseFloat(selectedDebtor.amount_paid || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-xl text-center">
                                            <p className="text-xs text-red-600 uppercase mb-1">Remaining</p>
                                            <p className="text-2xl font-bold text-red-700">
                                                ${parseFloat(selectedDebtor.remaining_balance || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedDebtor.special_notes && (
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                            <p className="text-xs text-yellow-700 uppercase mb-1">Special Notes</p>
                                            <p className="text-sm text-gray-700">{selectedDebtor.special_notes}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <a 
                                            href={`tel:${selectedDebtor.phone_number}`} 
                                            className="btn-primary flex-1 justify-center"
                                        >
                                            <FiPhone size={16} /> Call Debtor
                                        </a>
                                        <a 
                                            href={`mailto:${selectedDebtor.email}`} 
                                            className="btn-secondary flex-1 justify-center"
                                        >
                                            <FiMail size={16} /> Send Email
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <div className="space-y-6">
                                    {/* Add Note Form */}
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Note</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <select
                                                    value={noteForm.note_type}
                                                    onChange={e => setNoteForm({ ...noteForm, note_type: e.target.value })}
                                                    className="select-field text-sm w-32"
                                                >
                                                    <option value="outbound">Outbound</option>
                                                    <option value="inbound">Inbound</option>
                                                </select>
                                                <select
                                                    value={noteForm.communication_method}
                                                    onChange={e => setNoteForm({ ...noteForm, communication_method: e.target.value })}
                                                    className="select-field text-sm w-32"
                                                >
                                                    <option value="phone">Phone</option>
                                                    <option value="email">Email</option>
                                                    <option value="sms">SMS</option>
                                                    <option value="visit">Visit</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <textarea
                                                value={noteForm.content}
                                                onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                                                placeholder="Enter note content..."
                                                className="textarea-field text-sm"
                                                rows="3"
                                            />
                                            <button 
                                                onClick={addNote}
                                                className="btn-primary btn-sm"
                                                disabled={!noteForm.content.trim()}
                                            >
                                                <FiPlus size={14} /> Add Note
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notes List */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-gray-900">Notes History ({notes.length})</h3>
                                        {notes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <FiMessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No notes yet</p>
                                            </div>
                                        ) : (
                                            notes.map((note, idx) => (
                                                <div key={note.id || idx} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`badge ${noteTypeBadge(note.note_type)} text-xs`}>
                                                                {note.note_type}
                                                            </span>
                                                            <span className="badge badge-gray text-xs">
                                                                {note.communication_method}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(note.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{note.content}</p>
                                                    {note.created_by_name && (
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            By: {note.created_by_name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payments Tab */}
                            {activeTab === 'payments' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Payment History ({payments.length})</h3>
                                    {payments.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <FiDollarSign size={40} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No payments recorded</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {payments.map((payment, idx) => (
                                                <div key={payment.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            ${parseFloat(payment.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {payment.payment_method} · {new Date(payment.payment_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className={`badge ${
                                                        payment.status === 'verified' ? 'badge-green' : 
                                                        payment.status === 'pending' ? 'badge-orange' : 'badge-gray'
                                                    } text-xs`}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Arrangement Tab */}
                            {activeTab === 'arrangement' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Payment Arrangement</h3>
                                    {arrangement ? (
                                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs text-blue-600 uppercase mb-1">Type</p>
                                                    <p className="text-sm font-semibold text-gray-800">{arrangement.payment_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-600 uppercase mb-1">Frequency</p>
                                                    <p className="text-sm font-semibold text-gray-800">{arrangement.frequency}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-600 uppercase mb-1">Installment</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        ${parseFloat(arrangement.installment_amount).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-600 uppercase mb-1">Start Date</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {new Date(arrangement.start_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="border-t border-blue-200 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-blue-700">
                                                        Progress: {arrangement.completed_installments} / {arrangement.total_installments}
                                                    </span>
                                                    <span className="text-sm font-semibold text-blue-800">
                                                        {Math.round((arrangement.completed_installments / arrangement.total_installments) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-600 rounded-full transition-all"
                                                        style={{ 
                                                            width: `${(arrangement.completed_installments / arrangement.total_installments) * 100}%` 
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <FiCalendar size={40} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No payment arrangement set</p>
                                            <p className="text-xs mt-1">Contact admin to set up a payment arrangement</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default TeamDebtors;