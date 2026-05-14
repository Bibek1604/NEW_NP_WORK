import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import SVGtoPDF from "svg-to-pdfkit";

const DEFAULT_PAYMENT_TERMS = "10% upfront before work starts; remaining balance after project completion.";

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const formatDate = (value) => {
    if (!value) return "N/A";
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleDateString();
};

const safeText = (value, fallback = "N/A") => {
    const normalized = String(value ?? "").trim();
    return normalized || fallback;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH_CANDIDATES = [
    path.resolve(__dirname, "../../../../client/client/src/assets/logo.svg"),
    path.resolve(process.cwd(), "../client/client/src/assets/logo.svg"),
    path.resolve(process.cwd(), "client/client/src/assets/logo.svg"),
];

let cachedLogoSvg = null;
let hasResolvedLogo = false;

const getNepworkLogoSvg = () => {
    if (hasResolvedLogo) {
        return cachedLogoSvg;
    }

    hasResolvedLogo = true;
    for (const logoPath of LOGO_PATH_CANDIDATES) {
        try {
            if (fs.existsSync(logoPath)) {
                cachedLogoSvg = fs.readFileSync(logoPath, "utf8");
                return cachedLogoSvg;
            }
        } catch {
            // Ignore lookup errors and continue trying other candidate paths.
        }
    }

    cachedLogoSvg = null;
    return null;
};

export const buildContractSnapshot = ({ job, milestones = [] }) => {
    const normalizedMilestones = (milestones || []).map((milestone) => ({
        status: milestone.status || "pending",
        paymentStatus: milestone.paymentStatus || "pending_payment",
        title: milestone.title,
        description: milestone.description,
        amount: Number(milestone.amount || 0),
        deadline: milestone.deadline || null,
        order: Number(milestone.order || 0),
    }));

    const milestoneBudget = normalizedMilestones.reduce((total, milestone) => total + Number(milestone.amount || 0), 0);
    const approvedMilestoneBudget = normalizedMilestones.reduce((total, milestone) => {
        const isApproved = milestone.status === "approved" || milestone.paymentStatus === "released";
        return total + (isApproved ? Number(milestone.amount || 0) : 0);
    }, 0);
    const completedMilestoneBudget = normalizedMilestones.reduce((total, milestone) => {
        const isCompleted = ["completed", "approved"].includes(milestone.status);
        return total + (isCompleted ? Number(milestone.amount || 0) : 0);
    }, 0);
    const baseBudget = Number(job?.payment?.amount || 0);
    const hourlyFallback = Number(job?.hourlyRate || 0);
    const totalCost = Math.max(milestoneBudget, baseBudget, hourlyFallback, 1);
    const initialPaymentAmount = Math.max(1, Math.round(totalCost * 0.1));
    const remainingCost = Math.max(totalCost - approvedMilestoneBudget, 0);

    const milestoneDeadlines = normalizedMilestones
        .map((milestone) => milestone.deadline ? new Date(milestone.deadline) : null)
        .filter((deadline) => deadline && !Number.isNaN(deadline.getTime()));

    const timelineStart = job?.createdAt ? new Date(job.createdAt) : new Date();
    const timelineEnd = milestoneDeadlines.length > 0
        ? new Date(Math.max(...milestoneDeadlines.map((deadline) => deadline.getTime())))
        : new Date(timelineStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const paymentSchedule = [
        {
            label: "Initial deposit",
            amount: initialPaymentAmount,
            note: "Paid before work starts",
        },
        {
            label: "Remaining balance",
            amount: Math.max(totalCost - initialPaymentAmount, 0),
            note: "Released after approved delivery",
        },
    ];

    return {
        totalCost,
        milestoneBudget,
        approvedMilestoneBudget,
        completedMilestoneBudget,
        remainingCost,
        initialPaymentAmount,
        paymentTerms: job?.contract?.paymentTerms || DEFAULT_PAYMENT_TERMS,
        timelineStart,
        timelineEnd,
        milestones: normalizedMilestones,
        paymentSchedule,
        responsibilities: job?.contract?.responsibilities || {
            client: "Provide necessary requirements, feedback, and timely payments as per the agreed milestones.",
            freelancer: "Execute the project scope with professional diligence, meeting the specified quality standards and deadlines.",
        },
        confidentialityClause: job?.contract?.confidentialityClause || "Both parties agree to keep all project-related sensitive information confidential and not disclose it to third parties without prior consent.",
        terminationClause: job?.contract?.terminationClause || "Either party may terminate the contract with a 7-day notice if the other party fails to meet their responsibilities. Any work completed up to that point must be compensated.",
    };
};

export const buildContractPdfLines = ({ job, client, freelancer, snapshot }) => {
    const clientName = `${client?.name?.firstName || ""} ${client?.name?.lastName || ""}`.trim();
    const freelancerName = `${freelancer?.name?.firstName || ""} ${freelancer?.name?.lastName || ""}`.trim();

    return {
        title: safeText(job?.title, "Untitled Project"),
        contractId: safeText(job?._id?.toString()?.toUpperCase()),
        issueDate: new Date(),
        parties: [
            { role: "Client", name: safeText(clientName), email: safeText(client?.email) },
            { role: "Freelancer", name: safeText(freelancerName), email: safeText(freelancer?.email) },
        ],
        overviewRows: [
            { field: "Project Title", value: safeText(job?.title) },
            { field: "Contract Type", value: safeText(job?.contract?.contractType || "milestone") },
            { field: "Scope", value: safeText(job?.description) },
        ],
        timelineRows: [
            { field: "Start Date", value: formatDate(snapshot?.timelineStart) },
            { field: "Estimated End Date", value: formatDate(snapshot?.timelineEnd) },
        ],
        milestones: (snapshot?.milestones || []).map((milestone, index) => ({
            sn: String(index + 1),
            milestone: safeText(milestone?.title),
            amount: formatCurrency(milestone?.amount),
            dueDate: formatDate(milestone?.deadline),
            status: safeText(milestone?.status || "pending"),
        })),
        paymentRows: [
            ...(snapshot?.paymentSchedule || []).map((step) => ({
                stage: safeText(step?.label),
                amount: formatCurrency(step?.amount),
                notes: safeText(step?.note),
            })),
            { stage: "Total Contract Value", amount: formatCurrency(snapshot?.totalCost), notes: "" },
        ],
        termsRows: [
            { clause: "Payment Terms", details: safeText(snapshot?.paymentTerms) },
            { clause: "Client Responsibilities", details: safeText(snapshot?.responsibilities?.client) },
            { clause: "Freelancer Responsibilities", details: safeText(snapshot?.responsibilities?.freelancer) },
            { clause: "Confidentiality", details: safeText(snapshot?.confidentialityClause) },
            { clause: "Termination", details: safeText(snapshot?.terminationClause) },
        ],
        approvals: [
            {
                party: "Client",
                approval: job?.contract?.clientApproved ? "Approved" : "Pending",
                date: job?.contract?.clientApprovedAt ? formatDate(job.contract.clientApprovedAt) : "-",
                signature: "______________________",
            },
            {
                party: "Freelancer",
                approval: job?.contract?.freelancerApproved ? "Approved" : "Pending",
                date: job?.contract?.freelancerApprovedAt ? formatDate(job.contract.freelancerApprovedAt) : "-",
                signature: "______________________",
            },
        ],
    };
};

export const generateContractPdfBuffer = async ({ lines, title = "Project Contract" }) => {
    const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const logoSvg = getNepworkLogoSvg();

    const palette = {
        iceBg: "#eaf7ff",
        iceCard: "#f4fbff",
        iceBorder: "#a8d8f0",
        iceAccent: "#1597c5",
        ink: "#0f2a3a",
        muted: "#4d6b7c",
    };

    const pageWidth = doc.page.width;
    const footerY = doc.page.height - 28;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;
    const contentWidth = right - left;

    const drawHeader = () => {
        const headerHeight = 88;
        doc.save();
        doc.roundedRect(left, 36, contentWidth, headerHeight, 14)
            .fillAndStroke(palette.iceBg, palette.iceBorder);

        if (logoSvg) {
            doc.roundedRect(right - 150, 56, 120, 44, 10).fillAndStroke("#ffffff", palette.iceBorder);
            SVGtoPDF(doc, logoSvg, right - 144, 60, {
                width: 108,
                height: 34,
                preserveAspectRatio: "xMinYMin meet",
            });
        } else {
            doc.circle(right - 28, 79, 22).fill(palette.iceAccent);
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("NW", right - 36, 74, {
                width: 16,
                align: "center",
            });
        }

        doc.fillColor(palette.ink).font("Helvetica-Bold").fontSize(24).text("NEPWORK", left + 18, 58);
        doc.fillColor(palette.muted).font("Helvetica").fontSize(10).text("Project Contract Agreement", left + 18, 86);
        doc.fillColor(palette.iceAccent).font("Helvetica-Bold").fontSize(10).text("ICE VERIFIED", left + 18, 102);

        doc.fillColor(palette.ink).font("Helvetica-Bold").fontSize(12).text(safeText(title), left, 138, {
            width: contentWidth,
            align: "left",
        });
        doc.restore();
        doc.y = 164;
    };

    const drawFooter = () => {
        doc.save();
        doc.moveTo(left, footerY - 8).lineTo(right, footerY - 8).lineWidth(0.6).strokeColor("#c8dceb").stroke();
        doc.font("Helvetica").fontSize(8).fillColor("#7a94a4").text("Generated by NepWork", left, footerY, {
            width: contentWidth,
            align: "left",
        });
        doc.font("Helvetica").fontSize(8).fillColor("#7a94a4").text(`Issued: ${formatDate(lines?.issueDate)}`, left, footerY, {
            width: contentWidth,
            align: "right",
        });
        doc.restore();
    };

    const startNewPage = () => {
        doc.addPage();
        drawHeader();
    };

    const ensureSpace = (heightNeeded = 40) => {
        if (doc.y + heightNeeded > footerY - 16) {
            startNewPage();
        }
    };

    const drawSectionTitle = (text) => {
        ensureSpace(34);
        doc.fillColor(palette.ink).font("Helvetica-Bold").fontSize(12).text(text, left, doc.y, {
            width: contentWidth,
        });
        doc.moveDown(0.5);
    };

    const drawTable = ({ headers, rows, columnWidths }) => {
        const rowPaddingX = 6;
        const rowPaddingY = 6;
        const baseRowHeight = 24;

        const drawHeaderRow = (y) => {
            let x = left;
            headers.forEach((header, index) => {
                const width = columnWidths[index];
                doc.rect(x, y, width, baseRowHeight).fillAndStroke(palette.iceCard, palette.iceBorder);
                doc.fillColor(palette.ink).font("Helvetica-Bold").fontSize(9).text(header, x + rowPaddingX, y + 7, {
                    width: width - rowPaddingX * 2,
                    align: "left",
                });
                x += width;
            });
        };

        ensureSpace(40);
        drawHeaderRow(doc.y);
        doc.y += baseRowHeight;

        rows.forEach((row) => {
            const cellValues = headers.map((header) => safeText(row[header] ?? row[header.toLowerCase()] ?? ""));
            const textHeights = cellValues.map((cellText, index) => {
                const width = columnWidths[index] - rowPaddingX * 2;
                return doc.heightOfString(cellText, {
                    width,
                    align: "left",
                });
            });

            const rowHeight = Math.max(baseRowHeight, Math.max(...textHeights) + rowPaddingY * 2);
            if (doc.y + rowHeight > footerY - 16) {
                startNewPage();
                drawHeaderRow(doc.y);
                doc.y += baseRowHeight;
            }

            let x = left;
            headers.forEach((header, index) => {
                const width = columnWidths[index];
                const text = safeText(row[header] ?? row[header.toLowerCase()] ?? "");

                doc.rect(x, doc.y, width, rowHeight).fillAndStroke("#ffffff", "#d9eaf5");
                doc.fillColor("#17384a").font("Helvetica").fontSize(9).text(text, x + rowPaddingX, doc.y + rowPaddingY, {
                    width: width - rowPaddingX * 2,
                    align: "left",
                });

                x += width;
            });

            doc.y += rowHeight;
        });

        doc.moveDown(0.8);
    };

    drawHeader();

    drawSectionTitle("Contract Information");
    drawTable({
        headers: ["Field", "Value"],
        rows: [
            { field: "Contract ID", value: safeText(lines?.contractId) },
            { field: "Issue Date", value: formatDate(lines?.issueDate) },
        ],
        columnWidths: [160, contentWidth - 160],
    });

    drawSectionTitle("Parties");
    drawTable({
        headers: ["Role", "Name", "Email"],
        rows: (lines?.parties || []).map((item) => ({
            role: safeText(item?.role),
            name: safeText(item?.name),
            email: safeText(item?.email),
        })),
        columnWidths: [110, 170, contentWidth - 280],
    });

    drawSectionTitle("Project Overview");
    drawTable({
        headers: ["Field", "Value"],
        rows: (lines?.overviewRows || []).map((item) => ({
            field: safeText(item?.field),
            value: safeText(item?.value),
        })),
        columnWidths: [160, contentWidth - 160],
    });

    drawSectionTitle("Timeline");
    drawTable({
        headers: ["Field", "Value"],
        rows: (lines?.timelineRows || []).map((item) => ({
            field: safeText(item?.field),
            value: safeText(item?.value),
        })),
        columnWidths: [160, contentWidth - 160],
    });

    drawSectionTitle("Milestones");
    const milestones = lines?.milestones?.length
        ? lines.milestones
        : [{ sn: "-", milestone: "No milestones specified", amount: "-", dueDate: "-", status: "Pending" }];
    drawTable({
        headers: ["Sn", "Milestone", "Amount", "DueDate", "Status"],
        rows: milestones.map((item) => ({
            sn: safeText(item?.sn),
            milestone: safeText(item?.milestone),
            amount: safeText(item?.amount),
            dueDate: safeText(item?.dueDate),
            status: safeText(item?.status),
        })),
        columnWidths: [38, 210, 90, 90, contentWidth - 428],
    });

    drawSectionTitle("Payment Schedule");
    drawTable({
        headers: ["Stage", "Amount", "Notes"],
        rows: (lines?.paymentRows || []).map((item) => ({
            stage: safeText(item?.stage),
            amount: safeText(item?.amount),
            notes: safeText(item?.notes, "-"),
        })),
        columnWidths: [180, 120, contentWidth - 300],
    });

    drawSectionTitle("Terms And Clauses");
    drawTable({
        headers: ["Clause", "Details"],
        rows: (lines?.termsRows || []).map((item) => ({
            clause: safeText(item?.clause),
            details: safeText(item?.details),
        })),
        columnWidths: [180, contentWidth - 180],
    });

    drawSectionTitle("Agreement And Signatures");
    drawTable({
        headers: ["Party", "Approval", "Date", "Signature"],
        rows: (lines?.approvals || []).map((item) => ({
            party: safeText(item?.party),
            approval: safeText(item?.approval),
            date: safeText(item?.date),
            signature: safeText(item?.signature),
        })),
        columnWidths: [120, 120, 100, contentWidth - 340],
    });

    drawFooter();

    return new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
    });
};
