import { Job, Milestone, Transaction } from "../../models/index.js";
import { ApiError, ApiResponse, asyncHandler } from "../../utils/index.js";

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role; // 'client' or 'freelancer'

    const now = new Date();

    // 1. Fetch relevant jobs
    const jobsQuery = role === "freelancer" 
        ? { acceptedFreelancer: userId } 
        : { postedBy: userId };
    
    const jobs = await Job.find(jobsQuery).populate("postedBy acceptedFreelancer");

    // 2. Fetch milestones for these jobs
    const jobIds = jobs.map(j => j._id);
    const milestones = await Milestone.find({ projectId: { $in: jobIds } }).sort({ deadline: 1 });

    // 3. Fetch transactions
    const transactionsQuery = role === "freelancer"
        ? { receiver: userId }
        : { initiator: userId };
    const transactions = await Transaction.find(transactionsQuery).sort({ createdAt: -1 });

    // --- Calculations ---

    // Project Counts
    const stats = {
        total: jobs.length,
        active: jobs.filter(j => ["assigned", "in_progress", "contract_pending"].includes(j.status)).length,
        completed: jobs.filter(j => ["completed", "paid"].includes(j.status)).length,
        pending: jobs.filter(j => j.status === "open").length,
        review: jobs.filter(j => j.status === "pending_review").length,
    };

    // Milestone Counts
    const milestoneStats = {
        total: milestones.length,
        completed: milestones.filter(m => ["approved", "completed"].includes(m.status)).length,
        pending: milestones.filter(m => !["approved", "completed"].includes(m.status)).length,
    };

    // Deadline Analysis
    const upcomingDeadlines = milestones.filter(m => 
        m.status !== "approved" && 
        m.deadline && 
        new Date(m.deadline) > now && 
        new Date(m.deadline) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    ).map(m => ({
        title: m.title,
        deadline: m.deadline,
        projectId: m.projectId,
        projectName: jobs.find(j => j._id.toString() === m.projectId.toString())?.title || "Unknown"
    }));

    const overdueDeadlines = milestones.filter(m => 
        m.status !== "approved" && 
        m.deadline && 
        new Date(m.deadline) < now
    ).map(m => ({
        title: m.title,
        deadline: m.deadline,
        projectId: m.projectId,
        projectName: jobs.find(j => j._id.toString() === m.projectId.toString())?.title || "Unknown"
    }));

    // Financial Analysis
    const totalFinancial = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const projectFinancials = jobs.map(job => {
        const projectTxns = transactions.filter(t => t.jobId?.toString() === job._id.toString() || t.remarks?.includes(job.title));
        const amount = projectTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Progress calculation
        const projectMilestones = milestones.filter(m => m.projectId.toString() === job._id.toString());
        const completedM = projectMilestones.filter(m => ["approved", "completed"].includes(m.status)).length;
        const progress = projectMilestones.length > 0 ? Math.round((completedM / projectMilestones.length) * 100) : (job.status === "completed" || job.status === "paid" ? 100 : 0);

        return {
            id: job._id,
            title: job.title,
            status: job.status,
            amount,
            progress,
            milestonesTotal: projectMilestones.length,
            milestonesCompleted: completedM
        };
    }).sort((a, b) => b.progress - a.progress || b.amount - a.amount);

    // Performance Metrics
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    // On-time check: For completed milestones, was the update/approval before deadline?
    // Since we don't track 'completionDate' explicitly in Milestone model (it uses timestamps), 
    // we use updatedat as proxy for when it was marked completed.
    const completedMilestones = milestones.filter(m => ["approved", "completed"].includes(m.status));
    const onTimeMilestones = completedMilestones.filter(m => !m.deadline || new Date(m.updatedAt) <= new Date(m.deadline));
    const onTimePercentage = completedMilestones.length > 0 ? Math.round((onTimeMilestones.length / completedMilestones.length) * 100) : 100;
    
    const delayRate = 100 - onTimePercentage;

    // Activity Log
    // We can use recently updated milestones and jobs
    const recentActivity = [
        ...milestones.map(m => ({ type: "milestone", action: m.status, target: m.title, date: m.updatedAt })),
        ...jobs.map(j => ({ type: "project", action: j.status, target: j.title, date: j.updatedAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const analytics = {
        stats,
        milestoneStats,
        deadlines: {
            upcoming: upcomingDeadlines,
            overdue: overdueDeadlines,
            onTimePercentage,
            delayRate
        },
        financials: {
            total: totalFinancial,
            breakdown: projectFinancials
        },
        performance: {
            completionRate,
            onTimePercentage,
            delayRate
        },
        recentActivity,
        topProjects: projectFinancials.slice(0, 5)
    };

    return res.status(200).json(
        new ApiResponse(200, true, true, "Analytics fetched successfully", analytics)
    );
});
