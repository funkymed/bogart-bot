// Types TypeScript pour Bogart Bot v2

import { Message } from 'discord.js';

// Types de messages
export enum MessageType {
  SMALL_TALK = 'small_talk',
  DEEP_QUESTION = 'deep_question',
  KEYWORD_TRIGGER = 'keyword',
  IGNORE = 'ignore'
}

// Résultat d'analyse de message
export interface AnalysisResult {
  type: MessageType;
  confidence: number;
  trigger?: string; // Pour KEYWORD_TRIGGER
}

// Contexte pour les handlers
export interface HandlerContext {
  message: Message;
  userId: string;
  content: string;
}

// Tour de conversation
export interface ConversationTurn {
  user: string;
  assistant: string;
  timestamp: number;
}

// Résumé de conversation (long terme)
export interface ConversationSummary {
  summary: string;
  turnCount: number;
  startTime: number;
  endTime: number;
}

// Contexte utilisateur
export interface UserContext {
  context: string;
  mood?: string;
  topic?: string;
}

// Préférences utilisateur
export interface UserPreferences {
  [key: string]: any;
}

// Mémoire utilisateur complète
export interface UserMemory {
  userId: string;
  shortTerm: ConversationTurn[];
  longTerm: ConversationSummary[];
  context: UserContext;
  preferences: UserPreferences;
}

// Options de génération LLM
export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

// Options de récupération RAG
export interface RetrievalOptions {
  topK?: number;
  filter?: any;
}

// Document RAG
export interface RAGDocument {
  content: string;
  category: string;
  score?: number;
}

// Input pour la construction de prompt
export interface PromptInput {
  message: string;
  history?: ConversationTurn[];
  ragContext?: RAGDocument[];
  userContext?: UserContext;
  type: 'small_talk' | 'deep_question';
}

// Configuration de mot-clé
export interface KeywordConfig {
  keywords: string[];
  responses: string[];
  useFixed: boolean;
}

// Intent
export interface Intent {
  type: MessageType;
  confidence: number;
  command?: string;
  utility?: string;
}
