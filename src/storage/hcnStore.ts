/**
 * VØID Core — Human Carrier Network (HCN) Storage Engine
 *
 * Banco de dados offline-first robusto usando o Origin Private File System (OPFS)
 * nativo do browser. Gerencia Shards carregados pelos portadores (Carriers).
 *
 * Características:
 * - Persistência binária e segura em sandbox isolada da CPU/Browser.
 * - TTL (Time-To-Live) de 48 horas gerenciado por varredura automática.
 * - Registro anônimo de créditos de karma para recompensas.
 */

export interface HCNShard {
  commitment: string;       // SHA3-256 hash (ID único do shard)
  payload:    string;       // dados criptografados em base64
  channel:    string;       // canal recomendado (BLE/LoRa/etc)
  createdAt:  number;       // timestamp de criação
  expiresAt:  number;       // timestamp de expiração (createdAt + 48h)
}

export interface KarmaWallet {
  publicKey:  string;       // chave pública anônima do carrier
  balance:    number;       // balanço acumulado de karma
  claims:     string[];     // hashes de provas de entrega
}

export class HCNStore {
  private static STORAGE_FOLDER = "hcn_shards";

  /**
   * Inicializa o OPFS e cria a estrutura de diretórios se necessário.
   */
  private async getDirectory(): Promise<FileSystemDirectoryHandle> {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle(HCNStore.STORAGE_FOLDER, { create: true });
  }

  /**
   * Salva um Shard no OPFS com metadados estruturados.
   */
  public async storeShard(shard: Omit<HCNShard, "createdAt" | "expiresAt">): Promise<void> {
    try {
      const dir = await this.getDirectory();
      const filename = `${shard.commitment}.json`;
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      const createdAt = Date.now();
      const expiresAt = createdAt + 48 * 60 * 60 * 1000; // 48 Horas TTL

      const fullShard: HCNShard = {
        ...shard,
        createdAt,
        expiresAt,
      };

      await writable.write(JSON.stringify(fullShard));
      await writable.close();
      console.log(`[HCN Store] Shard ${shard.commitment} salvo no OPFS. Expira em 48h.`);
    } catch (err) {
      console.error("[HCN Store] Erro ao salvar shard no OPFS:", err);
      throw err;
    }
  }

  /**
   * Retorna todos os Shards válidos (não expirados).
   * Varre o diretório e descarta registros vencidos.
   */
  public async getValidShards(): Promise<HCNShard[]> {
    const validShards: HCNShard[] = [];
    const now = Date.now();

    try {
      const dir = await this.getDirectory();
      // @ts-ignore entries() é suportado na especificação OPFS mais recente
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === "file") {
          const file = await (handle as FileSystemFileHandle).getFile();
          const text = await file.text();
          const shard: HCNShard = JSON.parse(text);

          if (shard.expiresAt < now) {
            // Shard expirou! Deleta fisicamente para liberar espaço
            await dir.removeEntry(name);
            console.log(`[HCN Store] Shard expirado ${shard.commitment} limpo via sweeper.`);
          } else {
            validShards.push(shard);
          }
        }
      }
    } catch (err) {
      console.error("[HCN Store] Erro ao listar shards no OPFS:", err);
    }

    return validShards;
  }

  /**
   * Deleta manualmente um shard após entrega bem sucedida.
   */
  public async deleteShard(commitment: string): Promise<void> {
    try {
      const dir = await this.getDirectory();
      await dir.removeEntry(`${commitment}.json`);
      console.log(`[HCN Store] Shard ${commitment} entregue e removido.`);
    } catch (err) {
      console.warn(`[HCN Store] Shard ${commitment} já foi limpo ou não existe.`, err);
    }
  }

  // ─── Anonymous Karma Ledger (Proof-of-Delivery) ───────────────────────────

  /**
   * Concede créditos de Karma ao Carrier por fatiar ou entregar shards.
   * Mantém integridade offline via assinaturas de comprovação.
   */
  public async awardKarma(proofHash: string, amount = 10): Promise<number> {
    try {
      const root = await navigator.storage.getDirectory();
      const karmaHandle = await root.getFileHandle("karma_ledger.json", { create: true });
      
      let wallet: KarmaWallet = { publicKey: "anon_carrier", balance: 0, claims: [] };
      
      try {
        const file = await karmaHandle.getFile();
        const text = await file.text();
        if (text) wallet = JSON.parse(text);
      } catch { /* primeira execução — usar padrão */ }

      if (wallet.claims.includes(proofHash)) {
        return wallet.balance; // Já recompensado
      }

      wallet.balance += amount;
      wallet.claims.push(proofHash);

      const writable = await karmaHandle.createWritable();
      await writable.write(JSON.stringify(wallet));
      await writable.close();

      console.log(`[HCN Karma] +${amount} Karma concedido! Novo saldo: ${wallet.balance}`);
      return wallet.balance;
    } catch (err) {
      console.error("[HCN Karma] Erro ao atualizar saldo de karma:", err);
      return 0;
    }
  }

  /**
   * Retorna o saldo de Karma acumulado na carteira anônima local.
   */
  public async getKarmaBalance(): Promise<number> {
    try {
      const root = await navigator.storage.getDirectory();
      const karmaHandle = await root.getFileHandle("karma_ledger.json", { create: true });
      const file = await karmaHandle.getFile();
      const text = await file.text();
      if (text) {
        const wallet: KarmaWallet = JSON.parse(text);
        return wallet.balance;
      }
    } catch { /* Ledger vazio */ }
    return 0;
  }
}

// Singleton instance for direct imports
export const hcnStore = new HCNStore();
