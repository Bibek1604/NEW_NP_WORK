import React, { useEffect, useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Loader } from "../components";
import TransactionListItem from "../components/TransactionListItem";
import { useAuth } from "../stores";
import { FiFilter, FiTrendingUp, FiTrendingDown, FiClock, FiCheckCircle } from "react-icons/fi";
import {
    applyTransactionFilters,
    clearTransactionFilters,
    loadTransactionFilters,
    saveTransactionFilters,
    toTransactionApiParams,
} from "../utils/transactionFilters";

function Transactions() {
    const { userData } = useAuth();
    const [allTxns, setAllTxns] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [filters, setFilters] = useState(() => loadTransactionFilters());

    const isFreelancer = userData?.role === "freelancer";
    const isClient = userData?.role === "client";

    const fetchSetTxns = async () => {
        try {
            const response = await api.get("/user/transactions/all", {
                params: toTransactionApiParams(filters),
            });
            setAllTxns(response.data.data || []);
            setFetching(false);
        } catch (error) {
            toast.error("Failed to load transactions");
            console.error(error);
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchSetTxns();
    }, [filters]);

    const updateFilter = (name, value) => {
        const updated = saveTransactionFilters({ ...filters, [name]: value });
        setFilters(updated);
    };

    const setQuickDate = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        const updated = saveTransactionFilters({ 
            ...filters, 
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
        setFilters(updated);
    };

    const resetFilters = () => {
        const reset = clearTransactionFilters();
        setFilters(reset);
    };

    // Filter transactions based on role and filters
    const getFilteredTransactions = () => {
        const filtered = applyTransactionFilters(allTxns, filters);

        return filtered.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    };

    const displayedTxns = getFilteredTransactions();

    // Calculate statistics
    const getStats = () => {
        const earned = allTxns
            .filter(t => (t.receiver?._id || t.receiver) === userData?._id && (t.paymentStatus === "completed" || t.status === "done"))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const paid = allTxns
            .filter(t => (t.initiator?._id || t.initiator) === userData?._id && (t.paymentStatus === "completed" || t.status === "done"))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const pending = allTxns.filter(t => 
            (t.paymentStatus || t.status) === "pending" || (t.paymentStatus || t.status) === "processing"
        ).reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalVolume = allTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

        return { earned, paid, pending, totalVolume };
    };

    const stats = getStats();

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Banner */}
            <div className="bg-white border-b border-gray-200 pt-12 pb-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                                {isFreelancer ? "Earnings History" : "Payment History"}
                            </h1>
                            <p className="text-gray-500 mt-2 text-lg">
                                {isFreelancer 
                                    ? "Track all your earned payments and pending transactions" 
                                    : "Review all your project payments and expenses"}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isFreelancer ? (
                            <>
                                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Earned</span>
                                        <FiTrendingUp className="text-emerald-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">Rs. {stats.earned.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pending</span>
                                        <FiClock className="text-blue-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">Rs. {stats.pending.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Transactions</span>
                                        <FiCheckCircle className="text-purple-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{allTxns.length}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Total Paid</span>
                                        <FiTrendingDown className="text-red-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">Rs. {stats.paid.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pending</span>
                                        <FiClock className="text-blue-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">Rs. {stats.pending.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Total Volume</span>
                                        <FiCheckCircle className="text-purple-600 text-lg" />
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">Rs. {stats.totalVolume.toLocaleString()}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="max-w-6xl mx-auto px-6 -mt-8">
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <div className="px-8 py-4 flex items-center justify-between">
                            <div className="flex gap-2 items-center">
                                <span className="inline-block text-sm font-semibold text-gray-700">Filtered Transactions</span>
                                <span className="inline-block bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                                    {displayedTxns.length}
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="px-8 py-6 bg-white border-b border-gray-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <FiFilter size={18} />
                                </div>
                                <div>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Advanced Filtering</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Refine your financial history</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {[
                                    { label: 'Last 7 Days', days: 7 },
                                    { label: '30 Days', days: 30 },
                                    { label: '90 Days', days: 90 }
                                ].map(btn => (
                                    <button
                                        key={btn.label}
                                        onClick={() => setQuickDate(btn.days)}
                                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-primary/30 hover:text-primary transition-all"
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => updateFilter("status", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Type</label>
                                <select
                                    value={filters.purpose}
                                    onChange={(e) => updateFilter("purpose", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                >
                                    <option value="all">All Types</option>
                                    <option value="initial">Initial Deposit</option>
                                    <option value="final">Final Payment</option>
                                    <option value="milestone">Milestone</option>
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => updateFilter("startDate", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => updateFilter("endDate", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="w-full px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold transition-all hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="p-8">
                        {fetching ? (
                            <div className="py-20">
                                <Loader />
                            </div>
                        ) : displayedTxns.length > 0 ? (
                            <div className="space-y-2">
                                {displayedTxns.map((item) => (
                                    <TransactionListItem key={item._id} transactionData={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">No transactions found</h3>
                                <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                    Your financial activities will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Transactions;
