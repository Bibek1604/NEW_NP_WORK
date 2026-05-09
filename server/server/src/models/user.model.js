import mongoose from "mongoose";
import { tags } from "../constants.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            firstName: String,
            middleName: String,
            lastName: String,
        },
        socketId: {
            type: String,
            default: null,
        },
        online: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
        },
        isTyping: {
            type: Boolean,
            default: false,
        },

        balance: {
            type: Number,
            default: 0,
        },
        about: {
            type: String,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ["admin", "client", "freelancer"],
            default: "client",
        },
        avatar: {
            type: String,
            default: null,
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },
        kyc: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Kyc",
        },

        kycVerified: {
            type: Boolean,
            default: false,
        },

        following: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                at: {
                    type: Date,
                    required: true,
                },
            },
        ],
        followers: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                at: {
                    type: Date,
                    required: true,
                },
            },
        ],
        kycStatus: {
            type: String,
            enum: ["not_uploaded", "pending", "verified", "failed"],
            default: "not_uploaded",
        },
        available: {
            type: Boolean,
            default: true,
        },
        rating: {
            type: Number,
            max: [5, "Rating cannot be more than 5"],
            default: 0,
        },
        hourlyRate: {
            type: Number,
            default: 0,
        },
        tags: [
            {
                type: String,
                enum: tags,
            },
        ],
        jobsApplied: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "JobApplication",
            },
        ],
        password: {
            type: String,
            required: true,
        },
        lastRoleChange: {
            type: Date,
            default: null,
        },

        refreshToken: String,
        cv: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

// userSchema.pre("save",function(){
//   if(!this.isModified("password")) return next();

// })

export const User = mongoose.model("User", userSchema);
