// src/hooks/useGhostId.ts
// Identidade efêmera — gerada em RAM, destruída ao sair

import { useState, useEffect, useCallback, useRef } from 'react';

interface GhostIdState {
  ghostId: string;
  publicCommitment: string;
  sessionEpoch: number;
}

export function useGhostId() {
  const [state, setState] = useState<GhostIdState | null>(null);
  const entropyBufferRef = useRef<number[]>([]);

  // Coleta entropia passiva (sem biometria ativa)
  useEffect(() => {
    const collectEntropy = (e: MouseEvent | TouchEvent | DeviceMotionEvent) => {
      if (e instanceof MouseEvent) {
        entropyBufferRef.current.push(e.clientX ^ e.clientY ^ Date.now());
      }
      if (e instanceof DeviceMotionEvent && e.acceleration) {
        const { x = 0, y = 0, z = 0 } = e.acceleration;
        entropyBufferRef.current.push(
          Math.floor((x ?? 0) * 1000) ^
          Math.floor((y ?? 0) * 1000) ^
          Math.floor((z ?? 0) * 1000)
        );
      }
      // Limita buffer — não vaza para memória indefinidamente
      if (entropyBufferRef.current.length > 256) {
        entropyBufferRef.current = entropyBufferRef.current.slice(-128);
      }
    };

    window.addEventListener('mousemove', collectEntropy, { passive: true });
    window.addEventListener('touchmove', collectEntropy, { passive: true });
    window.addEventListener('devicemotion', collectEntropy, { passive: true });

    return () => {
      window.removeEventListener('mousemove', collectEntropy);
      window.removeEventListener('touchmove', collectEntropy);
      window.removeEventListener('devicemotion', collectEntropy);
    };
  }, []);

  const generateGhostId = useCallback(async (): Promise<GhostIdState> => {
    // Combina entropia coletada + CSPRNG do browser
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const entropyArray = new Uint8Array(
      entropyBufferRef.current.slice(0, 32).map(n => n & 0xff)
    );

    // XOR das fontes de entropia
    const combined = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      combined[i] = randomBytes[i] ^ (entropyArray[i] ?? 0);
    }

    // Deriva o GhostID via WebCrypto (nativo, sem deps)
    const keyMaterial = await crypto.subtle.importKey(
      'raw', combined, 'HKDF', false, ['deriveKey', 'deriveBits']
    );

    const derived = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-512',
        salt: crypto.getRandomValues(new Uint8Array(32)),
        info: new TextEncoder().encode('VOID:GHOSTID:v1'),
      },
      keyMaterial,
      256
    );

    const ghostIdBytes = new Uint8Array(derived);
    const ghostId = Array.from(ghostIdBytes.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Zero-fill o buffer de entropia após uso
    entropyBufferRef.current = [];

    return {
      ghostId:          `void_◈_${ghostId}`,
      publicCommitment: ghostId.slice(0, 16), // hash público, não o segredo
      sessionEpoch:     Math.floor(Date.now() / 300_000), // epoch de 5 min
    };
  }, []);

  useEffect(() => {
    generateGhostId().then(setState);

    // Destrói e regenera a cada 30 minutos
    const interval = setInterval(() => {
      generateGhostId().then(setState);
    }, 30 * 60 * 1000);

    // Cleanup: zero-fill ao desmontar
    return () => {
      clearInterval(interval);
      setState(null);
    };
  }, [generateGhostId]);

  return {
    ghostId:           state?.ghostId ?? 'generating...',
    publicCommitment:  state?.publicCommitment ?? '',
    sessionEpoch:      state?.sessionEpoch ?? 0,
    regenerateIdentity: () => generateGhostId().then(setState),
  };
}
