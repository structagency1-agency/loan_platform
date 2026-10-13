import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { Layers, X, Smartphone, LayoutDashboard, HandCoins } from "lucide-react";
import { customerScreens } from "./screens/customer";
import { AuthProvider, useAuth } from "./lib/auth";

const queryClient = new QueryClient();

const PUBLIC_SCREENS = new Set(["splash", "welcome", "login", "register", "otp"]);

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-navy">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Screen not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This customer screen does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/app/$screen"
            params={{ screen: "welcome" }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lift"
          >
            Go to Welcome
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScreenSwitcher() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  return (
    <aside aria-label="Prototype Screen Navigation" className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3.5 z-40 md:bottom-6 md:right-6">
      {open ? (
        <div className="flex max-h-[85vh] w-84 flex-col rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Customer App (:8081)</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Portal Switcher */}
          <div className="mt-3 rounded-xl bg-muted/60 p-2.5 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Speed Money Portals</div>
            <div className="grid grid-cols-3 gap-1.5">
              <a
                href="http://localhost:8081"
                className="flex flex-col items-center justify-center rounded-lg bg-primary p-2 text-center text-xs font-bold text-primary-foreground shadow"
              >
                <Smartphone className="h-4 w-4 mb-0.5" />
                <span>Customer</span>
                <span className="text-[9px] opacity-80">:8081 (Active)</span>
              </a>
              <a
                href="http://localhost:8082"
                className="flex flex-col items-center justify-center rounded-lg bg-card p-2 text-center text-xs font-medium text-foreground hover:bg-muted transition"
              >
                <LayoutDashboard className="h-4 w-4 mb-0.5 text-blue-600" />
                <span>Admin</span>
                <span className="text-[9px] text-muted-foreground">:8082</span>
              </a>
              <a
                href="http://localhost:8083"
                className="flex flex-col items-center justify-center rounded-lg bg-card p-2 text-center text-xs font-medium text-foreground hover:bg-muted transition"
              >
                <HandCoins className="h-4 w-4 mb-0.5 text-emerald-600" />
                <span>Agent</span>
                <span className="text-[9px] text-muted-foreground">:8083</span>
              </a>
            </div>
          </div>

          <div className="mt-2.5 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Demo Customer:</span> testcustomer@example.com / TestPassword123!
          </div>

          <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">App Screens ({Object.keys(customerScreens).length})</div>
          <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1 text-xs">
            {Object.entries(customerScreens).map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  nav({ to: "/app/$screen", params: { screen: k } });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium text-navy hover:bg-muted hover:text-primary transition"
              >
                <span>{v.t}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{k}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-3.5 py-2 text-xs font-bold text-navy shadow-lg backdrop-blur hover:bg-muted transition"
        >
          <Layers className="h-4 w-4 text-primary" />
          <span>Portals & Screens</span>
        </button>
      )}
    </aside>
  );
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider requiredRole="CUSTOMER">
        <Outlet />
        <ScreenSwitcher />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const SplashComp = customerScreens["splash"].c;
    return <SplashComp />;
  },
});

const appScreenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app/$screen",
  component: function AppScreen() {
    const { screen } = appScreenRoute.useParams();
    const nav = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        if (!PUBLIC_SCREENS.has(screen) && !isAuthenticated) {
          nav({ to: "/app/$screen", params: { screen: "welcome" } });
        }
      }
    }, [screen, isAuthenticated, isLoading, nav]);

    if (isLoading && !PUBLIC_SCREENS.has(screen)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">Verifying session...</p>
          </div>
        </div>
      );
    }

    if (!isLoading && !PUBLIC_SCREENS.has(screen) && !isAuthenticated) {
      const WelcomeComp = customerScreens["welcome"].c;
      return <WelcomeComp />;
    }

    const ScreenComp = customerScreens[screen]?.c;
    if (!ScreenComp) return <NotFound />;
    return <ScreenComp key={screen} />;
  },
});

const directScreenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$screen",
  component: function DirectScreen() {
    const { screen } = directScreenRoute.useParams();
    const nav = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !PUBLIC_SCREENS.has(screen) && !isAuthenticated) {
        nav({ to: "/app/$screen", params: { screen: "welcome" } });
      }
    }, [screen, isAuthenticated, isLoading, nav]);

    if (isLoading && !PUBLIC_SCREENS.has(screen)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!isLoading && !PUBLIC_SCREENS.has(screen) && !isAuthenticated) {
      const WelcomeComp = customerScreens["welcome"].c;
      return <WelcomeComp />;
    }

    const ScreenComp = customerScreens[screen]?.c;
    if (!ScreenComp) return <NotFound />;
    return <ScreenComp key={screen} />;
  },
});

const routeTree = rootRoute.addChildren([indexRoute, appScreenRoute, directScreenRoute]);

export const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
