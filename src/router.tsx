import { lazy } from "react";

export interface RouteDef {
  path: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  component: React.LazyExoticComponent<React.ComponentType>;
}

export interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const categories: CategoryDef[] = [
  { id: "home", label: "Início", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "#b6ff3a", description: "Messenger, Dashboard e Ferramentas" },
  { id: "crypto", label: "Crypto", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", color: "#f59e0b", description: "ZKP, GhostID, PQC, Criptografia" },
  { id: "finance", label: "Finance", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#10b981", description: "DEX, Exchange, Stablecoin, DeFi" },
  { id: "network", label: "Network", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9", color: "#3b82f6", description: "Distance Bridge, LoRa, EcoNet, Mesh" },
  { id: "compute", label: "Compute", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", color: "#8b5cf6", description: "Mirage, HGPU, Hydra, Omega" },
  { id: "quantum", label: "Quantum", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "#06b6d4", description: "LSC, QRC, Paleo, Collapse Algebra" },
  { id: "governance", label: "Governança", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "#ef4444", description: "DAO, Anti-Sybil, Segurança" },
  { id: "defi", label: "DeFi", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "#f97316", description: "Phantom, Aegis, Yield, Faucet" },
  { id: "terminal", label: "Terminal", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#6b7280", description: "Terminal, Mining, Lua, Watchtower" },
];

export const categoryColorMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color])
);

export const routes: RouteDef[] = [
  // ── Top-level ──
  { path: "/messenger", label: "VOID Messenger", description: "Chat E2EE com GhostID, QEL e Double Ratchet", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", category: "home", component: lazy(() => import("./components/Messenger")) },
  { path: "/harvester", label: "Phantom Harvester", description: "Scraper universal de contatos + corretoras crypto", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", category: "home", component: lazy(() => import("./components/PhantomHarvesterPanel")) },
  { path: "/dashboard", label: "Dashboard", description: "Painel principal do ecossistema ET-RNET", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", category: "home", component: lazy(() => import("./components/EternetDashboard")) },

  // ── Crypto ──
  { path: "/crypto/zkp", label: "ZKP Lab", description: "Zero-Knowledge Proofs e provas de conhecimento", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", category: "crypto", component: lazy(() => import("./components/ZKPLab")) },
  { path: "/crypto/ghostid", label: "GhostID / VPN", description: "Identidade biométrica + VPN descentralizada", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", category: "crypto", component: lazy(() => import("./components/GhostVPNPanel")) },
  { path: "/crypto/pqc", label: "PQC (Post-Quantum)", description: "Criptografia pós-quântica: ML-KEM, ML-DSA", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", category: "crypto", component: lazy(() => import("./components/CoreInnovations")) },
  { path: "/crypto/testament", label: "Crypto Testament", description: "Testamento criptográfico com social recovery", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", category: "crypto", component: lazy(() => import("./components/CryptoTestamentLab")) },
  { path: "/crypto/karma", label: "Karma Wallet", description: "Carteira com sistema de reputação", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", category: "crypto", component: lazy(() => import("./components/KarmaWallet")) },

  // ── Finance ──
  { path: "/finance/dex", label: "DEX", description: "Exchange descentralizado com order book", icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4", category: "finance", component: lazy(() => import("./components/DEXPanel")) },
  { path: "/finance/chimera", label: "Chimera Exchange", description: "Dark pool anti-front-running com QEL", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", category: "finance", component: lazy(() => import("./components/ChimeraExchangePanel")) },
  { path: "/finance/nostr-dex", label: "Nostr DEX", description: "DEX via eventos Nostr (kind 31215/31216)", icon: "M13 10V3L4 14h7v7l9-11h-7z", category: "finance", component: lazy(() => import("./components/NostrDEXPanel")) },
  { path: "/finance/stablecoin", label: "Stablecoin", description: "Stablecoin algorítmica com colateral", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", category: "finance", component: lazy(() => import("./components/StablecoinPanel")) },
  { path: "/finance/rwa", label: "RWA Tokenization", description: "Tokenização de ativos do mundo real", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", category: "finance", component: lazy(() => import("./components/RwaTokenizationPanel")) },
  { path: "/finance/pools", label: "Sovereign Pools", description: "Pools de investimento com votação ZK", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", category: "finance", component: lazy(() => import("./components/SovereignPoolsPanel")) },
  { path: "/finance/janus", label: "Janus Finance", description: "Finanças com dupla perspectiva", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", category: "finance", component: lazy(() => import("./components/JanusFinancePanel")) },
  { path: "/finance/payment", label: "Payment Gateway", description: "Gateway de pagamento via Lightning + NWC", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", category: "finance", component: lazy(() => import("./components/PaymentGatewayPanel")) },
  { path: "/finance/collapse", label: "Collapse Finance", description: "Finanças de colapso termodinâmico", icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", category: "finance", component: lazy(() => import("./components/CollapseFinancePanel")) },

  // ── Network ──
  { path: "/network/distance", label: "Distance Bridge", description: "Roteamento BLE, LoRa, HCN, WebRTC", icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z", category: "network", component: lazy(() => import("./components/DistanceBridge")) },
  { path: "/network/parasitic", label: "Parasitic Arch", description: "Arquitetura parasitária de rede", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", category: "network", component: lazy(() => import("./components/ParasiticArchitecture")) },
  { path: "/network/echonet", label: "EcoNet", description: "Rede ecológica de dados", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", category: "network", component: lazy(() => import("./components/EcoNetPanel")) },
  { path: "/network/mesh", label: "Nostr Sync", description: "Sincronização via relays Nostr", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", category: "network", component: lazy(() => import("./components/NostrSyncPanel")) },
  { path: "/network/acoustic", label: "Acoustic Handshake", description: "Handshake via som ultrassônico", icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z", category: "network", component: lazy(() => import("./components/AcousticHandshakePanel")) },
  { path: "/network/supply-chain", label: "Supply Chain", description: "Segurança de cadeia de suprimentos", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", category: "network", component: lazy(() => import("./components/SupplyChainSecurity")) },

  // ── Compute ──
  { path: "/compute/mirage", label: "Mirage Compute", description: "Computação com enclaves efêmeros", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", category: "compute", component: lazy(() => import("./components/MirageComputePanel")) },
  { path: "/compute/hgpu", label: "HGPU Visualizer", description: "Visualização de GPU homomórfica", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", category: "compute", component: lazy(() => import("./components/HGPUVisualizer")) },
  { path: "/compute/vhgpu", label: "vHGPU Farm", description: "Farm de GPUs virtuais", icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01", category: "compute", component: lazy(() => import("./components/VhgpuFarmPanel")) },
  { path: "/compute/animus", label: "Animus Substrates", description: "Substratos de computação Animus", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4", category: "compute", component: lazy(() => import("./components/AnimusSubstratesPanel")) },
  { path: "/compute/hydra", label: "Hydra", description: "Motor de computação paralela", icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4", category: "compute", component: lazy(() => import("./components/Hydra")) },
  { path: "/compute/omega", label: "Omega", description: "Camada final de computação", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9", category: "compute", component: lazy(() => import("./components/Omega")) },
  { path: "/compute/hgpu-compute", label: "HGPU Compute", description: "Computação em GPU homomórfica", icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2", category: "compute", component: lazy(() => import("./components/HGPUComputePanel")) },

  // ── Quantum ──
  { path: "/quantum/lsc", label: "LSC Panel", description: "Lorentz Saturation Curve", icon: "M13 10V3L4 14h7v7l9-11h-7z", category: "quantum", component: lazy(() => import("./components/LSCPanel")) },
  { path: "/quantum/qrc", label: "QRC Topology", description: "Topologia de redes quânticas", icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4", category: "quantum", component: lazy(() => import("./components/QRCTopologyPanel")) },
  { path: "/quantum/paleo", label: "Paleo Panel", description: "Engine Paleo e anacroclastia", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", category: "quantum", component: lazy(() => import("./components/PaleoPanel")) },
  { path: "/quantum/collapse", label: "Collapse Algebra", description: "Álgebra de colapso termodinâmico", icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", category: "quantum", component: lazy(() => import("./components/CollapseAlgebraPanel")) },
  { path: "/quantum/anacroclastia", label: "Anacroclastia", description: "Fenômenos de anacroclastia", icon: "M13 10V3L4 14h7v7l9-11h-7z", category: "quantum", component: lazy(() => import("./components/AnacroclastiaPanel")) },
  { path: "/quantum/oracle", label: "Nostr Oracle", description: "Oráculo de preços via Nostr", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", category: "quantum", component: lazy(() => import("./components/NostrOraclePanel")) },
  { path: "/quantum/qrng", label: "QRNG", description: "Gerador de números quânticos aleatórios", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", category: "quantum", component: lazy(() => import("./components/QRNGPanel")) },
  { path: "/quantum/qrstocks", label: "QR Stocks", description: "Ações com mecânica quântica", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", category: "quantum", component: lazy(() => import("./components/QRStocksPanel")) },

  // ── Governance ──
  { path: "/governance/dao", label: "Quantum DAO", description: "DAO com votação quântica", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", category: "governance", component: lazy(() => import("./components/QuantumDaoPanel")) },
  { path: "/governance/anti-sybil", label: "Anti-Sybil Lab", description: "Defesa contra ataques Sybil", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", category: "governance", component: lazy(() => import("./components/AntiSybilLab")) },
  { path: "/governance/double-spend", label: "Double Spend", description: "Defesa contra double spending", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", category: "governance", component: lazy(() => import("./components/DoubleSpendDefenseLab")) },
  { path: "/governance/temporal", label: "Temporal Oracle", description: "Oráculo temporal para contratos", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", category: "governance", component: lazy(() => import("./components/TemporalOracleLab")) },
  { path: "/governance/social-recovery", label: "Social Recovery", description: "Recuperação social de chaves", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", category: "governance", component: lazy(() => import("./components/SocialRecoveryPanel")) },

  // ── DeFi ──
  { path: "/defi/phopper", label: "Phantom Shopper", description: "Compras anônimas em marketplaces", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z", category: "defi", component: lazy(() => import("./components/PhantomShopperPanel")) },
  { path: "/defi/aegis", label: "Aegis Vault", description: "Cofre com proteção militar", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", category: "defi", component: lazy(() => import("./components/AegisVaultPanel")) },
  { path: "/defi/yield", label: "Paleo Yield", description: "Yield farming com engine Paleo", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", category: "defi", component: lazy(() => import("./components/PaleoYieldPanel")) },
  { path: "/defi/ghost-locker", label: "Ghost Locker", description: "Locker anônimo de ativos", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", category: "defi", component: lazy(() => import("./components/GhostLockerPanel")) },
  { path: "/defi/faucet", label: "PoW Faucet", description: "Faucet com Proof of Work", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", category: "defi", component: lazy(() => import("./components/PoWFaucetPanel")) },

  // ── Terminal ──
  { path: "/terminal", label: "Active Terminal", description: "Terminal interativo do ecossistema", icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", category: "terminal", component: lazy(() => import("./components/ActiveTerminal")) },
  { path: "/terminal/symbiont", label: "Symbiont Inoculator", description: "Inoculador de simbionte", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", category: "terminal", component: lazy(() => import("./components/SymbiontInoculator")) },
  { path: "/terminal/lua", label: "Lua Plugin", description: "Plugins Lua para extensibilidade", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", category: "terminal", component: lazy(() => import("./components/LuaPluginPanel")) },
  { path: "/terminal/watchtower", label: "Watchtower", description: "Torre de vigilância de rede", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", category: "terminal", component: lazy(() => import("./components/WatchtowerPanel")) },
  { path: "/terminal/sphinx", label: "Sphinx Mixnet", description: "Mixnet para anonimato de tráfego", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9", category: "terminal", component: lazy(() => import("./components/SphinxMixnetPanel")) },
  { path: "/terminal/differential", label: "Differential Core", description: "Núcleo de privacidade diferencial", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", category: "terminal", component: lazy(() => import("./components/DifferentialCorePanel")) },
  { path: "/terminal/mining", label: "Mining", description: "Mineração de criptomoedas", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", category: "terminal", component: lazy(() => import("./components/MiningPanel")) },
  { path: "/terminal/gpu-mining", label: "GPU Mining", description: "Mineração via GPU", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", category: "terminal", component: lazy(() => import("./components/GPUMiningPanel")) },
  { path: "/terminal/homotopy", label: "Homotopy Mining", description: "Mineração com homotopia", icon: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4", category: "terminal", component: lazy(() => import("./components/HomotopyMiningPanel")) },
  { path: "/terminal/ghost-mailbox", label: "Ghost Mailbox", description: "Caixa postal anônima", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", category: "terminal", component: lazy(() => import("./components/GhostMailboxPanel")) },
  { path: "/terminal/octree", label: "Octree SDF", description: "Octree com Signed Distance Fields", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", category: "terminal", component: lazy(() => import("./components/OctreeSDFPanel")) },
  { path: "/terminal/social", label: "Social Fabric", description: "Tecido social E2EE", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", category: "terminal", component: lazy(() => import("./components/SocialFabricPanel")) },
  { path: "/terminal/glossary", label: "Glossário", description: "Glossário de termos do ecossistema", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", category: "terminal", component: lazy(() => import("./components/Glossary")) },
];

export function getRoutesByCategory(category: string): RouteDef[] {
  return routes.filter((r) => r.category === category);
}

export function getCategoryById(id: string): CategoryDef | undefined {
  return categories.find((c) => c.id === id);
}
