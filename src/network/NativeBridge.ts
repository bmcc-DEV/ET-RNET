/**
 * VØID·ΩMEGA — Native Hardware Bridge (Stratum 1/2)
 *
 * Esta ponte conecta a lógica TypeScript/WASM com os serviços nativos do
 * Sistema Operacional (Android/iOS via Capacitor/React Native).
 * 
 * Resolve o problema crítico: browsers matam conexões Web Bluetooth quando
 * o dispositivo é bloqueado. Este bridge transfere a responsabilidade do
 * "Human Carrier" para um Foreground Service (Android) ou Background Task (iOS),
 * garantindo sobrevivência.
 */

import { type HCNShard } from "../storage/hcnStore";
import { voidOrchestrator } from "../core/VoidOrchestrator";

export class NativeBridge {
  private static instance: NativeBridge;
  private isNativeEnv = false;

  public static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  private constructor() {
    this.checkEnvironment();
    this.listenToNativeEvents();
  }

  private checkEnvironment() {
    // Detecta se estamos rodando em uma WebView envolvida pelo shell nativo do VØID
    this.isNativeEnv = !!(window as any).AndroidInterface || !!(window as any).webkit?.messageHandlers;
  }

  public isAvailable(): boolean {
    return this.isNativeEnv;
  }

  /**
   * Pede ao OS nativo para iniciar o serviço em background.
   */
  public activateCarrierService() {
    if (!this.isAvailable()) {
      console.warn("[NATIVE BRIDGE] Ambiente não nativo. Serviço de carrier em background inativo.");
      return;
    }

    console.log("[NATIVE BRIDGE] Solicitando Foreground Service ao OS...");
    try {
      if ((window as any).AndroidInterface) {
        (window as any).AndroidInterface.startAnimusService();
      }
    } catch (e) {
      console.error("[NATIVE BRIDGE] Falha ao ativar serviço nativo", e);
    }
  }

  /**
   * Envia shards locais para o cache nativo (Android).
   * O rádio BLE transmitirá a partir de lá, sem acordar a WebView.
   */
  public pushShardsToNativeCache(shards: HCNShard[]) {
    if (!this.isAvailable()) return;

    try {
      const payload = JSON.stringify(shards.map(s => ({
        id: s.commitment,
        data: s.payload
      })));
      
      if ((window as any).AndroidInterface) {
        (window as any).AndroidInterface.updateBleAdvertisingData(payload);
      }
    } catch (e) {
      console.error("[NATIVE BRIDGE] Falha ao injetar shards no cache nativo", e);
    }
  }

  /**
   * Escuta quando o serviço Android BLE background encontrar outro nó.
   */
  private listenToNativeEvents() {
    window.addEventListener("NATIVE_BLE_PEER", (e: any) => {
      const { address, rssi } = e.detail;
      console.log(`[NATIVE BRIDGE] Peer descoberto pelo Android Service: ${address} (${rssi}dBm)`);
      
      // Notifica o orquestrador para registrar a conexão na malha lógica
      voidOrchestrator.handleIncomingShard({}, `NATIVE_BLE:${address}`);
    });

    window.addEventListener("NATIVE_SHARD_RECEIVED", (e: any) => {
      const { shard } = e.detail;
      console.log(`[NATIVE BRIDGE] Shard recebido enquanto a tela estava apagada!`);
      // Roteia de volta para o ecossistema principal
      voidOrchestrator.handleIncomingShard(shard, "NATIVE_BACKGROUND");
    });
  }
}

export const nativeBridge = NativeBridge.getInstance();
