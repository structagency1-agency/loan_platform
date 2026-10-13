import { api } from "./api";

export interface AgentDailySummary {
  success: boolean;
  date: string;
  totalCashCollected: string;
  successfulCollectionsCount: number;
  emisDueToday: number;
  emisCollectedToday: number;
  remainingDueEmis: number;
  breakdown?: {
    cash: {
      amount: string;
      count: number;
    };
  };
}

export interface DueItem {
  emiId: string;
  loanId: string;
  loanNumber: string;
  loanStatus: string;
  installmentNo: number;
  dueDate: string;
  emiAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: "PENDING" | "PARTIAL" | "OVERDUE";
  customer: {
    name: string;
    phone: string | null;
  };
}

export interface AgentTodayDues {
  success: boolean;
  date: string;
  count: number;
  totalDuesCount: number;
  totalDueAmount: string;
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  dues: DueItem[];
}

export interface ReconciliationCollectionItem {
  id: string;
  receiptNumber: string;
  collectedAmount: string;
  collectedAt: string;
  loanId: string;
  loanNumber: string;
  emiId: string;
  installmentNo: number;
  reconciled: boolean;
  reconciledAt: string | null;
  notes: string | null;
}

export interface AgentCashReconciliation {
  success: boolean;
  date: string;
  totalCollectedAmount: string;
  collectionsCount: number;
  reconciledCount: number;
  unreconciledCount: number;
  reconciledAmount: string;
  unreconciledAmount: string;
  collections: ReconciliationCollectionItem[];
  disclaimer: string;
}

export interface AgentDashboardData {
  summary: AgentDailySummary;
  dues: AgentTodayDues;
  reconciliation: AgentCashReconciliation;
  expectedAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  cashHeld: number;
  customersDueCount: number;
}

export interface AssignedLoanEmi {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  emiAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: "PENDING" | "PARTIAL" | "OVERDUE";
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedLoanItem {
  assignmentId: string;
  assignmentType: string;
  assignedAt: string;
  loan: {
    id: string;
    customerId: string;
    applicationId: string;
    loanNumber: string;
    principalAmount: string;
    interestRate: string;
    tenureMonths: number;
    emiAmount: string;
    totalInterest: string;
    totalPayable: string;
    outstandingAmount: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    application: {
      customer: {
        user: {
          id: string;
          name: string;
          phone: string | null;
          email: string;
        };
      };
      product: {
        name: string;
      };
    };
    emis: AssignedLoanEmi[];
  };
}

export interface AgentAssignedLoansResponse {
  success: boolean;
  count: number;
  loans: AssignedLoanItem[];
}

/**
 * Fetch daily collection summary for the authenticated agent.
 * Endpoint: GET /api/agent/collection-summary/daily
 */
export async function getAgentDailySummary(date?: string): Promise<AgentDailySummary> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  return api.get<AgentDailySummary>("/agent/collection-summary/daily", { params });
}

/**
 * Fetch dues assigned to this agent for today or overdue.
 * Endpoint: GET /api/agent/today-dues
 */
export async function getAgentTodayDues(params?: {
  date?: string;
  page?: number;
  limit?: number;
}): Promise<AgentTodayDues> {
  return api.get<AgentTodayDues>("/agent/today-dues", { params });
}

/**
 * Fetch read-only cash reconciliation summary for the authenticated agent.
 * Endpoint: GET /api/agent/cash-reconciliation/daily
 */
export async function getAgentCashReconciliation(date?: string): Promise<AgentCashReconciliation> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  return api.get<AgentCashReconciliation>("/agent/cash-reconciliation/daily", { params });
}

/**
 * Fetch all agent dashboard metrics concurrently.
 * Combines collection summary, dues, and cash reconciliation into unified dashboard data.
 */
export async function fetchAgentDashboard(date?: string): Promise<AgentDashboardData> {
  const [summary, dues, reconciliation] = await Promise.all([
    getAgentDailySummary(date),
    getAgentTodayDues({ date, page: 1, limit: 10 }),
    getAgentCashReconciliation(date),
  ]);

  const collectedAmount = parseFloat(summary.totalCashCollected || "0") || 0;
  const remainingAmount = parseFloat(dues.totalDueAmount || "0") || 0;
  const expectedAmount = collectedAmount + remainingAmount;
  const progressPercentage =
    expectedAmount > 0
      ? Math.min(100, Math.max(0, Math.round((collectedAmount / expectedAmount) * 100)))
      : 0;
  const cashHeld = parseFloat(reconciliation.unreconciledAmount || "0") || 0;
  const customersDueCount = dues.totalDuesCount ?? dues.count ?? 0;

  return {
    summary,
    dues,
    reconciliation,
    collectedAmount,
    remainingAmount,
    expectedAmount,
    progressPercentage,
    cashHeld,
    customersDueCount,
  };
}

/**
 * Fetch loans actively assigned to the authenticated agent.
 * Endpoint: GET /api/agent/assigned-loans
 */
export async function getAgentAssignedLoans(): Promise<AgentAssignedLoansResponse> {
  return api.get<AgentAssignedLoansResponse>("/agent/assigned-loans");
}

/* -------------------------------------------------------------------------
 * Loan selection state helper (bridges navigation from list to details)
 * ------------------------------------------------------------------------- */
/**
 * Safely accesses window.sessionStorage ensuring that environments
 * where merely referencing window.sessionStorage throws do not raise unhandled exceptions.
 */
function getSessionStorageSafely(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage || null;
  } catch {
    return null;
  }
}

/**
 * Safely accesses window.localStorage ensuring that environments
 * where merely referencing window.localStorage throws do not raise unhandled exceptions.
 */
function getLocalStorageSafely(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage || null;
  } catch {
    return null;
  }
}

let activeSelectedLoanId: string | null = null;

export function setSelectedLoanId(id: string | null): void {
  activeSelectedLoanId = id;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      if (id) {
        storage.setItem("speedmoney_selected_loan_id", id);
      } else {
        storage.removeItem("speedmoney_selected_loan_id");
      }
    } catch {
      // ignore storage errors
    }
  }
}

export function getSelectedLoanId(): string | null {
  if (activeSelectedLoanId) return activeSelectedLoanId;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      const stored = storage.getItem("speedmoney_selected_loan_id");
      if (stored) {
        activeSelectedLoanId = stored;
        return stored;
      }
    } catch {
      return null;
    }
  }
  return null;
}


/**
 * Calculates a previous calendar date from an IST date reference.
 * Parses the YYYY-MM-DD components, constructs a pure UTC calendar date,
 * subtracts the requested number of calendar days, and formats as YYYY-MM-DD.
 * Completely immune to client browser timezone offsets or midnight boundary shifts.
 */
export function getPastISTDate(daysAgo: number, baseDateStr?: string): string {
  const reference =
    baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)
      ? baseDateStr
      : getTodayIST();
  const [year, month, day] = reference.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() - daysAgo);
  return utcDate.toISOString().slice(0, 10);
}

export function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  } catch {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    return ist.toISOString().slice(0, 10);
  }
}

/**
 * Formats an ISO timestamp to YYYY-MM-DD in Asia/Kolkata timezone.
 */
export function toISTDateString(isoDate: string | Date): string {
  try {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  } catch {
    return "";
  }
}

/**
 * Formats an ISO date/timestamp into human-readable short date (e.g. "05 Oct 2026") in IST.
 */
export function formatISTShortDate(isoDate: string | Date): string {
  try {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Categorizes an assigned loan into filters ("Due Today", "Overdue", "Upcoming", "Paid")
 * and extracts relevant UI badge data and outstanding amounts.
 */
export type CustomerFilterCategory = "All" | "Due Today" | "Overdue" | "Upcoming" | "Paid";

export function getAssignedLoanCategory(item: AssignedLoanItem): {
  category: CustomerFilterCategory;
  badgeLabel: string;
  badgeTone: "danger" | "warning" | "info" | "neutral" | "success";
  nextEmi: AssignedLoanEmi | null;
  dueAmount: number;
} {
  const todayIST = getTodayIST();
  const emis = item.loan.emis || [];
  const nextEmi = emis.length > 0 ? emis[0] : null;

  // 1. If loan has no pending EMIs in schedule
  if (emis.length === 0) {
    const outstanding = parseFloat(item.loan.outstandingAmount || "0");
    if (outstanding <= 0) {
      return {
        category: "Paid",
        badgeLabel: "Paid",
        badgeTone: "success",
        nextEmi: null,
        dueAmount: 0,
      };
    }
    // Outstanding balance remains on loan but no unpaid installments returned in schedule
    return {
      category: "Upcoming",
      badgeLabel: "Active",
      badgeTone: "neutral",
      nextEmi: null,
      dueAmount: parseFloat(item.loan.emiAmount || "0") || 0,
    };
  }

  // Next due amount is the outstanding amount on the earliest unpaid installment
  const dueAmount =
    parseFloat(nextEmi!.outstandingAmount || "0") || parseFloat(item.loan.emiAmount || "0") || 0;
  const emiDateIST = toISTDateString(nextEmi!.dueDate);

  // 2. Overdue: next installment has explicit status OVERDUE or dueDate < todayIST
  if (nextEmi!.status === "OVERDUE" || (emiDateIST && emiDateIST < todayIST)) {
    return {
      category: "Overdue",
      badgeLabel: "Overdue",
      badgeTone: "danger",
      nextEmi,
      dueAmount,
    };
  }

  // 3. Due Today: next installment due date equals today in IST
  if (emiDateIST === todayIST) {
    const isPartial = nextEmi!.status === "PARTIAL";
    return {
      category: "Due Today",
      badgeLabel: isPartial ? "Partial Due" : "Due Today",
      badgeTone: isPartial ? "warning" : "info",
      nextEmi,
      dueAmount,
    };
  }

  // 4. Upcoming: next installment due date is in the future
  return {
    category: "Upcoming",
    badgeLabel: "Upcoming",
    badgeTone: "neutral",
    nextEmi,
    dueAmount,
  };
}

/* -------------------------------------------------------------------------
 * Cash Collection API, Types & Receipt State Helper (Phase 3.2C)
 * ------------------------------------------------------------------------- */

export interface CashCollectionRequest {
  loanId: string;
  emiId: string;
  amount: string | number;
  notes?: string;
  idempotencyKey?: string;
}

export interface CashCollectionResponse {
  success: boolean;
  message: string;
  duplicate?: boolean;
  paymentId: string;
  receiptNumber: string;
  loanId: string;
  emiId: string;
  installmentNo: number;
  collectedAmount: string;
  collectedAt: string;
  notes: string | null;
  reconciled: boolean;
  customerName?: string;
  customerPhone?: string | null;
  loanNumber?: string;
  payment: {
    id: string;
    receiptNumber: string;
    amount: string;
    mode: string;
    status: string;
    paidAt: string;
    createdAt?: string;
  };
  emi: {
    id: string;
    installmentNo: number;
    status: string;
    paidAmount: string;
    outstandingAmount: string;
    paidAt: string | null;
  };
  loan: {
    id: string;
    loanNumber: string;
    outstandingAmount: string;
    status: string;
  };
}

/**
 * Record a cash collection by an authenticated agent.
 * Endpoint: POST /api/agent/cash-collections
 */
export async function recordCashCollection(
  payload: CashCollectionRequest
): Promise<CashCollectionResponse> {
  const headers: Record<string, string> = {};
  if (payload.idempotencyKey) {
    headers["Idempotency-Key"] = payload.idempotencyKey;
  }
  return api.post<CashCollectionResponse>("/agent/cash-collections", payload, {
    headers,
  });
}

/* -------------------------------------------------------------------------
 * Active collection receipt storage helper (bridges Collect to Success/Receipt)
 * ------------------------------------------------------------------------- */
let activeLatestReceipt: CashCollectionResponse | null = null;

export function setLatestCollectionReceipt(receipt: CashCollectionResponse | null): void {
  activeLatestReceipt = receipt;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      if (receipt) {
        storage.setItem("speedmoney_latest_receipt", JSON.stringify(receipt));
      } else {
        storage.removeItem("speedmoney_latest_receipt");
      }
    } catch {
      // ignore storage errors
    }
  }
}

export function getLatestCollectionReceipt(): CashCollectionResponse | null {
  if (activeLatestReceipt) return activeLatestReceipt;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      const stored = storage.getItem("speedmoney_latest_receipt");
      if (stored) {
        activeLatestReceipt = JSON.parse(stored);
        return activeLatestReceipt;
      }
    } catch {
      return null;
    }
  }
  return null;
}


/* -------------------------------------------------------------------------
 * Collection History API & Receipt Viewer Types (Phase 3.3)
 * ------------------------------------------------------------------------- */

export interface AgentCashCollectionItem {
  id: string;
  receiptNumber: string;
  collectedAmount: string;
  collectedAt: string;
  reconciled: boolean;
  reconciledAt: string | null;
  notes: string | null;
  payment: {
    id: string;
    amount: string;
    mode: string;
    status: string;
    transactionId: string;
    paidAt: string;
  };
  loan: {
    id: string;
    loanNumber: string;
    status: string;
  };
  emi: {
    id: string;
    installmentNo: number;
    dueDate: string;
    status: string;
  };
  customer: {
    name: string;
    phone: string | null;
  };
}

export interface AgentCashCollectionsResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  summary: {
    totalCollectedAmount: string;
    count: number;
  };
  collections: AgentCashCollectionItem[];
}

export interface GetAgentCashCollectionsParams {
  [key: string]: string | number | boolean | null | undefined;

  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  loanId?: string;
}

/**
 * Fetch cash collection history for the authenticated agent.
 * Endpoint: GET /api/agent/cash-collections
 */
export async function getAgentCashCollections(
  params?: GetAgentCashCollectionsParams
): Promise<AgentCashCollectionsResponse> {
  return api.get<AgentCashCollectionsResponse>("/agent/cash-collections", {
    params,
  });
}

export interface HistoricalReceiptViewData {
  receiptNumber: string;
  paymentId: string;
  transactionId?: string;
  loanId: string;
  loanNumber: string;
  installmentNo: number;
  customerName: string;
  customerPhone?: string | null;
  collectedAmount: string;
  collectedAt: string;
  paymentMode: string;
  paymentStatus: string;
  notes: string | null;
  reconciled: boolean;
  reconciledAt?: string | null;
  emiStatus?: string;
  loanStatus?: string;
  remainingLoanBalance?: number | null;
  source: "history" | "collection" | "ledger";
}

export function mapCollectionItemToHistoricalReceipt(
  item: AgentCashCollectionItem,
  source: "history" | "ledger" = "history"
): HistoricalReceiptViewData {
  return {
    receiptNumber: item.receiptNumber,
    paymentId: item.payment?.id || item.id,
    transactionId: item.payment?.transactionId,
    loanId: item.loan?.id || "",
    loanNumber: item.loan?.loanNumber || "",
    installmentNo: item.emi?.installmentNo || 0,
    customerName: item.customer?.name || "Customer",
    customerPhone: item.customer?.phone || null,
    collectedAmount: item.collectedAmount || item.payment?.amount || "0",
    collectedAt: item.collectedAt || item.payment?.paidAt || "",
    paymentMode: item.payment?.mode || "CASH",
    paymentStatus: item.payment?.status || "",
    notes: item.notes || null,
    reconciled: Boolean(item.reconciled),
    reconciledAt: item.reconciledAt || null,
    emiStatus: item.emi?.status,
    loanStatus: item.loan?.status,
    remainingLoanBalance: null,
    source,
  };
}

export function mapCollectionResponseToHistoricalReceipt(
  res: CashCollectionResponse
): HistoricalReceiptViewData {
  const remaining = res.loan?.outstandingAmount
    ? parseFloat(res.loan.outstandingAmount)
    : null;

  return {
    receiptNumber: res.receiptNumber,
    paymentId: res.paymentId || res.payment?.id,
    transactionId: "",
    loanId: res.loanId || res.loan?.id,
    loanNumber: res.loanNumber || res.loan?.loanNumber || res.loanId,
    installmentNo: res.installmentNo || res.emi?.installmentNo || 0,
    customerName: res.customerName || "Customer",
    customerPhone: res.customerPhone || null,
    collectedAmount: res.collectedAmount || res.payment?.amount || "0",
    collectedAt: res.collectedAt || res.payment?.paidAt,
    paymentMode: res.payment?.mode || "CASH",
    paymentStatus: res.payment?.status || "",
    notes: res.notes || null,
    reconciled: Boolean(res.reconciled),
    reconciledAt: null,
    emiStatus: res.emi?.status,
    loanStatus: res.loan?.status,
    remainingLoanBalance: remaining,
    source: "collection",
  };
}

let activeViewingReceipt: HistoricalReceiptViewData | null = null;

export function setViewingReceipt(
  receipt: HistoricalReceiptViewData | null
): void {
  activeViewingReceipt = receipt;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      if (receipt) {
        storage.setItem("speedmoney_viewing_receipt", JSON.stringify(receipt));
      } else {
        storage.removeItem("speedmoney_viewing_receipt");
      }
    } catch {
      // ignore storage errors
    }
  }
}

export function getViewingReceipt(): HistoricalReceiptViewData | null {
  if (activeViewingReceipt) return activeViewingReceipt;
  const storage = getSessionStorageSafely();
  if (storage) {
    try {
      const stored = storage.getItem("speedmoney_viewing_receipt");
      if (stored) {
        activeViewingReceipt = JSON.parse(stored);
        return activeViewingReceipt;
      }
    } catch {
      return null;
    }
  }
  return null;
}


/**
 * Maps authoritative payment status to a receipt stamp label.
 * Only returns "PAID" when the payment status explicitly indicates success ("SUCCESS").
 * Returns uppercase labels for other recognized statuses (e.g. "PENDING", "FAILED", "REFUNDED", "CANCELLED"),
 * and returns "UNKNOWN" for missing, unrecognized, or null values.
 */
export function getReceiptStatusLabel(status?: string | null): string {
  if (!status || typeof status !== "string") {
    return "UNKNOWN";
  }
  const normalized = status.trim().toUpperCase();
  switch (normalized) {
    case "SUCCESS":
      return "PAID";
    case "PENDING":
      return "PENDING";
    case "FAILED":
      return "FAILED";
    case "REFUNDED":
      return "REFUNDED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
}

export type HistoryDateFilterOption = "All" | "Today" | "Last 7 Days" | "This Month";

export function getDateFilterRange(
  option: HistoryDateFilterOption
): { startDate?: string; endDate?: string } {
  const todayIST = getTodayIST();
  if (option === "Today") {
    return { startDate: todayIST, endDate: todayIST };
  }
  if (option === "Last 7 Days") {
    const startStr = getPastISTDate(6, todayIST);
    return { startDate: startStr, endDate: todayIST };
  }
  if (option === "This Month") {
    const startStr = `${todayIST.slice(0, 7)}-01`;
    return { startDate: startStr, endDate: todayIST };
  }
  return {};
}

export function formatISTDateTime(isoDate: string | Date): string {
  try {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Determines whether an API error represents an uncertain payment outcome
 * (e.g. network failure, timeout, or server error 5xx where the transaction
 * may or may not have committed on the authoritative backend).
 */
/* -------------------------------------------------------------------------
 * Persistent Recovery for Unresolved Cash Collections (Phase 3.2C.2 - 3.2C.4)
 * ------------------------------------------------------------------------- */

export interface PendingCollectionRecoveryRecord {
  agentUserId: string;
  loanId: string;
  emiId: string;
  amount: string;
  notes?: string;
  idempotencyKey: string;
  createdAt: number;
}

export interface StorageSaveResult {
  success: boolean;
  error?: string;
}

export interface StorageClearResult {
  success: boolean;
  error?: string;
}

const RECOVERY_STORAGE_PREFIX = "speedmoney_pending_recovery_";

export function getPendingRecoveryStorageKey(agentUserId: string): string {
  return `${RECOVERY_STORAGE_PREFIX}${agentUserId.trim()}`;
}

/**
 * Persists a cash collection attempt to browser localStorage and performs
 * mandatory read-back verification before any network request is dispatched.
 */
export function savePendingCollectionRecovery(
  record: PendingCollectionRecoveryRecord
): StorageSaveResult {
  const storage = getLocalStorageSafely();
  if (!storage) {
    return {
      success: false,
      error: "Local storage is not supported or accessible in this browser environment.",
    };
  }

  const agentUserId = record?.agentUserId ? String(record.agentUserId).trim() : "";
  if (!agentUserId) {
    return {
      success: false,
      error: "Authenticated agent identity is missing. Cannot persist recovery record.",
    };
  }

  if (
    !record.loanId ||
    !record.emiId ||
    !record.amount ||
    !record.idempotencyKey
  ) {
    return {
      success: false,
      error: "Incomplete collection details. Cannot persist recovery record.",
    };
  }

  const key = getPendingRecoveryStorageKey(agentUserId);

  try {
    const serialized = JSON.stringify(record);
    storage.setItem(key, serialized);

    // Read-back verification
    const readBack = storage.getItem(key);
    if (!readBack) {
      return {
        success: false,
        error: "Storage verification failed: record was not found after write.",
      };
    }

    const parsed = JSON.parse(readBack) as PendingCollectionRecoveryRecord;
    const isVerified =
      parsed &&
      parsed.agentUserId === agentUserId &&
      parsed.loanId === record.loanId &&
      parsed.emiId === record.emiId &&
      parsed.amount === record.amount &&
      parsed.idempotencyKey === record.idempotencyKey &&
      parsed.createdAt === record.createdAt;

    if (!isVerified) {
      try {
        storage.removeItem(key);
      } catch {}
      return {
        success: false,
        error: "Storage verification failed: persisted data does not match payload.",
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message
        ? `Storage access error: ${err.message}`
        : "Failed to access browser storage (quota exceeded or storage disabled).",
    };
  }
}

export function getPendingCollectionRecovery(
  agentUserId: string
): PendingCollectionRecoveryRecord | null {
  const storage = getLocalStorageSafely();
  if (!storage) return null;
  const trimmed = agentUserId ? String(agentUserId).trim() : "";
  if (!trimmed) return null;

  try {
    const key = getPendingRecoveryStorageKey(trimmed);
    const raw = storage.getItem(key);
    if (!raw) return null;
    const record = JSON.parse(raw) as PendingCollectionRecoveryRecord;
    if (
      record &&
      record.agentUserId === trimmed &&
      record.loanId &&
      record.emiId &&
      record.idempotencyKey &&
      record.amount
    ) {
      return record;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Removes the persistent recovery record from browser storage and performs
 * read-back verification to guarantee cleanup succeeded.
 */
export function clearPendingCollectionRecovery(
  agentUserId: string
): StorageClearResult {
  const storage = getLocalStorageSafely();
  if (!storage) {
    return {
      success: false,
      error: "Browser local storage is not accessible to clear recovery record.",
    };
  }

  const trimmed = agentUserId ? String(agentUserId).trim() : "";
  if (!trimmed) {
    return {
      success: false,
      error: "Missing authenticated agent identity to clear recovery record.",
    };
  }

  try {
    const key = getPendingRecoveryStorageKey(trimmed);
    storage.removeItem(key);

    // Read-back verification to guarantee persistent record was removed
    const remaining = storage.getItem(key);
    if (remaining !== null) {
      return {
        success: false,
        error: "Storage cleanup verification failed: recovery record is still present after removal.",
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message
        ? `Storage cleanup error: ${err.message}`
        : "Failed to remove recovery record from storage.",
    };
  }
}

/**
 * Ambiguous loan/EMI state error patterns that could have been caused by the
 * original collection transaction having succeeded on the server (e.g. paying off the EMI,
 * reducing balance to 0, or completing the loan) before the response reached the client.
 *
 * In the authoritative backend (routes/agent-cash-collections.js & payment-engine.js),
 * loan status, EMI status, and balance eligibility are checked BEFORE checking idempotency.
 * Thus, on replay, an already-committed transaction triggers these errors rather than 200 duplicate.
 * They must NEVER be treated as definitive rejections!
 */
const AMBIGUOUS_LOAN_STATE_PATTERNS = [
  "already fully paid",
  "no remaining outstanding balance",
  "cannot exceed emi outstanding",
  "cannot exceed loan outstanding",
  "cannot exceed outstanding amount",
  "loan is not eligible",
  "not eligible for collection",
  "not eligible for payment",
  "transaction id already exists",
];

/**
 * Recognized backend validation rejection patterns that establish the cash collection
 * was definitively rejected BEFORE or WITHOUT committing a payment transaction.
 *
 * These checks are static pre-conditions (missing fields, format errors, unassigned agent, entity not found, waived)
 * that could never be caused by the collection itself having succeeded.
 */
const KNOWN_DEFINITIVE_REJECTION_PATTERNS = [
  "loanid is required",
  "emiid is required",
  "amount is required",
  "decimal places",
  "greater than zero",
  "invalid idempotency-key",
  "agent profile not found",
  "your agent account is inactive",
  "active assignment",
  "loan not found",
  "emi not found",
  "emi does not belong",
  "waived and cannot be collected",
];

/**
 * Determines whether a collection error definitively proves the transaction
 * was NOT recorded on the server.
 *
 * Based on the authoritative backend implementation in routes/agent-cash-collections.js:
 * Only recognized 400, 403, and 404 validation responses that fail before database commit
 * establish that no payment record was created.
 *
 * Crucially:
 * - Ambiguous loan-state errors (EMI already paid, loan closed, balance exceeded) could be
 *   the result of the original transaction having committed, so they are classified as UNCERTAIN.
 * - "Transaction ID already exists" indicates a committed payment in the database, so it is UNCERTAIN.
 * - HTTP 408, 429, 5xx server errors, network drops (status 0), timeouts, or unclassified
 *   errors are treated conservatively as uncertain.
 */
export function isDefinitiveCollectionRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const status = (error as any).status;
  const message = String(
    (error as any).message || (error as any).data?.message || ""
  ).toLowerCase();

  // If the error message indicates a loan/EMI state change that could have been caused
  // by the original collection transaction successfully committing (or an existing transaction),
  // this is NOT a definitive rejection. The outcome remains uncertain.
  if (AMBIGUOUS_LOAN_STATE_PATTERNS.some((pattern) => message.includes(pattern))) {
    return false;
  }

  // Must be a recognized client pre-condition or authorization rejection (400, 403, 404)
  if (status === 400 || status === 403 || status === 404) {
    return KNOWN_DEFINITIVE_REJECTION_PATTERNS.some((pattern) =>
      message.includes(pattern)
    );
  }

  return false;
}

/**
 * Determines whether an API error represents an uncertain payment outcome
 * where the transaction may or may not have committed on the backend.
 */
export function isUncertainCollectionError(error: unknown): boolean {
  return !isDefinitiveCollectionRejection(error);
}
