const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

function searchMovie(search) {
  const url = `https://www.omdbapi.com/?s=${escape(
    search.value
  )}&apikey=${process.env.OMB_API_KEY}&t=${Date.now()}`;

  return axios.get(url).then((response) => {
    return response.data;
  });
}

function makeEmbed(search, movies) {
  const embeds = [];
  for (const movie of movies.Search) {
    if (movie.Poster && movie.Poster !== "N/A" && movie.Poster !== "") {
      if (embeds.length < 6) {
        if (embeds.length === 0) {
          embeds.push(
            new EmbedBuilder()
              .setURL("https://imdb.com/")
              .setImage(movie.Poster.replace("_V1_SX", "_V1_MX"))
              .setDescription("Imdb database search")
              .setTitle(`Result for : ${search.value}`)
              .setFooter({
                text: `Provided by Bogart\nTotal results : ${movies.totalResults}`,
              })
          );
        } else {
          embeds.push(
            new EmbedBuilder()
              .setURL("https://imdb.com/")
              .setImage(movie.Poster.replace("_V1_SX", "_V1_MX"))
          );
        }
      }
    }
  }
  return embeds;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("movie")
    .setDescription("Search a movie")
    .addStringOption((option) =>
      option.setName("search").setDescription("titre du film")
    ),
  async execute(interaction) {
    const search = interaction.options.get("search");

    // Recherche

    const movies = await searchMovie(search);
    if (movies.Response === "False") {
      await interaction.reply({
        content: `Aucun résultat pour la recherche *${search.value}*`,
        ephemeral: true,
      });
    } else {
      const embeds = makeEmbed(search, movies);

      if (embeds.length > 0) {
        await interaction.reply({ embeds: embeds });
      } else {
        await interaction.reply({
          content: `Aucun résultat avec image pour la recherche *${search.value}*`,
          ephemeral: true,
        });
      }
    }
  },
};
