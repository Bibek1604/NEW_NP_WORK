import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
    BarElement,
} from "chart.js";
import { FiBriefcase, FiCheck, FiArrowUpRight, FiClock, FiAlertCircle, FiActivity } from "react-icons/fi";
import api from "../utils/api";
import Loader from "./Loader";
import { useAuth } from "../stores";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
    ArcElement,
    BarElement
);

const DashboardAnalytics = ({ role }) => {
    const navigate = useNavigate();
    const { userData } = useAuth();
    // Helper: determine if current user profile looks complete enough
    const isProfileComplete = (u) => {
        if (!u) return false;
        const hasName = Boolean(u?.name?.firstName || u?.name?.lastName);
        const hasAvatar = Boolean(u?.avatar);
        const hasBio = Boolean(u?.about || u?.bio || u?.description);
        const hasBasic = hasName && (hasAvatar || hasBio);
        // additional checks for freelancers
        if (u?.role === 'freelancer') {
            const hasSpecs = Array.isArray(u?.tags) ? u.tags.length > 0 : false;
            const hasRate = Boolean(u?.hourlyRate);
            return hasBasic && (hasSpecs || hasRate);
        }
        return hasBasic;
    };
    const [fetching, setFetching] = useState(true);
    const [timeRange, setTimeRange] = useState("Monthly");
    const [stats, setStats] = useState({
        activeProjects: 0,
        monthlyTotal: 0,
        completedJobs: 0,
        pendingProjects: 0,
        avgValue: 0,
    });
    const [mainChartData, setMainChartData] = useState({ labels: [], datasets: [] });
    const [doughnutData, setDoughnutData] = useState({ labels: [], datasets: [] });
    const [barChartData, setBarChartData] = useState({ labels: [], datasets: [] });
    const [transactions, setTransactions] = useState([]);

    const [analytics, setAnalytics] = useState(null);
    const [earningsSummary, setEarningsSummary] = useState({ totalMonth: 0, growth: 0, nextMilestone: 0 });
    const [projectCompletionData, setProjectCompletionData] = useState({ labels: [], datasets: [] });
    const [activeProjectView, setActiveProjectView] = useState("all"); // "all", "ongoing", "completed"

    useEffect(() => {
        const fetchAllData = async () => {
            setFetching(true);
            try {
                const response = await api.get("/user/analytics", {
                    params: { range: timeRange }
                });
                const data = response.data.data;
                setAnalytics(data);

                // Financial Summary Stats
                setStats({
                    activeProjects: data.stats.active,
                    monthlyTotal: data.financials.total,
                    completedJobs: data.stats.completed,
                    pendingProjects: data.stats.pending,
                    avgValue: data.financials.total / (data.stats.total || 1),
                    totalProjects: data.stats.total
                });

                // Project Status Doughnut
                setDoughnutData({
                    labels: ['Completed', 'Active', 'Pending/Other'],
                    datasets: [{
                        data: [data.stats.completed, data.stats.active, data.stats.total - data.stats.completed - data.stats.active],
                        backgroundColor: ['#10b981', '#3b82f6', '#94a3b8'],
                        hoverOffset: 4,
                        borderWidth: 0,
                    }]
                });

                // Financial Chart Data (using financials breakdown)
                const sortedFinancials = [...data.financials.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 6);
                setMainChartData({
                    labels: sortedFinancials.map(f => f.title.substring(0, 15) + (f.title.length > 15 ? '...' : '')),
                    datasets: [{
                        label: role === 'freelancer' ? 'Earnings Trend' : 'Spending Trend',
                        data: sortedFinancials.map(f => f.amount),
                        borderColor: role === 'freelancer' ? '#10b981' : '#3b82f6',
                        backgroundColor: role === 'freelancer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: role === 'freelancer' ? '#10b981' : '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                    }]
                });

                // Earnings Summary (freelancer only) 
                if (role === 'freelancer') {
                    setEarningsSummary({
                        totalMonth: data.financials.total,
                        growth: data.financials.monthlyGrowth || 0,
                        nextMilestone: data.financials.nextMilestoneAmount || 0
                    });

                    // Project Completion Chart (freelancer only)
                    if (data.topProjects?.length > 0) {
                        setProjectCompletionData({
                            labels: data.topProjects.map(p => p.title.substring(0, 20)),
                            datasets: [{
                                label: 'Completion %',
                                data: data.topProjects.map(p => p.progress || 0),
                                backgroundColor: data.topProjects.map((p) => {
                                    if (p.progress >= 100) return '#10b981'; // Green for completed
                                    if (p.progress >= 75) return '#3b82f6'; // Blue for near completion
                                    if (p.progress >= 50) return '#f59e0b'; // Amber for halfway
                                    return '#ec4899'; // Pink for just started
                                }),
                                borderRadius: 8,
                                borderSkipped: false,
                            }]
                        });
                    }
                }

                setBarChartData({
                    labels: sortedFinancials.map(f => f.title.substring(0, 15) + (f.title.length > 15 ? '...' : '')),
                    datasets: [{
                        label: role === 'freelancer' ? 'Earnings (Rs)' : 'Spending (Rs)',
                        data: sortedFinancials.map(f => f.amount),
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(139, 92, 246, 0.8)',
                            'rgba(249, 115, 22, 0.8)',
                            'rgba(236, 72, 153, 0.8)',
                            'rgba(6, 182, 212, 0.8)',
                        ],
                        borderRadius: 8,
                    }]
                });

                setTransactions(data.recentActivity);
                setFetching(false);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                setFetching(false);
            }
        };

        fetchAllData();
    }, [userData, role, timeRange]);

    return (
        <div className="space-y-8 font-['Poppins',_sans-serif]">
            {fetching && <Loader />}
            
            {/* Header Section */}
            <div className="flex flex-col justify-between gap-4 pb-6 border-b md:flex-row md:items-end border-slate-100">
                <div className="space-y-0.5">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h2>
                    <p className="text-sm font-medium text-slate-500">Monitor your {role === 'freelancer' ? 'earnings' : 'spending'} and project performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded p-0.5 shadow-sm">
                        {["Monthly", "Quarterly", "Annual"].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 ${timeRange === range ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Profile completion banner */}
            {!isProfileComplete(userData) && userData?._id && (
                <div className="flex items-center justify-between p-4 mt-4 space-x-4 border border-yellow-100 rounded-lg bg-yellow-50">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-yellow-600" size={20} />
                        <div>
                            <p className="text-sm font-bold text-yellow-800">Your profile looks incomplete</p>
                            <p className="text-xs text-yellow-700">Keep your profile updated to attract better projects and payments.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/profile/${userData._id}`)} className="px-4 py-2 text-sm font-bold text-white rounded bg-primary hover:bg-primary/90">Update profile</button>
                    </div>
                </div>
            )}

            {/* Metrics & Status Section */}
            <div className={`grid grid-cols-1 gap-6 ${role === 'client' ? 'md:grid-cols-2' : 'lg:grid-cols-4'}`}>
                {/* On-Time Rate Metric */}
                <MetricTile 
                    label="On-Time Rate" 
                    value={`${analytics?.performance?.onTimePercentage || 0}%`} 
                    subValue="Delivery reliability"
                    icon={<FiClock />}
                    trend={analytics?.performance?.onTimePercentage > 80 ? "up" : "neutral"}
                />
                
                {/* Project Status Monitoring - Now beside On-Time Rate for Clients */}
                {role === 'client' && (
                    <>
                        <div className="p-6 space-y-4 bg-white border shadow-sm border-slate-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-900">
                                    <FiBriefcase className="text-blue-500" /> Project Status
                                </h3>
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Live</span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div 
                                    onClick={() => setActiveProjectView("ongoing")} 
                                    className={`flex flex-col items-center justify-center p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'ongoing' ? 'bg-blue-100 border-blue-300 shadow-inner' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}
                                >
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Running</p>
                                    <p className="text-xl font-black text-blue-600">{stats.activeProjects || 0}</p>
                                </div>

                                <div 
                                    onClick={() => setActiveProjectView("completed")} 
                                    className={`flex flex-col items-center justify-center p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'completed' ? 'bg-emerald-100 border-emerald-300 shadow-inner' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                                >
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Completed</p>
                                    <p className="text-xl font-black text-emerald-600">{stats.completedJobs || 0}</p>
                                </div>

                                <div 
                                    onClick={() => setActiveProjectView("pending")} 
                                    className={`flex flex-col items-center justify-center p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'pending' ? 'bg-amber-100 border-amber-300 shadow-inner' : 'bg-amber-50 border-amber-100 hover:bg-amber-100'}`}
                                >
                                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">Pending</p>
                                    <p className="text-xl font-black text-amber-600">{stats.pendingProjects || 0}</p>
                                </div>

                                <div 
                                    onClick={() => setActiveProjectView("all")} 
                                    className={`flex flex-col items-center justify-center p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'all' ? 'bg-slate-200 border-slate-400 shadow-inner' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Total</p>
                                    <p className="text-xl font-black text-slate-600">{stats.totalProjects || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div onClick={() => navigate('/all-transactions')} className="p-6 bg-white border shadow-sm border-slate-200 rounded-xl cursor-pointer group hover:shadow-xl hover:border-emerald-200 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FiActivity size={80} />
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-900">
                                    <FiActivity className="text-emerald-500" /> Spending Overview
                                </h3>
                                <FiArrowUpRight className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-slate-900">Rs. {(stats.monthlyTotal || 0).toLocaleString()}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Investment this period</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Financial Audit Ready</span>
                                <span className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">View All Transactions →</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Freelancer Only Metrics */}
                {role === 'freelancer' && (
                    <>
                        <div onClick={() => navigate('/all-transactions')} className="p-4 transition-all duration-300 border rounded-lg cursor-pointer group bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg hover:scale-105 active:scale-95">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">This Month</p>
                                <FiArrowUpRight className="transition-transform text-emerald-600 group-hover:translate-x-1" size={14} />
                            </div>
                            <h3 className="text-lg font-black text-emerald-700">Rs. {(earningsSummary.totalMonth || 0).toLocaleString()}</h3>
                            <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Total earnings</p>
                        </div>

                        <div onClick={() => setActiveProjectView("ongoing")} className={`p-4 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-lg hover:scale-105 active:scale-95 ${activeProjectView === 'ongoing' ? 'bg-purple-100 border-purple-300 shadow-inner' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-purple-600">Running</p>
                                <FiBriefcase className="text-purple-600 transition-transform group-hover:scale-110" size={14} />
                            </div>
                            <h3 className="text-lg font-black text-purple-700">{stats.activeProjects || 0}</h3>
                            <p className="text-[11px] text-purple-600 mt-1 font-semibold">Projects in progress</p>
                        </div>

                        {/* Filler tile for 4-col layout */}
                        <MetricTile 
                            label="Success Rate" 
                            value={`${analytics?.performance?.completionRate || 0}%`} 
                            subValue="Project completion"
                            icon={<FiCheck />}
                            trend="neutral"
                        />
                    </>
                )}
            </div>

            {/* Specialized Sections - Only for Freelancers (since Deadline Monitor is hidden for clients) */}
            {role !== 'client' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Deadline Monitoring */}
                    <div className="p-6 space-y-4 bg-white border shadow-sm border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-900">
                                <FiAlertCircle className="text-rose-500" /> Deadline Monitor
                            </h3>
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded">Real-time</span>
                        </div>
                        
                        <div className="space-y-3">
                            {analytics?.deadlines?.overdue?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">⚠️ Overdue</p>
                                    {analytics.deadlines.overdue.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 text-xs border rounded-lg bg-rose-50 border-rose-100">
                                            <div>
                                                <p className="font-bold text-rose-900">{d.title}</p>
                                                <p className="text-rose-700 opacity-70">{d.projectName}</p>
                                            </div>
                                            <p className="font-black text-rose-600">{new Date(d.deadline).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">📅 Upcoming (Next 7 Days)</p>
                                {analytics?.deadlines?.upcoming?.length > 0 ? (
                                    analytics.deadlines.upcoming.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 text-xs border rounded-lg bg-slate-50 border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-900">{d.title}</p>
                                                <p className="text-slate-500">{d.projectName}</p>
                                            </div>
                                            <p className="font-black text-slate-600">{new Date(d.deadline).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs italic text-slate-400">No tight deadlines approaching</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Projects Monitoring - Duplicate for Freelancer to keep side-by-side with deadlines */}
                    <div className="p-6 space-y-4 bg-white border shadow-sm border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-slate-900">
                                <FiBriefcase className="text-blue-500" /> Project Status
                            </h3>
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Live</span>
                        </div>
                        
                        <div className="space-y-3">
                                <button onClick={() => setActiveProjectView("ongoing")} className="w-full p-3 text-sm font-black tracking-widest text-white uppercase transition-all duration-300 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-105 active:scale-95">
                                    → Filter Ongoing Below
                                </button>
    
                            <div onClick={() => setActiveProjectView("ongoing")} className={`flex items-center justify-between p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'ongoing' ? 'bg-blue-100 border-blue-300 shadow-inner' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}>
                                <div className="flex items-center gap-3">
                                    <FiBriefcase className="text-blue-500 transition-transform group-hover:scale-110" size={20} />
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Running Projects</p>
                                        <p className="text-xs text-blue-900 font-bold mt-0.5">{stats.activeProjects || 0} in progress</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-blue-600">{stats.activeProjects || 0}</p>
                            </div>
    
                            <div onClick={() => setActiveProjectView("completed")} className={`flex items-center justify-between p-3 transition-all duration-300 border rounded-lg cursor-pointer group hover:shadow-md active:scale-95 ${activeProjectView === 'completed' ? 'bg-emerald-100 border-emerald-300 shadow-inner' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}>
                                <div className="flex items-center gap-3">
                                    <FiCheck className="transition-transform text-emerald-500 group-hover:scale-110" size={20} />
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Completed</p>
                                        <p className="text-xs text-emerald-900 font-bold mt-0.5">{stats.completedJobs || 0} projects finished</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-emerald-600">{stats.completedJobs || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content with Sidebar Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Content - Main Visualizations */}
                <div className="space-y-6 lg:col-span-2">
                {/* Financial Chart */}
                <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <div 
                            onClick={() => navigate('/all-transactions')}
                            className="cursor-pointer group/fhead"
                        >
                            <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900 group-hover/fhead:text-primary transition-colors flex items-center gap-2">
                                Financial Performance
                                <FiArrowUpRight className="opacity-0 group-hover/fhead:opacity-100 transition-all group-hover/fhead:translate-x-0.5" />
                            </h3>
                            <p className="mt-2 text-xs font-medium text-slate-400">{role === 'freelancer' ? 'Your earnings' : 'Your spending'} over time</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div 
                                onClick={() => navigate('/all-transactions')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                             >
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                 <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600">View Detailed Audit</span>
                             </div>
                        </div>
                    </div>
                    <div 
                        onClick={() => navigate('/all-transactions')}
                        className="p-2 rounded-lg h-80 bg-gradient-to-b from-slate-50/50 to-white cursor-pointer group/chart hover:shadow-inner transition-all"
                    >
                        {mainChartData.labels.length > 0 ? (
                            role === 'freelancer' ? (
                                <Line 
                                    data={mainChartData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { display: false },
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                                backgroundColor: '#1e293b',
                                                titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                                bodyFont: { family: 'Poppins', size: 12 },
                                                padding: 14,
                                                cornerRadius: 10,
                                                displayColors: true,
                                            }
                                        },
                                        scales: {
                                            y: { 
                                                beginAtZero: true,
                                                border: { display: false }, 
                                                grid: { color: '#f1f5f9', drawTicks: false }, 
                                                ticks: { 
                                                    font: { size: 11, family: 'Poppins', weight: '500' }, 
                                                    color: '#94a3b8',
                                                    padding: 12
                                                } 
                                            },
                                            x: { 
                                                border: { display: false }, 
                                                grid: { display: false }, 
                                                ticks: { 
                                                    font: { size: 11, family: 'Poppins', weight: '500' }, 
                                                    color: '#94a3b8',
                                                    padding: 12
                                                } 
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Bar 
                                    data={barChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { 
                                            legend: { display: false },
                                            tooltip: {
                                                backgroundColor: '#1e293b',
                                                titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                                bodyFont: { family: 'Poppins', size: 12 },
                                                padding: 14,
                                                cornerRadius: 10,
                                                callbacks: {
                                                    label: (context) => `Rs. ${context.parsed.y.toLocaleString()}`
                                                }
                                            }
                                        },
                                        scales: { 
                                            y: { 
                                                beginAtZero: true, 
                                                border: { display: false },
                                                grid: { color: '#f1f5f9', drawTicks: false },
                                                ticks: { 
                                                    color: '#94a3b8',
                                                    callback: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v,
                                                    padding: 12
                                                } 
                                            }, 
                                            x: { 
                                                border: { display: false },
                                                grid: { display: false },
                                                ticks: { 
                                                    color: '#94a3b8',
                                                    padding: 12
                                                } 
                                            } 
                                        } 
                                    }}
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-sm text-slate-400">No projects yet</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 space-y-3 border-t border-slate-100">
                        <LegendItem label="Completed" color="bg-emerald-500" value={stats.completedJobs} />
                        <LegendItem label="Active" color="bg-blue-500" value={stats.activeProjects} />
                        {/* Archived legend removed per request */}
                    </div>
                </div>

                {/* Project Status Distribution - Client Only */}
                {role !== 'freelancer' && (
                    <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900">Project Status</h3>
                                <p className="mt-2 text-xs font-medium text-slate-400">Distribution of your projects</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-lg h-80 bg-gradient-to-b from-slate-50/50 to-white">
                            {doughnutData.labels.length > 0 ? (
                                <Doughnut 
                                    data={doughnutData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: true,
                                                position: 'bottom',
                                                labels: {
                                                    font: { family: 'Poppins', size: 11, weight: '500' },
                                                    color: '#64748b',
                                                    padding: 16,
                                                    boxWidth: 8,
                                                    boxHeight: 8,
                                                    usePointStyle: true
                                                }
                                            },
                                            tooltip: {
                                                backgroundColor: '#1e293b',
                                                titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                                bodyFont: { family: 'Poppins', size: 12 },
                                                padding: 14,
                                                cornerRadius: 10,
                                                callbacks: {
                                                    label: (context) => `${context.label}: ${context.parsed} projects`
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <FiBriefcase className="mb-2 text-3xl text-slate-300" />
                                    <p className="text-sm text-slate-400">No project data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Freelancer Only - Earnings Summary & Additional Analytics */}
                {role === 'freelancer' && (
                    <>
                        {/* Project Completion Status Chart */}
                        <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                            <div className="mb-6">
                                <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900">Project Completion Status</h3>
                                <p className="mt-2 text-xs font-medium text-slate-400">How much of each project is completed</p>
                            </div>
                            <div className="h-64 p-2 rounded-lg bg-gradient-to-b from-slate-50/50 to-white">
                                {projectCompletionData.labels?.length > 0 ? (
                                    <Bar
                                        data={projectCompletionData}
                                        options={{
                                            indexAxis: 'y',
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: '#1e293b',
                                                    titleFont: { family: 'Poppins', size: 13, weight: 'bold' },
                                                    bodyFont: { family: 'Poppins', size: 12 },
                                                    padding: 14,
                                                    cornerRadius: 10,
                                                    callbacks: {
                                                        label: (context) => `${context.parsed.x}% Completed`
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    beginAtZero: true,
                                                    max: 100,
                                                    border: { display: false },
                                                    grid: { color: '#f1f5f9', drawTicks: false },
                                                    ticks: {
                                                        font: { size: 11, family: 'Poppins', weight: '500' },
                                                        color: '#94a3b8',
                                                        callback: (v) => `${v}%`,
                                                        padding: 12
                                                    }
                                                },
                                                y: {
                                                    border: { display: false },
                                                    grid: { display: false },
                                                    ticks: {
                                                        font: { size: 10, family: 'Poppins', weight: '500' },
                                                        color: '#64748b',
                                                        padding: 8
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <FiBriefcase className="mb-2 text-3xl text-slate-300" />
                                        <p className="text-sm text-slate-400">No projects yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

                {/* Right Sidebar - Activity Feed */}
                <div className="space-y-6">
                    {/* Recent Transactions / Activity Feed */}
                    <div className="p-6 transition-all duration-300 bg-white border rounded-lg shadow-md border-slate-200 hover:shadow-lg">
                        <div 
                            onClick={() => navigate('/all-transactions')}
                            className="flex items-center justify-between mb-5 cursor-pointer group/header"
                        >
                            <div>
                                <h3 className="text-lg font-black tracking-wider uppercase text-slate-900 group-hover/header:text-primary transition-colors">⚡ Activity Feed</h3>
                                <p className="mt-2 text-xs font-medium text-slate-400">Latest updates & submissions</p>
                            </div>
                            <FiArrowUpRight className="text-slate-300 group-hover/header:text-primary group-hover/header:translate-x-1 transition-all" />
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                            {transactions?.length > 0 ? (
                                transactions.map((activity, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 transition-all duration-200 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-md group"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            activity.type === 'milestone' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {activity.type === 'milestone' ? <FiCheck size={14} /> : <FiBriefcase size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold tracking-tight uppercase text-slate-900">
                                                {activity.type} {activity.action.replace('_', ' ')}
                                            </p>
                                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{activity.target}</p>
                                            <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase">
                                                {new Date(activity.date).toLocaleDateString()} &bull; {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <FiActivity className="mb-2 text-3xl text-slate-300" />
                                    <p className="text-xs text-slate-400">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Prominent Project Explorer - Moved below the main layout for better focus */}
            <div className="p-8 transition-all duration-300 bg-white border shadow-sm border-slate-200 rounded-2xl hover:shadow-md mt-6">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
                            <FiBriefcase />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-wider uppercase text-slate-900">
                                {activeProjectView === 'all' ? 'Project Explorer' : `${activeProjectView} Projects`}
                            </h3>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">
                                {activeProjectView === 'all' ? 'Overview of your complete portfolio' : `Viewing filtered results: ${activeProjectView}`}
                            </p>
                        </div>
                    </div>
                    {activeProjectView !== 'all' && (
                        <button 
                            onClick={() => setActiveProjectView("all")}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-slate-200"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(analytics?.financials?.breakdown || [])
                        .filter(p => {
                            if (activeProjectView === 'ongoing') return ['assigned', 'in_progress', 'contract_pending'].includes(p.status);
                            if (activeProjectView === 'completed') return ['completed', 'paid'].includes(p.status);
                            if (activeProjectView === 'pending') return ['open', 'pending_review'].includes(p.status);
                            return true;
                        })
                        .length > 0 ? (
                        (analytics?.financials?.breakdown || [])
                            .filter(p => {
                                if (activeProjectView === 'ongoing') return ['assigned', 'in_progress', 'contract_pending'].includes(p.status);
                                if (activeProjectView === 'completed') return ['completed', 'paid'].includes(p.status);
                                if (activeProjectView === 'pending') return ['open', 'pending_review'].includes(p.status);
                                return true;
                            })
                            .map((p, idx) => {
                                const isOngoing = ['assigned', 'in_progress', 'contract_pending'].includes(p.status);
                                const isCompleted = ['completed', 'paid'].includes(p.status);
                                const isPending = p.status === 'open';
                                
                                const scheme = isCompleted 
                                    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-100' }
                                    : isOngoing
                                        ? { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', border: 'border-blue-100' }
                                        : isPending
                                            ? { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', border: 'border-amber-100' }
                                            : { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-400', border: 'border-slate-100' };
                                
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate(`/projects-workspace?id=${p.id}`)}
                                        className={`p-5 rounded-2xl ${scheme.bg} border ${scheme.border} hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FiBriefcase size={64} />
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`text-[10px] font-black bg-white px-2 py-1 rounded shadow-sm border border-white/50 uppercase ${scheme.text}`}>
                                                    {p.status.replace('_', ' ')}
                                                </span>
                                                <span className={`text-sm font-black ${scheme.text}`}>Rs. {p.amount.toLocaleString()}</span>
                                            </div>
                                            
                                            <h4 className="text-lg font-black tracking-tight uppercase mb-6 line-clamp-2 text-slate-900 group-hover:text-primary transition-colors">
                                                {p.title}
                                            </h4>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Completion Progress</p>
                                                    <p className={`text-lg font-black ${scheme.text}`}>{p.progress}%</p>
                                                </div>
                                                <div className="w-full h-2.5 overflow-hidden border rounded-full bg-white/60 border-slate-200/50 shadow-inner">
                                                    <div 
                                                        className={`h-full ${scheme.bar} transition-all duration-1000 ease-out shadow-lg`}
                                                        style={{ width: `${p.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-slate-300 text-3xl">
                                <FiBriefcase />
                            </div>
                            <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">No {activeProjectView} projects found</p>
                            <p className="text-xs text-slate-300 mt-2">Adjust your filters or start a new project to see results here.</p>
                        </div>
                    )}
                </div>
    </div>

            {/* Full Width Recent Transactions - Bottom Section */}
   
        </div>
    );
}


const MetricTile = ({ label, value, subValue, icon, color = "text-slate-900", trend = "neutral" }) => {
    const getTrendColor = () => {
        if (trend === 'up') return 'text-emerald-600';
        if (trend === 'down') return 'text-rose-600';
        return 'text-slate-600';
    };

    const getTrendIcon = () => {
        if (trend === 'up') return <FiArrowUpRight className="text-emerald-600" />;
        if (trend === 'down') return <FiArrowUpRight className="transform rotate-180 text-rose-600" />;
        return null;
    };

    return (
        <div className="p-6 transition-all duration-300 border rounded-lg cursor-pointer group bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:border-slate-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center transition-all duration-300 border rounded-lg shadow-sm w-11 h-11 bg-primary/10 border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30">
                    {React.cloneElement(icon, { size: 20, className: "text-primary" })}
                </div>
                {trend !== 'neutral' && (
                    <div className={`p-1.5 rounded-full ${trend === 'up' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        {getTrendIcon()}
                    </div>
                )}
            </div>
            <div>
                <p className="mb-2 text-xs font-bold tracking-widest uppercase text-primary/60">{label}</p>
                <div className="flex items-baseline gap-2 mb-3">
                    <h3 className={`text-2xl font-black tracking-tight group-hover:text-primary transition-colors ${color}`}>{value}</h3>
                </div>
                <p className={`text-xs font-semibold flex items-center gap-1.5 ${getTrendColor()}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${trend === 'up' ? 'bg-emerald-500' : trend === 'down' ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                    {subValue}
                </p>
            </div>
        </div>
    );
};

const LegendItem = ({ label, color, value }) => (
    <div className="flex items-center justify-between p-3 transition-all duration-200 rounded-lg bg-slate-50 hover:bg-slate-100 group">
        <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`}></div>
            <span className="text-xs font-bold tracking-tight uppercase text-slate-700">{label}</span>
        </div>
        <span className="text-xs font-black transition-colors text-slate-900 group-hover:text-primary">{value}</span>
    </div>
);

export default DashboardAnalytics;
