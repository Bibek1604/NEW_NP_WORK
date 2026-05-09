const DEFAULT_PAYMENT_TERMS = "10% upfront before work starts; remaining balance after project completion.";

const escapePdfText = (text) =>
    String(text ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)");

const wrapText = (text, maxLength = 92) => {
    const content = String(text ?? "").trim();
    if (!content) return [""];

    const words = content.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (nextLine.length > maxLength) {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        } else {
            currentLine = nextLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

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
    const lines = [];

    // Branding / Header
    lines.push({ text: "NEPWORK - FREELANCE PLATFORM", font: "bold", size: 14 });
    lines.push({ text: "Quality | Trust | Delivery", font: "regular", size: 9 });
    lines.push({ text: "------------------------------------------------------------------------------------------", font: "regular", size: 10 });
    lines.push({ text: "", font: "regular", size: 10 });

    lines.push({ text: "PROJECT CONTRACT AGREEMENT", font: "bold", size: 18 });
    lines.push({ text: `Contract ID: ${job._id.toString().toUpperCase()}`, font: "regular", size: 9 });
    lines.push({ text: `Date: ${new Date().toLocaleDateString()}`, font: "regular", size: 10 });
    lines.push({ text: "", font: "regular", size: 10 });

    // 1. Parties
    lines.push({ text: "1. PARTIES TO THE AGREEMENT", font: "bold", size: 13 });
    lines.push({ text: `1.1 CLIENT: ${client?.name?.firstName || ""} ${client?.name?.lastName || ""}`.trim(), font: "regular", size: 10 });
    lines.push({ text: `    Email: ${client?.email || "N/A"}`, font: "regular", size: 10 });
    lines.push({ text: `1.2 FREELANCER: ${freelancer?.name?.firstName || ""} ${freelancer?.name?.lastName || ""}`.trim(), font: "regular", size: 10 });
    lines.push({ text: `    Email: ${freelancer?.email || "N/A"}`, font: "regular", size: 10 });
    lines.push({ text: "", font: "regular", size: 10 });

    // 2. Project Scope
    lines.push({ text: "2. PROJECT OVERVIEW & SCOPE", font: "bold", size: 13 });
    lines.push({ text: `2.1 Project Title: ${job.title}`, font: "bold", size: 10 });
    lines.push({ text: "2.2 Description of Services:", font: "regular", size: 10 });
    wrapText(job.description || "", 85).forEach((line) => {
        lines.push({ text: `    ${line}`, font: "regular", size: 10 });
    });
    lines.push({ text: "", font: "regular", size: 10 });

    // 3. Timeline
    lines.push({ text: "3. TIMELINE & MILESTONES", font: "bold", size: 13 });
    lines.push({ text: `3.1 Start Date: ${snapshot.timelineStart.toLocaleDateString()}`, font: "regular", size: 10 });
    lines.push({ text: `3.2 Estimated End Date: ${snapshot.timelineEnd.toLocaleDateString()}`, font: "regular", size: 10 });
    lines.push({ text: "3.3 Project Milestones:", font: "regular", size: 10 });
    if (snapshot.milestones.length === 0) {
        lines.push({ text: "    No specific milestones defined. Standard project delivery applies.", font: "regular", size: 10 });
    } else {
        snapshot.milestones.forEach((milestone, index) => {
            lines.push({
                text: `    ${index + 1}. ${milestone.title} - ${formatCurrency(milestone.amount)}${milestone.deadline ? ` (Due ${new Date(milestone.deadline).toLocaleDateString()})` : ""}`,
                font: "regular",
                size: 10,
            });
        });
    }
    lines.push({ text: "", font: "regular", size: 10 });

    // 4. Budget & Payment
    lines.push({ text: "4. BUDGET & PAYMENT TERMS", font: "bold", size: 13 });
    lines.push({ text: `4.1 Total Contract Value: ${formatCurrency(snapshot.totalCost)}`, font: "bold", size: 10 });
    lines.push({ text: `4.2 Payment Schedule:`, font: "regular", size: 10 });
    snapshot.paymentSchedule.forEach((step) => {
        lines.push({ text: `    - ${step.label}: ${formatCurrency(step.amount)} (${step.note})`, font: "regular", size: 10 });
    });
    lines.push({ text: "4.3 General Terms:", font: "regular", size: 10 });
    wrapText(snapshot.paymentTerms, 85).forEach((line) => {
        lines.push({ text: `    ${line}`, font: "regular", size: 10 });
    });
    lines.push({ text: "", font: "regular", size: 10 });

    // 5. Responsibilities
    lines.push({ text: "5. RESPONSIBILITIES", font: "bold", size: 13 });
    lines.push({ text: "5.1 Client Responsibilities:", font: "bold", size: 10 });
    wrapText(snapshot.responsibilities.client, 85).forEach((line) => {
        lines.push({ text: `    ${line}`, font: "regular", size: 10 });
    });
    lines.push({ text: "5.2 Freelancer Responsibilities:", font: "bold", size: 10 });
    wrapText(snapshot.responsibilities.freelancer, 85).forEach((line) => {
        lines.push({ text: `    ${line}`, font: "regular", size: 10 });
    });
    lines.push({ text: "", font: "regular", size: 10 });

    // 6. Confidentiality
    lines.push({ text: "6. CONFIDENTIALITY", font: "bold", size: 13 });
    wrapText(snapshot.confidentialityClause, 85).forEach((line) => {
        lines.push({ text: line, font: "regular", size: 10 });
    });
    lines.push({ text: "", font: "regular", size: 10 });

    // 7. TERMINATION
    lines.push({ text: "7. TERMINATION", font: "bold", size: 13 });
    wrapText(snapshot.terminationClause, 85).forEach((line) => {
        lines.push({ text: line, font: "regular", size: 10 });
    });
    lines.push({ text: "", font: "regular", size: 10 });

    // 8. Signatures
    lines.push({ text: "8. AGREEMENT & SIGNATURES", font: "bold", size: 13 });
    lines.push({ text: "By signing below, both parties agree to the terms and conditions outlined in this agreement.", font: "regular", size: 10 });
    lines.push({ text: "", font: "regular", size: 10 });
    lines.push({ text: "__________________________          __________________________", font: "regular", size: 10 });
    lines.push({ text: "Client Signature                      Freelancer Signature", font: "regular", size: 10 });
    lines.push({ text: `Approved: ${job.contract?.clientApproved ? "YES (" + job.contract.clientApprovedAt?.toLocaleDateString() + ")" : "PENDING"}          Approved: ${job.contract?.freelancerApproved ? "YES (" + job.contract.freelancerApprovedAt?.toLocaleDateString() + ")" : "PENDING"}`, font: "regular", size: 8 });

    return lines;
};

export const generateContractPdfBuffer = ({ lines, title = "Project Contract" }) => {
    const pages = [];
    const maxLinesPerPage = 34;
    const contentLines = lines.map((line) => ({
        ...line,
        text: String(line.text ?? ""),
    }));

    for (let index = 0; index < contentLines.length; index += maxLinesPerPage) {
        pages.push(contentLines.slice(index, index + maxLinesPerPage));
    }

    if (pages.length === 0) {
        pages.push([]);
    }

    const objects = [];
    const fontRegularRef = 3;
    const fontBoldRef = 4;
    const firstContentRef = 5;
    const firstPageRef = 6;

    const pageRefs = pages.map((_, index) => firstPageRef + index * 2);
    const contentRefs = pages.map((_, index) => firstContentRef + index * 2);

    const createPageContent = (pageLines) => {
        const commands = ["BT", "1 0 0 1 50 800 Tm", "/F2 18 Tf", "14 TL", `(${escapePdfText(title)}) Tj`, "T*", "/F1 10 Tf"];

        pageLines.forEach((line) => {
            if (!line.text) {
                commands.push("T*");
                return;
            }

            const fontName = line.font === "bold" ? "/F2" : "/F1";
            const fontSize = line.size || (line.font === "bold" ? 12 : 10);
            commands.push(`${fontName} ${fontSize} Tf`);
            wrapText(line.text, 95).forEach((wrappedLine) => {
                commands.push(`(${escapePdfText(wrappedLine)}) Tj`);
                commands.push("T*");
            });
        });

        commands.push("ET");
        const content = commands.join("\n");
        return `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`;
    };

    objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[1] = `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

    pages.forEach((pageLines, index) => {
        const contentRef = contentRefs[index];
        const pageRef = pageRefs[index];
        objects[contentRef - 1] = createPageContent(pageLines);
        objects[pageRef - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularRef} 0 R /F2 ${fontBoldRef} 0 R >> >> /Contents ${contentRef} 0 R >>`;
    });

    const header = "%PDF-1.4\n";
    const bodyParts = [header];
    const offsets = [0];

    objects.forEach((object, index) => {
        const objectNumber = index + 1;
        const objectString = `${objectNumber} 0 obj\n${object}\nendobj\n`;
        offsets.push(Buffer.byteLength(bodyParts.join(""), "utf8"));
        bodyParts.push(objectString);
    });

    const body = bodyParts.join("");
    const xrefOffset = Buffer.byteLength(body, "utf8");
    const xrefEntries = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];

    for (let index = 1; index <= objects.length; index += 1) {
        const offset = offsets[index] ?? 0;
        xrefEntries.push(`${String(offset).padStart(10, "0")} 00000 n `);
    }

    const trailer = [
        "trailer",
        `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
        "startxref",
        String(xrefOffset),
        "%%EOF",
    ].join("\n");

    return Buffer.from(`${body}${xrefEntries.join("\n")}\n${trailer}`, "utf8");
};