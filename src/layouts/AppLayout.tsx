import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Route, Switch } from "wouter";
import Sidebar from "../components/Sidebar";
import BottomBar from "../components/BottomBar";
import { routes } from "../router";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-zinc-600 font-mono text-xs">
      <div className="animate-pulse">CARREGANDO...</div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function AppLayout({ children }: { children?: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-black text-zinc-300">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <main
        className={`min-h-screen ${!isMobile ? "ml-60" : "pb-16"}`}
        style={{ contain: "layout" }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            {/* All panel routes */}
            {routes.map((route) => (
              <Route key={route.path} path={route.path}>
                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                  <route.component />
                </div>
              </Route>
            ))}

            {/* Fallback */}
            <Route>
              <div className="p-4 md:p-6">{children}</div>
            </Route>
          </Switch>
        </Suspense>
      </main>

      {/* Mobile Bottom Bar */}
      {isMobile && <BottomBar />}
    </div>
  );
}
