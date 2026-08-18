import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardRouter from './pages/DashboardRouter';
import './App.css';

// ✅ Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, getUserRole } = useAuth();
    
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    
    const userRole = getUserRole();
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function AppContent() {
    return (
        <Router>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                    <Routes>
                        {/* ===== PUBLIC ROUTES ===== */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        
                        {/* ===== PROTECTED ROUTES ===== */}
                        <Route
                            path="/dashboard/*"
                            element={
                                <ProtectedRoute>
                                    <DashboardRouter />
                                </ProtectedRoute>
                            }
                        />
                        
                        {/* ===== 404 REDIRECT ===== */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;