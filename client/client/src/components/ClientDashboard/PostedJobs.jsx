import React, { useEffect, useState } from "react";
import { usePostedJobs } from "../../stores";
import Loader from "../Loader";
import { Link, useNavigate } from "react-router";
import {
    FiMessageSquare,
    FiCheckCircle,
    FiDollarSign,
    FiLoader,
    FiMoreVertical,
    FiBriefcase,
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
    }, [fetchPostedJobs]);

    const calculateCost = (job) => {
        if (job.workedTimeInSec) {
            return ((job.workedTimeInSec / 3600) * job.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2 });
        }
        if (job.payment?.amount) return job.payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
        return "0.00";
    };

    const applyStatusFilter = (job) => {
        if (selectedFilter === "all") return true;
        if (selectedFilter === "posted") return !job?.acceptedFreelancer;
        if (selectedFilter === "ongoing") return ["assigned", "in_progress", "pending_review"].includes(job.status);
        return job.status === selectedFilter;
    };

    const postedOnlyJobs = jobs.filter((job) => !job?.acceptedFreelancer);
    const selectedJobs = jobs.filter((job) => Boolean(job?.acceptedFreelancer));
    const filteredPostedJobs = postedOnlyJobs.filter(applyStatusFilter);
    const filteredSelectedJobs = selectedJobs.filter(applyStatusFilter);

    const statusMap = {
        open: { label: "Recruiting", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        assigned: { label: "Project Start", style: "bg-blue-50 text-blue-700 border-blue-200" },
        in_progress: { label: "In Progress", style: "bg-amber-50 text-amber-700 border-amber-200" },
        pending_review: { label: "Review Required", style: "bg-indigo-50 text-indigo-700 border-indigo-200" },
        completed: { label: "Finalized", style: "bg-slate-50 text-slate-600 border-slate-200" },
        closed: { label: "Closed", style: "bg-slate-100 text-slate-500 border-slate-200" },
        paid: { label: "Settled", style: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 font-['Poppins',_sans-serif]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricTile label="Network Reach" value={postedOnlyJobs.length} sub="Open Postings" />
                <MetricTile label="Active Work" value={selectedJobs.filter((j) => ["assigned", "in_progress"].includes(j.status)).length} sub="Selected Cycles" />
                <MetricTile label="Review Pipeline" value={jobs.filter((j) => j.status === "pending_review").length} sub="Awaiting Approval" color="text-amber-600" />
                <MetricTile label="Portfolio Value" value={`Rs. ${getAvgSpending(jobs)}`} sub="Average Project Cost" />
            </div>

            <div className="overflow-hidden bg-white border rounded shadow-sm border-slate-200">
                <div className="flex flex-col justify-between gap-6 px-6 py-5 border-b border-slate-100 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-slate-900">Active Projects Portfolio</h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lifecycle Management & Oversight</p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded">
                        {["all", "posted", "open", "ongoing", "completed", "closed"].map((filter) => (
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

                <div className="overflow-x-auto">
                    <div className="px-6 pt-5 pb-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Posted Jobs</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Only jobs that are posted and not selected yet.</p>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-y border-slate-100">
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
                            {filteredPostedJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs italic font-semibold text-slate-400">No posted jobs in this filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPostedJobs.map((job) => (
                                    <JobRow
                                        key={job?._id}
                                        job={job}
                                        navigate={navigate}
                                        calculateCost={calculateCost}
                                        statusMap={statusMap}
                                        setQuickChatUser={setQuickChatUser}
                                        processingId={processingId}
                                        setProcessingId={setProcessingId}
                                        fetchPostedJobs={fetchPostedJobs}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="px-6 pb-2 border-t pt-7 border-slate-100">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">Selected Jobs</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Jobs where a freelancer has already been selected.</p>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-y border-slate-100">
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
                            {filteredSelectedJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <FiBriefcase className="mb-2 w-7 h-7 text-slate-200" />
                                            <p className="text-xs italic font-semibold text-slate-400">No selected jobs in this filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSelectedJobs.map((job) => (
                                    <JobRow
                                        key={job?._id}
                                        job={job}
                                        navigate={navigate}
                                        calculateCost={calculateCost}
                                        statusMap={statusMap}
                                        setQuickChatUser={setQuickChatUser}
                                        processingId={processingId}
                                        setProcessingId={setProcessingId}
                                        fetchPostedJobs={fetchPostedJobs}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t bg-slate-50/50 border-slate-100">
                    <button
                        onClick={() => showPostJobModalFn(true)}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded text-[12px] font-bold hover:brightness-95 transition-all shadow-sm"
                    >
                        Post New Job
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
};

const JobRow = ({ job, navigate, calculateCost, statusMap, setQuickChatUser, processingId, setProcessingId, fetchPostedJobs }) => (
    <tr className="transition-colors cursor-pointer group hover:bg-slate-50/60" onClick={() => navigate(`/jobs/${job._id}`)}>
        <td className="px-6 py-4">
            <span className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 border rounded-lg bg-slate-50 border-slate-200 text-slate-500">
                    <FiBriefcase className="w-4 h-4" />
                </span>
                <span className="flex flex-col leading-tight">
                    <span className="text-[12px] font-bold text-slate-900">{job.title || "Untitled Project"}</span>
                    <span className="text-[10px] text-slate-400">{job?.acceptedFreelancer ? "Selected job" : "Posted job"}</span>
                </span>
            </span>
        </td>
        <td className="px-6 py-4">
            <span className="flex flex-col leading-tight">
                <span>
                    {job?.acceptedFreelancer
                        ? `${job?.acceptedFreelancer?.name?.firstName} ${job?.acceptedFreelancer?.name?.lastName}`
                        : "Unassigned"}
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
            <div className="flex flex-col gap-1.5">
                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border w-fit ${statusMap[job.status]?.style || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {statusMap[job.status]?.label || job.status}
                </span>
                {!job?.acceptedFreelancer && (
                    <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border w-fit bg-blue-50 text-blue-700 border-blue-200">
                        Job Posted
                    </span>
                )}
            </div>
        </td>
        <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                {job?.acceptedFreelancer && (
                    <button
                        onClick={() => setQuickChatUser({
                            id: job.acceptedFreelancer?._id,
                            name: `${job.acceptedFreelancer?.name?.firstName} ${job.acceptedFreelancer?.name?.lastName}`,
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
                        {processingId === job._id ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiCheckCircle className="w-3 h-3" />}
                        Approve Work
                    </button>
                ) : job.status === "completed" && !job.payment?.done ? (
                    <Link
                        to={`/jobs/${job._id}/pay`}
                        className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded text-[10px] font-bold hover:brightness-95 transition-all shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FiDollarSign className="w-3 h-3" />
                        Execute Payment
                    </Link>
                ) : ["completed", "paid"].includes(job.status) ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ReviewButton
                            projectId={job._id}
                            onReviewSubmitted={() => {
                                fetchPostedJobs();
                            }}
                        />
                    </div>
                ) : (
                    <FiMoreVertical className="w-4 h-4 cursor-pointer text-slate-300 hover:text-slate-500" />
                )}
            </div>
        </td>
    </tr>
);

const MetricTile = ({ label, value, sub, color = "text-slate-900" }) => (
    <div className="p-4 bg-white border rounded shadow-sm border-slate-200">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-xl font-bold tracking-tight ${color}`}>{value}</h3>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>
    </div>
);

function getAvgSpending(jobs) {
    if (!jobs || jobs.length === 0) return "0.00";
    let total = 0;
    jobs.forEach((element) => (total += element.hourlyRate || 0));
    return (total / jobs.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default PostedJobs;
