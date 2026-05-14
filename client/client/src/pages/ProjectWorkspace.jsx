import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../utils/api";
import { useAuth } from "../stores";
import { Loader, ReviewsDisplay } from "../components";
import toast from "react-hot-toast";
import {
    FiChevronRight,
    FiBriefcase,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiArrowRight,
    FiAlertCircle,
    FiZap,
    FiEdit2,
    FiX,
    FiTrendingUp,
} from "react-icons/fi";
import capitalize from "../utils/capitalize";

function ProjectWorkspace() {
    const navigate = useNavigate();
    const { userData } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("ongoing"); // ongoing, completed, all
    const [projectMilestones, setProjectMilestones] = useState({}); // Cache milestones
    const [expandedProject, setExpandedProject] = useState(null);
    const [milestonesLoading, setMilestonesLoading] = useState({});
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        description: "",
        amount: "",
        deadline: "",
        order: 0,
    });
    const [editSubmitting, setEditSubmitting] = useState(false);

    const isClient = userData?.role === "client";
    const isFreelancer = userData?.role === "freelancer";

    // Fetch projects based on role
    const fetchProjects = async () => {
        try {
            setLoading(true);
            let response;
            if (isClient) {
                response = await api.get("/jobs/get-jobs-posted-by-current-user");
            } else {
                response = await api.get("/jobs/freelancer-jobs");
            }
            const data = Array.isArray(response.data?.data) ? response.data.data : [];
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            toast.error("Failed to load projects");
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch milestones for a project
    const fetchMilestones = async (projectId) => {
        if (projectMilestones[projectId]) return; // Already cached

        try {
            setMilestonesLoading((prev) => ({ ...prev, [projectId]: true }));
            const response = await api.get(`/milestones/project/${projectId}`);
            setProjectMilestones((prev) => ({
                ...prev,
                [projectId]: response.data.data,
            }));
        } catch (error) {
            console.error("Failed to fetch milestones:", error);
            toast.error("Failed to load milestones");
        } finally {
            setMilestonesLoading((prev) => ({ ...prev, [projectId]: false }));
        }
    };

    useEffect(() => {
        fetchProjects();
        // Reset tab for freelancers (they don't see "posted" tab)
        if (isFreelancer && selectedTab === "posted") {
            setSelectedTab("ongoing");
        }
    }, []);

    // Filter projects based on tab
    const filteredProjects = projects.filter((project) => {
        if (selectedTab === "posted") {
            return !project?.acceptedFreelancer && project.status === "open";
        } else if (selectedTab === "ongoing") {
            // Show projects that are either in progress status OR have an accepted freelancer (excluding completed/closed)
            return (["assigned", "in_progress", "pending_review"].includes(project.status) || 
                    (project?.acceptedFreelancer && !["open", "completed", "paid", "closed"].includes(project.status)));
        } else if (selectedTab === "completed") {
            return ["completed", "paid"].includes(project.status);
        }
        return true;
    });

    // Get milestone stats for a project
    const getMilestoneStats = (projectId) => {
        const milestones = projectMilestones[projectId] || [];
        const completed = milestones.filter(
            (m) => m.status === "approved"
        ).length;
        const total = milestones.length;
        return { completed, total };
    };

    // Start editing a milestone
    const startEditMilestone = (milestone) => {
        setEditingMilestone(milestone);
        setEditFormData({
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            deadline: new Date(milestone.deadline).toISOString().split("T")[0],
            order: milestone.order || 0,
        });
        setShowEditModal(true);
    };

    // Handle edit form input change
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Update milestone
    const handleUpdateMilestone = async (e) => {
        e.preventDefault();
        if (!editingMilestone) return;

        if (!editFormData.title || !editFormData.description || !editFormData.amount || !editFormData.deadline) {
            toast.error("Please fill all required fields");
            return;
        }

        setEditSubmitting(true);
        try {
            await api.patch(`/milestones/${editingMilestone._id}`, {
                title: editFormData.title,
                description: editFormData.description,
                amount: parseFloat(editFormData.amount),
                deadline: editFormData.deadline,
                order: editFormData.order,
            });

            toast.success("Milestone updated successfully");
            
            // Refresh the milestones cache for this project
            const projectId = editingMilestone.projectId || Object.keys(projectMilestones).find(
                (key) => projectMilestones[key]?.some((m) => m._id === editingMilestone._id)
            );
            
            if (projectId) {
                await fetchMilestones(projectId);
                // Force refresh by clearing cache  
                setProjectMilestones((prev) => {
                    const updated = { ...prev };
                    delete updated[projectId];
                    return updated;
                });
                // Re-fetch to get latest data
                const response = await api.get(`/milestones/project/${projectId}`);
                setProjectMilestones((prev) => ({
                    ...prev,
                    [projectId]: response.data.data,
                }));
            }

            setShowEditModal(false);
            setEditingMilestone(null);
            setEditFormData({
                title: "",
                description: "",
                amount: "",
                deadline: "",
                order: 0,
            });
        } catch (error) {
            console.error("Failed to update milestone:", error);
            toast.error(error.response?.data?.message || "Failed to update milestone");
        } finally {
            setEditSubmitting(false);
        }
    };

    // Status styles
    const statusStyles = {
        open: "bg-green-100 text-green-800",
        assigned: "bg-blue-100 text-blue-800",
        in_progress: "bg-purple-100 text-purple-800",
        pending_review: "bg-orange-100 text-orange-800",
        completed: "bg-emerald-100 text-emerald-800",
        closed: "bg-gray-100 text-gray-800",
        paid: "bg-emerald-200 text-emerald-900",
    };

    // Milestone status colors
    const milestoneStatusStyles = {
        pending: "bg-gray-50 border-gray-200",
        in_progress: "bg-blue-50 border-blue-200",
        completed: "bg-orange-50 border-orange-200",
        approved: "bg-green-50 border-green-200",
        rejected: "bg-red-50 border-red-200",
    };

    const milestoneStatusDotColor = {
        pending: "bg-gray-400",
        in_progress: "bg-blue-400",
        completed: "bg-orange-400",
        approved: "bg-green-500",
        rejected: "bg-red-500",
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Projects Workspace
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage your projects and milestones in one place
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                                {filteredProjects.length}
                            </p>
                            <p className="text-sm text-gray-600">
                                {selectedTab === "posted"
                                    ? "Posted Projects"
                                    : selectedTab === "ongoing"
                                    ? "In Progress Projects"
                                    : selectedTab === "completed"
                                    ? "Completed Projects"
                                    : "Total Projects"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-[104px] z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        {[
                            ...(isClient ? [{ id: "posted", label: "Posted", count: projects.filter((p) => !p.acceptedFreelancer && p.status === "open").length }] : []),
                            { id: "ongoing", label: "In Progress", count: projects.filter((p) => ["assigned", "in_progress", "pending_review"].includes(p.status) || (p?.acceptedFreelancer && !["open", "completed", "paid", "closed"].includes(p.status))).length },
                            { id: "completed", label: "Completed", count: projects.filter((p) => ["completed", "paid"].includes(p.status)).length },
                            { id: "all", label: "All Projects", count: projects.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                                    selectedTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {tab.label}
                                <span className="ml-2 inline-block bg-gray-200 text-gray-700 rounded-full w-6 h-6 text-xs font-semibold">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-16">
                        <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No projects yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isClient
                                ? selectedTab === "posted"
                                    ? "Post a new project to get started"
                                    : selectedTab === "ongoing"
                                    ? "No projects in progress"
                                    : "No completed projects yet"
                                : selectedTab === "posted"
                                ? "No new projects available"
                                : selectedTab === "ongoing"
                                ? "Apply for projects to begin"
                                : "No completed projects yet"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredProjects.map((project) => {
                            const stats = getMilestoneStats(project._id);
                            const milestones = projectMilestones[project._id] || [];
                            const isExpanded = expandedProject === project._id;
                            const isLoading = milestonesLoading[project._id];

                            return (
                                <div
                                    key={project._id}
                                    className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 overflow-hidden group cursor-pointer transform hover:scale-105 ${
                                        "border-gray-200 hover:border-primary/50"
                                    }`}
                                >
                                    {/* Card Header with Gradient Background */}
                                    <div className={`p-6 border-b transition-colors ${
                                        "border-gray-100"
                                    }`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3 mb-3">
                                                    {/* Project Status Icon */}
                                                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                                                        ["completed", "finished", "paid"].includes(project.status)
                                                            ? "bg-emerald-50 border border-emerald-200"
                                                            : ["cancelled", "rejected"].includes(project.status)
                                                            ? "bg-red-50 border border-red-200"
                                                            : "bg-blue-50 border border-blue-200"
                                                    }`}>
                                                        {["completed", "finished", "paid"].includes(project.status) ? (
                                                            <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                                                        ) : ["cancelled", "rejected"].includes(project.status) ? (
                                                            <FiAlertCircle className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <FiTrendingUp className="w-5 h-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                                            {project.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-snug">
                                                            {project.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                                                {/* Status Badge with Label */}
                                                <div className="flex flex-col gap-1">
                                                    {["completed", "finished", "paid"].includes(project.status) ? (
                                                        <span className="px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm inline-flex items-center gap-1">
                                                            <FiCheckCircle className="w-3 h-3" />
                                                            Completed
                                                        </span>
                                                    ) : ["cancelled", "rejected"].includes(project.status) ? (
                                                        <span className="px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-300 shadow-sm inline-flex items-center gap-1">
                                                            <FiAlertCircle className="w-3 h-3" />
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-300 shadow-sm inline-flex items-center gap-1">
                                                            <FiClock className="w-3 h-3" />
                                                            In Progress
                                                        </span>
                                                    )}
                                                    
                                                    {!project?.acceptedFreelancer && (
                                                        <span className="px-3 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-300 shadow-sm inline-flex items-center gap-1">
                                                            <FiBriefcase className="w-3 h-3" />
                                                            Job Posted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Project Meta */}
                                        <div className="grid grid-cols-1 gap-3 mt-5 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                                    <FiUser className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    {isClient
                                                        ? `${project.acceptedFreelancer
                                                            ? `${capitalize(
                                                                project.acceptedFreelancer.firstName ||
                                                                (project.acceptedFreelancer.name?.firstName || 'Unknown')
                                                            )}`
                                                            : "No Freelancer"}`
                                                        : `${capitalize(
                                                            project.postedBy.firstName ||
                                                            (project.postedBy.name?.firstName || 'Unknown')
                                                        )}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                                    <FiBriefcase className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    NRS {project.hourlyRate?.toLocaleString() || '0'}/hr
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                                    <FiClock className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className="text-gray-700 font-medium text-sm">
                                                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Milestone Summary Section */}
                                    {project.acceptedFreelancer && (
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                                            <div
                                                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-3 -mx-3 rounded-lg transition"
                                                onClick={() => {
                                                    if (isExpanded) {
                                                        setExpandedProject(null);
                                                    } else {
                                                        setExpandedProject(
                                                            project._id
                                                        );
                                                        fetchMilestones(
                                                            project._id
                                                        );
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                                                        <FiZap className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">
                                                            Milestones
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                            {stats.completed} of{" "}
                                                            {stats.total}{" "}
                                                            completed
                                                        </p>
                                                    </div>
                                                </div>
                                                <FiChevronRight
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                                        isExpanded
                                                            ? "rotate-90"
                                                            : ""
                                                    }`}
                                                />
                                            </div>

                                            {/* Progress Bar */}
                                            {stats.total > 0 && (
                                                <div className="mt-3 mx-3">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all"
                                                            style={{
                                                                width: `${
                                                                    (stats.completed /
                                                                        stats.total) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {Math.round(
                                                            (stats.completed /
                                                                stats.total) *
                                                                100
                                                        )}
                                                        % Complete
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Expanded Milestones List */}
                                    {isExpanded && project.acceptedFreelancer && (
                                        <div className="px-6 py-4 bg-white border-b border-gray-100">
                                            {isLoading ? (
                                                <div className="py-4 text-center">
                                                    <div className="inline-block">
                                                        <div className="animate-spin">
                                                            <FiClock className="w-5 h-5 text-primary" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : milestones.length === 0 ? (
                                                <p className="text-center text-gray-500 text-sm py-4">
                                                    No milestones created yet
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {milestones
                                                        .slice(0, 5)
                                                        .map(
                                                            (milestone, idx) => (
                                                                <div
                                                                    key={
                                                                        milestone._id
                                                                    }
                                                                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                                                                        milestoneStatusStyles[
                                                                            milestone
                                                                                .status
                                                                        ]
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                                                                            milestoneStatusDotColor[
                                                                                milestone
                                                                                    .status
                                                                            ]
                                                                        }`}
                                                                    ></div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-gray-900 text-sm line-clamp-1">
                                                                            {
                                                                                milestone.title
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-600 mt-1 font-medium">
                                                                            <span className="text-emerald-700 font-bold">NRS {milestone.amount.toLocaleString()}</span>
                                                                            <span className="mx-2 text-gray-400">•</span>
                                                                            <span className="text-gray-700">{milestone.status
                                                                                .replace(
                                                                                    "_",
                                                                                    " "
                                                                                )
                                                                                .charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase() +
                                                                                milestone.status
                                                                                    .replace(
                                                                                        "_",
                                                                                        " "
                                                                                    )
                                                                                    .slice(
                                                                                        1
                                                                                    )}</span>
                                                                        </p>
                                                                    </div>
                                                                    {isFreelancer && (
                                                                        <button
                                                                            onClick={() =>
                                                                                startEditMilestone(milestone)
                                                                            }
                                                                            className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                                                                            title="Edit milestone"
                                                                        >
                                                                            <FiEdit2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    {milestones.length > 5 && (
                                                        <p className="text-xs text-gray-600 pt-2 font-medium">
                                                            +{milestones.length - 5}{" "}
                                                            more milestones
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Card Footer/Action */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                            <div className="p-1.5 rounded bg-white border border-gray-200">
                                                <FiClock className="w-3.5 h-3.5 text-gray-500" />
                                            </div>
                                            <span>
                                                {new Date(
                                                    project.createdAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                navigate(`/jobs/${project._id}`)
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all group/btn"
                                        >
                                            View Details
                                            <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        )}  
                    </main>
            {showEditModal && editingMilestone && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Edit Milestone</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingMilestone(null);
                                    setEditFormData({
                                        title: "",
                                        description: "",
                                        amount: "",
                                        deadline: "",
                                        order: 0,
                                    });
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateMilestone} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={editFormData.title}
                                        onChange={handleEditInputChange}
                                        placeholder="e.g., Design Phase"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount (NRS) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editFormData.amount}
                                        onChange={handleEditInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleEditInputChange}
                                    placeholder="Describe what needs to be done for this milestone..."
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deadline <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={editFormData.deadline}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Order (sequence)
                                    </label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={editFormData.order}
                                        onChange={handleEditInputChange}
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Current Status Info */}
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-1">Current Status</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {editingMilestone.status.replace("_", " ").charAt(0).toUpperCase() +
                                        editingMilestone.status.replace("_", " ").slice(1)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Created: {new Date(editingMilestone.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={editSubmitting}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-400 transition font-medium"
                                >
                                    {editSubmitting ? "Updating..." : "Update Milestone"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingMilestone(null);
                                        setEditFormData({
                                            title: "",
                                            description: "",
                                            amount: "",
                                            deadline: "",
                                            order: 0,
                                        });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectWorkspace;
