/**
 * ETΞRNET — Layer 0: Social Fabric
 * 
 * O módulo central para interações sociais e mensagens descentralizadas.
 * Em ETΞRNET, a rede social é indissociável da infraestrutura financeira.
 * Um "post" ou "mensagem" é tratado como um Shard que trafega pela mesma malha (HCN)
 * que um UTXO, garantindo anonimato, resiliência e ausência de servidores centrais.
 */

import { voidOrchestrator } from "../core/VoidOrchestrator";
import { GhostIdentity } from "../crypto/ghostid";
import { fragmentMessage, reconstituteMessage } from "../crypto/qel";

export interface SocialMessage {
  id: string;
  senderPubKey: string; // Em hexadecimal
  recipientPubKey?: string; // Nulo para broadcasts públicos
  content: string; // O payload encriptado ou texto limpo (se público)
  timestamp: number;
  groupId?: string; // Se pertence a um Contact Lattice Token (Grupo)
}

export class SocialFabric {
  private static instance: SocialFabric;
  
  // Memória em RAM das conversas ativas nesta sessão.
  // Fiel ao GhostID: tudo morre quando o app fecha, a menos que o usuário
  // ativamente exporte/acople a uma 'Soul Seed'.
  private messages: Map<string, SocialMessage[]> = new Map();
  private listeners: Set<(msg: SocialMessage) => void> = new Set();

  public static getInstance(): SocialFabric {
    if (!SocialFabric.instance) {
      SocialFabric.instance = new SocialFabric();
    }
    return SocialFabric.instance;
  }

  private constructor() {
    this.initMeshListener();
  }

  /**
   * Conecta o Tecido Social ao Orquestrador de Rede.
   * Transforma a malha de shards em um feed de mensagens.
   */
  private initMeshListener() {
    voidOrchestrator.subscribe((event) => {
      if (event.type === "SHARD_RECEIVED") {
        this.processIncomingData(event.shard.payload);
      }
    });
  }

  /**
   * Emite uma mensagem pública para a malha.
   * Transforma o texto em um Shard QEL e joga no HCN.
   */
  public async broadcastPublicPost(content: string, identity: GhostIdentity) {
    const post: SocialMessage = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderPubKey: Array.from(identity.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      content,
      timestamp: Date.now()
    };

    // Serializa e fragmenta (QEL garante que viaja ofuscado)
    const payload = JSON.stringify(post);
    console.log(`[SocialFabric] Broadcasting public post: ${post.id}`);
    
    // Envia para o Orquestrador injetar no HCN/WebRTC
    await voidOrchestrator.send(`SOCIAL_POST:${payload}`);
    this.addMessageToState("public_feed", post);
  }

  /**
   * Envia uma DM criptografada E2EE.
   * (Placeholder: A criptografia real requer negociação de chave via NIP-04/X3DH).
   */
  public async sendDirectMessage(content: string, recipientPk: string, identity: GhostIdentity) {
    const msg: SocialMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      senderPubKey: Array.from(identity.publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      recipientPubKey: recipientPk,
      content, // Em prod: enc(content, sharedSecret)
      timestamp: Date.now()
    };

    const payload = JSON.stringify(msg);
    console.log(`[SocialFabric] Sending DM to ${recipientPk.slice(0,8)}...`);
    
    await voidOrchestrator.send(`SOCIAL_DM:${payload}`);
    this.addMessageToState(recipientPk, msg);
  }

  private processIncomingData(rawPayload: string) {
    try {
      // 1. Tenta decodificar o base64 do payload do shard
      const decodedStr = atob(rawPayload);
      
      // 2. Tenta reconstituir se for um shard isolado (simplificação para a PoC)
      // Na prática, precisaríamos de K=2 shards para remontar a mensagem real.
      // O Orquestrador já lidaria com o buffer de montagem QEL antes de passar para cá.
      
      if (decodedStr.startsWith("SOCIAL_POST:")) {
        const post = JSON.parse(decodedStr.replace("SOCIAL_POST:", ""));
        this.addMessageToState("public_feed", post);
      } 
      else if (decodedStr.startsWith("SOCIAL_DM:")) {
        const dm = JSON.parse(decodedStr.replace("SOCIAL_DM:", ""));
        
        // Verifica se é para nós
        const myId = voidOrchestrator.getIdentity();
        const myPkHex = myId ? Array.from(myId.publicKey).map(b => b.toString(16).padStart(2, '0')).join('') : null;
        
        if (dm.recipientPubKey === myPkHex) {
          this.addMessageToState(dm.senderPubKey, dm);
        }
      }
    } catch (e) {
      // Shard financeiro ou lixo
    }
  }

  private addMessageToState(threadId: string, msg: SocialMessage) {
    const thread = this.messages.get(threadId) || [];
    // Evita duplicadas (flood protection)
    if (!thread.some(m => m.id === msg.id)) {
      thread.push(msg);
      // Mantém apenas as últimas 100 na RAM
      if (thread.length > 100) thread.shift();
      
      this.messages.set(threadId, thread);
      this.listeners.forEach(l => l(msg));
    }
  }

  public getThread(threadId: string): SocialMessage[] {
    return this.messages.get(threadId) || [];
  }

  public subscribe(listener: (msg: SocialMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const socialFabric = SocialFabric.getInstance();
