import mongoose from "mongoose";
import { ApiError, ApiResponse, asyncHandler, sendNotification } from "../../utils/index.js";
import { Job } from "../../models/index.js";

export const respondInvitation = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const { status, terms } = req.body; // status: 'accepted' or 'declined'
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(jobId)) {
        throw new ApiError(400, true, "Invalid job id");
    }

    if (!["accepted", "declined"].includes(status)) {
        throw new ApiError(400, true, "Invalid status. Must be 'accepted' or 'declined'");
    }

    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(404, true, "Job not found");
    }

    const invitationIndex = job.invitations.findIndex(
        (inv) => inv.freelancer?.toString() === userId && inv.status === "pending"
    );

    if (invitationIndex === -1) {
        throw new ApiError(404, true, "No pending invitation found for this freelancer");
    }

    job.invitations[invitationIndex].status = status;
    if (terms) {
        job.invitations[invitationIndex].terms = terms;
    }

    if (status === "accepted") {
        // When accepted, we might want to automatically set the acceptedFreelancer if the job is open
        // Or just mark it as contract_pending for negotiation
        if (job.status === "open") {
            job.status = "contract_pending";
            job.acceptedFreelancer = userId;
            
            // If terms were provided, we could store them in the contract
            if (terms) {
                job.contract = job.contract || {};
                job.contract.paymentTerms = terms;
            }
        }
    }

    await job.save();

    await sendNotification({
        receiverId: job.postedBy,
        senderId: userId,
        projectId: job._id,
        title: `Invitation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Freelancer has ${status} your project invitation for \"${job.title}\".`,
        type: "job_update",
        link: `/jobs/${job._id}`,
    });

    return res.status(200).json(
        new ApiResponse(200, true, true, `Invitation ${status} successfully`, {
            jobId: job._id,
            status,
        }),
    );
});
