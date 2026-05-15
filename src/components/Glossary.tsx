import { useState } from "react";

const terms = [
  { term: "GhostID", desc: "Identidade temporária gerada em RAM. Morre quando você fecha o app, garantindo que não existam rastros persistentes de quem você é." },
  { term: "QEL (Quantum Entanglement Layer)", desc: "Protocolo que fatia sua transação em 3 pedaços (shards). Nenhum nó da rede vê a transação completa, apenas fragmentos indecifráveis." },
  { term: "HCN (Human Carrier Network)", desc: "Rede de transporte física. Seus dados viajam no bolso de outras pessoas (via Bluetooth) até encontrar o destino, sem usar a internet." },
  { term: "Stablecoin Local", desc: "Moeda com valor estável (ex: $ETBRL) emitida por você mesmo, usando ativos reais como garantia, sem depender de bancos centrais." },
  { term: "DEX (Dual-Mode Exchange)", desc: "Mercado de troca onde as ordens são pareadas de forma cega. Ninguém sabe o preço real sendo negociado até que o 'match' aconteça." },
  { term: "ANIMUS / SYMBIONT", desc: "O motor parasita que roda no seu navegador. Ele ajuda a malha global enquanto você navega, e você ganha $SOV por isso." },
  { term: "HGPU", desc: "Unidade que desenha a interface usando matemática (SDF) em vez de pixels. É a forma mais eficiente e segura de transmitir mundos digitais." },
];

export default function Glossary() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão Flutuante de Ajuda */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[60] size-12 rounded-full bg-[#b6ff3a] text-black shadow-[0_0_20px_rgba(182,255,58,0.4)] flex items-center justify-center font-mono font-bold text-xl hover:scale-110 transition-smooth group"
      >
        ?
        <span className="absolute right-14 bg-black border border-[#b6ff3a]/30 text-[#b6ff3a] text-[10px] px-3 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          GLOSSÁRIO DE SOBERANIA
        </span>
      </button>

      {/* Modal do Glossário */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="max-w-2xl w-full bg-[#0a0d10] border border-[#b6ff3a]/20 p-8 md:p-12 relative max-h-[80vh] overflow-y-auto scrollbar-none">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white font-mono text-xs"
            >
              FECHAR [X]
            </button>

            <div className="tag mb-6 text-[#b6ff3a]">Manual do Usuário Soberano</div>
            <h2 className="text-3xl font-sans font-light text-white mb-10">Entendendo o Sistema</h2>

            <div className="space-y-8">
              {terms.map(t => (
                <div key={t.term} className="group">
                  <h3 className="font-mono text-[#6cf0ff] mb-2 text-sm tracking-widest uppercase">{t.term}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-black border border-zinc-900 italic text-zinc-600 text-xs leading-relaxed">
              "Este sistema foi desenhado para ser invulnerável à censura. Se você não entende algo, sinta-se seguro: a matemática está protegendo você mesmo no escuro."
            </div>
          </div>
        </div>
      )}
    </>
  );
}
