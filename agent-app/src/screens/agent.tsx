import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, ArrowRight, Home, Users, History, BookOpen, CalendarClock, HandCoins, Wallet, Check, ChevronRight, Phone, MapPin, Loader2, Upload, Download, Receipt, ArrowDownLeft, ArrowUpRight, User, Search, AlertTriangle, RotateCcw } from "lucide-react";
import { GLink, Logo, Button, btn, Card, Badge, MobileShell, AppHeader, backCls, BackIcon, BottomNav, Field, Input, OtpInput, useCountdown, Chips, Progress, KV, IconTile, ResultState, SignaturePad, EmptyState, inputCls } from "@/components/sm/ui";
import { agentCustomers, inr } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { fetchAgentDashboard, type AgentDashboardData, getAgentAssignedLoans,
  getAgentCashReconciliation,
  type AgentCashReconciliation,
  getPastISTDate, type AssignedLoanItem, type CustomerFilterCategory, getAssignedLoanCategory, setSelectedLoanId, getSelectedLoanId, formatISTShortDate, toISTDateString, getTodayIST, recordCashCollection, setLatestCollectionReceipt, getLatestCollectionReceipt, formatISTDateTime, type CashCollectionResponse, isDefinitiveCollectionRejection, isUncertainCollectionError, getPendingCollectionRecovery, savePendingCollectionRecovery, clearPendingCollectionRecovery, type PendingCollectionRecoveryRecord, type StorageSaveResult, type StorageClearResult,
  getAgentCashCollections,
  type AgentCashCollectionItem,
  type HistoryDateFilterOption,
  getDateFilterRange,
  setViewingReceipt,
  getViewingReceipt,
  mapCollectionItemToHistoricalReceipt,
  mapCollectionResponseToHistoricalReceipt,
  getReceiptStatusLabel,
} from "@/lib/agent-api";
import { loginApi, getStoredUser, setAuthToken, setStoredUser, clearAuth, fetchCurrentUser, type AuthUser } from "@/lib/api";

const navItems = [
  { s: "dashboard", label: "Home", icon: Home, link: GLink },
  { s: "customers", label: "Customers", icon: Users, link: GLink },
  { s: "history", label: "History", icon: History, link: GLink },
  { s: "ledger", label: "Ledger", icon: BookOpen, link: GLink },
];
const Nav = ({ a }: { a: string }) => <BottomNav items={navItems} active={a} />;
const Back = ({ to }: { to: string }) => <GLink s={to} className={backCls}><BackIcon /></GLink>;
const Page = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("space-y-4 px-5", className)}>{children}</div>;
const Footer = ({ children }: { children: ReactNode }) => <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-background via-background to-transparent px-5 pb-2 pt-4">{children}</div>;
const Go = ({ s, children, v = "primary" }: { s: string; children: ReactNode; v?: "primary" | "outline" }) => <GLink s={s} className={btn(v, "lg", true)}>{children}</GLink>;

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

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
      nav({ to: "/agent/$screen", params: { screen: "dashboard" } });
    } catch (err: any) {
      setError(err?.message || "Invalid agent email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex min-h-[780px] flex-col px-6 pt-12">
        <Logo />
        <span className="mt-3 w-fit rounded-full bg-navy px-3 py-1 text-[11px] font-semibold tracking-wider text-navy-foreground">COLLECTION AGENT</span>
        <h1 className="mt-8 text-2xl font-extrabold text-navy">Sign in to start collecting</h1>
        <p className="mt-1 text-sm text-muted-foreground">Authorized Speed Money collection agents only</p>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <Field label="Agent Email">
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@loanplatform.com"
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
          <div className="pt-4">
            <Button full size="lg" disabled={loading} type="submit">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing In</> : <>Login <ArrowRight className="h-5 w-5" /></>}
            </Button>
          </div>
        </form>
      </div>
    </MobileShell>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AG";

  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchAgentDashboard()
      .then((res) => {
        if (isMountedRef.current) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMountedRef.current) {
          setError(err?.message || "Failed to load dashboard data.");
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasData = data !== null;

  const collectedDisplay = hasData ? inr(data.collectedAmount) : "₹--";
  const expectedDisplay = hasData ? inr(data.expectedAmount) : "₹--";
  const remainingDisplay = hasData ? inr(data.remainingAmount) : "₹--";
  const progressPercent = hasData ? data.progressPercentage : 0;
  const customersDueDisplay = hasData ? String(data.customersDueCount) : "--";
  const cashHeldDisplay = hasData ? inr(data.cashHeld) : "₹--";
  const nextVisits = hasData ? data.dues.dues.slice(0, 3) : [];

  return (
    <MobileShell nav={<Nav a="dashboard" />}>
      <div className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="text-xs text-muted-foreground">Speed Money Agent Portal</p>
          <h1 className="text-xl font-bold text-navy">Good day, {user?.name || "Agent"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-navy text-sm font-bold text-navy-foreground">
            {initials}
          </div>
          <button
            onClick={() => {
              logout();
              nav({ to: "/agent/$screen", params: { screen: "login" } });
            }}
            title="Sign out"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-destructive transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Page className="mt-5">
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
            <span className="font-semibold">{error}</span>
            <button
              onClick={() => loadData()}
              className="ml-2 shrink-0 rounded-lg bg-destructive/20 px-3 py-1 font-semibold hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Card: Today's Collection */}
        <div className="rounded-3xl bg-navy p-5 text-navy-foreground">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Today's Collection</p>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" />}
          </div>

          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-extrabold tnum">{collectedDisplay}</p>
            <p className="text-xs opacity-70">of {expectedDisplay}</p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-card/15">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Expected", expectedDisplay],
              ["Collected", collectedDisplay],
              ["Remaining", remainingDisplay],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-card/10 p-2">
                <p className="text-[10px] opacity-70">{k}</p>
                <p className="text-sm font-bold tnum">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <IconTile icon={Users} tone="warning" />
            <p className="mt-3 text-2xl font-extrabold text-navy">
              {customersDueDisplay}
            </p>
            <p className="text-xs text-muted-foreground">Customers Due</p>
          </Card>
          <Card className="p-4">
            <IconTile icon={Wallet} />
            <p className="mt-3 text-2xl font-extrabold text-navy tnum">
              {cashHeldDisplay}
            </p>
            <p className="text-xs text-muted-foreground">Cash Held</p>
          </Card>
        </div>

        {/* Quick Nav Links */}
        <div className="grid grid-cols-4 gap-3">
          {(
            [
              [Users, "My Customers", "customers"],
              [CalendarClock, "Today's Due", "customers"],
              [HandCoins, "Collect EMI", "customer"],
              [BookOpen, "Cash Ledger", "ledger"],
            ] as const
          ).map(([I, l, s]) => (
            <GLink
              key={l}
              s={s}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card"
            >
              <IconTile icon={I} />
              <span className="text-[11px] font-semibold leading-tight text-navy">{l}</span>
            </GLink>
          ))}
        </div>

        {/* Next Visits */}
        <h2 className="pt-1 font-bold text-navy">Next visits</h2>
        <Card className="divide-y divide-border">
          {loading && !hasData ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading scheduled dues...</span>
            </div>
          ) : error && !hasData ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
              <span>Unable to load scheduled dues.</span>
              <button
                onClick={() => loadData()}
                className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
              >
                Retry
              </button>
            </div>
          ) : nextVisits.length > 0 ? (
            nextVisits.map((item) => {
              const statusLabel =
                item.status === "PENDING"
                  ? "Due Today"
                  : item.status === "PARTIAL"
                  ? "Partial Due"
                  : item.status === "OVERDUE"
                  ? "Overdue"
                  : item.status;

              const statusBadgeTone =
                item.status === "OVERDUE"
                  ? ("danger" as const)
                  : item.status === "PARTIAL"
                  ? ("warning" as const)
                  : ("info" as const);

              const custInitials = (item.customer?.name || "Customer")
                .split(" ")
                .filter(Boolean)
                .map((x) => x[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "CU";

              const outstandingNum = parseFloat(item.outstandingAmount || "0") || 0;

              return (
                <div
                  key={item.emiId}
                  onClick={() => setSelectedLoanId(item.loanId)}
                  className="cursor-pointer transition hover:bg-muted/30"
                >
                  <GLink s="customer" className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-soft text-xs font-bold text-primary">
                    {custInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">
                      {item.customer?.name || "Customer"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.loanNumber} · EMI #{item.installmentNo}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-navy tnum">{inr(outstandingNum)}</p>
                    <Badge tone={statusBadgeTone}>{statusLabel}</Badge>
                  </div>
                </GLink>
                </div>
              );
            })
          ) : (
            <EmptyState icon={Users} title="No dues pending today" />
          )}
        </Card>
      </Page>
    </MobileShell>
  );
}

function CustRow({
  item,
  onSelect,
}: {
  item: AssignedLoanItem;
  onSelect: (loanId: string) => void;
}) {
  const { badgeLabel, badgeTone, nextEmi, dueAmount } = getAssignedLoanCategory(item);
  const customerName = item.loan.application?.customer?.user?.name || "Customer";
  const phone = item.loan.application?.customer?.user?.phone;
  const productName = item.loan.application?.product?.name || "Loan";
  const loanNumber = item.loan.loanNumber;

  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";

  const dueDateFormatted = nextEmi ? formatISTShortDate(nextEmi.dueDate) : null;

  return (
    <div
      onClick={() => onSelect(item.loan.id)}
      className="cursor-pointer transition hover:bg-muted/30"
    >
      <GLink s="customer" className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy truncate">{customerName}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {productName} · {loanNumber}
              {nextEmi ? ` · EMI #${nextEmi.installmentNo}` : ""}
            </span>
          </p>
          {phone && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-0.5">
              <Phone className="h-2.5 w-2.5 shrink-0" />
              <span>{phone}</span>
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-navy tnum">{inr(dueAmount)}</p>
          <Badge tone={badgeTone}>{badgeLabel}</Badge>
          {dueDateFormatted && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{dueDateFormatted}</p>
          )}
        </div>
      </GLink>
    </div>
  );
}

function Customers() {
  const [f, setF] = useState<CustomerFilterCategory>("Due Today");
  const [search, setSearch] = useState("");
  const [loans, setLoans] = useState<AssignedLoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAssignedLoans = useCallback(() => {
    setLoading(true);
    setError(null);

    getAgentAssignedLoans()
      .then((res) => {
        if (isMountedRef.current) {
          setLoans(res?.loans || []);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMountedRef.current) {
          setError(err?.message || "Failed to load assigned customers.");
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadAssignedLoans();
  }, [loadAssignedLoans]);

  const handleSelectLoan = useCallback((loanId: string) => {
    setSelectedLoanId(loanId);
  }, []);

  // Filter and search
  const q = search.trim().toLowerCase();
  const filteredList = loans.filter((item) => {
    // 1. Category filter
    const { category } = getAssignedLoanCategory(item);
    if (category !== f) return false;

    // 2. Search query matching across customer name, phone, loan number, and product
    if (!q) return true;
    const name = (item.loan.application?.customer?.user?.name || "").toLowerCase();
    const phone = (item.loan.application?.customer?.user?.phone || "").toLowerCase();
    const loanNum = (item.loan.loanNumber || "").toLowerCase();
    const prod = (item.loan.application?.product?.name || "").toLowerCase();

    return name.includes(q) || phone.includes(q) || loanNum.includes(q) || prod.includes(q);
  });

  const subtitle = loading && loans.length === 0 ? "Loading assigned..." : `${loans.length} assigned`;

  return (
    <MobileShell nav={<Nav a="customers" />}>
      <AppHeader title="My Customers" subtitle={subtitle} />
      <Page>
        {/* Search input with live search filtering across name, phone, and loan number */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, loan ID or phone"
            className={cn(inputCls, "h-11 pl-10")}
          />
        </div>

        <Chips
          options={["Due Today", "Overdue", "Upcoming", "Paid"]}
          value={f}
          onChange={(v) => setF(v as CustomerFilterCategory)}
        />

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
            <span className="font-semibold">{error}</span>
            <button
              onClick={() => loadAssignedLoans()}
              className="ml-2 shrink-0 rounded-lg bg-destructive/20 px-3 py-1 font-semibold hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        <Card className="divide-y divide-border">
          {loading && loans.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading assigned customers...</span>
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item) => (
              <CustRow key={item.loan.id} item={item} onSelect={handleSelectLoan} />
            ))
          ) : f === "Paid" ? (
            <EmptyState
              icon={Users}
              title="No paid loans in active list"
            />
          ) : (
            <EmptyState
              icon={Users}
              title={q ? "No matching customers found" : `No customers ${f.toLowerCase()}`}
            />
          )}
        </Card>
      </Page>
    </MobileShell>
  );
}

function CustomerDetails() {
  const [loanItem, setLoanItem] = useState<AssignedLoanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadLoanDetails = useCallback(async () => {
    const selectedId = getSelectedLoanId();
    if (!selectedId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await getAgentAssignedLoans();
      if (!isMountedRef.current) return;

      const match = res.loans.find((item) => item.loan.id === selectedId);
      if (match) {
        setLoanItem(match);
        // Preserve selected loan ID for future collection integration
        setSelectedLoanId(match.loan.id);
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(err?.message || "Failed to load customer loan details.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadLoanDetails();
  }, [loadLoanDetails]);

  // Derived loan and customer properties
  const customer = loanItem?.loan.application?.customer?.user;
  const customerName = customer?.name || "Customer";
  const phone = customer?.phone || null;
  const email = customer?.email || null;

  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";

  const loan = loanItem?.loan;
  const emis = loan?.emis || [];
  const nextEmi = emis.length > 0 ? emis[0] : null;

  // Next EMI calculations
  const nextEmiOutstanding = nextEmi
    ? parseFloat(nextEmi.outstandingAmount || nextEmi.emiAmount || "0") || 0
    : 0;
  const nextEmiDateFormatted = nextEmi ? formatISTShortDate(nextEmi.dueDate) : null;
  const nextEmiDateIST = nextEmi ? toISTDateString(nextEmi.dueDate) : "";
  const todayIST = getTodayIST();
  const isOverdue =
    nextEmi && (nextEmi.status === "OVERDUE" || (nextEmiDateIST && nextEmiDateIST < todayIST));
  const isToday = nextEmi && nextEmiDateIST === todayIST;
  const emiBadgeTone = isOverdue
    ? ("danger" as const)
    : nextEmi?.status === "PARTIAL"
    ? ("warning" as const)
    : isToday
    ? ("info" as const)
    : ("neutral" as const);
  const emiBadgeText = isOverdue
    ? "Overdue"
    : nextEmi?.status === "PARTIAL"
    ? "Partial Due"
    : isToday
    ? "Due Today"
    : "Upcoming";

  // Repayment progress calculation based strictly on authoritative loan numbers
  const totalPayable = loan ? parseFloat(loan.totalPayable || "0") : 0;
  const outstandingAmount = loan ? parseFloat(loan.outstandingAmount || "0") : 0;
  const hasValidRepayment = loan && !isNaN(totalPayable) && totalPayable > 0 && !isNaN(outstandingAmount);
  const repaidAmount = hasValidRepayment ? Math.max(0, totalPayable - outstandingAmount) : 0;
  const repaymentPct =
    hasValidRepayment && totalPayable > 0
      ? Math.min(100, Math.max(0, Math.round((repaidAmount / totalPayable) * 100)))
      : 0;

  return (
    <MobileShell>
      <AppHeader title="Customer Details" back={<Back to="customers" />} />
      <Page>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-xs text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <span>Loading loan details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-center text-xs text-destructive">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => loadLoanDetails()}
              className="rounded-lg bg-destructive/20 px-4 py-1.5 font-semibold hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        ) : notFound || !loanItem ? (
          <div className="space-y-4 py-6">
            <EmptyState
              icon={Users}
              title="Loan not available"
            />
            <p className="text-center text-xs text-muted-foreground -mt-2">
              The selected loan could not be found or is no longer assigned to your account.
            </p>
            <div className="flex justify-center pt-2">
              <GLink s="customers" className={btn("outline", "md")}>
                Back to My Customers
              </GLink>
            </div>
          </div>
        ) : (
          <>
            {/* Customer Profile Card - Real data without fabricated address */}
            <Card className="flex items-center gap-4 p-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand font-bold text-primary-foreground text-lg">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy truncate">{customerName}</p>
                {phone ? (
                  <p className="text-xs text-muted-foreground">{phone}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No phone on record</p>
                )}
                {email && (
                  <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{email}</p>
                )}
              </div>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className={backCls}
                  title={`Call ${customerName}`}
                >
                  <Phone className="h-5 w-5 text-primary" />
                </a>
              ) : null}
            </Card>

            {/* Loan Overview Card */}
            <Card className="divide-y divide-border px-4 py-1">
              <KV k="Loan Product" v={loanItem.loan.application?.product?.name || "Personal Loan"} />
              <KV k="Loan ID" v={loanItem.loan.loanNumber} />
              <KV
                k="Status"
                v={
                  <Badge
                    tone={
                      loanItem.loan.status === "ACTIVE"
                        ? "success"
                        : loanItem.loan.status === "OVERDUE"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {loanItem.loan.status}
                  </Badge>
                }
              />
              <KV k="Principal" v={inr(parseFloat(loanItem.loan.principalAmount || "0"))} />
              <KV k="Outstanding" v={inr(parseFloat(loanItem.loan.outstandingAmount || "0"))} strong />
              <KV k="Interest Rate" v={`${parseFloat(loanItem.loan.interestRate || "0")}% p.a.`} />
              <KV k="Tenure" v={`${loanItem.loan.tenureMonths} months`} />
              <KV k="Monthly EMI" v={inr(parseFloat(loanItem.loan.emiAmount || "0"))} />
            </Card>

            {/* Next Due EMI Section - Correct empty-EMI messaging distinguishing settled vs remaining balance */}
            {nextEmi ? (
              <Card className="divide-y divide-border px-4 py-1">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-semibold text-navy uppercase tracking-wider">
                    Next Due Installment
                  </span>
                  <Badge tone={emiBadgeTone}>{emiBadgeText}</Badge>
                </div>
                <KV k="Installment" v={`EMI #${nextEmi.installmentNo}`} />
                <KV k="Amount Due" v={inr(nextEmiOutstanding)} strong />
                <KV k="Due Date" v={nextEmiDateFormatted || "Scheduled"} />
              </Card>
            ) : outstandingAmount <= 0 ? (
              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" />
                  <span>No Pending EMI</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  All scheduled installments are settled. Loan is fully paid.
                </p>
              </Card>
            ) : (
              <Card className="p-4 text-center border-warning/30 bg-warning-soft/30">
                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-warning">
                  <span>No Scheduled Installment Pending</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  No unpaid installments exist in the current schedule, but an outstanding loan balance of {inr(outstandingAmount)} remains. Please contact operations.
                </p>
              </Card>
            )}

            {/* Repayment Summary - Derived accurately from total payable & outstanding */}
            {hasValidRepayment && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-navy">Repayment</p>
                  <span className="text-xs font-bold text-navy tnum">{repaymentPct}%</span>
                </div>
                <Progress value={repaymentPct} className="mt-2" />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{inr(repaidAmount)} of {inr(totalPayable)} repaid</span>
                  <span>
                    {emis.length === 0
                      ? "No pending EMI"
                      : `${emis.length} unpaid remaining`}
                  </span>
                </div>
              </Card>
            )}
          </>
        )}
      </Page>
      <Footer>
        {loanItem && nextEmi && nextEmiOutstanding > 0 ? (
          <Go s="collect">
            Collect EMI <ArrowRight className="h-5 w-5" />
          </Go>
        ) : loanItem ? (
          <Button
            full
            size="lg"
            disabled
            className="opacity-70 cursor-not-allowed bg-muted text-muted-foreground border border-border shadow-none"
          >
            No EMI Due for Collection
          </Button>
        ) : (
          <GLink s="customers" className={btn("outline", "lg", true)}>
            Back to My Customers
          </GLink>
        )}
      </Footer>
    </MobileShell>
  );
}

const generateIdempotencyKey = () => 'cash_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

function Collect() {
  const { user } = useAuth();
  const agentUserId = user?.id || getStoredUser()?.id || "";
  const nav = useNavigate();
  const [loanItem, setLoanItem] = useState<AssignedLoanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const isMountedRef = useRef(true);

  // Form inputs
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Idempotency key: preserved across retries unless amount changes
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  // Retry safety & recovery state
  const [outcomeState, setOutcomeState] = useState<"idle" | "uncertain" | "definitive_error" | "storage_error">("idle");
  const [pendingPayload, setPendingPayload] = useState<PendingCollectionRecoveryRecord | null>(null);

  // Check persistent recovery record on initial render/mount
  useEffect(() => {
    isMountedRef.current = true;
    if (agentUserId) {
      const recovered = getPendingCollectionRecovery(agentUserId);
      if (recovered) {
        setPendingPayload(recovered);
        setOutcomeState("uncertain");
        setAmount(recovered.amount);
        setNotes(recovered.notes || "");
        setIdempotencyKey(recovered.idempotencyKey);
        setCashConfirmed(true);
        setSelectedLoanId(recovered.loanId);
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [agentUserId]);

  const loadData = useCallback(async () => {
    // If a pending recovery record exists, load the loan that was being collected
    const existingRecovery = agentUserId ? getPendingCollectionRecovery(agentUserId) : null;
    const targetLoanId = existingRecovery ? existingRecovery.loanId : getSelectedLoanId();

    if (!targetLoanId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setFetchError(null);
    setNotFound(false);

    try {
      const res = await getAgentAssignedLoans();
      if (!isMountedRef.current) return;

      const match = res.loans.find((item) => item.loan.id === targetLoanId);
      if (match) {
        setLoanItem(match);

        // If recovery record exists, restore its exact payload and DO NOT overwrite with default EMI balance!
        if (existingRecovery) {
          setPendingPayload(existingRecovery);
          setOutcomeState("uncertain");
          setAmount(existingRecovery.amount);
          setNotes(existingRecovery.notes || "");
          setIdempotencyKey(existingRecovery.idempotencyKey);
          setCashConfirmed(true);
        } else {
          // Fresh collection initialization
          const emis = match.loan.emis || [];
          const nextEmi = emis.length > 0 ? emis[0] : null;
          if (nextEmi) {
            const emiDue = parseFloat(nextEmi.outstandingAmount || nextEmi.emiAmount || "0") || 0;
            setAmount(emiDue > 0 ? emiDue.toFixed(2) : "");
            setCashConfirmed(false);
            setOutcomeState("idle");
            setPendingPayload(null);
          }
        }
      } else {
        setNotFound(true);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setFetchError(err?.message || "Failed to load assigned loan details.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [agentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loan = loanItem?.loan;
  const customer = loan?.application?.customer?.user;
  const customerName = customer?.name || (pendingPayload ? "Customer (Details offline)" : "Customer");
  const emis = loan?.emis || [];
  const nextEmi = emis.length > 0 ? emis[0] : null;

  const emiOutstanding = nextEmi
    ? parseFloat(nextEmi.outstandingAmount || nextEmi.emiAmount || "0") || 0
    : 0;
  const loanOutstanding = loan ? parseFloat(loan.outstandingAmount || "0") || 0 : 0;

  // Validation rules (for initial submission)
  const trimmedAmount = amount.trim();
  const isValidMoneyFormat = /^\d+(\.\d{1,2})?$/.test(trimmedAmount);
  const parsedAmountNum = parseFloat(trimmedAmount);

  let validationError: string | null = null;
  if (!trimmedAmount) {
    validationError = "Collection amount is required.";
  } else if (!isValidMoneyFormat) {
    validationError = "Amount must be a positive number with at most 2 decimal places.";
  } else if (isNaN(parsedAmountNum) || parsedAmountNum <= 0) {
    validationError = "Amount must be greater than zero.";
  } else if (loanItem && nextEmi && Math.round(parsedAmountNum * 100) > Math.round(emiOutstanding * 100)) {
    validationError = `Amount cannot exceed EMI outstanding of ${inr(emiOutstanding)}.`;
  } else if (loanItem && Math.round(parsedAmountNum * 100) > Math.round(loanOutstanding * 100)) {
    validationError = `Amount cannot exceed loan outstanding of ${inr(loanOutstanding)}.`;
  }

  const handleAmountChange = (newVal: string) => {
    if (submitting || outcomeState === "uncertain" || pendingPayload) return;
    setAmount(newVal);
    setCashConfirmed(false); // Reset confirmation whenever collection amount changes
    setSubmitError(null);
    setOutcomeState("idle");
    setIdempotencyKey(generateIdempotencyKey());
  };

  const handleNotesChange = (newVal: string) => {
    if (submitting || outcomeState === "uncertain" || pendingPayload) return;
    setNotes(newVal);
    if (outcomeState === "storage_error") {
      setSubmitError(null);
      setOutcomeState("idle");
    }
  };

  const canSubmit =
    !loading &&
    !submitting &&
    loanItem !== null &&
    nextEmi !== null &&
    validationError === null &&
    cashConfirmed &&
    outcomeState !== "uncertain" &&
    outcomeState !== "storage_error" &&
    !pendingPayload;

  const executeCollection = async (payloadToSubmit: {
    loanId: string;
    emiId: string;
    amount: string;
    notes?: string;
    idempotencyKey: string;
  }) => {
    if (submitting) return;

    // 1. Mandatory persistence & read-back verification BEFORE any HTTP request begins
    const recoveryRecord: PendingCollectionRecoveryRecord = {
      agentUserId,
      loanId: payloadToSubmit.loanId,
      emiId: payloadToSubmit.emiId,
      amount: payloadToSubmit.amount,
      notes: payloadToSubmit.notes,
      idempotencyKey: payloadToSubmit.idempotencyKey,
      createdAt: pendingPayload?.createdAt || Date.now(),
    };

    const saveResult = savePendingCollectionRecovery(recoveryRecord);
    if (!saveResult.success) {
      // BLOCKED: Do NOT call POST /api/agent/cash-collections without verified crash recovery
      setSubmitError(
        saveResult.error ||
          "Local storage is unavailable or verification failed. Cash collection cannot be sent without crash recovery."
      );
      setOutcomeState("storage_error");
      return;
    }

    // Persisted & verified! Lock form on pending payload and mark in-flight
    setPendingPayload(recoveryRecord);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await recordCashCollection({
        loanId: payloadToSubmit.loanId,
        emiId: payloadToSubmit.emiId,
        amount: payloadToSubmit.amount,
        notes: payloadToSubmit.notes,
        idempotencyKey: payloadToSubmit.idempotencyKey,
      });

      // 2. Clear recovery record ONLY after server-confirmed success
      const clearRes = clearPendingCollectionRecovery(agentUserId);
      if (!clearRes.success) {
        console.warn(
          "Collection recorded successfully on server, but persistent storage cleanup failed:",
          clearRes.error
        );
      }

      const customerUser = loanItem?.loan.application?.customer?.user;
      const enrichedReceipt: CashCollectionResponse = {
        ...res,
        customerName: customerUser?.name || res.customerName || "Customer",
        customerPhone: customerUser?.phone || res.customerPhone || null,
        loanNumber: loanItem?.loan.loanNumber || res.loan?.loanNumber || res.loanNumber || "",
      };

      setLatestCollectionReceipt(enrichedReceipt);
      setViewingReceipt(null);
      setOutcomeState("idle");
      setPendingPayload(null);
      nav({ to: "/agent/$screen", params: { screen: "success" } });
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const isDefinitive = isDefinitiveCollectionRejection(err);

      if (isDefinitive) {
        // Server definitively confirmed the transaction was NOT recorded
        // Clear recovery record and unlock form for correction
        const clearRes = clearPendingCollectionRecovery(agentUserId);
        setOutcomeState("definitive_error");
        setPendingPayload(null);
        setIdempotencyKey(generateIdempotencyKey());
        setCashConfirmed(false);

        if (!clearRes.success) {
          setSubmitError(
            `${err?.message || "Collection was rejected by the server."} (Notice: Persistent storage cleanup failed: ${clearRes.error})`
          );
        } else {
          setSubmitError(err?.message || "Collection was rejected by the server.");
        }
      } else {
        // Uncertain outcome (network failure, timeout, 5xx, or ambiguous loan state change):
        // KEEP recovery record in localStorage, lock controls, prompt to retry exact request
        setOutcomeState("uncertain");
        setPendingPayload(recoveryRecord);
        setSubmitError(
          err?.message
            ? `Server response: ${err.message}`
            : "Network communication failed. Outcome could not be verified."
        );
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const handleInitialSubmit = async () => {
    if (!canSubmit || !loan || !nextEmi) return;

    const payloadToSubmit = {
      loanId: loan.id,
      emiId: nextEmi.id,
      amount: parsedAmountNum.toFixed(2),
      notes: notes.trim() || undefined,
      idempotencyKey,
    };

    await executeCollection(payloadToSubmit);
  };

  const handleRetryUncertain = async () => {
    if (!pendingPayload || submitting || outcomeState !== "uncertain") return;

    // Resend the exact same payload with the exact same idempotency key
    await executeCollection({
      loanId: pendingPayload.loanId,
      emiId: pendingPayload.emiId,
      amount: pendingPayload.amount,
      notes: pendingPayload.notes,
      idempotencyKey: pendingPayload.idempotencyKey,
    });
  };

  const isUnresolved = Boolean(pendingPayload) || outcomeState === "uncertain";

  return (
    <MobileShell>
      <AppHeader
        title={isUnresolved ? "Unresolved Collection" : "Collect EMI Cash"}
        back={isUnresolved ? undefined : <Back to="customer" />}
      />
      <Page>
        {/* Branch 1: Unresolved recovery mode MUST remain fully accessible even if loan metadata is loading, failed, or not found */}
        {pendingPayload ? (
          <>
            {/* Non-blocking metadata status banner */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Checking live loan status...</span>
              </div>
            ) : fetchError ? (
              <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <span>Live loan details unavailable: {fetchError}</span>
                <button
                  onClick={() => loadData()}
                  className="font-semibold underline ml-2 shrink-0"
                >
                  Retry Fetch
                </button>
              </div>
            ) : notFound || !loanItem ? (
              <div className="rounded-xl border border-warning/30 bg-warning-soft/30 p-2.5 text-xs text-navy">
                <p className="font-semibold">Loan details unavailable in active assignments</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  The loan may have been closed or reassigned. Preserved transaction details are active below.
                </p>
              </div>
            ) : null}

            {/* Amount Banner Card */}
            <Card className="p-5 text-center">
              <p className="text-xs text-muted-foreground">Amount to collect</p>
              <p className="mt-1 text-4xl font-extrabold text-navy tnum">
                {inr(parseFloat(pendingPayload.amount))}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Remaining EMI Balance: {loanItem && nextEmi ? inr(emiOutstanding) : "Live balance unavailable"}
              </p>
            </Card>

            {/* Loan & Installment Context */}
            <Card className="divide-y divide-border px-4 py-1">
              <KV k="Customer" v={customerName} />
              <KV k="Loan ID" v={loan?.loanNumber || pendingPayload.loanId} />
              <KV
                k="Installment"
                v={nextEmi ? `EMI #${nextEmi.installmentNo}` : `EMI ID: ${pendingPayload.emiId.slice(0, 10)}...`}
              />
              {nextEmi && <KV k="Due Date" v={formatISTShortDate(nextEmi.dueDate)} />}
              <KV k="Mode" v="Cash" strong />
            </Card>

            {/* Locked Cash Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-navy">Cash received (₹)</label>
              <Input
                type="text"
                value={pendingPayload.amount}
                disabled
                className="opacity-60 cursor-not-allowed bg-muted font-medium"
              />
            </div>

            {/* Locked Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-navy">Notes</label>
              <Input
                type="text"
                value={pendingPayload.notes || ""}
                disabled
                placeholder="No notes provided"
                className="opacity-60 cursor-not-allowed bg-muted"
              />
            </div>

            {/* Locked Confirmation */}
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 select-none opacity-60 cursor-not-allowed">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 h-4 w-4 rounded accent-primary cursor-not-allowed shrink-0"
              />
              <span className="text-xs text-navy font-medium leading-relaxed">
                Count the physical cash in front of the customer. I confirm that I have physically counted and received exactly{" "}
                <span className="font-bold">{inr(parseFloat(pendingPayload.amount))}</span> in cash.
              </span>
            </label>

            {/* Unresolved / Uncertain Outcome Warning Banner */}
            <div className="rounded-2xl border border-warning/40 bg-warning-soft/40 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-navy">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <span>Unresolved Collection Outcome</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                A collection attempt of{" "}
                <span className="font-bold text-navy">{inr(parseFloat(pendingPayload.amount))}</span>{" "}
                is unresolved due to a network interruption, timeout, or ambiguous server response. The transaction may have been recorded on the server.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                To prevent duplicate deduction, all details are locked. Resend this exact collection request to establish its recorded status with the server.
              </p>
              <div className="pt-1 text-[11px] text-muted-foreground">
                <span className="font-semibold">Idempotency Key:</span>{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  {pendingPayload.idempotencyKey}
                </code>
              </div>
              {submitError && (
                <div className="rounded-lg bg-warning/20 border border-warning/30 p-2 text-[11px] text-navy font-medium mt-1">
                  <span className="font-bold">Latest Server Response:</span> {submitError}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Branch 2: Standard fresh collection mode (no unresolved attempt) */
          loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-xs text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span>Loading collection details...</span>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-center text-xs text-destructive">
              <p className="font-semibold">{fetchError}</p>
              <button
                onClick={() => loadData()}
                className="rounded-lg bg-destructive/20 px-4 py-1.5 font-semibold hover:bg-destructive/30 transition"
              >
                Retry
              </button>
            </div>
          ) : notFound || !loanItem ? (
            <div className="space-y-4 py-6">
              <EmptyState icon={Users} title="Loan unavailable" />
              <p className="text-center text-xs text-muted-foreground -mt-2">
                The selected loan could not be found or is no longer assigned to your account.
              </p>
              <div className="flex justify-center pt-2">
                <GLink s="customers" className={btn("outline", "md")}>
                  Back to My Customers
                </GLink>
              </div>
            </div>
          ) : !nextEmi ? (
            <div className="space-y-4 py-6">
              <EmptyState icon={Check} title="No pending EMI" />
              <p className="text-center text-xs text-muted-foreground -mt-2">
                There are no unpaid installments eligible for collection on this loan.
              </p>
              <div className="flex justify-center pt-2">
                <GLink s="customer" className={btn("outline", "md")}>
                  Back to Customer Details
                </GLink>
              </div>
            </div>
          ) : (
            <>
              {/* Amount Banner Card */}
              <Card className="p-5 text-center">
                <p className="text-xs text-muted-foreground">Amount to collect</p>
                <p className="mt-1 text-4xl font-extrabold text-navy tnum">
                  {inr(parsedAmountNum > 0 ? parsedAmountNum : emiOutstanding)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Remaining EMI Balance: {inr(emiOutstanding)}
                </p>
              </Card>

              {/* Loan & Installment Context */}
              <Card className="divide-y divide-border px-4 py-1">
                <KV k="Customer" v={customerName} />
                <KV k="Loan ID" v={loan?.loanNumber || ""} />
                <KV k="Installment" v={nextEmi ? `EMI #${nextEmi.installmentNo}` : "EMI"} />
                {nextEmi && <KV k="Due Date" v={formatISTShortDate(nextEmi.dueDate)} />}
                <KV k="Mode" v="Cash" strong />
              </Card>

              {/* Cash Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy">Cash received (₹)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  disabled={submitting}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 4250.00"
                  className={cn(submitting && "opacity-60 cursor-not-allowed bg-muted")}
                />
                {validationError && (
                  <p className="text-[11px] text-destructive font-medium mt-1">{validationError}</p>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-navy">Notes (optional)</label>
                <Input
                  type="text"
                  value={notes}
                  disabled={submitting}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="e.g. Cash collected at customer residence"
                  className={cn(submitting && "opacity-60 cursor-not-allowed bg-muted")}
                />
              </div>

              {/* Physical Cash Confirmation Checkbox */}
              <label
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 select-none transition",
                  submitting
                    ? "opacity-60 cursor-not-allowed border-border bg-muted/40"
                    : "border-warning/40 bg-warning-soft/30 cursor-pointer"
                )}
              >
                <input
                  type="checkbox"
                  checked={cashConfirmed}
                  disabled={submitting}
                  onChange={(e) => {
                    if (submitting) return;
                    setCashConfirmed(e.target.checked);
                    if (outcomeState === "storage_error") {
                      setSubmitError(null);
                      setOutcomeState("idle");
                    }
                  }}
                  className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer shrink-0 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-navy font-medium leading-relaxed">
                  Count the physical cash in front of the customer. I confirm that I have physically counted and received exactly{" "}
                  <span className="font-bold">
                    {inr(parsedAmountNum > 0 ? parsedAmountNum : 0)}
                  </span>{" "}
                  in cash.
                </span>
              </label>

              {/* Definitive Rejection Banner */}
              {outcomeState === "definitive_error" && submitError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
                  <p className="font-semibold">{submitError}</p>
                  <p className="text-[11px] text-destructive/80">
                    The collection was rejected by the server and was not recorded. Please correct the amount or details above and confirm cash received to try again.
                  </p>
                </div>
              )}

              {/* Storage Error Banner */}
              {outcomeState === "storage_error" && submitError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span>Persistence Required</span>
                  </div>
                  <p className="font-medium">{submitError}</p>
                  <p className="text-[11px] text-destructive/80">
                    No collection request was sent to the server. Local storage is required so your cash collections can be safely recovered if the network or browser crashes.
                  </p>
                </div>
              )}
            </>
          )
        )}
      </Page>
      <Footer>
        {pendingPayload ? (
          <Button
            full
            size="lg"
            disabled={submitting}
            onClick={handleRetryUncertain}
            className="bg-warning hover:bg-warning/90 text-navy font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Verifying with Server...
              </>
            ) : (
              <>
                <RotateCcw className="h-5 w-5" /> Resend Exact Collection
              </>
            )}
          </Button>
        ) : loanItem && nextEmi ? (
          <Button
            full
            size="lg"
            disabled={!canSubmit}
            onClick={handleInitialSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Recording Collection...
              </>
            ) : (
              <>
                Collect Cash <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        ) : (
          <GLink s="customers" className={btn("outline", "lg", true)}>
            Back to My Customers
          </GLink>
        )}
      </Footer>
    </MobileShell>
  );
}

function CustOtp() {
  return (
    <MobileShell>
      <AppHeader title="Customer Verification" back={<Back to="collect" />} />
      <Page className="pt-8 space-y-4">
        <Card className="p-6 text-center space-y-2">
          <p className="font-bold text-navy text-sm">Physical Verification Handled</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SMS OTP verification is not enabled for agent cash collections. Verification is completed in person when counting and confirming physical cash received.
          </p>
        </Card>
        <div className="flex justify-center pt-2">
          <Go s="collect">Return to Cash Collection</Go>
        </div>
      </Page>
    </MobileShell>
  );
}

function Signature() {
  return (
    <MobileShell>
      <AppHeader title="Customer Signature" back={<Back to="collect" />} />
      <Page className="pt-8 space-y-4">
        <Card className="p-6 text-center space-y-2">
          <p className="font-bold text-navy text-sm">Digital Signature Not Required</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Digital signature image storage is not supported by the cash collection endpoint. Physical cash receipt is confirmed directly upon recording the collection.
          </p>
        </Card>
        <div className="flex justify-center pt-2">
          <Go s="collect">Return to Cash Collection</Go>
        </div>
      </Page>
    </MobileShell>
  );
}

function Success() {
  const receipt = getLatestCollectionReceipt();

  if (!receipt) {
    return (
      <MobileShell>
        <AppHeader title="Collection Status" back={<Back to="dashboard" />} />
        <Page className="pt-16 space-y-4 text-center">
          <EmptyState icon={Receipt} title="No collection record" />
          <p className="text-xs text-muted-foreground -mt-2">
            No active collection receipt was found in this session.
          </p>
          <div className="flex justify-center pt-2">
            <Go s="dashboard" v="outline">Back to Dashboard</Go>
          </div>
        </Page>
      </MobileShell>
    );
  }

  const collectedNum = parseFloat(receipt.collectedAmount || receipt.payment?.amount || "0") || 0;
  const isDuplicate = receipt.duplicate === true;

  return (
    <MobileShell>
      <Page className="pt-10 space-y-4">
        <ResultState
          tone="success"
          icon={Check}
          title={isDuplicate ? "Collection Already Processed" : "Cash Collection Recorded"}
          sub={isDuplicate ? "Idempotent response: payment was previously recorded." : undefined}
        />
        <p className="text-center text-4xl font-extrabold text-navy tnum">{inr(collectedNum)}</p>

        <Card className="divide-y divide-border px-4 py-1">
          <KV k="Customer" v={receipt.customerName || "Customer"} />
          <KV k="Loan ID" v={receipt.loanNumber || receipt.loan?.loanNumber || receipt.loanId} />
          <KV k="Installment" v={`EMI #${receipt.installmentNo || receipt.emi?.installmentNo}`} />
          <KV k="Receipt No" v={receipt.receiptNumber} strong />
          <KV k="Mode" v="Cash" />
          <KV k="Date & Time" v={formatISTDateTime(receipt.collectedAt || receipt.payment?.paidAt)} />
        </Card>
      </Page>
      <Footer>
        <div className="space-y-3">
          <Go s="receipt">
            <Receipt className="h-5 w-5" /> View Receipt
          </Go>
          <Go s="dashboard" v="outline">
            Back to Dashboard
          </Go>
        </div>
      </Footer>
    </MobileShell>
  );
}

function HistoryScreen() {
  const [dateFilter, setDateFilter] = useState<HistoryDateFilterOption>("All");
  const [page, setPage] = useState(1);
  const [collections, setCollections] = useState<AgentCashCollectionItem[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  } | null>(null);
  const [summary, setSummary] = useState<{
    totalCollectedAmount: string;
    count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCollections = useCallback((targetPage: number, filter: HistoryDateFilterOption) => {
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateFilterRange(filter);
    getAgentCashCollections({
      page: targetPage,
      limit: 20,
      startDate,
      endDate,
    })
      .then((res) => {
        if (!isMountedRef.current) return;
        setCollections(res?.collections || []);
        setPagination(res?.pagination || null);
        setSummary(res?.summary || null);
        setPage(targetPage);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current) return;
        setError(err?.message || "Failed to load collection history.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCollections(page, dateFilter);
  }, [loadCollections, page, dateFilter]);

  const handleDateFilterChange = (newFilter: string) => {
    const f = newFilter as HistoryDateFilterOption;
    setDateFilter(f);
    setPage(1);
  };

  const handleSelectReceipt = (item: AgentCashCollectionItem) => {
    setViewingReceipt(mapCollectionItemToHistoricalReceipt(item));
  };

  const subtitle =
    loading && collections.length === 0
      ? "Loading history..."
      : summary
      ? `${summary.count} collections • ${inr(parseFloat(summary.totalCollectedAmount || "0"))}`
      : undefined;

  return (
    <MobileShell nav={<Nav a="history" />}>
      <AppHeader title="Collection History" subtitle={subtitle} />
      <Page>
        <Chips
          options={["All", "Today", "Last 7 Days", "This Month"]}
          value={dateFilter}
          onChange={handleDateFilterChange}
        />

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
            <span className="font-semibold">{error}</span>
            <button
              onClick={() => loadCollections(page, dateFilter)}
              className="ml-2 shrink-0 rounded-lg bg-destructive/20 px-3 py-1 font-semibold hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {loading && collections.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading collection history...</span>
            </div>
          </Card>
        ) : collections.length > 0 ? (
          <Card className="divide-y divide-border">
            {collections.map((item) => {
              const amountNum =
                parseFloat(item.collectedAmount || item.payment?.amount || "0") || 0;
              const timeStr = formatISTDateTime(
                item.collectedAt || item.payment?.paidAt
              );

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectReceipt(item)}
                  className="cursor-pointer transition hover:bg-muted/30"
                >
                  <GLink
                    s="receipt"
                    className="flex items-center gap-3 p-4"
                  >
                  <IconTile
                    icon={Check}
                    tone={item.reconciled ? "success" : "info"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-navy truncate">
                        {item.customer?.name || "Customer"}
                      </p>
                      {item.reconciled ? (
                        <Badge tone="success">Reconciled</Badge>
                      ) : (
                        <Badge tone="warning">Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.loan?.loanNumber || "Loan"} • EMI #{item.emi?.installmentNo || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {timeStr}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-navy tnum">
                      {inr(amountNum)}
                    </p>
                    <span className="text-[11px] font-semibold text-primary">
                      Receipt
                    </span>
                  </div>
                </GLink>
                </div>
              );
            })}
          </Card>
        ) : (
          !loading &&
          !error && (
            <EmptyState
              icon={History}
              title="No collections recorded"
              sub={
                dateFilter !== "All"
                  ? "No collections match the selected date filter."
                  : "You have not recorded any cash collections yet."
              }
            />
          )
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-4 text-xs text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </Page>
    </MobileShell>
  );
}

function Ledger() {
  const [dateFilter, setDateFilter] = useState<"Today" | "Yesterday" | "Custom">("Today");
  const [customDate, setCustomDate] = useState<string>(getTodayIST());
  const [page, setPage] = useState<number>(1);
  const [reconciliation, setReconciliation] = useState<AgentCashReconciliation | null>(null);
  const [collections, setCollections] = useState<AgentCashCollectionItem[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeRequestIdRef = useRef<number>(0);
  const currentLoadedDateRef = useRef<string>("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const activeDate =
    dateFilter === "Today"
      ? getTodayIST()
      : dateFilter === "Yesterday"
      ? getPastISTDate(1)
      : customDate;

  // Reset pagination to page 1 whenever activeDate changes
  useEffect(() => {
    setPage(1);
  }, [activeDate]);

  const loadLedgerData = useCallback((targetDate: string, targetPage: number) => {
    const requestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    // If date changed, clear whole-day reconciliation metrics immediately
    const isNewDate = targetDate !== currentLoadedDateRef.current;
    if (isNewDate) {
      setReconciliation(null);
    }

    // Always clear page-specific collection rows and pagination immediately on date or page change
    // to prevent previous page's rows or another date's rows from masquerading as current
    setCollections([]);
    setPagination(null);

    Promise.all([
      getAgentCashReconciliation(targetDate),
      getAgentCashCollections({
        startDate: targetDate,
        endDate: targetDate,
        page: targetPage,
        limit: 20,
      }),
    ])
      .then(([recRes, collRes]) => {
        // Discard responses from older/cancelled requests or if unmounted
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) return;
        currentLoadedDateRef.current = targetDate;
        setReconciliation(recRes);
        setCollections(collRes?.collections || []);
        setPagination(collRes?.pagination || null);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) return;
        setError(err?.message || "Failed to load cash ledger data.");
        // Ensure stale data is never presented when request fails
        if (isNewDate) {
          setReconciliation(null);
        }
        setCollections([]);
        setPagination(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadLedgerData(activeDate, page);
  }, [loadLedgerData, activeDate, page]);

  const handleDateFilterChange = (filter: string) => {
    if (filter === "Today" || filter === "Yesterday" || filter === "Custom") {
      setDateFilter(filter as "Today" | "Yesterday" | "Custom");
      setPage(1);
    }
  };

  const handleSelectReceipt = (item: AgentCashCollectionItem) => {
    setViewingReceipt(mapCollectionItemToHistoricalReceipt(item, "ledger"));
  };

  // Authoritative whole-day metrics from reconciliation endpoint
  const totalCollected = parseFloat(reconciliation?.totalCollectedAmount || "0");
  const reconciledAmt = parseFloat(reconciliation?.reconciledAmount || "0");
  const unreconciledAmt = parseFloat(reconciliation?.unreconciledAmount || "0");
  const totalCount = reconciliation?.collectionsCount ?? 0;
  const reconciledCount = reconciliation?.reconciledCount ?? 0;
  const unreconciledCount = reconciliation?.unreconciledCount ?? 0;

  const subtitle = loading && !reconciliation
    ? "Loading ledger..."
    : `${formatISTShortDate(activeDate)} • ${inr(totalCollected)}`;

  return (
    <MobileShell nav={<Nav a="ledger" />}>
      <AppHeader title="Cash Ledger" subtitle={subtitle} />
      <Page className="space-y-4">
        {/* Date Selector */}
        <div className="space-y-2">
          <Chips
            options={["Today", "Yesterday", "Custom"]}
            value={dateFilter}
            onChange={handleDateFilterChange}
          />
          {dateFilter === "Custom" && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="date"
                value={customDate}
                max={getTodayIST()}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomDate(e.target.value);
                    setPage(1);
                  }
                }}
                className={cn(inputCls, "h-10 text-xs")}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
            <span className="font-semibold">{error}</span>
            <button
              onClick={() => loadLedgerData(activeDate, page)}
              className="ml-2 shrink-0 rounded-lg bg-destructive/20 px-3 py-1 font-semibold hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Metrics Cards preserving Lovable UI - Authoritative Whole-Day Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-[11px] text-muted-foreground">Total Collected</p>
            <p className="mt-1 text-lg font-extrabold text-navy tnum">
              {loading && !reconciliation ? "—" : inr(totalCollected)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {loading && !reconciliation ? "Loading..." : `${totalCount} ${totalCount === 1 ? "collection" : "collections"} for day`}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] text-muted-foreground">Admin Reconciled</p>
            <p className="mt-1 text-lg font-extrabold text-navy tnum">
              {loading && !reconciliation ? "—" : inr(reconciledAmt)}
            </p>
            <p className="text-[10px] text-success font-medium mt-0.5">
              {loading && !reconciliation ? "Loading..." : `${reconciledCount} verified`}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-[11px] text-muted-foreground">Pending Handover</p>
            <p className="mt-1 text-lg font-extrabold text-navy tnum">
              {loading && !reconciliation ? "—" : inr(unreconciledAmt)}
            </p>
            <p className="text-[10px] text-warning font-medium mt-0.5">
              {loading && !reconciliation ? "Loading..." : `${unreconciledCount} pending`}
            </p>
          </Card>

          <Card className="p-4 bg-navy text-navy-foreground">
            <p className="text-[11px] opacity-70">Current Cash Held</p>
            <p className="mt-1 text-lg font-extrabold tnum">
              {loading && !reconciliation ? "—" : inr(unreconciledAmt)}
            </p>
            <p className="text-[10px] opacity-80 mt-0.5">
              Unsettled cash in hand
            </p>
          </Card>
        </div>

        {/* Informational Handover Notice */}
        <Card className="p-4 bg-muted/30 border border-muted">
          <div className="flex items-start gap-3">
            <IconTile icon={Wallet} tone="info" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-navy">Physical Cash Handover</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Physical cash collections are reconciled and settled directly with your branch administrator. Online deposit submissions are not permitted.
              </p>
              <div className="pt-2">
                <GLink s="deposit" className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 hover:underline">
                  View Settlement Guidelines <ChevronRight className="h-3 w-3" />
                </GLink>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Transactions Section with honest distinction between day total and page subset */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pt-1">
            <h2 className="font-bold text-navy">
              Transactions for {formatISTShortDate(activeDate)}
            </h2>
            <span className="text-xs text-muted-foreground">
              {pagination && pagination.totalRecords > 0
                ? pagination.totalPages > 1
                  ? `Showing ${(page - 1) * pagination.limit + 1}–${Math.min(page * pagination.limit, pagination.totalRecords)} of ${pagination.totalRecords}`
                  : `${pagination.totalRecords} ${pagination.totalRecords === 1 ? "record" : "records"}`
                : `${totalCount} records`}
            </span>
          </div>

          {loading && collections.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading transactions...</span>
              </div>
            </Card>
          ) : collections.length > 0 ? (
            <>
              <Card className="divide-y divide-border">
                {collections.map((item) => {
                  const amountNum = parseFloat(item.collectedAmount || item.payment?.amount || "0") || 0;
                  const timeStr = formatISTDateTime(item.collectedAt || item.payment?.paidAt);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectReceipt(item)}
                      className="cursor-pointer transition hover:bg-muted/30"
                    >
                      <GLink s="receipt" className="flex items-center gap-3 p-4">
                        <IconTile
                          icon={Check}
                          tone={item.reconciled ? "success" : "info"}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-navy truncate">
                              {item.customer?.name || "Customer"}
                            </p>
                            {item.reconciled ? (
                              <Badge tone="success">Reconciled</Badge>
                            ) : (
                              <Badge tone="warning">Pending</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.loan?.loanNumber || "Loan"} • EMI #{item.emi?.installmentNo || 0}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80">
                            {timeStr}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-navy tnum text-success">
                            +{inr(amountNum)}
                          </p>
                          <span className="text-[11px] font-semibold text-primary">
                            Receipt
                          </span>
                        </div>
                      </GLink>
                    </div>
                  );
                })}
              </Card>

              {/* Pagination Controls when daily transactions exceed page limit */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 pb-4 text-xs text-muted-foreground">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages || loading}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            !loading &&
            !error && (
              <EmptyState
                icon={BookOpen}
                title="No collections recorded"
                sub={`No cash collections were recorded for ${formatISTShortDate(activeDate)}.`}
              />
            )
          )}
        </div>
      </Page>
    </MobileShell>
  );
}

function Deposit() {
  return (
    <MobileShell>
      <AppHeader title="Cash Handover" back={<Back to="ledger" />} />
      <Page className="space-y-4 pt-4">
        <Card className="p-5 text-center space-y-3">
          <div className="flex justify-center mb-1">
            <IconTile icon={Wallet} tone="info" />
          </div>
          <h3 className="text-base font-bold text-navy">Admin Managed Handover</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            In accordance with platform operating procedures, all collected physical cash must be handed over in person to your branch administrator for end-of-day verification and settlement.
          </p>
          <div className="rounded-xl border border-muted bg-muted/30 p-3 text-left text-xs space-y-1.5 text-muted-foreground mt-2">
            <p className="font-semibold text-navy">Standard Settlement Procedure:</p>
            <p>1. Keep cash collections organized and verified against your digital receipts.</p>
            <p>2. Hand over collected cash to the authorized branch settlement officer.</p>
            <p>3. Once physical cash is counted and approved, the administrator marks the records as Reconciled.</p>
          </div>
        </Card>
      </Page>
      <Footer>
        <Go s="ledger" v="primary">Back to Cash Ledger</Go>
      </Footer>
    </MobileShell>
  );
}

function ReceiptScreen() {
  const { user } = useAuth();
  const viewing = getViewingReceipt();
  const latest = getLatestCollectionReceipt();
  const receipt = viewing || (latest ? mapCollectionResponseToHistoricalReceipt(latest) : null);

  if (!receipt) {
    return (
      <MobileShell>
        <AppHeader title="Receipt" back={<Back to="dashboard" />} />
        <Page className="pt-16 space-y-4 text-center">
          <EmptyState icon={Receipt} title="No active receipt" />
          <p className="text-xs text-muted-foreground -mt-2">
            No active collection receipt in this session. Completed collections appear in Collection History.
          </p>
          <div className="flex justify-center pt-2">
            <Go s="dashboard" v="outline">Back to Dashboard</Go>
          </div>
        </Page>
      </MobileShell>
    );
  }

  const collectedNum = parseFloat(receipt.collectedAmount || "0") || 0;
  const isFromHistory = receipt.source === "history";
  const isFromLedger = receipt.source === "ledger";
  const statusStamp = getReceiptStatusLabel(receipt.paymentStatus);

  return (
    <MobileShell>
      <AppHeader
        title="Receipt"
        back={<Back to={isFromLedger ? "ledger" : isFromHistory ? "history" : "success"} />}
      />
      <Page className="space-y-4">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between bg-brand p-5 text-primary-foreground">
            <div>
              <Logo size="sm" light />
              <p className="mt-2 text-sm opacity-80">Cash Collection Receipt</p>
            </div>
            <span className="rounded-lg border-2 border-primary-foreground/70 px-3 py-1 text-sm font-extrabold tracking-widest">
              {statusStamp}
            </span>
          </div>
          <div className="divide-y divide-border px-5 py-2">
            <KV k="Customer" v={receipt.customerName || "Customer"} />
            <KV k="Loan ID" v={receipt.loanNumber || receipt.loanId} />
            <KV k="Installment" v={`EMI #${receipt.installmentNo}`} />
            <KV k="Amount" v={inr(collectedNum)} strong />
            <KV k="Date & Time" v={formatISTDateTime(receipt.collectedAt)} />
            <KV k="Agent" v={user?.name || "Collection Agent"} />
            <KV k="Receipt ID" v={receipt.receiptNumber} />
            <KV k="Payment ID" v={receipt.paymentId} />
            <KV k="Payment Mode" v={receipt.paymentMode || "CASH"} />
            <KV k="Payment Status" v={receipt.paymentStatus || "SUCCESS"} />
            <KV
              k="Reconciliation"
              v={receipt.reconciled ? "Reconciled" : "Pending Reconciliation"}
            />
            {receipt.reconciled && receipt.reconciledAt && (
              <KV k="Reconciled At" v={formatISTDateTime(receipt.reconciledAt)} />
            )}
            <KV k="Verification" v="Physical Cash Verification" />
            {receipt.notes && <KV k="Notes" v={receipt.notes} />}
            {receipt.remainingLoanBalance !== null &&
              receipt.remainingLoanBalance !== undefined && (
                <KV k="Remaining Loan Balance" v={inr(receipt.remainingLoanBalance)} />
              )}
          </div>
        </Card>
        <Button
          variant="outline"
          full
          onClick={() => {
            if (typeof window !== "undefined") window.print?.();
          }}
        >
          <Download className="h-4 w-4" /> Share / Print Receipt
        </Button>
      </Page>
      <Footer>
        <Go s={isFromLedger ? "ledger" : isFromHistory ? "history" : "dashboard"} v="outline">
          {isFromLedger ? "Back to Cash Ledger" : isFromHistory ? "Back to History" : "Back to Dashboard"}
        </Go>
      </Footer>
    </MobileShell>
  );
}

export const agentScreens: Record<string, { c: () => ReactNode; t: string }> = {
  login: { c: Login, t: "Login" }, dashboard: { c: Dashboard, t: "Dashboard" }, customers: { c: Customers, t: "My Customers" }, customer: { c: CustomerDetails, t: "Customer Details" },
  collect: { c: Collect, t: "Collect Cash" }, otp: { c: CustOtp, t: "Customer OTP" }, signature: { c: Signature, t: "Signature" }, success: { c: Success, t: "Collection Success" },
  history: { c: HistoryScreen, t: "Collection History" }, ledger: { c: Ledger, t: "Cash Ledger" }, deposit: { c: Deposit, t: "Cash Deposit" }, receipt: { c: ReceiptScreen, t: "Receipt" },
};
export { User, ChevronRight };

export function AgentScreen({ screen }: { screen?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && screen !== "login") {
      nav({ to: "/agent/$screen", params: { screen: "login" } });
    }
  }, [isAuthenticated, isLoading, screen, nav]);

  if (isLoading) {
    return (
      <MobileShell>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileShell>
    );
  }

  const screenKey = screen || "dashboard";
  const ScreenComp = agentScreens[screenKey]?.c;
  if (!ScreenComp) {
    return isAuthenticated ? <Dashboard /> : <Login />;
  }
  return <ScreenComp />;
}
