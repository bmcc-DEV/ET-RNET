import { useState, useEffect } from "react";
import type { GhostIdentity } from "../crypto/ghostid";

type Stage = "intro" | "collecting" | "spawning" | "done";

interface Props {
  onSpawn: (onProgress?: (p: { stage: string; detail: string }) => void) => Promise<GhostIdentity>;
}

export default function GhostIDSetup({ onSpawn }: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  const [progress, setProgress] = useState({ stage: "", detail: "" });
  const [touchCount, setTouchCount] = useState(0);
  const [identity, setIdentity] = useState<GhostIdentity | null>(null);

  const handleTouch = () => {
    if (stage !== "collecting") return;
    setTouchCount((prev) => prev + 1);
  };

  useEffect(() => {
    if (touchCount >= 5 && stage === "collecting") {
      setStage("spawning");
      onSpawn((p) => setProgress(p))
        .then((id) => {
          setIdentity(id);
          setStage("done");
        })
        .catch(console.error);
    }
  }, [touchCount, stage, onSpawn]);

  // ─── Intro ───
  if (stage === "intro") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-[#a855f7] font-mono text-3xl font-bold tracking-widest">
            VØID
          </div>
          <div className="text-zinc-500 font-mono text-xs tracking-wider">
            MESSENGER
          </div>

          <div className="border border-[#1a1f26] p-6 space-y-4">
            <div className="text-zinc-300 text-sm">
              Sua identidade é derivada de entropia quântica, biometria e criptografia
              pós-quântica.
            </div>
            <div className="text-zinc-500 text-xs">
              Sem telefone. Sem email. Sem servidor. Apenas você.
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setStage("collecting")}
              className="w-full py-3 bg-[#a855f7] hover:bg-[#a855f7]/80 text-black font-mono text-xs tracking-widest transition-colors"
            >
              CRIAR GHOST ID
            </button>
            <div className="text-[9px] font-mono text-zinc-700">
              ML-KEM-1024 · Ed25519 · Argon2id · SHA3-512
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Collecting Biometrics ───
  if (stage === "collecting") {
    return (
      <div
        className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-8"
        onTouchStart={handleTouch}
        onClick={handleTouch}
      >
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-[#a855f7] font-mono text-xs tracking-widest">
            COLETANDO ENTROPIA BIOMÉTRICA
          </div>

          {/* Touch indicator */}
          <div className="relative w-40 h-40 mx-auto">
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                touchCount > 0
                  ? "border-[#a855f7] bg-[#a855f7]/10"
                  : "border-zinc-800"
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-mono text-[#a855f7]">
                  {touchCount}
                </div>
                <div className="text-[9px] font-mono text-zinc-600">
                  / 5 toques
                </div>
              </div>
            </div>
            {/* Pulse rings */}
            {touchCount > 0 && (
              <>
                <div className="absolute inset-0 rounded-full border border-[#a855f7]/20 animate-ping" />
                <div className="absolute inset-[-8px] rounded-full border border-[#a855f7]/10 animate-ping" style={{ animationDelay: "0.5s" }} />
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-zinc-400 text-sm">
              Toque na tela para gerar entropia biométrica
            </div>
            <div className="text-zinc-600 text-[10px] font-mono">
              Pressão · Timing · Dinâmica de toque
            </div>
          </div>

          {/* Entropy sources */}
          <div className="flex justify-center gap-4">
            {["TOQUE", "TEMPO", "PRESSÃO"].map((src, i) => (
              <div
                key={src}
                className={`px-2 py-1 text-[8px] font-mono border transition-colors ${
                  i < touchCount
                    ? "text-[#00ff41] border-[#00ff41]/30"
                    : "text-zinc-700 border-zinc-800"
                }`}
              >
                {src}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Spawning (WASM derivation) ───
  if (stage === "spawning") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-[#a855f7] font-mono text-xs tracking-widest">
            DERIVANDO IDENTIDADE
          </div>

          {/* Pipeline visualization */}
          <div className="space-y-3">
            {[
              { label: "QUANTUM ENTROPY", active: progress.stage.includes("quantum") || progress.stage.includes("wasm") },
              { label: "BIOMETRIC STABLE KEY", active: progress.stage.includes("biometric") || progress.stage.includes("fuzzy") },
              { label: "ARGON2ID KDF", active: progress.stage.includes("argon") },
              { label: "WASM ENCLAVE", active: progress.stage.includes("wasm") },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-2 px-3 py-2 border transition-colors ${
                  step.active
                    ? "border-[#a855f7]/40 bg-[#a855f7]/5"
                    : "border-[#1a1f26]"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    step.active ? "bg-[#a855f7] animate-pulse" : "bg-zinc-800"
                  }`}
                />
                <span
                  className={`font-mono text-[10px] ${
                    step.active ? "text-[#a855f7]" : "text-zinc-700"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {progress.detail && (
            <div className="text-[9px] font-mono text-zinc-500">
              {progress.detail}
            </div>
          )}

          <div className="text-zinc-700 text-[10px] font-mono animate-pulse">
            PROCESSANDO...
          </div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (stage === "done" && identity) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 px-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-[#00ff41] font-mono text-xs tracking-widest">
            GHOST ID CRIADO
          </div>

          <div className="w-20 h-20 mx-auto rounded-full bg-[#a855f7]/20 border-2 border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] font-mono text-2xl font-bold">
            {identity.handle.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="font-mono text-lg text-[#a855f7]">
              {identity.handle}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 mt-1">
              {identity.entropyBits} bits de entropia ·{" "}
              {identity.quantumVerified ? "QUÂNTICA" : "CSPRNG"}
            </div>
          </div>

          <div className="border border-[#1a1f26] p-3">
            <div className="text-[9px] font-mono text-zinc-600 mb-1">
              CHAVE PÚBLICA
            </div>
            <div className="font-mono text-[8px] text-zinc-500 break-all">
              {Array.from(identity.publicKey)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {["Ed25519", "X25519", "ML-KEM-1024", "QEL"].map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 text-[8px] font-mono text-[#00ff41] border border-[#00ff41]/20"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="text-[9px] font-mono text-zinc-700">
            Identidade pronta. A rede está esperando por você.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
