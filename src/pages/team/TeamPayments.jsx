import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { FiDollarSign, FiCheckCircle, FiClock, FiXCircle, FiFilter, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TeamPayments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: '', payment_method: '' });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            // Use the new team member-specific endpoint
            const params = { page_size: 100 };
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            const r = await paymentService.getMyAssignedPayments(params);
            setPayments(r.results || []);
        } catch (err) {
            console.error('Payment fetch error:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchPayments, 300);
        return () => clearTimeout(t);
    }, [filters]);

    const statusBadge = s => ({
        verified: 'badge-green',
        pending: 'badge-yellow',
        rejected: 'badge-red'
    }[s] || 'badge-gray');

    const statusIcon = s => ({
        verified: <FiCheckCircle className="text-green-500" />,
        pending: <FiClock className="text-yellow-500" />,
        rejected: <FiXCircle className="text-red-500" />
    }[s] || <FiClock className="text-gray-500" />);

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payment History</h1>
                    <p className="page-subtitle">{payments.length} total payments</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="card p-4 mb-6">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search payments..."
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
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={filters.payment_method}
                            onChange={e => setFilters({ ...filters, payment_method: e.target.value })}
                            className="select-field text-xs"
                        >
                            <option value="">All Methods</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Payments List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                </div>
            ) : payments.length === 0 ? (
                <div className="empty-state">
                    <FiDollarSign size={40} />
                    <p className="mt-3 text-sm font-medium">No payments found</p>
                    <p className="text-xs text-gray-400 mt-1">Payments will appear here once debtors make payments</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payments.map((p, i) => (
                        <div key={p.id} className="card-hover p-5 animate-slideUp" style={{ animationDelay: `${i * 20}ms` }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-green-500/20">
                                        <FiDollarSign size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-gray-900">${parseFloat(p.amount).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">
                                            {p.debtor_details?.full_name || 'Unknown Debtor'} · {p.payment_method?.replace('_', ' ')}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{new Date(p.payment_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-2">
                                        {statusIcon(p.status)}
                                        <span className={`badge ${statusBadge(p.status)}`}>
                                            {p.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {p.verified_by_details && (
                                        <p className="text-xs text-gray-400">Verified by {p.verified_by_details.full_name}</p>
                                    )}
                                </div>
                            </div>
                            {p.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-600">{p.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default TeamPayments;
