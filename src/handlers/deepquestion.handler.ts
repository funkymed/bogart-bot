// DeepQuestion Handler pour Bogart Bot
// Gère les questions complexes et détaillées

import { Message } from 'discord.js';
import { PersonalityEngine } from '../ai/prompts/personality.engine';
import { RAGService } from '../ai/rag/rag.service';
import { MemoryManager } from '../core/memory.manager';
import { MessageAnalyzer } from './message-analyzer';
import { ThemeDetectorService } from '../ai/theme/theme-detector.service';
import { HandlerContext, RAGDocument } from '../types';

export class DeepQuestionHandler {
  private personalityEngine: PersonalityEngine;
  private ragService: RAGService;
  private memoryManager: MemoryManager;
  private messageAnalyzer: MessageAnalyzer;
  private themeDetector: ThemeDetectorService;

  constructor(
    personalityEngine: PersonalityEngine,
    ragService: RAGService,
    memoryManager: MemoryManager,
    messageAnalyzer: MessageAnalyzer,
    themeDetector: ThemeDetectorService
  ) {
    this.personalityEngine = personalityEngine;
    this.ragService = ragService;
    this.memoryManager = memoryManager;
    this.messageAnalyzer = messageAnalyzer;
    this.themeDetector = themeDetector;
    console.log('[DeepQuestionHandler] Initialized');
  }

  /**
   * Traite une question complexe avec accusé de réception immédiat
   */
  async handle(context: HandlerContext): Promise<string> {
    const { message, userId, content } = context;

    console.log(`[DeepQuestionHandler] Processing deep question for user ${userId}`);

    // Nettoyer le message (retirer les mentions)
    const cleanContent = this.messageAnalyzer.extractQuestion(content);

    // 1. ACCUSÉ DE RÉCEPTION IMMÉDIAT (pur jargon demoscene/BBS)
    const ackMessages = [
      "💾 Decrunching en cours...",
      "⚙️ Laisse-moi décompiler ça...",
      "⏳ Please wait, loading...",
      "📦 LHA decompression...",
      "📡 BBS connexion établie, patiente...",
      "🔌 Je lance mon 56k, ça va être long...",
      "🎨 Rendering des pixels, hold on...",
      "💿 Lecture du disquette en cours...",
      "🖥️ Kickstart 3.1 loading...",
      "⚡ Copper list en préparation...",
      "🧠 Calcul du raymarching...",
      "📼 Rewinding de la K7, patience...",
      "🎵 MOD player initializing...",
      "💥 Depacking avec PowerPacker...",
      "🔧 Assemblage du code 68000...",
    ];
    const ackMessage = ackMessages[Math.floor(Math.random() * ackMessages.length)];

    // Envoyer l'accusé de réception et garder la référence
    const ackMsg = await message.reply(ackMessage);

    try {
      // 2. TRAITEMENT EN ARRIÈRE-PLAN

      // Récupérer la mémoire utilisateur
      const history = this.memoryManager.getShortTermHistory(userId, 5);
      const userContext = this.memoryManager.getUserContext(userId);

      // Détecter l'humeur et le topic
      const mood = this.messageAnalyzer.detectEmotion(content);
      const topic = this.extractMainTopic(cleanContent);

      // Mettre à jour le contexte utilisateur
      this.memoryManager.updateUserContext(userId, { mood, topic });

      // Détecter le thème de la question
      console.log(`[DeepQuestionHandler] Detecting theme for: "${cleanContent.substring(0, 50)}..."`);
      const themeResult = await this.themeDetector.detectTheme(cleanContent);
      console.log(`[DeepQuestionHandler] Detected theme: "${themeResult.theme}" (confidence: ${themeResult.confidence.toFixed(2)})`);
      console.log(`[DeepQuestionHandler] Will query categories: [${themeResult.categories.join(', ')}]`);

      // Récupérer le contexte RAG pertinent (filtré par thème)
      let ragContext: RAGDocument[] = [];
      try {
        ragContext = await this.ragService.retrieveByCategories(
          cleanContent,
          themeResult.categories,
          { topK: 5 }
        );
        console.log(`[DeepQuestionHandler] Retrieved ${ragContext.length} RAG documents`);
        ragContext.forEach((doc, i) => {
          console.log(`  [${i+1}] [${doc.category}] (score: ${doc.score?.toFixed(2)}) ${doc.content.substring(0, 60)}...`);
        });
      } catch (error) {
        console.error('[DeepQuestionHandler] RAG retrieval failed:', error);
      }

      // Générer la réponse avec le PersonalityEngine
      const response = await this.personalityEngine.generateDeepResponse(
        cleanContent,
        history,
        userContext,
        ragContext
      );

      // Ajouter à la mémoire
      this.memoryManager.addConversationTurn(userId, cleanContent, response);

      console.log(`[DeepQuestionHandler] Generated response (${response.length} chars)`);

      // 3. ÉDITER LE MESSAGE AVEC LA VRAIE RÉPONSE
      await ackMsg.edit(response);

      // Retourner null car on a déjà répondu via edit
      return '';

    } catch (error) {
      console.error('[DeepQuestionHandler] Generation failed:', error);

      // Fallback : éditer avec une réponse par défaut
      const fallback = this.getFallbackResponse(ragContext);
      await ackMsg.edit(fallback);

      return '';
    }
  }

  /**
   * Extrait le topic principal d'une question
   */
  private extractMainTopic(content: string): string {
    // Simple extraction basée sur les mots les plus longs
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(word => word.length > 4);

    if (words.length === 0) {
      return 'général';
    }

    // Compter les occurrences
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Prendre le mot le plus fréquent
    const sortedWords = Object.entries(wordCount).sort(([, a], [, b]) => b - a);
    return sortedWords[0][0];
  }

  /**
   * Réponse de fallback basée sur le RAG ou générique
   */
  private getFallbackResponse(ragContext: RAGDocument[]): string {
    // Si on a du contexte RAG pertinent (score > 0.6), l'utiliser
    if (ragContext.length > 0 && ragContext[0].score && ragContext[0].score > 0.6) {
      // Prendre les 3-4 premiers documents et les combiner avec du style
      const facts = ragContext.slice(0, 4).map(doc => doc.content);

      const intros = [
        "Alors écoute bien :",
        "OK, check ça :",
        "Voilà le topo :",
        "Laisse-moi t'expliquer :",
        "Bon, en gros :"
      ];

      const intro = intros[Math.floor(Math.random() * intros.length)];
      const factsList = facts.map(f => `• ${f}`).join('\n');

      const outros = [
        "\n\nEt ouais, c'était comme ça à l'époque.",
        "\n\nVoilà, tu sais tout maintenant.",
        "\n\nC'est ça les vraies machines de légende.",
        "\n\nPas mal non ?",
        "\n\nDu pur vintage."
      ];

      const outro = outros[Math.floor(Math.random() * outros.length)];

      return `${intro}\n\n${factsList}${outro}`;
    }

    // Réponses honnêtes quand le bot ne sait pas (au lieu d'halluciner)
    const fallbacks = [
      "Là je dois avouer que je sèche un peu. J'ai pas assez d'infos sur le sujet dans ma base de connaissances.",
      "Bonne question mais je manque de contexte pour te répondre correctement. Ajoute des infos dans mon lexique si tu veux que je sois plus précis !",
      "Hum, mon RAG trouve rien de pertinent là-dessus. Faudrait enrichir ma base de données demoscene pour ce sujet.",
      "Désolé chef, ça dépasse mes capacités actuelles. Je suis limité à ce qu'on m'a appris sur la demoscene.",
      "Mon LLM a freeze sur cette question. Tu devrais peut-être checker sur pouet.net ou demander aux vieux sceners !"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Vérifie si le handler peut traiter ce message
   */
  canHandle(context: HandlerContext): boolean {
    // Le DeepQuestionHandler gère les questions complexes
    const complexity = this.messageAnalyzer.calculateComplexity(context.content);
    return complexity >= 0.6; // Seuil de complexité
  }

  /**
   * Évalue la qualité de la réponse générée (simple heuristique)
   */
  evaluateResponseQuality(response: string, ragContext: RAGDocument[]): number {
    let score = 0.5; // Score de base

    // Longueur appropriée (100-500 caractères)
    if (response.length >= 100 && response.length <= 500) {
      score += 0.2;
    } else if (response.length < 50) {
      score -= 0.2; // Trop court
    }

    // Présence de RAG context utilisé
    if (ragContext.length > 0) {
      // Vérifier si des éléments du RAG sont dans la réponse
      const ragUsed = ragContext.some(doc =>
        response.toLowerCase().includes(doc.content.toLowerCase().slice(0, 20))
      );
      if (ragUsed) score += 0.2;
    }

    // Présence de ponctuation (signe de structure)
    const punctuationCount = (response.match(/[.!?,;]/g) || []).length;
    if (punctuationCount >= 2) score += 0.1;

    return Math.min(Math.max(score, 0), 1); // Clamp entre 0 et 1
  }

  /**
   * Détecte si la question contient des éléments techniques
   */
  isTechnicalQuestion(content: string): boolean {
    const technicalKeywords = [
      'code', 'algorithm', 'optimize', 'function', 'variable',
      'class', 'method', 'api', 'library', 'framework',
      'demo', 'shader', 'pixel', 'assembly', 'cpu', 'gpu',
      'memory', 'performance', 'render', 'compile'
    ];

    const lowerContent = content.toLowerCase();
    return technicalKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Enrichit la réponse avec des exemples si c'est une question technique
   */
  private enrichWithExamples(response: string, isTechnical: boolean): string {
    if (!isTechnical) {
      return response;
    }

    // Ajouter une suggestion de ressource
    const resources = [
      "\n\nSi tu veux creuser, je te conseille de checker pouet.net.",
      "\n\nPour aller plus loin, regarde les sources de vieilles demos sur GitHub.",
      "\n\nY'a des bons tutorials sur les sites de demomaking old school.",
      "\n\nLes demoparties comme Revision ont souvent des workshops là-dessus."
    ];

    // 30% de chance d'ajouter une ressource
    if (Math.random() < 0.3) {
      return response + resources[Math.floor(Math.random() * resources.length)];
    }

    return response;
  }

  /**
   * Statistiques du handler
   */
  getStats(): {
    totalQuestions: number;
    avgComplexity: number;
    technicalQuestionsRatio: number;
  } {
    // Pour l'instant, stats simplifiées
    const memoryStats = this.memoryManager.getStats();

    return {
      totalQuestions: memoryStats.totalShortTermTurns,
      avgComplexity: 0, // À implémenter avec un système de tracking
      technicalQuestionsRatio: 0
    };
  }
}
