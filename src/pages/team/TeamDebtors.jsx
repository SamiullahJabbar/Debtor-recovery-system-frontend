import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { debtorService } from '../../services/debtorService';
import { communicationService } from '../../services/communicationService';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiFilter, FiEye, FiUsers, FiPhone, FiMail, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TeamDebtors = () => {
    const { user } = useAuth();
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: '', is_active: '' });

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
            toast.error('Failed to fetch debtors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchDebtors, 300);
        return () => clearTimeout(t);
    }, [filters]);

    const badge = s => ({
        new: 'badge-blue',
        in_progress: 'badge-orange',
        settled: 'badge-green',
        closed: 'badge-gray'
    }[s] || 'badge-gray');

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
                                <button className="btn-primary btn-xs flex-1"><FiEye size={12} />View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default TeamDebtors;
