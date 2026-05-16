import { useRef, useState } from "react";
import { paymentGateway, type PaymentItem, type PaymentResult } from "../crypto/paymentGateway";

export default function PaymentGatewayPanel() {
  const [amount, setAmount] = useState("49.90");
  const [currency, setCurrency] = useState("BRL");
  const [label, setLabel] = useState("ETRNET Premium");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  const addLog = (msg: string) => {
    logRef.current = [`[${new Date().toLocaleTimeString()}] ${msg}`, ...logRef.current].slice(0, 40);
    setLogs([...logRef.current]);
  };

  const makeItem = (): PaymentItem => ({ label, amount, currency });

  const handleLightning = async () => {
    const r = await paymentGateway.createLightningPayment(makeItem());
    setResult(r);
    addLog(r.success ? `Lightning: ${r.amountSat} sat, invoice gerada` : `ERRO: ${r.error}`);
  };

  const handleBitcoin = async () => {
    const r = await paymentGateway.createBitcoinPayment(makeItem());
    setResult(r);
    addLog(r.success ? `Bitcoin: ${r.amountSat} sat, endereco gerado` : `ERRO: ${r.error}`);
  };

  const handleNWC = async () => {
    const fakePk = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
    const r = await paymentGateway.createNWCPayment(fakePk, makeItem());
    setResult(r);
    addLog(r.success ? `NWC: ${r.amountSat} sat, invoice via Nostr` : `ERRO: ${r.error}`);
  };

  const handleAutoPay = async () => {
    const r = await paymentGateway.pay(makeItem());
    setResult(r);
    addLog(`Auto-pay (${r.method}): ${r.success ? "OK" : r.error}`);
  };

  return (
    <section id="payment-gateway-panel" className="relative border-b border-[#14181c] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-14 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[11px] tracking-[0.3em] text-[#ffd700]">§ 13.6</span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#ffd700]/40 to-transparent max-w-[120px]" />
            <span className="font-mono text-[11px] tracking-[0.3em] text-zinc-500">PAYMENT GATEWAY</span>
          </div>
          <h2 className="font-sans font-light text-3xl md:text-5xl text-zinc-100 leading-tight tracking-tight mb-4">
            Gateway de <span className="text-[#ffd700]">Pagamento</span>
          </h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-2xl">
            Bitcoin on-chain + Lightning Network + Nostr Wallet Connect (NWC).
            Sem KYC, sem conta, sem terceiro. Converte fiat para satoshis automaticamente.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-px bg-[#14181c] border border-[#14181c]">
          <div className="lg:col-span-7 bg-[#0a0d10] p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="tag">CRIAR PAGAMENTO</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <span className="font-mono text-[9px] text-zinc-600 mb-1 block">VALOR</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black border border-[#14181c] px-3 py-2 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-[#ffd700]/50"
                />
              </div>
              <div>
                <span className="font-mono text-[9px] text-zinc-600 mb-1 block">MOEDA</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-black border border-[#14181c] px-3 py-2 text-[10px] font-mono text-zinc-300 focus:outline-none"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <span className="font-mono text-[9px] text-zinc-600 mb-1 block">LABEL</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-black border border-[#14181c] px-3 py-2 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-[#ffd700]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={handleLightning}
                className="py-3 bg-[#ffd700] text-black font-mono text-[10px] tracking-[0.2em] hover:bg-white transition-all"
              >
                LIGHTNING
              </button>
              <button
                onClick={handleBitcoin}
                className="py-3 border border-[#ffd700]/30 text-[#ffd700] font-mono text-[10px] tracking-[0.2em] hover:bg-[#ffd700]/10 transition-all"
              >
                BITCOIN ON-CHAIN
              </button>
              <button
                onClick={handleNWC}
                className="py-3 border border-[#6cf0ff]/30 text-[#6cf0ff] font-mono text-[10px] tracking-[0.2em] hover:bg-[#6cf0ff]/10 transition-all"
              >
                NOSTR WALLET (NWC)
              </button>
              <button
                onClick={handleAutoPay}
                className="py-3 border border-[#b6ff3a]/30 text-[#b6ff3a] font-mono text-[10px] tracking-[0.2em] hover:bg-[#b6ff3a]/10 transition-all"
              >
                AUTO-PAY
              </button>
            </div>

            {result && (
              <div className={`p-4 border font-mono text-[10px] space-y-1 ${
                result.success ? "bg-black border-[#ffd700]/20" : "bg-black border-red-500/20"
              }`}>
                <div className="tag mb-2">{result.success ? "PAGAMENTO CRIADO" : "ERRO"}</div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">metodo</span>
                  <span className="text-[#ffd700]">{result.method}</span>
                </div>
                {result.amountSat && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">sats</span>
                    <span className="text-[#b6ff3a]">{result.amountSat.toLocaleString()}</span>
                  </div>
                )}
                {result.invoice && (
                  <div className="pt-1 border-t border-[#14181c] text-[8px] text-zinc-500 break-all">
                    invoice: {result.invoice.slice(0, 48)}...
                  </div>
                )}
                {result.address && (
                  <div className="pt-1 border-t border-[#14181c] text-[8px] text-zinc-500 break-all">
                    addr: {result.address}
                  </div>
                )}
                {result.paymentHash && (
                  <div className="text-[8px] text-zinc-600 break-all">
                    hash: {result.paymentHash.slice(0, 32)}...
                  </div>
                )}
                {result.error && <div className="text-red-400">{result.error}</div>}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-black p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="tag mb-3 block">METODOS DISPONIVEIS</span>
                <div className="space-y-2">
                  {[
                    { name: "Lightning Network", desc: "Instantaneo, taxas minimas", color: "#ffd700" },
                    { name: "Bitcoin On-Chain", desc: "~30min, 3 confirmacoes", color: "#ffd700" },
                    { name: "Nostr Wallet Connect", desc: "Descentralizado via NOSTR", color: "#6cf0ff" },
                  ].map((m, i) => (
                    <div key={i} className="p-3 bg-[#0a0d10] border border-[#14181c] font-mono text-[10px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2" style={{ backgroundColor: m.color }} />
                        <span className="text-zinc-300">{m.name}</span>
                      </div>
                      <div className="text-zinc-600 text-[8px] pl-4">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#0a0d10] border border-[#14181c] font-mono text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600">KYC</span>
                  <span className="text-[#b6ff3a]">NENHUM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">custodia</span>
                  <span className="text-[#b6ff3a]">ZERO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">preco BTC/BRL</span>
                  <span className="text-zinc-300">R$350.000</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#14181c]">
              <div className="tag mb-3">TERMINAL OUTPUT</div>
              <div className="h-40 overflow-y-auto font-mono text-[8px] text-zinc-500 space-y-1 scrollbar">
                {logs.length === 0 ? (
                  <div className="italic">// Aguardando operador...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="border-l border-[#14181c] pl-2">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
