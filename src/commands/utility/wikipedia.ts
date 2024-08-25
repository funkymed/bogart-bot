import axios from "axios";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

function getWikipedia(search: string) {
  const url = `https://fr.wikipedia.org/w/api.php?action=query&list=search&format=json&&rawcontinue&srsearch=${search}`;

  return axios.get(url).then((response) => {
    return response.data;
  });
}

export const data = new SlashCommandBuilder()
  .setName("wikipedia")
  .setDescription("Search on Wikipedia")
  .addStringOption((option) =>
    option.setName("search").setDescription("search")
  );
export async function execute(interaction: any) {
  const search = interaction.options.get("search");

  const res = await getWikipedia(search.value);

  if (res.query.search.length > 0) {
    const title = res.query.search[0].title;
    const description = res.query.search[0].snippet;
    const pageid = res.query.search[0].pageid;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(`http://fr.wikipedia.org/?curid=${pageid}`)
      .setDescription(description.replace(/(<([^>]+)>)/gi, ""));

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: `Aucun résultat avec *${search.value}*`,
      ephemeral: true,
    });
  }
}
