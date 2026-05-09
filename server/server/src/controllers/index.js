import { login, signup } from "./user/user.controller.js";
import { logout } from "./user/logout.controller.js";
import refreshAccessToken from "./refreshAccessToken.controller.js";
import { requestOtp } from "./requestOtp.controller.js";
import { verifyEmail } from "./user/verifyEmail.controller.js";
import { verifyUserToken } from "./user/verifyUserToken.controller.js";
import { currentUserInfo } from "./user/currentUserInfo.controller.js";
import { uploadKyc, upload } from "./kyc/uploadKyc.controller.js";
import { adminLogin } from "./admin/adminLogin.controller.js";
import { addAdmin } from "./admin/addAdmin.controller.js";
import { getAllKyc } from "./kyc/getAllKyc.controller.js";
import { verifyAdminToken } from "./admin/verifyAdminToken.controller.js";
import { getKycById } from "./kyc/getKycById.controller.js";
import { updateKycStatus } from "./kyc/updateKycStatus.controller.js";
import { switchRole } from "./user/switchRole.controller.js";
import { createJob } from "./job/createJob.controller.js";
import {
    getAllJobs,
    getJobsPostedByCurrentUser,
    getOpenJobs,
    getSingleJob,
} from "./job/getJobs.controller.js";
import { updateJob } from "./job/updateJob.controller.js";
import { updateJobStatusByFreelancer } from "./job/updateJobStatusByFreelancer.controller.js";
import { reviewJobByClient } from "./job/reviewJob.controller.js";
import { getHomePageJobs } from "./job/getHomePageJobs.controller.js";
import { getFreelancerJobs } from "./job/getFreelancerJobs.controller.js";
import { inviteFreelancer } from "./job/inviteFreelancer.controller.js";
import { respondInvitation } from "./job/respondInvitation.controller.js";
import { getFreelancers } from "./user/getFreelancers.controller.js";
import {
    getProfileData,
    updateProfileTags,
    updateAbout,
    updateHourlyRate,
} from "./user/profile.controller.js";
import { generateAboutDescription } from "./user/generateAboutDescription.controller.js";
import { updateAvatar } from "./user/updateAvatar.controller.js";
import { updateCv } from "./user/updateCv.controller.js";
import { getDashboardAnalytics } from "./user/getDashboardAnalytics.controller.js";
import { deleteJob } from "./job/deleteJob.controller.js";
import { applyJob } from "./job/applyJob.controller.js";
import { getApplicants } from "./job/getApplicants.controller.js";
import { acceptFreelancer } from "./job/acceptFreelancer.controller.js";
import { getJobContract, approveJobContract, downloadJobContractPdf } from "./job/contract.controller.js";
import {
    followUser,
    getFollowing,
    getFollowers,
    unFollowUser,
} from "./user/connection.controller.js";
import { getJobOverview } from "./job/getJobOverview.controller.js";
import { getTransaction } from "./transaction/getTransaction.controller.js";
import { payTransaction } from "./transaction/paytransaction.controller.js";
import {
    getAllTransaction,
    getRecentTransaction,
    getSingleTransaction,
} from "./transaction/getTransactions.controller.js";

import { setUserOffline, setUserOnline } from "./chat/userStatus.controller.js";
import {
    createChat,
    deleteChat,
    getChats,
    getConnections,
    newMessage,
} from "./chat/chat.controller.js";
import { getNotifications } from "./notification/getNotifications.controller.js";
import { markAsRead } from "./notification/markAsRead.controller.js";
import { createNotification } from "./notification/createNotification.controller.js";
import { deleteNotification } from "./notification/deleteNotification.controller.js";
import {
    createMilestone,
    getMilestones,
    getMilestoneById,
    completeMilestone,
    approveMilestone,
    rejectMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestoneTransaction,
} from "./milestone/index.js";
import {
    createReview,
    getFreelancerReviews,
    getFreelancerRating,
    checkReviewStatus,
} from "./review/index.js";

export {
    login,
    logout,
    signup,
    refreshAccessToken,
    requestOtp,
    verifyEmail,
    verifyUserToken,
    currentUserInfo,
    uploadKyc,
    upload,
    adminLogin,
    addAdmin,
    getAllKyc,
    getKycById,
    verifyAdminToken,
    updateKycStatus,
    switchRole,
    createJob,
    getAllJobs,
    updateJob,
    getJobsPostedByCurrentUser,
    getSingleJob,
    getHomePageJobs,
    getFreelancers,
    inviteFreelancer,
    respondInvitation,
    getProfileData,
    getDashboardAnalytics,
    updateAvatar,
    updateCv,
    updateProfileTags,
    updateAbout,
    updateHourlyRate,
    generateAboutDescription,
    deleteJob,
    applyJob,
    getApplicants,
    acceptFreelancer,
    getJobContract,
    approveJobContract,
    downloadJobContractPdf,
    followUser,
    unFollowUser,
    getFollowers,
    getFollowing,
    getOpenJobs,
    getJobOverview,
    getTransaction,
    payTransaction,
    getAllTransaction,
    getRecentTransaction,
    getSingleTransaction,

    setUserOffline,
    setUserOnline,
    createChat,
    getChats,
    getConnections,
    newMessage,
    deleteChat,
    getNotifications,
    markAsRead,
    createNotification,
    deleteNotification,
    updateJobStatusByFreelancer,
    reviewJobByClient,
    getFreelancerJobs,
    createMilestone,
    getMilestones,
    getMilestoneById,
    completeMilestone,
    approveMilestone,
    rejectMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestoneTransaction,
    createReview,
    getFreelancerReviews,
    getFreelancerRating,
    checkReviewStatus,
};
