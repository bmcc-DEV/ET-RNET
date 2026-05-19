import { Suspense, useEffect, useState, lazy } from "react";
import { Router, Route, Switch } from "wouter";
import { nativeBridge } from "./network/NativeBridge";
import AppLayout from "./layouts/AppLayout";
import { categories, getRoutesByCategory } from "./router";

// Eager imports — landing page (above-the-fold)
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Overview from "./components/Overview";
import Onboarding from "./components/Onboarding";
import Guarantees from "./components/Guarantees";
import Roadmap from "./components/Roadmap";
import Manifesto from "./components/Manifesto";
import Footer from "./components/Footer";

// Lazy imports used directly in LandingPage
const Glossary = lazy(() => import("./components/Glossary"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-32 text-zinc-600 font-mono text-xs">
      <div className="animate-pulse">CARREGANDO...</div>
    </div>
  );
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  if (ua.includes("Edg")) return "edge";
  return "chrome";
}

function BrowserWarning({ browser }: { browser: string }) {
  if (browser === "chrome" || browser === "edge") return null;
  const limitations: Record<string, string[]> = {
    firefox: ["Web Bluetooth", "Web Serial"],
    safari: ["Web Bluetooth", "Web Serial", "Web NFC"],
  };
  const missing = limitations[browser] || [];
  if (missing.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 border-t border-yellow-500/30 px-4 py-2 text-xs font-mono text-yellow-400/80 flex items-center gap-2 backdrop-blur-sm">
      <span className="text-yellow-500">&#9888;</span>
      <span>Hardware local limitado ({missing.join(", ")}). Use Chrome para acesso completo ao HCN.</span>
    </div>
  );
}

/** Landing page — Hero + Grid de Cards por Categoria */
function LandingPage() {
  return (
    <div className="scanlines noise min-h-screen text-zinc-300 selection:bg-[#b6ff3a] selection:text-black">
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Overview />

        {/* Explore Grid — cards por categoria */}
        <section className="border-b border-[#14181c] bg-black">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="flex items-center gap-3 mb-2">
              <span className="tag">02</span>
              <span className="tag">EXPLORAR PROTOCOLOS</span>
            </div>
            <h2 className="font-sans font-light text-3xl md:text-4xl text-zinc-100 mb-3">
              70+ módulos. <span className="italic text-zinc-500">Cada um independente.</span>
            </h2>
            <p className="text-zinc-500 text-sm mb-12 max-w-xl">
              Clique em qualquer card para abrir o módulo completo. Cada painel roda isolado com lazy loading.
            </p>

            {/* Featured cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-16">
              {[
                { path: "/messenger", label: "VOID Messenger", desc: "Chat E2EE com GhostID, QEL e Double Ratchet. Offline via BLE.", color: "#a855f7", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                { path: "/harvester", label: "Phantom Harvester", desc: "Scraper universal de contatos + corretoras crypto. Telegram, X, Binance, Coinbase.", color: "#f59e0b", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { path: "/dashboard", label: "Dashboard", desc: "Painel principal do ecossistema ET-RNET com métricas em tempo real.", color: "#10b981", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
              ].map((card) => (
                <a
                  key={card.path}
                  href={card.path}
                  className="group block border border-[#1a1f26] rounded-lg p-6 hover:border-[#2a2f36] transition-all no-underline"
                  style={{ borderLeftColor: card.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ background: `${card.color}15` }}>
                      <svg className="w-5 h-5" fill="none" stroke={card.color} viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-sm text-zinc-200 group-hover:text-white transition-colors">{card.label}</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                  <div className="mt-4 text-[10px] font-mono tracking-wider" style={{ color: card.color }}>
                    ABRIR MÓDULO →
                  </div>
                </a>
              ))}
            </div>

            {/* Category grids */}
            {categories.filter((c) => c.id !== "home").map((cat) => (
              <CategorySection key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        <Guarantees />
        <Roadmap />
        <Manifesto />
        <Suspense fallback={null}>
          <Glossary />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function CategorySection({ category }: { category: { id: string; label: string; icon: string; color: string; description: string } }) {
  const categoryRoutes = getRoutesByCategory(category.id);
  if (categoryRoutes.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 flex items-center justify-center rounded" style={{ background: `${category.color}15` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke={category.color} viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={category.icon} />
          </svg>
        </div>
        <h3 className="font-mono text-xs tracking-wider uppercase" style={{ color: category.color }}>
          {category.label}
        </h3>
        <span className="text-[9px] font-mono text-zinc-700">{categoryRoutes.length} módulos</span>
        <div className="flex-1 h-px bg-[#1a1f26]" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categoryRoutes.map((route) => (
          <a
            key={route.path}
            href={route.path}
            className="group flex items-start gap-3 p-3 border border-[#1a1f26] rounded-lg hover:border-[#2a2f36] hover:bg-[#0a0d10] transition-all no-underline"
          >
            <div className="w-7 h-7 flex items-center justify-center rounded flex-shrink-0 mt-0.5" style={{ background: `${category.color}10` }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke={category.color} viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={route.icon} />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[11px] text-zinc-300 group-hover:text-white transition-colors truncate">
                {route.label}
              </div>
              <div className="text-[9px] text-zinc-600 line-clamp-2 leading-relaxed mt-0.5">
                {route.description}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [browser] = useState(detectBrowser);

  useEffect(() => {
    const isLocalDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const isKnownRelayNoise = (reason: unknown): boolean => {
      if (!(reason instanceof Error)) return false;
      const msg = reason.message.toLowerCase();
      return msg.includes("invalid: id is computed incorrectly") || msg.includes("rate-limited") || msg.includes("pow:");
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isLocalDev) return;
      if (isKnownRelayNoise(event.reason)) event.preventDefault();
    };

    if (nativeBridge.isAvailable()) nativeBridge.activateCarrierService();
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    if ("serviceWorker" in navigator) {
      if (!isLocalDev) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").then(() => {
            console.log("[VØID] Service Worker registrado no Stratum 3.");
          });
        });
      } else {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => void r.unregister());
        });
      }
    }

    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return (
    <Router>
      <Switch>
        {/* Landing page at root */}
        <Route path="/" component={LandingPage} />

        {/* All panel routes use AppLayout with sidebar/bottombar */}
        <Route path="/:rest*">
          <AppLayout />
        </Route>
      </Switch>
      <BrowserWarning browser={browser} />
    </Router>
  );
}
