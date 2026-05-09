import Button from "./Button";
import api from "../utils/api";
import toast from "react-hot-toast";
import Loader from "./Loader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../stores";

function JobOverview({ jobId, jobData, isSelectedFreelancer }) {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const statusStyles = {
        open: "bg-green-500 text-white",
        contract_pending: "bg-amber-500 text-white",
        assigned: "bg-purple-500 text-white",
        in_progress: "bg-blue-500 text-white",
        pending_review: "bg-orange-500 text-white",
        completed: "bg-teal-500 text-white",
        closed: "bg-red-500 text-white",
        paid: "bg-emerald-600 text-white",
    };

    const contract = data?.contract;
    const isClient = !isSelectedFreelancer;
    const needsInitialPayment = contract?.status === "pending_payment" && !contract?.initialPaymentDone;
    const canApproveContract = contract && (!contract.clientApproved || !contract.freelancerApproved);
    const totalContractCost = contract?.totalCost ?? data?.payment?.amount ?? 0;
    const approvedMilestoneBudget = contract?.approvedMilestoneBudget ?? 0;
    const remainingProjectCost = contract?.remainingCost ?? Math.max(Number(totalContractCost || 0) - Number(approvedMilestoneBudget || 0), 0);
    const hasMilestoneBudget = Number(contract?.milestones?.length || 0) > 0;
    const isProjectComplete = ["completed", "paid"].includes(data?.jobStatus);
    const isPaymentSettled = Boolean(data?.payment?.done || data?.jobStatus === "paid");

    const downloadContractPdf = async () => {
        try {
            const response = await api.get(`/jobs/${jobId}/contract/pdf`, {
                responseType: "arraybuffer",
            });

            const existingPdfBytes = response.data;

            // Try to dynamically import pdf-lib. If unavailable, fallback to direct download.
            let PDFDocument = null;
            try {
                const pdfLib = await import("pdf-lib");
                PDFDocument = pdfLib.PDFDocument;
            } catch (err) {
                PDFDocument = null;
            }

            if (!PDFDocument) {
                // Fallback: save original PDF without logo
                const pdfUrl = window.URL.createObjectURL(new Blob([existingPdfBytes], { type: "application/pdf" }));
                const link = document.createElement("a");
                link.href = pdfUrl;
                link.setAttribute("download", `contract-${jobId}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(pdfUrl);
                toast.success("Contract PDF downloaded");
                return;
            }

            // Load existing PDF and create a new PDF with logo page prepended
            const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
            const newPdfDoc = await PDFDocument.create();

            // Fetch SVG logo, rasterize to PNG via canvas, then embed
            const svgResponse = await fetch("/src/assets/logo.svg");
            const svgText = await svgResponse.text();

            const svgToPngArrayBuffer = async (svgStr, width = 300, height = 80) => {
                const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.src = url;
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (e) => reject(e);
                });
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/png");
                URL.revokeObjectURL(url);
                const res = await fetch(dataUrl);
                return await res.arrayBuffer();
            };

            let pngBytes = null;
            try {
                // produce a smaller PNG for the PDF header
                pngBytes = await svgToPngArrayBuffer(svgText, 220, 60);
            } catch (err) {
                // fallback: ignore logo if rasterization fails
                console.error("Failed to rasterize logo SVG", err);
            }

            if (pngBytes) {
                const logoImage = await newPdfDoc.embedPng(pngBytes);
                const logoDims = { width: logoImage.width, height: logoImage.height };
                const page = newPdfDoc.addPage([595, 842]);
                const maxWidth = 220;
                const drawWidth = Math.min(logoDims.width, maxWidth);
                const drawHeight = (logoDims.height * drawWidth) / logoDims.width;
                const x = (595 - drawWidth) / 2;
                // position a bit lower so it doesn't crowd the top
                page.drawImage(logoImage, {
                    x,
                    y: 842 - drawHeight - 60,
                    width: drawWidth,
                    height: drawHeight,
                });
            }

            // Copy existing pages
            const copiedPages = await newPdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());
            copiedPages.forEach((p) => newPdfDoc.addPage(p));

            const newPdfBytes = await newPdfDoc.save();
            const blob = new Blob([newPdfBytes], { type: "application/pdf" });
            const pdfUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.setAttribute("download", `contract-${jobId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(pdfUrl);
            toast.success("Contract PDF downloaded (with logo)");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to download contract PDF");
        }
    };

    const approveContract = async () => {
        try {
            await api.patch(`/jobs/${jobId}/contract/approve`);
            toast.success("Contract approval saved");
            fetchSetOverviewData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve contract");
        }
    };

    const fetchSetOverviewData = async () => {
        try {
            const response = await api.get(`/jobs/overview/${jobId}`);
            setData(response.data.data);
        } catch (error) {
            toast.error("Failed to load overview");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSetOverviewData();
    }, [jobData]);

    if (loading) return <Loader />;

    return (
        <div className="mt-8 max-w-7xl mx-auto px-4 pb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
                    Project Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Payment Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Hourly Rate
                                </span>
                                <span className="font-medium">
                                    NRS {data?.rate?.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Project time
                                </span>
                                <div className="flex gap-2 items-center font-medium">
                                    <span className="font-bold">
                                        {(data?.workedTimeInSec / 3600).toFixed(
                                            1,
                                        )}
                                        h
                                    </span>
                                    <span className="text-sm">
                                        {(data?.workedTimeInSec / 60).toFixed(
                                            1,
                                        )}
                                        m
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-gray-900 font-semibold">
                                    Total
                                </span>
                                <span className="font-semibold text-blue-600">
                                    NRS {Number(totalContractCost || 0).toLocaleString()}
                                </span>
                            </div>
                            {hasMilestoneBudget && (
                                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Approved milestone value</span>
                                        <span className="font-medium text-emerald-700">NRS {Number(approvedMilestoneBudget || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Remaining project cost</span>
                                        <span className="font-semibold text-gray-900">NRS {Number(remainingProjectCost || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-gray-600">
                                    Payment Status
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${isPaymentSettled
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {isPaymentSettled ? "Paid" : "Pending"}
                                </span>
                            </div>
                            {!isPaymentSettled && !isSelectedFreelancer && (
                                <Button
                                    onClick={() =>
                                        navigate(
                                            needsInitialPayment
                                                ? `/jobs/${jobId}/pay?stage=initial`
                                                : `/jobs/${jobId}/pay`,
                                        )
                                    }
                                    disabled={
                                        needsInitialPayment
                                            ? !contract?.clientApproved || !contract?.freelancerApproved
                                            : !isProjectComplete
                                    }
                                    variant="filled"
                                    className={"w-full font-bold"}
                                >
                                    {needsInitialPayment
                                        ? "Pay Contract Deposit"
                                        : isProjectComplete
                                            ? "Pay Now"
                                            : contract?.status === "pending_signature"
                                                ? "Awaiting contract approval"
                                                : "Project not completed"}
                                </Button>
                            )}

                            {/* Freelancer Actions */}
                            {isSelectedFreelancer && data?.jobStatus === "assigned" && contract?.status === "active" && (
                                <Button
                                    variant="filled"
                                    className="w-full font-bold mt-2"
                                    onClick={async () => {
                                        try {
                                            await api.patch(`/jobs/${jobId}/status-update`, { status: "in_progress" });
                                            toast.success("Project started!");
                                            fetchSetOverviewData();
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || "Failed to start project");
                                        }
                                    }}
                                >
                                    Start Project
                                </Button>
                            )}
                            {isSelectedFreelancer && data?.jobStatus === "in_progress" && contract?.status === "active" && (
                                <Button
                                    variant="filled"
                                    className="w-full font-bold mt-2"
                                    onClick={async () => {
                                        try {
                                            await api.patch(`/jobs/${jobId}/status-update`, { status: "pending_review" });
                                            toast.success("Project marked for review!");
                                            fetchSetOverviewData();
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || "Failed to update project");
                                        }
                                    }}
                                >
                                    Mark as Completed
                                </Button>
                            )}

                            {isSelectedFreelancer && contract?.status === "pending_signature" && (
                                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Contract approval required</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Review the contract PDF, approve it, and wait for the client deposit before starting work.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="filled"
                                            className="w-full font-bold bg-amber-600 hover:bg-amber-700"
                                            onClick={downloadContractPdf}
                                        >
                                            Download Contract PDF
                                        </Button>
                                        {canApproveContract && (
                                            <Button
                                                variant="filled"
                                                className="w-full font-bold bg-slate-900 hover:bg-slate-800"
                                                onClick={approveContract}
                                            >
                                                Approve Contract
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isClient && contract && (
                                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Contract Status</p>
                                            <p className="text-sm text-gray-600 capitalize">{contract.status?.replaceAll("_", " ")}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                            {contract.clientApproved && contract.freelancerApproved ? "Ready for payment" : "Waiting for signatures"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                        <div className="rounded-lg bg-gray-50 p-3">
                                            <p className="text-gray-500">Client</p>
                                            <p className="font-semibold text-gray-900">{contract.clientApproved ? "Approved" : "Pending"}</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 p-3">
                                            <p className="text-gray-500">Freelancer</p>
                                            <p className="font-semibold text-gray-900">{contract.freelancerApproved ? "Approved" : "Pending"}</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 p-3">
                                            <p className="text-gray-500">Deposit</p>
                                            <p className="font-semibold text-gray-900">Rs. {contract.initialPaymentAmount?.toLocaleString?.() ?? contract.initialPaymentAmount}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            variant="filled"
                                            className="w-full sm:w-auto font-bold"
                                            onClick={downloadContractPdf}
                                        >
                                            Download Contract PDF
                                        </Button>
                                        {canApproveContract && (
                                            <Button
                                                variant="filled"
                                                className="w-full sm:w-auto font-bold bg-slate-900 hover:bg-slate-800"
                                                onClick={approveContract}
                                            >
                                                Approve Contract
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Client Actions */}
                            {!isSelectedFreelancer && data?.jobStatus === "pending_review" && (
                                <Button
                                    variant="filled"
                                    className="w-full font-bold mt-2 bg-orange-500 hover:bg-orange-600"
                                    onClick={async () => {
                                        try {
                                            await api.patch(`/jobs/${jobId}/client-review`, { status: "completed" });
                                            toast.success("Project approved and completed!");
                                            fetchSetOverviewData();
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || "Failed to approve project");
                                        }
                                    }}
                                >
                                    Approve & Complete
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Work Timeline */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Project Timeline
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Timeline Start</p>
                                    <p className="font-medium text-sm">
                                        {contract?.timelineStart ? new Date(contract.timelineStart).toLocaleDateString() : "TBD"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Timeline End</p>
                                    <p className="font-medium text-sm">
                                        {contract?.timelineEnd ? new Date(contract.timelineEnd).toLocaleDateString() : "TBD"}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Current Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusStyles[data?.jobStatus]}`}>
                                    {isProjectComplete ? "completed" : data?.jobStatus?.replace("_", " ")}
                                </span>
                            </div>
                            <div className="pt-2 border-t text-xs text-gray-500">
                                <p className="font-bold uppercase tracking-wider mb-1">Execution Log</p>
                                <p>Started: {data?.workStartedAt ? new Date(data.workStartedAt).toLocaleString() : "Pending"}</p>
                                <p>Finished: {data?.workEndedAt ? new Date(data.workEndedAt).toLocaleString() : "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contract Clauses Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Responsibilities
                        </h4>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div>
                                <p className="font-bold text-gray-800 text-xs uppercase tracking-tight">Client</p>
                                <p className="mt-1 leading-relaxed">{contract?.responsibilities?.client}</p>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <p className="font-bold text-gray-800 text-xs uppercase tracking-tight">Freelancer</p>
                                <p className="mt-1 leading-relaxed">{contract?.responsibilities?.freelancer}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Confidentiality
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                            "{contract?.confidentialityClause}"
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Termination
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {contract?.terminationClause}
                        </p>
                    </div>
                </div>

                {/* Invitations Section */}
                {data?.invitations?.length > 0 && (
                    <div className="mt-8 border-t pt-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            Project Invitations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.invitations.map((invite) => {
                                const isCurrentFreelancer = invite.freelancer?._id === userData?._id || invite.freelancer?._id === userData?.id;
                                const isPending = invite.status === "pending";

                                return (
                                    <div key={invite._id} className={`rounded-xl border p-4 ${isPending ? "bg-white border-primary/20 shadow-sm" : "bg-gray-50 border-gray-200"}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <img src={invite.freelancer?.avatar?.url} alt="" className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                                <div>
                                                    <p className="font-bold text-gray-900">{invite.freelancer?.name?.firstName} {invite.freelancer?.name?.lastName}</p>
                                                    <p className="text-xs text-gray-500 italic">Invited on {new Date(invite.invitedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                invite.status === "accepted" ? "bg-green-100 text-green-700" :
                                                invite.status === "declined" ? "bg-red-100 text-red-700" :
                                                "bg-amber-100 text-amber-700"
                                            }`}>
                                                {invite.status}
                                            </span>
                                        </div>
                                        
                                        {invite.message && (
                                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-3 border-l-2 border-primary/30">
                                                "{invite.message}"
                                            </p>
                                        )}

                                        {invite.terms && (
                                            <div className="mb-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Proposed Terms</p>
                                                <p className="text-xs text-emerald-700 font-medium">{invite.terms}</p>
                                            </div>
                                        )}

                                        {isPending && isSelectedFreelancer && (
                                            <div className="flex flex-col gap-2 mt-4">
                                                <textarea 
                                                    id={`terms-${invite._id}`}
                                                    placeholder="Set your own terms (optional)..."
                                                    className="text-xs p-2 border border-gray-200 rounded focus:ring-1 focus:ring-primary outline-none"
                                                    rows="2"
                                                ></textarea>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        className="flex-1 text-xs py-2 h-auto"
                                                        onClick={async () => {
                                                            const terms = document.getElementById(`terms-${invite._id}`).value;
                                                            try {
                                                                await api.post(`/jobs/${jobId}/respond-invitation`, { status: "accepted", terms });
                                                                toast.success("Invitation accepted!");
                                                                fetchSetOverviewData();
                                                            } catch (err) {
                                                                toast.error(err.response?.data?.message || "Action failed");
                                                            }
                                                        }}
                                                    >Accept Invite</Button>
                                                    <Button 
                                                        className="flex-1 text-xs py-2 h-auto bg-white text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={async () => {
                                                            try {
                                                                await api.post(`/jobs/${jobId}/respond-invitation`, { status: "declined" });
                                                                toast.success("Invitation declined");
                                                                fetchSetOverviewData();
                                                            } catch (err) {
                                                                toast.error(err.response?.data?.message || "Action failed");
                                                            }
                                                        }}
                                                    >Decline</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Additional Info Section */}
                {isProjectComplete && (
                    <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <p className="text-blue-800">
                                This project was successfully completed on{" "}
                                {data?.workEndedAt
                                    ? new Date(data.workEndedAt).toLocaleDateString()
                                    : "the completion date"}
                                .
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobOverview;
