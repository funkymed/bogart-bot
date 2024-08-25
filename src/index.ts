import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import Services from "./services";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, () => {
  console.log("Discord bot is ready! 🤖");
});

client.on(Events.GuildCreate, async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on(Events.MessageCreate, async (message) => {
  const text = message.content;
  const nickname = message.author.id;

  // skip bot message
  if (!message.author.bot) {
    // process all services
    for (const svc of Services) {
      const obj = new svc(nickname);
      obj.loadDictionnary();

      let answer;
      if (obj.getCommande() && text.split(" ")[0] === obj.getCommande()) {
        answer = await obj.getMessage(text);
      } else if (!obj.getCommande()) {
        answer = await obj.getMessage(text);
      }

      if (answer && answer !== "" && typeof answer !== "undefined") {
        message.channel.send(answer);
        break; // exit loop
      }
    }
  }
});

client.login(config.DISCORD_TOKEN);
