// Service de recherche web via DuckDuckGo Lite (100% gratuit, toujours disponible)
import axios from 'axios';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchService {
  private stats = {
    totalSearches: 0,
    successfulSearches: 0,
    failedSearches: 0,
    totalResponseTime: 0
  };
  private cache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private readonly cacheTTL = 300000; // 5 minutes

  constructor() {
    console.log('[WebSearchService] Initialized with DuckDuckGo Lite (100% gratuit, toujours dispo)');
  }

  /**
   * Recherche web via DuckDuckGo Lite
   */
  async search(query: string): Promise<SearchResult[]> {
    const startTime = Date.now();
    this.stats.totalSearches++;

    try {
      // Vérifier le cache
      const cached = this.getFromCache(query);
      if (cached) {
        console.log(`[WebSearchService] Cache hit for: "${query}"`);
        this.stats.successfulSearches++;
        return cached;
      }

      const ddgUrl = 'https://lite.duckduckgo.com/lite/';
      console.log(`[WebSearchService] Searching for: "${query}"`);
      console.log(`[WebSearchService] Request: ${ddgUrl}?q=${encodeURIComponent(query)}`);

      // DuckDuckGo Lite (version HTML simple, pas de rate limit)
      const response = await axios.get(ddgUrl, {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BogartBot/2.0)'
        },
        timeout: 10000
      });

      const html = response.data;
      console.log(`[WebSearchService] Response length: ${html.length} chars`);

      const results: SearchResult[] = [];

      // Parser les résultats (format simplifié de DDG Lite)
      // Format: <a rel="nofollow" href="URL">Title</a>
      //         <td class="result-snippet">Snippet</td>
      const linkRegex = /<a rel="nofollow" href="([^"]+)">([^<]+)<\/a>/g;
      const snippetRegex = /<td class="result-snippet">([^<]+)<\/td>/g;

      const links: Array<{ url: string; title: string }> = [];
      let match;

      // Extraire les liens
      while ((match = linkRegex.exec(html)) !== null && links.length < 5) {
        links.push({
          url: match[1],
          title: this.decodeHTML(match[2])
        });
      }
      console.log(`[WebSearchService] Found ${links.length} links`);

      // Extraire les snippets
      const snippets: string[] = [];
      while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
        snippets.push(this.decodeHTML(match[1]));
      }
      console.log(`[WebSearchService] Found ${snippets.length} snippets`);

      // Combiner liens et snippets
      for (let i = 0; i < Math.min(links.length, 5); i++) {
        results.push({
          title: links[i].title,
          url: links[i].url,
          snippet: snippets[i] || links[i].title
        });
      }

      if (results.length === 0) {
        console.log('[WebSearchService] No results found');
        return this.getFallbackResults(query);
      }

      this.setCache(query, results);
      this.stats.successfulSearches++;
      this.stats.totalResponseTime += Date.now() - startTime;
      console.log(`[WebSearchService] ✅ Found ${results.length} results in ${Date.now() - startTime}ms`);

      return results;

    } catch (error: any) {
      this.stats.failedSearches++;
      console.error('[WebSearchService] ❌ Search failed:', error.message);
      return this.getFallbackResults(query);
    }
  }

  /**
   * Résultats fallback en cas d'erreur
   */
  private getFallbackResults(query: string): SearchResult[] {
    console.log('[WebSearchService] Using fallback results');

    return [{
      title: `Recherche: ${query}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Je n'ai pas pu récupérer de résultats pour "${query}". Clique sur le lien pour voir les résultats sur Google.`
    }];
  }

  /**
   * Décode les entités HTML
   */
  private decodeHTML(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .trim();
  }

  /**
   * Formate les résultats de recherche pour un prompt LLM
   */
  async searchAndFormat(query: string): Promise<string> {
    const results = await this.search(query);

    if (results.length === 0) {
      return "Aucun résultat trouvé pour cette recherche.";
    }

    let formatted = `Résultats de recherche pour "${query}":\n\n`;

    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   ${result.snippet}\n`;
      formatted += `   Source: ${result.url}\n\n`;
    });

    return formatted;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get('https://lite.duckduckgo.com/lite/', {
        params: { q: 'test' },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gestion du cache
   */
  private getFromCache(query: string): SearchResult[] | null {
    const normalizedQuery = query.toLowerCase().trim();
    const cached = this.cache.get(normalizedQuery);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.results;
    }

    // Nettoyer les entrées expirées
    if (cached) {
      this.cache.delete(normalizedQuery);
    }

    return null;
  }

  private setCache(query: string, results: SearchResult[]): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.cache.set(normalizedQuery, {
      results,
      timestamp: Date.now()
    });

    // Limiter la taille du cache à 100 entrées
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Statistiques
   */
  getStats(): {
    totalSearches: number;
    successfulSearches: number;
    failedSearches: number;
    avgResponseTime: number;
    cacheSize: number;
  } {
    return {
      totalSearches: this.stats.totalSearches,
      successfulSearches: this.stats.successfulSearches,
      failedSearches: this.stats.failedSearches,
      avgResponseTime: this.stats.successfulSearches > 0
        ? Math.round(this.stats.totalResponseTime / this.stats.successfulSearches)
        : 0,
      cacheSize: this.cache.size
    };
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[WebSearchService] Cache cleared');
  }
}
