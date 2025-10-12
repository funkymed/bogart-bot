// Handler pour les recherches web asynchrones
import { Message } from 'discord.js';
import { WebSearchService } from '../ai/mcp/websearch.service';
import { OllamaLLMService } from '../ai/llm/ollama.service';
import { PersonalityEngine } from '../ai/prompts/personality.engine';
import { MemoryManager } from '../core/memory.manager';
import { WebSearchContext } from '../types/mcp.types';

export class WebSearchHandler {
  private searchService: WebSearchService;
  private llmService: OllamaLLMService;
  private personalityEngine: PersonalityEngine;
  private memoryManager: MemoryManager;

  // Stats
  private stats = {
    totalSearches: 0,
    successfulSearches: 0,
    failedSearches: 0
  };

  constructor(
    searchService: WebSearchService,
    llmService: OllamaLLMService,
    personalityEngine: PersonalityEngine,
    memoryManager: MemoryManager
  ) {
    this.searchService = searchService;
    this.llmService = llmService;
    this.personalityEngine = personalityEngine;
    this.memoryManager = memoryManager;

    console.log('[WebSearchHandler] Initialized');
  }

  /**
   * Traite une commande de recherche (asynchrone comme DeepQuestion)
   */
  async handle(context: WebSearchContext): Promise<string> {
    const { message, searchQuery, userId } = context;

    console.log(`[WebSearchHandler] Processing search: "${searchQuery}" from user ${userId}`);
    this.stats.totalSearches++;

    // 1. Réponse immédiate
    const immediateResponse = this.getImmediateResponse();

    // 2. Lancer la recherche en arrière-plan (async, pas de await)
    this.performSearchAsync(message, searchQuery, userId).catch(error => {
      console.error('[WebSearchHandler] Async search failed:', error);
    });

    return immediateResponse;
  }

  /**
   * Effectue la recherche et envoie le résultat (async)
   */
  private async performSearchAsync(
    message: Message,
    query: string,
    userId: string
  ): Promise<void> {
    try {
      // Typing indicator pour montrer que le bot réfléchit
      await message.channel.sendTyping();

      // 1. Rechercher sur le web
      const searchResults = await this.searchService.search(query);

      console.log(`[WebSearchHandler] Search results obtained, generating response...`);

      // 2. Construire le contexte RAG-like avec les résultats web
      const webContext = searchResults.map(result => ({
        content: `${result.title}: ${result.snippet}`,
        category: 'web_search',
        score: 1.0
      }));

      // 3. Construire le message enrichi avec les résultats
      const enrichedMessage = this.buildEnrichedMessage(query, searchResults);

      // 4. Générer réponse via PersonalityEngine (pour cohérence avec le bot)
      // Note: timeout géré par personality.yml (45s pour deep_question)
      const response = await this.personalityEngine.generateResponse({
        message: enrichedMessage,
        ragContext: webContext,
        type: 'deep_question'
      });

      // 4. Ajouter à la mémoire
      this.memoryManager.addConversationTurn(
        userId,
        `bogart recherche ${query}`,
        response
      );

      // 5. Envoyer la réponse finale
      await message.reply(response);

      this.stats.successfulSearches++;
      console.log(`[WebSearchHandler] ✅ Search completed successfully`);

    } catch (error: any) {
      console.error('[WebSearchHandler] ❌ Search failed:', error.message);

      // Envoyer un message d'erreur sympathique
      try {
        await message.reply(this.getErrorFallback());
      } catch (replyError) {
        console.error('[WebSearchHandler] Failed to send error message:', replyError);
      }

      this.stats.failedSearches++;
    }
  }

  /**
   * Messages immédiats aléatoires
   */
  private getImmediateResponse(): string {
    const responses = [
      "🔍 Je cherche ça pour toi, deux secondes...",
      "🔎 Allez hop, je lance une recherche !",
      "🌐 Je fouille le web, attends un peu...",
      "🤖 En cours de scan des internets...",
      "📡 Requête envoyée, j'attends la réponse...",
      "🔭 Je regarde ce que dit le web...",
      "💾 Accès aux tubes d'internet en cours...",
      "⚡ Recherche lancée, ça arrive !",
      "🎯 Je cherche ça dare-dare...",
      "🚀 Lancement de la recherche en cours..."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Construit un message enrichi avec les résultats de recherche
   */
  private buildEnrichedMessage(query: string, results: any[]): string {
    if (results.length === 0) {
      return `${query} (Aucun résultat trouvé sur le web)`;
    }

    // Message court qui sera enrichi par le RAG context
    return `${query} (recherche web avec ${results.length} résultats trouvés)`;
  }

  /**
   * Messages d'erreur sympathiques
   */
  private getErrorFallback(): string {
    const fallbacks = [
      "Argh, ma recherche a planté. Réessaye ou reformule ?",
      "Le web ne répond pas... ou c'est moi qui ai bugé. Retry ?",
      "Échec de la recherche. Mon réseau est parti en copper bar.",
      "404 Search Not Found. Désolé, ça a raté cette fois.",
      "Crash total ! Mon moteur de recherche a freezé. Retente ta chance ?",
      "Erreur fatale : les tubes d'internet sont bouchés. Réessaye ?",
      "J'ai perdu la connexion en cours de route. Relance la recherche ?",
      "Timeout ! Le web met trop de temps à répondre. Retry ?"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Statistiques du handler
   */
  getStats(): {
    totalSearches: number;
    successfulSearches: number;
    failedSearches: number;
    successRate: number;
  } {
    const successRate = this.stats.totalSearches > 0
      ? (this.stats.successfulSearches / this.stats.totalSearches) * 100
      : 0;

    return {
      totalSearches: this.stats.totalSearches,
      successfulSearches: this.stats.successfulSearches,
      failedSearches: this.stats.failedSearches,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}
