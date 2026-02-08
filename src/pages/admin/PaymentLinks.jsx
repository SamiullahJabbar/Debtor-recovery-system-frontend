import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { paymentService } from '../../services/paymentService';
import { debtorService } from '../../services/debtorService';
import { FiLink, FiCopy, FiEye, FiDollarSign, FiCalendar, FiExternalLink, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PaymentLinks = () => {
    const [links, setLinks] = useState([]);
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ debtor_ids: [], amount: '', description: '', expires_in_days: 7 });
    const [generatedLink, setGeneratedLink] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log('PaymentLinks: Fetching data...');
            const [linksData, debtorsData] = await Promise.all([
                paymentService.getPaymentLinks({ page_size: 100 }),
                debtorService.getDebtors({ page_size: 1000 })
            ]);
            console.log('PaymentLinks: Links data:', linksData);
            console.log('PaymentLinks: Debtors data:', debtorsData);
            console.log('PaymentLinks: Debtors results:', debtorsData.results);
            console.log('PaymentLinks: Debtors count:', debtorsData.count);
            setLinks(linksData.results || []);
            setDebtors(debtorsData.results || []);
        } catch (error) {
            toast.error('Failed to load data');
            console.error('PaymentLinks: Error loading data:', error);
            console.error('PaymentLinks: Error response:', error.response);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (form.debtor_ids.length === 0) {
            toast.error('Please select at least one debtor');
            return;
        }
        try {
            const response = await paymentService.generatePaymentLink({
                debtor_ids: form.debtor_ids.map(id => parseInt(id)),
                amount: parseFloat(form.amount),
                description: form.description,
                expires_in_days: parseInt(form.expires_in_days)
            });
            setGeneratedLink(Array.isArray(response.data) ? response.data : [response.data]);
            toast.success(`${form.debtor_ids.length} payment link(s) generated!`);
            setForm({ debtor_ids: [], amount: '', description: '', expires_in_days: 7 });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate link');
        }
    };

    const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'badge-green',
            paid: 'badge-blue',
            expired: 'badge-red',
            cancelled: 'badge-gray'
        };
        return badges[status] || 'badge-gray';
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div>
                    <h1 className="page-title">Payment Links</h1>
                    <p className="page-subtitle">{links.length} total links</p>
                </div>
                <button onClick={() => { setShowModal(true); setGeneratedLink(null); }} className="btn-primary btn-sm mt-4 sm:mt-0">
                    <FiLink size={14} /> Generate Link
                </button>
            </div>

            {/* Payment Links List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                </div>
            ) : links.length === 0 ? (
                <div className="empty-state">
                    <FiLink size={40} />
                    <p className="mt-3 text-sm font-medium">No payment links yet</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary btn-sm mt-4">
                        <FiLink size={14} /> Generate First Link
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link, i) => (
                        <div key={link.id} className="card-hover p-5 animate-slideUp" style={{ animationDelay: `${i * 20}ms` }}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <FiDollarSign size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{link.debtor?.full_name || 'Unknown'}</h3>
                                            <p className="text-xs text-gray-500">{link.debtor?.debtor_id || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-400">Amount</p>
                                            <p className="text-sm font-bold text-gray-900">${parseFloat(link.amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Status</p>
                                            <span className={`badge ${getStatusBadge(link.status)} text-xs`}>{link.status}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Views / Clicks</p>
                                            <p className="text-sm font-semibold text-gray-700">{link.view_count || 0} / {link.click_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Expires</p>
                                            <p className="text-sm text-gray-700">{new Date(link.expires_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {link.description && (
                                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">{link.description}</p>
                                    )}

                                    <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                        <FiLink size={14} className="text-blue-600" />
                                        <code className="text-xs text-blue-700 flex-1 truncate">{link.payment_url || `${window.location.origin}/pay/${link.link_id}`}</code>
                                        <button
                                            onClick={() => copyLink(link.payment_url || `${window.location.origin}/pay/${link.link_id}`)}
                                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                                        >
                                            <FiCopy size={14} />
                                        </button>
                                        <a
                                            href={link.payment_url || `${window.location.origin}/pay/${link.link_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                                        >
                                            <FiExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Generate Link Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generate Payment Link">
                {generatedLink && generatedLink.length > 0 ? (
                    <div className="space-y-4">
                        <div className="text-center p-6 bg-green-50 rounded-xl">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FiCheck size={32} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{generatedLink.length} Link(s) Generated!</h3>
                            <p className="text-sm text-gray-600">Payment links have been created successfully</p>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-3">
                            {generatedLink.map((link, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 mb-2">Link {idx + 1} - {link.debtor?.full_name || 'Debtor'}</p>
                                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                        <code className="text-xs text-blue-600 flex-1 break-all">{link.payment_url}</code>
                                        <button onClick={() => copyLink(link.payment_url)} className="btn-secondary btn-xs">
                                            <FiCopy size={12} /> Copy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={() => { setShowModal(false); setGeneratedLink(null); }} className="btn-primary w-full">
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Select Debtors *</label>
                            
                            {/* Selected Debtors Display */}
                            {form.debtor_ids.length > 0 && (
                                <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-700 mb-2">Selected Debtors ({form.debtor_ids.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {form.debtor_ids.map(debtorId => {
                                            const debtor = debtors.find(d => d.id.toString() === debtorId.toString());
                                            return debtor ? (
                                                <div key={debtorId} className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs border border-blue-200">
                                                    <span className="font-medium text-gray-700">{debtor.full_name}</span>
                                                    <span className="text-gray-400">-</span>
                                                    <span className="text-orange-600">${parseFloat(debtor.remaining_balance || 0).toLocaleString()}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, debtor_ids: form.debtor_ids.filter(id => id !== debtorId) })}
                                                        className="ml-1 text-red-400 hover:text-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Debtor Dropdown */}
                            <select
                                value=""
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    if (selectedId && !form.debtor_ids.includes(selectedId)) {
                                        setForm({ ...form, debtor_ids: [...form.debtor_ids, selectedId] });
                                    }
                                    e.target.value = ""; // Reset dropdown
                                }}
                                className="select-field"
                            >
                                <option value="">-- Click to add a debtor --</option>
                                {debtors
                                    .filter(d => !form.debtor_ids.includes(d.id.toString()))
                                    .map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.full_name} - ${parseFloat(d.remaining_balance || 0).toLocaleString()} remaining
                                        </option>
                                    ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Click dropdown to add more debtors</p>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                className="input-field"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Description (Optional)</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="textarea-field"
                                rows="3"
                                placeholder="Payment for invoice #123..."
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Expires In (Days)</label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={form.expires_in_days}
                                onChange={e => setForm({ ...form, expires_in_days: e.target.value })}
                                className="input-field"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary flex-1">Generate Link</button>
                            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                        </div>
                    </form>
                )}
            </Modal>
        </Layout>
    );
};

export default PaymentLinks;
