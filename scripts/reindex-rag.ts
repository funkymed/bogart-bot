#!/usr/bin/env tsx
// Script pour nettoyer et réindexer ChromaDB

import { RAGService } from '../src/ai/rag/rag.service';

async function main() {
  console.log('🔄 Starting RAG reindexing...\n');

  const ragService = new RAGService(
    process.env.CHROMA_URL || 'http://localhost:8000',
    process.env.OLLAMA_URL || 'http://localhost:11434'
  );

  try {
    // 1. Health check
    console.log('1️⃣ Checking ChromaDB...');
    const isHealthy = await ragService.healthCheck();
    if (!isHealthy) {
      throw new Error('ChromaDB is not accessible');
    }
    console.log('✅ ChromaDB OK\n');

    // 2. Initialize
    console.log('2️⃣ Initializing collection...');
    await ragService.initialize();
    console.log('✅ Collection initialized\n');

    // 3. Clear old data
    console.log('3️⃣ Clearing old data...');
    await ragService.clearCollection();
    console.log('✅ Old data cleared\n');

    // 4. Re-initialize after clear
    console.log('4️⃣ Re-initializing collection...');
    await ragService.initialize();
    console.log('✅ Collection re-initialized\n');

    // 5. Index new lexicon (dynamically load available dictionaries)
    console.log('5️⃣ Indexing all knowledge bases...');
    const { getAvailableDictionnaries } = await import('../src/utils');
    const availableDicts = getAvailableDictionnaries();
    console.log(`   Found dictionaries: ${availableDicts.join(', ')}`);
    await ragService.indexLexicon(availableDicts);

    const docCount = await ragService.getDocumentCount();
    console.log(`✅ Indexed ${docCount} documents\n`);

    // 6. Test retrieval
    console.log('6️⃣ Testing retrieval...');
    const testResults = await ragService.retrieve('demoscene', { topK: 3 });
    console.log(`✅ Retrieved ${testResults.length} test documents\n`);

    if (testResults.length > 0) {
      console.log('📝 Sample document:');
      console.log(`   "${testResults[0].content}"\n`);
    }

    console.log('✅ RAG reindexing complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Reindexing failed:', error);
    process.exit(1);
  }
}

main();
