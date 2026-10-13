import { Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, type ReactNode, type ComponentType } from "react";
import { ArrowLeft, Check, Upload, FileText, Search, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- navigation helpers ---------- */
export function CLink({ s, className, children }: { s: string; className?: string; children: ReactNode }) {
  return <span className={className}>{children}</span>;
}
export function GLink({ s, className, children }: { s: string; className?: string; children: ReactNode }) {
  return <span className={className}>{children}</span>;
}
export function ALink({ s, className, children }: { s: string; className?: string; children: ReactNode }) {
  return <Link to="/admin/$screen" params={{ screen: s }} className={className}>{children}</Link>;
}

/* ---------- logo ---------- */
export function Logo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const box = size === "lg" ? "h-16 w-16 text-3xl rounded-2xl" : size === "sm" ? "h-8 w-8 text-base rounded-lg" : "h-10 w-10 text-lg rounded-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("grid place-items-center font-extrabold", box, light ? "bg-card text-primary" : "bg-brand text-primary-foreground")}>
        <span className="italic tracking-tighter">S</span>
      </div>
      <span className={cn("font-extrabold tracking-tight", size === "lg" ? "text-3xl" : "text-lg", light ? "text-primary-foreground" : "text-navy")}>
        Speed<span className={light ? "opacity-80" : "text-primary"}>Money</span>
      </span>
    </div>
  );
}

/* ---------- buttons ---------- */
type BtnVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "success";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-lift hover:brightness-110",
  secondary: "bg-soft text-primary hover:bg-secondary/70",
  outline: "border border-input bg-card text-navy hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:brightness-110",
  success: "bg-success text-primary-foreground hover:brightness-110",
  ghost: "text-primary hover:bg-soft",
};
export function btn(variant: BtnVariant = "primary", size: "md" | "sm" | "lg" = "md", full = false) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:pointer-events-none",
    size === "lg" ? "h-14 px-6 text-base" : size === "sm" ? "h-9 px-3.5 text-sm" : "h-12 px-5 text-sm",
    full && "w-full",
    btnStyles[variant],
  );
}
export function Button({ variant = "primary", size = "md", full, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "md" | "sm" | "lg"; full?: boolean }) {
  return <button {...p} className={cn(btn(variant, size, full), className)} />;
}

/* ---------- card / badge ---------- */
export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn("rounded-2xl border border-border/70 bg-card shadow-card", className)}>{children}</div>;
}

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-soft text-primary",
  neutral: "bg-muted text-muted-foreground",
};
const statusTone: Record<string, Tone> = {
  paid: "success", successful: "success", verified: "success", active: "success", approved: "success", uploaded: "success", completed: "success", sent: "success", deposited: "success", success: "success",
  due: "warning", pending: "warning", "under review": "warning", "disbursement pending": "warning", "pending disbursement": "warning", required: "warning", "due today": "warning", scheduled: "info", submitted: "info", upcoming: "info", new: "info", held: "warning",
  overdue: "danger", failed: "danger", rejected: "danger", inactive: "neutral", "not completed": "neutral", existing: "neutral",
};
export function Badge({ children, tone }: { children: ReactNode; tone?: Tone }) {
  const t = tone ?? statusTone[String(children).toLowerCase()] ?? "neutral";
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", tones[t])}>{children}</span>;
}

/* ---------- mobile chrome ---------- */
export function MobileShell({ children, nav, className }: { children: ReactNode; nav?: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-muted/60 md:py-8">
      <div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col bg-background md:min-h-[860px] md:overflow-hidden md:rounded-[2.25rem] md:border md:border-border md:shadow-card">
        <div className={cn("flex-1 pb-6", nav && "pb-24", className)}>{children}</div>
        {nav}
      </div>
    </div>
  );
}

export function AppHeader({ title, back, right, subtitle }: { title: string; back?: ReactNode; right?: ReactNode; subtitle?: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/90 px-5 pb-3 pt-5 backdrop-blur">
      {back}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
export const backCls = "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-navy";
export function BackIcon() { return <ArrowLeft className="h-5 w-5" />; }

export function BottomNav({ items, active }: { items: { s: string; label: string; icon: ComponentType<{ className?: string }>; link: (p: { s: string; className?: string; children: ReactNode }) => ReactNode }[]; active: string }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 grid border-t border-border bg-card/95 px-2 pb-3 pt-2 backdrop-blur" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(({ s, label, icon: Icon, link }) => (
        <div key={s}>
          {link({
            s,
            className: cn("flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium", active === s ? "text-primary" : "text-muted-foreground"),
            children: (
              <>
                <span className={cn("grid h-8 w-12 place-items-center rounded-full", active === s && "bg-soft")}><Icon className="h-5 w-5" /></span>
                {label}
              </>
            ),
          })}
        </div>
      ))}
    </nav>
  );
}

/* ---------- forms ---------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
export const inputCls = "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-navy outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10";
export function Input(p: React.ComponentPropsWithRef<"input">) {
  return <input {...p} className={cn(inputCls, p.className)} />;
}
export function Select({ options, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <select {...p} className={cn(inputCls, "appearance-none bg-[length:16px] pr-10")}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
export function SearchBar({ placeholder = "Search" }: { placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input placeholder={placeholder} className={cn(inputCls, "h-11 pl-10")} />
    </div>
  );
}

export function OtpInput({ length = 6, onComplete }: { length?: number; onComplete?: (v: string) => void }) {
  const [vals, setVals] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className="flex justify-between gap-2">
      {vals.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={v}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            const next = [...vals]; next[i] = d; setVals(next);
            if (d && i < length - 1) refs.current[i + 1]?.focus();
            if (next.every(Boolean)) onComplete?.(next.join(""));
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !v && i > 0) refs.current[i - 1]?.focus(); }}
          className={cn("h-14 w-full rounded-xl border bg-card text-center text-xl font-bold text-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10", v ? "border-primary" : "border-input")}
        />
      ))}
    </div>
  );
}

export function useCountdown(start = 30) {
  const [t, setT] = useState(start);
  useEffect(() => { if (t <= 0) return; const id = setTimeout(() => setT(t - 1), 1000); return () => clearTimeout(id); }, [t]);
  return [t, () => setT(start)] as const;
}

/* ---------- chips / tabs ---------- */
export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn("h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition", value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-navy")}>
          {o}
        </button>
      ))}
    </div>
  );
}
export function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-6 border-b border-border">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn("-mb-px border-b-2 pb-3 text-sm font-semibold", value === o ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-navy")}>{o}</button>
      ))}
    </div>
  );
}

/* ---------- progress / stepper ---------- */
export function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-2 overflow-hidden rounded-full bg-soft", className)}><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div>;
}
export function StepBar({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="px-5">
      <div className="mb-2 flex justify-between text-xs font-semibold"><span className="text-primary">Step {step} of {total}</span><span className="text-muted-foreground">{Math.round((step / total) * 100)}%</span></div>
      <div className="flex gap-1.5">{Array.from({ length: total }).map((_, i) => <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-soft")} />)}</div>
    </div>
  );
}
export function Timeline({ items }: { items: { label: string; sub?: string; state: "done" | "current" | "todo" }[] }) {
  return (
    <ol>
      {items.map((it, i) => (
        <li key={it.label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && <span className={cn("absolute left-[13px] top-7 h-[calc(100%-28px)] w-0.5", it.state === "done" ? "bg-primary" : "bg-border")} />}
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold", it.state === "done" && "border-primary bg-primary text-primary-foreground", it.state === "current" && "border-primary bg-card text-primary ring-4 ring-primary/15", it.state === "todo" && "border-border bg-card text-muted-foreground")}>
            {it.state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <div className="pt-0.5">
            <p className={cn("text-sm font-semibold", it.state === "todo" ? "text-muted-foreground" : "text-navy")}>{it.label}</p>
            {it.sub && <p className="text-xs text-muted-foreground">{it.sub}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- rows ---------- */
export function KV({ k, v, strong }: { k: string; v: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("tnum text-right text-navy", strong ? "font-bold" : "font-semibold")}>{v}</span>
    </div>
  );
}
export function IconTile({ icon: Icon, tone = "info" }: { icon: ComponentType<{ className?: string }>; tone?: Tone }) {
  return <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></span>;
}

/* ---------- states ---------- */
export function ResultState({ tone, icon: Icon, title, sub }: { tone: "success" | "danger"; icon: ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={cn("grid h-24 w-24 place-items-center rounded-full", tone === "success" ? "bg-success-soft" : "bg-destructive-soft")}>
        <div className={cn("grid h-16 w-16 place-items-center rounded-full text-primary-foreground", tone === "success" ? "bg-success" : "bg-destructive")}><Icon className="h-8 w-8" /></div>
      </div>
      <h2 className="mt-6 text-2xl font-bold text-navy">{title}</h2>
      {sub && <p className="mt-2 max-w-xs text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
export function EmptyState({ icon: Icon, title, sub }: { icon: ComponentType<{ className?: string }>; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <IconTile icon={Icon} tone="neutral" />
      <p className="mt-3 text-sm font-semibold text-navy">{title}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

/* ---------- upload / signature ---------- */
export function UploadCard({ title, sub = "PDF / JPG / PNG • Max 5 MB", initial = "idle" }: { title: string; sub?: string; initial?: "idle" | "uploading" | "done" }) {
  const [st, setSt] = useState(initial);
  return (
    <Card className="flex items-center gap-3 p-4">
      <IconTile icon={FileText} tone={st === "done" ? "success" : "info"} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        {st === "uploading" ? <Progress value={60} className="mt-2 h-1.5" /> : <p className="text-xs text-muted-foreground">{st === "done" ? `${title.toLowerCase().replace(/\W+/g, "_")}.pdf` : sub}</p>}
      </div>
      {st === "done" ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-success"><Check className="h-4 w-4" /> Uploaded</span>
      ) : (
        <button disabled={st === "uploading"} onClick={() => { setSt("uploading"); setTimeout(() => setSt("done"), 1100); }} className={btn("secondary", "sm")}>
          <Upload className="h-4 w-4" />{st === "uploading" ? "…" : "Upload"}
        </button>
      )}
    </Card>
  );
}

export function SignaturePad({ onChange }: { onChange?: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [signed, setSigned] = useState(false);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-input bg-card">
        <canvas
          ref={ref} width={360} height={200} className="h-[200px] w-full touch-none"
          onPointerDown={(e) => { drawing.current = true; const c = ref.current!.getContext("2d")!; const [x, y] = pos(e); c.beginPath(); c.moveTo(x, y); }}
          onPointerMove={(e) => { if (!drawing.current) return; const c = ref.current!.getContext("2d")!; c.lineWidth = 2.5; c.lineCap = "round"; c.strokeStyle = getComputedStyle(ref.current!).color; const [x, y] = pos(e); c.lineTo(x, y); c.stroke(); if (!signed) { setSigned(true); onChange?.(true); } }}
          onPointerUp={() => { drawing.current = false; }}
          style={{ color: "var(--navy)" }}
        />
        {!signed && <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">Sign here</p>}
        <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-border" />
      </div>
      <button onClick={() => { ref.current!.getContext("2d")!.clearRect(0, 0, 360, 200); setSigned(false); onChange?.(false); }} className={cn(btn("ghost", "sm"), "mt-2")}><Eraser className="h-4 w-4" /> Clear</button>
    </div>
  );
}

/* ---------- table (admin) ---------- */
export function Table({ cols, rows }: { cols: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {cols.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-soft/40">
              {r.map((c, j) => <td key={j} className="tnum whitespace-nowrap px-4 py-3 text-navy">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  total,
  page,
  limit = 10,
  onPageChange,
}: {
  total: number;
  page?: number;
  limit?: number;
  onPageChange?: (p: number) => void;
}) {
  if (!onPageChange || page === undefined) {
    return (
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Showing 1–{Math.min(8, total)} of {total}</span>
        <div className="flex gap-1">
          {["‹", "1", "2", "3", "›"].map((p, i) => (
            <button key={i} className={cn("h-8 min-w-8 rounded-lg border px-2 font-semibold", p === "1" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-navy")}>
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>Showing {start}–{end} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 min-w-8 rounded-lg border border-border bg-card px-2 font-semibold text-navy disabled:opacity-40 hover:bg-muted transition"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            return (
              <span key={p} className="flex items-center gap-1">
                {prev && p - prev > 1 && <span className="px-1 text-muted-foreground">…</span>}
                <button
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "h-8 min-w-8 rounded-lg border px-2 font-semibold transition",
                    p === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-navy hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              </span>
            );
          })}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-8 min-w-8 rounded-lg border border-border bg-card px-2 font-semibold text-navy disabled:opacity-40 hover:bg-muted transition"
        >
          ›
        </button>
      </div>
    </div>
  );
}
