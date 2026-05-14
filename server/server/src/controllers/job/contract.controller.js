import mongoose from "mongoose";
import { Job, Milestone } from "../../models/index.js";
import { ApiError, ApiResponse, asyncHandler } from "../../utils/index.js";
import { buildContractPdfLines, buildContractSnapshot, generateContractPdfBuffer } from "../../utils/contract.js";

const getEntityId = (entity) => entity?._id?.toString?.() || entity?.toString?.() || null;

const isProjectMember = (job, userId) =>
    getEntityId(job.postedBy) === userId || getEntityId(job.acceptedFreelancer) === userId;

const loadContractContext = async (jobId, userId) => {
    const job = await Job.findById(jobId)
        .populate({ path: "postedBy", select: "name email avatar" })
        .populate({ path: "acceptedFreelancer", select: "name email avatar" });

    if (!job) {
        throw new ApiError(404, true, "Job not found");
    }

    if (!isProjectMember(job, userId)) {
        throw new ApiError(403, true, "You do not have access to this contract");
    }

    const milestones = await Milestone.find({ projectId: job._id }).sort({ order: 1, createdAt: 1 });
    const snapshot = buildContractSnapshot({ job, milestones });

    return { job, milestones, snapshot };
};

const syncContractState = (job) => {
    const contract = job.contract || {};

    if (!contract.clientApproved || !contract.freelancerApproved) {
        contract.status = "pending_signature";
    } else if (!contract.initialPaymentDone) {
        contract.status = "pending_payment";
    } else {
        contract.status = "active";
        if (!contract.activatedAt) {
            contract.activatedAt = new Date();
        }
    }

    job.contract = contract;
    return job;
};

export const getJobContract = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(jobId)) {
        throw new ApiError(400, true, "Invalid job id");
    }

    const { job, milestones, snapshot } = await loadContractContext(jobId, userId);

    return res.status(200).json(
        new ApiResponse(200, true, true, "Contract fetched successfully", {
            job,
            milestones,
            contract: {
                ...(job.contract?.toObject?.() ?? job.contract ?? {}),
                status: job.contract?.status || "draft",
                totalCost: snapshot.totalCost,
                milestoneBudget: snapshot.milestoneBudget,
                approvedMilestoneBudget: snapshot.approvedMilestoneBudget,
                completedMilestoneBudget: snapshot.completedMilestoneBudget,
                remainingCost: snapshot.remainingCost,
                initialPaymentAmount: snapshot.initialPaymentAmount,
                paymentTerms: snapshot.paymentTerms,
                timelineStart: snapshot.timelineStart,
                timelineEnd: snapshot.timelineEnd,
                milestones: snapshot.milestones,
                downloadUrl: `/jobs/${job._id}/contract/pdf`,
            },
        }),
    );
});

export const approveJobContract = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(jobId)) {
        throw new ApiError(400, true, "Invalid job id");
    }

    const job = await Job.findById(jobId)
        .populate({ path: "postedBy", select: "name email avatar" })
        .populate({ path: "acceptedFreelancer", select: "name email avatar" });

    if (!job) {
        throw new ApiError(404, true, "Job not found");
    }

    if (!isProjectMember(job, userId)) {
        throw new ApiError(403, true, "You do not have access to approve this contract");
    }

    if (!job.acceptedFreelancer) {
        throw new ApiError(400, true, "A freelancer must be selected before approving the contract");
    }

    const milestones = await Milestone.find({ projectId: job._id }).sort({ order: 1, createdAt: 1 });
    const snapshot = buildContractSnapshot({ job, milestones });
    const contract = job.contract || {};

    if (getEntityId(job.postedBy) === userId) {
        contract.clientApproved = true;
        contract.clientApprovedAt = new Date();
    } else {
        contract.freelancerApproved = true;
        contract.freelancerApprovedAt = new Date();
    }

    contract.totalCost = snapshot.totalCost;
    contract.initialPaymentAmount = snapshot.initialPaymentAmount;
    contract.paymentTerms = snapshot.paymentTerms;
    contract.timelineStart = snapshot.timelineStart;
    contract.timelineEnd = snapshot.timelineEnd;
    contract.milestones = snapshot.milestones;

    job.contract = contract;
    syncContractState(job);

    if (job.contract.status === "active" && job.status === "contract_pending" && job.contract.initialPaymentDone) {
        job.status = "assigned";
    }

    await job.save();

    return res.status(200).json(
        new ApiResponse(200, true, true, "Contract approval saved", {
            contract: job.contract,
            job,
        }),
    );
});

export const downloadJobContractPdf = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(jobId)) {
        throw new ApiError(400, true, "Invalid job id");
    }

    const { job, milestones, snapshot } = await loadContractContext(jobId, userId);

    if (!job.acceptedFreelancer) {
        throw new ApiError(400, true, "Contract is not available until a freelancer is selected");
    }

    const pdfBuffer = await generateContractPdfBuffer({
        title: `Contract - ${job.title}`,
        lines: buildContractPdfLines({
            job,
            client: job.postedBy,
            freelancer: job.acceptedFreelancer,
            snapshot,
            milestones,
        }),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contract-${job._id}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
});