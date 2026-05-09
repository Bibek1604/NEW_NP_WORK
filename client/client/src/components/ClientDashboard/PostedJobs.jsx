import React, { useEffect, useState } from "react";
import { usePostedJobs } from "../../stores";
import Loader from "../Loader";
import { Link, useNavigate } from "react-router";
import { 
    FiMessageSquare, 
    FiCheckCircle, 
    FiDollarSign, 
    FiLoader, 
    FiBriefcase, 
    FiPlus, 
    FiMoreVertical,
} from "react-icons/fi";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { QuickChat, ReviewButton } from "../../components";

const PostedJobs = ({ showPostJobModalFn }) => {
    const navigate = useNavigate();
    const jobs = usePostedJobs((state) => state.jobs);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [quickChatUser, setQuickChatUser] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchPostedJobs = usePostedJobs((state) => state.fetchPostedJobs);
    const loading = usePostedJobs((state) => state.loading);
    
    useEffect(() => {
        fetchPostedJobs();
    }, []);

    const calculateCost = (job) => {
        if (job.workedTimeInSec) {
            return ((job.workedTimeInSec / 3600) * job.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2 });
        }
        if (job.payment?.amount) return job.payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
        return "0.00";
    };

    const filteredJobs = jobs.filter((job) =>
        selectedFilter === "all" ? true : 
        selectedFilter === "ongoing" ? ["assigned", "in_progress", "pending_review"].includes(job.status) :
        job.status === selectedFilter,
    );

    const statusMap = {
        open: { label: "Recruiting", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        assigned: { label: "Project Start", style: "bg-blue-50 text-blue-700 border-blue-200" },
        in_progress: { label: "In Progress", style: "bg-amber-50 text-amber-700 border-amber-200" },
        pending_review: { label: "Review Required", style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        completed: { label: "Finalized", style: "bg-slate-50 text-slate-600 border-slate-200" },
        closed: { label: "Archived", style: "bg-slate-100 text-slate-500 border-slate-200" },
        paid: { label: "Settled", style: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 font-['Poppins',_sans-serif]">
            {/* Project Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricTile label="Network Reach" value={jobs.length} sub="Total Postings" />
                <MetricTile label="Active Work" value={jobs.filter(j => ["assigned", "in_progress"].includes(j.status)).length} sub="Current Cycles" />
                <MetricTile label="Review Pipeline" value={jobs.filter(j => j.status === "pending_review").length} sub="Awaiting Approval" color="text-amber-600" />
                <MetricTile label="Portfolio Value" value={`Rs. ${getAvgSpending(jobs)}`} sub="Average Project Cost" />
            </div>

            <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
                {/* Dashboard Controls */}
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Active Projects Portfolio</h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lifecycle Management & Oversight</p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded">
                        {["all", "open", "ongoing", "completed"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-4 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                    selectedFilter === filter
                                        ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Projects Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stakeholder</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate (NRS)</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <FiBriefcase className="w-8 h-8 text-slate-200 mb-3" />
                                            <p className="text-xs font-semibold text-slate-400 italic">No project entities found for the current selection.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr 
                                        key={job?._id}
                                        onClick={() => navigate(`/jobs/${job._id}`)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">UID: {job._id.slice(-6).toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-semibold text-slate-600 flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold">
                                                    {job?.acceptedFreelancer?.name?.firstName?.charAt(0) || "U"}
                                                </div>
                                                <span className="flex flex-col leading-tight">
                                                    <span>
                                                        {job?.acceptedFreelancer 
                                                            ? `${job?.acceptedFreelancer?.name?.firstName} ${job?.acceptedFreelancer?.name?.lastName}`
                                                            : "Unassigned"}
                                                    </span>
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-bold text-slate-900">Rs. {job.hourlyRate}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[12px] font-bold text-slate-700">Rs. {calculateCost(job)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusMap[job.status]?.style || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                                {statusMap[job.status]?.label || job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                {job?.acceptedFreelancer && (
                                                    <button 
                                                        onClick={() => setQuickChatUser({ 
                                                            id: job.acceptedFreelancer?._id, 
                                                            name: `${job.acceptedFreelancer?.name?.firstName} ${job.acceptedFreelancer?.name?.lastName}` 
                                                        })}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded transition-colors"
                                                        title="Launch Communication"
                                                    >
                                                        <FiMessageSquare className="w-4 h-4" />
                                                    </button>
                                                )}
                                                
                                                {job.status === "pending_review" ? (
                                                    <button
                                                        disabled={processingId === job._id}
                                                        onClick={async () => {
                                                            setProcessingId(job._id);
                                                            try {
                                                                await api.patch(`/jobs/${job._id}/client-review`, { status: "completed" });
                                                                toast.success("Project deliverables approved");
                                                                fetchPostedJobs();
                                                            } catch (err) {
                                                                toast.error("Process execution failed");
                                                            } finally {
                                                                setProcessingId(null);
                                                            }
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:brightness-95 transition-all shadow-sm"
                                                    >
                                                        {processingId === job._id ? <FiLoader className="animate-spin w-3 h-3" /> : <FiCheckCircle className="w-3 h-3" />}
                                                        Approve Work
                                                    </button>
                                                ) : job.status === "completed" && !job.payment?.done ? (
                                                    <Link
                                                        to={`/jobs/${job._id}/pay`}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded text-[10px] font-bold hover:brightness-95 transition-all shadow-sm"
                                                    >
                                                        <FiDollarSign className="w-3 h-3" />
                                                        Execute Payment
                                                    </Link>
                                                ) : ["completed", "paid"].includes(job.status) ? (
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <ReviewButton
                                                            projectId={job._id}
                                                            onReviewSubmitted={() => {
                                                                fetchPostedJobs();
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <FiMoreVertical className="text-slate-300 hover:text-slate-500 cursor-pointer w-4 h-4" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Grid Management Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <button
                        onClick={() => showPostJobModalFn(true)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded text-[12px] font-bold hover:brightness-95 transition-all shadow-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        Initiate New Project Posting
                    </button>
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
}

const MetricTile = ({ label, value, sub, color = "text-slate-900" }) => (
    <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-xl font-bold tracking-tight ${color}`}>{value}</h3>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>
    </div>
);

function getAvgSpending(jobs) {
    if (!jobs || jobs.length === 0) return "0.00";
    let total = 0;
    jobs.forEach((element) => total += (element.hourlyRate || 0));
    return (total / jobs.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default PostedJobs;
