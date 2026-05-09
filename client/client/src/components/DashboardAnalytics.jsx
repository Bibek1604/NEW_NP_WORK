import React, { useEffect, useState } from "react";
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
    RadialLinearScale,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { 
    FiDollarSign,
    FiBriefcase,
    FiCheck,
    FiTrendingUp,
    FiArrowUpRight,
    FiClock,
    FiAlertCircle,
    FiActivity
} from "react-icons/fi";
import api from "../utils/api";
import Loader from "./Loader";
import { useAuth } from "../stores";
import {
    applyTransactionFilters,
    loadTransactionFilters,
    toTransactionApiParams,
} from "../utils/transactionFilters";

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
    BarElement,
    RadialLinearScale
);

const DashboardAnalytics = ({ role }) => {
    const { userData } = useAuth();
    const [fetching, setFetching] = useState(true);
    const [timeRange, setTimeRange] = useState("Monthly");
    const [stats, setStats] = useState({
        activeProjects: 0,
        monthlyTotal: 0,
        completedJobs: 0,
        avgValue: 0,
    });
    const [mainChartData, setMainChartData] = useState({ labels: [], datasets: [] });
    const [doughnutData, setDoughnutData] = useState({ labels: [], datasets: [] });
    const [barChartData, setBarChartData] = useState({ labels: [], datasets: [] });
    const [transactions, setTransactions] = useState([]);

    const [analytics, setAnalytics] = useState(null);
    const [performanceData, setPerformanceData] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        const fetchAllData = async () => {
            setFetching(true);
            try {
                const response = await api.get("/user/analytics");
                const data = response.data.data;
                setAnalytics(data);

                // Financial Summary Stats
                setStats({
                    activeProjects: data.stats.active,
                    monthlyTotal: data.financials.total,
                    completedJobs: data.stats.completed,
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

                // Performance Radar/Polar Chart or Bar
                setPerformanceData({
                    labels: ['Completion Rate', 'On-Time Rate', 'Delivery Speed'],
                    datasets: [{
                        label: 'Percentage (%)',
                        data: [data.performance.completionRate, data.performance.onTimePercentage, 100 - data.performance.delayRate],
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        pointBackgroundColor: '#6366f1',
                    }]
                });

                // Financial Chart Data (using financials breakdown)
                const sortedFinancials = [...data.financials.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 6);
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
    }, [userData, role]);

    // Helper functions for transactions
    const getUserName = (user) => {
        if (!user) return "Unknown";
        const firstName = user.firstName || user.name?.firstName || "";
        const lastName = user.lastName || user.name?.lastName || "";
        return `${firstName} ${lastName}`.trim() || "Unknown";
    };

    const getTransactionPartner = (txn) => {
        const isInitiator = (txn.initiator?._id || txn.initiator) === userData?._id;
        const partner = isInitiator ? txn.receiver : txn.initiator;
        return getUserName(partner);
    };

    const getTransactionType = (txn) => {
        const isInitiator = (txn.initiator?._id || txn.initiator) === userData?._id;
        return isInitiator ? "Paid to" : "Received from";
    };

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

            {/* Metrics Section with Enhanced Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile 
                    label="On-Time Rate" 
                    value={`${analytics?.performance?.onTimePercentage || 0}%`} 
                    subValue="Delivery reliability"
                    icon={<FiClock />}
                    trend={analytics?.performance?.onTimePercentage > 80 ? "up" : "neutral"}
                />
            </div>

            {/* Specialized Sections - Deadlines & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Deadline Monitoring */}
                 <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <FiAlertCircle className="text-rose-500" /> Deadline Monitor
                        </h3>
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded">Real-time</span>
                    </div>
                    
                    <div className="space-y-3">
                        {analytics?.deadlines?.overdue?.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">⚠️ Overdue</p>
                                {analytics.deadlines.overdue.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs">
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
                                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                        <div>
                                            <p className="font-bold text-slate-900">{d.title}</p>
                                            <p className="text-slate-500">{d.projectName}</p>
                                        </div>
                                        <p className="font-black text-slate-600">{new Date(d.deadline).toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No tight deadlines approaching</p>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Performance Radar */}
                 <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <FiActivity className="text-primary" /> Performance Matrix
                    </h3>
                    <div className="h-48 flex items-center justify-center">
                        <Radar 
                            data={performanceData}
                            options={{
                                scales: { r: { min: 0, max: 100, ticks: { display: false } } },
                                plugins: { legend: { display: false } },
                                maintainAspectRatio: false
                            }}
                        />
                    </div>
                 </div>
            </div>

            {/* Main Content with Sidebar Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Content - Main Visualizations */}
                <div className="space-y-6 lg:col-span-2">
                {/* Financial Chart */}
                <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900">Financial Performance</h3>
                            <p className="mt-2 text-xs font-medium text-slate-400">{role === 'freelancer' ? 'Your earnings' : 'Your spending'} over time</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                 <span className="text-xs font-bold tracking-wider uppercase text-emerald-600">Live Data</span>
                             </div>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg h-80 bg-gradient-to-b from-slate-50/50 to-white">
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
                                            callback: (v) => v >= 1000 ? `Rs.${(v/1000).toFixed(1)}k` : `Rs.${v}`,
                                            padding: 12
                                        } 
                                    },
                                    y1: {
                                        beginAtZero: true,
                                        position: 'right',
                                        display: true,
                                        grid: { display: false },
                                        ticks: {
                                            font: { size: 10, family: 'Poppins', weight: '500' },
                                            color: '#cbd5e1',
                                            callback: (v) => `${v}x`
                                        }
                                    },
                                    x: { 
                                        grid: { display: false }, 
                                        ticks: { font: { size: 11, family: 'Poppins', weight: '500' }, color: '#94a3b8', padding: 12 } 
                                    }
                                }
                            }} 
                         />
                    </div>
                </div>

                {/* Project Distribution */}
                <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900">Project Status</h3>
                            <p className="mt-2 text-xs font-medium text-slate-400">Distribution across categories</p>
                        </div>
                        
                        <div className="relative flex items-center justify-center h-48">
                            {mainChartData.labels.length > 0 ? (
                                <>
                                    <Doughnut 
                                        data={doughnutData}
                                        options={{
                                            cutout: '72%',
                                            plugins: { legend: { display: false } },
                                            maintainAspectRatio: false
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black leading-none text-slate-900">{stats.activeProjects + stats.completedJobs}</span>
                                        <span className="mt-2 text-xs font-bold tracking-wider uppercase text-slate-400">Projects</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-sm text-slate-400">No projects yet</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 space-y-3 border-t border-slate-100">
                            <LegendItem label="Completed" color="bg-emerald-500" value={stats.completedJobs} />
                            <LegendItem label="Active" color="bg-blue-500" value={stats.activeProjects} />
                            <LegendItem label="Archived" color="bg-slate-300" value="Old" />
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="p-6 transition-shadow duration-300 bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
                    <div className="mb-6">
                        <h3 className="text-base font-black leading-none tracking-wider uppercase text-slate-900">Category Breakdown</h3>
                        <p className="mt-2 text-xs font-medium text-slate-400">Top {role === 'freelancer' ? 'earning' : 'spending'} categories by value</p>
                    </div>
                    <div className="p-2 rounded-lg h-80 bg-gradient-to-b from-slate-50/50 to-white">
                        {barChartData.labels.length > 0 ? (
                            <Bar 
                                data={barChartData}
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
                                                label: (context) => `Rs. ${context.parsed.x.toLocaleString()}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            beginAtZero: true,
                                            border: { display: false },
                                            grid: { color: '#f1f5f9', drawTicks: false },
                                            ticks: {
                                                font: { size: 11, family: 'Poppins', weight: '500' },
                                                color: '#94a3b8',
                                                callback: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v,
                                                padding: 12
                                            }
                                        },
                                        y: {
                                            border: { display: false },
                                            grid: { display: false },
                                            ticks: {
                                                font: { size: 11, family: 'Poppins', weight: '500' },
                                                color: '#64748b',
                                                padding: 12
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-slate-400">No transaction data available</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                {/* Right Sidebar - Transactions Only */}
                <div className="space-y-6">
                    {/* Top Categories */}
                    <div className="p-6 transition-all duration-300 bg-white border rounded-lg shadow-md border-slate-200 hover:shadow-lg">
                        <div className="space-y-4">
                            {analytics?.topProjects?.length > 0 ? (
                                analytics.topProjects.map((p, idx) => {
                                    const colorSchemes = [
                                        { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
                                        { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
                                        { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' }
                                    ];
                                    const scheme = colorSchemes[idx % 3];
                                    
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl ${scheme.bg} border border-slate-100 hover:shadow-md transition-all duration-300`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-black truncate text-slate-900 uppercase tracking-tight">{p.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 uppercase">{p.status}</span>
                                                        <span className={`text-xs font-black ${scheme.text}`}>Rs. {p.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <span className={`text-lg font-black ${scheme.text}`}>{p.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden border border-slate-200/50">
                                                <div 
                                                    className={`h-full ${scheme.bar} transition-all duration-1000 ease-out`}
                                                    style={{ width: `${p.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <FiBriefcase className="text-slate-300 text-3xl mb-2" />
                                    <p className="text-xs text-slate-400">No active projects</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="p-6 transition-all duration-300 bg-white border rounded-lg shadow-md border-slate-200 hover:shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-black tracking-wider uppercase text-slate-900">⚡ Activity Feed</h3>
                                <p className="mt-2 text-xs font-medium text-slate-400">Latest updates & submissions</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
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
                                            <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">
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
                                    <FiActivity className="text-slate-300 text-3xl mb-2" />
                                    <p className="text-xs text-slate-400">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
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
