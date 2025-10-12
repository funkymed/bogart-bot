// Types pour MCP (Model Context Protocol) et Web Search
import { HandlerContext } from './index';

/**
 * Résultat de recherche web
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Contexte étendu pour les recherches web
 * Inclut la query extraite du message
 */
export interface WebSearchContext extends HandlerContext {
  searchQuery: string;
}

/**
 * Statistiques de recherche web
 */
export interface SearchStats {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  avgResponseTime: number;
  cacheSize: number;
}

/**
 * Configuration du service de recherche
 */
export interface WebSearchConfig {
  enabled: boolean;
  maxResults: number;
  timeout: number;
  cacheTTL: number;
}
