import { FiActivity, FiAward, FiClock, FiStar, FiTrendingUp, FiZap } from "react-icons/fi";
import { Link } from "react-router";
import { FreelancerProjects, ReviewsSummary, TotalEarnings } from "../index";

function FreelancerDashboardView({ userData }) {
    const firstName = userData?.name?.firstName || "Freelancer";

    return (
        <div className="min-h-screen bg-[#0b1220] text-white">
            <main className="p-4 md:p-6 lg:p-8">
                <div className="mx-auto space-y-8 max-w-7xl">
                    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] shadow-[0_30px_80px_-30px_rgba(15,23,42,0.9)]">
                        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="relative p-8 md:p-10 lg:p-12">
                                <div className="absolute top-0 right-0 rounded-full h-44 w-44 bg-cyan-400/15 blur-3xl" />
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-200/75">Freelancer Flight Deck</p>
                                <h1 className="max-w-2xl mt-4 text-4xl font-black tracking-tight md:text-5xl">
                                    Keep your work moving, your earnings visible, and your reputation growing.
                                </h1>
                                <p className="max-w-2xl mt-4 text-sm leading-6 text-slate-300 md:text-base">
                                    This dashboard is tuned for contracts, earnings momentum, and review performance.
                                </p>

                                <div className="flex flex-wrap gap-3 mt-8">
                                    <Link
                                        to="/projects-workspace"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                                    >
                                        <FiZap />
                                        Open Projects
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white transition border rounded-2xl border-white/15 bg-white/5 backdrop-blur hover:bg-white/10"
                                    >
                                        <FiStar />
                                        View Profile
                                    </Link>
                                </div>

                                <div className="grid gap-3 mt-10 sm:grid-cols-3">
                                    {[
                                        { label: "Earnings", value: "Live", icon: <FiTrendingUp /> },
                                        { label: "Workload", value: "Tracked", icon: <FiClock /> },
                                        { label: "Reputation", value: "Reviews", icon: <FiAward /> },
                                    ].map((item) => (
                                        <div key={item.label} className="p-4 border rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-100/70">
                                                {item.icon}
                                                {item.label}
                                            </div>
                                            <div className="mt-3 text-2xl font-black">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 p-6 bg-slate-950/60 md:p-8">
                                <div className="p-5 border shadow-sm rounded-3xl border-cyan-400/15 bg-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200/75">Latest review score</p>
                                    <div className="mt-3">
                                        <ReviewsSummary freelancerId={userData?._id} />
                                    </div>
                                </div>
                                {[
                                    { label: "Profile health", value: "Strong", icon: <FiActivity /> },
                                    { label: "Earning mode", value: "Active", icon: <FiTrendingUp /> },
                                ].map((card) => (
                                    <div key={card.label} className="p-5 border shadow-sm rounded-3xl border-white/10 bg-white/5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                                                <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
                                            </div>
                                            <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-cyan-400/10 text-cyan-300">
                                                {card.icon}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                        <div className="space-y-6">
                            <TotalEarnings />
                            <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight text-white">Weekly Pulse</h2>
                                        <p className="mt-1 text-sm text-slate-400">Your current workflow snapshot.</p>
                                    </div>
                                    <FiZap className="text-2xl text-cyan-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
                                    <div className="p-4 rounded-2xl bg-cyan-400/10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">In progress</p>
                                        <p className="mt-2 text-2xl font-black text-white">Focus</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-emerald-400/10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">Reviews</p>
                                        <p className="mt-2 text-2xl font-black text-white">Visible</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <FreelancerProjects />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default FreelancerDashboardView;