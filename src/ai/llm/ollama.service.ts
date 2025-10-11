// Service LLM avec Ollama (API REST native, 10x plus rapide que LangChain)
import { GenerateOptions } from '../../types';

export class OllamaLLMService {
  private readonly modelName: string;
  private readonly baseUrl: string;

  constructor(
    modelName: string = 'llama3.2:1b',
    baseUrl: string = 'http://localhost:11434'
  ) {
    this.modelName = modelName;
    this.baseUrl = baseUrl;

    console.log(`[OllamaLLMService] Initialized with model: ${this.modelName} (native API)`);

    // Pré-charger le modèle en arrière-plan pour accélérer le 1er appel
    this.warmup();
  }

  /**
   * Pré-charge le modèle en mémoire pour éviter la latence du 1er appel
   */
  private async warmup(): Promise<void> {
    try {
      console.log(`[OllamaLLMService] Warming up model...`);
      await this.generate("Hello", { maxTokens: 1, timeout: 30000 });
      console.log(`[OllamaLLMService] ✅ Model warmed up and ready`);
    } catch (error) {
      console.log(`[OllamaLLMService] ⚠️  Warmup failed (non-blocking)`);
    }
  }

  /**
   * Génère une réponse avec le LLM via l'API REST native Ollama
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const {
      temperature = 0.8,
      maxTokens = 150,
      timeout = 10000
    } = options;

    try {
      console.log(`[OllamaLLMService] Generating response (temp=${temperature}, maxTokens=${maxTokens}, timeout=${timeout}ms)...`);
      console.log(`[OllamaLLMService] Prompt length: ${prompt.length} chars`);

      const startTime = Date.now();

      // Créer une promesse de timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LLM timeout')), timeout);
      });

      // Créer la requête fetch
      const fetchPromise = fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: temperature,
            num_predict: maxTokens,
          }
        })
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      });

      // Race entre fetch et timeout
      const data: any = await Promise.race([fetchPromise, timeoutPromise]);

      const elapsed = Date.now() - startTime;
      console.log(`[OllamaLLMService] ✅ Response generated in ${elapsed}ms`);

      // Nettoyer la réponse : supprimer les guillemets doubles au début/fin
      let response = (data.response || '').trim();
      if (response.startsWith('"') && response.endsWith('"')) {
        response = response.slice(1, -1);
      }

      return response;

    } catch (error: any) {
      console.error('[OllamaLLMService] ❌ Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Vérifie si Ollama est accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('[OllamaLLMService] Health check failed:', error);
      return false;
    }
  }

  /**
   * Liste les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('[OllamaLLMService] Failed to list models:', error);
      return [];
    }
  }

  /**
   * Récupère le nom du modèle utilisé
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Récupère l'URL de base Ollama
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
