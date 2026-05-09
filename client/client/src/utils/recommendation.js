export function computeMatchScore(job = {}, freelancer = {}) {
    const jobTags = Array.isArray(job.tags) ? job.tags.map(t => String(t).toLowerCase()) : [];
    const profileTags = Array.isArray(freelancer.tags) ? freelancer.tags.map(t => String(t).toLowerCase()) : (freelancer.skills || []).map(s => String(s).toLowerCase());

    // Skill alignment (up to 60 points)
    const sharedTags = jobTags.filter((t) => profileTags.includes(t));
    const skillRatio = jobTags.length > 0 ? (sharedTags.length / jobTags.length) : 0;
    const skillScore = Math.round(Math.min(1, skillRatio) * 60);

    // Budget compatibility (up to 20 points)
    const jobRate = Number(job.hourlyRate || job.budget || 0);
    const freelancerRate = Number(freelancer.hourlyRate || freelancer.requestedRate || 0);
    let budgetScore = 0;
    if (jobRate > 0 && freelancerRate > 0) {
        const diff = Math.abs(jobRate - freelancerRate);
        const rel = diff / Math.max(jobRate, freelancerRate);
        budgetScore = Math.round(Math.max(0, 1 - rel) * 20);
    } else if (jobRate > 0 && freelancerRate === 0) {
        // freelancer has no rate, be conservative
        budgetScore = 10;
    }

    // Rating (up to 10 points)
    const rating = Number(freelancer.rating || freelancer.avgRating || 0);
    const ratingScore = Math.round(Math.min(5, Math.max(0, rating)) / 5 * 10);

    // Bonuses: KYC and availability (up to 10 points total)
    const kycBonus = freelancer.isKycVerified || freelancer.kycVerified || freelancer.kyc ? 5 : 0;
    const availabilityBonus = (freelancer.isAvailable || freelancer.available || freelancer.status === "available") ? 5 : 0;

    // Completed projects bonus (up to 10 points)
    const completed = Number(freelancer.completedProjects || freelancer.projectsCompleted || freelancer.completed || 0);
    const completedScore = Math.round(Math.min(1, completed / 20) * 10);

    const rawScore = skillScore + budgetScore + ratingScore + kycBonus + availabilityBonus + completedScore;
    const score = Math.min(100, rawScore);

    // Recommendation string
    const parts = [];
    parts.push(`${sharedTags.length} matching skill${sharedTags.length === 1 ? "" : "s"}`);
    if (jobRate && freelancerRate) {
        const pct = Math.round((1 - Math.abs(jobRate - freelancerRate) / Math.max(jobRate, freelancerRate)) * 100);
        parts.push(`budget match ${pct}%`);
    }
    if (rating) parts.push(`rating ${rating.toFixed(1)}`);
    if (kycBonus) parts.push("KYC verified");
    if (availabilityBonus) parts.push("Available now");
    if (completed > 0) parts.push(`${completed} projects done`);

    const recommendation = `${score}/100 — ${parts.join(", ")}`;

    return {
        score,
        breakdown: {
            skillScore,
            budgetScore,
            ratingScore,
            kycBonus,
            availabilityBonus,
            completedScore,
        },
        sharedTags,
        recommendation,
    };
}

export default computeMatchScore;
