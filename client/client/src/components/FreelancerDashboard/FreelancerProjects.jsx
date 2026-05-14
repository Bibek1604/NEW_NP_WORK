import React, { useEffect, useState } from "react";
import { useFreelancerJobs } from "../../stores";
import { Loader, NullLoader, QuickChat, ReviewButton } from "../../components";
import { Link } from "react-router";
import { FiMessageSquare, FiPlay, FiLoader, FiCheckCircle } from "react-icons/fi";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { useAuth } from "../../stores";

const FreelancerProjects = () => {
    const { jobs, loading, fetchFreelancerJobs } = useFreelancerJobs();
    const { userData } = useAuth();
    const [quickChatUser, setQuickChatUser] = useState(null);
    const [ticker, setTicker] = useState(0);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    useEffect(() => {
        fetchFreelancerJobs();
        
        // Timer to update live calculations for in-progress jobs
        const interval = setInterval(() => {
            setTicker(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    const calculateEarned = (job) => {
        // If finally approved and stored
        if (job.workedTimeInSec) {
            return ((job.workedTimeInSec / 3600) * job.hourlyRate).toFixed(2);
        }
        
        // If finished work but not yet approved (pending_review)
        if (job.startTime && job.endTime) {
            const diff = (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000;
            return ((diff / 3600) * job.hourlyRate).toFixed(2);
        }

        // If currently working (in_progress)
        if (job.status === "in_progress" && job.startTime) {
            const diff = (Date.now() - new Date(job.startTime).getTime()) / 1000;
            return ((diff / 3600) * job.hourlyRate).toFixed(2);
        }
        
        return "0.00";
    };

    const handleUpdateStatus = async (e, jobId, newStatus) => {
        e.preventDefault();
        e.stopPropagation();
        setUpdatingStatus(jobId);
        try {
            await api.patch(`/jobs/${jobId}/status-update`, { status: newStatus });
            toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
            fetchFreelancerJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const isSelectedForCurrentFreelancer = (job) => String(job?.acceptedFreelancer?._id || "") === String(userData?._id || "");
    const selectedProjects = (jobs || []).filter((job) => isSelectedForCurrentFreelancer(job));
    const appliedJobs = (jobs || []).filter((job) => !isSelectedForCurrentFreelancer(job));

    const statusStyles = {
        open: "bg-green-100 text-green-800",
        contract_pending: "bg-amber-100 text-amber-800",
        assigned: "bg-purple-100 text-purple-800",
        in_progress: "bg-blue-100 text-blue-800",
        pending_review: "bg-orange-100 text-orange-800",
        completed: "bg-teal-100 text-teal-800",
        closed: "bg-gray-100 text-gray-800",
        paid: "bg-emerald-100 text-emerald-800",
    };

    const getStatusLabel = (status) => {
        if (status === "contract_pending") return "contract pending";
        return status.replace("_", " ");
    };

    if (loading && jobs.length === 0) return <Loader />;

    return (
        <div className="space-y-8">
            {/* Quick Stats Grid for Freelancer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Ongoing Projects", value: selectedProjects.filter(j => ["contract_pending", "assigned", "in_progress", "pending_review"].includes(j.status)).length, icon: <FiLoader className="w-5 h-5" />, color: "blue" },
                    { label: "Completed Projects", value: selectedProjects.filter(j => ["completed", "paid"].includes(j.status)).length, icon: <FiCheckCircle className="w-5 h-5" />, color: "emerald" },
                    { label: "Applied Jobs", value: appliedJobs.length, icon: <FiMessageSquare className="w-5 h-5" />, color: "amber" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                                {stat.icon}
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-wider">{stat.label}</h3>
                                <p className="text-2xl font-black mt-0.5 text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Project Workspace</h2>
                        <p className="text-sm text-gray-400 mt-1">Selected projects and jobs you have applied to.</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Selected Projects</h3>
                            <div className="grid gap-6">
                                {selectedProjects.length === 0 ? (
                                    <NullLoader message="No selected projects yet." />
                                ) : (
                                    selectedProjects.map((job) => (
                                        <ProjectCard
                                            key={job._id}
                                            job={job}
                                            isOngoing={["contract_pending", "assigned", "in_progress", "pending_review"].includes(job.status)}
                                            statusStyles={statusStyles}
                                            getStatusLabel={getStatusLabel}
                                            calculateEarned={calculateEarned}
                                            handleUpdateStatus={handleUpdateStatus}
                                            updatingStatus={updatingStatus}
                                            setQuickChatUser={setQuickChatUser}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Applied Jobs</h3>
                            <div className="grid gap-6">
                                {appliedJobs.length === 0 ? (
                                    <NullLoader message="No applied jobs yet." />
                                ) : (
                                    appliedJobs.map((job) => (
                                        <ProjectCard
                                            key={job._id}
                                            job={job}
                                            isOngoing={["contract_pending", "assigned", "in_progress", "pending_review"].includes(job.status)}
                                            statusStyles={statusStyles}
                                            getStatusLabel={getStatusLabel}
                                            calculateEarned={calculateEarned}
                                            handleUpdateStatus={handleUpdateStatus}
                                            updatingStatus={updatingStatus}
                                            setQuickChatUser={setQuickChatUser}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {quickChatUser && (
                <QuickChat 
                    recipientId={quickChatUser.id} 
                    recipientName={quickChatUser.name} 
                    onClose={() => setQuickChatUser(null)} 
                />
            )}
        </div>
    );
};

const ProjectCard = ({ job, isOngoing, statusStyles, getStatusLabel, calculateEarned, handleUpdateStatus, updatingStatus, setQuickChatUser }) => {
    return (
        <div className={`group p-6 rounded-2xl border transition-all duration-300 ${isOngoing ? 'bg-primary/[0.02] border-primary/10 shadow-sm hover:shadow-md' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
            <div className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Info Section */}
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyles[job.status]}`}>
                            {getStatusLabel(job.status)}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                            {job.title}
                        </h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black italic">
                                {job.postedBy?.name?.firstName?.charAt(0)}
                            </span>
                            <span>Client: <span className="text-gray-900 font-medium">{job.postedBy?.name?.firstName} {job.postedBy?.name?.lastName}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>


                </div>

                {/* Actions & Metrics */}
                <div className="flex flex-col sm:flex-row items-center gap-8 border-t lg:border-t-0 pt-6 lg:pt-0">
                    <div className="flex gap-8">
                        <div className="text-left md:text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate</div>
                            <div className="text-lg font-black text-gray-900 leading-none">Rs. {job.hourlyRate}<span className="text-xs text-gray-400">/hr</span></div>
                        </div>
                        <div className="text-left md:text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Earned</div>
                            <div className="text-lg font-black text-emerald-600 leading-none">Rs. {calculateEarned(job)}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuickChatUser({ 
                                    id: job.postedBy?._id, 
                                    name: `${job.postedBy?.name?.firstName} ${job.postedBy?.name?.lastName}` 
                                });
                            }}
                            className="flex-1 sm:flex-none h-11 w-11 flex items-center justify-center bg-white border border-gray-100 text-gray-600 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                            title="Message Client"
                        >
                            <FiMessageSquare className="w-5 h-5" />
                        </button>

                        {/* Status Controls */}
                        {isOngoing && ["assigned", "in_progress"].includes(job.status) && (
                            <div className="flex items-center bg-gray-50 border border-gray-100 p-1 rounded-xl shadow-inner overflow-hidden">
                                <button
                                    disabled={job.status !== "assigned" || updatingStatus === job._id}
                                    onClick={(e) => handleUpdateStatus(e, job._id, "in_progress")}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        job.status === "in_progress"
                                            ? "bg-blue-600 text-white shadow-md"
                                            : job.status === "assigned"
                                            ? "bg-white text-gray-600 hover:text-primary hover:bg-white/50"
                                            : "text-gray-300 pointer-events-none"
                                    }`}
                                >
                                    {job.status === "assigned" && updatingStatus === job._id ? <FiLoader className="animate-spin" /> : <FiPlay className="w-3 h-3" />}
                                    {job.status === "in_progress" ? "Working" : "Start"}
                                </button>
                                <button
                                    disabled={job.status !== "in_progress" || updatingStatus === job._id}
                                    onClick={(e) => handleUpdateStatus(e, job._id, "pending_review")}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        job.status === "in_progress"
                                            ? "bg-white text-gray-600 hover:text-teal-600 hover:bg-white/50 shadow-sm"
                                            : "text-gray-300 pointer-events-none"
                                    }`}
                                >
                                    {updatingStatus === job._id && job.status === "in_progress" ? <FiLoader className="animate-spin" /> : <FiCheckCircle className="w-3 h-3" />}
                                    Submit
                                </button>
                            </div>
                        )}

                        {job.status === "contract_pending" && (
                            <Link
                                to={`/jobs/${job._id}`}
                                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
                            >
                                Review Contract
                            </Link>
                        )}
                        
                        {!isOngoing && job.status !== "completed" && (
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic px-4">
                                Contract {getStatusLabel(job.status)}
                            </span>
                        )}
                        
                        {job.status === "completed" && (
                            <div className="flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                    <FiCheckCircle />
                                    Fully Settled
                                </div>
                                <ReviewButton
                                    projectId={job._id}
                                    onReviewSubmitted={() => {
                                        // Optional: refresh jobs
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreelancerProjects;
