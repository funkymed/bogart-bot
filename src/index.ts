import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { MessageOrchestrator } from "./core/message.orchestrator";

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Créer l'orchestrateur de messages (nouvelle architecture)
const orchestrator = new MessageOrchestrator(
  process.env.OLLAMA_URL || 'http://localhost:11434',
  process.env.CHROMA_URL || 'http://localhost:8000'
);

// Initialiser l'orchestrateur au démarrage du bot
client.once(Events.ClientReady, async () => {
  console.log("Discord bot is ready! 🤖");
  console.log("Initializing AI services...");

  try {
    await orchestrator.initialize();
    console.log("✅ AI services initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize AI services:", error);
    console.error("⚠️  Bot will continue but AI features will be disabled.");
    console.error("Make sure Ollama and ChromaDB are running (docker-compose up -d)");
  }
});

// Handler des messages (nouvelle architecture)
client.on(Events.MessageCreate, async (message) => {
  // Ignorer les messages des bots (y compris nous-mêmes)
  if (message.author.bot) {
    return;
  }

  // Double check: ignorer nos propres messages
  if (message.author.id === client.user?.id) {
    return;
  }

  try {
    // Log du message reçu
    console.log(`[MessageHandler] Processing: "${message.content.substring(0, 50)}..." from ${message.author.username}`);

    // Traiter le message avec le nouvel orchestrateur
    const response = await orchestrator.processMessage(message);

    // Si une réponse est générée, l'envoyer
    // Note: certains handlers (DeepQuestionHandler) gèrent l'envoi eux-mêmes
    // et retournent une chaîne vide
    if (response && response.trim() !== "") {
      console.log(`[MessageHandler] Sending response: "${response.substring(0, 50)}..."`);
      await message.channel.send(response);
    } else {
      console.log(`[MessageHandler] No response to send (handler managed it)`);
    }

  } catch (error) {
    console.error('[MessageHandler] Error processing message:', error);
    // Ne pas renvoyer d'erreur à l'utilisateur, juste logger
  }
});

// Démarrer le bot
client.login(config.DISCORD_TOKEN);
