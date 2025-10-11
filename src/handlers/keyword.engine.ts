// Keyword Engine pour Bogart Bot
// Détecte les mots-clés et décide des réactions spontanées

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { KeywordConfig } from '../types';
import { getStaticPath, getRandom } from '../utils';
import { RAGService } from '../ai/rag/rag.service';
import { OllamaLLMService } from '../ai/llm/ollama.service';

interface KeywordMatch {
  category: string;
  keyword: string;
  config: KeywordConfig;
}

export class KeywordEngine {
  private keywords: Map<string, KeywordConfig> = new Map();
  private ragService: RAGService | null = null;
  private llmService: OllamaLLMService | null = null;

  constructor() {
    this.loadKeywords();
    console.log(`[KeywordEngine] Initialized with ${this.keywords.size} keyword categories`);
  }

  /**
   * Charge la configuration des mots-clés depuis le fichier YAML
   */
  private loadKeywords(): void {
    try {
      const keywordsPath = path.join(getStaticPath(), 'texts', 'keywords.yml');

      if (!fs.existsSync(keywordsPath)) {
        console.warn(`[KeywordEngine] Keywords file not found: ${keywordsPath}`);
        return;
      }

      const fileContents = fs.readFileSync(keywordsPath, 'utf8');
      const data = yaml.load(fileContents) as Record<string, any>;

      Object.entries(data).forEach(([category, config]) => {
        this.keywords.set(category, {
          keywords: config.keywords || [],
          responses: config.responses || [],
          useFixed: !config.useRAG // Si pas de RAG, on utilise les réponses fixes
        });
      });

      console.log(`[KeywordEngine] Loaded ${this.keywords.size} keyword categories`);

    } catch (error) {
      console.error('[KeywordEngine] Failed to load keywords:', error);
    }
  }

  /**
   * Attache le service RAG pour les réponses personnalisées
   */
  attachRAGService(ragService: RAGService): void {
    this.ragService = ragService;
    console.log('[KeywordEngine] RAG service attached');
  }

  /**
   * Attache le service LLM pour reformuler les réponses
   */
  attachLLMService(llmService: OllamaLLMService): void {
    this.llmService = llmService;
    console.log('[KeywordEngine] LLM service attached');
  }

  /**
   * Détecte les mots-clés dans un message
   */
  detectKeywords(message: string): KeywordMatch[] {
    const lowerMessage = message.toLowerCase();
    const matches: KeywordMatch[] = [];

    this.keywords.forEach((config, category) => {
      const matchedKeyword = config.keywords.find(keyword => {
        // S'assurer que keyword est une string
        const keywordStr = String(keyword);
        return lowerMessage.includes(keywordStr.toLowerCase());
      });

      if (matchedKeyword) {
        matches.push({
          category,
          keyword: String(matchedKeyword),
          config
        });
      }
    });

    return matches;
  }

  /**
   * Décide si le bot doit réagir spontanément
   */
  async shouldReact(message: string): Promise<{
    shouldReact: boolean;
    match?: KeywordMatch;
    relevanceScore?: number;
  }> {
    const matches = this.detectKeywords(message);

    if (matches.length === 0) {
      return { shouldReact: false };
    }

    // Prendre le premier match (on pourrait améliorer avec un système de priorité)
    const match = matches[0];

    // Si pas de RAG, on réagit selon une probabilité fixe
    if (!this.ragService || match.config.useFixed) {
      const shouldReact = Math.random() > 0.3; // 70% de chance
      return { shouldReact, match };
    }

    // Avec RAG, on calcule la pertinence
    const relevanceScore = await this.ragService.getRelevanceScore(message);

    // Seuil de pertinence par défaut : 0.65
    const threshold = 0.65;
    const shouldReact = relevanceScore >= threshold;

    console.log(`[KeywordEngine] Keyword "${match.keyword}" detected. Relevance: ${relevanceScore.toFixed(2)}, Threshold: ${threshold}`);

    return {
      shouldReact,
      match,
      relevanceScore
    };
  }

  /**
   * Génère une réponse pour un mot-clé détecté
   */
  async generateResponse(match: KeywordMatch, originalMessage: string): Promise<string> {
    // Choisir une réponse de base (fixe ou RAG)
    let baseResponse: string;

    if (match.config.useFixed || !this.ragService) {
      baseResponse = getRandom(match.config.responses) as string;
      console.log(`[KeywordEngine] Base response from keywords.yml for "${match.keyword}"`);
    } else {
      // Récupérer du contexte RAG
      try {
        const ragDocs = await this.ragService.retrieve(match.keyword, { topK: 3 });

        if (ragDocs.length > 0 && Math.random() > 0.3) {
          const randomDoc = getRandom(ragDocs) as any;
          baseResponse = randomDoc.content;
          console.log(`[KeywordEngine] Base response from RAG for "${match.keyword}"`);
        } else {
          baseResponse = getRandom(match.config.responses) as string;
        }
      } catch (error) {
        console.error('[KeywordEngine] RAG retrieval failed:', error);
        baseResponse = getRandom(match.config.responses) as string;
      }
    }

    // Reformuler avec le LLM en gardant le sens de la phrase de base
    if (this.llmService) {
      try {
        const prompt = `Tu es Bogart, un bot Discord cynique et sarcastique de la scène demoscene.

PHRASE À REFORMULER : ${baseResponse}

Reformule UNIQUEMENT cette phrase avec ton style propre (cynique, demoscene, sarcastique) en 1-2 phrases max. Garde le même sens, juste change les mots. Ne mets JAMAIS de guillemets.`;

        const reformulated = await this.llmService.generate(prompt, {
          temperature: 0.7,
          maxTokens: 50,
          timeout: 8000  // 8s pour 1b
        });

        if (reformulated && reformulated.length > 10) {
          // Nettoyer tous les guillemets
          const cleaned = reformulated.replace(/["']/g, '').trim();
          console.log(`[KeywordEngine] Reformulated: "${baseResponse}" → "${cleaned}"`);
          return cleaned;
        }
      } catch (error) {
        console.log(`[KeywordEngine] LLM failed, using base response`);
      }
    }

    // Fallback : réponse de base sans reformulation
    return baseResponse;
  }

  /**
   * Traite un message et retourne une réponse si pertinent
   */
  async processMessage(message: string): Promise<string | null> {
    const decision = await this.shouldReact(message);

    if (!decision.shouldReact || !decision.match) {
      return null;
    }

    const response = await this.generateResponse(decision.match, message);
    console.log(`[KeywordEngine] Reacting to keyword "${decision.match.keyword}"`);

    return response;
  }

  /**
   * Liste toutes les catégories de mots-clés configurées
   */
  getCategories(): string[] {
    return Array.from(this.keywords.keys());
  }

  /**
   * Récupère la config d'une catégorie
   */
  getCategoryConfig(category: string): KeywordConfig | undefined {
    return this.keywords.get(category);
  }

  /**
   * Statistiques du moteur
   */
  getStats(): {
    totalCategories: number;
    totalKeywords: number;
    totalResponses: number;
  } {
    let totalKeywords = 0;
    let totalResponses = 0;

    this.keywords.forEach(config => {
      totalKeywords += config.keywords.length;
      totalResponses += config.responses.length;
    });

    return {
      totalCategories: this.keywords.size,
      totalKeywords,
      totalResponses
    };
  }

  /**
   * Recharge la configuration
   */
  reload(): void {
    this.keywords.clear();
    this.loadKeywords();
    console.log('[KeywordEngine] Configuration reloaded');
  }

  /**
   * Recherche toutes les occurrences de mots-clés dans un texte
   */
  findAllMatches(message: string): Array<{
    category: string;
    keyword: string;
    position: number;
  }> {
    const lowerMessage = message.toLowerCase();
    const allMatches: Array<{ category: string; keyword: string; position: number }> = [];

    this.keywords.forEach((config, category) => {
      config.keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        let position = lowerMessage.indexOf(lowerKeyword);

        while (position !== -1) {
          allMatches.push({
            category,
            keyword,
            position
          });

          position = lowerMessage.indexOf(lowerKeyword, position + 1);
        }
      });
    });

    return allMatches.sort((a, b) => a.position - b.position);
  }
}
