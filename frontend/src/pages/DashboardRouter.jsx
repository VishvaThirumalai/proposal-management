import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Admin Components
import AdminDashboard from '../components/admin/AdminDashboard';
import VerifyMentors from '../components/admin/VerifyMentors';
import VerifyInvestors from '../components/admin/VerifyInvestors';
import ManageUsers from '../components/admin/ManageUsers';

// Founder Components
import FounderDashboard from '../components/founder/FounderDashboard';
import UploadProposal from '../components/founder/UploadProposal';

// Mentor Components
import MentorDashboard from '../components/mentor/MentorDashboard';
import MentorSearchStartups from '../components/mentor/SearchStartups';
import MentorAssignedStartups from '../components/mentor/AssignedStartups';
import MentorRequests from '../components/mentor/Requests';

// Investor Components
import InvestorDashboard from '../components/investor/InvestorDashboard';
import InvestorSearchStartups from '../components/investor/SearchStartups';
import InvestorPortfolio from '../components/investor/Portfolio';

const DashboardRouter = () => {
    const { getUserRole, isAuthenticated } = useAuth();

    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }

    const role = getUserRole();

    if (!role) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                {/* Admin Routes */}
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/verify-mentors" element={<VerifyMentors />} />
                <Route path="admin/verify-investors" element={<VerifyInvestors />} />
                <Route path="admin/manage-users" element={<ManageUsers />} />
                
                {/* Founder Routes */}
                <Route path="founder" element={<FounderDashboard />} />
                <Route path="founder/upload" element={<UploadProposal />} />
                
                {/* Mentor Routes */}
                <Route path="mentor" element={<MentorDashboard />} />
                <Route path="mentor/search" element={<MentorSearchStartups />} />
                <Route path="mentor/assigned" element={<MentorAssignedStartups />} />
                <Route path="mentor/requests" element={<MentorRequests />} />
                
                {/* Investor Routes */}
                <Route path="investor" element={<InvestorDashboard />} />
                <Route path="investor/search" element={<InvestorSearchStartups />} />
                <Route path="investor/portfolio" element={<InvestorPortfolio />} />
                
                {/* Pending Verification */}
                <Route path="pending" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center p-8">
                            <div className="text-5xl mb-4">⏳</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Pending Verification</h2>
                            <p className="text-gray-600 max-w-md">
                                Your account is waiting for admin verification. You will be notified once approved.
                            </p>
                        </div>
                    </div>
                } />
                
                <Route path="*" element={<Navigate to={`/${role.toLowerCase()}`} />} />
            </Routes>
        </div>
    );
};

export default DashboardRouter;