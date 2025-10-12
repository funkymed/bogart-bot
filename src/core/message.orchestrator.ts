// Message Orchestrator pour Bogart Bot
// Coordonne tous les composants pour traiter les messages

import { Message } from 'discord.js';
import { OllamaLLMService } from '../ai/llm/ollama.service';
import { RAGService } from '../ai/rag/rag.service';
import { PersonalityEngine } from '../ai/prompts/personality.engine';
import { MemoryManager } from './memory.manager';
import { MessageAnalyzer } from '../handlers/message-analyzer';
import { KeywordEngine } from '../handlers/keyword.engine';
import { SmallTalkHandler } from '../handlers/smalltalk.handler';
import { DeepQuestionHandler } from '../handlers/deepquestion.handler';
import { WebSearchHandler } from '../handlers/websearch.handler';
import { WebSearchService } from '../ai/mcp/websearch.service';
import { MessageType, HandlerContext } from '../types';

export class MessageOrchestrator {
  private llmService: OllamaLLMService;
  private ragService: RAGService;
  private webSearchService: WebSearchService;
  private personalityEngine: PersonalityEngine;
  private memoryManager: MemoryManager;
  private messageAnalyzer: MessageAnalyzer;
  private keywordEngine: KeywordEngine;
  private smallTalkHandler: SmallTalkHandler;
  private deepQuestionHandler: DeepQuestionHandler;
  private webSearchHandler: WebSearchHandler;

  private isInitialized = false;

  constructor(
    ollamaUrl: string = process.env.OLLAMA_URL || 'http://localhost:11434',
    chromaUrl: string = process.env.CHROMA_URL || 'http://localhost:8000'
  ) {
    console.log('[MessageOrchestrator] Initializing...');

    // Créer les services de base (3b = meilleur équilibre qualité/vitesse en prod)
    this.llmService = new OllamaLLMService(process.env.OLLAMA_MODEL || 'llama3.2:3b', ollamaUrl);
    this.ragService = new RAGService(chromaUrl, ollamaUrl);
    this.webSearchService = new WebSearchService();

    // Créer les composants core
    this.personalityEngine = new PersonalityEngine(this.llmService, this.ragService);
    this.memoryManager = new MemoryManager();

    // Créer les analyseurs et moteurs
    this.messageAnalyzer = new MessageAnalyzer('bogart');
    this.keywordEngine = new KeywordEngine();
    this.keywordEngine.attachRAGService(this.ragService);
    this.keywordEngine.attachLLMService(this.llmService);

    // Créer les handlers
    this.smallTalkHandler = new SmallTalkHandler(
      this.personalityEngine,
      this.memoryManager,
      this.messageAnalyzer
    );

    this.deepQuestionHandler = new DeepQuestionHandler(
      this.personalityEngine,
      this.ragService,
      this.memoryManager,
      this.messageAnalyzer
    );

    this.webSearchHandler = new WebSearchHandler(
      this.webSearchService,
      this.llmService,
      this.personalityEngine,
      this.memoryManager
    );

    console.log('[MessageOrchestrator] Components created');
  }

  /**
   * Initialise l'orchestrateur (indexation RAG, health checks)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[MessageOrchestrator] Already initialized');
      return;
    }

    console.log('[MessageOrchestrator] Starting initialization...');

    try {
      // 1. Health check Ollama
      console.log('[MessageOrchestrator] Checking Ollama...');
      const ollamaOk = await this.llmService.healthCheck();
      if (!ollamaOk) {
        throw new Error('Ollama is not accessible');
      }
      console.log('[MessageOrchestrator] ✓ Ollama OK');

      // 2. Health check ChromaDB
      console.log('[MessageOrchestrator] Checking ChromaDB...');
      const chromaOk = await this.ragService.healthCheck();
      if (!chromaOk) {
        throw new Error('ChromaDB is not accessible');
      }
      console.log('[MessageOrchestrator] ✓ ChromaDB OK');

      // 3. Initialiser la collection RAG
      console.log('[MessageOrchestrator] Initializing RAG collection...');
      await this.ragService.initialize();

      // 4. Vérifier si le lexique est déjà indexé
      const docCount = await this.ragService.getDocumentCount();
      if (docCount === 0) {
        console.log('[MessageOrchestrator] Indexing demoscene lexicon...');
        await this.ragService.indexLexicon(['demoscene']);
        console.log(`[MessageOrchestrator] ✓ Indexed ${await this.ragService.getDocumentCount()} documents`);
      } else {
        console.log(`[MessageOrchestrator] ✓ Lexicon already indexed (${docCount} documents)`);
      }

      this.isInitialized = true;
      console.log('[MessageOrchestrator] ✅ Initialization complete!');

    } catch (error) {
      console.error('[MessageOrchestrator] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Traite un message Discord
   */
  async processMessage(message: Message): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn('[MessageOrchestrator] Not initialized yet, skipping message');
      return null;
    }

    const content = message.content.trim();
    const userId = message.author.id;

    // Créer le contexte
    const context: HandlerContext = {
      message,
      userId,
      content
    };

    try {
      // 1. Analyser le message
      const analysis = await this.messageAnalyzer.analyze(message);
      console.log(`[MessageOrchestrator] Message type: ${analysis.type} (confidence: ${analysis.confidence.toFixed(2)})`);

      // 2. Router selon le type
      switch (analysis.type) {
        case MessageType.IGNORE:
          return null;

        case MessageType.WEB_SEARCH_COMMAND:
          return await this.webSearchHandler.handle({
            ...context,
            searchQuery: (analysis as any).searchQuery
          });

        case MessageType.DEEP_QUESTION:
          return await this.deepQuestionHandler.handle(context);

        case MessageType.SMALL_TALK:
          return await this.smallTalkHandler.handle(context);

        case MessageType.KEYWORD_TRIGGER:
          return await this.handleKeywordTrigger(context);

        default:
          return null;
      }

    } catch (error) {
      console.error('[MessageOrchestrator] Error processing message:', error);

      // Fallback sur une réponse d'erreur sympathique
      return this.getErrorFallback();
    }
  }

  /**
   * Gère les déclencheurs par mot-clé (réactions spontanées)
   */
  private async handleKeywordTrigger(context: HandlerContext): Promise<string | null> {
    try {
      const response = await this.keywordEngine.processMessage(context.content);

      if (response) {
        // Ajouter à la mémoire
        this.memoryManager.addConversationTurn(context.userId, context.content, response);
        console.log('[MessageOrchestrator] Keyword trigger activated');
      }

      return response;

    } catch (error) {
      console.error('[MessageOrchestrator] Keyword trigger failed:', error);
      return null;
    }
  }

  /**
   * Réponse de fallback en cas d'erreur
   */
  private getErrorFallback(): string {
    const fallbacks = [
      "Oups, j'ai eu un petit freeze... Mon CPU a raté un cycle. Réessaye ?",
      "Bug détecté dans mes circuits. Redémarre-moi la question ?",
      "Hum, là j'ai planté comme un vieux Amiga sans Kickstart. Reformule ?",
      "Erreur 404 : Réponse not found. Mon LLM a besoin d'un reboot.",
      "Crash imminent... Non je déconne, mais j'ai pas compris. Réexplique ?"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Ré-indexe le lexique (utile après mise à jour)
   */
  async reindexLexicon(): Promise<void> {
    console.log('[MessageOrchestrator] Reindexing lexicon...');

    try {
      await this.ragService.clearCollection();
      await this.ragService.indexLexicon(['demoscene']);

      const docCount = await this.ragService.getDocumentCount();
      console.log(`[MessageOrchestrator] ✓ Reindexed ${docCount} documents`);

    } catch (error) {
      console.error('[MessageOrchestrator] Reindexing failed:', error);
      throw error;
    }
  }

  /**
   * Nettoie les mémoires utilisateur (maintenance)
   */
  clearMemories(): void {
    this.memoryManager.clearAllMemories();
    console.log('[MessageOrchestrator] All memories cleared');
  }

  /**
   * Statistiques globales
   */
  getStats(): {
    initialized: boolean;
    ragDocuments: Promise<number>;
    memoryStats: ReturnType<MemoryManager['getStats']>;
    keywordStats: ReturnType<KeywordEngine['getStats']>;
    smallTalkStats: ReturnType<SmallTalkHandler['getStats']>;
    deepQuestionStats: ReturnType<DeepQuestionHandler['getStats']>;
    webSearchStats: ReturnType<WebSearchHandler['getStats']>;
  } {
    return {
      initialized: this.isInitialized,
      ragDocuments: this.ragService.getDocumentCount(),
      memoryStats: this.memoryManager.getStats(),
      keywordStats: this.keywordEngine.getStats(),
      smallTalkStats: this.smallTalkHandler.getStats(),
      deepQuestionStats: this.deepQuestionHandler.getStats(),
      webSearchStats: this.webSearchHandler.getStats()
    };
  }

  /**
   * Health check complet
   */
  async healthCheck(): Promise<{
    ollama: boolean;
    chromadb: boolean;
    initialized: boolean;
  }> {
    return {
      ollama: await this.llmService.healthCheck(),
      chromadb: await this.ragService.healthCheck(),
      initialized: this.isInitialized
    };
  }

  /**
   * Vérifie si l'orchestrateur est prêt
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Exporte la configuration pour debug
   */
  exportConfig(): {
    ollamaModel: string;
    ollamaUrl: string;
    chromaUrl: string;
  } {
    return {
      ollamaModel: this.llmService.getModelName(),
      ollamaUrl: this.llmService.getBaseUrl(),
      chromaUrl: 'http://localhost:8000' // À améliorer
    };
  }
}
