import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
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

// const commandArray = [];
// client.commands = new Collection();

// commands.forEach((command: any) => {
//   if ("data" in command && "execute" in command) {
//     client.commands.set(command.data.name, command);
//     commandArray.push(command.data.toJSON());
//   }
// });

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;

//   // console.log(`call command /${interaction.commandName}`);
//   const command = interaction.client.commands.get(interaction.commandName);

//   if (!command) {
//     console.error(`No command matching ${interaction.commandName} was found.`);
//     return;
//   }

//   try {
//     await command.execute(interaction);
//   } catch (error) {
//     console.error(error);
//     if (interaction.replied || interaction.deferred) {
//       await interaction.followUp({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     } else {
//       await interaction.reply({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     }
//   }
// });

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
