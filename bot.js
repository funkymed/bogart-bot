const {
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
} = require("discord.js");
const clc = require("cli-color");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const dotenv = require("dotenv");
dotenv.config();

const ServiceQr = require("./services/class.service.qr.js");
const ServiceLol = require("./services/class.service.lol");
const fs = require("node:fs");
const path = require("node:path");

client.once(Events.ClientReady, (err, mesg) => {
  console.log(clc.green("Bogart is up and ready"));
});

// --------------------
// Commands
// --------------------

const commands = [];
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // console.log(`call command /${interaction.commandName}`);
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// add and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_APPID,
        process.env.DISCORD_GUILDID
      ),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

// --------------------
// Messages
// --------------------

const allServices = [ServiceQr, ServiceLol];

client.on(Events.MessageCreate, (message) => {
  // const channel = message.channel.name;
  const text = message.content;
  const nickname = message.author.globalName;
  // skip bot message
  if (!message.author.bot) {
    // process all services
    for (const svc of allServices) {
      const obj = new svc(nickname);
      obj.loadDictionnary();

      let answer;
      if (obj.getCommande() && text.split(" ")[0] === obj.getCommande()) {
        answer = obj.getMessage(text);
      } else if (!obj.getCommande()) {
        answer = obj.getMessage(text);
      }

      if (answer && answer !== "") {
        message.channel.send(answer);
        break; // exit loop
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
