const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { openweatherapi } = require("../../config.json");

function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fr&appid=${openweatherapi}`;

  return axios.get(url).then((response) => {
    return response.data;
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meteo")
    .setDescription("Meteo of a city in the world")
    .addStringOption((option) => option.setName("city").setDescription("city")),
  async execute(interaction) {
    const city = interaction.options.get("city");

    const weather = await getWeather(city.value);

    if (weather.main) {
      const meteo = weather.weather[0].description;
      const temp = Math.floor(weather.main.temp);
      const humidity = Math.floor(weather.main.humidity);
      const icon = weather.weather[0].icon;
      const message = `Il fait actuellement ${temp}°C pour un temps ${meteo} avec ${humidity}% d'humidité.`;

      const embed = new EmbedBuilder()
        .setThumbnail(`https://openweathermap.org/img/wn/${icon}@2x.png`)
        .setTitle(`Météo à ${city.value}`)
        .setDescription(message);

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: `Aucun résultat avec *${search.value}*`,
        ephemeral: true,
      });
    }
  },
};
