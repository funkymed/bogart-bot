const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

function prompt(message) {
  var raw = JSON.stringify({
    key: process.env.STABLE_DIFFUSION_KEY,
    prompt: message,
    negative_prompt: null,
    width: "512",
    height: "512",
    samples: "1",
    num_inference_steps: "20",
    seed: null,
    guidance_scale: 7.5,
    safety_checker: "yes",
    multi_lingual: "no",
    panorama: "no",
    self_attention: "no",
    upscale: "no",
    embeddings_model: null,
    webhook: null,
    track_id: null,
  });

  return axios({
    method: "post",
    url: "https://stablediffusionapi.com/api/v3/text2img",
    headers: {
      "Content-Type": "application/json",
    },
    data: raw,
  }).then((response) => {
    return response;
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stable-diffusion")
    .setDescription("Prompt of stable diffusion")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("prompt")
    ),
  async execute(interaction) {
    const message = interaction.options.get("prompt");

    await interaction.reply(
      `please wait... processing for the prompt : ${message.value}`
    );
    const res = await prompt(message.value);
    console.log(res.data);
    const embed = new EmbedBuilder()
      .setImage(res.data.output[0])
      .setDescription(`prompt : ${message.value}`)
      .setTitle(`Stable diffusion`);

    await interaction.editReply({ embeds: [embed] });
  },
};
