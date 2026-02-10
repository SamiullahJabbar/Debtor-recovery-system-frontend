import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const r = await login(email, password);
            if (r.status === 'success') {
                toast.success('OTP sent to your email!');
                navigate('/verify-otp', { state: { temp_token: r.temp_token, user: r.user, email } });
            } else { toast.error(r.message || 'Login failed'); }
        } catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"><div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" /><div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" /></div>
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                        <img src="/src/assets/images/logo.png" alt="Aussie Recoveries" className="w-20 h-20 object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">AUSSIE RECOVERIES</h1>
                    <p className="text-white/80 text-lg">Professional Debt Recovery Solutions</p>
                </div>
                <div className="relative z-10 space-y-4">
                    {['Track & manage debtors efficiently', 'Real-time payment monitoring', 'Automated communication templates'].map((t,i) => (
                        <div key={i} className="flex items-center gap-3"><div className="w-2 h-2 bg-white rounded-full" /><p className="text-white/80 text-sm">{t}</p></div>
                    ))}
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-10"><div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg mb-4 border border-gray-200"><img src="/src/assets/images/logo.png" alt="Aussie Recoveries" className="w-12 h-12 object-contain" /></div><h1 className="text-2xl font-bold text-gray-900">AUSSIE RECOVERIES</h1></div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">Email Address</label>
                            <div className="relative"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-field pl-11" placeholder="you@example.com"/></div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">Password</label>
                            <div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="input-field pl-11" placeholder="Enter password"/></div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><span>Continue with OTP</span><FiArrowRight size={16}/></>}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-8">An OTP will be sent to your email for verification</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
