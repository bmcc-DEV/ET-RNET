/**
 * QRCTopology Panel — Analise Topologica e Geometria Diferencial
 *
 * Exibe grafos de Reeb, diagramas de persistencia, e metricas
 * de geometria diferencial (curvatura, Sobolev, Frechet).
 */

import { useState, useCallback } from "react";
import { secureRandom } from "../utils/secureRandom";
import {
  computeReebGraph,
  persistenceDiagram,
  eulerCharacteristic,
  detectTopologicalChange,
  type ReebGraph,
  type PersistenceDiagram,
} from "../crypto/topologyTracker";
import {
  computeFrechetDerivative,
  sobolevNorm,
  principalCurvatures,
} from "../crypto/differentialCore";

export default function QRCTopologyPanel() {
  const [reebGraph, setReebGraph] = useState<ReebGraph | null>(null);
  const [persistenceDiag, setPersistenceDiag] = useState<PersistenceDiagram | null>(null);
  const [prevPersistenceDiag, setPrevPersistenceDiag] = useState<PersistenceDiagram | null>(null);
  const [eulerChar, setEulerChar] = useState<number | null>(null);
  const [topoChanged, setTopoChanged] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [curvatures, setCurvatures] = useState<{ k1: number; k2: number } | null>(null);
  const [sobolev, setSobolev] = useState<number | null>(null);
  const [frechet, setFrechet] = useState<number | null>(null);
  const [fieldValues, setFieldValues] = useState<number[]>([]);

  const generateRandomSDF = (): number[] => {
    const n = 64;
    const values = new Array(n);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * 2 * Math.PI;
      values[i] =
        Math.sin(t * 2) * 0.4 +
        Math.cos(t * 3.7) * 0.3 +
        Math.sin(t * 5.1) * 0.2 +
        (secureRandom() - 0.5) * 0.1;
    }
    return values;
  };

  const handleAnalyze = useCallback(() => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const values = generateRandomSDF();
      setFieldValues(values);

      // Topology
      const graph = computeReebGraph(values, 16);
      setReebGraph(graph);

      const diag = persistenceDiagram(graph);
      if (persistenceDiag) {
        setPrevPersistenceDiag(persistenceDiag);
      }
      setPersistenceDiag(diag);

      const chi = eulerCharacteristic(diag);
      setEulerChar(chi);

      if (prevPersistenceDiag) {
        setTopoChanged(detectTopologicalChange(prevPersistenceDiag, diag));
      } else {
        setTopoChanged(false);
      }

      // Differential geometry
      const evalFn = (p: number[]): number => {
        const x = p[0] ?? 0;
        return Math.sin(x * 2) * 0.4 + Math.cos(x * 3.7) * 0.3;
      };
      const dir = [1, 0];
      const pt = [1.0, 0.0];
      const deriv = computeFrechetDerivative(evalFn, pt, dir);
      setFrechet(deriv.norm);

      const curv = principalCurvatures(evalFn, pt);
      setCurvatures({ k1: curv.k1, k2: curv.k2 });

      const norm = sobolevNorm(values, 1);
      setSobolev(norm);

      setIsAnalyzing(false);
    }, 300);
  }, [persistenceDiag, prevPersistenceDiag]);

  // SVG rendering for Reeb graph
  const renderReebGraph = () => {
    if (!reebGraph || reebGraph.nodes.length === 0) return null;

    const svgW = 400;
    const svgH = 200;
    const padding = 30;

    const values = reebGraph.nodes.map((n) => n.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    // Position nodes
    const nodePositions = reebGraph.nodes.map((node) => ({
      id: node.id,
      x: padding + ((node.value - minVal) / range) * (svgW - 2 * padding),
      y: svgH / 2 + (Math.sin(node.id * 1.3) * (svgH / 2 - padding)),
      persistence: node.persistence,
    }));

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48">
        {/* Edges */}
        {reebGraph.edges.map((edge, i) => {
          const from = nodePositions.find((n) => n.id === edge.from);
          const to = nodePositions.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`e${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#3f3f46"
              strokeWidth="1.5"
              opacity={0.6}
            />
          );
        })}
        {/* Nodes */}
        {nodePositions.map((np) => (
          <g key={`n${np.id}`}>
            <circle
              cx={np.x}
              cy={np.y}
              r={Math.max(3, Math.min(8, np.persistence * 20 + 3))}
              fill="#6cf0ff"
              opacity={0.8}
            />
            <circle
              cx={np.x}
              cy={np.y}
              r={Math.max(3, Math.min(8, np.persistence * 20 + 3)) + 3}
              fill="none"
              stroke="#6cf0ff"
              strokeWidth="0.5"
              opacity={0.3}
            />
          </g>
        ))}
        {/* Axis label */}
        <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">
          NIVEL DE SUPERFICIE
        </text>
      </svg>
    );
  };

  // SVG rendering for Persistence Diagram
  const renderPersistenceDiagram = () => {
    if (!persistenceDiag || persistenceDiag.pairs.length === 0) return null;

    const svgW = 400;
    const svgH = 200;
    const padding = 30;

    const allBirths = persistenceDiag.pairs.map((p) => p.birth);
    const allDeaths = persistenceDiag.pairs.map((p) => p.death);
    const minVal = Math.min(...allBirths, ...allDeaths);
    const maxVal = Math.max(...allBirths, ...allDeaths);
    const range = maxVal - minVal || 1;

    const scaleX = (v: number) =>
      padding + ((v - minVal) / range) * (svgW - 2 * padding);
    const scaleY = (v: number) =>
      svgH - padding - ((v - minVal) / range) * (svgH - 2 * padding);

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48">
        {/* Diagonal line (birth = death) */}
        <line
          x1={scaleX(minVal)}
          y1={scaleY(minVal)}
          x2={scaleX(maxVal)}
          y2={scaleY(maxVal)}
          stroke="#3f3f46"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        {/* Points */}
        {persistenceDiag.pairs.map((pair, i) => {
          const cx = scaleX(pair.birth);
          const cy = scaleY(pair.death);
          const color = pair.dimension === 0 ? "#b6ff3a" : "#ff3ad9";
          return (
            <g key={`p${i}`}>
              <circle cx={cx} cy={cy} r={4} fill={color} opacity={0.8} />
              <circle cx={cx} cy={cy} r={7} fill="none" stroke={color} strokeWidth="0.5" opacity={0.3} />
            </g>
          );
        })}
        {/* Axis labels */}
        <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">
          NASCIMENTO (BIRTH)
        </text>
        <text
          x={8}
          y={svgH / 2}
          textAnchor="middle"
          fill="#52525b"
          fontSize="8"
          fontFamily="monospace"
          transform={`rotate(-90, 8, ${svgH / 2})`}
        >
          MORTE (DEATH)
        </text>
        {/* Legend */}
        <circle cx={svgW - 60} cy={15} r={3} fill="#b6ff3a" />
        <text x={svgW - 53} y={18} fill="#52525b" fontSize="7" fontFamily="monospace">H0</text>
        <circle cx={svgW - 35} cy={15} r={3} fill="#ff3ad9" />
        <text x={svgW - 28} y={18} fill="#52525b" fontSize="7" fontFamily="monospace">H1</text>
      </svg>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#6cf0ff] font-mono">
            QRC TOPOLOGY
          </h1>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            REEB GRAPH · PERSISTENCE · GEOMETRIA DIFERENCIAL
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-[#6cf0ff] text-black font-mono text-xs font-bold rounded hover:bg-[#5adcee] disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? "ANALISANDO..." : "ANALISAR TOPOLOGIA"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Reeb Graph */}
        <div className="bg-[#080a0c] border border-[#14181c] rounded-lg p-4">
          <h2 className="text-xs font-mono text-zinc-400 mb-2">
            GRAFO DE REEB
          </h2>
          <div className="text-[8px] font-mono text-zinc-600 mb-3">
            Componentes conexos dos conjuntos de nivel
          </div>
          {reebGraph && reebGraph.nodes.length > 0 ? (
            renderReebGraph()
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-700 font-mono text-xs italic">
              Clique "ANALISAR" para gerar
            </div>
          )}
          {reebGraph && (
            <div className="mt-2 flex gap-4 text-[8px] font-mono text-zinc-500">
              <span>{reebGraph.nodes.length} nos</span>
              <span>{reebGraph.edges.length} arestas</span>
            </div>
          )}
        </div>

        {/* Right: Persistence Diagram */}
        <div className="bg-[#080a0c] border border-[#14181c] rounded-lg p-4">
          <h2 className="text-xs font-mono text-zinc-400 mb-2">
            DIAGRAMA DE PERSISTENCIA
          </h2>
          <div className="text-[8px] font-mono text-zinc-600 mb-3">
            Pares nascimento-morte de features topologicas
          </div>
          {persistenceDiag && persistenceDiag.pairs.length > 0 ? (
            renderPersistenceDiagram()
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-700 font-mono text-xs italic">
              Clique "ANALISAR" para gerar
            </div>
          )}
          {persistenceDiag && (
            <div className="mt-2 flex gap-4 text-[8px] font-mono text-zinc-500">
              <span>{persistenceDiag.pairs.length} pares</span>
              <span>
                H0:{" "}
                {persistenceDiag.pairs.filter((p) => p.dimension === 0).length}
              </span>
              <span>
                H1:{" "}
                {persistenceDiag.pairs.filter((p) => p.dimension === 1).length}
              </span>
            </div>
          )}
        </div>

        {/* Euler Characteristic */}
        <div className="bg-[#080a0c] border border-[#14181c] rounded-lg p-4">
          <h2 className="text-xs font-mono text-zinc-400 mb-2">
            CARACTERISTICA DE EULER
          </h2>
          <div className="text-[8px] font-mono text-zinc-600 mb-3">
            chi = Sigma (-1)^dim * n_d
          </div>
          {eulerChar !== null ? (
            <div className="flex items-center gap-4">
              <div className="text-3xl font-mono font-bold text-white">
                {eulerChar}
              </div>
              <div>
                <div className="text-[8px] font-mono text-zinc-500">
                  GENIO ESTIMADO
                </div>
                <div className="text-sm font-mono text-[#b6ff3a]">
                  g = {Math.max(0, Math.round((2 - eulerChar) / 2))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-zinc-700 font-mono text-xs italic">
              Aguardando analise
            </div>
          )}

          {/* Topology change indicator */}
          <div className="mt-3 pt-3 border-t border-[#14181c]">
            <div className="flex items-center gap-2">
              <span
                className={`size-1.5 rounded-full ${
                  topoChanged ? "bg-[#ff3ad9] animate-pulse" : "bg-[#b6ff3a]"
                }`}
              />
              <span
                className={`text-[8px] font-mono font-bold ${
                  topoChanged ? "text-[#ff3ad9]" : "text-[#b6ff3a]"
                }`}
              >
                {topoChanged ? "GENUS ALTERADO" : "ESTAVEL"}
              </span>
              {persistenceDiag && prevPersistenceDiag && (
                <span className="text-[8px] font-mono text-zinc-600">
                  (comparado com analise anterior)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Differential Geometry */}
        <div className="bg-[#080a0c] border border-[#14181c] rounded-lg p-4">
          <h2 className="text-xs font-mono text-zinc-400 mb-2">
            GEOMETRIA DIFERENCIAL
          </h2>
          <div className="text-[8px] font-mono text-zinc-600 mb-3">
            Curvaturas, Sobolev e Frechet
          </div>

          <div className="space-y-3">
            {/* Curvatures */}
            <div className="p-3 bg-[#0a0d10] border border-[#14181c] rounded">
              <div className="text-[8px] font-mono text-zinc-500 mb-2">
                CURVATURAS PRINCIPAIS
              </div>
              {curvatures ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[8px] font-mono text-zinc-600">
                      k1 (maior)
                    </div>
                    <div className="text-sm font-mono text-[#6cf0ff]">
                      {curvatures.k1.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono text-zinc-600">
                      k2 (menor)
                    </div>
                    <div className="text-sm font-mono text-[#6cf0ff]">
                      {curvatures.k2.toFixed(6)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-700 text-[8px] font-mono">
                  Sem dados
                </div>
              )}
            </div>

            {/* Sobolev Norm */}
            <div className="p-3 bg-[#0a0d10] border border-[#14181c] rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-mono text-zinc-500">
                    NORMA SOBOLEV H1
                  </div>
                  <div className="text-[8px] font-mono text-zinc-600">
                    ||f|| = Sigma(1+k^2)|ck|^2
                  </div>
                </div>
                <div className="text-lg font-mono text-[#b6ff3a]">
                  {sobolev !== null ? sobolev.toFixed(6) : "--"}
                </div>
              </div>
            </div>

            {/* Frechet Derivative */}
            <div className="p-3 bg-[#0a0d10] border border-[#14181c] rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-mono text-zinc-500">
                    DERIVADA FRECHET
                  </div>
                  <div className="text-[8px] font-mono text-zinc-600">
                    Df(p)[v] = (f(p+ev)-f(p-ev))/2e
                  </div>
                </div>
                <div className="text-lg font-mono text-[#ff3ad9]">
                  {frechet !== null ? frechet.toFixed(6) : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SDF Values (when available) */}
      {fieldValues.length > 0 && (
        <div className="mt-4 bg-[#080a0c] border border-[#14181c] rounded-lg p-4">
          <h3 className="text-xs font-mono text-zinc-400 mb-2">
            CAMPO SDF AMOSTRADO (64 valores)
          </h3>
          <div className="flex items-end gap-[2px] h-16">
            {fieldValues.map((v, i) => {
              const normalized = (v + 1) / 2;
              const isNeg = v < 0;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${normalized * 100}%`,
                    backgroundColor: isNeg ? "#ff3ad940" : "#6cf0ff40",
                    borderTop: `1px solid ${isNeg ? "#ff3ad9" : "#6cf0ff"}`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[7px] font-mono text-zinc-600 mt-1">
            <span>0</span>
            <span>#6cf0ff: positivo | #ff3ad9: negativo</span>
            <span>63</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-[8px] font-mono text-zinc-700 tracking-widest uppercase text-center">
        QRC · Topologia Computacional em Tempo Real
      </div>
    </div>
  );
}
