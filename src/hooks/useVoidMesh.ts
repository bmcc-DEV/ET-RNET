// src/hooks/useVoidMesh.ts
// Mesh P2P via BroadcastChannel (local) com upgrade para WebRTC

import { useEffect, useRef, useCallback } from 'react';

export interface Peer {
  id: string;
  ghostId: string;
  latency: number;
  lastSeen: number;
  trustScore: number;
  isOnline: boolean;
}

export interface Transaction {
  id: string;
  nullifier: string;
  commitment: string;
  timestamp: number;
  shardIndex: number;
  status: 'pending' | 'propagating' | 'finalized' | 'rejected';
}

interface MeshCallbacks {
  onPeerDiscovered:     (peer: Peer) => void;
  onPeerLost:           (peerId: string) => void;
  onTransactionReceived:(tx: Transaction) => void;
}

export function useVoidMesh(callbacks: MeshCallbacks) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef(callbacks);

  // Mantém callbacks atualizados sem re-criar o canal
  useEffect(() => { callbacksRef.current = callbacks; });

  useEffect(() => {
    channelRef.current = new BroadcastChannel('void:mesh:v1');

    channelRef.current.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data as {
        type: string;
        payload: unknown;
      };

      switch (type) {
        case 'PEER_ANNOUNCE':
          callbacksRef.current.onPeerDiscovered(payload as Peer);
          break;
        case 'PEER_BYE':
          callbacksRef.current.onPeerLost(payload as string);
          break;
        case 'TX_BROADCAST':
          callbacksRef.current.onTransactionReceived(payload as Transaction);
          break;
      }
    };

    // Heartbeat: anuncia presença a cada 10s
    heartbeatRef.current = setInterval(() => {
      channelRef.current?.postMessage({
        type: 'PEER_ANNOUNCE',
        payload: {
          id:         crypto.randomUUID(),
          ghostId:    'local_node',
          latency:    0,
          lastSeen:   Date.now(),
          trustScore: 100,
          isOnline:   true,
        } satisfies Peer,
      });
    }, 10_000);

    return () => {
      channelRef.current?.postMessage({ type: 'PEER_BYE', payload: 'self' });
      channelRef.current?.close();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []); // Sem dependências: monta uma vez, desmonta uma vez

  const broadcastToMesh = useCallback(async (tx: Transaction) => {
    channelRef.current?.postMessage({ type: 'TX_BROADCAST', payload: tx });
  }, []);

  return {
    meshStatus: channelRef.current ? 'active' : 'offline' as const,
    broadcastToMesh,
  };
}
