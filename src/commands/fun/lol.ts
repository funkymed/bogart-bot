import { SlashCommandBuilder } from "discord.js";
import ServiceLol from "../../services/class.service.lol";

export const data = new SlashCommandBuilder()
  .setName("lol")
  .setDescription("Lol")
  .addStringOption((option) =>
    option
      .setName("option")
      .setDescription("option")
      .setRequired(false)
      .addChoices(
        { name: "random", value: "random" },
        { name: "citation", value: "citation" },
        { name: "jcvd", value: "jcvd" },
        { name: "lol", value: "lol" }
      )
  );

export async function execute(interaction: any): Promise<void> {
  const option = interaction.options.get("option");

  const svc = new ServiceLol(interaction.user.username);
  svc.loadDictionnary();
  const answer = svc.getLol(option?.value);
  await interaction.reply(answer);
}
