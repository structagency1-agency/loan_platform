/**
 * Speed Money Admin API Client
 *
 * Authoritative API client for Admin Portal connected to loan_platform backend.
 * Provides typed methods for financial portfolio overview, loan application review workflow,
 * and collection oversight.
 */

import { api } from "./api";

export interface AdminFinancialOverview {
  success: boolean;
  generatedAt: string;
  businessDate: string;
  portfolio: {
    totalLoans: number;
    statusCounts: {
      PENDING_DISBURSEMENT?: number;
      ACTIVE: number;
      COMPLETED: number;
      OVERDUE: number;
      DEFAULTED: number;
      CLOSED: number;
    };
    totalPrincipalDisbursed: string;
    totalPrincipalPendingDisbursement?: string;
    totalScheduledRepayments: string;
    totalOutstandingEmiAmount: string;
    totalOverdueEmiAmount: string;
  };
  collections: {
    online: {
      totalAmount: string;
      count: number;
    };
    cash: {
      totalAmount: string;
      count: number;
      reconciledAmount: string;
      reconciledCount: number;
      unreconciledAmount: string;
      unreconciledCount: number;
    };
  };
  settlements: {
    unresolvedDiscrepancyCount: number;
    reconciledCount: number;
  };
}

export interface AdminLoanApplicationCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

/**
 * Safely normalizes customer object across response shapes
 * (handling both customer.name and customer.user.name).
 */
export function normalizeCustomer(rawCust: any): AdminLoanApplicationCustomer {
  if (!rawCust) {
    return { id: "", name: "Customer", email: "", phone: null };
  }
  return {
    id: rawCust.id || "",
    name: rawCust.name || rawCust.user?.name || "Customer",
    email: rawCust.email || rawCust.user?.email || "",
    phone: rawCust.phone || rawCust.user?.phone || null,
  };
}

export interface AdminLoanApplicationProduct {
  id: string;
  name: string;
}

export interface AdminLoanApplicationLoanInfo {
  id: string;
  loanNumber: string;
  status: string;
}

export interface AdminLoanApplicationItem {
  id: string;
  customer: AdminLoanApplicationCustomer;
  product: AdminLoanApplicationProduct;
  requestedAmount: string;
  requestedTenure: number;
  interestRate: string | null;
  purpose: string | null;
  status: string;
  rejectionReason: string | null;
  reviewNotes: string | null;
  submittedAt: string | null;
  createdAt: string;
  loan: AdminLoanApplicationLoanInfo | null;
}

export interface AdminLoanApplicationsResponse {
  success: boolean;
  count: number;
  applications: AdminLoanApplicationItem[];
}

export interface AdminReviewPayload {
  decision: "APPROVE" | "REJECT";
  interestRate?: number | string;
  rejectionReason?: string;
  reviewNotes?: string;
}

export interface AdminReviewResponse {
  success: boolean;
  message: string;
  application: {
    id: string;
    status: string;
    productName: string;
    requestedAmount: string;
    requestedTenure: number;
    interestRate?: string;
    rejectionReason?: string;
    reviewNotes?: string;
  };
}

export interface LoanProductItem {
  id: string;
  name: string;
  description: string | null;
  minAmount: string;
  maxAmount: string | null;
  minInterestRate: string;
  maxInterestRate: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  active: boolean;
}

export interface LoanProductsResponse {
  success: boolean;
  count: number;
  products: LoanProductItem[];
}

export interface AdminTodayCollectionsSummary {
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  summary: {
    totalCollectedAmount: string;
    collectionsCount: number;
    reconciledAmount: string;
    reconciledCount: number;
    unreconciledAmount: string;
    unreconciledCount: number;
  };
}

// Key for saving the selected application for detail/review
export const SELECTED_REVIEW_APP_KEY = "speedmoney_selected_review_app_id";

export function setSelectedReviewAppId(id: string): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(SELECTED_REVIEW_APP_KEY, id);
    } catch {}
  }
}

export function getSelectedReviewAppId(): string | null {
  if (typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramId = urlParams.get("id");
      if (paramId) return paramId;
      return sessionStorage.getItem(SELECTED_REVIEW_APP_KEY);
    } catch {}
  }
  return null;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in India Standard Time.
 */
export function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 3600000);
    return ist.toISOString().slice(0, 10);
  }
}

/**
 * Formats an ISO date string into Indian Standard Date display (e.g. 12 Oct 2026).
 */
export function formatISTDate(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return "—";
  }
}

/**
 * Fetch authoritative portfolio financial summary metrics.
 * GET /api/admin/financial-reports/overview
 */
export async function getAdminFinancialOverview(): Promise<AdminFinancialOverview> {
  return api.get<AdminFinancialOverview>("/admin/financial-reports/overview");
}

/**
 * Fetch all loan applications for administrator review.
 * Normalizes customer object structure.
 * GET /api/admin/loan-applications
 */
export async function getAdminLoanApplications(): Promise<AdminLoanApplicationsResponse> {
  const res = await api.get<AdminLoanApplicationsResponse>("/admin/loan-applications");
  if (res?.applications && Array.isArray(res.applications)) {
    res.applications = res.applications.map((app) => ({
      ...app,
      customer: normalizeCustomer(app.customer),
    }));
  }
  return res;
}

/**
 * Review (Approve or Reject) a loan application.
 * Follows exact backend rules in routes/admin-loan-review.js:
 * - Decision must be APPROVE or REJECT.
 * - Only SUBMITTED applications can be reviewed.
 * - APPROVE requires interestRate within product limits.
 * - REJECT requires rejectionReason.
 * PATCH /api/admin/loan-applications/:id/review
 */
export async function reviewAdminLoanApplication(
  id: string,
  payload: AdminReviewPayload
): Promise<AdminReviewResponse> {
  return api.patch<AdminReviewResponse>(`/admin/loan-applications/${id}/review`, payload);
}

/**
 * Fetch active loan products for interest rate boundaries.
 * GET /api/loan-products
 */
export async function getActiveLoanProducts(): Promise<LoanProductsResponse> {
  return api.get<LoanProductsResponse>("/loan-products", { skipAuth: true });
}

/**
 * Fetch cash collections summary for a specific business date range (defaults to today IST).
 * GET /api/admin/cash-collections
 */
export async function getAdminCollectionsSummary(dateStr?: string): Promise<AdminTodayCollectionsSummary> {
  const targetDate = dateStr || getTodayIST();
  return api.get<AdminTodayCollectionsSummary>("/admin/cash-collections", {
    params: {
      startDate: targetDate,
      endDate: targetDate,
      page: 1,
      limit: 1,
    },
  });
}


export interface AdminCreatedLoan {
  id: string;
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
  disbursedAt: string | null;
  disbursementReference: string | null;
  disbursementProofUrl: string | null;
  status: string; // "PENDING_DISBURSEMENT" | "ACTIVE"
  emiCount: number;
}

export interface AdminCreateLoanResponse {
  success: boolean;
  message: string;
  loan: AdminCreatedLoan;
  emiSchedule?: any[];
}

/**
 * Create a loan in PENDING_DISBURSEMENT status from an approved application.
 * Follows exact backend rules in routes/admin-loan-creation.js:
 * - Application must be APPROVED
 * - Application must have an interestRate
 * - Idempotency: duplicate creation blocked with 409 Conflict
 * POST /api/admin/loan-applications/:id/create-loan
 */
export async function createAdminLoan(
  applicationId: string
): Promise<AdminCreateLoanResponse> {
  return api.post<AdminCreateLoanResponse>(
    `/admin/loan-applications/${applicationId}/create-loan`
  );
}

export interface AdminDisbursementProofPayload {
  fileBuffer?: any;
  base64Content?: string;
  fileName?: string;
  mimeType?: string;
}

export interface AdminDisbursementPayload {
  disbursementReference: string;
  disbursedAt?: string;
  proof?: AdminDisbursementProofPayload | string;
}

export interface AdminDisburseLoanResponse {
  success: boolean;
  message: string;
  loan: AdminCreatedLoan;
  emiSchedule: any[];
}

/**
 * Disburse and activate a loan.
 * Fails closed with 503 STORAGE_NOT_CONFIGURED when durable private proof storage is not operational.
 * POST /api/admin/loan-applications/:id/disburse
 */
export async function disburseAdminLoan(
  idOrApplicationId: string,
  payload: AdminDisbursementPayload
): Promise<AdminDisburseLoanResponse> {
  return api.post<AdminDisburseLoanResponse>(
    `/admin/loan-applications/${idOrApplicationId}/disburse`,
    payload
  );
}

export interface AdminPortfolioLoanItem {
  id: string;
  loanNumber: string;
  status: string; // "PENDING_DISBURSEMENT" | "ACTIVE" | "COMPLETED" | "OVERDUE" | "DEFAULTED" | "CLOSED"
  principalAmount: string;
  totalPayable: string;
  outstandingAmount: string;
  totalRepaidAmount: string;
  overdueAmount: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  product: { id: string; name: string } | null;
  customer: {
    name: string;
    phone: string | null;
  };
  emisSummary: {
    totalEmis: number;
    paidEmis: number;
    overdueEmis: number;
  };
}

export interface AdminLoanPortfolioResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  loans: AdminPortfolioLoanItem[];
  byProduct?: any[];
}

/**
 * Fetch paginated loan portfolio with status filtering.
 * GET /api/admin/financial-reports/loan-portfolio
 */
export async function getAdminLoanPortfolio(params?: {
  page?: number;
  limit?: number;
  status?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AdminLoanPortfolioResponse> {
  return api.get<AdminLoanPortfolioResponse>(
    "/admin/financial-reports/loan-portfolio",
    { params }
  );
}
