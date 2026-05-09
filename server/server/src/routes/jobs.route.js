import { Router } from "express";
import {
    authenticate,
    verified,
    clientOnly,
    freelancerOnly,
} from "../middlewares/index.js";
import {
    acceptFreelancer,
    applyJob,
    createJob,
    deleteJob,
    getApplicants,
    // getAllJobs,
    getHomePageJobs,
    getJobOverview,
    getJobsPostedByCurrentUser,
    getOpenJobs,
    getSingleJob,
    updateJob,
    updateJobStatusByFreelancer,
    reviewJobByClient,
    getFreelancerJobs,
    getTransaction,
    payTransaction,
    getJobContract,
    approveJobContract,
    downloadJobContractPdf,
    inviteFreelancer,
    respondInvitation,
} from "../controllers/index.js";

export const jobRouter = Router();

jobRouter.post("/create-job", authenticate, verified, clientOnly, createJob);
// jobRouter.get("/", getAllJobs);
jobRouter.post("/update-job", authenticate, verified, clientOnly, updateJob);
jobRouter.get(
    "/get-jobs-posted-by-current-user",
    authenticate,
    clientOnly,
    getJobsPostedByCurrentUser,
);
jobRouter.delete("/delete-job/:jobId", authenticate, clientOnly, deleteJob);
jobRouter.get("/get-home-jobs", getHomePageJobs);
jobRouter.post("/apply", authenticate, verified, freelancerOnly, applyJob);
jobRouter.get("/applicants/:jobId", getApplicants);

jobRouter.post(
    "/:jobId/accept-freelancer",
    authenticate,
    clientOnly,
    acceptFreelancer,
);

jobRouter.post(
    "/:jobId/invite-freelancer",
    authenticate,
    verified,
    clientOnly,
    inviteFreelancer,
);

jobRouter.post(
    "/:jobId/respond-invitation",
    authenticate,
    verified,
    freelancerOnly,
    respondInvitation,
);

jobRouter.patch(
    "/:jobId/status-update",
    authenticate,
    verified,
    freelancerOnly,
    updateJobStatusByFreelancer,
);
jobRouter.patch(
    "/:jobId/client-review",
    authenticate,
    verified,
    clientOnly,
    reviewJobByClient,
);
jobRouter.get("/:userId/open-jobs", getOpenJobs);
jobRouter.get(
    "/freelancer-jobs",
    authenticate,
    verified,
    freelancerOnly,
    getFreelancerJobs,
);
jobRouter.get("/overview/:jobId", authenticate, getJobOverview);
jobRouter.get("/:jobId/contract", authenticate, getJobContract);
jobRouter.patch("/:jobId/contract/approve", authenticate, verified, approveJobContract);
jobRouter.get("/:jobId/contract/pdf", authenticate, downloadJobContractPdf);

// Transaction
jobRouter.get("/transaction/:jobId", authenticate, getTransaction);
jobRouter.post("/transaction/:tId/pay", authenticate, payTransaction);

jobRouter.get("/:id", getSingleJob);
