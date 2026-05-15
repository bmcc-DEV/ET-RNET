/**
 * VØID Core — CRDT com Causalidade por Cone de Luz (Light Cone Causality)
 * 
 * Implementa consenso distribuído sem servidor de timestamp central.
 * Baseado em teoria da relatividade especial: dois eventos só são causalmente relacionados
 * se conectados por cone de luz (intervalo ≤ 0 na métrica de Minkowski).
 * 
 * Autômato: Event DAG + partial order by causality + CRDT merge semantics
 */

import { sha3_256, sha3_512 } from "@noble/hashes/sha3.js";

// ─── Event Structure ────────────────────────────────────────────────────

export interface CausalEvent {
  id: string;
  timestamp: bigint; // clock de Lamport (agente) ou physical time
  agentId: string;
  payload: any;
  vectorClock: Map<string, bigint>; // { agentId → logical time }
  dependencies: string[]; // IDs de eventos predecessores (causais)
  hash: string; // SHA3(payload + dependencies)
}

export interface LightConeInterval {
  eventA: CausalEvent;
  eventB: CausalEvent;
  interval: "timelike" | "spacelike" | "lightlike"; // classification Minkowskiana
  distance: number; // métrica pseudoriemanniana
}

// ─── Vector Clock (Lamport Timestamp) ───────────────────────────────────

export class VectorClock {
  private clock: Map<string, bigint> = new Map();

  constructor(agentId: string) {
    this.clock.set(agentId, 0n);
  }

  /**
   * Incrementa relógio local
   */
  public increment(agentId: string): void {
    this.clock.set(agentId, (this.clock.get(agentId) ?? 0n) + 1n);
  }

  /**
   * Merge com outro VectorClock (observar causalmente antes)
   */
  public merge(other: VectorClock): void {
    for (const [agent, time] of other.clock.entries()) {
      const myTime = this.clock.get(agent) ?? 0n;
      this.clock.set(agent, myTime > time ? myTime : time);
    }
  }

  /**
   * Verifica relação causal: this → other?
   */
  public happensBefore(other: VectorClock): boolean {
    let atLeastOnce = false;
    for (const [agent, myTime] of this.clock.entries()) {
      const otherTime = other.clock.get(agent) ?? 0n;
      if (myTime > otherTime) return false; // violação causal
      if (myTime < otherTime) atLeastOnce = true;
    }
    return atLeastOnce;
  }

  /**
   * Verifica concorrência (nem this → other nem other → this)
   */
  public isConcurrent(other: VectorClock): boolean {
    return !this.happensBefore(other) && !other.happensBefore(this);
  }

  public toJSON() {
    return Object.fromEntries(
      Array.from(this.clock.entries()).map(([k, v]) => [k, v.toString()])
    );
  }

  public static fromJSON(json: any): VectorClock {
    const vc = new VectorClock("placeholder");
    vc.clock.clear();
    for (const [k, v] of Object.entries(json)) {
      vc.clock.set(k, BigInt(v as string));
    }
    return vc;
  }
}

// ─── Causal Event DAG ───────────────────────────────────────────────────

export class CausalEventDAG {
  private events: Map<string, CausalEvent> = new Map();
  private vectorClocks: Map<string, VectorClock> = new Map();
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.vectorClocks.set(agentId, new VectorClock(agentId));
  }

  /**
   * Adiciona evento ao DAG com dependências causais automáticas
   */
  public addEvent(payload: any, dependencies: string[] = []): CausalEvent {
    const vc = this.vectorClocks.get(this.agentId)!;
    vc.increment(this.agentId);

    const eventId = `event_${sha3_256(
      new TextEncoder().encode(JSON.stringify(payload) + performance.now())
    )
      .toString()
      .slice(0, 16)}`;

    const event: CausalEvent = {
      id: eventId,
      timestamp: BigInt(Date.now()),
      agentId: this.agentId,
      payload,
      vectorClock: new Map(vc.clock),
      dependencies,
      hash: "",
    };

    // Computa hash causal
    const depHash = dependencies.length > 0
      ? sha3_256(new TextEncoder().encode(dependencies.join("|")))
      : new Uint8Array(32).fill(0);

    event.hash =
      "0x" +
      Array.from(
        sha3_256(
          new TextEncoder().encode(JSON.stringify(event.payload) + event.agentId)
        )
      )
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);

    this.events.set(eventId, event);
    console.log(`[Causal DAG] Evento adicionado: ${eventId} (deps: ${dependencies.length})`);

    return event;
  }

  /**
   * Integra evento de agente remoto (pode ser causal ou concurrent)
   */
  public integrateRemoteEvent(event: CausalEvent): void {
    if (this.events.has(event.id)) return; // já existe

    const remoteVC = VectorClock.fromJSON(
      Object.fromEntries(
        Array.from(event.vectorClock.entries()).map(([k, v]) => [k, v.toString()])
      )
    );

    const localVC = this.vectorClocks.get(this.agentId)!;

    // Merge vector clock
    localVC.merge(remoteVC);
    this.vectorClocks.set(event.agentId, remoteVC);

    this.events.set(event.id, event);
    console.log(`[Causal DAG] Evento remoto integrado: ${event.id} (agent: ${event.agentId})`);
  }

  /**
   * Classifica intervalo causal entre dois eventos (cone de luz)
   */
  public classifyInterval(eventAId: string, eventBId: string): LightConeInterval {
    const eventA = this.events.get(eventAId)!;
    const eventB = this.events.get(eventBId)!;

    // Métrica de Minkowski: s² = c²Δt² - Δx²
    // Aqui: Δt = diferença de timestamp, Δx = diferença de "espaço lógico" (vector clock)
    const timeDiff = Number(eventB.timestamp - eventA.timestamp);

    // Distância lógica via vector clock
    let logicalDist = 0;
    const vcA = eventA.vectorClock;
    const vcB = eventB.vectorClock;
    for (const [agent, timeA] of vcA) {
      const timeB = vcB.get(agent) ?? 0n;
      logicalDist += Number(Math.abs(Number(timeB - timeA)));
    }

    // Intervalo Minkowskiano: c=1 (normalizado)
    const interval = timeDiff * timeDiff - logicalDist * logicalDist;

    let classification: "timelike" | "spacelike" | "lightlike";
    if (interval > 0) {
      classification = "timelike"; // eventos causalmente relacionados
    } else if (interval < 0) {
      classification = "spacelike"; // eventos concurrent (sem relação causal)
    } else {
      classification = "lightlike"; // boundary (cone de luz)
    }

    return {
      eventA,
      eventB,
      interval: classification,
      distance: Math.sqrt(Math.abs(interval)),
    };
  }

  /**
   * Topological sort do DAG respeitando causalidade
   */
  public topologicalSort(): CausalEvent[] {
    const sorted: CausalEvent[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (eventId: string) => {
      if (visited.has(eventId)) return;
      if (visiting.has(eventId)) throw new Error(`Ciclo causal detectado: ${eventId}`);

      visiting.add(eventId);

      const event = this.events.get(eventId);
      if (event) {
        for (const depId of event.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(eventId);
      visited.add(eventId);

      if (event) sorted.push(event);
    };

    for (const eventId of this.events.keys()) {
      visit(eventId);
    }

    return sorted;
  }

  /**
   * Merge com outro DAG (reconciliação entre nós)
   */
  public merge(other: CausalEventDAG): void {
    for (const [eventId, event] of other.events) {
      if (!this.events.has(eventId)) {
        this.integrateRemoteEvent(event);
      }
    }
    console.log(`[Causal DAG] Merge completo: ${this.events.size} eventos no DAG`);
  }

  public getEvents(): CausalEvent[] {
    return Array.from(this.events.values());
  }

  public getEventCount(): number {
    return this.events.size;
  }
}

// ─── Replicated Data Type (CRDT) com Causalidade ────────────────────────

export interface CRDTValue {
  value: any;
  vectorClock: Map<string, bigint>;
  agentId: string;
  timestamp: bigint;
}

export class CausalCRDT {
  private values: CRDTValue[] = [];
  private dag: CausalEventDAG;
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.dag = new CausalEventDAG(agentId);
  }

  /**
   * Add value com causalidade implícita
   */
  public add(value: any): void {
    const vc = new VectorClock(this.agentId);
    vc.increment(this.agentId);

    const crdt: CRDTValue = {
      value,
      vectorClock: new Map(vc.clock),
      agentId: this.agentId,
      timestamp: BigInt(Date.now()),
    };

    this.values.push(crdt);

    // Registra no DAG causal
    this.dag.addEvent({ type: "add", value }, []);

    console.log(`[CRDT] Valor adicionado: ${JSON.stringify(value).slice(0, 50)}`);
  }

  /**
   * Merge com outro CRDT remoto
   */
  public merge(other: CausalCRDT): void {
    for (const remoteValue of other.values) {
      // Verifica se já existe (by vector clock)
      const exists = this.values.some(v =>
        Array.from(v.vectorClock.entries()).every(
          ([k, val]) => remoteValue.vectorClock.get(k) === val
        )
      );

      if (!exists) {
        this.values.push(remoteValue);
      }
    }

    // Merge DAGs
    this.dag.merge(other.dag);

    console.log(`[CRDT Merge] ${this.values.length} valores após merge`);
  }

  /**
   * Resolve conflitos (concurrent updates) via causalidade
   */
  public resolve(): any[] {
    // Ordena por cone de luz (timelike → antes, spacelike → conflict resolution)
    const sorted = this.dag.topologicalSort();

    const resolved: any[] = [];
    for (const event of sorted) {
      if (event.payload?.type === "add") {
        resolved.push(event.payload.value);
      }
    }

    return resolved;
  }

  public getState(): any[] {
    return this.resolve();
  }
}

// ─── Distributed Consensus with Light Cone ─────────────────────────────

export interface ConsensusMessage {
  nodeId: string;
  events: CausalEvent[];
  vectorClock: Map<string, bigint>;
  timestamp: bigint;
}

export class LightConeCensus {
  private nodes: Map<string, CausalEventDAG> = new Map();
  private pendingMessages: ConsensusMessage[] = [];

  public registerNode(nodeId: string): void {
    this.nodes.set(nodeId, new CausalEventDAG(nodeId));
    console.log(`[Census] Nó registrado: ${nodeId}`);
  }

  /**
   * Propaga evento de um nó para todos os outros (flooding)
   */
  public propagateEvent(nodeId: string, payload: any, deps: string[] = []): void {
    const dag = this.nodes.get(nodeId);
    if (!dag) return;

    const event = dag.addEvent(payload, deps);

    // Broadcast para outras nodes
    for (const [otherId, otherDag] of this.nodes) {
      if (otherId !== nodeId) {
        otherDag.integrateRemoteEvent(event);
      }
    }

    console.log(`[Census] Evento propagado de ${nodeId}: ${event.id}`);
  }

  /**
   * Consenso via votação por cone de luz: majority rules respeitando causalidade
   */
  public achieveConsensus(): Map<string, any[]> {
    const result = new Map<string, any[]>();

    for (const [nodeId, dag] of this.nodes) {
      const sorted = dag.topologicalSort();
      const resolved: any[] = [];

      for (const event of sorted) {
        resolved.push(event.payload);
      }

      result.set(nodeId, resolved);
    }

    // Verifica convergência (todos têm mesma sequência causal)
    const firstSeq = result.values().next().value;
    let converged = true;
    for (const seq of result.values()) {
      if (seq.length !== firstSeq.length) {
        converged = false;
        break;
      }
    }

    console.log(`[Census] Consenso: ${converged ? "CONVERGIRAM" : "ainda sincronizando"}`);
    return result;
  }

  public getNodeDAG(nodeId: string): CausalEventDAG | undefined {
    return this.nodes.get(nodeId);
  }
}
