import { lazy, Suspense, useEffect, useState } from "react";
import { nativeBridge } from "./network/NativeBridge";

// Eager imports — lightweight/above-the-fold
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Overview from "./components/Overview";
import Onboarding from "./components/Onboarding";
import Guarantees from "./components/Guarantees";
import Roadmap from "./components/Roadmap";
import Manifesto from "./components/Manifesto";
import Footer from "./components/Footer";

// Lazy imports — heavy interactive panels
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
const Glossary = lazy(() => import("./components/Glossary"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-32 text-zinc-600 font-mono text-xs">
      <div className="animate-pulse">LOADING...</div>
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
      <span>
        Hardware local limitado ({missing.join(", ")}). Use Chrome para acesso completo ao HCN.
      </span>
    </div>
  );
}

export default function App() {
  const [browser] = useState(detectBrowser);

  useEffect(() => {
    if (nativeBridge.isAvailable()) {
      nativeBridge.activateCarrierService();
    }
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(() => {
          console.log("[VØID] Service Worker registrado no Stratum 3.");
        });
      });
    }
  }, []);

  return (
    <div className="scanlines noise min-h-screen text-zinc-300 selection:bg-[#b6ff3a] selection:text-black">
      <Nav />
      <main>
        <Suspense fallback={<LoadingFallback />}>
          {/* === ORIGENS & CORE === */}
          <Hero />
          <Marquee />
          <Overview />
          <EternetDashboard />
          <ActiveTerminal />
          <CoreInnovations />
          <Onboarding />

          {/* === CRYPTO LABS === */}
          <ZKPLab />
          <KarmaWalletPanel />
          <DEXPanel />
          <RwaTokenizationPanel />
          <StablecoinPanel />
          <SupplyChainSecurity />

          {/* === REDE & TRANSPORTE === */}
          <DistanceBridge />
          <GhostVPNPanel />
          <ParasiticArchitecture />
          <SymbiontInoculator />

          {/* === CAMADA 2: TECNOLOGIAS EMERGENTES === */}
          <EcoNetPanel />
          <MirageComputePanel />
          <AegisVaultPanel />

          {/* === CAMADA 3: FINANÇAS SOBERANAS === */}
          <JanusFinancePanel />
          <ChimeraExchangePanel />
          <SovereignPoolsPanel />

          {/* === CAMADA 4: PHANTOM SHOPPER === */}
          <PhantomShopperPanel />

          {/* === HYDRA & OMEGA === */}
          <Hydra />
          <Omega />
          <HGPUVisualizer />
          <PaleoPanel />

          {/* === SOCIAL & PALEO === */}
          <SocialFabricPanel />
          <CryptoTestamentLab />

          {/* === INFRAESTRUTURA === */}
          <Guarantees />
          <Roadmap />
          <Manifesto />
          <Glossary />
        </Suspense>
      </main>
      <Footer />
      <BrowserWarning browser={browser} />
    </div>
  );
}
