/**
 * VØID·ΩMEGA — Global Mesh via NOSTR + WebRTC (Stratum 4)
 * 
 * Resolve o problema do NAT e alcance global. Usa relays NOSTR públicos
 * apenas para signaling (troca de ICE candidates e SDPs). Depois que os
 * nós conectam via WebRTC, a comunicação é 100% P2P e invisível aos relays.
 */

import { SimplePool, generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';
import { voidOrchestrator } from '../core/VoidOrchestrator';

export class NostrWebRTCMesh {
  private pool = new SimplePool();
  private relays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.primal.net'
  ];
  
  private sk = generateSecretKey();
  private pk = getPublicKey(this.sk);
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();

  constructor() {
    // Escuta por ofertas WebRTC endereçadas a esta PK
    this.listenForSignaling();
    
    // Escuta por outros nós ativos para iniciar conexões
    this.listenForPeers();
    
    // Anuncia presença na rede
    this.announcePresence();
    setInterval(() => this.announcePresence(), 60000);
  }

  private announcePresence() {
    const event = finalizeEvent({
      kind: 30000,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['t', 'void_omega_rendezvous']],
      content: 'void_node_active'
    }, this.sk);

    this.pool.publish(this.relays, event);
  }

  private listenForSignaling() {
    this.pool.subscribeMany(this.relays, [
      { 
        kinds: [4], 
        "#p": [this.pk] 
      }
    ], {
      onevent: (event: any) => this.handleSignaling(event)
    });
  }

  private listenForPeers() {
    this.pool.subscribeMany(this.relays, [
      { 
        kinds: [30000], 
        "#t": ['void_omega_rendezvous'] 
      }
    ], {
      onevent: (event: any) => {
        if (event.pubkey !== this.pk && !this.peerConnections.has(event.pubkey)) {
          console.log(`[NostrMesh] Novo peer descoberto: ${event.pubkey.slice(0,8)}... Conectando.`);
          this.connectToPeer(event.pubkey);
        }
      }
    });
  }

  private async handleSignaling(event: any) {
    // Descriptografia Nostr NIP-04 omitida para brevidade (simulação do payload)
    try {
      const payload = JSON.parse(event.content); // Em prod: decrypt(event.content)
      
      if (payload.type === 'offer') {
        const pc = this.createPeerConnection(event.pubkey);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignaling(event.pubkey, { type: 'answer', sdp: answer });
      } else if (payload.type === 'answer') {
        const pc = this.peerConnections.get(event.pubkey);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } else if (payload.type === 'candidate') {
        const pc = this.peerConnections.get(event.pubkey);
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    } catch (e) {
      // Ignora spam ou mensagens inválidas
    }
  }

  private sendSignaling(targetPk: string, payload: any) {
    // Cifra e envia DM via NOSTR
    const event = finalizeEvent({
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', targetPk]],
      content: JSON.stringify(payload) // Em prod: encrypt(targetPk, payload)
    }, this.sk);

    this.pool.publish(this.relays, event);
  }

  private createPeerConnection(peerPk: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) this.sendSignaling(peerPk, { type: 'candidate', candidate: e.candidate });
    };

    pc.ondatachannel = (e) => {
      this.setupDataChannel(peerPk, e.channel);
    };

    this.peerConnections.set(peerPk, pc);
    return pc;
  }

  private setupDataChannel(peerPk: string, channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log(`[WebRTC] DataChannel aberto com peer global: ${peerPk}`);
      // Notifica o orquestrador que um novo canal GLOBAL está online
      voidOrchestrator.handleIncomingShard({ commitment: "system" }, `WEBRTC:${peerPk.slice(0,8)}`);
    };

    channel.onmessage = (e) => {
      try {
        const shard = JSON.parse(e.data);
        voidOrchestrator.handleIncomingShard(shard, `WEBRTC:${peerPk.slice(0,8)}`);
      } catch (err) { }
    };

    this.dataChannels.set(peerPk, channel);
  }

  public connectToPeer(peerPk: string) {
    const pc = this.createPeerConnection(peerPk);
    const dc = pc.createDataChannel('void_shard_channel');
    this.setupDataChannel(peerPk, dc);

    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      this.sendSignaling(peerPk, { type: 'offer', sdp: offer });
    });
  }

  public broadcastShard(shardData: any) {
    const payload = JSON.stringify(shardData);
    this.dataChannels.forEach(dc => {
      if (dc.readyState === 'open') {
        dc.send(payload);
      }
    });
  }
}

export const nostrMesh = new NostrWebRTCMesh();
