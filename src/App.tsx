import { Suspense, useEffect, useState, lazy } from "react";
import { Router, Route, Switch } from "wouter";
import { nativeBridge } from "./network/NativeBridge";
import AppLayout from "./layouts/AppLayout";

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

// Lazy imports — heavy panels (loaded on demand by router)
const EternetDashboard = lazy(() => import("./components/EternetDashboard"));
const ActiveTerminal = lazy(() => import("./components/ActiveTerminal"));
const CoreInnovations = lazy(() => import("./components/CoreInnovations"));
const ZKPLab = lazy(() => import("./components/ZKPLab"));
const KarmaWalletPanel = lazy(() => import("./components/KarmaWallet"));
const DEXPanel = lazy(() => import("./components/DEXPanel"));
const RwaTokenizationPanel = lazy(() => import("./components/RwaTokenizationPanel"));
const StablecoinPanel = lazy(() => import("./components/StablecoinPanel"));
const SupplyChainSecurity = lazy(() => import("./components/SupplyChainSecurity"));
const DistanceBridge = lazy(() => import("./components/DistanceBridge"));
const GhostVPNPanel = lazy(() => import("./components/GhostVPNPanel"));
const ParasiticArchitecture = lazy(() => import("./components/ParasiticArchitecture"));
const SymbiontInoculator = lazy(() => import("./components/SymbiontInoculator"));
const EcoNetPanel = lazy(() => import("./components/EcoNetPanel"));
const MirageComputePanel = lazy(() => import("./components/MirageComputePanel"));
const AegisVaultPanel = lazy(() => import("./components/AegisVaultPanel"));
const JanusFinancePanel = lazy(() => import("./components/JanusFinancePanel"));
const ChimeraExchangePanel = lazy(() => import("./components/ChimeraExchangePanel"));
const SovereignPoolsPanel = lazy(() => import("./components/SovereignPoolsPanel"));
const PhantomShopperPanel = lazy(() => import("./components/PhantomShopperPanel"));
const Hydra = lazy(() => import("./components/Hydra"));
const Omega = lazy(() => import("./components/Omega"));
const HGPUVisualizer = lazy(() => import("./components/HGPUVisualizer"));
const PaleoPanel = lazy(() => import("./components/PaleoPanel"));
const SocialFabricPanel = lazy(() => import("./components/SocialFabricPanel"));
const CryptoTestamentLab = lazy(() => import("./components/CryptoTestamentLab"));
const MiningPanel = lazy(() => import("./components/MiningPanel"));
const Glossary = lazy(() => import("./components/Glossary"));
const CollapseAlgebraPanel = lazy(() => import("./components/CollapseAlgebraPanel"));
const LSCPanel = lazy(() => import("./components/LSCPanel"));
const AnacroclastiaPanel = lazy(() => import("./components/AnacroclastiaPanel"));
const CollapseFinancePanel = lazy(() => import("./components/CollapseFinancePanel"));
const QRStocksPanel = lazy(() => import("./components/QRStocksPanel"));
const HomotopyMiningPanel = lazy(() => import("./components/HomotopyMiningPanel"));
const AnimusSubstratesPanel = lazy(() => import("./components/AnimusSubstratesPanel"));
const QRCTopologyPanel = lazy(() => import("./components/QRCTopologyPanel"));
const LuaPluginPanel = lazy(() => import("./components/LuaPluginPanel"));
const VhgpuFarmPanel = lazy(() => import("./components/VhgpuFarmPanel"));
const QuantumDaoPanel = lazy(() => import("./components/QuantumDaoPanel"));
const PoWFaucetPanel = lazy(() => import("./components/PoWFaucetPanel"));
const DoubleSpendDefenseLab = lazy(() => import("./components/DoubleSpendDefenseLab"));
const AntiSybilLab = lazy(() => import("./components/AntiSybilLab"));
const TemporalOracleLab = lazy(() => import("./components/TemporalOracleLab"));
const QRNGPanel = lazy(() => import("./components/QRNGPanel"));
const NostrOraclePanel = lazy(() => import("./components/NostrOraclePanel"));
const SocialRecoveryPanel = lazy(() => import("./components/SocialRecoveryPanel"));
const AcousticHandshakePanel = lazy(() => import("./components/AcousticHandshakePanel"));
const SphinxMixnetPanel = lazy(() => import("./components/SphinxMixnetPanel"));
const DifferentialCorePanel = lazy(() => import("./components/DifferentialCorePanel"));
const PaymentGatewayPanel = lazy(() => import("./components/PaymentGatewayPanel"));
const WatchtowerPanel = lazy(() => import("./components/WatchtowerPanel"));
const PaleoYieldPanel = lazy(() => import("./components/PaleoYieldPanel"));
const NostrDEXPanel = lazy(() => import("./components/NostrDEXPanel"));
const HGPUComputePanel = lazy(() => import("./components/HGPUComputePanel"));
const GhostMailboxPanel = lazy(() => import("./components/GhostMailboxPanel"));
const OctreeSDFPanel = lazy(() => import("./components/OctreeSDFPanel"));
const NostrSyncPanel = lazy(() => import("./components/NostrSyncPanel"));
const GhostLockerPanel = lazy(() => import("./components/GhostLockerPanel"));
const GPUMiningPanel = lazy(() => import("./components/GPUMiningPanel"));
const Messenger = lazy(() => import("./components/Messenger"));
const PhantomHarvesterPanel = lazy(() => import("./components/PhantomHarvesterPanel"));

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

/** Landing page — the original scroll experience */
function LandingPage() {
  return (
    <div className="scanlines noise min-h-screen text-zinc-300 selection:bg-[#b6ff3a] selection:text-black">
      <Nav />
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Hero />
          <Marquee />
          <Overview />
          <EternetDashboard />
          <ActiveTerminal />
          <CoreInnovations />
          <Onboarding />
          <ZKPLab />
          <KarmaWalletPanel />
          <DEXPanel />
          <RwaTokenizationPanel />
          <StablecoinPanel />
          <SupplyChainSecurity />
          <DistanceBridge />
          <GhostVPNPanel />
          <ParasiticArchitecture />
          <SymbiontInoculator />
          <EcoNetPanel />
          <MirageComputePanel />
          <AegisVaultPanel />
          <JanusFinancePanel />
          <ChimeraExchangePanel />
          <SovereignPoolsPanel />
          <PhantomShopperPanel />
          <PhantomHarvesterPanel />
          <QuantumDaoPanel />
          <PoWFaucetPanel />
          <AntiSybilLab />
          <DoubleSpendDefenseLab />
          <TemporalOracleLab />
          <Hydra />
          <Omega />
          <HGPUVisualizer />
          <MiningPanel />
          <VhgpuFarmPanel />
          <LuaPluginPanel />
          <PaleoPanel />
          <CollapseAlgebraPanel />
          <LSCPanel />
          <QRCTopologyPanel />
          <AnacroclastiaPanel />
          <CollapseFinancePanel />
          <QRStocksPanel />
          <HomotopyMiningPanel />
          <AnimusSubstratesPanel />
          <Messenger />
          <SocialFabricPanel />
          <CryptoTestamentLab />
          <QRNGPanel />
          <NostrOraclePanel />
          <SocialRecoveryPanel />
          <AcousticHandshakePanel />
          <SphinxMixnetPanel />
          <DifferentialCorePanel />
          <PaymentGatewayPanel />
          <WatchtowerPanel />
          <PaleoYieldPanel />
          <NostrDEXPanel />
          <HGPUComputePanel />
          <GhostMailboxPanel />
          <OctreeSDFPanel />
          <NostrSyncPanel />
          <GhostLockerPanel />
          <GPUMiningPanel />
          <Guarantees />
          <Roadmap />
          <Manifesto />
          <Glossary />
        </Suspense>
      </main>
      <Footer />
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
