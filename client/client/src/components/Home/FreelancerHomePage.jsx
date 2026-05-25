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
        <div className="min-h-screen pt-20 bg-white">
            <main className="p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="mb-6 space-y-2">
                        <h1 className="text-3xl font-bold md:text-4xl text-slate-900">
                            🚀 Recommended Projects
                        </h1>
                        <p className="text-sm text-slate-600">Projects ranked by how closely they match your profile, tags, and rate.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Available Projects Card */}
                        <div className="p-5 transition-all border rounded-lg bg-emerald-50/50 border-emerald-200/30 hover:shadow-md hover:border-emerald-200/60 group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30">
                                    <FiBriefcase className="text-lg text-emerald-600" />
                                </div>
                                <span className="text-2xl opacity-20">📱</span>
                            </div>
                            <h3 className="mb-1 text-xs font-semibold text-slate-700">Available Projects</h3>
                            <p className="text-3xl font-bold text-slate-900">{jobs.length}</p>
                            <p className="mt-1 text-xs text-slate-500">Updated live</p>
                        </div>
                    </div>

                    {/* Main Content - Marketplace Grid */}
                    <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-slate-200 bg-slate-50">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div>
                                    {query ? (
                                        <div>
                                            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                                🔍 Search Results
                                            </h2>
                                            <p className="mt-1 text-xs text-slate-600">Found <span className="font-semibold text-primary">{jobs.length}</span> projects matching "<span className="font-semibold">{query}</span>"</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                                📚 Recent Projects
                                            </h2>
                                            <div className="flex gap-2 mt-3">
                 
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {query && (
                                    <button 
                                        onClick={() => setSearchParams({})}
                                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 transition bg-red-100 rounded-lg hover:bg-red-200 whitespace-nowrap"
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
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {jobs.map((item) => (
                                        <JobCard key={item._id || `${item.title}-${item.createdAt || "job"}`} jobData={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-2xl rounded-lg bg-slate-100">
                                        📭
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-slate-900">No Projects Found</h3>
                                    <p className="max-w-sm mx-auto mb-6 text-sm text-slate-600">
                                        {query 
                                            ? `No projects match "${query}". Try adjusting your search.`
                                            : "No projects available. Check back soon!"}
                                    </p>
                                    {query && (
                                        <button 
                                            onClick={() => setSearchParams({})} 
                                            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white transition rounded-lg bg-primary hover:bg-primary/90"
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
