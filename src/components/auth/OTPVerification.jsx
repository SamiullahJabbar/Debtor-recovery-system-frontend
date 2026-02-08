import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiShield, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

const OTPVerification = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const refs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP } = useAuth();

    const temp_token = location.state?.temp_token;
    const userInfo = location.state?.user;
    const email = location.state?.email;

    useEffect(() => { if (!temp_token) navigate('/login'); }, [temp_token]);

    const handleChange = (i, v) => {
        if (!/^\d*$/.test(v)) return;
        const next = [...otp]; next[i] = v.slice(-1); setOtp(next);
        if (v && i < 5) refs.current[i+1]?.focus();
    };

    const handleKeyDown = (i, e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i-1]?.focus(); };

    const handlePaste = (e) => {
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (data.length === 6) { setOtp(data.split('')); refs.current[5]?.focus(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            const r = await verifyOTP(temp_token, code);
            if (r.status === 'success') {
                toast.success('Login successful!');
                const role = r.user?.role;
                navigate(role === 'admin' ? '/admin/dashboard' : role === 'accountant' ? '/accountant/payments' : '/team/my-debtors');
            } else { toast.error(r.message || 'Invalid OTP'); }
        } catch (err) { toast.error(err.response?.data?.message || 'Verification failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors"><FiArrowLeft size={16}/>Back to login</button>

                <div className="card p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25"><FiShield size={28} className="text-white" /></div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                    <p className="text-sm text-gray-500 mb-8">Enter the 6-digit code sent to<br/><span className="font-semibold text-gray-700">{email || 'your email'}</span></p>

                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
                            {otp.map((d, i) => (
                                <input key={i} ref={el => refs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={d}
                                    onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" />
                            ))}
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Verify & Login'}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 mt-6">Check the backend terminal for OTP (console email)</p>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
