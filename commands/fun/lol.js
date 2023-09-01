const { SlashCommandBuilder } = require("discord.js");
const ServiceLol = require("../../services/class.service.lol");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lol")
    .setDescription("Lol")
    .addStringOption((option) =>
      option
        .setName("option")
        .setDescription("option")
        .setRequired(false)
        .addChoices(
          {
            name: "random",
            value: "random",
          },
          {
            name: "citation",
            value: "citation",
          },
          {
            name: "jcvd",
            value: "jcvd",
          },
          {
            name: "lol",
            value: "lol",
          }
        )
    ),

  async execute(interaction) {
    const option = interaction.options.get("option");

    const svc = new ServiceLol(interaction.user.username);
    svc.loadDictionnary();
    const answer = svc.getLol(option.value);
    await interaction.reply(answer);
  },
};
