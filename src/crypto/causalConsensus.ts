/**
 * ETΞRNET — Layer 3: Relativistic Consensus (CRDT)
 * 
 * Implementa consenso causal para redes de alta latência (LoRa/Satelital).
 * Usa LWW-Element-Set (Last-Write-Wins) ancorado no cone de luz (timestamps).
 * Garante convergência de estado sem necessidade de conexão constante.
 */

export interface CausalEvent<T> {
  id: string;
  payload: T;
  timestamp: number; // Coordenada temporal no cone de luz
  originPk: string;
}

export class RelativisticState<T extends { id: string }> {
  private state: Map<string, CausalEvent<T>> = new Map();

  /**
   * Adiciona ou atualiza um elemento no estado replicado.
   * Só aceita a mudança se o novo evento for causalmente posterior.
   */
  public merge(event: CausalEvent<T>): boolean {
    const existing = this.state.get(event.payload.id);
    
    if (!existing || event.timestamp > existing.timestamp) {
      this.state.set(event.payload.id, event);
      return true;
    }
    
    return false; // Rejeitado: conflito relativístico (evento antigo)
  }

  /**
   * Retorna o estado atual convergido.
   */
  public view(): T[] {
    return Array.from(this.state.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => e.payload);
  }

  /**
   * Sincroniza dois conjuntos de estado (Gossip).
   */
  public sync(remoteEvents: CausalEvent<T>[]): number {
    let updates = 0;
    for (const event of remoteEvents) {
      if (this.merge(event)) updates++;
    }
    return updates;
  }
}

export const meshGlobalState = new RelativisticState<any>();
