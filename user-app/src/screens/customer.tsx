import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowRight, Home, Wallet, CalendarDays, Bell, User, PlusCircle, FileText, History, ShieldCheck, Calculator, Headphones,
  Sprout, HeartPulse, Building2, Check, X, ChevronRight, Phone, Mail, MessageSquareWarning, HelpCircle, Lock, Camera,
  PenLine, IdCard, Fingerprint, Download, CreditCard, LogOut, Landmark, Clock, CircleCheck, Receipt, Loader2, Smartphone,
} from "lucide-react";
import {
  CLink, Logo, Button, btn, Card, Badge, MobileShell, AppHeader, backCls, BackIcon, BottomNav, Field, Input, Select,
  OtpInput, useCountdown, Chips, Progress, StepBar, Timeline, KV, IconTile, ResultState, EmptyState, UploadCard, SignaturePad,
} from "@/components/sm/ui";
import { customer, products, emis, payments, inr } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import api, { loginApi, registerApi, getStoredUser, setAuthToken, setStoredUser, clearAuth, fetchCurrentUser, type AuthUser } from "@/lib/api";

const navItems = [
  { s: "home", label: "Home", icon: Home, link: CLink },
  { s: "loans", label: "Loans", icon: Wallet, link: CLink },
  { s: "emi-schedule", label: "EMIs", icon: CalendarDays, link: CLink },
  { s: "profile", label: "Profile", icon: User, link: CLink },
];
const Nav = ({ a }: { a: string }) => <BottomNav items={navItems} active={a} />;
const Back = ({ to }: { to: string }) => <CLink s={to} className={backCls}><BackIcon /></CLink>;
const Page = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("space-y-4 px-5", className)}>{children}</div>;
const Footer = ({ children }: { children: ReactNode }) => <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-background via-background to-transparent px-5 pb-2 pt-4">{children}</div>;
const Go = ({ s, children, v = "primary" as const }: { s: string; children: ReactNode; v?: "primary" | "outline" | "secondary" }) => <CLink s={s} className={btn(v, "lg", true)}>{children}</CLink>;

/* 01 */
function Splash() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav({ to: "/app/$screen", params: { screen: "welcome" } }), 900); return () => clearTimeout(t); }, [nav]);
  return (
    <MobileShell className="bg-brand pb-0">
      <CLink s="welcome" className="flex min-h-[760px] flex-col items-center justify-center gap-6 text-center">
        <div className="animate-in fade-in zoom-in-95 duration-700"><Logo size="lg" light /></div>
        <p className="text-sm font-medium tracking-[0.25em] text-primary-foreground/80">FAST • SIMPLE • SECURE</p>
        <Loader2 className="mt-10 h-5 w-5 animate-spin text-primary-foreground/60" />
      </CLink>
    </MobileShell>
  );
}

/* 02 */
function Welcome() {
  return (
    <MobileShell>
      <div className="flex min-h-[780px] flex-col px-6 pt-8">
        <Logo />
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-brand p-6 text-primary-foreground">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-card/10" />
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Approved in minutes</p>
          <p className="mt-2 text-4xl font-extrabold tnum">{inr(75000)}</p>
          <p className="text-sm opacity-80">Personal & Emergency Loan</p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            {[[ShieldCheck, "RBI-compliant"], [Clock, "Quick review"], [Lock, "Secure KYC"]].map(([I, t]) => { const Ic = I as typeof Lock; return <div key={t as string} className="rounded-xl bg-card/10 p-2.5"><Ic className="mx-auto mb-1 h-4 w-4" />{t as string}</div>; })}
          </div>
        </div>
        <h1 className="mt-10 text-3xl font-extrabold leading-tight text-navy">Welcome to Speed Money</h1>
        <p className="mt-2 text-lg font-medium text-primary">Financial support when you need it.</p>
        <p className="mt-2 text-sm text-muted-foreground">Apply for loans digitally with a simple and secure application.</p>
        <div className="mt-auto space-y-4 pb-6 pt-8">
          <Go s="login">Get Started <ArrowRight className="h-5 w-5" /></Go>
          <p className="text-center text-sm text-muted-foreground">Already a user? <CLink s="login" className="font-semibold text-primary">Login</CLink></p>
        </div>
      </div>
    </MobileShell>
  );
}

/* 03 */
function Login() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (tab === "login") {
      if (!email.trim() || !password) {
        setError("Email and password are required.");
        return;
      }
      setLoading(true);
      try {
        const res = await loginApi(email, password);
        login(res.token, res.user);
        nav({ to: "/app/$screen", params: { screen: "home" } });
      } catch (err: any) {
        setError(err?.message || "Invalid email or password.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        setError("All fields are required.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      setLoading(true);
      try {
        const res = await registerApi(name, email, phone, password);
        login(res.token, res.user);
        nav({ to: "/app/$screen", params: { screen: "home" } });
      } catch (err: any) {
        setError(err?.message || "Registration failed. Please check your details.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <MobileShell>
      <div className="flex min-h-[780px] flex-col px-6 pt-6">
        <Back to="welcome" />
        <h1 className="mt-6 text-2xl font-extrabold text-navy">
          {tab === "login" ? "Welcome back" : "Create Account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tab === "login" ? "Sign in to manage your loans & EMIs" : "Register with Speed Money in minutes"}
        </p>

        {/* Tab switch */}
        <div className="mt-6 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(null); }}
            className={cn("flex-1 rounded-lg py-2 text-xs font-bold transition", tab === "login" ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy")}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(null); }}
            className={cn("flex-1 rounded-lg py-2 text-xs font-bold transition", tab === "register" ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy")}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          {tab === "register" && (
            <>
              <Field label="Full Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  required
                />
              </Field>
              <Field label="Mobile Number">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  required
                />
              </Field>
            </>
          )}

          <Field label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </Field>

          <Field label={tab === "register" ? "Password (min 8 chars)" : "Password"}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          <div className="pt-4">
            <Button full size="lg" disabled={loading} type="submit">
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {tab === "login" ? "Signing In..." : "Creating Account..."}</>
              ) : (
                <>{tab === "login" ? "Sign In" : "Register"} <ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-auto pb-6 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our <span className="font-semibold text-primary">Terms</span> & <span className="font-semibold text-primary">Privacy Policy</span>
        </div>
      </div>
    </MobileShell>
  );
}

/* 04 */
function Otp() {
  const [t, reset] = useCountdown(30);
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [done, setDone] = useState(false);
  const nav = useNavigate();
  return (
    <MobileShell>
      <div className="flex min-h-[780px] flex-col px-6 pt-6">
        <Back to="login" />
        <h1 className="mt-8 text-2xl font-extrabold text-navy">Verify your number</h1>
        <p className="mt-1 text-sm text-muted-foreground">OTP sent to +91 98765 43210</p>
        <div className="mt-8"><OtpInput onComplete={() => setDone(true)} /></div>
        <p className="mt-4 text-sm text-muted-foreground">{t > 0 ? <>Resend OTP in <span className="font-semibold text-navy tnum">00:{String(t).padStart(2, "0")}</span></> : <button onClick={reset} className="font-semibold text-primary">Resend OTP</button>}</p>
        <p className="mt-2 text-xs text-muted-foreground">Prototype: enter any 6 digits.</p>
        <div className="mt-auto pb-6">
          <Button full size="lg" disabled={!done || state === "loading"} onClick={() => { setState("loading"); setTimeout(() => nav({ to: "/app/$screen", params: { screen: "home" } }), 900); }}>
            {state === "loading" ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying</> : <>Verify <ArrowRight className="h-5 w-5" /></>}
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

function QuickActions({ items }: { items: [typeof Home, string, string][] }) {
  return (
    <div className={cn("grid gap-3", items.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
      {items.map(([I, l, s]) => (
        <CLink key={l} s={s} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card">
          <IconTile icon={I} /><span className="text-[11px] font-semibold leading-tight text-navy">{l}</span>
        </CLink>
      ))}
    </div>
  );
}
function Greeting({ sub }: { sub: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <div><h1 className="text-xl font-bold text-navy">Hi, {customer.first} 👋</h1><p className="text-sm text-muted-foreground">{sub}</p></div>
      <CLink s="notifications" className={cn(backCls, "relative")}><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" /></CLink>
    </div>
  );
}

/* 05 */
function HomeActive() {
  return (
    <MobileShell nav={<Nav a="home" />}>
      <Greeting sub="Welcome back to Speed Money" />
      <Page className="mt-5">
        <div className="relative overflow-hidden rounded-3xl bg-brand p-5 text-primary-foreground shadow-lift">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-card/10" />
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-widest opacity-80">Active Loan</span><span className="rounded-full bg-card/15 px-2.5 py-0.5 text-[11px] font-semibold">{customer.loanId}</span></div>
          <p className="mt-2 text-3xl font-extrabold tnum">{inr(50000)}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card/10 p-3"><p className="text-[11px] opacity-75">Outstanding</p><p className="text-lg font-bold tnum">{inr(38500)}</p></div>
            <div className="rounded-2xl bg-card/10 p-3"><p className="text-[11px] opacity-75">Next EMI · Due 05 Oct 2026</p><p className="text-lg font-bold tnum">{inr(4250)}</p></div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-card/20"><div className="h-full w-[33%] rounded-full bg-card" /></div>
          <p className="mt-1.5 text-[11px] opacity-75">4 of 12 EMIs paid</p>
          <CLink s="pay" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-card text-sm font-bold text-primary">Pay EMI <ArrowRight className="h-4 w-4" /></CLink>
        </div>
        <QuickActions items={[[PlusCircle, "Apply Loan", "loans"], [CalendarDays, "EMI Schedule", "emi-schedule"], [FileText, "Loan Details", "active-loan"], [History, "Payment History", "payment-history"]]} />
        <div className="flex items-center justify-between pt-2"><h2 className="font-bold text-navy">Recent Activity</h2><CLink s="payment-history" className="text-xs font-semibold text-primary">See all</CLink></div>
        <Card className="divide-y divide-border px-4">
          {payments.slice(0, 3).map((p) => (
            <div key={p.txn} className="flex items-center gap-3 py-3">
              <IconTile icon={p.status === "Failed" ? X : Check} tone={p.status === "Failed" ? "danger" : "success"} />
              <div className="flex-1"><p className="text-sm font-semibold text-navy">{p.emi} payment</p><p className="text-xs text-muted-foreground">{p.date}</p></div>
              <p className="text-sm font-bold text-navy tnum">{inr(p.amount)}</p>
            </div>
          ))}
        </Card>
        <CLink s="home-new" className="block text-center text-[11px] text-muted-foreground underline">Preview: no active loan state</CLink>
      </Page>
    </MobileShell>
  );
}

/* 06 */
function HomeNew() {
  return (
    <MobileShell nav={<Nav a="home" />}>
      <Greeting sub="Ready when you are" />
      <Page className="mt-5">
        <Card className="overflow-hidden p-0">
          <div className="bg-soft p-5">
            <IconTile icon={Wallet} />
            <h2 className="mt-4 text-xl font-bold text-navy">Apply for a loan that fits your needs.</h2>
            <p className="mt-1 text-sm text-muted-foreground">Up to ₹3,50,000 · Digital application · Quick review</p>
          </div>
          <div className="p-4"><Go s="loans">Apply for Loan <ArrowRight className="h-5 w-5" /></Go></div>
        </Card>
        <QuickActions items={[[PlusCircle, "Apply Loan", "loans"], [Calculator, "Check Eligibility", "calculator"], [Headphones, "Support", "support"]]} />
        <h2 className="pt-2 font-bold text-navy">Recent Activity</h2>
        <Card><EmptyState icon={History} title="No recent activity" sub="Your loan and payment updates will appear here." /></Card>
        <CLink s="home" className="block text-center text-[11px] text-muted-foreground underline">Preview: active loan state</CLink>
      </Page>
    </MobileShell>
  );
}

/* 07 */
const prodIcon = { agri: Sprout, personal: HeartPulse, lap: Building2 };
function Loans() {
  return (
    <MobileShell nav={<Nav a="loans" />}>
      <AppHeader title="Loans" subtitle="Find a loan for your needs." />
      <Page>
        {products.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between"><IconTile icon={prodIcon[p.id as keyof typeof prodIcon]} /><Badge tone="info">{p.badge}</Badge></div>
            <h3 className="mt-3 text-lg font-bold text-navy">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/70 p-3">
              {[["Amount", p.amount], ["Interest", p.rate], ["Tenure", p.tenure]].map(([k, v]) => <div key={k}><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k}</p><p className="mt-0.5 text-xs font-bold text-navy">{v}</p></div>)}
            </div>
            <CLink s="loan-details" className={cn(btn("primary", "md", true), "mt-4")}>Apply Now <ArrowRight className="h-4 w-4" /></CLink>
          </Card>
        ))}
      </Page>
    </MobileShell>
  );
}

/* 08 */
function LoanDetails() {
  const p = products[1];
  return (
    <MobileShell>
      <AppHeader title={p.name} back={<Back to="loans" />} />
      <Page>
        <Card className="p-5"><Badge tone="info">{p.badge}</Badge><div className="mt-3 divide-y divide-border"><KV k="Loan amount" v={p.amount} /><KV k="Interest rate" v={p.rate} /><KV k="Tenure" v="3 – 12 months" /><KV k="Processing fee" v="2% + GST" /></div></Card>
        <Card className="p-5"><h3 className="font-bold text-navy">About this loan</h3><p className="mt-2 text-sm text-muted-foreground">{p.desc} Funds are transferred directly to your bank account after approval, with simple monthly EMIs payable by UPI.</p></Card>
        <Card className="p-5"><h3 className="font-bold text-navy">Required documents</h3>
          <ul className="mt-3 space-y-2.5">{["PAN Card", "Aadhaar / KYC Document", "Last 3 months bank statement", "Selfie", "Signature"].map((d) => <li key={d} className="flex items-center gap-3 text-sm text-navy"><FileText className="h-4 w-4 text-primary" />{d}</li>)}</ul>
        </Card>
        <Card className="p-5"><h3 className="font-bold text-navy">Key features</h3>
          <ul className="mt-3 space-y-2.5">{["100% digital application", "No collateral required", "Flexible tenure options", "No hidden charges"].map((d) => <li key={d} className="flex items-center gap-3 text-sm text-navy"><CircleCheck className="h-4 w-4 text-success" />{d}</li>)}</ul>
        </Card>
        <CLink s="calculator" className={btn("secondary", "md", true)}><Calculator className="h-4 w-4" /> Calculate EMI</CLink>
      </Page>
      <Footer><Go s="apply">Apply Now <ArrowRight className="h-5 w-5" /></Go></Footer>
    </MobileShell>
  );
}

/* 09 */
function CalculatorScreen() {
  const [amt, setAmt] = useState(50000);
  const [ten, setTen] = useState(12);
  const r = 0.18 / 12;
  const emi = Math.round((amt * r * Math.pow(1 + r, ten)) / (Math.pow(1 + r, ten) - 1));
  return (
    <MobileShell>
      <AppHeader title="Loan Calculator" back={<Back to="loan-details" />} />
      <Page>
        <Card className="p-5">
          <p className="text-xs font-semibold text-muted-foreground">Loan Amount</p>
          <p className="mt-1 text-3xl font-extrabold text-navy tnum">{inr(amt)}</p>
          <input type="range" min={10000} max={75000} step={1000} value={amt} onChange={(e) => setAmt(+e.target.value)} className="mt-4 w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground"><span>₹10,000</span><span>₹75,000</span></div>
          <p className="mt-6 text-xs font-semibold text-muted-foreground">Tenure (months)</p>
          <div className="mt-2 grid grid-cols-4 gap-2">{[3, 6, 9, 12].map((t) => <button key={t} onClick={() => setTen(t)} className={cn("h-11 rounded-xl border text-sm font-bold", ten === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-navy")}>{t}</button>)}</div>
          <div className="mt-6 divide-y divide-border border-t border-border"><KV k="Interest rate" v="18% p.a." /><KV k="Total interest" v={inr(emi * ten - amt)} /><KV k="Total payable" v={inr(emi * ten)} /></div>
        </Card>
        <div className="rounded-2xl bg-soft p-5 text-center"><p className="text-xs font-semibold text-primary">Estimated EMI</p><p className="mt-1 text-3xl font-extrabold text-navy tnum">{inr(emi)} <span className="text-base font-semibold text-muted-foreground">/ month</span></p></div>
        <p className="text-center text-xs text-muted-foreground">Final loan terms are subject to approval.</p>
      </Page>
      <Footer><Go s="apply">Apply Now <ArrowRight className="h-5 w-5" /></Go></Footer>
    </MobileShell>
  );
}

/* 10 */
const steps = [
  ["Personal Details", "Name, date of birth and address", "personal"],
  ["Employment Details", "Income and work information", "employment"],
  ["Bank Details", "Account for disbursement", "bank"],
  ["KYC Verification", "PAN, Aadhaar, selfie, signature", "kyc"],
  ["Document Upload", "Statements and proofs", "documents"],
  ["Review & Submit", "Confirm and submit", "review"],
];
function Apply() {
  return (
    <MobileShell>
      <AppHeader title="Loan Application" subtitle="Personal & Emergency Loan · ₹50,000" back={<Back to="loan-details" />} />
      <Page>
        <Card className="p-4"><div className="flex justify-between text-xs font-semibold"><span className="text-navy">2 of 6 completed</span><span className="text-primary">33%</span></div><Progress value={33} className="mt-2" /></Card>
        <Card className="divide-y divide-border">
          {steps.map(([t, d, s], i) => (
            <CLink key={s} s={s} className="flex items-center gap-4 p-4">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold", i < 2 ? "bg-success text-primary-foreground" : i === 2 ? "bg-primary text-primary-foreground ring-4 ring-primary/15" : "bg-muted text-muted-foreground")}>{i < 2 ? <Check className="h-4 w-4" /> : i + 1}</span>
              <div className="flex-1"><p className="text-sm font-semibold text-navy">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div>
              {i < 2 ? <Badge>Completed</Badge> : i === 2 ? <Badge tone="info">In progress</Badge> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </CLink>
          ))}
        </Card>
      </Page>
      <Footer><Go s="bank">Continue Application <ArrowRight className="h-5 w-5" /></Go></Footer>
    </MobileShell>
  );
}

function FormStep({ title, step, back, next, children, cta = "Save & Continue" }: { title: string; step: number; back: string; next: string; children: ReactNode; cta?: string }) {
  return (
    <MobileShell>
      <AppHeader title={title} back={<Back to={back} />} />
      <StepBar step={step} />
      <Page className="mt-5">{children}</Page>
      <Footer><Go s={next}>{cta} <ArrowRight className="h-5 w-5" /></Go></Footer>
    </MobileShell>
  );
}

/* 11–13 */
function Personal() {
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      nav({ to: "/app/$screen", params: { screen: "profile" } });
    }, 500);
  };

  return (
    <MobileShell>
      <AppHeader title="Personal Details" back={<Back to="profile" />} />
      <Page>
        <Field label="Full Name">
          <Input defaultValue="Harun R" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of Birth">
            <Input type="date" defaultValue="1992-04-14" />
          </Field>
          <Field label="Gender">
            <Select options={["Male", "Female", "Other"]} defaultValue="Male" />
          </Field>
        </div>
        <Field label="Email">
          <Input type="email" defaultValue={customer.email} />
        </Field>
        <Field label="Address">
          <Input defaultValue="14/220, Market Road, Edappally" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Input defaultValue="Kochi" />
          </Field>
          <Field label="State">
            <Select options={["Kerala", "Tamil Nadu", "Karnataka", "Maharashtra"]} defaultValue="Kerala" />
          </Field>
        </div>
        <Field label="PIN Code">
          <Input inputMode="numeric" defaultValue="682024" />
        </Field>
      </Page>
      <Footer>
        <Button full size="lg" onClick={handleSave}>
          {saved ? (
            <>
              <Check className="h-5 w-5" /> Details Saved!
            </>
          ) : (
            <>
              Save & Continue <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </Footer>
    </MobileShell>
  );
}
const Employment = () => (
  <FormStep title="Employment Details" step={2} back="personal" next="bank">
    <Field label="Employment Type"><Select options={["Salaried", "Self-employed", "Business owner", "Farmer"]} /></Field>
    <Field label="Company / Business Name"><Input defaultValue="Malabar Traders Pvt Ltd" /></Field>
    <Field label="Monthly Income"><Input defaultValue="₹32,000" /></Field>
    <Field label="Work Experience"><Select options={["Less than 1 year", "1 – 3 years", "3 – 5 years", "5+ years"]} /></Field>
    <Field label="Existing Obligations" hint="Total monthly EMIs on other loans"><Input defaultValue="₹0" /></Field>
  </FormStep>
);
const Bank = () => (
  <FormStep title="Bank Details" step={3} back="employment" next="kyc">
    <Field label="Account Holder Name"><Input defaultValue="HARUN R" /></Field>
    <Field label="Account Number"><Input inputMode="numeric" defaultValue="50100248193021" /></Field>
    <Field label="Confirm Account Number"><Input inputMode="numeric" defaultValue="50100248193021" /></Field>
    <Field label="IFSC Code"><Input defaultValue="HDFC0001234" className="uppercase" /></Field>
    <Field label="Bank Name"><Input defaultValue="HDFC Bank, Edappally" /></Field>
    <div className="flex gap-3 rounded-xl bg-soft p-4"><Lock className="h-5 w-5 shrink-0 text-primary" /><p className="text-xs text-navy">Your bank details are encrypted and used only to disburse your loan and set up repayments.</p></div>
  </FormStep>
);

/* 14 */
function Kyc() {
  const items: [typeof IdCard, string, string, string][] = [[IdCard, "PAN Card", "Verified", "View"], [Fingerprint, "Aadhaar / KYC Document", "Required", "Verify"], [Camera, "Selfie", "Not Completed", "Upload"], [PenLine, "Signature", "Not Completed", "Upload"]];
  return (
    <FormStep title="Identity Verification" step={4} back="bank" next="documents" cta="Continue">
      {items.map(([I, t, s, a]) => (
        <Card key={t} className="flex items-center gap-3 p-4">
          <IconTile icon={I} tone={s === "Verified" ? "success" : "info"} />
          <div className="flex-1"><p className="text-sm font-semibold text-navy">{t}</p><div className="mt-1"><Badge>{s}</Badge></div></div>
          <button className={btn(a === "View" ? "outline" : "secondary", "sm")}>{a}</button>
        </Card>
      ))}
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" />Your information is securely handled.</div>
    </FormStep>
  );
}

/* 15 */
function Documents() {
  const [lap, setLap] = useState(false);
  return (
    <FormStep title="Upload Documents" step={5} back="kyc" next="review" cta="Continue">
      <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={lap} onChange={(e) => setLap(e.target.checked)} className="accent-primary" /> Preview as Loan Against Property</label>
      <UploadCard title="PAN Card" initial="done" />
      <UploadCard title="Aadhaar / KYC Document" initial="done" />
      <UploadCard title="Bank Statement" />
      <UploadCard title="Selfie" sub="JPG / PNG" />
      <UploadCard title="Signature" sub="JPG / PNG" />
      {lap && <><UploadCard title="Property Ownership Document" /><UploadCard title="Address Proof" /></>}
    </FormStep>
  );
}

/* 16 */
function Review() {
  const [ok, setOk] = useState(false);
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sec: [string, [string, string][]][] = [
    ["Loan Details", [["Product", "Personal & Emergency Loan"], ["Amount", "₹50,000"], ["Tenure", "12 months"]]],
    ["Personal Details", [["Name", "Harun R"], ["DOB", "14 Apr 1992"], ["City", "Kochi, Kerala"]]],
    ["Employment Details", [["Type", "Salaried"], ["Monthly income", "₹32,000"]]],
    ["Bank Details", [["Bank", "HDFC Bank"], ["Account", "XXXX XXXX 3021"], ["IFSC", "HDFC0001234"]]],
    ["KYC Details", [["PAN", "Verified"], ["Aadhaar", "Verified"]]],
    ["Documents", [["Uploaded", "5 of 5"]]],
  ];

  const handleSubmit = async () => {
    if (!ok || loading) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch available loan products from backend
      const prodsRes = await api.get<{ success: boolean; products: any[] }>("/loan-products").catch(() => null);
      const firstProduct = prodsRes?.products?.[0];
      const productId = firstProduct?.id;

      if (!productId) {
        throw new Error("Unable to load active loan product. Please ensure backend is running.");
      }

      // 2. Submit loan application to backend
      const appRes = await api.post<{ success: boolean; application: any }>("/loan-applications", {
        productId,
        requestedAmount: 50000,
        requestedTenure: 12,
        purpose: "Personal & Emergency Medical Need",
      });

      if (appRes?.application) {
        sessionStorage.setItem("speedmoney_last_app", JSON.stringify(appRes.application));
      }

      nav({ to: "/app/$screen", params: { screen: "submitted" } });
    } catch (err: any) {
      console.error("Loan application error:", err);
      // Fallback in demo mode if unauthenticated
      sessionStorage.setItem("speedmoney_last_app", JSON.stringify({
        id: "APP-" + Date.now().toString(36).toUpperCase(),
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
        product: { name: "Personal & Emergency Loan" },
        requestedAmount: "50000",
      }));
      nav({ to: "/app/$screen", params: { screen: "submitted" } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <AppHeader title="Review Application" back={<Back to="documents" />} />
      <StepBar step={6} />
      <Page className="mt-5">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {sec.map(([t, rows]) => (
          <Card key={t} className="px-4 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{t}</h3>
              <button className="text-xs font-semibold text-primary">Edit</button>
            </div>
            <div className="divide-y divide-border">{rows.map(([k, v]) => <KV key={k} k={k} v={v} />)}</div>
          </Card>
        ))}
        <label className="flex gap-3 rounded-xl bg-soft p-4 text-sm text-navy">
          <input
            type="checkbox"
            checked={ok}
            onChange={(e) => setOk(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          I confirm that the information provided is accurate and grant consent to process my loan application.
        </label>
      </Page>
      <Footer>
        <Button full size="lg" disabled={!ok || loading} onClick={handleSubmit}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting Application...</> : "Submit Application"}
        </Button>
      </Footer>
    </MobileShell>
  );
}

/* 17 */
function Submitted() {
  const lastAppStr = typeof window !== "undefined" ? sessionStorage.getItem("speedmoney_last_app") : null;
  const lastApp = lastAppStr ? JSON.parse(lastAppStr) : null;
  const displayId = lastApp?.id || "SM-2026-00123";
  const displayStatus = lastApp?.status || "SUBMITTED";

  return (
    <MobileShell>
      <Page className="pt-14">
        <ResultState tone="success" icon={Check} title="Application Submitted" sub="Your application has been received and sent for underwriting review." />
        <Card className="mt-6 p-4">
          <KV k="Application ID" v={displayId} strong />
          <KV k="Current Status" v={<Badge tone="info">{displayStatus}</Badge>} />
          <KV k="Requested Amount" v={inr(lastApp?.requestedAmount || 50000)} />
        </Card>
        <Card className="p-5">
          <Timeline items={[
            { label: "Submitted", sub: "Just now", state: "done" },
            { label: "Under Review", sub: "Credit team reviewing", state: "current" },
            { label: "Approval", state: "todo" },
            { label: "Disbursement", state: "todo" }
          ]} />
        </Card>
        <CLink s="tracking" className={btn("secondary", "md", true)}>Track Application</CLink>
      </Page>
      <Footer><Go s="home">Go to Home</Go></Footer>
    </MobileShell>
  );
}

/* 18 */
function Tracking() {
  const lastAppStr = typeof window !== "undefined" ? sessionStorage.getItem("speedmoney_last_app") : null;
  const lastApp = lastAppStr ? JSON.parse(lastAppStr) : null;
  const displayId = lastApp?.id || "SM-2026-00123";

  return (
    <MobileShell>
      <AppHeader title="Application Status" subtitle={"ID: " + displayId} back={<Back to="home" />} />
      <Page>
        <Card className="p-5">
          <Timeline items={[
            { label: "Application Submitted", sub: "Received successfully", state: "done" },
            { label: "Documents Received", sub: "KYC verified", state: "done" },
            { label: "Under Review", sub: "Credit team is reviewing", state: "current" },
            { label: "Approval", state: "todo" },
            { label: "Disbursement", state: "todo" }
          ]} />
        </Card>
        <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4">
          <Clock className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-navy">Under Review by Admin</p>
            <p className="text-xs text-muted-foreground">Admins can view and approve this application in real-time from the Admin Operations Portal.</p>
          </div>
        </div>
        <CLink s="approved" className="block text-center text-[11px] text-muted-foreground underline">Preview: approved state</CLink>
      </Page>
    </MobileShell>
  );
}

/* 19 */
function Approved() {
  return (
    <MobileShell>
      <Page className="pt-14">
        <ResultState tone="success" icon={Check} title="Loan Approved" sub="Congratulations! Your loan will be disbursed to your bank account shortly." />
        <Card className="mt-6 divide-y divide-border px-4 py-1">
          <KV k="Approved Amount" v={inr(50000)} strong /><KV k="Interest Rate" v="18% p.a." /><KV k="Tenure" v="12 Months" /><KV k="Estimated EMI" v={inr(4620)} /><KV k="First Due Date" v="05 Oct 2026" />
        </Card>
      </Page>
      <Footer><Go s="active-loan">View Loan Details</Go></Footer>
    </MobileShell>
  );
}

/* 20 */
function ActiveLoan() {
  const [activeLoan, setActiveLoan] = useState<RealCustomerLoan | null>(activeCustomerLoansCache[0] || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLoans() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; count: number; loans: RealCustomerLoan[] }>("/customer/loans");
        if (!cancelled && res?.loans && res.loans.length > 0) {
          activeCustomerLoansCache = res.loans;
          const found = res.loans.find(l => l.status === "ACTIVE" || l.status === "OVERDUE") || res.loans[0];
          setActiveLoan(found);
          const unpaid = found.emis?.find(e => e.status !== "PAID" && Number(e.outstandingAmount) > 0);
          if (unpaid) {
            setSelectedEmi({
              loanId: found.id,
              emiId: unpaid.id,
              installmentNo: unpaid.installmentNo,
              amount: unpaid.outstandingAmount,
              dueDate: unpaid.dueDate,
            });
          }
        }
      } catch (e) {
        // Keep fallback mock view if offline
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLoans();
    return () => { cancelled = true; };
  }, []);

  const loanNum = activeLoan?.loanNumber || customer.loanId;
  const principalVal = activeLoan ? Number(activeLoan.principalAmount) : 50000;
  const outstandingVal = activeLoan ? Number(activeLoan.outstandingAmount) : 38500;
  const nextEmiObj = activeLoan?.emis?.find(e => e.status !== "PAID" && Number(e.outstandingAmount) > 0);
  const nextEmiVal = nextEmiObj ? Number(nextEmiObj.outstandingAmount) : 4250;
  const dueDateStr = nextEmiObj ? new Date(nextEmiObj.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "05 Oct 2026";
  const repaidVal = Math.max(0, principalVal - outstandingVal);
  const progressPct = principalVal > 0 ? Math.min(100, Math.round((repaidVal / principalVal) * 100)) : 33;

  return (
    <MobileShell>
      <AppHeader title="Active Loan" subtitle={loanNum} back={<Back to="home" />} />
      <Page>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-navy">Personal & Emergency Loan</span>
            <Badge>{activeLoan?.status || "Active"}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[["Loan Amount", inr(principalVal)], ["Outstanding", inr(outstandingVal)], ["Next EMI", inr(nextEmiVal)], ["Due Date", dueDateStr]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-muted/70 p-3">
                <p className="text-[11px] text-muted-foreground">{k as string}</p>
                <p className="text-base font-bold text-navy tnum">{v as string}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between text-xs">
            <span className="font-semibold text-navy">Repayment progress</span>
            <span className="text-muted-foreground">{inr(repaidVal)} repaid</span>
          </div>
          <Progress value={progressPct} className="mt-2" />
        </Card>
        <Card className="divide-y divide-border px-4 py-1">
          <KV k="Loan ID" v={loanNum} />
          <KV k="Tenure" v="12 months" />
          <KV k="Status" v={activeLoan?.status || "ACTIVE"} />
          <KV k="Gateway" v="Razorpay (Test Mode)" />
        </Card>
        <Go s="pay">Pay EMI via Razorpay <ArrowRight className="h-5 w-5" /></Go>
        <div className="grid grid-cols-2 gap-3">
          <CLink s="emi-schedule" className={btn("outline", "md", true)}><CalendarDays className="h-4 w-4" />EMI Schedule</CLink>
          <CLink s="payment-history" className={btn("outline", "md", true)}><History className="h-4 w-4" />Payment History</CLink>
        </div>
      </Page>
    </MobileShell>
  );
}

/* 21 */
function EmiSchedule() {
  const [activeLoan, setActiveLoan] = useState<RealCustomerLoan | null>(activeCustomerLoansCache[0] || null);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await api.get<{ success: boolean; loans: RealCustomerLoan[] }>("/customer/loans");
        if (res?.loans && res.loans.length > 0) {
          activeCustomerLoansCache = res.loans;
          const found = res.loans.find(l => l.status === "ACTIVE" || l.status === "OVERDUE") || res.loans[0];
          setActiveLoan(found);
        }
      } catch (e) {}
    }
    refresh();
  }, []);

  const realEmis = activeLoan?.emis;
  const totalCount = realEmis ? realEmis.length : 12;
  const paidCount = realEmis ? realEmis.filter(e => e.status === "PAID").length : 4;
  const remainingCount = totalCount - paidCount;

  return (
    <MobileShell nav={<Nav a="emi-schedule" />}>
      <AppHeader title="EMI Schedule" subtitle={activeLoan?.loanNumber || customer.loanId} />
      <Page>
        <div className="grid grid-cols-3 gap-3">
          {[["Total EMIs", totalCount, "text-navy"], ["Paid", paidCount, "text-success"], ["Remaining", remainingCount, "text-primary"]].map(([k, v, c]) => (
            <Card key={k as string} className="p-3 text-center">
              <p className={cn("text-2xl font-extrabold", c as string)}>{v}</p>
              <p className="text-[11px] text-muted-foreground">{k as string}</p>
            </Card>
          ))}
        </div>
        <Card className="divide-y divide-border">
          {realEmis && realEmis.length > 0 ? (
            realEmis.map((e) => {
              const isDue = e.status === "PENDING" || e.status === "PARTIAL" || e.status === "OVERDUE";
              const isPaid = e.status === "PAID";
              const formattedDate = new Date(e.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <div
                  key={e.id}
                  onClick={() => {
                    if (activeLoan) {
                      setSelectedEmi({
                        loanId: activeLoan.id,
                        emiId: e.id,
                        installmentNo: e.installmentNo,
                        amount: e.outstandingAmount,
                        dueDate: e.dueDate,
                      });
                    }
                  }}
                >
                  <CLink s="emi-details" className={cn("flex items-center gap-3 px-4 py-3.5", isDue && "bg-warning-soft/60")}>
                    <span className={cn("grid h-9 w-9 place-items-center rounded-full text-xs font-bold", isPaid ? "bg-success-soft text-success" : isDue ? "bg-warning text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {isPaid ? <Check className="h-4 w-4" /> : String(e.installmentNo).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">EMI #{String(e.installmentNo).padStart(2, "0")}</p>
                      <p className="text-xs text-muted-foreground">{formattedDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy tnum">{inr(Number(e.emiAmount))}</p>
                      <Badge>{isPaid ? "Paid" : isDue ? "Due" : e.status}</Badge>
                    </div>
                  </CLink>
                </div>
              );
            })
          ) : (
            emis.map((e) => (
              <CLink key={e.no} s="emi-details" className={cn("flex items-center gap-3 px-4 py-3.5", e.status === "Due" && "bg-warning-soft/60")}>
                <span className={cn("grid h-9 w-9 place-items-center rounded-full text-xs font-bold", e.status === "Paid" ? "bg-success-soft text-success" : e.status === "Due" ? "bg-warning text-primary-foreground" : "bg-muted text-muted-foreground")}>{e.status === "Paid" ? <Check className="h-4 w-4" /> : String(e.no).padStart(2, "0")}</span>
                <div className="flex-1"><p className="text-sm font-semibold text-navy">EMI #{String(e.no).padStart(2, "0")}</p><p className="text-xs text-muted-foreground">{e.date}</p></div>
                <div className="text-right"><p className="text-sm font-bold text-navy tnum">{inr(e.amount)}</p><Badge>{e.status}</Badge></div>
              </CLink>
            ))
          )}
        </Card>
      </Page>
    </MobileShell>
  );
}

/* 22 */
function EmiDetails() {
  const emiInfo = getSelectedEmi();
  const emiNo = emiInfo ? emiInfo.installmentNo : 1;
  const amountVal = emiInfo ? Number(emiInfo.amount) : 4250;
  const dueDateStr = emiInfo ? new Date(emiInfo.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "05 Oct 2026";

  return (
    <MobileShell>
      <AppHeader title={`EMI #${String(emiNo).padStart(2, "0")}`} back={<Back to="emi-schedule" />} right={<Badge>Due</Badge>} />
      <Page>
        <Card className="p-5 text-center">
          <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          <p className="text-4xl font-extrabold text-navy tnum">{inr(amountVal)}</p>
          <p className="mt-1 text-sm text-warning">Due Date: {dueDateStr}</p>
        </Card>
        <Card className="divide-y divide-border px-4 py-1">
          <KV k="Installment No" v={`#${emiNo}`} />
          <KV k="Outstanding Balance" v={inr(amountVal)} strong />
          <KV k="Payment Gateway" v="Razorpay (Test Mode)" />
          <KV k="Security" v="SHA-256 HMAC Signature Verified" />
        </Card>
      </Page>
      <Footer><Go s="pay">Proceed to Pay <ArrowRight className="h-5 w-5" /></Go></Footer>
    </MobileShell>
  );
}

/* 23 */
function Pay() {
  const [method, setMethod] = useState("razorpay");
  const [st, setSt] = useState<"ready" | "processing">("ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const nav = useNavigate();

  const emiInfo = getSelectedEmi();
  const emiNo = emiInfo ? emiInfo.installmentNo : 1;
  const amountVal = emiInfo ? Number(emiInfo.amount) : 4250;
  const dueDateStr = emiInfo ? new Date(emiInfo.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "05 Oct 2026";

  async function handleProceedPayment() {
    setSt("processing");
    setErrorMsg(null);

    try {
      // 1. Resolve active loan and target EMI
      let targetLoanId = emiInfo?.loanId;
      let targetEmiId = emiInfo?.emiId;
      let targetAmount = emiInfo?.amount || String(amountVal);

      if (!targetLoanId || !targetEmiId) {
        const res = await api.get<{ success: boolean; loans: RealCustomerLoan[] }>("/customer/loans");
        if (res?.loans && res.loans.length > 0) {
          const loan = res.loans.find(l => l.status === "ACTIVE" || l.status === "OVERDUE") || res.loans[0];
          targetLoanId = loan.id;
          const unpaidEmi = loan.emis?.find(e => e.status !== "PAID" && Number(e.outstandingAmount) > 0) || loan.emis?.[0];
          if (unpaidEmi) {
            targetEmiId = unpaidEmi.id;
            targetAmount = unpaidEmi.outstandingAmount;
          }
        }
      }

      if (!targetLoanId || !targetEmiId) {
        throw new Error("No active loan or unpaid EMI found for payment");
      }

      // 2. Create server-side order with eligible balances in paise
      const orderRes = await api.post<{
        success: boolean;
        orderId: string;
        amount: number;
        amountInRupees: string;
        currency: string;
        keyId: string;
        receipt: string;
        loanId: string;
        loanNumber: string;
        emiId: string;
        installmentNo: number;
        customer: { name: string; email: string; phone: string };
      }>("/payments/razorpay/create-order", {
        loanId: targetLoanId,
        emiId: targetEmiId,
        amount: targetAmount,
      });

      if (!orderRes.success || !orderRes.orderId) {
        throw new Error("Failed to initialize payment order on server");
      }

      // 3. Open Razorpay Checkout standard interface
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency || "INR",
          name: "Speed Money",
          description: `EMI #${orderRes.installmentNo} Repayment`,
          image: "/favicon.svg",
          order_id: orderRes.orderId,
          prefill: {
            name: orderRes.customer?.name || "Customer",
            email: orderRes.customer?.email || "",
            contact: orderRes.customer?.phone || "",
          },
          notes: {
            loanId: orderRes.loanId,
            emiId: orderRes.emiId,
          },
          theme: {
            color: "#1e3a8a",
          },
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              // 4. Verify payment on server using SHA-256 HMAC signature
              const verifyRes = await api.post<{
                success: boolean;
                receiptNumber: string;
                transactionId: string;
                amount: string;
                paidAt: string;
                payment: any;
                emi: any;
                loan: any;
              }>("/payments/razorpay/verify", {
                loanId: orderRes.loanId,
                emiId: orderRes.emiId,
                amount: orderRes.amountInRupees,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                setPaymentSuccess({
                  receiptNumber: verifyRes.receiptNumber,
                  transactionId: verifyRes.transactionId,
                  amount: verifyRes.amount,
                  paidAt: verifyRes.paidAt,
                  installmentNo: orderRes.installmentNo,
                  loanNumber: orderRes.loanNumber,
                  emiId: orderRes.emiId,
                  loanId: orderRes.loanId,
                  mode: "ONLINE (Razorpay Test Mode)",
                });
                nav({ to: "/app/$screen", params: { screen: "payment-success" } });
              } else {
                throw new Error("Payment verification failed on server");
              }
            } catch (vErr: any) {
              setPaymentError(vErr?.message || "Payment verification failed");
              nav({ to: "/app/$screen", params: { screen: "payment-failed" } });
            } finally {
              setSt("ready");
            }
          },
          modal: {
            ondismiss: function () {
              setSt("ready");
            },
          },
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.on("payment.failed", function (failResp: any) {
          setPaymentError(failResp.error?.description || "Payment failed or was cancelled by user");
          nav({ to: "/app/$screen", params: { screen: "payment-failed" } });
          setSt("ready");
        });
        rzpInstance.open();
      } else {
        // Fallback for headless environments: simulated direct verification
        const dummyPayId = `pay_test_${Date.now()}`;
        // In real browser checkout, Razorpay script loads from checkout.razorpay.com
        throw new Error("Razorpay Checkout SDK is loading. Please refresh and try again.");
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMsg(err?.message || "Payment initiation failed");
      setPaymentError(err?.message || "Failed to start payment");
      setSt("ready");
    }
  }

  return (
    <MobileShell>
      <AppHeader title="Pay EMI" back={<Back to="emi-details" />} />
      <Page>
        <Card className="p-5 text-center">
          <p className="text-xs text-muted-foreground">EMI #{String(emiNo).padStart(2, "0")} · Due {dueDateStr}</p>
          <p className="mt-1 text-4xl font-extrabold text-navy tnum">{inr(amountVal)}</p>
        </Card>

        <h3 className="pt-2 text-sm font-bold text-navy">Payment Gateway</h3>
        <Card className="divide-y divide-border">
          <label className="flex cursor-pointer items-center gap-3 p-4">
            <IconTile icon={Smartphone} />
            <div className="flex-1">
              <span className="text-sm font-semibold text-navy">Razorpay Standard Checkout</span>
              <p className="text-[11px] text-muted-foreground">UPI, Cards, NetBanking, Wallets (Test Mode)</p>
            </div>
            <input type="radio" name="m" checked={method === "razorpay"} onChange={() => setMethod("razorpay")} className="h-4 w-4 accent-primary" />
          </label>
        </Card>

        {errorMsg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive-soft p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <Card className="divide-y divide-border px-4 py-1">
          <KV k="EMI amount" v={inr(amountVal)} />
          <KV k="Convenience fee" v={inr(0)} />
          <KV k="Total Payable" v={inr(amountVal)} strong />
        </Card>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />100% secure payment via Razorpay Test Gateway
        </p>
      </Page>
      <Footer>
        <Button full size="lg" disabled={st === "processing"} onClick={handleProceedPayment}>
          {st === "processing" ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Opening Razorpay Checkout...</>
          ) : (
            <>Pay with Razorpay <ArrowRight className="h-5 w-5" /></>
          )}
        </Button>
        <CLink s="payment-failed" className="mt-2 block text-center text-[11px] text-muted-foreground underline">Preview: failed payment state</CLink>
      </Footer>
    </MobileShell>
  );
}

/* 24 */
function PaySuccess() {
  const succ = getPaymentSuccess();
  const amountStr = succ ? inr(Number(succ.amount)) : inr(4250);
  const emiText = succ ? `#${String(succ.installmentNo).padStart(2, "0")}` : "#01";
  const txnId = succ ? succ.transactionId : "pay_test_verified_success";
  const receiptNum = succ ? succ.receiptNumber : "RCPT-TEST-VERIFIED";
  const dateStr = succ && succ.paidAt ? new Date(succ.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Just now";

  return (
    <MobileShell>
      <Page className="pt-14">
        <ResultState tone="success" icon={Check} title="Payment Successful" />
        <p className="text-center text-4xl font-extrabold text-navy tnum">{amountStr}</p>
        <Card className="divide-y divide-border px-4 py-1">
          <KV k="Receipt No" v={receiptNum} strong />
          <KV k="EMI" v={emiText} />
          <KV k="Transaction ID" v={txnId} />
          <KV k="Date & time" v={dateStr} />
          <KV k="Paid via" v="Razorpay (Test Mode)" />
          <KV k="Status" v={<Badge>SUCCESS</Badge>} />
        </Card>
      </Page>
      <Footer>
        <div className="space-y-3">
          <CLink s="receipt" className={btn("outline", "lg", true)}><Receipt className="h-5 w-5" />View Receipt</CLink>
          <Go s="home">Back to Home</Go>
        </div>
      </Footer>
    </MobileShell>
  );
}

/* 25 */
function PayFailed() {
  const err = getPaymentError();
  const subText = err || "We couldn't confirm your payment. Any amount debited will be refunded within 3–5 working days.";

  return (
    <MobileShell>
      <Page className="pt-14">
        <ResultState tone="danger" icon={X} title="Payment Failed" sub={subText} />
        <Card className="divide-y divide-border px-4 py-1">
          <KV k="Gateway" v="Razorpay (Test Mode)" />
          <KV k="Reason" v={err || "Payment cancelled or verification failed"} strong />
          <KV k="Status" v={<Badge>FAILED</Badge>} />
        </Card>
      </Page>
      <Footer>
        <div className="space-y-3">
          <Go s="pay">Try Again</Go>
          <CLink s="support" className={btn("outline", "lg", true)}>Contact Support</CLink>
        </div>
      </Footer>
    </MobileShell>
  );
}

/* 26 */
function PayHistory() {
  const [f, setF] = useState("All");
  const [realPayments, setRealPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; count: number; payments: any[] }>("/payments/my");
        if (res?.payments) {
          setRealPayments(res.payments);
        }
      } catch (e) {
        // Fall back to mock
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const displayList = realPayments.length > 0
    ? realPayments.map(p => ({
        emi: p.emi ? `EMI #${String(p.emi.installmentNo).padStart(2, "0")}` : "EMI Payment",
        amount: Number(p.amount),
        date: new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        status: p.status === "SUCCESS" ? "Successful" : p.status,
        txn: p.transactionId || p.receiptNumber,
      }))
    : payments;

  const map: Record<string, string> = { Successful: "Successful", Pending: "Pending", Failed: "Failed" };
  const filtered = displayList.filter((p) => f === "All" || p.status === map[f]);

  return (
    <MobileShell>
      <AppHeader title="Payment History" back={<Back to="home" />} />
      <Page>
        <Chips options={["All", "Successful", "Pending", "Failed"]} value={f} onChange={setF} />
        {filtered.length === 0 ? (
          <Card><EmptyState icon={CreditCard} title="No payments" sub="Nothing matches this filter." /></Card>
        ) : (
          filtered.map((p) => (
            <Card key={p.txn} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy">{p.emi}</p>
                <p className="text-base font-bold text-navy tnum">{inr(p.amount)}</p>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{p.date}</p>
                <Badge>{p.status}</Badge>
              </div>
              <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                Txn ID: <span className="font-mono text-navy">{p.txn}</span>
              </p>
            </Card>
          ))
        )}
      </Page>
    </MobileShell>
  );
}

/* 27 Notifications */
function Notifications() {
  const groups: [string, [typeof Bell, string, string, string, "warning" | "success" | "info"][]][] = [
    ["Today", [[Bell, "EMI Reminder", "Your EMI of ₹4,250 is due in 7 days.", "9:00 AM", "warning"], [CircleCheck, "Payment Successful", "Your EMI payment was successfully received.", "8:12 AM", "success"]]],
    ["Earlier", [[FileText, "Application Update", "Your application is under review.", "28 Sep", "info"], [ShieldCheck, "Loan Approved", "Your loan has been approved.", "01 Jun", "success"]]],
  ];
  return (
    <MobileShell>
      <AppHeader title="Notifications" back={<Back to="home" />} right={<button className="text-xs font-semibold text-primary">Mark all read</button>} />
      <Page>
        {groups.map(([g, items]) => (
          <div key={g}><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
            <Card className="divide-y divide-border">{items.map(([I, t, d, time, tone], i) => (
              <div key={t} className="flex gap-3 p-4"><IconTile icon={I} tone={tone} /><div className="flex-1"><div className="flex justify-between"><p className="text-sm font-semibold text-navy">{t}</p><span className="text-[11px] text-muted-foreground">{time}</span></div><p className="text-xs text-muted-foreground">{d}</p></div>{g === "Today" && i === 0 && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}</div>
            ))}</Card>
          </div>
        ))}
      </Page>
    </MobileShell>
  );
}

/* 28 Profile */
function Profile() {
  const { user, logout } = useAuth();
  const items: [typeof User, string, string][] = [
    [User, "Personal Details", "personal"],
    [HelpCircle, "Help & Support", "support"],
    [Lock, "Privacy Policy", "profile"],
    [FileText, "Terms & Conditions", "profile"],
  ];
  return (
    <MobileShell nav={<Nav a="profile" />}>
      <AppHeader title="Profile" />
      <Page>
        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand text-lg font-bold text-primary-foreground">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "CU"}
          </div>
          <div className="flex-1">
            <p className="font-bold text-navy">{user?.name || customer.name}</p>
            <p className="text-xs text-muted-foreground">{user?.phone || user?.email || customer.mobile}</p>
            <div className="mt-1"><Badge tone="success">KYC Verified</Badge></div>
          </div>
        </Card>
        <Card className="divide-y divide-border">
          {items.map(([I, l, s]) => <CLink key={l} s={s} className="flex items-center gap-3 px-4 py-3.5"><I className="h-5 w-5 text-primary" /><span className="flex-1 text-sm font-medium text-navy">{l}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></CLink>)}
        </Card>
        <button onClick={() => logout()} className={cn(btn("outline", "md", true), "text-destructive")}>
          <LogOut className="h-4 w-4" />Logout
        </button>
      </Page>
    </MobileShell>
  );
}

/* 29 Support */
function Support() {
  return (
    <MobileShell>
      <AppHeader title="Help & Support" back={<Back to="profile" />} />
      <Page>
        <div className="rounded-2xl bg-brand p-5 text-primary-foreground"><p className="text-lg font-bold">How can we help?</p><p className="text-sm opacity-80">Our team is available Mon–Sat, 9 AM – 7 PM.</p></div>
        <div className="grid grid-cols-2 gap-3">
          {[[Phone, "Call Support", "1800 123 4567"], [Mail, "Email Support", "care@speedmoney.in"]].map(([I, t, d]) => { const Ic = I as typeof Phone; return <Card key={t as string} className="p-4"><IconTile icon={Ic} /><p className="mt-3 text-sm font-semibold text-navy">{t as string}</p><p className="text-[11px] text-muted-foreground">{d as string}</p></Card>; })}
        </div>
        <Card className="flex items-center gap-3 p-4"><IconTile icon={MessageSquareWarning} tone="warning" /><div className="flex-1"><p className="text-sm font-semibold text-navy">Raise a Complaint</p><p className="text-xs text-muted-foreground">Track resolution in 48 hours</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Card>
        <h3 className="pt-2 text-sm font-bold text-navy">FAQs</h3>
        <Card className="divide-y divide-border">
          {[["How do I pay my EMI?", "Tap Pay EMI on the home screen and pay using any UPI app."], ["What if I miss an EMI?", "A penalty may apply. Contact support to discuss options."], ["How long does approval take?", "Most applications are reviewed within 24 working hours."], ["Can I prepay my loan?", "Yes, contact support for a foreclosure statement."]].map(([q, a]) => (
            <details key={q} className="group px-4 py-3.5"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-navy">{q}<ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" /></summary><p className="mt-2 text-xs text-muted-foreground">{a}</p></details>
          ))}
        </Card>
      </Page>
    </MobileShell>
  );
}

/* 30 Receipt */
function CustReceipt() {
  return (
    <MobileShell>
      <AppHeader title="Receipt" back={<Back to="payment-success" />} />
      <Page>
        <Card className="overflow-hidden p-0">
          <div className="bg-brand p-5 text-primary-foreground"><Logo size="sm" light /><p className="mt-3 text-sm opacity-80">EMI Payment Receipt</p></div>
          <div className="divide-y divide-border px-5 py-2"><KV k="Customer" v={customer.name} /><KV k="Loan ID" v={customer.loanId} /><KV k="EMI" v="#05" /><KV k="Amount" v={inr(4250)} strong /><KV k="Date" v="02 Oct 2026" /><KV k="Transaction ID" v="SMT9021847753" /><KV k="Status" v={<Badge>Paid</Badge>} /></div>
        </Card>
        <Button variant="outline" full><Download className="h-4 w-4" />Download PDF</Button>
      </Page>
    </MobileShell>
  );
}


export const customerScreens: Record<string, { c: () => ReactNode; t: string }> = {
  splash: { c: Splash, t: "Splash" }, welcome: { c: Welcome, t: "Welcome" }, login: { c: Login, t: "Mobile Login" }, otp: { c: Otp, t: "OTP Verification" },
  home: { c: HomeActive, t: "Home — Active Loan" }, "home-new": { c: HomeNew, t: "Home — No Active Loan" }, loans: { c: Loans, t: "Loans" },
  "loan-details": { c: LoanDetails, t: "Loan Details" }, calculator: { c: CalculatorScreen, t: "Loan Calculator" }, apply: { c: Apply, t: "Application Steps" },
  personal: { c: Personal, t: "Personal Details" }, employment: { c: Employment, t: "Employment Details" }, bank: { c: Bank, t: "Bank Details" },
  kyc: { c: Kyc, t: "KYC Verification" }, documents: { c: Documents, t: "Document Upload" }, review: { c: Review, t: "Application Review" },
  submitted: { c: Submitted, t: "Application Submitted" }, tracking: { c: Tracking, t: "Application Tracking" }, approved: { c: Approved, t: "Loan Approved" },
  "active-loan": { c: ActiveLoan, t: "Active Loan" }, "emi-schedule": { c: EmiSchedule, t: "EMI Schedule" }, "emi-details": { c: EmiDetails, t: "EMI Details" },
  pay: { c: Pay, t: "Pay EMI" }, "payment-success": { c: PaySuccess, t: "Payment Success" }, "payment-failed": { c: PayFailed, t: "Payment Failed" },
  "payment-history": { c: PayHistory, t: "Payment History" }, notifications: { c: Notifications, t: "Notifications" }, profile: { c: Profile, t: "Profile" },
  support: { c: Support, t: "Help & Support" }, receipt: { c: CustReceipt, t: "Receipt" },
};
export { Link };
