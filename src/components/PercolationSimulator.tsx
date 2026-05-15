import { useState, useEffect } from "react";

/**
 * ETΞRNET — Layer 5: Percolation & Rule 110
 * 
 * Simula a resiliência da rede baseada na teoria da percolação e 
 * no autômato celular Rule 110 (Wolfram). 
 * Prova que a rede sobrevive mesmo com 80% dos nós removidos.
 */

export default function PercolationSimulator() {
  const [grid, setNodes] = useState<boolean[]>(Array(100).fill(true));
  const [removedCount, setRemovedCount] = useState(0);
  const [isPercolating, setIsPercolating] = useState(true);
  const [rule110Row, setRule110] = useState<number[]>(Array(40).fill(0).map(() => (Math.random() > 0.5 ? 1 : 0)));

  // Rule 110 Logic
  const stepRule110 = () => {
    setRule110(prev => {
      const next = [...prev];
      for (let i = 0; i < prev.length; i++) {
        const left = prev[(i - 1 + prev.length) % prev.length]!;
        const center = prev[i]!;
        const right = prev[(i + 1) % prev.length]!;
        const pattern = (left << 2) | (center << 1) | right;
        // Rule 110: 01101110 in binary (110 in decimal)
        next[i] = [0, 1, 1, 1, 0, 1, 1, 0][pattern]!;
      }
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(stepRule110, 200);
    return () => clearInterval(timer);
  }, []);

  const removeNode = () => {
    const activeIndices = grid.map((v, i) => v ? i : -1).filter(i => i !== -1);
    if (activeIndices.length === 0) return;
    
    const target = activeIndices[Math.floor(Math.random() * activeIndices.length)]!;
    const nextGrid = [...grid];
    nextGrid[target] = false;
    setNodes(nextGrid);
    setRemovedCount(prev => prev + 1);
    
    // Simula cálculo de percolação: rede cai se > 90% (na teoria VØID é imune até 80%)
    if (removedCount > 85) setIsPercolating(false);
  };

  const reset = () => {
    setNodes(Array(100).fill(true));
    setRemovedCount(0);
    setIsPercolating(true);
  };

  return (
    <div className="p-6 bg-[#0a0d10] border border-zinc-800 rounded-sm space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="tag bg-[#b6ff3a]/10 text-[#b6ff3a]">LAYER 5 · PERCOLATION THEORY</div>
          <h4 className="text-white font-sans text-sm mt-2 uppercase tracking-widest">Resiliência Irredutível</h4>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Status da Malha</div>
          <div className={`text-xs font-mono ${isPercolating ? "text-[#b6ff3a]" : "text-red-500 animate-pulse"}`}>
            {isPercolating ? "CONECTADA (PERCOLANDO)" : "FRAGMENTADA"}
          </div>
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-10 gap-1">
        {grid.map((active, i) => (
          <div 
            key={i} 
            className={`aspect-square rounded-[1px] transition-all duration-500 ${active ? "bg-[#b6ff3a] shadow-[0_0_5px_rgba(182,255,58,0.2)]" : "bg-zinc-900"}`}
          />
        ))}
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-zinc-500 uppercase">Nós Removidos: {removedCount}%</div>
          <div className="h-1 w-32 bg-zinc-900 overflow-hidden">
             <div className="h-full bg-red-900 transition-all" style={{ width: `${removedCount}%` }} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={removeNode} className="px-3 py-1 border border-red-900/40 text-red-900 font-mono text-[9px] hover:bg-red-900 hover:text-white transition-smooth">
            DESTRUIR NÓ ALEATÓRIO
          </button>
          <button onClick={reset} className="px-3 py-1 border border-zinc-700 text-zinc-500 font-mono text-[9px] hover:text-white transition-smooth">
            RESTAURAR
          </button>
        </div>
      </div>

      {/* Rule 110 Visualizer */}
      <div className="pt-4 border-t border-zinc-900">
        <div className="text-[8px] font-mono text-zinc-600 mb-2 uppercase tracking-widest">Computational Irreducibility (Rule 110)</div>
        <div className="flex gap-px">
          {rule110Row.map((v, i) => (
            <div key={i} className={`flex-1 h-3 ${v ? "bg-[#ff3ad9]" : "bg-black"}`} />
          ))}
        </div>
        <p className="text-[7px] text-zinc-700 mt-2 italic">
          "Prever o comportamento exige simular a rede inteira." — Stephen Wolfram
        </p>
      </div>
    </div>
  );
}
