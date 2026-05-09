const STORAGE_KEY = "transaction_filters_v1";

export const defaultTransactionFilters = {
    status: "all",
    purpose: "all",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
};

export const normalizeTransactionFilters = (filters = {}) => ({
    ...defaultTransactionFilters,
    ...filters,
});

export const loadTransactionFilters = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultTransactionFilters };
        const parsed = JSON.parse(raw);
        return normalizeTransactionFilters(parsed);
    } catch (error) {
        return { ...defaultTransactionFilters };
    }
};

export const saveTransactionFilters = (filters = {}) => {
    const normalized = normalizeTransactionFilters(filters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
};

export const clearTransactionFilters = () => {
    localStorage.removeItem(STORAGE_KEY);
    return { ...defaultTransactionFilters };
};

export const toTransactionApiParams = (filters = {}) => {
    const normalized = normalizeTransactionFilters(filters);
    const params = {};

    if (normalized.status && normalized.status !== "all") params.status = normalized.status;
    if (normalized.purpose && normalized.purpose !== "all") params.purpose = normalized.purpose;
    if (normalized.startDate) params.startDate = normalized.startDate;
    if (normalized.endDate) params.endDate = normalized.endDate;
    if (normalized.minAmount !== "" && normalized.minAmount !== null) params.minAmount = normalized.minAmount;
    if (normalized.maxAmount !== "" && normalized.maxAmount !== null) params.maxAmount = normalized.maxAmount;

    return params;
};

export const applyTransactionFilters = (transactions = [], filters = {}) => {
    const normalized = normalizeTransactionFilters(filters);

    const isSameCalendarDay = (leftDate, rightDate) =>
        leftDate.getFullYear() === rightDate.getFullYear() &&
        leftDate.getMonth() === rightDate.getMonth() &&
        leftDate.getDate() === rightDate.getDate();

    return (transactions || []).filter((txn) => {
        const status = txn.paymentStatus || txn.status;
        const purpose = txn.purpose || "final";
        const createdAt = new Date(txn.createdAt);
        const amount = Number(txn.amount || 0);

        if (normalized.status !== "all" && normalized.status !== status) return false;
        if (normalized.purpose !== "all" && normalized.purpose !== purpose) return false;

        if (normalized.startDate || normalized.endDate) {
            const start = normalized.startDate ? new Date(normalized.startDate) : null;
            const end = normalized.endDate ? new Date(normalized.endDate) : null;

            if (start && Number.isNaN(start.getTime())) return true;
            if (end && Number.isNaN(end.getTime())) return true;

            if (start && end) {
                end.setHours(23, 59, 59, 999);
                if (createdAt < start || createdAt > end) return false;
            } else if (start) {
                if (!isSameCalendarDay(createdAt, start)) return false;
            } else if (end) {
                if (!isSameCalendarDay(createdAt, end)) return false;
            }
        }

        if (normalized.minAmount !== "" && !Number.isNaN(Number(normalized.minAmount)) && amount < Number(normalized.minAmount)) {
            return false;
        }

        if (normalized.maxAmount !== "" && !Number.isNaN(Number(normalized.maxAmount)) && amount > Number(normalized.maxAmount)) {
            return false;
        }

        return true;
    });
};
