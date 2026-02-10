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
    const [form, setForm] = useState({
        debtor_ids: [],
        amount: '',
        description: '',
        expires_in_days: 7,
        send_email: true,  // Default to true
        send_sms: false    // Default to false
    });
    const [generatedLink, setGeneratedLink] = useState(null);
    const [emailResults, setEmailResults] = useState([]);
    const [smsResults, setSmsResults] = useState([]);

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
                expires_in_days: parseInt(form.expires_in_days),
                send_email: form.send_email,
                send_sms: form.send_sms
            });
            setGeneratedLink(Array.isArray(response.data) ? response.data : [response.data]);
            setEmailResults(response.email_results || []);
            setSmsResults(response.sms_results || []);
            toast.success(`${form.debtor_ids.length} payment link(s) generated!`);
            setForm({
                debtor_ids: [],
                amount: '',
                description: '',
                expires_in_days: 7,
                send_email: true,
                send_sms: false
            });
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
            active: 'badge-yellow',
            completed: 'badge-green',
            expired: 'badge-red',
            cancelled: 'badge-gray'
        };
        return badges[status] || 'badge-gray';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            active: 'Pending',
            completed: 'Paid',
            expired: 'Expired',
            cancelled: 'Cancelled'
        };
        return statusTexts[status] || status;
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
                <div className="space-y-4">
                    {links.map((link, i) => {
                        const isExpired = new Date(link.expires_at) < new Date() && link.status === 'active';
                        const daysUntilExpiry = Math.ceil((new Date(link.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysUntilExpiry <= 2 && daysUntilExpiry > 0 && link.status === 'active';
                        
                        return (
                            <div key={link.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 animate-slideUp" style={{ animationDelay: `${i * 20}ms` }}>
                                {/* Header Section */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <FiDollarSign size={22} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{link.debtor_details?.full_name || link.debtor?.full_name || 'Unknown'}</h3>
                                                <p className="text-xs text-gray-500 font-medium">{link.debtor_details?.debtor_id || link.debtor?.debtor_id || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">${parseFloat(link.amount || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Payment Amount</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Section */}
                                <div className="p-5">
                                    {/* Status and Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1 font-medium">Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(link.status)}`}>
                                                {getStatusText(link.status)}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <p className="text-xs text-blue-600 mb-1 font-medium flex items-center gap-1">
                                                <FiEye size={12} /> Views
                                            </p>
                                            <p className="text-xl font-bold text-blue-700">{link.view_count || 0}</p>
                                        </div>
                                        
                                        <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-xs text-green-600 mb-1 font-medium flex items-center gap-1">
                                                <FiExternalLink size={12} /> Clicks
                                            </p>
                                            <p className="text-xl font-bold text-green-700">{link.click_count || 0}</p>
                                        </div>
                                        
                                        <div className={`rounded-lg p-3 ${isExpired ? 'bg-red-50' : isExpiringSoon ? 'bg-yellow-50' : 'bg-purple-50'}`}>
                                            <p className={`text-xs mb-1 font-medium flex items-center gap-1 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-700' : 'text-purple-600'}`}>
                                                <FiCalendar size={12} /> Expiry
                                            </p>
                                            <p className={`text-sm font-bold ${isExpired ? 'text-red-700' : isExpiringSoon ? 'text-yellow-700' : 'text-purple-700'}`}>
                                                {isExpired ? 'Expired' : isExpiringSoon ? `${daysUntilExpiry}d left` : new Date(link.expires_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {link.description && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-1 font-medium">Description</p>
                                            <p className="text-sm text-gray-700">{link.description}</p>
                                        </div>
                                    )}

                                    {/* Payment Link */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                                        <p className="text-xs text-blue-600 mb-2 font-medium flex items-center gap-1">
                                            <FiLink size={12} /> Payment Link
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-blue-700 flex-1 truncate font-mono bg-white px-3 py-2 rounded border border-blue-200">
                                                {link.payment_url || `${window.location.origin}/pay/${link.payment_link_id}`}
                                            </code>
                                            <button
                                                onClick={() => copyLink(link.payment_url || `${window.location.origin}/pay/${link.payment_link_id}`)}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm"
                                                title="Copy Link"
                                            >
                                                <FiCopy size={14} /> Copy
                                            </button>
                                            <a
                                                href={link.payment_url || `${window.location.origin}/pay/${link.payment_link_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm"
                                                title="Open Link"
                                            >
                                                <FiExternalLink size={14} /> Open
                                            </a>
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <span>Created: {new Date(link.created_at).toLocaleString()}</span>
                                        {link.created_by_name && <span>By: {link.created_by_name}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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

                        {/* Email and SMS Options */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Send Notification</p>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.send_email}
                                        onChange={e => setForm({ ...form, send_email: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">Send Email</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.send_sms}
                                        onChange={e => setForm({ ...form, send_sms: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">Send SMS</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">Payment links will be sent to selected debtors via checked channels</p>
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
