/**
 * AnimusSubstrates Panel — Gerenciador de Substratos ANIMUS
 *
 * Exibe os 7 substratos de execucao do ANIMUS com status,
 * uso de memoria e capacidades.
 */

import { useState, useEffect } from "react";
import {
  animusSubstrateManager as animusInstance,
  type SubstrateType,
  type SubstrateStatus,
} from "../omega/animusSubstrates";

const getAnimusSubstrateManager = () => animusInstance;

const SUBSTRATE_CONFIG: Record<
  SubstrateType,
  { label: string; color: string; bgClass: string; borderClass: string; textClass: string; desc: string }
> = {
  LLM_WEIGHTS: {
    label: "LLM WEIGHTS",
    color: "#ff3ad9",
    bgClass: "bg-[#ff3ad9]/10",
    borderClass: "border-[#ff3ad9]/30",
    textClass: "text-[#ff3ad9]",
    desc: "Embedding em pesos de modelos de linguagem",
  },
  EBPF: {
    label: "EBPF",
    color: "#b6ff3a",
    bgClass: "bg-[#b6ff3a]/10",
    borderClass: "border-[#b6ff3a]/30",
    textClass: "text-[#b6ff3a]",
    desc: "Programas ring-0 em sandbox do navegador",
  },
  SGX_SEV: {
    label: "SGX SEV",
    color: "#6cf0ff",
    bgClass: "bg-[#6cf0ff]/10",
    borderClass: "border-[#6cf0ff]/30",
    textClass: "text-[#6cf0ff]",
    desc: "Enclaves isolados via Web Crypto",
  },
  BROWSER_COSMOS: {
    label: "BROWSER COSMOS",
    color: "#3b82f6",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
    desc: "WebGPU + WebAssembly no navegador",
  },
  NETWORK_GHOST: {
    label: "NETWORK GHOST",
    color: "#71717a",
    bgClass: "bg-zinc-500/10",
    borderClass: "border-zinc-500/30",
    textClass: "text-zinc-400",
    desc: "Rotas Sphinx multi-hop",
  },
  SUPPLY_CHAIN: {
    label: "SUPPLY CHAIN",
    color: "#eab308",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/30",
    textClass: "text-yellow-400",
    desc: "Verificacao de integridade SHA3-256",
  },
  EMERGENT_MIND: {
    label: "EMERGENT MIND",
    color: "#a855f7",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-400",
    desc: "Atualizacao federada e inferencia ZK-ML",
  },
};

const SUBSTRATE_TYPES: SubstrateType[] = [
  "LLM_WEIGHTS",
  "EBPF",
  "SGX_SEV",
  "BROWSER_COSMOS",
  "NETWORK_GHOST",
  "SUPPLY_CHAIN",
  "EMERGENT_MIND",
];

export default function AnimusSubstratesPanel() {
  const [substrates, setSubstrates] = useState<SubstrateStatus[]>([]);
  const [totalMemory, setTotalMemory] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const manager = getAnimusSubstrateManager();

  useEffect(() => {
    const update = () => {
      const all = manager.getAllSubstrates();
      setSubstrates(all);
      const hb = manager.heartbeat();
      setTotalMemory(hb.memoryTotal);
      setActiveCount(hb.active);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBootstrap = (type: SubstrateType) => {
    manager.bootstrapSubstrate(type);
    // Trigger specific substrate initialization
    switch (type) {
      case "LLM_WEIGHTS":
        manager.svdBootstrap(new Float32Array(32), 4);
        break;
      case "EBPF":
        manager.loadProgram("default", new Uint8Array(16));
        break;
      case "SGX_SEV":
        manager.createEnclave(new Uint8Array(32));
        break;
      case "BROWSER_COSMOS":
        manager.initWebGPU();
        break;
      case "NETWORK_GHOST":
        manager.setupSphinxRoute("ghost_dest_001");
        break;
      case "SUPPLY_CHAIN":
        manager.verifyPackage("manifest_v1", "dummy_hash");
        break;
      case "EMERGENT_MIND":
        manager.federatedUpdate(new Float32Array(16));
        break;
    }
    // Refresh state
    const all = manager.getAllSubstrates();
    setSubstrates(all);
    const hb = manager.heartbeat();
    setTotalMemory(hb.memoryTotal);
    setActiveCount(hb.active);
  };

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const maxMemoryPerSubstrate = 65536; // 64KB reference for bar
  const totalMemoryBarPct = Math.min(100, (totalMemory / (maxMemoryPerSubstrate * 7)) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#ff3ad9] font-mono">
            ANIMUS SUBSTRATES
          </h1>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            7 CAMADAS DE PERSISTENCIA / COMPUTACAO
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#ff3ad9] animate-pulse" />
          <span className="text-[8px] font-mono text-zinc-500">
            {activeCount}/7 ATIVOS
          </span>
        </div>
      </div>

      {/* Total Memory Bar */}
      <div className="bg-[#080a0c] border border-[#14181c] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-400">
            USO TOTAL DE MEMORIA
          </span>
          <span className="text-xs font-mono text-[#6cf0ff]">
            {formatMemory(totalMemory)}
          </span>
        </div>
        <div className="h-3 bg-[#0c0e12] rounded-full overflow-hidden border border-[#14181c]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalMemoryBarPct}%`,
              background: `linear-gradient(90deg, #ff3ad9, #6cf0ff, #b6ff3a)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-zinc-600">0</span>
          <span className="text-[8px] font-mono text-zinc-600">
            {formatMemory(maxMemoryPerSubstrate * 7)} MAX
          </span>
        </div>
      </div>

      {/* Substrates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBSTRATE_TYPES.map((type) => {
          const config = SUBSTRATE_CONFIG[type];
          const status = substrates.find((s) => s.type === type);
          const isActive = status?.active ?? false;
          const memUsed = status?.memoryUsed ?? 0;
          const capabilities = status?.capabilities ?? [];
          const memPct = (memUsed / maxMemoryPerSubstrate) * 100;

          return (
            <div
              key={type}
              className={`relative border rounded-lg p-4 transition-all ${
                isActive
                  ? `${config.bgClass} ${config.borderClass}`
                  : "bg-[#080a0c] border-[#14181c]"
              }`}
            >
              {/* Heartbeat indicator */}
              <div className="absolute top-3 right-3">
                {isActive && (
                  <span
                    className="size-2 rounded-full animate-pulse"
                    style={{ backgroundColor: config.color }}
                  />
                )}
              </div>

              {/* Type label */}
              <div className={`font-mono text-xs font-bold ${config.textClass} mb-1`}>
                {config.label}
              </div>
              <div className="text-[8px] font-mono text-zinc-600 mb-3">
                {config.desc}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? `${config.bgClass} ${config.textClass}`
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isActive ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              {/* Memory bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[8px] font-mono mb-1">
                  <span className="text-zinc-500">MEMORIA</span>
                  <span className="text-zinc-400">{formatMemory(memUsed)}</span>
                </div>
                <div className="h-1.5 bg-[#0c0e12] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, memPct)}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
              </div>

              {/* Capabilities */}
              {capabilities.length > 0 && (
                <div className="mb-3">
                  <div className="text-[8px] font-mono text-zinc-600 mb-1">
                    CAPACIDADES
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {capabilities.slice(0, 3).map((cap, i) => (
                      <span
                        key={i}
                        className="text-[7px] font-mono text-zinc-500 bg-[#0c0e12] px-1.5 py-0.5 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                    {capabilities.length > 3 && (
                      <span className="text-[7px] font-mono text-zinc-600">
                        +{capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bootstrap button */}
              <button
                onClick={() => handleBootstrap(type)}
                className={`w-full py-2 font-mono text-[10px] font-bold rounded transition-colors border ${
                  isActive
                    ? "bg-transparent border-current opacity-50 cursor-default"
                    : `${config.borderClass} ${config.textClass} hover:opacity-80`
                }`}
                style={{
                  borderColor: isActive ? config.color + "40" : config.color + "60",
                  color: config.color,
                }}
                disabled={isActive}
              >
                {isActive ? "EXECUTANDO" : "BOOTSTRAP"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 text-[8px] font-mono text-zinc-700 tracking-widest uppercase text-center">
        ANIMUS · Parasitismo Multissubstrato
      </div>
    </div>
  );
}
