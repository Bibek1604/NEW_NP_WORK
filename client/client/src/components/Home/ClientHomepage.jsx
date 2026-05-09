import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import Loader from "../Loader";
import FreelancerCard from "../FreelancerCard";
import {
    FiCode,
    FiLayout,
    FiEdit3,
    FiVideo,
    FiTrendingUp,
    FiBriefcase,
    FiCheck,
    FiCheckCircle,
    FiArrowRight,
    FiShield,
    FiClock,
    FiZap,
    FiUserX,
    FiRefreshCcw,
    FiSearch,
    FiX,
    FiStar,
    FiAward,
    FiLock,
    FiUsers,
    FiTarget,
    FiPlus
} from "react-icons/fi";
import { Link, useSearchParams } from "react-router";

function ClientHomepage({ isLoggedIn, userData }) {
    const [freelancers, setFreelancers] = useState([]);
    const [clientJobs, setClientJobs] = useState([]);
    const [ongoingProjects, setOngoingProjects] = useState([]);
    const [completedProjects, setCompletedProjects] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [inviteTarget, setInviteTarget] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [inviting, setInviting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Freelancers
                const requestParams = userData?.role === "client" && userData?._id ? { params: { userId: userData._id } } : undefined;
                const frResponse = await api.get("/user/get-freelancers", requestParams);
                let frResults = frResponse.data.data;

                // 2. Fetch Client Jobs and Analytics if logged in as client
                if (userData?.role === "client" && userData?._id) {
                    try {
                        const [jobsResponse, analyticsResponse] = await Promise.all([
                            api.get("/jobs/get-jobs-posted-by-current-user"),
                            api.get("/user/analytics")
                        ]);

                        const allJobs = Array.isArray(jobsResponse.data?.data) ? jobsResponse.data.data : [];

                        // Filter for Invite Modal (only open/pending)
                        setClientJobs(allJobs.filter((job) => ["open", "contract_pending"].includes(job.status)));

                        // Ongoing Projects
                        setOngoingProjects(allJobs.filter((job) => ["assigned", "in_progress"].includes(job.status)));

                        // Completed Projects
                        setCompletedProjects(allJobs.filter((job) => ["completed", "paid"].includes(job.status)));

                        // Analytics
                        setAnalytics(analyticsResponse.data?.data || null);
                    } catch (err) {
                        console.error("Failed to fetch client data", err);
                    }
                }

                if (query) {
                    frResults = frResults.filter(f =>
                        f.name?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
                        f.name?.lastName?.toLowerCase().includes(query.toLowerCase()) ||
                        f.tags?.some?.((skill) => skill.toLowerCase().includes(query.toLowerCase())) ||
                        f.about?.toLowerCase?.().includes(query.toLowerCase())
                    );
                } else {
                    frResults = frResults.slice(0, 8);
                }

                setFreelancers(frResults);
            } catch (error) {
                toast.error("Failed to sync marketplace data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [query, userData]);

    const handleInviteFreelancer = async () => {
        if (!inviteTarget || !selectedProjectId) {
            toast.error("Select a project to send the invitation");
            return;
        }

        setInviting(true);
        try {
            await api.post(`/jobs/${selectedProjectId}/invite-freelancer`, {
                freelancerId: inviteTarget._id,
            });
            toast.success(`Invitation sent to ${inviteTarget?.name?.firstName || "freelancer"}`);
            setInviteTarget(null);
            setSelectedProjectId("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send invitation");
        } finally {
            setInviting(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col bg-white">
                {/* Hero Section - Clean Professional Design */}
                <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden pt-16">
                    {/* Subtle Background Elements */}
                    <div className="absolute inset-0">
                        <div className="absolute rounded-full top-1/3 right-1/3 w-80 h-80 bg-primary/5 blur-3xl opacity-40 animate-blob"></div>
                        <div className="absolute w-64 h-64 rounded-full bottom-1/3 left-1/4 bg-emerald-500/5 blur-3xl opacity-30 animate-blob animation-delay-2s"></div>
                    </div>

                    <div className="relative z-10 max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            {/* Left Content */}
                            <div className="space-y-8">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-full bg-primary/10 border-primary/20">
                                    <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                </div>

                                {/* Headline */}
                                <div className="space-y-5">
                                    <h1 className="text-4xl font-bold leading-tight lg:text-5xl text-slate-900">
                                        Hire Top Nepal's <br />
                                        <span className="text-transparent bg-gradient-to-r from-primary to-emerald-500 bg-clip-text">World-Class Talent</span>
                                    </h1>
                                    <p className="max-w-lg text-base font-medium leading-relaxed text-slate-600">
                                        Connect with verified freelancers who deliver results. Scale your team with experts in development, design, and marketing.
                                    </p>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col gap-4 pt-3 sm:flex-row">
                                    <Link to="/signup" className="inline-flex items-center justify-center gap-2 py-3 font-semibold text-white transition-all rounded-lg shadow-md px-7 bg-primary hover:bg-primary/90 hover:shadow-lg">
                                        Start Hiring <FiArrowRight className="text-base" />
                                    </Link>
                                    <button className="inline-flex items-center justify-center gap-2 py-3 font-semibold transition-all border rounded-lg px-7 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-50">
                                        Watch Demo
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                                    <div>
                                        <div className="text-2xl font-bold text-primary">450+</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">Experts</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">99%</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">Success Rate</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">3.2k</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">Projects</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Visual */}
                            <div className="items-center justify-end hidden lg:flex">
                                <div className="relative w-full max-w-sm">
                                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/10 to-emerald-400/10 rounded-2xl blur-xl"></div>
                                    <div className="relative p-6 bg-white border shadow-lg rounded-xl border-slate-200">
                                        <h3 className="mb-5 text-sm font-semibold text-slate-900">Why Choose Us</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Feature 1: Verified */}
                                            <div className="h-24 overflow-hidden rounded-lg bg-slate-100 group">
                                                <img src="https://images.unsplash.com/photo-1499750148199-5f86fa1b9d27?w=300&h=200&fit=crop" alt="Verified Professionals" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" onError={(e) => (e.target.style.display = 'none')} />
                                                {typeof document !== 'undefined' && !document.querySelector('[src*="unsplash.com"]')?.complete && (
                                                    <div className="flex items-center justify-center w-full h-full text-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">✓</div>
                                                )}
                                            </div>

                                            {/* Feature 2: Escrow */}
                                            <div className="h-24 overflow-hidden rounded-lg bg-slate-100 group">
                                                <img src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=300&h=200&fit=crop" alt="Escrow Protection" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" onError={(e) => (e.target.style.display = 'none')} />
                                                {typeof document !== 'undefined' && !document.querySelector('[src*="unsplash.com"]')?.complete && (
                                                    <div className="flex items-center justify-center w-full h-full text-2xl bg-gradient-to-br from-blue-100 to-blue-50">🔒</div>
                                                )}
                                            </div>

                                            {/* Feature 3: Milestone */}
                                            <div className="h-24 overflow-hidden rounded-lg bg-slate-100 group">
                                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop" alt="Milestone Releases" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" onError={(e) => (e.target.style.display = 'none')} />
                                                {typeof document !== 'undefined' && !document.querySelector('[src*="unsplash.com"]')?.complete && (
                                                    <div className="flex items-center justify-center w-full h-full text-2xl bg-gradient-to-br from-purple-100 to-purple-50">📊</div>
                                                )}
                                            </div>

                                            {/* Feature 4: Support */}
                                            <div className="h-24 overflow-hidden rounded-lg bg-slate-100 group">
                                                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop" alt="24/7 Support" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" onError={(e) => (e.target.style.display = 'none')} />
                                                {typeof document !== 'undefined' && !document.querySelector('[src*="unsplash.com"]')?.complete && (
                                                    <div className="flex items-center justify-center w-full h-full text-2xl bg-gradient-to-br from-orange-100 to-orange-50">💬</div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs text-center text-slate-500">Verified Professionals • Escrow Protected • Milestone-based • 24/7 Support</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-16 bg-white">
                    <div className="max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="mb-12 space-y-2 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Why NepWork?</h2>
                            <p className="text-slate-600">The most trusted platform for hiring Nepal's top talent</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="transition border bg-slate-50 p-7 rounded-xl border-slate-200 hover:border-primary/30 hover:shadow-md">
                                <div className="flex items-center justify-center w-10 h-10 mb-4 text-lg rounded-lg bg-primary/20 text-primary">
                                    <FiAward />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Vetted Talent Pool</h3>
                                <p className="text-sm leading-relaxed text-slate-600">Every freelancer is verified, skill-tested, and portfolio-reviewed to ensure quality work.</p>
                            </div>

                            <div className="transition border bg-slate-50 p-7 rounded-xl border-slate-200 hover:border-primary/30 hover:shadow-md">
                                <div className="flex items-center justify-center w-10 h-10 mb-4 text-lg rounded-lg bg-emerald-500/20 text-emerald-600">
                                    <FiLock />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Secure Payments</h3>
                                <p className="text-sm leading-relaxed text-slate-600">Escrow-protected payments with milestone releases only when work meets your standards.</p>
                            </div>

                            <div className="transition border bg-slate-50 p-7 rounded-xl border-slate-200 hover:border-primary/30 hover:shadow-md">
                                <div className="flex items-center justify-center w-10 h-10 mb-4 text-lg text-blue-600 rounded-lg bg-blue-500/20">
                                    <FiZap />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Quick Setup</h3>
                                <p className="text-sm leading-relaxed text-slate-600">Post a project, review proposals, and hire within hours. No lengthy approval processes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-14 bg-slate-50">
                    <div className="max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="flex flex-col justify-between mb-10 md:flex-row md:items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900">Popular Categories</h2>
                                <p className="mt-1 text-sm text-slate-600">Find experts across all major skill areas</p>
                            </div>
                            <Link to="/search" className="flex items-center gap-2 mt-4 text-xs font-semibold transition-all text-primary hover:gap-3 hover:translate-x-1 md:mt-0">
                                View All <FiArrowRight className="text-sm" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                            {[
                                {
                                    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
                                    label: "Web Development",
                                    count: "452"
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
                                    label: "UI/UX Design",
                                    count: "310"
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&h=300&fit=crop",
                                    label: "Content Writing",
                                    count: "190"
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=300&fit=crop",
                                    label: "Video Production",
                                    count: "128"
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1460925895917-adf4e2b9a3d2?w=500&h=300&fit=crop",
                                    label: "Digital Marketing",
                                    count: "244"
                                }
                            ].map((cat, i) => {
                                return (
                                    <div key={i} className="overflow-hidden transition border rounded-lg cursor-pointer border-slate-200 hover:border-primary/30 hover:shadow-md group">
                                        <div className="relative h-40 overflow-hidden bg-slate-200">
                                            <img
                                                src={cat.image}
                                                alt={cat.label}
                                                className="object-cover w-full h-full transition duration-300 group-hover:scale-110"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="absolute inset-0 items-center justify-center hidden bg-gradient-to-br from-primary/20 to-emerald-500/20">
                                                <span className="text-4xl text-primary/60">🎯</span>
                                            </div>
                                        </div>
                                        <div className="p-4 text-center bg-white">
                                            <h3 className="text-sm font-semibold transition text-slate-900 group-hover:text-primary">{cat.label}</h3>
                                            <p className="mt-1 text-xs text-slate-500">{cat.count} experts</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Process Timeline */}
                <section className="relative py-20 overflow-hidden bg-white">
                    {/* Background gradient accent */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-50/50 via-transparent to-blue-50/50"></div>

                    <div className="relative max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="mb-16 space-y-2 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Get Started in Two Steps</h2>
                            <p className="text-base text-slate-600">A streamlined process to connect you with the perfect freelancer</p>
                        </div>

                        {/* Timeline Container */}
                        <div className="relative">
                            {/* Progress Line - Desktop Only */}
                            <div className="absolute left-0 right-0 hidden h-1 md:block top-12 bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500"></div>

                            {/* Steps Grid */}
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {/* Step 1 */}
                                <div className="relative">
                                    <div className="flex flex-col items-center space-y-4 text-center">
                                        {/* Step Number Circle */}
                                        <div className="relative">
                                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"></div>
                                            <div className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                                                <span className="text-4xl font-bold text-white">1</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900">Post Job</h3>
                                            <p className="text-slate-600">Describe your project requirements, set your budget, and define the timeline. Be clear and specific to attract the right talent.</p>
                                        </div>

                                        {/* Icon decoration */}
                                        <div className="text-5xl">📝</div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative">
                                    <div className="flex flex-col items-center space-y-4 text-center">
                                        {/* Step Number Circle */}
                                        <div className="relative">
                                            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"></div>
                                            <div className="relative flex items-center justify-center w-24 h-24 rounded-full shadow-xl bg-gradient-to-br from-blue-500 to-blue-600">
                                                <span className="text-4xl font-bold text-white">2</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-slate-900">Receive Proposals</h3>
                                            <p className="text-slate-600">Get proposals from verified freelancers within hours. Review portfolios, ratings, and experience to find your perfect match.</p>
                                        </div>

                                        {/* Icon decoration */}
                                        <div className="text-5xl">💥</div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile connector line */}
                            <div className="flex justify-center mt-6 md:hidden">
                                <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-blue-500"></div>
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="mt-16 text-center">
                            <p className="mb-6 text-slate-600">Ready to start? Post your first job today and see the difference quality talent makes.</p>
                            <Link to={isLoggedIn ? "/post-job" : "/login"} className="inline-flex items-center gap-2 px-8 py-3 font-semibold text-white transition transform rounded-lg shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-xl hover:scale-105">
                                Post Your Job Now
                                <FiArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Success Stories Section */}
                <section className="py-20 bg-slate-50">
                    <div className="max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="mb-16 space-y-2 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Success Stories</h2>
                            <p className="text-slate-600">See how businesses like yours have scaled with NepWork talent</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {[
                                { name: "Sarah Johnson", company: "TechStart Inc", role: "CEO", testimonial: "Found our perfect React developer in just 2 days. The quality has been exceptional!", rating: 5 },
                                { name: "David Chen", company: "Creative Studio", role: "Founder", testimonial: "The UI/UX designer we hired has transformed our product. Highly recommend!", rating: 5 },
                                { name: "Maria Garcia", company: "Digital Agency", role: "Project Manager", testimonial: "Best experience hiring freelancers. Professional, reliable, and talented pool.", rating: 5 }
                            ].map((story, i) => (
                                <div key={i} className="p-6 transition-shadow bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(story.rating)].map((_, j) => (
                                            <span key={j} className="text-yellow-400">⭐</span>
                                        ))}
                                    </div>
                                    <p className="mb-4 text-slate-600">&quot;{story.testimonial}&quot;</p>
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="font-semibold text-slate-900">{story.name}</h4>
                                        <p className="text-xs text-slate-500">{story.role} at {story.company}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                <section className="py-20 bg-slate-50">
                    <div className="max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="mb-16 space-y-2 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Platform Features</h2>
                            <p className="text-slate-600">Everything you need to manage your freelance team</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { icon: "🔍", title: "Smart Matching", desc: "AI-powered matching to find the right freelancer for your project" },
                                { icon: "💬", title: "Built-in Communication", desc: "Integrated chat and video calls for seamless collaboration" },
                                { icon: "📊", title: "Project Tracking", desc: "Real-time progress updates and milestone tracking" },
                                { icon: "💳", title: "Secure Payments", desc: "Escrow protection and flexible payment options" },
                                { icon: "📋", title: "Contracts & IP", desc: "Automated contracts and intellectual property protection" },
                                { icon: "⭐", title: "Ratings & Reviews", desc: "Transparent feedback system and performance metrics" }
                            ].map((feature, i) => (
                                <div key={i} className="p-6 transition-shadow bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                                    <div className="mb-3 text-4xl">{feature.icon}</div>
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                                    <p className="text-sm text-slate-600">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-3xl px-6 mx-auto lg:px-8">
                        <div className="mb-16 space-y-2 text-center">
                            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                            <p className="text-slate-600">Find answers to common questions about NepWork</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { q: "How do I post a project?", a: "Sign up, click 'Post a Project', describe your needs, set your budget, and receive proposals from freelancers within hours." },
                                { q: "How are freelancers vetted?", a: "We conduct skill tests, background checks, and verify all qualifications. You can also view portfolios and previous ratings." },
                                { q: "What payment methods are accepted?", a: "We accept credit cards, bank transfers, and digital wallets. All payments are protected through our escrow system." },
                                { q: "What if I'm not satisfied?", a: "We offer a satisfaction guarantee and dispute resolution team available 24/7 to help resolve any issues." }
                            ].map((faq, i) => (
                                <details key={i} className="p-6 transition-colors border rounded-lg cursor-pointer group bg-slate-50 border-slate-200 hover:bg-slate-100">
                                    <summary className="flex items-center justify-between font-semibold text-slate-900">
                                        {faq.q}
                                        <span className="transition-transform text-primary group-open:rotate-180">▼</span>
                                    </summary>
                                    <p className="mt-4 text-slate-600">{faq.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 bg-gradient-to-r from-primary/5 to-emerald-500/5">
                    <div className="max-w-6xl px-6 mx-auto lg:px-8">
                        <div className="grid gap-8 text-center md:grid-cols-4">
                            {[
                                { stat: "500+", label: "Freelancers" },
                                { stat: "300+", label: "Happy Clients" },
                                { stat: "Rs. 10M+", label: "Payments Processed" },
                                { stat: "99.8%", label: "Success Rate" }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="text-4xl font-bold text-primary">{item.stat}</div>
                                    <p className="text-slate-600">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative py-16 overflow-hidden bg-gradient-to-r from-primary/90 to-emerald-500/90">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute bg-white rounded-full top-1/2 right-1/4 w-80 h-80 blur-3xl"></div>
                    </div>
                    <div className="relative z-10 max-w-4xl px-6 mx-auto text-center lg:px-8">
                        <h2 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                            Ready to scale your team?
                        </h2>
                        <p className="max-w-2xl mx-auto mb-6 text-base text-white/80">
                            Join thousands of companies who trust NepWork for their freelance talent needs.
                        </p>
                        <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold transition-all bg-white rounded-lg shadow-md text-primary hover:bg-slate-100">
                            Start Hiring Today <FiArrowRight className="text-sm" />
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    // Logged In - Client Dashboard
    return (
        <div className="min-h-screen pt-20 bg-slate-50/50">
            <main className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Dashboard Header */}
                    <div className="flex flex-col gap-6 px-2 pt-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                                <span className="text-3xl">👋</span>
                                Welcome back, {userData?.name?.firstName || "Client"}
                            </h2>
                            <p className="text-sm text-slate-600 font-medium">Here's what's happening with your projects today</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to="/dashboard?showPostJob=true" className="flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white transition-all border rounded-lg bg-primary border-primary hover:bg-primary/90 hover:shadow-md">
                                <FiPlus className="w-5 h-5" />
                                <span className="text-sm font-semibold">Post New Project</span>
                            </Link>
                            <Link to="/projects-workspace" className="flex items-center gap-3 px-4 py-3 transition-colors border rounded-lg bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                                <FiBriefcase className="w-5 h-5 text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700">Project Workspace</span>
                                <FiArrowRight className="w-4 h-4 text-slate-600" />
                            </Link>
                        </div>
                    </div>



                    {/* Marketplace Grid */}

                    {/* Marketplace Grid */}
                    <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl">
                                    <FiUsers />
                                </div>
                                {query ? (
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-slate-900">Search Results</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found {freelancers.length} candidates</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-slate-900">Recommended Talent</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranked by your active requirements</p>
                                    </div>
                                )}
                            </div>
                            {query && (
                                <button onClick={() => setSearchParams({})} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition bg-red-50 rounded-lg hover:bg-red-100 border border-red-100">
                                    Clear Search
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center py-20"><Loader /></div>
                            ) : freelancers.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {freelancers.map((item) => (
                                        <FreelancerCard
                                            key={item._id || item.recommendation?.matchedJobId || `${item.name?.firstName || "freelancer"}-${item.name?.lastName || "user"}`}
                                            userData={item}
                                            recommendationScore={item.recommendation?.recommendationScore || item.recommendationScore || 0}
                                            matchedProjectTitle={item.recommendation?.matchedJobTitle || ""}
                                            recommendationReasons={item.recommendation?.matchReasons || []}
                                            onInvite={
                                                userData?.role === "client"
                                                    ? () => {
                                                        setInviteTarget(item);
                                                        setSelectedProjectId(clientJobs[0]?._id || "");
                                                    }
                                                    : undefined
                                            }
                                            inviteLabel="Invite"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                                        <FiUserX className="text-slate-300" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-bold text-slate-900 uppercase">No Results Found</h3>
                                    <p className="mb-8 text-sm text-slate-500 font-medium">Try adjusting your search criteria to find the perfect expert.</p>
                                    <button onClick={() => setSearchParams({})} className="px-8 py-3 text-sm font-black text-white rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-xl transition-all uppercase tracking-widest">
                                        Browse All Experts
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {inviteTarget && userData?.role === "client" && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900">Invite Freelancer</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Select a project to invite {inviteTarget?.name?.firstName || "this freelancer"}.
                        </p>

                        <div className="mt-4 space-y-3">
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Project</label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                            >
                                {clientJobs.length === 0 ? (
                                    <option value="">No open projects available</option>
                                ) : (
                                    clientJobs.map((job) => (
                                        <option key={job._id} value={job._id}>
                                            {job.title}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleInviteFreelancer}
                                disabled={inviting || clientJobs.length === 0}
                                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {inviting ? "Sending..." : "Send Invite"}
                            </button>
                            <button
                                onClick={() => {
                                    setInviteTarget(null);
                                    setSelectedProjectId("");
                                }}
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientHomepage;
