import { lazy } from "react";

export interface RouteDef {
  path: string;
  label: string;
  icon: string;
  category: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

export const categories = [
  { id: "home", label: "Início", icon: "◈" },
  { id: "crypto", label: "Crypto", icon: "🔐" },
  { id: "finance", label: "Finance", icon: "◈" },
  { id: "network", label: "Network", icon: "◎" },
  { id: "compute", label: "Compute", icon: "⬡" },
  { id: "quantum", label: "Quantum", icon: "∿" },
  { id: "governance", label: "Governança", icon: "⬡" },
  { id: "defi", label: "DeFi", icon: "◈" },
  { id: "terminal", label: "Terminal", icon: ">" },
] as const;

export const routes: RouteDef[] = [
  // ── Top-level ──
  { path: "/messenger", label: "VOID Messenger", icon: "◈", category: "home", component: lazy(() => import("./components/Messenger")) },
  { path: "/harvester", label: "Phantom Harvester", icon: "◎", category: "home", component: lazy(() => import("./components/PhantomHarvesterPanel")) },
  { path: "/dashboard", label: "Dashboard", icon: "▦", category: "home", component: lazy(() => import("./components/EternetDashboard")) },

  // ── Crypto ──
  { path: "/crypto/zkp", label: "ZKP Lab", icon: "🔐", category: "crypto", component: lazy(() => import("./components/ZKPLab")) },
  { path: "/crypto/ghostid", label: "GhostID / VPN", icon: "◈", category: "crypto", component: lazy(() => import("./components/GhostVPNPanel")) },
  { path: "/crypto/pqc", label: "PQC (Post-Quantum)", icon: "⬡", category: "crypto", component: lazy(() => import("./components/CoreInnovations")) },
  { path: "/crypto/testament", label: "Crypto Testament", icon: "◎", category: "crypto", component: lazy(() => import("./components/CryptoTestamentLab")) },
  { path: "/crypto/karma", label: "Karma Wallet", icon: "◈", category: "crypto", component: lazy(() => import("./components/KarmaWallet")) },

  // ── Finance ──
  { path: "/finance/dex", label: "DEX", icon: "◈", category: "finance", component: lazy(() => import("./components/DEXPanel")) },
  { path: "/finance/chimera", label: "Chimera Exchange", icon: "◎", category: "finance", component: lazy(() => import("./components/ChimeraExchangePanel")) },
  { path: "/finance/nostr-dex", label: "Nostr DEX", icon: "⬡", category: "finance", component: lazy(() => import("./components/NostrDEXPanel")) },
  { path: "/finance/stablecoin", label: "Stablecoin", icon: "◈", category: "finance", component: lazy(() => import("./components/StablecoinPanel")) },
  { path: "/finance/rwa", label: "RWA Tokenization", icon: "◎", category: "finance", component: lazy(() => import("./components/RwaTokenizationPanel")) },
  { path: "/finance/pools", label: "Sovereign Pools", icon: "⬡", category: "finance", component: lazy(() => import("./components/SovereignPoolsPanel")) },
  { path: "/finance/janus", label: "Janus Finance", icon: "◈", category: "finance", component: lazy(() => import("./components/JanusFinancePanel")) },
  { path: "/finance/payment", label: "Payment Gateway", icon: "◎", category: "finance", component: lazy(() => import("./components/PaymentGatewayPanel")) },
  { path: "/finance/collapse", label: "Collapse Finance", icon: "∿", category: "finance", component: lazy(() => import("./components/CollapseFinancePanel")) },

  // ── Network ──
  { path: "/network/distance", label: "Distance Bridge", icon: "◎", category: "network", component: lazy(() => import("./components/DistanceBridge")) },
  { path: "/network/parasitic", label: "Parasitic Arch", icon: "⬡", category: "network", component: lazy(() => import("./components/ParasiticArchitecture")) },
  { path: "/network/echonet", label: "EcoNet", icon: "◈", category: "network", component: lazy(() => import("./components/EcoNetPanel")) },
  { path: "/network/mesh", label: "Nostr Sync", icon: "◎", category: "network", component: lazy(() => import("./components/NostrSyncPanel")) },
  { path: "/network/acoustic", label: "Acoustic Handshake", icon: "∿", category: "network", component: lazy(() => import("./components/AcousticHandshakePanel")) },
  { path: "/network/supply-chain", label: "Supply Chain", icon: "⬡", category: "network", component: lazy(() => import("./components/SupplyChainSecurity")) },

  // ── Compute ──
  { path: "/compute/mirage", label: "Mirage Compute", icon: "◎", category: "compute", component: lazy(() => import("./components/MirageComputePanel")) },
  { path: "/compute/hgpu", label: "HGPU Visualizer", icon: "⬡", category: "compute", component: lazy(() => import("./components/HGPUVisualizer")) },
  { path: "/compute/vhgpu", label: "vHGPU Farm", icon: "◈", category: "compute", component: lazy(() => import("./components/VhgpuFarmPanel")) },
  { path: "/compute/animus", label: "Animus Substrates", icon: "◎", category: "compute", component: lazy(() => import("./components/AnimusSubstratesPanel")) },
  { path: "/compute/hydra", label: "Hydra", icon: "◈", category: "compute", component: lazy(() => import("./components/Hydra")) },
  { path: "/compute/omega", label: "Omega", icon: "⬡", category: "compute", component: lazy(() => import("./components/Omega")) },
  { path: "/compute/hgpu-compute", label: "HGPU Compute", icon: "◎", category: "compute", component: lazy(() => import("./components/HGPUComputePanel")) },

  // ── Quantum ──
  { path: "/quantum/lsc", label: "LSC Panel", icon: "∿", category: "quantum", component: lazy(() => import("./components/LSCPanel")) },
  { path: "/quantum/qrc", label: "QRC Topology", icon: "◎", category: "quantum", component: lazy(() => import("./components/QRCTopologyPanel")) },
  { path: "/quantum/paleo", label: "Paleo Panel", icon: "⬡", category: "quantum", component: lazy(() => import("./components/PaleoPanel")) },
  { path: "/quantum/collapse", label: "Collapse Algebra", icon: "∿", category: "quantum", component: lazy(() => import("./components/CollapseAlgebraPanel")) },
  { path: "/quantum/anacroclastia", label: "Anacroclastia", icon: "◎", category: "quantum", component: lazy(() => import("./components/AnacroclastiaPanel")) },
  { path: "/quantum/oracle", label: "Nostr Oracle", icon: "◈", category: "quantum", component: lazy(() => import("./components/NostrOraclePanel")) },
  { path: "/quantum/qrng", label: "QRNG", icon: "◎", category: "quantum", component: lazy(() => import("./components/QRNGPanel")) },
  { path: "/quantum/qrstocks", label: "QR Stocks", icon: "◈", category: "quantum", component: lazy(() => import("./components/QRStocksPanel")) },

  // ── Governance ──
  { path: "/governance/dao", label: "Quantum DAO", icon: "⬡", category: "governance", component: lazy(() => import("./components/QuantumDaoPanel")) },
  { path: "/governance/anti-sybil", label: "Anti-Sybil Lab", icon: "◎", category: "governance", component: lazy(() => import("./components/AntiSybilLab")) },
  { path: "/governance/double-spend", label: "Double Spend", icon: "◈", category: "governance", component: lazy(() => import("./components/DoubleSpendDefenseLab")) },
  { path: "/governance/temporal", label: "Temporal Oracle", icon: "∿", category: "governance", component: lazy(() => import("./components/TemporalOracleLab")) },
  { path: "/governance/social-recovery", label: "Social Recovery", icon: "◎", category: "governance", component: lazy(() => import("./components/SocialRecoveryPanel")) },

  // ── DeFi ──
  { path: "/defi/phopper", label: "Phantom Shopper", icon: "◎", category: "defi", component: lazy(() => import("./components/PhantomShopperPanel")) },
  { path: "/defi/aegis", label: "Aegis Vault", icon: "◈", category: "defi", component: lazy(() => import("./components/AegisVaultPanel")) },
  { path: "/defi/yield", label: "Paleo Yield", icon: "◎", category: "defi", component: lazy(() => import("./components/PaleoYieldPanel")) },
  { path: "/defi/ghost-locker", label: "Ghost Locker", icon: "◈", category: "defi", component: lazy(() => import("./components/GhostLockerPanel")) },
  { path: "/defi/faucet", label: "PoW Faucet", icon: "◎", category: "defi", component: lazy(() => import("./components/PoWFaucetPanel")) },

  // ── Terminal ──
  { path: "/terminal", label: "Active Terminal", icon: ">", category: "terminal", component: lazy(() => import("./components/ActiveTerminal")) },
  { path: "/terminal/symbiont", label: "Symbiont Inoculator", icon: "◎", category: "terminal", component: lazy(() => import("./components/SymbiontInoculator")) },
  { path: "/terminal/lua", label: "Lua Plugin", icon: "◈", category: "terminal", component: lazy(() => import("./components/LuaPluginPanel")) },
  { path: "/terminal/watchtower", label: "Watchtower", icon: "◎", category: "terminal", component: lazy(() => import("./components/WatchtowerPanel")) },
  { path: "/terminal/sphinx", label: "Sphinx Mixnet", icon: "◈", category: "terminal", component: lazy(() => import("./components/SphinxMixnetPanel")) },
  { path: "/terminal/differential", label: "Differential Core", icon: "◎", category: "terminal", component: lazy(() => import("./components/DifferentialCorePanel")) },
  { path: "/terminal/mining", label: "Mining", icon: "◈", category: "terminal", component: lazy(() => import("./components/MiningPanel")) },
  { path: "/terminal/gpu-mining", label: "GPU Mining", icon: "◎", category: "terminal", component: lazy(() => import("./components/GPUMiningPanel")) },
  { path: "/terminal/homotopy", label: "Homotopy Mining", icon: "∿", category: "terminal", component: lazy(() => import("./components/HomotopyMiningPanel")) },
  { path: "/terminal/ghost-mailbox", label: "Ghost Mailbox", icon: "◈", category: "terminal", component: lazy(() => import("./components/GhostMailboxPanel")) },
  { path: "/terminal/octree", label: "Octree SDF", icon: "◎", category: "terminal", component: lazy(() => import("./components/OctreeSDFPanel")) },
  { path: "/terminal/social", label: "Social Fabric", icon: "◈", category: "terminal", component: lazy(() => import("./components/SocialFabricPanel")) },
  { path: "/terminal/glossary", label: "Glossário", icon: "◎", category: "terminal", component: lazy(() => import("./components/Glossary")) },
];

export function getRoutesByCategory(category: string): RouteDef[] {
  return routes.filter((r) => r.category === category);
}
