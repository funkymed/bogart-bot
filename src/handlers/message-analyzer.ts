// Message Analyzer pour Bogart Bot
// Détermine le type de message et la stratégie de réponse

import { Message } from 'discord.js';
import { MessageType, AnalysisResult } from '../types';

export class MessageAnalyzer {
  private readonly botName: string;
  private readonly botMentionPattern: RegExp;

  // Seuils de décision
  private readonly DEEP_QUESTION_MIN_WORDS = 8;
  private readonly DEEP_QUESTION_INDICATORS = [
    'comment', 'pourquoi', 'qu\'est-ce', 'quelle', 'quel',
    'expliquer', 'expliquer-moi', 'explique',
    'différence', 'c\'est quoi', 'définition',
    'aide', 'aider', 'comprendre', 'savoir'
  ];

  constructor(botName: string = 'bogart') {
    this.botName = botName.toLowerCase();
    this.botMentionPattern = new RegExp(`\\b${this.botName}\\b`, 'i');
    console.log(`[MessageAnalyzer] Initialized with bot name: ${botName}`);
  }

  /**
   * Analyse un message Discord et retourne le type d'interaction approprié
   */
  async analyze(message: Message): Promise<AnalysisResult> {
    const content = message.content.trim();
    const lowerContent = content.toLowerCase();

    // Ignorer les messages vides
    if (!content) {
      return { type: MessageType.IGNORE, confidence: 1.0 };
    }

    // Ignorer les messages de bots
    if (message.author.bot) {
      return { type: MessageType.IGNORE, confidence: 1.0 };
    }

    // Ignorer les commandes slash
    if (content.startsWith('/')) {
      return { type: MessageType.IGNORE, confidence: 1.0 };
    }

    // 1. Vérifier si le bot est mentionné (@Bogart ou mot "bogart")
    const isMentioned = message.mentions.users.has(message.client.user?.id || '') ||
                       this.botMentionPattern.test(content);

    // 2. Vérifier si c'est une question profonde
    if (isMentioned && this.isDeepQuestion(content)) {
      return {
        type: MessageType.DEEP_QUESTION,
        confidence: 0.9
      };
    }

    // 3. Vérifier si c'est du small talk avec mention directe
    if (isMentioned) {
      return {
        type: MessageType.SMALL_TALK,
        confidence: 0.85
      };
    }

    // 4. Sinon, marquer comme potentiel keyword trigger
    // Le KeywordEngine décidera s'il faut réagir
    return {
      type: MessageType.KEYWORD_TRIGGER,
      confidence: 0.5
    };
  }

  /**
   * Détermine si un message est une question profonde/complexe
   */
  private isDeepQuestion(content: string): boolean {
    const lowerContent = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    // Critère 2 : Présence d'un indicateur de question profonde
    const hasDeepIndicator = this.DEEP_QUESTION_INDICATORS.some(
      indicator => lowerContent.includes(indicator)
    );

    // Critère 3 : Présence d'un point d'interrogation
    const hasQuestionMark = content.includes('?');

    // Question courte avec indicateur fort (ex: "c'est quoi un pixel?")
    if (hasDeepIndicator && hasQuestionMark && wordCount >= 3) {
      return true;
    }

    // Critère 1 : Questions longues (>= 8 mots)
    if (wordCount < this.DEEP_QUESTION_MIN_WORDS) {
      return false;
    }

    // Question profonde = (long message + indicateur) OU (long message + ?)
    return (wordCount >= this.DEEP_QUESTION_MIN_WORDS && hasDeepIndicator) ||
           (wordCount >= this.DEEP_QUESTION_MIN_WORDS && hasQuestionMark);
  }

  /**
   * Extrait la question en retirant la mention du bot
   */
  extractQuestion(content: string): string {
    return content
      .replace(this.botMentionPattern, '')
      .replace(/<@!?\d+>/g, '') // Retire les mentions Discord
      .trim();
  }

  /**
   * Calcule un score de complexité du message (0-1)
   */
  calculateComplexity(content: string): number {
    const wordCount = content.split(/\s+/).length;
    const hasQuestion = content.includes('?');
    const hasDeepIndicator = this.DEEP_QUESTION_INDICATORS.some(
      indicator => content.toLowerCase().includes(indicator)
    );

    let score = 0;

    // Longueur (max 0.4)
    score += Math.min(wordCount / 20, 0.4);

    // Question mark (0.3)
    if (hasQuestion) score += 0.3;

    // Indicateur profond (0.3)
    if (hasDeepIndicator) score += 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Détermine si le message est conversationnel (pas une commande)
   */
  isConversational(content: string): boolean {
    // Pas une URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return false;
    }

    // Pas juste des emojis ou symboles
    const textOnly = content.replace(/[^\w\s]/gi, '').trim();
    if (textOnly.length === 0) {
      return false;
    }

    // Au moins 2 mots
    const wordCount = textOnly.split(/\s+/).length;
    return wordCount >= 2;
  }

  /**
   * Vérifie si le message contient un salut
   */
  isGreeting(content: string): boolean {
    const greetings = [
      'bonjour', 'salut', 'hello', 'hi', 'hey', 'yo',
      'coucou', 'slt', 'bjr', 'cc', 'wesh'
    ];

    const lowerContent = content.toLowerCase();
    return greetings.some(greeting => {
      const regex = new RegExp(`\\b${greeting}\\b`, 'i');
      return regex.test(lowerContent);
    });
  }

  /**
   * Vérifie si le message contient un au revoir
   */
  isGoodbye(content: string): boolean {
    const goodbyes = [
      'au revoir', 'aurevoir', 'bye', 'tchao', 'ciao',
      'à plus', 'a plus', 'à+', 'a+', 'salut'
    ];

    const lowerContent = content.toLowerCase();
    return goodbyes.some(goodbye => {
      const regex = new RegExp(`\\b${goodbye}\\b`, 'i');
      return regex.test(lowerContent);
    });
  }

  /**
   * Vérifie si le message contient un remerciement
   */
  isThanks(content: string): boolean {
    const thanks = [
      'merci', 'thank', 'thx', 'ty', 'thanks',
      'cool', 'super', 'top', 'génial'
    ];

    const lowerContent = content.toLowerCase();
    return thanks.some(thank => {
      const regex = new RegExp(`\\b${thank}\\b`, 'i');
      return regex.test(lowerContent);
    });
  }

  /**
   * Analyse rapide pour déterminer le contexte émotionnel
   */
  detectEmotion(content: string): 'positive' | 'negative' | 'neutral' {
    const lowerContent = content.toLowerCase();

    const positiveWords = [
      'super', 'cool', 'génial', 'top', 'merci', 'excellent',
      'parfait', 'bravo', 'bien', 'content', 'heureux'
    ];

    const negativeWords = [
      'nul', 'merde', 'chiant', 'problème', 'bug', 'erreur',
      'pas', 'aucun', 'jamais', 'mal', 'mauvais', 'pire'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeCount++;
    });

    // Ajouter les emojis
    if (/😊|😄|🎉|👍|✅|💪|🔥/.test(content)) positiveCount += 2;
    if (/😢|😠|😡|👎|❌|💔/.test(content)) negativeCount += 2;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Génère un résumé d'analyse pour debug
   */
  getAnalysisSummary(message: Message, result: AnalysisResult): string {
    const content = message.content.trim();
    return `
[MessageAnalyzer] Analysis Summary:
  - Type: ${result.type}
  - Confidence: ${result.confidence.toFixed(2)}
  - Length: ${content.length} chars, ${content.split(/\s+/).length} words
  - Complexity: ${this.calculateComplexity(content).toFixed(2)}
  - Conversational: ${this.isConversational(content)}
  - Greeting: ${this.isGreeting(content)}
  - Goodbye: ${this.isGoodbye(content)}
  - Thanks: ${this.isThanks(content)}
  - Emotion: ${this.detectEmotion(content)}
    `.trim();
  }
}
