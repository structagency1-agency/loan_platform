


import { useState, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, Wallet, Send, CalendarDays, CreditCard, UserCheck, HandCoins, FolderLock, BarChart3, Bell, Settings, ScrollText,
  Search, Plus, Upload, Eye, Check, X, Download, IndianRupee, AlertTriangle, TrendingUp, Clock, FileSpreadsheet, ShieldCheck, Menu, ChevronRight, LogOut, CheckCircle2, XCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { ALink, Logo, Button, btn, Card, Badge, Field, Input, Select, Chips, Tabs, Table, Pagination, KV, IconTile, EmptyState, inputCls } from "@/components/sm/ui";
import { customers, applications, agents, monthly, emis, inr } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { loginApi, getStoredUser, setAuthToken, setStoredUser, clearAuth, fetchCurrentUser, type AuthUser } from "@/lib/api";
import {
  getAdminFinancialOverview,
  getAdminLoanApplications,
  getAdminCollectionsSummary,
  reviewAdminLoanApplication,
  createAdminLoan,
  disburseAdminLoan,
  getAdminLoanPortfolio,
  getActiveLoanProducts,
  setSelectedReviewAppId,
  getSelectedReviewAppId,
  getTodayIST,
  formatISTDate,
  type AdminFinancialOverview,
  type AdminLoanApplicationItem,
  type AdminTodayCollectionsSummary,
  type LoanProductItem,
  type AdminCreatedLoan,
  type AdminPortfolioLoanItem,
} from "@/lib/admin-api";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

const side: [typeof Users, string, string][] = [
  [LayoutDashboard, "Dashboard", "dashboard"], [Users, "Customers", "customers"], [FileText, "Applications", "applications"], [Wallet, "Loans", "loans"],
  [Send, "Disbursements", "disbursement"], [CalendarDays, "EMIs", "emis"], [CreditCard, "Payments", "payments"], [UserCheck, "Agents", "agents"],
  [HandCoins, "Cash Collections", "cash"], [FolderLock, "Documents", "documents"], [BarChart3, "Reports", "reports"], [Bell, "Notifications", "notifications"],
  [Settings, "Settings", "settings"], [ScrollText, "Audit Logs", "audit"],
];
const groupOf: Record<string, string> = { "add-customer": "customers", import: "customers", customer: "customers", "application-review": "applications", loan: "loans", assignment: "agents", ledger: "cash" };

function AdminHeaderUser() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "AD";
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-primary-foreground">{initials}</div>
        <div className="hidden text-sm sm:block">
          <p className="font-semibold text-navy">{user?.name || "Administrator"}</p>
          <p className="text-[11px] text-muted-foreground">{user?.email || "admin@loanplatform.com"}</p>
        </div>
      </div>
      <button
        onClick={() => {
          logout();
          nav({ to: "/admin/$screen", params: { screen: "login" } });
        }}
        title="Sign out of Admin Console"
        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-destructive transition"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </div>
  );
}

function Shell({ title, sub, actions, children }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cur = path.split("/")[2] ?? "dashboard";
  const active = groupOf[cur] ?? cur;
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-30 w-64 shrink-0 flex-col border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen", open ? "flex" : "hidden")}>
        <div className="flex h-16 items-center px-5"><Logo size="sm" /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {side.map(([I, l, s]) => (
            <ALink key={s} s={s} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active === s ? "bg-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-navy")}><I className="h-[18px] w-[18px]" />{l}</ALink>
          ))}
        </nav>
        <div className="m-3 rounded-xl bg-soft p-3 text-xs"><p className="font-semibold text-navy">Speed Money Finance</p><p className="text-muted-foreground">Kochi branch · Admin</p></div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-navy/30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card/90 px-6 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5 text-navy" /></button>
          <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input placeholder="Search customers, loans, applications…" className={cn(inputCls, "h-10 bg-muted/60 pl-9")} /></div>
          <ALink s="notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-border"><Bell className="h-5 w-5 text-navy" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" /></ALink>
          <AdminHeaderUser />
        </header>
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-navy">{title}</h1>{sub && <p className="text-sm text-muted-foreground">{sub}</p>}</div><div className="flex flex-wrap gap-2">{actions}</div></div>
          {children}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: I, tone = "info", delta }: { label: string; value: string; icon: typeof Users; tone?: "info" | "success" | "warning" | "danger"; delta?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between"><p className="text-xs font-semibold text-muted-foreground">{label}</p><IconTile icon={I} tone={tone} /></div>
      <p className="mt-2 text-xl font-extrabold text-navy tnum 2xl:text-2xl">{value}</p>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
    </Card>
  );
}
const Panel = ({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <Card className={cn("overflow-hidden", className)}><div className="flex items-center justify-between border-b border-border px-5 py-4"><h3 className="font-bold text-navy">{title}</h3>{action}</div>{children}</Card>
);
const viewBtn = (s: string, label = "View") => <ALink s={s} className="text-xs font-semibold text-primary hover:underline">{label}</ALink>;
const FilterBar = ({
  opts,
  value,
  onChange,
}: {
  opts: string[];
  value?: string;
  onChange?: (v: string) => void;
}) => {
  const [internalV, setInternalV] = useState("All");
  const currentVal = value !== undefined ? value : internalV;
  const handleChange = (v: string) => {
    if (value === undefined) setInternalV(v);
    onChange?.(v);
  };
  return <Chips options={["All", ...opts]} value={currentVal} onChange={handleChange} />;
};
const chart = { tick: { fontSize: 12, fill: "var(--muted-foreground)" } };

function Dashboard() {
  const nav = useNavigate();
  const [overview, setOverview] = useState<AdminFinancialOverview | null>(null);
  const [applications, setApplications] = useState<AdminLoanApplicationItem[]>([]);
  const [todayCollections, setTodayCollections] = useState<AdminTodayCollectionsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeReqRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboardData = useCallback(() => {
    const requestId = ++activeReqRef.current;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getAdminFinancialOverview(),
      getAdminLoanApplications(),
      getAdminCollectionsSummary(),
    ])
      .then(([overviewRes, appsRes, collsRes]) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;

        // Check if all endpoints rejected
        if (
          overviewRes.status === "rejected" &&
          appsRes.status === "rejected" &&
          collsRes.status === "rejected"
        ) {
          setError(
            (overviewRes.reason as any)?.message ||
              "Failed to load administrative dashboard data."
          );
          setLoading(false);
          return;
        }

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value);
        }
        if (appsRes.status === "fulfilled") {
          setApplications(appsRes.value?.applications || []);
        }
        if (collsRes.status === "fulfilled") {
          setTodayCollections(collsRes.value);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setError(err?.message || "Failed to load administrative dashboard data.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics from verified API responses
  const activeLoansCount = overview?.portfolio?.statusCounts?.ACTIVE ?? 0;
  const totalLoansCount = overview?.portfolio?.totalLoans ?? 0;
  const outstandingAmount = parseFloat(overview?.portfolio?.totalOutstandingEmiAmount || "0");
  const overdueAmount = parseFloat(overview?.portfolio?.totalOverdueEmiAmount || "0");

  const pendingApplications = applications.filter((a) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(a.status?.toUpperCase())
  );
  const pendingCount = pendingApplications.length;

  const todayCollectedAmount = parseFloat(
    todayCollections?.summary?.totalCollectedAmount || "0"
  );
  const todayCollectionsCount = todayCollections?.summary?.collectionsCount ?? 0;

  const subText = loading
    ? "Loading verified platform metrics..."
    : overview?.businessDate
    ? `Business Date: ${overview.businessDate} • Live Database Metrics`
    : "Live Administrator Overview";

  return (
    <Shell title="Dashboard" sub={subText}>
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 6 Key Stat Cards: authoritatively sourced from real backend endpoints */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {/* Total Customers: Explicitly labeled as unsupported by backend */}
        <Stat
          label="Total Customers"
          value="—"
          icon={Users}
          delta="No backend endpoint"
          tone="info"
        />

        <Stat
          label="Active Loans"
          value={loading ? "..." : String(activeLoansCount)}
          icon={Wallet}
          tone="success"
          delta={overview ? `${totalLoansCount} portfolio loans` : undefined}
        />

        <Stat
          label="Pending Applications"
          value={loading ? "..." : String(pendingCount)}
          icon={FileText}
          tone="warning"
          delta={applications.length ? `${applications.length} total applications` : undefined}
        />

        <Stat
          label="Today's Collections"
          value={loading ? "..." : inr(todayCollectedAmount)}
          icon={IndianRupee}
          tone="success"
          delta={todayCollections ? `${todayCollectionsCount} cash payments` : undefined}
        />

        <Stat
          label="Outstanding Amount"
          value={loading ? "..." : inr(outstandingAmount)}
          icon={TrendingUp}
          delta="Active portfolio EMI balance"
        />

        <Stat
          label="Overdue Amount"
          value={loading ? "..." : inr(overdueAmount)}
          icon={AlertTriangle}
          tone="danger"
          delta="Past due EMI balance"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Pending Applications Panel: Real Live Backend Data */}
        <Panel
          title="Pending Applications"
          action={viewBtn("applications", "View all")}
          className="xl:col-span-2"
        >
          {loading ? (
            <div className="flex h-36 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No pending loan applications awaiting review.
            </div>
          ) : (
            <Table
              cols={["Application", "Customer", "Product", "Amount", "Status", ""]}
              rows={pendingApplications.slice(0, 5).map((a) => [
                <span className="font-mono text-xs font-semibold">{a.id}</span>,
                <div>
                  <span className="font-semibold block text-navy">{a.customer?.name || "Customer"}</span>
                  <span className="text-[11px] text-muted-foreground">{a.customer?.phone || a.customer?.email || "—"}</span>
                </div>,
                a.product?.name || "Loan Product",
                inr(parseFloat(a.requestedAmount || "0")),
                <Badge>{a.status}</Badge>,
                <button
                  onClick={() => {
                    setSelectedReviewAppId(a.id);
                    nav({ to: "/admin/$screen", params: { screen: "application-review" } });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Review
                </button>,
              ])}
            />
          )}
        </Panel>

        {/* Agent Cash Summary (Phase 4.4 settlement integration pending) */}
        <Panel title="Agent Cash Summary" action={viewBtn("cash")}>
          <div className="divide-y divide-border">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{a.name}</p>
                  <p className="text-xs text-muted-foreground">Collected {inr(a.today)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-navy tnum">{inr(a.held)}</p>
                  <p className="text-[11px] text-muted-foreground">held</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent Disbursements (Phase 4.3 disbursement integration pending) */}
        <Panel title="Recent Disbursements" action={viewBtn("disbursement")}>
          <div className="divide-y divide-border">
            {[["Sunita Bai", 65000, "01 Oct"], ["Naveen Raj", 120000, "30 Sep"], ["Kavita Joshi", 40000, "29 Sep"]].map(([n, a, d]) => (
              <div key={n as string} className="flex justify-between px-5 py-3 text-sm">
                <span className="font-semibold text-navy">{n}</span>
                <span className="tnum text-navy">
                  {inr(a as number)} <span className="text-xs text-muted-foreground">• {d}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Today's Collections Chart */}
        <Panel title="Today's Collections" action={viewBtn("payments")}>
          <div className="h-[180px] p-4">
            <ResponsiveContainer>
              <BarChart data={[{ h: "9a", v: 12 }, { h: "11a", v: 24 }, { h: "1p", v: 18 }, { h: "3p", v: 21 }, { h: "5p", v: 9 }]}>
                <XAxis dataKey="h" {...chart} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="v" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Overdue Loans Panel */}
        <Panel title="Overdue Loans" action={viewBtn("emis")}>
          <div className="divide-y divide-border">
            {customers
              .filter((c) => c.status === "Overdue")
              .concat(customers.slice(4, 5))
              .map((c) => (
                <div key={c.id} className="flex justify-between px-5 py-3 text-sm">
                  <span className="font-semibold text-navy">{c.name}</span>
                  <span className="font-semibold text-destructive tnum">{inr(c.emi)}</span>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

function CustomersScreen() {
  return (
    <Shell title="Customers" sub="250 customers" actions={<><ALink s="import" className={btn("outline", "sm")}><Upload className="h-4 w-4" />Import Customers</ALink><ALink s="add-customer" className={btn("primary", "sm")}><Plus className="h-4 w-4" />Add Customer</ALink></>}>
      <FilterBar opts={["Active", "Inactive", "Existing", "New"]} />
      <Card className="overflow-hidden">
        <Table cols={["Customer ID", "Name", "Mobile", "Active Loan", "Outstanding", "Next EMI", "Status", "Actions"]} rows={customers.map((c) => [<span className="font-mono text-xs">{c.id}</span>, <span className="font-semibold">{c.name}</span>, c.mobile, c.loan ? inr(c.loan) : "—", c.outstanding ? inr(c.outstanding) : "—", c.emi ? c.due : "—", <Badge>{c.status}</Badge>, viewBtn("customer")])} />
        <Pagination total={250} />
      </Card>
    </Shell>
  );
}

function AddCustomer() {
  return (
    <Shell title="Add Customer" sub="Create a new customer profile" actions={<ALink s="customers" className={btn("outline", "sm")}>Cancel</ALink>}>
      <Card className="max-w-3xl p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Customer ID"><Input defaultValue="CUS-10332" /></Field><Field label="Name"><Input placeholder="Full name" /></Field>
          <Field label="Mobile"><Input placeholder="+91" /></Field><Field label="Email"><Input placeholder="name@example.in" /></Field>
          <Field label="DOB"><Input type="date" /></Field><Field label="Status"><Select options={["Active", "Inactive"]} /></Field>
          <div className="md:col-span-2"><Field label="Address"><Input placeholder="House, street, city, PIN" /></Field></div>
        </div>
        <div className="mt-6 flex justify-end gap-2"><ALink s="customers" className={btn("outline")}>Cancel</ALink><ALink s="customer" className={btn("primary")}>Create Customer</ALink></div>
      </Card>
    </Shell>
  );
}

function Import() {
  const [stage, setStage] = useState(0);
  return (
    <Shell title="Import Customers" sub="Bulk upload from Excel">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <button onClick={() => setStage(1)} className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-input bg-muted/40 p-10 text-center">
            <IconTile icon={FileSpreadsheet} tone={stage ? "success" : "info"} />
            {stage ? <p className="text-sm font-semibold text-success">customers_oct_2026.xlsx · 48 rows</p> : <><p className="text-sm font-semibold text-navy">Drag & drop your Excel file here</p><p className="text-xs text-muted-foreground">.xlsx or .csv · up to 5,000 rows</p></>}
          </button>
          <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" onClick={() => setStage(1)}><Upload className="h-4 w-4" />Upload File</Button><Button variant="secondary" size="sm" disabled={stage < 1} onClick={() => setStage(2)}>Validate</Button><Button size="sm" disabled={stage < 2}>Import Customers</Button></div>
        </Card>
        <Card className="p-6"><h3 className="font-bold text-navy">Expected columns</h3><ul className="mt-3 space-y-2 text-sm">{["customer_id", "name", "mobile", "email", "dob", "address", "status"].map((c) => <li key={c} className="flex items-center gap-2 font-mono text-xs text-navy"><Check className="h-3.5 w-3.5 text-success" />{c}</li>)}</ul></Card>
      </div>
      {stage > 0 && (
        <Panel title="Preview" action={stage === 2 ? <Badge tone="success">46 valid · 2 errors</Badge> : <Badge tone="info">Not validated</Badge>}>
          <Table cols={["Row", "Customer ID", "Name", "Mobile", "Status", "Validation"]} rows={customers.slice(0, 6).map((c, i) => [i + 1, c.id, c.name, i === 3 ? "98765" : c.mobile, c.status, stage === 2 ? (i === 3 ? <Badge tone="danger">Invalid mobile</Badge> : <Badge tone="success">OK</Badge>) : "—"])} />
        </Panel>
      )}
    </Shell>
  );
}

function CustomerDetail() {
  const [t, setT] = useState("Overview");
  return (
    <Shell title="Harun R" sub="CUS-10248 · Customer since May 2026" actions={<><Badge tone="success">KYC Verified</Badge></>}>
      <Tabs options={["Overview", "Loans", "Payments", "Documents", "Activity"]} value={t} onChange={setT} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5"><h3 className="font-bold text-navy">Profile</h3><div className="mt-2 divide-y divide-border"><KV k="Mobile" v="+91 98765 43210" /><KV k="Email" v="harun.r@example.in" /><KV k="DOB" v="14 Apr 1992" /><KV k="City" v="Kochi, Kerala" /><KV k="Assigned agent" v="Ravi Shankar" /></div></Card>
        <Panel title="Active Loans" className="xl:col-span-2"><Table cols={["Loan ID", "Product", "Principal", "Outstanding", "Next EMI", "Status", ""]} rows={[["SM-LN-2026-0418", "Personal & Emergency", inr(50000), inr(38500), "05 Oct 2026", <Badge>Active</Badge>, viewBtn("loan")]]} /></Panel>
        <Panel title="Payment History" className="xl:col-span-2"><Table cols={["EMI", "Amount", "Date", "Method", "Status"]} rows={emis.slice(0, 4).map((e) => [`#${String(e.no).padStart(2, "0")}`, inr(e.amount), e.date, e.no === 2 ? "Cash" : "UPI", <Badge>Paid</Badge>])} /></Panel>
        <Panel title="Documents"><div className="divide-y divide-border">{["PAN Card", "Aadhaar", "Bank Statement", "Loan Agreement"].map((d) => <div key={d} className="flex items-center justify-between px-5 py-3 text-sm"><span className="flex items-center gap-2 text-navy"><FileText className="h-4 w-4 text-primary" />{d}</span><Badge>Verified</Badge></div>)}</div></Panel>
      </div>
    </Shell>
  );
}

function Applications() {
  const nav = useNavigate();
  const [applications, setApplications] = useState<AdminLoanApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const isMountedRef = useRef<boolean>(true);
  const activeReqRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadApplications = useCallback(() => {
    const requestId = ++activeReqRef.current;
    setLoading(true);
    setError(null);

    getAdminLoanApplications()
      .then((res) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setApplications(res?.applications || []);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setError(err?.message || "Failed to load loan applications.");
        setApplications([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Client-side filtering and search over backend records
  const filtered = applications.filter((a) => {
    // Status filter
    if (statusFilter !== "All") {
      const normFilter = statusFilter.toLowerCase().replace(/[\s_]+/g, "");
      const normStatus = (a.status || "").toLowerCase().replace(/[\s_]+/g, "");
      if (normFilter === "submitted" && normStatus !== "submitted") return false;
      if (normFilter === "underreview" && normStatus !== "underreview") return false;
      if (normFilter === "approved" && normStatus !== "approved") return false;
      if (normFilter === "rejected" && normStatus !== "rejected") return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (a.customer?.name || "").toLowerCase();
      const email = (a.customer?.email || "").toLowerCase();
      const phone = (a.customer?.phone || "").toLowerCase();
      const id = (a.id || "").toLowerCase();
      const product = (a.product?.name || "").toLowerCase();
      if (
        !name.includes(q) &&
        !email.includes(q) &&
        !phone.includes(q) &&
        !id.includes(q) &&
        !product.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter((a) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(a.status?.toUpperCase())
  ).length;

  const totalFiltered = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const subText = loading
    ? "Loading applications from backend..."
    : `${pendingCount} awaiting action • ${totalFiltered} total applications`;

  return (
    <Shell title="Applications" sub={subText}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          opts={["Submitted", "Under Review", "Approved", "Rejected"]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search applicant, phone, or ID..."
            className={cn(inputCls, "h-9 pl-9 text-xs")}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadApplications}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Fetching loan applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              icon={FileText}
              title="No loan applications found"
              sub={
                search || statusFilter !== "All"
                  ? "Try adjusting your search criteria or status filter."
                  : "New customer applications will appear here once submitted."
              }
            />
          </div>
        ) : (
          <>
            <Table
              cols={[
                "Application ID",
                "Customer",
                "Loan Type",
                "Amount",
                "Submitted",
                "Status",
                "Action",
              ]}
              rows={pageRows.map((a) => [
                <span className="font-mono text-xs font-semibold">{a.id}</span>,
                <div>
                  <span className="font-semibold block text-navy">
                    {a.customer?.name || "Customer"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {a.customer?.phone || a.customer?.email || "—"}
                  </span>
                </div>,
                <span>{a.product?.name || "Loan Product"}</span>,
                <span className="font-semibold">
                  {inr(parseFloat(a.requestedAmount || "0"))}
                </span>,
                <span className="text-xs text-muted-foreground">
                  {formatISTDate(a.submittedAt || a.createdAt)}
                </span>,
                <Badge>{a.status}</Badge>,
                <button
                  onClick={() => {
                    setSelectedReviewAppId(a.id);
                    nav({ to: "/admin/$screen", params: { screen: "application-review" } });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Review
                </button>,
              ])}
            />
            <Pagination
              total={totalFiltered}
              page={page}
              limit={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}

function AppReview() {
  const nav = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(() => getSelectedReviewAppId());
  const [application, setApplication] = useState<AdminLoanApplicationItem | null>(null);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Review modal/dialog form state
  const [activeAction, setActiveAction] = useState<"APPROVE" | "REJECT" | "CREATE_LOAN" | null>(null);
  const [interestRateInput, setInterestRateInput] = useState<string>("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");
  const [reviewNotesInput, setReviewNotesInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const activeReqRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadApplicationDetail = useCallback(() => {
    const requestId = ++activeReqRef.current;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getAdminLoanApplications(),
      getActiveLoanProducts(),
    ])
      .then(([appsRes, prodsRes]) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;

        let loadedProducts: LoanProductItem[] = [];
        if (prodsRes.status === "fulfilled" && prodsRes.value?.products) {
          loadedProducts = prodsRes.value.products;
          setProducts(loadedProducts);
        }

        if (appsRes.status === "rejected") {
          setError(
            (appsRes.reason as any)?.message ||
              "Failed to load application details from server."
          );
          setLoading(false);
          return;
        }

        const allApps = appsRes.value?.applications || [];
        if (allApps.length === 0) {
          setApplication(null);
          setLoading(false);
          return;
        }

        // Strict ID resolution: Load ONLY the exact application matching currentTargetId
        const currentTargetId = (selectedId || getSelectedReviewAppId() || "").trim();
        const matched = currentTargetId
          ? allApps.find((a) => a.id === currentTargetId) || null
          : null;

        setApplication(matched);

        // Pre-fill interest rate default from matching product limits
        if (matched) {
          const prod = loadedProducts.find((p) => p.id === matched.product?.id || p.name === matched.product?.name);
          if (prod && !matched.interestRate) {
            setInterestRateInput(prod.minInterestRate || "14");
          } else if (matched.interestRate) {
            setInterestRateInput(matched.interestRate);
          }
        }

        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setError(err?.message || "Failed to load application details.");
        setLoading(false);
      });
  }, [selectedId]);

  useEffect(() => {
    loadApplicationDetail();
  }, [loadApplicationDetail]);

  const matchedProduct = products.find(
    (p) => p.id === application?.product?.id || p.name === application?.product?.name
  );

  // Handle APPROVE submit
  const handleApproveSubmit = async () => {
    if (!application) return;
    if (submitting) return; // Prevent duplicate submit

    const rateNum = parseFloat(interestRateInput);
    if (!interestRateInput || isNaN(rateNum) || rateNum <= 0) {
      setActionError("A valid positive interest rate is required to approve.");
      return;
    }

    if (matchedProduct) {
      const minRate = parseFloat(matchedProduct.minInterestRate);
      const maxRate = parseFloat(matchedProduct.maxInterestRate);
      if (rateNum < minRate) {
        setActionError(`Interest rate cannot be below ${minRate}% for this product.`);
        return;
      }
      if (rateNum > maxRate) {
        setActionError(`Interest rate cannot exceed ${maxRate}% for this product.`);
        return;
      }
    }

    setSubmitting(true);
    setActionError(null);

    try {
      await reviewAdminLoanApplication(application.id, {
        decision: "APPROVE",
        interestRate: String(rateNum),
        reviewNotes: reviewNotesInput.trim() || undefined,
      });

      if (!isMountedRef.current) return;
      setActionSuccess(`Application ${application.id} approved successfully at ${rateNum}% p.a.`);
      setActiveAction(null);
      // Update local application status immediately
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: "APPROVED",
              interestRate: String(rateNum),
              reviewNotes: reviewNotesInput.trim() || null,
              rejectionReason: null,
            }
          : null
      );
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setActionError(err?.message || "Failed to approve application.");
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  // Handle REJECT submit
  const handleRejectSubmit = async () => {
    if (!application) return;
    if (submitting) return; // Prevent duplicate submit

    if (!rejectionReasonInput.trim()) {
      setActionError("Rejection reason is required by credit policy.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      await reviewAdminLoanApplication(application.id, {
        decision: "REJECT",
        rejectionReason: rejectionReasonInput.trim(),
        reviewNotes: reviewNotesInput.trim() || undefined,
      });

      if (!isMountedRef.current) return;
      setActionSuccess(`Application ${application.id} has been marked as Rejected.`);
      setActiveAction(null);
      // Update local application status immediately
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: "REJECTED",
              rejectionReason: rejectionReasonInput.trim(),
              reviewNotes: reviewNotesInput.trim() || null,
            }
          : null
      );
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setActionError(err?.message || "Failed to reject application.");
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  // Handle CREATE_LOAN submit (Workstream 1)
  const handleCreateLoanSubmit = async () => {
    if (!application) return;
    if (submitting) return; // Prevent duplicate submit

    if (application.status?.toUpperCase() !== "APPROVED") {
      setActionError("Only approved applications can be converted into loans.");
      return;
    }

    if (application.loan) {
      setActionError("A loan has already been created for this application.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await createAdminLoan(application.id);

      if (!isMountedRef.current) return;
      const createdLoan = res.loan;
      setActionSuccess(
        `Loan ${createdLoan.loanNumber} created successfully in ${createdLoan.status} status (${inr(parseFloat(createdLoan.principalAmount))}).`
      );
      setActiveAction(null);

      // Update local application state with new linked loan immediately
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              loan: {
                id: createdLoan.id,
                loanNumber: createdLoan.loanNumber,
                status: createdLoan.status,
              },
            }
          : null
      );

      // Refresh application detail from backend
      loadApplicationDetail();
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setActionError(err?.message || "Failed to create loan.");
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const isSubmitted = application?.status?.toUpperCase() === "SUBMITTED";
  const isApproved = application?.status?.toUpperCase() === "APPROVED";
  const isRejected = application?.status?.toUpperCase() === "REJECTED";

  const subTitle = application
    ? `Submitted ${formatISTDate(application.submittedAt || application.createdAt)} • ${application.product?.name || "Loan Application"}`
    : "Loan Application Review";

  return (
    <Shell
      title={application ? application.id : "Application Review"}
      sub={subTitle}
      actions={
        application && (
          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setActiveAction("REJECT");
                    setActionError(null);
                  }}
                  disabled={submitting}
                >
                  <X className="h-4 w-4" /> Reject Application
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setActiveAction("APPROVE");
                    setActionError(null);
                  }}
                  disabled={submitting}
                >
                  <Check className="h-4 w-4" /> Approve Application
                </Button>
              </>
            ) : isApproved ? (
              <div className="flex items-center gap-2">
                <Badge tone="success">Approved</Badge>
                {application.loan ? (
                  <Badge tone="warning">
                    Linked: {application.loan.loanNumber} ({application.loan.status})
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveAction("CREATE_LOAN");
                      setActionError(null);
                    }}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" /> Create Loan
                  </Button>
                )}
              </div>
            ) : isRejected ? (
              <Badge tone="danger">Rejected</Badge>
            ) : (
              <Badge>{application.status}</Badge>
            )}
          </div>
        )
      }
    >
      {/* Top Error Alert with Retry */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadApplicationDetail}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-2xl bg-success-soft p-4 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-semibold text-navy">{actionSuccess}</p>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs font-semibold text-muted-foreground hover:text-navy"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Review Dialog Card: APPROVE */}
      {activeAction === "APPROVE" && (
        <Card className="border-success/30 bg-success-soft/20 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="font-bold text-navy">Approve Loan Application</h3>
            </div>
            <button
              onClick={() => setActiveAction(null)}
              className="text-muted-foreground hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {actionError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              {actionError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={
                matchedProduct
                  ? `Approved Interest Rate (% p.a.) [Allowed: ${matchedProduct.minInterestRate}% – ${matchedProduct.maxInterestRate}%]`
                  : "Approved Interest Rate (% p.a.)"
              }
            >
              <Input
                type="number"
                step="0.1"
                value={interestRateInput}
                onChange={(e) => setInterestRateInput(e.target.value)}
                placeholder="e.g. 14.5"
                disabled={submitting}
              />
            </Field>

            <Field label="Review Notes (Optional)">
              <Input
                value={reviewNotesInput}
                onChange={(e) => setReviewNotesInput(e.target.value)}
                placeholder="e.g. KYC verified, credit approved"
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveAction(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleApproveSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Approving...
                </>
              ) : (
                "Confirm Approval"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Review Dialog Card: REJECT */}
      {activeAction === "REJECT" && (
        <Card className="border-destructive/30 bg-destructive/10 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-bold text-navy">Reject Loan Application</h3>
            </div>
            <button
              onClick={() => setActiveAction(null)}
              className="text-muted-foreground hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {actionError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              {actionError}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Rejection Reason (Required)">
              <Input
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Ineligible income criteria / incomplete documentation"
                disabled={submitting}
              />
            </Field>

            <Field label="Review Notes (Optional)">
              <Input
                value={reviewNotesInput}
                onChange={(e) => setReviewNotesInput(e.target.value)}
                placeholder="Internal notes for audit trail"
                disabled={submitting}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveAction(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Review Dialog Card: CREATE_LOAN (Workstream 1) */}
      {activeAction === "CREATE_LOAN" && application && (
        <Card className="border-primary/30 bg-primary/5 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-navy">Confirm Loan Creation</h3>
            </div>
            <button
              onClick={() => setActiveAction(null)}
              className="text-muted-foreground hover:text-navy"
              disabled={submitting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Generate an authoritative loan record in <span className="font-semibold text-navy">PENDING_DISBURSEMENT</span> status from this approved application. Repayment terms will be locked, while repayment clock and EMI generation remain paused until disbursement activation with verified proof.
          </p>

          {actionError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              {actionError}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4 divide-y divide-border text-xs">
            <KV k="Application ID" v={application.id} />
            <KV k="Applicant Name" v={application.customer?.name || "Customer"} />
            <KV k="Product" v={application.product?.name || "Loan Product"} />
            <KV k="Principal Amount" v={inr(parseFloat(application.requestedAmount || "0"))} strong />
            <KV k="Approved Rate" v={application.interestRate ? `${application.interestRate}% p.a.` : "—"} strong />
            <KV k="Requested Tenure" v={`${application.requestedTenure} months`} />
            <KV k="Target Loan Status" v={<Badge tone="warning">PENDING_DISBURSEMENT</Badge>} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveAction(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateLoanSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating Loan...
                </>
              ) : (
                "Confirm & Create Loan"
              )}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading application review record...</p>
        </div>
      ) : !application ? (
        <div className="py-16 text-center">
          <EmptyState
            icon={FileText}
            title={
              (selectedId || getSelectedReviewAppId())
                ? "Application not found or no longer available"
                : "No application selected"
            }
            sub={
              (selectedId || getSelectedReviewAppId())
                ? "The requested application record could not be found or may have been removed. Please select an application from the Applications list."
                : "Please select an application from the Applications list to review."
            }
          />
          <div className="mt-4">
            <ALink s="applications" className={btn("primary", "sm")}>
              Go to Applications List
            </ALink>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid gap-6 md:grid-cols-2 xl:col-span-2">
            {/* Customer Information Card */}
            <Card className="p-5">
              <h3 className="font-bold text-navy">Customer Information</h3>
              <div className="mt-2 divide-y divide-border">
                <KV k="Customer Name" v={application.customer?.name || "Customer"} />
                <KV k="Customer ID" v={application.customer?.id || "—"} />
                <KV k="Email Address" v={application.customer?.email || "—"} />
                <KV k="Mobile Number" v={application.customer?.phone || "—"} />
              </div>
            </Card>

            {/* Loan Application Details Card */}
            <Card className="p-5">
              <h3 className="font-bold text-navy">Loan Application Details</h3>
              <div className="mt-2 divide-y divide-border">
                <KV k="Product Name" v={application.product?.name || "Loan Product"} />
                <KV
                  k="Requested Amount"
                  v={inr(parseFloat(application.requestedAmount || "0"))}
                  strong
                />
                <KV k="Requested Tenure" v={`${application.requestedTenure} months`} />
                <KV k="Purpose" v={application.purpose || "General Purpose"} />
                <KV
                  k="Submission Date"
                  v={formatISTDate(application.submittedAt || application.createdAt)}
                />
                <KV k="Application Status" v={<Badge>{application.status}</Badge>} />
              </div>
            </Card>

            {/* Decision & Review Notes Card (if reviewed) */}
            {(application.interestRate || application.rejectionReason || application.reviewNotes || application.loan) && (
              <Card className="p-5 md:col-span-2">
                <h3 className="font-bold text-navy">Decision & Review Record</h3>
                <div className="mt-2 divide-y divide-border">
                  {application.interestRate && (
                    <KV k="Approved Interest Rate" v={`${application.interestRate}% p.a.`} strong />
                  )}
                  {application.rejectionReason && (
                    <KV k="Rejection Reason" v={application.rejectionReason} />
                  )}
                  {application.reviewNotes && (
                    <KV k="Review Notes" v={application.reviewNotes} />
                  )}
                  {application.loan ? (
                    <>
                      <KV
                        k="Generated Loan"
                        v={application.loan.loanNumber}
                        strong
                      />
                      <KV
                        k="Loan Status"
                        v={
                          <div className="flex items-center gap-2">
                            <Badge tone={application.loan.status === "PENDING_DISBURSEMENT" ? "warning" : "success"}>
                              {application.loan.status}
                            </Badge>
                            {application.loan.status === "PENDING_DISBURSEMENT" && (
                              <span className="text-xs text-muted-foreground">
                                (Repayment paused; awaiting fund transfer & proof storage)
                              </span>
                            )}
                          </div>
                        }
                      />
                    </>
                  ) : isApproved ? (
                    <KV
                      k="Loan Generation"
                      v={
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Application approved. Ready for loan creation.
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setActiveAction("CREATE_LOAN");
                              setActionError(null);
                            }}
                            disabled={submitting}
                          >
                            <Plus className="h-3.5 w-3.5" /> Create Loan
                          </Button>
                        </div>
                      }
                    />
                  ) : null}
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar: Context & Document Oversight */}
          <div className="space-y-6">
            <Panel title="Lifecycle Status">
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-muted bg-muted/40 p-3 text-xs space-y-1.5 text-muted-foreground">
                  <p className="font-semibold text-navy">Operating Guidelines:</p>
                  <p>1. Approved applications can be converted into loans in PENDING_DISBURSEMENT status.</p>
                  <p>2. Once created, duplicate loan creation is blocked.</p>
                  <p>3. Disbursement activation requires durable private proof storage (fail-closed).</p>
                </div>
                {application.loan && (
                  <div className="pt-1">
                    <ALink s="disbursement" className={cn(btn("primary", "sm", true))}>
                      View in Disbursement Screen →
                    </ALink>
                  </div>
                )}
                <div className="pt-1">
                  <ALink s="applications" className={cn(btn("outline", "sm", true), "text-navy")}>
                    ← Back to Applications List
                  </ALink>
                </div>
              </div>
            </Panel>

            <Panel title="Application Documents">
              <div className="p-5 text-center text-xs text-muted-foreground">
                No electronic document attachments associated with this application record.
              </div>
            </Panel>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Disbursement() {
  const [applications, setApplications] = useState<AdminLoanApplicationItem[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminFinancialOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [transferDate, setTransferDate] = useState<string>(() => getTodayIST());
  const [bankRef, setBankRef] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const isMountedRef = useRef<boolean>(true);
  const activeReqRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDisbursementData = useCallback(() => {
    const requestId = ++activeReqRef.current;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getAdminLoanApplications(),
      getAdminFinancialOverview(),
    ])
      .then(([appsRes, overviewRes]) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;

        if (appsRes.status === "rejected") {
          setError((appsRes.reason as any)?.message || "Failed to load pending disbursements from backend.");
          setLoading(false);
          return;
        }

        const allApps = appsRes.value?.applications || [];
        setApplications(allApps);

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value);
        }

        // Auto-select first pending disbursement loan if none selected
        const pendingApps = allApps.filter(
          (a) => a.status === "APPROVED" && a.loan && a.loan.status === "PENDING_DISBURSEMENT"
        );
        if (pendingApps.length > 0 && !selectedLoanId) {
          setSelectedLoanId(pendingApps[0].loan!.id);
        }

        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setError(err?.message || "Failed to load pending disbursements.");
        setLoading(false);
      });
  }, [selectedLoanId]);

  useEffect(() => {
    loadDisbursementData();
  }, [loadDisbursementData]);

  // Filter approved applications with PENDING_DISBURSEMENT loans
  const pendingDisbursements = applications.filter(
    (a) => a.status === "APPROVED" && a.loan && a.loan.status === "PENDING_DISBURSEMENT"
  );

  const filteredPending = pendingDisbursements.filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const loanNum = (a.loan?.loanNumber || "").toLowerCase();
    const custName = (a.customer?.name || "").toLowerCase();
    const appId = (a.id || "").toLowerCase();
    const prod = (a.product?.name || "").toLowerCase();
    return loanNum.includes(q) || custName.includes(q) || appId.includes(q) || prod.includes(q);
  });

  const selectedApp =
    pendingDisbursements.find((a) => a.loan?.id === selectedLoanId) ||
    pendingDisbursements[0] ||
    null;

  const totalPendingPrincipal = pendingDisbursements.reduce(
    (sum, a) => sum + parseFloat(a.requestedAmount || "0"),
    0
  );

  // Active loan count distinctly separated from pending
  const activeLoansCount = overview?.portfolio?.statusCounts?.ACTIVE ?? 0;
  const totalPrincipalDisbursed = overview?.portfolio?.totalPrincipalDisbursed || "0";

  return (
    <Shell
      title="Disbursement"
      sub={`${pendingDisbursements.length} pending disbursement loans • ${inr(totalPendingPrincipal)} committed principal`}
    >
      {/* Fail-closed Storage Safety Banner (Workstream 3) */}
      <div className="flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-navy">
          <ShieldCheck className="h-4 w-4 text-warning" />
          <span>Disbursement Safety Guard Active — Fail-Closed Mode</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Disbursement activation is currently <span className="font-semibold text-navy">unavailable</span> until secure private cloud proof storage is operational.
          To comply with RBI NBFC regulations and prevent unverified financial commitments, fund transfers and loan activations are strictly blocked by the backend (HTTP 503 Guard) until a verified storage adapter is configured.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDisbursementData}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metric Stat Cards: Clear separation of Pending vs Active */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Pending Disbursements"
          value={loading ? "..." : String(pendingDisbursements.length)}
          icon={Clock}
          tone="warning"
          delta="Awaiting private storage"
        />
        <Stat
          label="Committed Pending Principal"
          value={loading ? "..." : inr(totalPendingPrincipal)}
          icon={IndianRupee}
          tone="warning"
          delta="Undisbursed (₹0 debt)"
        />
        <Stat
          label="Active Disbursed Loans"
          value={loading ? "..." : String(activeLoansCount)}
          icon={CheckCircle2}
          tone="success"
          delta="Separate from pending"
        />
        <Stat
          label="Total Principal Disbursed"
          value={loading ? "..." : inr(parseFloat(totalPrincipalDisbursed))}
          icon={Wallet}
          tone="info"
          delta="Active portfolio"
        />
      </div>

      {/* Top Section: Selected Loan Details and Transfer Form with Safe Guard */}
      {selectedApp && (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="p-5">
            <h3 className="font-bold text-navy">Selected Pending Loan</h3>
            <div className="mt-2 divide-y divide-border text-xs">
              <KV k="Loan Number" v={selectedApp.loan?.loanNumber || "—"} strong />
              <KV k="Application ID" v={selectedApp.id} />
              <KV k="Customer" v={selectedApp.customer?.name || "Customer"} />
              <KV k="Phone" v={selectedApp.customer?.phone || "—"} />
              <KV k="Product" v={selectedApp.product?.name || "Loan Product"} />
              <KV k="Principal Amount" v={inr(parseFloat(selectedApp.requestedAmount || "0"))} strong />
              <KV k="Approved Rate" v={selectedApp.interestRate ? `${selectedApp.interestRate}% p.a.` : "—"} />
              <KV k="Tenure" v={`${selectedApp.requestedTenure} months`} />
              <KV k="Disbursement Status" v={<Badge tone="warning">{selectedApp.loan?.status || "PENDING_DISBURSEMENT"}</Badge>} />
            </div>
          </Card>

          <Card className="p-5 xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy">Transfer Execution Details</h3>
              <Badge tone="danger">Activation Blocked (503 Guard)</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Transfer Date">
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  disabled
                />
              </Field>
              <Field label="Bank Reference / UTR">
                <Input
                  placeholder="e.g. UTR / NEFT / IMPS reference"
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  disabled
                />
              </Field>
            </div>

            {/* Proof Upload Area (Disabled due to unconfigured storage) */}
            <div className="rounded-xl border-2 border-dashed border-muted bg-muted/30 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Durable Private Storage Adapter Offline</span>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                Evidence files cannot be accepted or persisted without operational private cloud storage. Local filesystem storage and unverified URLs are rejected fail-closed.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">
                Prerequisite: S3/GCS private bucket credentials & server storage adapter
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Storage adapter is offline"
                >
                  <Upload className="h-4 w-4" /> Upload Proof (Offline)
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  title="Disbursement activation is blocked until durable private storage is operational"
                >
                  Confirm Disbursement (Blocked)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Section: Pending Disbursements List */}
      <Panel title={`Loans Pending Disbursement (${pendingDisbursements.length})`}>
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search loan number, applicant, or ID..."
              className={cn(inputCls, "h-9 pl-9 text-xs")}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDisbursementData}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Fetching pending disbursement loans...</p>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              icon={FileText}
              title="No pending disbursements"
              sub={
                search
                  ? "No loans match the search query."
                  : "All approved loans have been disbursed or no loans are currently awaiting disbursement."
              }
            />
          </div>
        ) : (
          <Table
            cols={[
              "Loan Number",
              "Application ID",
              "Customer",
              "Product",
              "Principal",
              "Approved Rate",
              "Tenure",
              "Status",
              "Action",
            ]}
            rows={filteredPending.map((a) => [
              <span className="font-mono text-xs font-semibold text-navy">
                {a.loan?.loanNumber || "—"}
              </span>,
              <span className="font-mono text-xs text-muted-foreground">{a.id}</span>,
              <div>
                <span className="font-semibold block text-navy">{a.customer?.name}</span>
                <span className="text-[11px] text-muted-foreground">{a.customer?.phone || a.customer?.email || "—"}</span>
              </div>,
              <span>{a.product?.name || "Loan Product"}</span>,
              <span className="font-semibold">{inr(parseFloat(a.requestedAmount || "0"))}</span>,
              <span>{a.interestRate ? `${a.interestRate}%` : "—"}</span>,
              <span>{a.requestedTenure} mo</span>,
              <Badge tone="warning">{a.loan?.status || "PENDING_DISBURSEMENT"}</Badge>,
              <button
                onClick={() => setSelectedLoanId(a.loan!.id)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedLoanId === a.loan?.id ? "Selected" : "Select"}
              </button>,
            ])}
          />
        )}
      </Panel>
    </Shell>
  );
}

function Loans() {
  const [loans, setLoans] = useState<AdminPortfolioLoanItem[]>([]);
  const [overview, setOverview] = useState<AdminFinancialOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const isMountedRef = useRef<boolean>(true);
  const activeReqRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadLoans = useCallback(() => {
    const requestId = ++activeReqRef.current;
    setLoading(true);
    setError(null);

    let apiStatus: string | undefined = undefined;
    if (statusFilter === "Active") apiStatus = "ACTIVE";
    else if (statusFilter === "Pending Disbursement") apiStatus = "PENDING_DISBURSEMENT";
    else if (statusFilter === "Overdue") apiStatus = "OVERDUE";
    else if (statusFilter === "Completed") apiStatus = "COMPLETED";

    Promise.allSettled([
      getAdminLoanPortfolio({ status: apiStatus, page: 1, limit: 100 }),
      getAdminFinancialOverview(),
    ])
      .then(([portfolioRes, overviewRes]) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;

        if (portfolioRes.status === "rejected") {
          setError((portfolioRes.reason as any)?.message || "Failed to load loan portfolio from backend.");
          setLoans([]);
          setLoading(false);
          return;
        }

        setLoans(portfolioRes.value?.loans || []);

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value);
        }

        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeReqRef.current) return;
        setError(err?.message || "Failed to load loan portfolio.");
        setLoans([]);
        setLoading(false);
      });
  }, [statusFilter]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  // Client search filter
  const filtered = loans.filter((l) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const loanNum = (l.loanNumber || "").toLowerCase();
    const custName = (l.customer?.name || "").toLowerCase();
    const prod = (l.product?.name || "").toLowerCase();
    return loanNum.includes(q) || custName.includes(q) || prod.includes(q);
  });

  const activeCount = overview?.portfolio?.statusCounts?.ACTIVE ?? 0;
  const pendingCount = overview?.portfolio?.statusCounts?.PENDING_DISBURSEMENT ?? 0;
  const totalDisbursedPrincipal = overview?.portfolio?.totalPrincipalDisbursed || "0";
  const totalPendingPrincipal = overview?.portfolio?.totalPrincipalPendingDisbursement || "0";

  const totalFiltered = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const subText = loading
    ? "Loading loan portfolio from backend..."
    : `${activeCount} active loans • ${pendingCount} pending disbursement`;

  return (
    <Shell title="Loans" sub={subText}>
      {/* 4 Stat Cards: Clear distinction between Active and Pending */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat
          label="Active Loans"
          value={loading ? "..." : String(activeCount)}
          icon={CheckCircle2}
          tone="success"
          delta="Repaying loans"
        />
        <Stat
          label="Active Disbursed Principal"
          value={loading ? "..." : inr(parseFloat(totalDisbursedPrincipal))}
          icon={Wallet}
          tone="info"
          delta="Total principal in market"
        />
        <Stat
          label="Pending Disbursement"
          value={loading ? "..." : String(pendingCount)}
          icon={Clock}
          tone="warning"
          delta="Repayment paused"
        />
        <Stat
          label="Pending Principal"
          value={loading ? "..." : inr(parseFloat(totalPendingPrincipal))}
          icon={IndianRupee}
          tone="warning"
          delta="Undisbursed (₹0 debt)"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          opts={["Active", "Pending Disbursement", "Overdue", "Completed"]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search loan number, customer..."
            className={cn(inputCls, "h-9 pl-9 text-xs")}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLoans}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Fetching loan portfolio...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              icon={Wallet}
              title="No loans found"
              sub={
                search || statusFilter !== "All"
                  ? "Try adjusting your search criteria or status filter."
                  : "Created loans will appear here once approved applications are converted."
              }
            />
          </div>
        ) : (
          <>
            <Table
              cols={[
                "Loan ID",
                "Customer",
                "Product",
                "Principal",
                "Outstanding",
                "Start Date",
                "Status",
                "Action",
              ]}
              rows={pageRows.map((l) => [
                <span className="font-mono text-xs font-semibold text-navy">
                  {l.loanNumber}
                </span>,
                <div>
                  <span className="font-semibold block text-navy">
                    {l.customer?.name || "Customer"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {l.customer?.phone || "—"}
                  </span>
                </div>,
                <span>{l.product?.name || "Loan Product"}</span>,
                <span className="font-semibold">
                  {inr(parseFloat(l.principalAmount || "0"))}
                </span>,
                <span className={cn(l.status === "PENDING_DISBURSEMENT" && "text-muted-foreground italic")}>
                  {l.status === "PENDING_DISBURSEMENT"
                    ? "₹0 (Undisbursed)"
                    : inr(parseFloat(l.outstandingAmount || "0"))}
                </span>,
                <span className="text-xs text-muted-foreground">
                  {l.startDate ? formatISTDate(l.startDate) : "Repayment Paused"}
                </span>,
                l.status === "PENDING_DISBURSEMENT" ? (
                  <Badge tone="warning">Pending Disbursement</Badge>
                ) : l.status === "ACTIVE" ? (
                  <Badge tone="success">Active</Badge>
                ) : l.status === "OVERDUE" ? (
                  <Badge tone="danger">Overdue</Badge>
                ) : (
                  <Badge>{l.status}</Badge>
                ),
                <ALink
                  s={l.status === "PENDING_DISBURSEMENT" ? "disbursement" : "loan"}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {l.status === "PENDING_DISBURSEMENT" ? "Disbursement Guard" : "Details"}
                </ALink>,
              ])}
            />
            <Pagination
              total={totalFiltered}
              page={page}
              limit={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}

function LoanDetail() {
  return (
    <Shell
      title="Loan Details"
      sub="Authoritative Loan & Repayment Overview"
      actions={
        <ALink s="loans" className={btn("outline", "sm")}>
          ← Back to Loans
        </ALink>
      }
    >
      <div className="rounded-2xl border border-muted bg-card p-6 text-center space-y-3">
        <Wallet className="h-8 w-8 text-primary mx-auto" />
        <h3 className="font-bold text-navy">Authoritative Loan Portfolio Overview</h3>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          Please select an active or pending loan from the Loans Portfolio or Disbursement screens to review its ledger records, verified status, and repayment schedule.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <ALink s="loans" className={btn("primary", "sm")}>
            View Loans Portfolio
          </ALink>
          <ALink s="disbursement" className={btn("secondary", "sm")}>
            View Pending Disbursements
          </ALink>
        </div>
      </div>
    </Shell>
  );
}


function Emis() {
  const st = ["Due Today", "Upcoming", "Overdue", "Paid"];
  return (
    <Shell title="EMI Management">
      <FilterBar opts={st} />
      <Card className="overflow-hidden"><Table cols={["EMI ID", "Loan", "Customer", "Due Date", "Amount", "Paid", "Penalty", "Status"]} rows={customers.filter((c) => c.emi).map((c, i) => { const s = c.status === "Overdue" ? "Overdue" : st[i % 4]; return [<span className="font-mono text-xs">EMI-{8800 + i}</span>, `SM-LN-${418 - i * 3}`, c.name, c.due, inr(c.emi), s === "Paid" ? inr(c.emi) : "₹0", s === "Overdue" ? inr(250) : "₹0", <Badge>{s}</Badge>]; })} /><Pagination total={1240} /></Card>
    </Shell>
  );
}

function Payments() {
  return (
    <Shell title="Payments" actions={<Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>}>
      <FilterBar opts={["UPI", "Cash", "Successful", "Failed", "Pending"]} />
      <Card className="overflow-hidden"><Table cols={["Payment ID", "Customer", "Loan", "EMI", "Amount", "Method", "Transaction ID", "Date", "Status"]} rows={customers.filter((c) => c.emi).map((c, i) => [<span className="font-mono text-xs">PAY-{52100 + i}</span>, c.name, `SM-LN-${418 - i * 3}`, `#0${(i % 8) + 1}`, inr(c.emi), i % 3 === 1 ? "Cash" : "UPI", <span className="font-mono text-xs">{i % 3 === 1 ? `RCPT-2026-0${4800 + i}` : `SMT88${42193 + i * 71}`}</span>, `0${(i % 2) + 1} Oct 2026`, <Badge>{i === 5 ? "Failed" : i === 8 ? "Pending" : "Successful"}</Badge>])} /><Pagination total={2318} /></Card>
    </Shell>
  );
}

function Agents() {
  return (
    <Shell title="Agents" actions={<><ALink s="assignment" className={btn("outline", "sm")}>Assign Customers</ALink><Button size="sm"><Plus className="h-4 w-4" />Add Agent</Button></>}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{agents.map((a) => <Card key={a.id} className="p-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-navy text-sm font-bold text-navy-foreground">{a.name.split(" ").map((x) => x[0]).join("")}</div><div className="flex-1"><p className="font-semibold text-navy">{a.name}</p><p className="text-xs text-muted-foreground">{a.id} · {a.mobile}</p></div><Badge>{a.status}</Badge></div><div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Customers", a.assigned], ["Today", inr(a.today)], ["Cash held", inr(a.held)]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-muted/70 p-2"><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-bold text-navy tnum">{v}</p></div>)}</div></Card>)}</div>
      <Card className="overflow-hidden"><Table cols={["Agent ID", "Name", "Mobile", "Assigned Customers", "Today's Collection", "Cash Held", "Status"]} rows={agents.map((a) => [a.id, <span className="font-semibold">{a.name}</span>, a.mobile, a.assigned, inr(a.today), inr(a.held), <Badge>{a.status}</Badge>])} /></Card>
    </Shell>
  );
}

function Assignment() {
  const [sel, setSel] = useState<string[]>(["CUS-10255"]);
  const [agent, setAgent] = useState("AGT-01");
  return (
    <Shell title="Agent Assignment" actions={<><Button variant="outline" size="sm">Reassign</Button><Button size="sm" disabled={!sel.length}>Assign {sel.length} customer{sel.length === 1 ? "" : "s"}</Button></>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Customers"><div className="divide-y divide-border">{customers.slice(0, 8).map((c) => <label key={c.id} className="flex cursor-pointer items-center gap-3 px-5 py-3"><input type="checkbox" className="h-4 w-4 accent-primary" checked={sel.includes(c.id)} onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} /><div className="flex-1"><p className="text-sm font-semibold text-navy">{c.name}</p><p className="text-xs text-muted-foreground">{c.id} · {c.place}</p></div><span className="text-xs text-muted-foreground">{c.product}</span></label>)}</div></Panel>
        <Panel title="Select Agent"><div className="space-y-3 p-4">{agents.filter((a) => a.status === "Active").map((a) => <button key={a.id} onClick={() => setAgent(a.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left", agent === a.id ? "border-primary bg-soft" : "border-border")}><div className="flex-1"><p className="text-sm font-semibold text-navy">{a.name}</p><p className="text-xs text-muted-foreground">{a.assigned} assigned customers</p></div>{agent === a.id && <Check className="h-5 w-5 text-primary" />}</button>)}</div></Panel>
      </div>
    </Shell>
  );
}

function Cash() {
  return (
    <Shell title="Cash Collections" actions={<ALink s="ledger" className={btn("secondary", "sm")}>Agent Cash Ledger <ChevronRight className="h-4 w-4" /></ALink>}>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><Stat label="Today's Cash Collected" value={inr(84500)} icon={HandCoins} tone="success" /><Stat label="Cash Held by Agents" value={inr(39750)} icon={Wallet} tone="warning" /><Stat label="Deposited" value={inr(44750)} icon={Check} /><Stat label="Pending Reconciliation" value={inr(13150)} icon={Clock} tone="danger" /></div>
      <Card className="overflow-hidden"><Table cols={["Agent", "Customer", "EMI", "Amount", "Date", "OTP", "Signature", "Status"]} rows={[["Ravi Shankar", "Harun R", "#05", 4250], ["Ravi Shankar", "Gopal Reddy", "#07", 3900], ["Manoj Thomas", "Fatima Shaikh", "#03", 5200], ["Sajitha K", "Meena Pillai", "#06", 7250], ["Ravi Shankar", "Suresh Kumar", "#03", 14200]].map(([a, c, e, amt], i) => [a, c, e, inr(amt as number), "02 Oct 2026", <ShieldCheck className="h-4 w-4 text-success" />, <Check className="h-4 w-4 text-success" />, <Badge>{i < 2 ? "Held" : "Deposited"}</Badge>])} /></Card>
    </Shell>
  );
}

function LedgerScreen() {
  return (
    <Shell title="Agent Cash Ledger" actions={<><select className={cn(inputCls, "h-9 w-48")}>{agents.map((a) => <option key={a.id}>{a.name}</option>)}</select><Button size="sm"><Plus className="h-4 w-4" />Record Deposit</Button></>}>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><Stat label="Opening Cash" value="₹0" icon={Wallet} /><Stat label="Collections" value={inr(51250)} icon={HandCoins} tone="success" /><Stat label="Deposits" value={inr(38100)} icon={Send} /><Stat label="Current Cash Held" value={inr(13150)} icon={IndianRupee} tone="warning" /></div>
      <Card className="overflow-hidden"><Table cols={["Time", "Customer", "Collection", "Deposit", "Balance"]} rows={[["09:31 AM", "Suresh Kumar", inr(14200), "—", inr(14200)], ["10:05 AM", "Gopal Reddy", inr(3900), "—", inr(18100)], ["10:42 AM", "Harun R", inr(4250), "—", inr(22350)], ["11:30 AM", "Priya Nair", inr(6800), "—", inr(29150)], ["12:10 PM", "Arjun Patil", inr(8950), "—", inr(38100)], ["01:15 PM", "HDFC Branch deposit", "—", inr(38100), "₹0"], ["03:40 PM", "Lakshmi Venkat", inr(13150), "—", inr(13150)]]} /></Card>
    </Shell>
  );
}

function Documents() {
  const [c, setC] = useState("KYC");
  return (
    <Shell title="Documents" sub="Encrypted document vault">
      <Chips options={["KYC", "Loan Agreements", "Invoices", "Disbursement Proof", "Receipts", "Property Documents"]} value={c} onChange={setC} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{customers.slice(0, 8).map((cu, i) => <Card key={cu.id} className="p-4"><div className="flex items-start justify-between"><IconTile icon={FileText} /><Badge>{i === 2 ? "Pending" : i === 6 ? "Rejected" : "Verified"}</Badge></div><p className="mt-3 text-sm font-semibold text-navy">{c} — {cu.name}</p><p className="text-xs text-muted-foreground">{cu.id} · PDF · {120 + i * 37} KB</p><div className="mt-3 flex gap-2"><Button variant="secondary" size="sm" className="flex-1"><Eye className="h-4 w-4" />View</Button><Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button></div></Card>)}</div>
    </Shell>
  );
}

function Reports() {
  const pie = [{ n: "Personal", v: 48 }, { n: "Agri", v: 34 }, { n: "LAP", v: 18 }];
  const colors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];
  return (
    <Shell title="Reports" sub="May – Oct 2026 · figures in ₹ lakh" actions={<Button variant="outline" size="sm"><Download className="h-4 w-4" />Export PDF</Button>}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"><Stat label="Total Disbursed" value="₹1.42 Cr" icon={Send} /><Stat label="Total Outstanding" value="₹82.4 L" icon={TrendingUp} /><Stat label="Total Collected" value="₹59.8 L" icon={Check} tone="success" /><Stat label="Overdue" value="₹3.18 L" icon={AlertTriangle} tone="danger" /><Stat label="Cash Collections" value="₹12.0 L" icon={HandCoins} /><Stat label="UPI Collections" value="₹26.8 L" icon={CreditCard} /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Loan portfolio"><div className="flex h-[260px] items-center p-4"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" nameKey="n" innerRadius={60} outerRadius={95} paddingAngle={2}>{pie.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="space-y-2 pr-6">{pie.map((p, i) => <div key={p.n} className="flex items-center gap-2 text-sm"><span className="h-3 w-3 rounded" style={{ background: colors[i] }} /><span className="text-navy">{p.n}</span><span className="font-semibold text-navy">{p.v}%</span></div>)}</div></div></Panel>
        <Panel title="Monthly collections"><div className="h-[260px] p-4"><ResponsiveContainer><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="m" {...chart} axisLine={false} tickLine={false} /><YAxis {...chart} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="upi" name="UPI" stackId="a" fill="var(--chart-1)" /><Bar dataKey="cash" name="Cash" stackId="a" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
        <Panel title="Outstanding"><div className="h-[240px] p-4"><ResponsiveContainer><AreaChart data={monthly.map((m, i) => ({ ...m, o: 62 + i * 4 }))}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="m" {...chart} axisLine={false} tickLine={false} /><YAxis {...chart} axisLine={false} tickLine={false} /><Tooltip /><Area dataKey="o" name="Outstanding" stroke="var(--chart-1)" fill="var(--soft)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></Panel>
        <Panel title="Overdue"><div className="h-[240px] p-4"><ResponsiveContainer><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="m" {...chart} axisLine={false} tickLine={false} /><YAxis {...chart} axisLine={false} tickLine={false} /><Tooltip /><Line dataKey="overdue" name="Overdue" stroke="var(--chart-5)" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Panel>
      </div>
    </Shell>
  );
}

function NotificationsScreen() {
  const [t, setT] = useState("Scheduled reminders");
  const data: Record<string, [string, string, string, string][]> = {
    "Scheduled reminders": [["EMI due in 7 days", "SMS + Push", "48 customers", "Daily 9:00 AM"], ["EMI due tomorrow", "SMS + WhatsApp", "18 customers", "Daily 6:00 PM"], ["Overdue follow-up", "SMS", "6 customers", "Daily 10:00 AM"]],
    "Sent notifications": [["Payment received", "Push", "Harun R", "02 Oct, 8:12 AM"], ["Loan approved", "SMS", "Sunita Bai", "01 Oct, 4:30 PM"], ["Application received", "Push", "Pooja Sharma", "30 Sep, 11:02 AM"]],
    "Failed notifications": [["EMI reminder", "SMS", "Rakesh Yadav", "DND active"], ["Payment received", "Push", "Fatima Shaikh", "App uninstalled"]],
  };
  return (
    <Shell title="Notifications" actions={<Button size="sm"><Plus className="h-4 w-4" />New Reminder</Button>}>
      <Tabs options={Object.keys(data)} value={t} onChange={setT} />
      <Card className="overflow-hidden"><Table cols={["Notification", "Channel", "Recipient", t === "Failed notifications" ? "Reason" : "Schedule / Time", "Status"]} rows={data[t].map((r) => [...r, <Badge>{t.startsWith("Sch") ? "Scheduled" : t.startsWith("Sent") ? "Sent" : "Failed"}</Badge>])} /></Card>
    </Shell>
  );
}

function SettingsScreen() {
  const cards: [string, [string, string][]][] = [
    ["Loan Products", [["Agri & Rural Allied", "Enabled"], ["Personal & Emergency", "Enabled"], ["Loan Against Property", "Enabled"]]],
    ["Interest Rates", [["Agri & Rural", "12% – 28%"], ["Personal", "15% – 20%"], ["LAP", "Custom"]]],
    ["Processing Fee", [["Personal", "2% + GST"], ["Agri", "1.5% + GST"], ["LAP", "1% + GST"]]],
    ["Penalty Rules", [["Grace period", "3 days"], ["Late fee", "₹250 / EMI"], ["Penal interest", "2% p.m."]]],
    ["Notification Settings", [["SMS sender ID", "SPDMNY"], ["WhatsApp", "Enabled"], ["Reminder days", "7, 1, 0"]]],
    ["Company Information", [["Name", "Speed Money Finance Pvt Ltd"], ["NBFC Reg.", "N-16.00XXX"], ["Support", "1800 123 4567"]]],
  ];
  return (
    <Shell title="Settings">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{cards.map(([t, rows]) => <Card key={t} className="p-5"><div className="flex items-center justify-between"><h3 className="font-bold text-navy">{t}</h3><Button variant="ghost" size="sm">Edit</Button></div><div className="mt-1 divide-y divide-border">{rows.map(([k, v]) => <KV key={k} k={k} v={v} />)}</div></Card>)}</div>
    </Shell>
  );
}

function Audit() {
  const rows: [string, string, string, string, string, string][] = [
    ["02 Oct 2026, 10:44", "Ravi Shankar", "Agent", "Cash Collected", "RCPT-2026-04821", "Success"],
    ["02 Oct 2026, 08:12", "System", "System", "Payment Recorded", "PAY-52100", "Success"],
    ["01 Oct 2026, 17:05", "Anil Kumar", "Admin", "Disbursement Confirmed", "SM-LN-2026-0420", "Success"],
    ["01 Oct 2026, 16:30", "Anil Kumar", "Admin", "Loan Approved", "SM-2026-00120", "Success"],
    ["30 Sep 2026, 12:18", "Anil Kumar", "Admin", "Loan Rejected", "SM-2026-00118", "Success"],
    ["30 Sep 2026, 09:40", "Anil Kumar", "Admin", "Agent Assigned", "CUS-10255 → AGT-01", "Success"],
    ["29 Sep 2026, 15:22", "Manoj Thomas", "Agent", "Cash Collected", "RCPT-2026-04790", "Failed"],
  ];
  return (
    <Shell title="Audit Logs" actions={<Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>}>
      <Card className="overflow-hidden"><Table cols={["Timestamp", "User", "Role", "Action", "Record", "Status"]} rows={rows.map((r) => [r[0], <span className="font-semibold">{r[1]}</span>, <Badge tone="info">{r[2]}</Badge>, r[3], <span className="font-mono text-xs">{r[4]}</span>, <Badge>{r[5]}</Badge>])} /><Pagination total={1842} /></Card>
    </Shell>
  );
}


function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(email, password);
      login(res.token, res.user);
      nav({ to: "/admin/$screen", params: { screen: "dashboard" } });
    } catch (err: any) {
      setError(err?.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-8 shadow-card animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <span className="mt-3 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Admin Console
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-navy">Administrator Sign In</h1>
          <p className="mt-1 text-xs text-muted-foreground">Authorized platform administrators only</p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Administrator Email">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@loanplatform.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button full size="lg" disabled={loading} type="submit" className="mt-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating</> : "Sign In to Admin Portal"}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Protected by RBI NBFC compliance & security standards.
        </p>
      </div>
    </div>
  );
}

export const adminScreens: Record<string, { c: () => ReactNode; t: string }> = {
  login: { c: AdminLogin, t: "Admin Sign In" },
  dashboard: { c: Dashboard, t: "Dashboard" }, customers: { c: CustomersScreen, t: "Customers" }, "add-customer": { c: AddCustomer, t: "Add Customer" }, import: { c: Import, t: "Import Customers" },
  customer: { c: CustomerDetail, t: "Customer Details" }, applications: { c: Applications, t: "Applications" }, "application-review": { c: AppReview, t: "Application Review" },
  disbursement: { c: Disbursement, t: "Disbursement" }, loans: { c: Loans, t: "Loans" }, loan: { c: LoanDetail, t: "Loan Details" }, emis: { c: Emis, t: "EMI Management" },
  payments: { c: Payments, t: "Payments" }, agents: { c: Agents, t: "Agents" }, assignment: { c: Assignment, t: "Agent Assignment" }, cash: { c: Cash, t: "Cash Collections" },
  ledger: { c: LedgerScreen, t: "Agent Cash Ledger" }, documents: { c: Documents, t: "Documents" }, reports: { c: Reports, t: "Reports" },
  notifications: { c: NotificationsScreen, t: "Notifications" }, settings: { c: SettingsScreen, t: "Settings" }, audit: { c: Audit, t: "Audit Logs" },
};
