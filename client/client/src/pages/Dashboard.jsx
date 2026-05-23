import React, { useState, useEffect } from "react";
import { useAuth } from "../stores";
import {
    Loader,
    PostJobModal,
    PostedJobs,
    RecentTransactions
} from "../components";
import DashboardAnalytics from "../components/DashboardAnalytics";
import { FiArrowUpRight } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router";

function Dashboard() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPostJobModal, setShowPostJobModal] = useState(false);

    // Auto-open modal if query parameter is present
    useEffect(() => {
        if (searchParams.get('showPostJob') === 'true') {
            setShowPostJobModal(true);
            // Clean up the URL by removing the query parameter
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, navigate]);

    if (!userData) return <Loader />;

    const isClient = userData.role === "client";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary/5">
            {showPostJobModal && (
                <PostJobModal setShowPostJobModal={setShowPostJobModal} />
            )}

            {/* Dashboard Content */}
            <main className="p-6 lg:p-10">
                <div className="max-w-7xl mx-auto space-y-10">
                    {/* Summary Header */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                                Welcome back, <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">{userData?.name?.firstName}</span>
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">
                                Dashboard &bull; <span className="text-primary font-semibold capitalize">{userData.role}</span> Profile
                            </p>
                        </div>
                        <Link
                            to="/projects-workspace"
                            className="flex items-center gap-2 bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 px-6 py-3 rounded-xl font-semibold text-sm hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/15 hover:to-primary/8 hover:shadow-lg transition-all duration-300 active:scale-[0.98] md:self-auto self-start"
                        >
                            Projects Workspace
                        </Link>
                    </div>

                    {/* Analytics Section */}
                    <DashboardAnalytics role={userData.role} />
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
