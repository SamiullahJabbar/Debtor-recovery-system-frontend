import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import Login from './components/auth/Login';
import OTPVerification from './components/auth/OTPVerification';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ClientManagement from './pages/admin/ClientManagement';
import DebtorManagement from './pages/admin/DebtorManagement';
import UserManagement from './pages/admin/UserManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import Reports from './pages/admin/Reports';
import TemplateManagement from './pages/admin/TemplateManagement';
import TeamMemberPerformance from './pages/admin/TeamMemberPerformance';
import ScheduledCommunications from './pages/admin/ScheduledCommunications';
import PaymentLinks from './pages/admin/PaymentLinks';

// Team Member Pages
import TeamDashboard from './pages/team/TeamDashboard';
import TeamDebtors from './pages/team/TeamDebtors';
import TeamPayments from './pages/team/TeamPayments';
import TeamProfile from './pages/team/TeamProfile';
import GlobalDebtors from './pages/team/GlobalDebtors';

// Accountant Pages
import AccountantDashboard from './pages/accountant/AccountantDashboard';
import AccountantPayments from './pages/accountant/AccountantPayments';
import AccountantReports from './pages/accountant/AccountantReports';

// Team Pages
import TeamPaymentLinks from './pages/team/TeamPaymentLinks';

// Public Pages (No Auth Required)
import PaymentSuccess from './pages/public/PaymentSuccess';
import PaymentCancel from './pages/public/PaymentCancel';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading...</p>
            </div>
        </div>
    );

    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'team_member') return <Navigate to="/team/dashboard" replace />;
        if (user.role === 'accountant') return <Navigate to="/accountant/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
};

const RoleBasedRedirect = () => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    // Redirect based on role
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'team_member') return <Navigate to="/team/dashboard" replace />;
    if (user.role === 'accountant') return <Navigate to="/accountant/dashboard" replace />;

    return <Navigate to="/login" replace />;
};

const App = () => (
    <AuthProvider>
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/verify-otp" element={<OTPVerification />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={['admin']}><ClientManagement /></ProtectedRoute>} />
                <Route path="/admin/debtors" element={<ProtectedRoute allowedRoles={['admin']}><DebtorManagement /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/team/:id/performance" element={<ProtectedRoute allowedRoles={['admin']}><TeamMemberPerformance /></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><PaymentManagement /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
                <Route path="/admin/templates" element={<ProtectedRoute allowedRoles={['admin']}><TemplateManagement /></ProtectedRoute>} />
                <Route path="/admin/scheduled-communications" element={<ProtectedRoute allowedRoles={['admin']}><ScheduledCommunications /></ProtectedRoute>} />
                <Route path="/admin/payment-links" element={<ProtectedRoute allowedRoles={['admin']}><PaymentLinks /></ProtectedRoute>} />

                {/* Team Member Routes */}
                <Route path="/team/dashboard" element={<ProtectedRoute allowedRoles={['team_member']}><TeamDashboard /></ProtectedRoute>} />
                <Route path="/team/debtors" element={<ProtectedRoute allowedRoles={['team_member']}><TeamDebtors /></ProtectedRoute>} />
                <Route path="/team/global-debtors" element={<ProtectedRoute allowedRoles={['team_member']}><GlobalDebtors /></ProtectedRoute>} />
                <Route path="/team/payments" element={<ProtectedRoute allowedRoles={['team_member']}><TeamPayments /></ProtectedRoute>} />
                <Route path="/team/payment-links" element={<ProtectedRoute allowedRoles={['team_member']}><TeamPaymentLinks /></ProtectedRoute>} />
                <Route path="/team/profile" element={<ProtectedRoute allowedRoles={['team_member']}><TeamProfile /></ProtectedRoute>} />

                {/* Accountant Routes */}
                <Route path="/accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
                <Route path="/accountant/payments" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantPayments /></ProtectedRoute>} />
                <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantReports /></ProtectedRoute>} />

                {/* Default Routes */}
                <Route path="/" element={<RoleBasedRedirect />} />
                <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />
    </AuthProvider>
);

export default App;
