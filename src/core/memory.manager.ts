// Memory Manager pour Bogart Bot
import { getStorage, setStorage } from '../utils';
import {
  UserMemory,
  ConversationTurn,
  ConversationSummary,
  UserContext,
  UserPreferences
} from '../types';

export class MemoryManager {
  private readonly storageKey = 'user_memories';
  private readonly maxShortTermTurns = 10;
  private readonly maxLongTermSummaries = 5;
  private cache: Map<string, UserMemory> = new Map();

  constructor() {
    console.log('[MemoryManager] Initialized');
    this.loadFromStorage();
  }

  /**
   * Charge les mémoires depuis le stockage persistant
   */
  private loadFromStorage(): void {
    try {
      const storage = getStorage(this.storageKey);
      if (storage && typeof storage === 'object') {
        Object.entries(storage).forEach(([userId, memory]) => {
          this.cache.set(userId, memory as UserMemory);
        });
        console.log(`[MemoryManager] Loaded ${this.cache.size} user memories`);
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load from storage:', error);
    }
  }

  /**
   * Sauvegarde les mémoires dans le stockage persistant
   */
  private saveToStorage(): void {
    try {
      const memoryObject: Record<string, UserMemory> = {};
      this.cache.forEach((memory, userId) => {
        memoryObject[userId] = memory;
      });
      setStorage(this.storageKey, memoryObject);
    } catch (error) {
      console.error('[MemoryManager] Failed to save to storage:', error);
    }
  }

  /**
   * Récupère ou crée la mémoire d'un utilisateur
   */
  getUserMemory(userId: string): UserMemory {
    if (!this.cache.has(userId)) {
      const newMemory: UserMemory = {
        userId,
        shortTerm: [],
        longTerm: [],
        context: {
          context: 'default',
          mood: 'neutral',
          topic: undefined
        },
        preferences: {}
      };
      this.cache.set(userId, newMemory);
    }

    return this.cache.get(userId)!;
  }

  /**
   * Ajoute un tour de conversation en mémoire court terme
   */
  addConversationTurn(userId: string, userMessage: string, assistantResponse: string): void {
    const memory = this.getUserMemory(userId);

    const turn: ConversationTurn = {
      user: userMessage,
      assistant: assistantResponse,
      timestamp: Date.now()
    };

    memory.shortTerm.push(turn);

    // Limite la mémoire court terme
    if (memory.shortTerm.length > this.maxShortTermTurns) {
      // Avant de supprimer, créer un résumé pour la mémoire long terme
      this.summarizeToLongTerm(userId);
    }

    this.saveToStorage();
    console.log(`[MemoryManager] Added turn for user ${userId} (${memory.shortTerm.length} turns)`);
  }

  /**
   * Résume la mémoire court terme en mémoire long terme
   */
  private summarizeToLongTerm(userId: string): void {
    const memory = this.getUserMemory(userId);

    if (memory.shortTerm.length === 0) {
      return;
    }

    // Prendre les 5 premiers tours (les plus anciens)
    const turnsToSummarize = memory.shortTerm.splice(0, 5);

    // Créer un résumé simple (concaténation des messages)
    // Dans une future version, on pourrait utiliser le LLM pour générer un vrai résumé
    const summaryText = turnsToSummarize
      .map(turn => `User: ${turn.user}\nBot: ${turn.assistant}`)
      .join('\n---\n');

    const summary: ConversationSummary = {
      summary: summaryText,
      turnCount: turnsToSummarize.length,
      startTime: turnsToSummarize[0].timestamp,
      endTime: turnsToSummarize[turnsToSummarize.length - 1].timestamp
    };

    memory.longTerm.push(summary);

    // Limite la mémoire long terme
    if (memory.longTerm.length > this.maxLongTermSummaries) {
      memory.longTerm.shift(); // Supprime le plus ancien
    }

    console.log(`[MemoryManager] Summarized ${turnsToSummarize.length} turns to long-term for user ${userId}`);
  }

  /**
   * Met à jour le contexte utilisateur
   */
  updateUserContext(userId: string, context: Partial<UserContext>): void {
    const memory = this.getUserMemory(userId);
    memory.context = { ...memory.context, ...context };
    this.saveToStorage();
  }

  /**
   * Met à jour les préférences utilisateur
   */
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    const memory = this.getUserMemory(userId);
    memory.preferences = { ...memory.preferences, ...preferences };
    this.saveToStorage();
  }

  /**
   * Récupère l'historique court terme formaté pour le prompt
   */
  getShortTermHistory(userId: string, limit?: number): ConversationTurn[] {
    const memory = this.getUserMemory(userId);
    const history = memory.shortTerm;

    if (limit && limit < history.length) {
      return history.slice(-limit); // Retourne les N derniers
    }

    return history;
  }

  /**
   * Récupère le contexte utilisateur
   */
  getUserContext(userId: string): UserContext {
    const memory = this.getUserMemory(userId);
    return memory.context;
  }

  /**
   * Récupère les préférences utilisateur
   */
  getUserPreferences(userId: string): UserPreferences {
    const memory = this.getUserMemory(userId);
    return memory.preferences;
  }

  /**
   * Détecte le topic de conversation à partir de l'historique
   */
  detectTopic(userId: string): string | undefined {
    const memory = this.getUserMemory(userId);

    if (memory.shortTerm.length === 0) {
      return undefined;
    }

    // Analyse simple : mots les plus fréquents dans les derniers messages
    const recentMessages = memory.shortTerm.slice(-3);
    const words = recentMessages
      .flatMap(turn => turn.user.toLowerCase().split(/\s+/))
      .filter(word => word.length > 4); // Mots de plus de 4 lettres

    if (words.length === 0) {
      return undefined;
    }

    // Compter les occurrences
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Trouver le mot le plus fréquent
    const sortedWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a);

    return sortedWords[0]?.[0];
  }

  /**
   * Réinitialise la mémoire d'un utilisateur
   */
  clearUserMemory(userId: string): void {
    this.cache.delete(userId);
    this.saveToStorage();
    console.log(`[MemoryManager] Cleared memory for user ${userId}`);
  }

  /**
   * Réinitialise toutes les mémoires
   */
  clearAllMemories(): void {
    this.cache.clear();
    this.saveToStorage();
    console.log('[MemoryManager] Cleared all memories');
  }

  /**
   * Récupère les statistiques de mémoire
   */
  getStats(): { totalUsers: number; totalShortTermTurns: number; totalLongTermSummaries: number } {
    let totalShortTermTurns = 0;
    let totalLongTermSummaries = 0;

    this.cache.forEach(memory => {
      totalShortTermTurns += memory.shortTerm.length;
      totalLongTermSummaries += memory.longTerm.length;
    });

    return {
      totalUsers: this.cache.size,
      totalShortTermTurns,
      totalLongTermSummaries
    };
  }

  /**
   * Exporte les mémoires pour backup
   */
  exportMemories(): Record<string, UserMemory> {
    const exported: Record<string, UserMemory> = {};
    this.cache.forEach((memory, userId) => {
      exported[userId] = memory;
    });
    return exported;
  }

  /**
   * Importe des mémoires depuis un backup
   */
  importMemories(memories: Record<string, UserMemory>): void {
    Object.entries(memories).forEach(([userId, memory]) => {
      this.cache.set(userId, memory);
    });
    this.saveToStorage();
    console.log(`[MemoryManager] Imported ${Object.keys(memories).length} user memories`);
  }
}
