// Personality Engine pour Bogart Bot
import { OllamaLLMService } from '../llm/ollama.service';
import { RAGService } from '../rag/rag.service';
import {
  PromptInput,
  ConversationTurn,
  RAGDocument,
  UserContext,
  GenerateOptions
} from '../../types';
import { getDictionnary } from '../../utils';

interface PersonalityConfig {
  system_prompt: string;
  small_talk_prompt: string;
  detailed_instructions: string;
  temperature: {
    small_talk: number;
    deep_question: number;
    spontaneous: number;
  };
  max_tokens: {
    small_talk: number;
    deep_question: number;
    spontaneous: number;
  };
  timeout: {
    small_talk: number;
    deep_question: number;
    spontaneous: number;
  };
  mood_keywords: {
    positive: string[];
    negative: string[];
  };
  reaction_thresholds: {
    high_relevance: number;
    low_relevance: number;
  };
}

export class PersonalityEngine {
  private llmService: OllamaLLMService;
  private ragService: RAGService;
  private config: PersonalityConfig;

  constructor(llmService: OllamaLLMService, ragService: RAGService) {
    this.llmService = llmService;
    this.ragService = ragService;

    // Load personality config from YAML
    const config = getDictionnary('personality');

    if (!config || !config.system_prompt) {
      throw new Error(
        '[PersonalityEngine] FATAL: personality.yml not found or invalid.\n' +
        'Make sure src/assets/texts/personality.yml exists and is properly copied to dist/.\n' +
        'Run: yarn build'
      );
    }

    this.config = config as PersonalityConfig;

    console.log('[PersonalityEngine] Initialized with configurable personality');
  }

  /**
   * Construit le prompt complet avec personnalité + contexte
   */
  private buildPrompt(input: PromptInput): string {
    const parts: string[] = [];

    // Pour small talk, prompt ultra-court
    if (input.type === 'small_talk') {
      parts.push(this.config.small_talk_prompt);
      parts.push(`Réponds en 1-2 phrases courtes à: ${input.message}`);
      return parts.join('\n');
    }

    // Pour deep questions, prompt complet
    parts.push(this.config.system_prompt);

    // Ajouter le contexte RAG (connaissances PRIORITAIRES)
    if (input.ragContext && input.ragContext.length > 0) {
      parts.push('\n**CONNAISSANCES IMPORTANTES (utilise-les en priorité):**');
      input.ragContext.slice(0, 5).forEach((doc, index) => {
        parts.push(`${index + 1}. ${doc.content}`);
      });
    }

    // Ajouter l'historique de conversation (limité) - désactivé pour deep questions pour réduire le prompt
    if (input.type === 'small_talk' && input.history && input.history.length > 0) {
      parts.push('\n**Historique récent:**');
      input.history.slice(-2).forEach(turn => {
        parts.push(`User: ${turn.user}`);
        parts.push(`Bogart: ${turn.assistant}`);
      });
    }

    // Ajouter le message utilisateur
    parts.push(`\n**Question:** ${input.message}`);
    parts.push(`\n**Instructions:** ${this.config.detailed_instructions}`);
    parts.push('\n**Ta réponse:**');

    return parts.join('\n');
  }

  /**
   * Génère une réponse avec personnalité demoscene
   */
  async generateResponse(input: PromptInput, options: GenerateOptions = {}): Promise<string> {
    console.log(`[PersonalityEngine] Generating ${input.type} response...`);

    // Récupérer le contexte RAG si pas déjà fourni
    let ragContext = input.ragContext;
    if (!ragContext || ragContext.length === 0) {
      ragContext = await this.ragService.retrieve(input.message, { topK: 3 });
    }

    // Construire le prompt complet
    const fullPrompt = this.buildPrompt({
      ...input,
      ragContext
    });

    console.log(`[PersonalityEngine] Prompt length: ${fullPrompt.length} chars`);

    // Adapter les options selon le type de réponse (llama3.2:1b - rapide)
    const llmOptions: GenerateOptions = {
      temperature: input.type === 'small_talk' ? this.config.temperature.small_talk : this.config.temperature.deep_question,
      maxTokens: input.type === 'small_talk' ? this.config.max_tokens.small_talk : this.config.max_tokens.deep_question,
      timeout: options.timeout || (input.type === 'small_talk' ? this.config.timeout.small_talk : this.config.timeout.deep_question),
      ...options
    };

    try {
      const response = await this.llmService.generate(fullPrompt, llmOptions);

      console.log(`[PersonalityEngine] Response generated (${response.length} chars)`);
      return response;

    } catch (error) {
      console.error('[PersonalityEngine] Generation failed:', error);

      // Fallback sur une réponse RAG pure
      if (ragContext && ragContext.length > 0) {
        console.log('[PersonalityEngine] Using RAG fallback');
        return ragContext[0].content;
      }

      throw error;
    }
  }

  /**
   * Génère une réponse courte pour small talk
   */
  async generateSmallTalk(
    message: string,
    history?: ConversationTurn[],
    userContext?: UserContext
  ): Promise<string> {
    return this.generateResponse({
      message,
      history: history?.slice(-3), // Seulement les 3 derniers tours
      userContext,
      type: 'small_talk'
    });
  }

  /**
   * Génère une réponse détaillée pour question complexe
   */
  async generateDeepResponse(
    message: string,
    history?: ConversationTurn[],
    userContext?: UserContext,
    ragContext?: RAGDocument[]
  ): Promise<string> {
    return this.generateResponse({
      message,
      history: history?.slice(-5), // Les 5 derniers tours
      ragContext,
      userContext,
      type: 'deep_question'
    });
  }

  /**
   * Génère une réponse spontanée à partir d'un contexte RAG
   */
  async generateSpontaneousReaction(
    trigger: string,
    ragContext: RAGDocument[]
  ): Promise<string> {
    if (ragContext.length === 0) {
      throw new Error('No RAG context provided for spontaneous reaction');
    }

    // Pour une réaction spontanée, on privilégie le contexte RAG
    const prompt = `${this.config.system_prompt}

**Situation:** Tu as détecté le mot-clé "${trigger}" dans une conversation.

**Exemples de réactions appropriées:**
${ragContext.map((doc, i) => `${i + 1}. "${doc.content}"`).join('\n')}

**Ta réaction spontanée (1 phrase courte et naturelle):**`;

    try {
      const response = await this.llmService.generate(prompt, {
        temperature: this.config.temperature.spontaneous,
        maxTokens: this.config.max_tokens.spontaneous,
        timeout: this.config.timeout.spontaneous
      });

      return response;

    } catch (error) {
      console.error('[PersonalityEngine] Spontaneous reaction failed:', error);
      // Fallback direct sur le RAG
      return ragContext[0].content;
    }
  }

  /**
   * Évalue si une réponse spontanée est appropriée
   */
  async shouldReactSpontaneously(message: string, relevanceScore: number): Promise<boolean> {
    // Seuils de décision depuis la config
    const HIGH_RELEVANCE_THRESHOLD = this.config.reaction_thresholds.high_relevance;
    const LOW_RELEVANCE_THRESHOLD = this.config.reaction_thresholds.low_relevance;

    if (relevanceScore >= HIGH_RELEVANCE_THRESHOLD) {
      return true; // Toujours réagir
    }

    if (relevanceScore < LOW_RELEVANCE_THRESHOLD) {
      return false; // Jamais réagir
    }

    // Zone d'incertitude : décision aléatoire pondérée
    const probability = (relevanceScore - LOW_RELEVANCE_THRESHOLD) /
                       (HIGH_RELEVANCE_THRESHOLD - LOW_RELEVANCE_THRESHOLD);

    return Math.random() < probability;
  }

  /**
   * Détecte l'humeur du message utilisateur (simple heuristique)
   */
  detectMood(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Mots depuis la config
    const positiveWords = this.config.mood_keywords.positive;
    const negativeWords = this.config.mood_keywords.negative;

    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Récupère le service LLM (pour accès externe)
   */
  getLLMService(): OllamaLLMService {
    return this.llmService;
  }

  /**
   * Récupère le service RAG (pour accès externe)
   */
  getRAGService(): RAGService {
    return this.ragService;
  }

  /**
   * Récupère la configuration de personnalité
   */
  getConfig(): PersonalityConfig {
    return this.config;
  }
}
