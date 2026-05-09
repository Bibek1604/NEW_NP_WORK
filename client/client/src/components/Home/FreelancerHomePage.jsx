import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import JobCard from "../JobCard";
import toast from "react-hot-toast";
import Loader from "../Loader";
import FreelancerProjects from "../FreelancerDashboard/FreelancerProjects";
import { 
    FiBriefcase, 
    FiTrendingUp, 
    FiFilter, 
    FiSearch, 
    FiAlertCircle,
    FiX,
    FiArrowRight,
    FiUsers,
    FiAward,
    FiHeart
} from "react-icons/fi";
import { useSearchParams, Link } from "react-router";

function FreelancerHomePage({ userData }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("matched");
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    // Calculate stats from jobs
    const calculateStats = (jobsList) => {
        if (jobsList.length === 0) {
            return { avgValue: "Rs. 0", totalJobs: 0 };
        }
        
        const totalBudget = jobsList.reduce((sum, job) => {
            const budget = parseFloat(job.budget) || 0;
            return sum + budget;
        }, 0);
        
        const avgValue = jobsList.length > 0 ? Math.round(totalBudget / jobsList.length) : 0;
        
        return {
            avgValue: `Rs. ${avgValue.toLocaleString()}`,
            totalJobs: jobsList.length
        };
    };

    const stats = calculateStats(jobs);

    useEffect(() => {
        const fetchSetJobs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (userData?._id) params.set("userId", userData._id);
                if (query) params.set("q", query);

                const response = await api.get(`/jobs/get-home-jobs${params.toString() ? `?${params.toString()}` : ""}`);
                
                let results = response.data.data;
                
                if (query) {
                    results = results.filter(j => 
                        j.title?.toLowerCase().includes(query.toLowerCase()) || 
                        j.description?.toLowerCase().includes(query.toLowerCase()) ||
                        j.category?.toLowerCase().includes(query.toLowerCase())
                    );
                }

                setJobs(results);
            } catch (error) {
                toast.error("Failed to load discovery feed");
            } finally {
                setLoading(false);
            }
        };
        fetchSetJobs();
    }, [activeTab, query]);

    return (
        <div className="min-h-screen bg-white pt-20">
            <main className="p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="space-y-2 mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            🚀 Recommended Projects
                        </h1>
                        <p className="text-slate-600 text-sm">Projects ranked by how closely they match your profile, tags, and rate.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Available Projects Card */}
                        <div className="bg-emerald-50/50 border border-emerald-200/30 rounded-lg p-5 hover:shadow-md hover:border-emerald-200/60 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                    <FiBriefcase className="text-emerald-600 text-lg" />
                                </div>
                                <span className="text-2xl opacity-20">📱</span>
                            </div>
                            <h3 className="font-semibold text-slate-700 text-xs mb-1">Available Projects</h3>
                            <p className="text-3xl font-bold text-slate-900">{jobs.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Updated live</p>
                        </div>
                    </div>

                    {/* Main Content - Marketplace Grid */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-slate-200 bg-slate-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    {query ? (
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                🔍 Search Results
                                            </h2>
                                            <p className="text-slate-600 text-xs mt-1">Found <span className="font-semibold text-primary">{jobs.length}</span> projects matching "<span className="font-semibold">{query}</span>"</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                📚 Recent Projects
                                            </h2>
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    onClick={() => setActiveTab("matched")}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition ${activeTab === "matched" ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    🔥 For You
                                                </button>
                                                <button 
                                                    onClick={() => setActiveTab("trending")}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition ${activeTab === "trending" ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    📈 Trending
                                                </button>
                                                <button 
                                                    onClick={() => setActiveTab("newest")}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition ${activeTab === "newest" ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    ⏰ Newest
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {query && (
                                    <button 
                                        onClick={() => setSearchParams({})}
                                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold text-xs whitespace-nowrap flex items-center gap-2"
                                    >
                                        <FiX className="text-sm" /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader />
                                </div>
                            ) : jobs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobs.map((item) => (
                                        <JobCard key={item._id || `${item.title}-${item.createdAt || "job"}`} jobData={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
                                        📭
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Projects Found</h3>
                                    <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
                                        {query 
                                            ? `No projects match "${query}". Try adjusting your search.`
                                            : "No projects available. Check back soon!"}
                                    </p>
                                    {query && (
                                        <button 
                                            onClick={() => setSearchParams({})} 
                                            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold text-sm"
                                        >
                                            🔄 Browse All
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FreelancerHomePage;
