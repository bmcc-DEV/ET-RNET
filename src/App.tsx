import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Overview from "./components/Overview";
import EternetDashboard from "./components/EternetDashboard";
import ActiveTerminal from "./components/ActiveTerminal";
import CoreInnovations from "./components/CoreInnovations";
import ZKPLab from "./components/ZKPLab";
import DistanceBridge from "./components/DistanceBridge";
import Hydra from "./components/Hydra";
import Omega from "./components/Omega";
import SupplyChainSecurity from "./components/SupplyChainSecurity";
import ParasiticArchitecture from "./components/ParasiticArchitecture";
import CryptoTestamentLab from "./components/CryptoTestamentLab";
import Guarantees from "./components/Guarantees";
import Roadmap from "./components/Roadmap";
import Manifesto from "./components/Manifesto";
import Footer from "./components/Footer";

// Novos módulos ETΞRNET
import GhostVPNPanel from "./components/GhostVPNPanel";
import EcoNetPanel from "./components/EcoNetPanel";
import MirageComputePanel from "./components/MirageComputePanel";
import AegisVaultPanel from "./components/AegisVaultPanel";
import JanusFinancePanel from "./components/JanusFinancePanel";
import ChimeraExchangePanel from "./components/ChimeraExchangePanel";
import SovereignPoolsPanel from "./components/SovereignPoolsPanel";
import PhantomShopperPanel from "./components/PhantomShopperPanel";

// Painéis existentes (não importados antes)
import KarmaWalletPanel from "./components/KarmaWallet";
import DEXPanel from "./components/DEXPanel";
import RwaTokenizationPanel from "./components/RwaTokenizationPanel";
import StablecoinPanel from "./components/StablecoinPanel";
import SocialFabricPanel from "./components/SocialFabricPanel";
import PaleoPanel from "./components/PaleoPanel";
import HGPUVisualizer from "./components/HGPUVisualizer";
import SymbiontInoculator from "./components/SymbiontInoculator";
import Onboarding from "./components/Onboarding";
import Glossary from "./components/Glossary";

import { useEffect } from "react";
import { nativeBridge } from "./network/NativeBridge";

export default function App() {
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
      </main>
      <Footer />
    </div>
  );
}
