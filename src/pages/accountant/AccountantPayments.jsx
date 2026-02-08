import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { paymentService } from '../../services/paymentService';
import { FiCheckCircle, FiXCircle, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AccountantPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchPayments();
    }, [search, statusFilter, page]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = { page, page_size: 20 };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await paymentService.getPayments(params);
            setPayments(response.results || []);
            setTotalCount(response.count || 0);
        } catch (error) {
            toast.error('Failed to load payments');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (paymentId) => {
        try {
            await paymentService.verifyPayment(paymentId);
            toast.success('Payment verified successfully');
            fetchPayments();
        } catch (error) {
            toast.error('Failed to verify payment');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            verified: 'badge-green',
            pending: 'badge-orange',
            failed: 'badge-red'
        };
        return badges[status] || 'badge-gray';
    };

    return (
        <Layout>
            {/* Header */}
            <div className="page-header mb-6">
                <div>
                    <h1 className="page-title">Payment Verification</h1>
                    <p className="page-subtitle">{totalCount} total payments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by debtor name or reference..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field w-auto"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Debtor</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reference</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="7" className="py-4">
                                            <div className="skeleton h-12 rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {payment.debtor?.full_name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {payment.debtor?.debtor_id || 'N/A'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-gray-900">
                                            ${parseFloat(payment.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600 capitalize">
                                            {payment.payment_method}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">
                                            {payment.reference_number || 'N/A'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`badge ${getStatusBadge(payment.status)} capitalize`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4">
                                            {payment.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleVerify(payment.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                                >
                                                    <FiCheckCircle size={14} />
                                                    Verify
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    {payment.status === 'verified' ? 'Verified' : 'N/A'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalCount > 20 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-secondary btn-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {Math.ceil(totalCount / 20)}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(totalCount / 20)}
                        className="btn-secondary btn-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </Layout>
    );
};

export default AccountantPayments;
