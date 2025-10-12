// Service RAG pour Bogart Bot
import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Document } from '@langchain/core/documents';
import { getDictionnary } from '../../utils';
import { RAGDocument, RetrievalOptions } from '../../types';

/**
 * Wrapper ChromaDB pour OllamaEmbeddings
 */
class OllamaEmbeddingFunction implements IEmbeddingFunction {
  private embeddings: OllamaEmbeddings;

  constructor(ollamaUrl: string, model: string = 'nomic-embed-text') {
    this.embeddings = new OllamaEmbeddings({
      baseUrl: ollamaUrl,
      model: model,
    });
  }

  async generate(texts: string[]): Promise<number[][]> {
    return await this.embeddings.embedDocuments(texts);
  }
}

export class RAGService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private embeddingFunction: OllamaEmbeddingFunction;
  private readonly collectionName = 'bogart-lexicon';
  private readonly chromaUrl: string;
  private readonly ollamaUrl: string;

  constructor(
    chromaUrl: string = 'http://localhost:8000',
    ollamaUrl: string = 'http://localhost:11434'
  ) {
    this.chromaUrl = chromaUrl;
    this.ollamaUrl = ollamaUrl;

    this.client = new ChromaClient({ path: this.chromaUrl });

    this.embeddingFunction = new OllamaEmbeddingFunction(
      this.ollamaUrl,
      'nomic-embed-text'
    );

    console.log(`[RAGService] Initialized with ChromaDB: ${this.chromaUrl}`);
  }

  /**
   * Initialise ou récupère la collection ChromaDB
   */
  async initialize(): Promise<void> {
    try {
      // Tente de récupérer la collection existante avec embedding function
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction,
        metadata: { description: 'Bogart Bot demoscene lexicon' }
      });

      console.log(`[RAGService] Collection "${this.collectionName}" ready`);
    } catch (error) {
      console.error('[RAGService] Failed to initialize collection:', error);
      throw error;
    }
  }

  /**
   * Index le lexique depuis les fichiers YAML
   */
  async indexLexicon(categories: string[] = ['demoscene', 'dev-web', 'droit-travail', 'politique']): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    console.log(`[RAGService] Indexing lexicon categories: ${categories.join(', ')}`);

    const documents: Document[] = [];
    const ids: string[] = [];

    for (const category of categories) {
      const dictionnary = getDictionnary(category);

      if (!dictionnary) {
        console.warn(`[RAGService] No dictionnary found for category: ${category}`);
        continue;
      }

      // Parcourir toutes les clés du dictionnaire
      Object.entries(dictionnary).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Si c'est un tableau de phrases
          value.forEach((phrase: string, index: number) => {
            const id = `${category}-${key}-${index}`;
            ids.push(id);
            documents.push(
              new Document({
                pageContent: phrase,
                metadata: {
                  category,
                  key,
                  source: 'yaml'
                }
              })
            );
          });
        } else if (typeof value === 'string') {
          // Si c'est une phrase unique
          const id = `${category}-${key}`;
          ids.push(id);
          documents.push(
            new Document({
              pageContent: value,
              metadata: {
                category,
                key,
                source: 'yaml'
              }
            })
          );
        }
      });
    }

    if (documents.length === 0) {
      console.warn('[RAGService] No documents to index');
      return;
    }

    console.log(`[RAGService] Indexing ${documents.length} documents...`);

    // Indexer dans ChromaDB (les embeddings sont générés automatiquement)
    const texts = documents.map(doc => doc.pageContent);
    await this.collection.add({
      ids,
      documents: texts,
      metadatas: documents.map(doc => doc.metadata as Record<string, string>)
    });

    console.log(`[RAGService] Successfully indexed ${documents.length} documents`);
  }

  /**
   * Récupère les documents pertinents pour une query
   */
  async retrieve(query: string, options: RetrievalOptions = {}): Promise<RAGDocument[]> {
    if (!this.collection) {
      throw new Error('Collection not initialized. Call initialize() first.');
    }

    const { topK = 3, filter } = options;

    // Recherche dans ChromaDB (embedding généré automatiquement)
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: topK,
      where: filter
    });

    // Convertir les résultats
    const documents: RAGDocument[] = [];

    if (results.documents && results.documents[0]) {
      results.documents[0].forEach((content, index) => {
        if (content && results.metadatas && results.metadatas[0]) {
          const metadata = results.metadatas[0][index] as Record<string, string>;
          const distance = results.distances?.[0]?.[index];

          documents.push({
            content,
            category: metadata.category || 'unknown',
            score: distance ? 1 - distance : 0 // Convert distance to similarity
          });
        }
      });
    }

    console.log(`[RAGService] Retrieved ${documents.length} documents for query`);
    return documents;
  }

  /**
   * Récupère documents en filtrant par catégories
   */
  async retrieveByCategories(
    query: string,
    categories: string[],
    options: RetrievalOptions = {}
  ): Promise<RAGDocument[]> {
    if (categories.length === 0) {
      return this.retrieve(query, options);
    }

    // Build ChromaDB where filter for categories
    // ChromaDB uses $in operator for "category IN (cat1, cat2, ...)"
    const filter = {
      category: { $in: categories }
    };

    return this.retrieve(query, { ...options, filter });
  }

  /**
   * Calcule un score de pertinence pour décider si le bot doit participer spontanément
   */
  async getRelevanceScore(message: string): Promise<number> {
    const results = await this.retrieve(message, { topK: 1 });
    return results.length > 0 ? results[0].score || 0 : 0;
  }

  /**
   * Vérifie la connexion à ChromaDB
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch (error) {
      console.error('[RAGService] Health check failed:', error);
      return false;
    }
  }

  /**
   * Vide la collection (pour réindexation complète)
   */
  async clearCollection(): Promise<void> {
    if (!this.collection) {
      throw new Error('Collection not initialized.');
    }

    try {
      await this.client.deleteCollection({ name: this.collectionName });
      console.log(`[RAGService] Collection "${this.collectionName}" deleted`);

      // Recréer la collection
      await this.initialize();
    } catch (error) {
      console.error('[RAGService] Failed to clear collection:', error);
      throw error;
    }
  }

  /**
   * Obtient le nombre de documents indexés
   */
  async getDocumentCount(): Promise<number> {
    if (!this.collection) {
      return 0;
    }

    try {
      const count = await this.collection.count();
      return count;
    } catch (error) {
      console.error('[RAGService] Failed to get document count:', error);
      return 0;
    }
  }
}
