// SmallTalk Handler pour Bogart Bot
// Gère les conversations légères et décontractées

import { Message } from 'discord.js';
import { PersonalityEngine } from '../ai/prompts/personality.engine';
import { MemoryManager } from '../core/memory.manager';
import { MessageAnalyzer } from './message-analyzer';
import { HandlerContext } from '../types';

export class SmallTalkHandler {
  private personalityEngine: PersonalityEngine;
  private memoryManager: MemoryManager;
  private messageAnalyzer: MessageAnalyzer;

  constructor(
    personalityEngine: PersonalityEngine,
    memoryManager: MemoryManager,
    messageAnalyzer: MessageAnalyzer
  ) {
    this.personalityEngine = personalityEngine;
    this.memoryManager = memoryManager;
    this.messageAnalyzer = messageAnalyzer;
    console.log('[SmallTalkHandler] Initialized');
  }

  /**
   * Traite un message de small talk
   */
  async handle(context: HandlerContext): Promise<string> {
    const { message, userId, content } = context;

    console.log(`[SmallTalkHandler] Processing small talk for user ${userId}`);

    // Nettoyer le message (retirer les mentions)
    const cleanContent = this.messageAnalyzer.extractQuestion(content);

    // Récupérer la mémoire utilisateur
    const history = this.memoryManager.getShortTermHistory(userId, 3);
    const userContext = this.memoryManager.getUserContext(userId);

    // Détecter l'humeur du message
    const mood = this.messageAnalyzer.detectEmotion(content);

    // Mettre à jour le contexte utilisateur
    this.memoryManager.updateUserContext(userId, { mood });

    // Détecter le topic si possible
    const topic = this.memoryManager.detectTopic(userId);
    if (topic) {
      this.memoryManager.updateUserContext(userId, { topic });
    }

    // Cas spéciaux : salutations, remerciements, au revoir
    if (this.messageAnalyzer.isGreeting(content)) {
      return this.handleGreeting(userId, content);
    }

    if (this.messageAnalyzer.isThanks(content)) {
      return this.handleThanks(userId, content);
    }

    if (this.messageAnalyzer.isGoodbye(content)) {
      return this.handleGoodbye(userId, content);
    }

    // Cas spécial : correction/remarque ironique
    if (this.isCorrection(cleanContent, history)) {
      return this.handleCorrection(userId, cleanContent, history);
    }

    // Génération avec le PersonalityEngine
    try {
      const response = await this.personalityEngine.generateSmallTalk(
        cleanContent,
        history,
        userContext
      );

      // Ajouter à la mémoire
      this.memoryManager.addConversationTurn(userId, cleanContent, response);

      console.log(`[SmallTalkHandler] Generated response (${response.length} chars)`);
      return response;

    } catch (error) {
      console.error('[SmallTalkHandler] Generation failed:', error);

      // Fallback sur une réponse ironique par défaut
      const fallbacks = [
        "Mon LLM a planté, désolé. Ça arrive même aux meilleurs !",
        "Oups, timeout dans mes circuits. Reformule peut-être ?",
        "Crash CPU. Je reviens dans 5 secondes... ou pas.",
        "Erreur 404 : humour not found. Réessaye ?",
        "Mon Amiga mental a freezé. Reboot en cours...",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  /**
   * Gère les salutations
   */
  private async handleGreeting(userId: string, content: string): Promise<string> {
    const greetings = [
      "Yop l'ancêtre ! Ça trace ?",
      "Salut codeur du dimanche !",
      "Hé le scener, bien ou bien ?",
      "Yo pixel pusher !",
      "Quoi d'neuf dans le monde des bits ?"
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    // Ajouter à la mémoire
    this.memoryManager.addConversationTurn(userId, content, randomGreeting);

    return randomGreeting;
  }

  /**
   * Gère les remerciements
   */
  private async handleThanks(userId: string, content: string): Promise<string> {
    const thanks = [
      "De rien chef ! On est là pour ça.",
      "Pas de soucis, c'est cadeau. Comme du freeware.",
      "Avec plaisir ! Continue de coder, et pense à moi quand tu feras ton premier 64K.",
      "Cool ! N'oublie pas de citer Bogart dans tes credits ;)",
      "Tranquille. Si t'as besoin, je suis dans le coin."
    ];

    const randomThanks = thanks[Math.floor(Math.random() * thanks.length)];

    // Ajouter à la mémoire
    this.memoryManager.addConversationTurn(userId, content, randomThanks);

    return randomThanks;
  }

  /**
   * Gère les au revoir
   */
  private async handleGoodbye(userId: string, content: string): Promise<string> {
    const goodbyes = [
      "À plus dans le bus ! Et code bien !",
      "Salut l'artiste ! Fais péter les pixels !",
      "Ciao, et n'oublie pas : optimise ton code comme ta vie.",
      "Tchao ! Va créer des trucs qui déchirent.",
      "À la prochaine scener ! Que les bits soient avec toi.",
      "Salut, et pense à faire des backups !"
    ];

    const randomGoodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];

    // Ajouter à la mémoire
    this.memoryManager.addConversationTurn(userId, content, randomGoodbye);

    return randomGoodbye;
  }

  /**
   * Détecte si c'est une correction/remarque ironique
   */
  private isCorrection(content: string, history?: ConversationTurn[]): boolean {
    const lowerContent = content.toLowerCase();

    // Indicateurs de correction
    const correctionPatterns = [
      /mais\s+/,           // "mais on est samedi"
      /en fait\s+/,        // "en fait c'est"
      /plutôt\s+/,         // "plutôt"
      /^non[,\s]/,         // "non, ..."
      /^c'est\s+/,         // "c'est samedi"
      /^on est\s+/,        // "on est samedi"
      /^en réalité/,       // "en réalité"
      /^actuellement/,     // "actuellement"
    ];

    return correctionPatterns.some(pattern => pattern.test(lowerContent));
  }

  /**
   * Gère les corrections/remarques ironiques
   */
  private async handleCorrection(userId: string, content: string, history?: ConversationTurn[]): Promise<string> {
    const corrections = [
      "Ah ouais, t'as raison. Mon horloge interne déconne un peu.",
      "Merde, j'ai pété un câble. Tu m'excuses ?",
      "Oups, mon CPU a fait un glitch. Bien vu !",
      "Ha ! Mon calendar.exe a planté. Merci de la correction chef.",
      "Ah mince, j'ai mélangé mes registres. My bad !",
      "Ouh là, bug dans ma routine de temps. Noté !",
      "T'as raison, je dis n'importe quoi parfois. Les joies de l'IA...",
      "Exact ! J'étais en roue libre là. Pardon pardon.",
      "Ah ouais carrément. Je me suis planté comme une bécane sous DOS.",
      "OK OK, j'avoue, j'ai sorti une connerie. On repart sur de bonnes bases ?"
    ];

    const randomCorrection = corrections[Math.floor(Math.random() * corrections.length)];

    // Ajouter à la mémoire
    this.memoryManager.addConversationTurn(userId, content, randomCorrection);

    return randomCorrection;
  }

  /**
   * Réponse de fallback en cas d'erreur
   */
  private getFallbackResponse(mood: string): string {
    if (mood === 'positive') {
      const positives = [
        "Ah ouais, carrément ! C'est du bon pixel ça !",
        "Respect, ça c'est du code de qualité !",
        "Énorme ! T'as assuré là !",
        "Franchement, c'est classe. Bravo mec."
      ];
      return positives[Math.floor(Math.random() * positives.length)];
    }

    if (mood === 'negative') {
      const negatives = [
        "Mouais, ça manque un peu d'optimisation tout ça...",
        "Bof, ça manque de soul. Faut de la passion dans les bits !",
        "Hum, je comprends. Ça arrive même aux meilleurs."
      ];
      return negatives[Math.floor(Math.random() * negatives.length)];
    }

    // Neutre
    const neutrals = [
      "Ouais, je vois ce que tu veux dire.",
      "Intéressant. Raconte-moi en plus.",
      "OK, je note. Continue.",
      "Hmm, ça se tient.",
      "C'est pas faux."
    ];

    return neutrals[Math.floor(Math.random() * neutrals.length)];
  }

  /**
   * Vérifie si le handler peut traiter ce message
   */
  canHandle(context: HandlerContext): boolean {
    // Le SmallTalkHandler gère tous les messages conversationnels courts
    return this.messageAnalyzer.isConversational(context.content);
  }

  /**
   * Statistiques du handler
   */
  getStats(): {
    totalConversations: number;
    avgResponseTime: number;
  } {
    // Pour l'instant, stats simplifiées
    const memoryStats = this.memoryManager.getStats();

    return {
      totalConversations: memoryStats.totalShortTermTurns,
      avgResponseTime: 0 // À implémenter avec un système de tracking
    };
  }
}
