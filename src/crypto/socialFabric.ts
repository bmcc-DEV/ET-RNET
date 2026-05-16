/**
 * ETΞRNET — Social Fabric via NOSTR
 *
 * Feed social descentralizado onde cada post é um evento NOSTR
 * assinado com a chave GhostID do autor.
 *
 * Curadoria via karma: posts de usuários com mais karma aparecem
 * mais alto no feed.
 *
 * Kind 31217: Post social ETRNET
 * Kind 31218: Reação (like/repost)
 */

import { secureRandomId } from "../utils/secureRandom";

// ─── Constantes ──────────────────────────────────────────────────────────────

/** NOSTR event kind para posts sociais ETRNET */
export const SOCIAL_POST_KIND = 31217;

/** NOSTR event kind para reações ETRNET */
export const SOCIAL_REACTION_KIND = 31218;

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Tipo de reação social */
export type ReactionType = "like" | "repost" | "flag";

/** Post social no feed ETRNET */
export interface SocialPost {
  /** Identificador único do post */
  id: string;
  /** Chave pública do autor (GhostID) */
  authorPk: string;
  /** Conteúdo do post */
  content: string;
  /** Tags do post */
  tags: string[];
  /** Timestamp de criação */
  createdAt: number;
  /** Contagem de likes */
  likes: number;
  /** Contagem de reposts */
  reposts: number;
  /** Score de karma do autor */
  karma: number;
}

/** Reação a um post */
export interface SocialReaction {
  /** Identificador único da reação */
  id: string;
  /** ID do post reagido */
  postId: string;
  /** Chave pública de quem reagiu */
  authorPk: string;
  /** Tipo da reação */
  type: ReactionType;
  /** Timestamp da reação */
  createdAt: number;
}

/** Feed social com paginação */
export interface SocialFeed {
  /** Posts do feed ordenados por score */
  posts: SocialPost[];
  /** Total de posts disponíveis */
  total: number;
  /** Timestamp da última atualização */
  lastUpdate: number;
}

/** Listener para novos posts */
type FeedListener = (post: SocialPost) => void;

/** Listener para reações */
type ReactionListener = (reaction: SocialReaction) => void;

// ─── Social Fabric ───────────────────────────────────────────────────────────

/**
 * Feed social descentralizado via NOSTR.
 *
 * Cada post é um evento NOSTR assinado com a chave GhostID.
 * Curadoria via karma: posts de autores com mais karma sobem no feed.
 */
class SocialFabric {
  private static instance: SocialFabric;
  private posts: Map<string, SocialPost> = new Map();
  private reactions: Map<string, SocialReaction[]> = new Map();
  private feedListeners: Set<FeedListener> = new Set();
  private reactionListeners: Set<ReactionListener> = new Set();

  public static getInstance(): SocialFabric {
    if (!SocialFabric.instance) SocialFabric.instance = new SocialFabric();
    return SocialFabric.instance;
  }

  private constructor() {}

  /**
   * Cria um novo post (para assinar e transmitir via NOSTR).
   *
   * @param authorPk - Chave pública do autor (GhostID)
   * @param content - Conteúdo do post
   * @param tags - Tags do post
   * @param karma - Score de karma do autor
   */
  createPost(
    authorPk: string,
    content: string,
    tags: string[] = [],
    karma: number = 0,
  ): SocialPost {
    const id = `post_${secureRandomId(8)}`;
    const now = Date.now();

    const post: SocialPost = {
      id,
      authorPk,
      content,
      tags,
      createdAt: now,
      likes: 0,
      reposts: 0,
      karma,
    };

    this.posts.set(id, post);

    for (const listener of this.feedListeners) {
      try { listener(post); } catch { /* ignore */ }
    }

    return post;
  }

  /**
   * Ingere um post recebido via NOSTR.
   *
   * @param post - Post recebido do relay
   */
  ingestPost(post: SocialPost): void {
    if (this.posts.has(post.id)) return;
    this.posts.set(post.id, post);

    for (const listener of this.feedListeners) {
      try { listener(post); } catch { /* ignore */ }
    }
  }

  /**
   * Cria uma reação a um post.
   *
   * @param postId - ID do post alvo
   * @param authorPk - Chave pública de quem reagiu
   * @param type - Tipo da reação
   * @returns A reação criada, ou null se o post não existe
   */
  createReaction(
    postId: string,
    authorPk: string,
    type: ReactionType,
  ): SocialReaction | null {
    const post = this.posts.get(postId);
    if (!post) return null;

    const id = `rxn_${secureRandomId(8)}`;
    const reaction: SocialReaction = {
      id,
      postId,
      authorPk,
      type,
      createdAt: Date.now(),
    };

    // Atualiza contadores do post
    if (type === "like") post.likes++;
    if (type === "repost") post.reposts++;

    // Armazena reação
    const postReactions = this.reactions.get(postId) || [];
    postReactions.push(reaction);
    this.reactions.set(postId, postReactions);

    // Notifica listeners
    for (const listener of this.reactionListeners) {
      try { listener(reaction); } catch { /* ignore */ }
    }

    return reaction;
  }

  /**
   * Obtém o feed ordenado por score ponderado por karma.
   *
   * Score = likes + reposts*2 + karma*0.1 + bônus de recência
   *
   * @param limit - Número máximo de posts
   * @param offset - Offset para paginação
   */
  getFeed(limit: number = 50, offset: number = 0): SocialFeed {
    const allPosts = Array.from(this.posts.values());

    // Score = likes + reposts*2 + karma*0.1 + recency bonus
    const now = Date.now();
    const scored = allPosts.map(post => {
      const ageHours = (now - post.createdAt) / 3600000;
      const recencyBonus = Math.max(0, 1 - ageHours / 24); // decai em 24h
      const score = post.likes + post.reposts * 2 + post.karma * 0.1 + recencyBonus * 5;
      return { post, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      posts: scored.slice(offset, offset + limit).map(s => s.post),
      total: allPosts.length,
      lastUpdate: now,
    };
  }

  /**
   * Obtém posts de um autor específico.
   *
   * @param authorPk - Chave pública do autor
   */
  getPostsByAuthor(authorPk: string): SocialPost[] {
    return Array.from(this.posts.values())
      .filter(p => p.authorPk === authorPk)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Obtém reações de um post.
   *
   * @param postId - ID do post
   */
  getReactions(postId: string): SocialReaction[] {
    return this.reactions.get(postId) || [];
  }

  /**
   * Inscreve-se para receber novos posts.
   *
   * @param listener - Callback chamado para cada novo post
   * @returns Função para cancelar a inscrição
   */
  onPost(listener: FeedListener): () => void {
    this.feedListeners.add(listener);
    return () => this.feedListeners.delete(listener);
  }

  /**
   * Inscreve-se para receber reações.
   *
   * @param listener - Callback chamado para cada reação
   * @returns Função para cancelar a inscrição
   */
  onReaction(listener: ReactionListener): () => void {
    this.reactionListeners.add(listener);
    return () => this.reactionListeners.delete(listener);
  }

  /**
   * Cria evento NOSTR para um post.
   *
   * @param post - Post a ser serializado
   */
  createPostEvent(post: SocialPost) {
    return {
      kind: SOCIAL_POST_KIND,
      tags: [
        ['t', 'eternet_social'],
        ...post.tags.map(tag => ['t', tag]),
        ['author_karma', post.karma.toString()],
      ],
      content: JSON.stringify({
        id: post.id,
        content: post.content,
        authorPk: post.authorPk,
        createdAt: post.createdAt,
      }),
      created_at: Math.floor(post.createdAt / 1000),
    };
  }

  /**
   * Cria evento NOSTR para uma reação.
   *
   * @param reaction - Reação a ser serializada
   */
  createReactionEvent(reaction: SocialReaction) {
    return {
      kind: SOCIAL_REACTION_KIND,
      tags: [
        ['t', 'eternet_reaction'],
        ['e', reaction.postId],
        ['p', reaction.authorPk],
        ['reaction', reaction.type],
      ],
      content: reaction.type,
      created_at: Math.floor(reaction.createdAt / 1000),
    };
  }

  /**
   * Retorna o número total de posts.
   */
  getPostCount(): number {
    return this.posts.size;
  }
}

export const socialFabric = SocialFabric.getInstance();
