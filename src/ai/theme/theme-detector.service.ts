// Theme Detection Service
// Uses LLM to detect conversation topic before RAG retrieval

import { OllamaLLMService } from '../llm/ollama.service';
import { getAvailableDictionnaries } from '../../utils';

export interface ThemeDetectionResult {
  theme: string;        // Detected theme (e.g., "demoscene", "dev-web", "general")
  confidence: number;   // 0.0 to 1.0
  categories: string[]; // Suggested RAG categories to query
}

export class ThemeDetectorService {
  private llmService: OllamaLLMService;
  private availableThemes: string[];

  constructor(llmService: OllamaLLMService) {
    this.llmService = llmService;
    this.availableThemes = getAvailableDictionnaries();

    console.log(`[ThemeDetector] Initialized with themes: ${this.availableThemes.join(', ')}`);
  }

  /**
   * Detect the theme/topic of a message
   * @param message User message
   * @returns ThemeDetectionResult
   */
  async detectTheme(message: string): Promise<ThemeDetectionResult> {
    // Build theme detection prompt
    const prompt = this.buildDetectionPrompt(message);

    try {
      // Fast LLM call (low temperature, small tokens)
      const response = await this.llmService.generate(prompt, {
        temperature: 0.1,  // Very deterministic
        maxTokens: 20,     // Just need theme name
        timeout: 5000      // 5s max
      });

      return this.parseThemeResponse(response);
    } catch (error) {
      console.error('[ThemeDetector] Detection failed:', error);
      // Fallback: query all themes
      return {
        theme: 'general',
        confidence: 0.5,
        categories: this.availableThemes
      };
    }
  }

  /**
   * Build detection prompt
   */
  private buildDetectionPrompt(message: string): string {
    const themesDesc = this.getThemeDescriptions();

    return `Classify this message into ONE category. Answer with ONLY the category name, nothing else.

Available categories:
${themesDesc}
- general: anything else (small talk, personal questions, off-topic)

Message: "${message}"

Category:`;
  }

  /**
   * Get theme descriptions for prompt
   */
  private getThemeDescriptions(): string {
    const descriptions: { [key: string]: string } = {
      'demoscene': 'demoscene, retro computing, Amiga, C64, Atari, demos, pixel art, chiptune, demoparties',
      'dev-web': 'programming, software development, web dev, frameworks, languages, tools, APIs, databases, DevOps'
    };

    return this.availableThemes
      .map(theme => `- ${theme}: ${descriptions[theme] || theme}`)
      .join('\n');
  }

  /**
   * Parse LLM response to extract theme
   */
  private parseThemeResponse(response: string): ThemeDetectionResult {
    const cleaned = response.trim().toLowerCase();

    // Check if response matches a known theme
    for (const theme of this.availableThemes) {
      if (cleaned.includes(theme)) {
        return {
          theme,
          confidence: 0.9,
          categories: [theme]
        };
      }
    }

    // Check for "general"
    if (cleaned.includes('general')) {
      return {
        theme: 'general',
        confidence: 0.8,
        categories: this.availableThemes // Query all for general topics
      };
    }

    // Fallback: couldn't parse, query all
    console.warn(`[ThemeDetector] Could not parse theme from: "${response}"`);
    return {
      theme: 'general',
      confidence: 0.5,
      categories: this.availableThemes
    };
  }

  /**
   * Check if message is likely small talk (skip RAG entirely)
   */
  isSmallTalk(message: string): boolean {
    const lowerMsg = message.toLowerCase();

    const smallTalkPatterns = [
      /^(hi|hey|hello|salut|bonjour|coucou)/i,
      /how are you|ça va|comment vas-tu/i,
      /what('s| is) your (name|favorite)/i,
      /tell me about yourself/i,
      /(thanks|merci|thx)/i,
      /^(lol|mdr|haha)/i
    ];

    return smallTalkPatterns.some(pattern => pattern.test(lowerMsg));
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return this.availableThemes;
  }
}
