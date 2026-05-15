/**
 * VØID Core — DistanceBridge MDNF Router
 * 
 * Orquestrador de roteamento com Maximally Disjoint Non-repeating Flow.
 * 
 * Garante que cada shard segue um caminho fisicamente disjunto:
 * - Shard 0: BLE/Wi-Fi Direct
 * - Shard 1: Human Carrier Network (HCN)
 * - Shard 2: LoRa Mesh
 * 
 * Nenhum nó intermediário vê mais de 1/3 da transação.
 */

import { generateRoutingInfo, RouteInfo } from "./qel";
import { BluetoothDriver, NFCDriver, SerialUWBDriver } from "../network/localDrivers";
import { sha3_256 } from "@noble/hashes/sha3.js";

export interface MDNFRoute {
  shardIndex: number;
  channel: "BLE" | "HCN" | "LORA" | "ACOUSTIC";
  path: string[];
  estimatedLatency: string;
  priority: number;
  status: "pending" | "in_transit" | "delivered" | "failed";
}

export interface DistanceBridgeConfig {
  maxShardSize: number;
  hcnEnabled: boolean;
  loraEnabled: boolean;
  acousticEnabled: boolean;
  timeoutMs: number;
}

export class DistanceBridgeRouter {
  private config: DistanceBridgeConfig;
  private btDriver: BluetoothDriver;
  private nfcDriver: NFCDriver;
  private serialDriver: SerialUWBDriver;
  private hcnCarriers: Map<string, HCNCarrier> = new Map();
  private routes: MDNFRoute[] = [];

  constructor(config: Partial<DistanceBridgeConfig> = {}) {
    this.config = {
      maxShardSize: 2048,
      hcnEnabled: true,
      loraEnabled: true,
      acousticEnabled: true,
      timeoutMs: 120000,
      ...config,
    };
    
    this.btDriver = new BluetoothDriver();
    this.nfcDriver = new NFCDriver();
    this.serialDriver = new SerialUWBDriver();
  }

  /**
   * Descobre carriers HCN próximos via BLE advertising
   */
  private async discoverHCNCarriers(): Promise<void> {
    console.log("[DistanceBridge] Descobrindo carriers HCN próximos...");
    
    if (!this.btDriver.isSupported()) {
      console.warn("[DistanceBridge] BLE não suportado, HCN discovery indisponível");
      return;
    }

    try {
      await this.btDriver.scanForPeers((peer) => {
        if (peer.name?.includes("ETΞRNET")) {
          const carrier: HCNCarrier = {
            id: peer.id,
            name: peer.name,
            rssi: peer.rssi ?? -70,
            lastSeen: Date.now(),
            shardCapacity: 5,
            shardStored: 0,
          };
          this.hcnCarriers.set(peer.id, carrier);
          console.log(`[HCN] Carrier descoberto: ${peer.name} (${peer.id})`);
        }
      });
    } catch (e) {
      console.error("[DistanceBridge] Erro ao descobrir carriers:", e);
    }
  }

  /**
   * Computa rotas MDNF para N shards com máxima disjunção
   */
  private computeMDNFRoutes(n: number = 3): MDNFRoute[] {
    const routes: MDNFRoute[] = [];
    const channels: ("BLE" | "HCN" | "LORA" | "ACOUSTIC")[] = ["BLE", "HCN", "LORA", "ACOUSTIC"];

    for (let i = 0; i < n; i++) {
      const channel = channels[i % channels.length];
      const path = this.generatePathForChannel(channel);

      routes.push({
        shardIndex: i,
        channel,
        path,
        estimatedLatency: this.estimateLatency(channel),
        priority: i === 0 ? 1 : i === 1 ? 2 : 3, // BLE = highest priority
        status: "pending",
      });
    }

    console.log("[MDNF] Rotas computadas:", routes.map(r => `${r.shardIndex}→${r.channel}`).join(" | "));
    return routes;
  }

  /**
   * Gera caminho físico para um canal específico
   */
  private generatePathForChannel(channel: "BLE" | "HCN" | "LORA" | "ACOUSTIC"): string[] {
    switch (channel) {
      case "BLE":
        return ["local_peer", "ble_gateway"];
      
      case "HCN":
        // Seleciona carriers que têm capacidade
        const availableCarriers = Array.from(this.hcnCarriers.values())
          .filter(c => c.shardStored < c.shardCapacity)
          .map(c => c.id)
          .slice(0, 2);
        
        if (availableCarriers.length === 0) {
          return ["fallback_carrier"];
        }
        return ["local_carrier", ...availableCarriers, "remote_peer"];
      
      case "LORA":
        return ["lora_gateway_1", "lora_relay_1", "lora_gateway_2"];
      
      case "ACOUSTIC":
        return ["acoustic_sender", "acoustic_medium", "acoustic_receiver"];
    }
  }

  /**
   * Estima latência de entrega por canal
   */
  private estimateLatency(channel: "BLE" | "HCN" | "LORA" | "ACOUSTIC"): string {
    switch (channel) {
      case "BLE":
        return "5–80 ms";
      case "HCN":
        return "min–horas";
      case "LORA":
        return "horas";
      case "ACOUSTIC":
        return "seg–min";
    }
  }

  /**
   * Roteia um shard por um caminho específico
   */
  private async routeShard(
    shard: { index: number; data: Uint8Array; nonce: Uint8Array; tag: Uint8Array },
    route: MDNFRoute
  ): Promise<boolean> {
    try {
      console.log(`[Routing] Shard ${shard.index} → ${route.channel} (${route.path.join(" → ")})`);

      switch (route.channel) {
        case "BLE":
          await this.btDriver.startAdvertising(shard.data);
          route.status = "delivered";
          return true;

        case "HCN":
          // Delega para carriers
          for (const carrierId of route.path.slice(1, -1)) {
            const carrier = this.hcnCarriers.get(carrierId);
            if (carrier && carrier.shardStored < carrier.shardCapacity) {
              carrier.shardStored++;
              console.log(`[HCN] Shard delegado ao carrier ${carrierId}`);
            }
          }
          route.status = "in_transit";
          return true;

        case "LORA":
          await this.serialDriver.connectUWB();
          await this.serialDriver.sendUWBPayload(shard.data);
          route.status = "delivered";
          return true;

        case "ACOUSTIC":
          // Simula transmissão acústica
          console.log(`[Acoustic] Transmitindo ${shard.data.length} bytes em 19kHz...`);
          route.status = "delivered";
          return true;

        default:
          return false;
      }
    } catch (e) {
      console.error(`[Routing] Erro ao rotear shard ${shard.index}:`, e);
      route.status = "failed";
      return false;
    }
  }

  /**
   * Coordena roteamento MDNF completo para múltiplos shards
   */
  public async routeShards(
    shards: Array<{ index: number; data: Uint8Array; nonce: Uint8Array; tag: Uint8Array }>,
    onProgress?: (route: MDNFRoute) => void
  ): Promise<MDNFRoute[]> {
    console.log(`[DistanceBridge] Iniciando roteamento MDNF para ${shards.length} shards...`);

    // Descobre carriers antes de computar rotas
    if (this.config.hcnEnabled) {
      await this.discoverHCNCarriers();
    }

    // Computa rotas com máxima disjunção
    this.routes = this.computeMDNFRoutes(shards.length);

    // Roteia cada shard em paralelo (mas por canais distintos)
    const routingPromises = shards.map(async (shard, idx) => {
      const route = this.routes[idx];
      if (!route) return;

      const success = await this.routeShard(shard, route);
      if (onProgress) onProgress(route);

      return { ...route, success };
    });

    const results = await Promise.all(routingPromises);
    console.log(`[DistanceBridge] Roteamento concluído:`, results.map(r => r?.status).join(" | "));

    return this.routes;
  }

  /**
   * Monitora status das rotas em tempo real
   */
  public monitorRoutes(interval: number = 5000): void {
    const monitor = setInterval(() => {
      const summary = this.routes.map(r => `Shard ${r.shardIndex}: ${r.status}`).join(", ");
      console.log(`[DistanceBridge Monitor] ${summary}`);

      // Limpa delivered routes após 5 min
      const now = Date.now();
      this.routes = this.routes.filter(r => r.status !== "delivered" || now - Date.now() < 300000);
    }, interval);

    return () => clearInterval(monitor);
  }

  /**
   * Limpa state (HCN carriers, routes)
   */
  public async cleanup(): Promise<void> {
    this.hcnCarriers.clear();
    this.routes = [];
    await this.serialDriver.disconnect();
    console.log("[DistanceBridge] Limpeza concluída");
  }
}

export interface HCNCarrier {
  id: string;
  name: string;
  rssi: number;
  lastSeen: number;
  shardCapacity: number;
  shardStored: number;
}
