import { Router } from "express";
import { authenticate, verified } from "../middlewares/index.js";

import {
    signup,
    login,
    logout,
    refreshAccessToken,
    requestOtp,
    verifyEmail,
    verifyUserToken,
    currentUserInfo,
    uploadKyc,
    upload,
    switchRole,
    getFreelancers,
    getProfileData,
    updateAvatar,
    updateCv,
    updateProfileTags,
    updateAbout,
    updateHourlyRate,
    generateAboutDescription,
    followUser,
    unFollowUser,
    getFollowers,
    getFollowing,
    getAllTransaction,
    getRecentTransaction,
    getSingleTransaction,
    getNotifications,
    markAsRead,
    getDashboardAnalytics,
} from "../controllers/index.js";

const userRoute = Router();

userRoute.post("/signup", signup);
userRoute.post("/login", login);
userRoute.post("/logout", authenticate, logout);
userRoute.post("/refresh-access-token", refreshAccessToken);
userRoute.post("/request-otp", authenticate, requestOtp);
userRoute.post("/verify-email", authenticate, verifyEmail);
userRoute.get("/verify-token", authenticate, verifyUserToken);

// hanlind document upload and other form data of kyc
userRoute.post(
    "/upload-kyc",
    authenticate,
    upload.single("documentFile"),
    uploadKyc,
);
userRoute.get("/current-user-info", authenticate, currentUserInfo);

// switch role route
userRoute.post("/switch-role", authenticate, verified, switchRole);
userRoute.get("/get-freelancers", getFreelancers);

userRoute.post(
    "/update-avatar",
    authenticate,
    upload.single("newAvatar"),
    updateAvatar,
);

userRoute.post(
    "/update-cv",
    authenticate,
    upload.single("cv"),
    updateCv,
);

userRoute.post("/update-profile-tags", authenticate, updateProfileTags);
userRoute.post("/update-about", authenticate, updateAbout);
userRoute.post("/generate-about", authenticate, generateAboutDescription);
userRoute.post("/update-hourly-rate", authenticate, updateHourlyRate);

userRoute.post("/:targetId/follow", authenticate, followUser);
userRoute.post("/:targetId/unfollow", authenticate, unFollowUser);

userRoute.get("/transactions/all", authenticate, getAllTransaction);
userRoute.get("/transactions/recent", authenticate, getRecentTransaction);
userRoute.get("/transactions/:tId", authenticate, getSingleTransaction);

userRoute.get("/followers/:targetId", getFollowers);
userRoute.get("/following/:targetId", getFollowing);

userRoute.get("/profiles/:userId", getProfileData);

userRoute.get("/analytics", authenticate, verified, getDashboardAnalytics);

export { userRoute };
