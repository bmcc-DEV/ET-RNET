import SectionHeader from "./SectionHeader";
import KarmaWallet from "./KarmaWallet";
import { useNetworkSimulation } from "./NetworkSimCore";

const modes = [
  {
    mode: "LOCAL",
    tech: "BLE / Wi‑Fi Direct / UWB",
    range: "≤ 500 m",
    latency: "5–80 ms",
    bar: 12,
  },
  {
    mode: "CIDADE",
    tech: "Human Carrier Network (HCN)",
    range: "≤ 50 km",
    latency: "min – horas",
    bar: 30,
  },
  {
    mode: "REGIONAL",
    tech: "LoRa (868 / 915 MHz)",
    range: "≤ 50 km",
    latency: "horas",
    bar: 45,
  },
  {
    mode: "CONTINENTAL",
    tech: "LoRa mesh relay",
    range: "centenas de km",
    latency: "horas – dias",
    bar: 70,
  },
  {
    mode: "GLOBAL",
    tech: "DTN + satélite LEO",
    range: "global",
    latency: "horas – dias",
    bar: 100,
  },
];

export default function DistanceBridge() {
  return (
    <section id="bridge" className="relative border-b border-[#14181c]">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <SectionHeader
          index="03"
          kicker="DISTANCE BRIDGE — 2.3"
          title={
            <>
              Alcance{" "}
              <span className="italic text-zinc-500">zero‑infrastructure.</span>{" "}
              <span className="text-[#b6ff3a]">Da sala ao satélite.</span>
            </>
          }
          description="O protocolo escolhe automaticamente o canal conforme a distância e disponibilidade — do BLE em uma cafeteria até um relay LoRa transcontinental ou um satélite LEO em modo DTN."
        />

        <div className="border border-[#14181c]">
          {/* table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0a0d10] border-b border-[#14181c] font-mono text-[10px] tracking-[0.25em] text-zinc-500">
            <div className="col-span-3">MODO</div>
            <div className="col-span-4">TECNOLOGIA</div>
            <div className="col-span-2">ALCANCE</div>
            <div className="col-span-3">LATÊNCIA</div>
          </div>

          {modes.map((m, i) => (
            <div
              key={m.mode}
              className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-[#14181c] items-center hover:bg-[#0a0d10] transition-colors group"
            >
              <div className="col-span-3 flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-600 w-6">
                  0{i + 1}
                </span>
                <span className="font-mono text-sm text-zinc-100 tracking-[0.15em]">
                  {m.mode}
                </span>
              </div>
              <div className="col-span-4 font-mono text-sm text-zinc-300">
                {m.tech}
              </div>
              <div className="col-span-2 font-mono text-xs text-zinc-400">
                {m.range}
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-400 w-24">
                  {m.latency}
                </span>
                <div className="flex-1 h-px bg-[#14181c] relative">
                  <div
                    className="absolute inset-y-[-1px] left-0 bg-[#b6ff3a] group-hover:shadow-[0_0_8px_#b6ff3a] transition-shadow"
                    style={{ width: `${m.bar}%`, height: "3px", top: "-1px" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HCN feature */}
        <div className="mt-12 grid lg:grid-cols-12 gap-px bg-[#14181c] border border-[#14181c]">
          <div className="lg:col-span-5 bg-black p-8 md:p-10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#b6ff3a]/5 blur-3xl" />
            <div className="relative">
              <div className="tag mb-4">FEATURE · HCN</div>
              <h3 className="font-mono text-2xl text-zinc-100 mb-4">
                Human Carrier Network
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Dispositivos de usuários armazenam shards cifrados (TTL 48 h) e
                os entregam quando se aproximam do destino. O carrier{" "}
                <span className="text-[#b6ff3a]">nunca vê o conteúdo</span> — só
                um blob opaco. Recompensas anônimas em <span className="font-mono">karma</span>{" "}
                incentivam a participação.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#14181c]">
                <div>
                  <div className="font-mono text-2xl text-[#b6ff3a]">48h</div>
                  <div className="tag mt-1">SHARD TTL</div>
                </div>
                <div>
                  <div className="font-mono text-2xl text-[#b6ff3a]">0</div>
                  <div className="tag mt-1">PLAINTEXT EXPOSED</div>
                </div>
                <div>
                  <div className="font-mono text-2xl text-[#b6ff3a]">∞</div>
                  <div className="tag mt-1">CARRIERS</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 bg-[#0a0d10] p-8 md:p-10">
            <CarrierMap />
          </div>
        </div>

        {/* Karma Wallet - Resolve o Paradoxo da Efemeridade */}
        <div className="mt-12">
          <KarmaWallet />
        </div>
      </div>
    </section>
  );
}

function CarrierMap() {
  const { nodes, traces } = useNetworkSimulation(12);

  return (
    <div className="relative">
      <div className="tag mb-4">// human carrier mesh · realtime simulation</div>
      <svg viewBox="0 0 660 420" className="w-full h-auto bg-black/40 border border-[#14181c]">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#14181c" />
          </pattern>
        </defs>
        <rect width="660" height="420" fill="url(#dots)" />

        {/* LoRa Gateway Range */}
        {nodes.filter(n => n.type === "GATEWAY").map(gw => (
          <circle 
            key={`${gw.id}-range`}
            cx={gw.x} cy={gw.y} r={gw.range} 
            fill="#b6ff3a" fillOpacity="0.02" 
            stroke="#b6ff3a" strokeOpacity="0.1" strokeDasharray="4 4"
          />
        ))}

        {/* Shard Traces (Transmissions) */}
        {traces.map(t => {
          const fromNode = nodes.find(n => n.id === t.from);
          const toNode = nodes.find(n => n.id === t.to);
          if (!fromNode || !toNode) return null;
          
          const x = fromNode.x + (toNode.x - fromNode.x) * t.progress;
          const y = fromNode.y + (toNode.y - fromNode.y) * t.progress;

          return (
            <g key={`${t.from}-${t.to}-${t.id}`}>
              <line 
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} 
                stroke="#b6ff3a" strokeOpacity="0.2" strokeWidth="0.5"
              />
              <circle cx={x} cy={y} r="3" fill="#b6ff3a">
                <animate attributeName="r" values="2;4;2" dur="0.5s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Node connections (BLE proximity) */}
        {nodes.map((a, i) =>
          nodes.slice(i + 1).map((b, j) => {
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > 80) return null;
            return (
              <line
                key={`conn-${i}-${j}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="#b6ff3a"
                strokeOpacity={0.1}
                strokeWidth="1"
              />
            );
          })
        )}

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            {/* Range indicator for mobile */}
            {n.type === "MOBILE" && (
              <circle cx={n.x} cy={n.y} r={n.range / 2} fill="#b6ff3a" fillOpacity="0.03" />
            )}
            
            <circle 
              cx={n.x} cy={n.y} r={n.type === "GATEWAY" ? 6 : 3} 
              fill={n.type === "SOURCE" ? "#ff3ad9" : n.type === "DEST" ? "#6cf0ff" : "#b6ff3a"} 
              className={n.shards.length > 0 ? "pulse-soft" : ""}
            />
            
            {/* Label for special nodes */}
            {n.type !== "MOBILE" && (
              <text 
                x={n.x} y={n.y - 12} 
                textAnchor="middle" fill={n.type === "SOURCE" ? "#ff3ad9" : n.type === "DEST" ? "#6cf0ff" : "#b6ff3a"} 
                fontFamily="JetBrains Mono" fontSize="8"
              >
                {n.type}
              </text>
            )}

            {/* Shard counter */}
            {n.shards.length > 0 && (
              <text 
                x={n.x + 8} y={n.y + 4} 
                fill="#b6ff3a" fontFamily="JetBrains Mono" fontSize="7"
              >
                [{n.shards.length}]
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-3 flex justify-between font-mono text-[10px] text-zinc-600 tracking-[0.2em]">
        <span>DYNAMIC TOPOLOGY · {nodes.filter(n => n.type === "MOBILE").length} CARRIERS ACTIVE</span>
        <span>HOPS DETECTED: {nodes.reduce((s, n) => s + (n.type === "MOBILE" && n.shards.length > 0 ? 1 : 0), 0)}</span>
      </div>
    </div>
  );
}