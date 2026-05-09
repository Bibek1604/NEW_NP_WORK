import mongoose from "mongoose";
import { tags } from "../constants.js";

const jobApplicationSchema = new mongoose.Schema(
    {
        appliedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
        },
        appliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        message: {
            type: String,
        },
    },
    { timestamps: true },
);

export const JobApplication = mongoose.model(
    "JobApplication",
    jobApplicationSchema,
);

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        payment: {
            done: {
                type: Boolean,
                default: false,
            },
            amount: {
                type: Number,
                default: 0,
            },
        },

        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null,
        },

        contract: {
            status: {
                type: String,
                enum: ["draft", "pending_signature", "pending_payment", "active"],
                default: "draft",
            },
            totalCost: {
                type: Number,
                default: 0,
            },
            initialPaymentAmount: {
                type: Number,
                default: 0,
            },
            paymentTerms: {
                type: String,
                default: "10% upfront before work starts; remaining balance after project completion.",
            },
            timelineStart: {
                type: Date,
                default: null,
            },
            timelineEnd: {
                type: Date,
                default: null,
            },
            clientApproved: {
                type: Boolean,
                default: false,
            },
            freelancerApproved: {
                type: Boolean,
                default: false,
            },
            clientApprovedAt: {
                type: Date,
                default: null,
            },
            freelancerApprovedAt: {
                type: Date,
                default: null,
            },
            activatedAt: {
                type: Date,
                default: null,
            },
            initialPaymentDone: {
                type: Boolean,
                default: false,
            },
            initialPaymentAt: {
                type: Date,
                default: null,
            },
            initialTransaction: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Transaction",
                default: null,
            },
            finalTransaction: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Transaction",
                default: null,
            },
            milestones: [
                {
                    title: String,
                    description: String,
                    amount: Number,
                    deadline: Date,
                    order: Number,
                },
            ],
            responsibilities: {
                client: {
                    type: String,
                    default: "Provide necessary requirements, feedback, and timely payments as per the agreed milestones.",
                },
                freelancer: {
                    type: String,
                    default: "Execute the project scope with professional diligence, meeting the specified quality standards and deadlines.",
                },
            },
            confidentialityClause: {
                type: String,
                default: "Both parties agree to keep all project-related sensitive information confidential and not disclose it to third parties without prior consent.",
            },
            terminationClause: {
                type: String,
                default: "Either party may terminate the contract with a 7-day notice if the other party fails to meet their responsibilities. Any work completed up to that point must be compensated.",
            },
        },

        invitations: [
            {
                freelancer: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                status: {
                    type: String,
                    enum: ["pending", "accepted", "declined"],
                    default: "pending",
                },
                terms: {
                    type: String,
                    default: "",
                },
                message: {
                    type: String,
                    default: "",
                },
                invitedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        applications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "JobApplication",
            },
        ],
        acceptedFreelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        acceptedApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobApplication",
            default: null,
        },

        startTime: {
            type: Date,
            default: null,
        },
        endTime: {
            type: Date,
            default: null,
        },
        hasFinished: {
            type: Boolean,
            default: false,
        },

        workedTimeInSec: {
            type: Number,
            default: 0,
        },

        hourlyRate: {
            type: Number,
            required: true,
        },

        tags: [
            {
                type: String,
                enum: tags,
            },
        ],
        progress: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["open", "closed", "contract_pending", "assigned", "in_progress", "pending_review", "completed", "paid"],
            default: "open",
        },
    },
    { timestamps: true },
);

export const Job = mongoose.model("Job", jobSchema);
