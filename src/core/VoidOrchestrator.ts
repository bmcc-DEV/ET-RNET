/**
 * VØID Core — System Orchestrator
 *
 * O "Cérebro" do ecossistema. Unifica Identidade, Memória (HCN) e Sensaçāo (Drivers).
 * Resolve "The Glue Problem" centralizando o estado e o fluxo de dados.
 */

import { spawnGhostId, destroyGhostId, type GhostIdentity, type SpawnProgress } from "../crypto/ghostid";
import { fragmentMessage, type Shard, type FragmentResult } from "../crypto/qel";
import { HCNStore, type HCNShard } from "../storage/hcnStore";
import { BluetoothDriver, NFCDriver, SerialUWBDriver } from "../network/localDrivers";
import { LoRaDriver } from "../network/loraDriver";
import { AcousticDriver } from "../network/acousticDriver";
import { nostrMesh } from "../network/nostrMesh";

export type VoidEvent = 
// ... (rest is same)
  | { type: "GHOST_SPAWNED"; identity: GhostIdentity }
  | { type: "GHOST_DESTROYED" }
  | { type: "SHARD_RECEIVED"; shard: HCNShard }
  | { type: "SHARD_SENT"; commitment: string; channel: string }
  | { type: "KARMA_UPDATED"; balance: number }
  | { type: "NETWORK_STATUS_CHANGE"; driver: string; status: "online" | "offline" | "scanning" };

export type VoidListener = (event: VoidEvent) => void;

export class VoidOrchestrator {
  private static instance: VoidOrchestrator;
  
  // State
  private identity: GhostIdentity | null = null;
  private hcnStore = new HCNStore();
  private listeners: Set<VoidListener> = new Set();

  // Drivers
  public readonly ble = new BluetoothDriver();
  public readonly nfc = new NFCDriver();
  public readonly uwb = new SerialUWBDriver();
  public readonly lora = new LoRaDriver();
  public readonly acoustic = new AcousticDriver();

  // Cross-Tab Mesh (Real Peer Simulation)
  private meshChannel = new BroadcastChannel("void_omega_mesh");

  private constructor() {
    this.initNetworkListeners();
    this.initMeshChannel();
  }

  private initMeshChannel() {
    this.meshChannel.onmessage = (event) => {
      const { type, payload, sender } = event.data;
      
      if (type === "PEER_DISCOVERY") {
        this.notify({ type: "NETWORK_STATUS_CHANGE", driver: `MESH:${sender}`, status: "online" });
      } else if (type === "SHARD_BROADCAST") {
        this.handleIncomingShard(payload, `MESH:${sender}`);
      }
    };

    // Broadcast our presence every 5s
    setInterval(() => {
      if (this.identity) {
        this.meshChannel.postMessage({
          type: "PEER_DISCOVERY",
          sender: this.identity.handle
        });
      }
    }, 5000);
  }

  public static getInstance(): VoidOrchestrator {
    if (!VoidOrchestrator.instance) {
      VoidOrchestrator.instance = new VoidOrchestrator();
    }
    return VoidOrchestrator.instance;
  }

  // --- Identity Management ---

  public getIdentity(): GhostIdentity | null {
    return this.identity;
  }

  public async spawn(onProgress?: (p: SpawnProgress) => void): Promise<GhostIdentity> {
    const id = await spawnGhostId(onProgress);
    this.identity = id;
    this.notify({ type: "GHOST_SPAWNED", identity: id });
    return id;
  }

  public destroy(): void {
    if (this.identity) {
      destroyGhostId(this.identity);
      this.identity = null;
      this.notify({ type: "GHOST_DESTROYED" });
    }
  }

  // --- Messaging & Routing ---

  /**
   * Envia uma mensagem fragmentada através dos melhores canais disponíveis.
   */
  public async send(message: string): Promise<FragmentResult> {
    if (!this.identity) throw new Error("GHOSTID_REQUIRED");

    const result = fragmentMessage(message);
    
    // Roteamento inteligente: distribui shards por canais
    // Em uma implementação futura, isso consideraria latência e carga.
    for (let i = 0; i < result.shards.length; i++) {
      const shard = result.shards[i];
      const channel = this.determineBestChannel(i);
      
      // Store in local HCN for relay (Carrier logic)
      await this.hcnStore.storeShard({
        commitment: shard.commitment,
        payload: btoa(JSON.stringify(shard)),
        channel,
      });

      this.notify({ type: "SHARD_SENT", commitment: shard.commitment, channel });
      
      // Attempt physical transmission if driver is active
      this.transmitShard(shard, channel);
    }

    return result;
  }

  private determineBestChannel(index: number): string {
    const channels = ["BLE", "LoRa", "HCN_MESH", "WEBRTC"];
    return channels[index % channels.length];
  }

  private async transmitShard(shard: Shard, channel: string) {
    console.log(`[Orchestrator] Transmitindo shard ${shard.commitment} via ${channel}`);
    
    try {
      if (channel === "WEBRTC") {
        nostrMesh.broadcastShard(shard);
      }
      
      // Real Cross-Tab Transmission
      if (channel === "HCN_MESH") {
        this.meshChannel.postMessage({
          type: "SHARD_BROADCAST",
          payload: shard,
          sender: this.identity?.handle || "anon_node"
        });
      }

      if (channel === "BLE" && this.ble.isSupported()) {
        // Exemplo: broadcasting shard via BLE (mocked in driver)
        await this.ble.startAdvertising(shard.data);
      } else if (channel === "LoRa" && this.lora.isSupported()) {
        // Envia via rádio (0 = broadcast)
        await this.lora.sendData(0, btoa(JSON.stringify(shard)));
      }
    } catch (err) {
      console.warn(`[Orchestrator] Falha na transmissão física via ${channel}:`, err);
    }
  }

  // --- Network Event Loop ---

  private initNetworkListeners() {
    // Configura os drivers para reportar shards recebidos de volta ao orquestrador
    this.lora.onMessageReceived((sender, payload) => {
      try {
        const shard = JSON.parse(atob(payload));
        this.handleIncomingShard(shard, `LoRa:${sender}`);
      } catch { /* não é um shard VØID válido */ }
    });

    // Acoustic Scanner agora é ativado apenas via UI (gesto do usuário)
  }

  public async handleIncomingShard(shard: any, source: string) {
    if (!shard || !shard.commitment) return;
    console.log(`[Orchestrator] Shard recebido de ${source}: ${shard.commitment}`);
    
    // 1. Salva no HCN Store (OPFS)
    await this.hcnStore.storeShard({
      commitment: shard.commitment,
      payload: btoa(JSON.stringify(shard)),
      channel: source,
    });

    // 2. Notifica o sistema
    this.notify({ 
      type: "SHARD_RECEIVED", 
      shard: {
        commitment: shard.commitment,
        payload: btoa(JSON.stringify(shard)),
        channel: source,
        createdAt: Date.now(),
        expiresAt: Date.now() + 48 * 3600 * 1000
      }
    });

    // 3. Recompensa o Carrier (Karma)
    const newBalance = await this.hcnStore.awardKarma(shard.commitment, 5);
    this.notify({ type: "KARMA_UPDATED", balance: newBalance });
  }

  // --- Event System ---

  public subscribe(listener: VoidListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: VoidEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const voidOrchestrator = VoidOrchestrator.getInstance();
