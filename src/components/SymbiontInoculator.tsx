import { useState, useEffect } from "react";
import { useVoid } from "../core/useVoid";
import { sovTokenomics } from "../crypto/sovTokenomics";

export default function SymbiontInoculator() {
  const { identity } = useVoid();
  const [isInoculated, setIsInoculated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sovMined, setSovMined] = useState<bigint>(0n);

  useEffect(() => {
    // Verifica se já está no IndexedDB via SW logic (simulado)
    const checkStatus = async () => {
      // No app real, consultaríamos o Service Worker ou IndexedDB
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (!isInoculated || !identity) return;

    // Simula a mineração de $SOV por rotear shards em background
    const interval = setInterval(() => {
      const reward = sovTokenomics.mintRoutingReward(identity, Math.floor(Math.random() * 5));
      setSovMined(prev => prev + reward.amount);
    }, 10000); // Mints a cada 10s para demo

    return () => clearInterval(interval);
  }, [isInoculated, identity]);

  const handleInoculate = async () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulação de download e extração do núcleo ANIMUS
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 5;
      });
    }, 100);

    await new Promise(r => setTimeout(r, 2500));
    
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Mock de binário WASM core
      const mockPayload = new Uint8Array([0x56, 0x30, 0x49, 0x44, 0x5f, 0x43, 0x4f, 0x52, 0x45]);
      
      navigator.serviceWorker.controller.postMessage({
        type: "ANIMUS_INOCULATION",
        payload: Array.from(mockPayload)
      });

      setIsInoculated(true);
      setIsProcessing(false);
      alert("Inoculação Completa. Este navegador agora é um hospedeiro persistente ANIMUS.");
    } else {
      alert("Service Worker não detectado ou inativo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 bg-[#0a0d10] border border-[#ff3ad9]/20 rounded-sm space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="tag bg-[#ff3ad9]/10 text-[#ff3ad9] border-[#ff3ad9]/30">STRATUM 3 · SYMBIONT</div>
          <h3 className="text-xl font-sans font-light text-white mt-4">Inoculação ANIMUS</h3>
          <p className="text-zinc-500 text-xs mt-2 max-w-sm leading-relaxed">
            Transforme este navegador em um nó persistente que processa shards em background. 
            O núcleo habita o Service Worker e opera em ciclos ociosos.
          </p>
        </div>
        <div className={`size-3 rounded-full ${isInoculated ? "bg-[#b6ff3a] shadow-[0_0_10px_#b6ff3a]" : "bg-zinc-800"}`} />
      </div>

      {!isInoculated ? (
        <div className="space-y-4">
          {isProcessing ? (
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[9px] text-[#ff3ad9]">
                <span>INJETANDO_NUCLEO_PARASITA...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-zinc-900 overflow-hidden">
                <div 
                  className="h-full bg-[#ff3ad9] transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleInoculate}
              className="w-full py-4 border border-[#ff3ad9]/40 text-[#ff3ad9] font-mono text-[10px] tracking-widest hover:bg-[#ff3ad9] hover:text-black transition-smooth"
            >
              INOCULAR HOSPEDEIRO
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 bg-[#b6ff3a]/5 border border-[#b6ff3a]/20">
          <div className="text-[#b6ff3a] font-mono text-[10px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-1 bg-[#b6ff3a] animate-ping" />
              NÓ HOSPEDEIRO ATIVO
            </div>
            <div className="text-[#6cf0ff]">
              MINED: {sovMined.toString()} $SOV
            </div>
          </div>
          <p className="text-zinc-600 text-[9px] mt-2 font-mono">
            Relay Shards: 1,242 | Data Storage: 45MB | CPU Load: 1.2%
          </p>
        </div>
      )}
    </div>
  );
}
