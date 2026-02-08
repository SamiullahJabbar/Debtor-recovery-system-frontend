import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { debtorService } from '../../services/debtorService';
import { FiSearch, FiUser, FiDollarSign, FiCalendar, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

const GlobalDebtors = () => {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchDebtors();
    }, [search, page]);

    const fetchDebtors = async () => {
        try {
            setLoading(true);
            console.log('GlobalDebtors: Fetching debtors...');
            const response = await debtorService.getGlobalDebtors({ search, page, page_size: 20 });
            console.log('GlobalDebtors: Response:', response);
            console.log('GlobalDebtors: Results:', response.results);
            console.log('GlobalDebtors: Count:', response.count);
            setDebtors(response.results || []);
            setTotalCount(response.count || 0);
        } catch (error) {
            toast.error('Failed to load debtors');
            console.error('GlobalDebtors: Error:', error);
            console.error('GlobalDebtors: Error response:', error.response);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignToMe = async (debtorId) => {
        try {
            await debtorService.assignToMe(debtorId);
            toast.success('Debtor assigned to you successfully!');
            fetchDebtors(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign debtor');
        }
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            arrangement: 'badge-green',
            active: 'badge-orange',
            inactive: 'badge-gray'
        };
        return badges[priority] || 'badge-gray';
    };

    const getStatusBadge = (status) => {
        const badges = {
            new: 'badge-blue',
            in_progress: 'badge-orange',
            settled: 'badge-green',
            closed: 'badge-gray'
        };
        return badges[status] || 'badge-gray';
    };

    return (
        <Layout>
            {/* Header */}
            <div className="page-header mb-6">
                <div>
                    <h1 className="page-title">All Available Debtors</h1>
                    <p className="page-subtitle">{totalCount} unassigned debtors available to claim</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, ID, email, or client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Debtors Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-48 rounded-2xl" />
                    ))}
                </div>
            ) : debtors.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUser className="text-orange-500" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Debtors Available</h3>
                    <p className="text-gray-500 text-sm mb-2">
                        {search ? 'No debtors match your search.' : 'There are no unassigned debtors at the moment.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                        All debtors have been assigned to team members.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {debtors.map((debtor, index) => (
                        <div
                            key={debtor.id}
                            className="card-hover p-5 animate-slideUp"
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                                        <span className="text-white font-bold text-lg">
                                            {debtor.full_name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{debtor.full_name}</h3>
                                        <p className="text-xs text-gray-500">{debtor.debtor_id}</p>
                                    </div>
                                </div>
                                <span className={`badge ${getPriorityBadge(debtor.priority)} capitalize text-xs`}>
                                    {debtor.priority}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <FiDollarSign size={14} className="text-gray-400" />
                                    <span className="font-semibold">Loan:</span>
                                    <span className="text-orange-600 font-bold">${debtor.loan_amount?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <FiDollarSign size={14} className="text-gray-400" />
                                    <span className="font-semibold">Remaining:</span>
                                    <span className="text-red-600 font-bold">${debtor.remaining_balance?.toLocaleString()}</span>
                                </div>
                                {debtor.client && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <FiMapPin size={14} className="text-gray-400" />
                                        <span className="truncate">{debtor.client.company_name}</span>
                                    </div>
                                )}
                                {debtor.due_date && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <FiCalendar size={14} className="text-gray-400" />
                                        <span>Due: {new Date(debtor.due_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Status & Action */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${getStatusBadge(debtor.status)} capitalize text-xs`}>
                                        {debtor.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleAssignToMe(debtor.id)}
                                    className="btn-primary btn-xs"
                                >
                                    Assign to Me
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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

export default GlobalDebtors;