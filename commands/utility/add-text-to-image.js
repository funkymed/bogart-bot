const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require("canvas");
const { drawText } = require("canvas-txt");

const { sleep } = require("../../utils");

// (B) SETTINGS - CHANGE FONT TO YOUR OWN!
const sFile = "pepe.jpeg";

registerFont("fonts/Roboto-Regular.ttf", { family: "Roboto" });
registerFont("fonts/Bungee-Regular.ttf", { family: "Bungee" });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-text-to-image")
    .setDescription("A little Meme Editor : add text to an image")
    .addStringOption((option) =>
      option.setName("text-top").setDescription("texte haut")
    )
    .addStringOption((option) =>
      option.setName("text-bottom").setDescription("texte bas")
    )
    .addStringOption((option) =>
      option
        .setName("font")
        .setDescription("font")
        .setRequired(false)
        .addChoices(
          {
            name: "Bungee",
            value: "Bungee",
          },
          {
            name: "Roboto",
            value: "Roboto",
          }
        )
    )
    .addAttachmentOption((option) =>
      option.setName("attachment").setDescription("upload an attachment")
    ),
  async execute(interaction) {
    const sTextTop = interaction.options.get("text-top");
    const sTextBottom = interaction.options.get("text-bottom");
    const font = interaction.options.get("font").value;
    const attachment = await interaction.options.getAttachment("attachment");

    const tmpFile = "tmp/tmp.png";

    await interaction.reply("Ok let's go !");

    const img = await loadImage(attachment.url).then((img) => {
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const debug = false;
      const fontSize = Math.floor((img.width * 5) / 100);
      ctx.font = `${fontSize}px Roboto`;

      const border = 10;

      if (sTextTop) {
        ctx.fillStyle = "rgba(0, 0, 0, 1.0)";

        drawText(ctx, sTextTop.value, {
          x: border,
          y: border,
          font,
          fontSize,
          debug,
          fontWeight: "bold",
          align: "center",
          vAlign: "center",
          width: canvas.width - border,
          height: canvas.height / 3 - border,
        });

        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

        drawText(ctx, sTextTop.value, {
          x: border,
          y: border,
          font,
          fontSize,
          debug,
          fontWeight: 0,
          align: "center",
          vAlign: "center",
          width: canvas.width - border,
          height: canvas.height / 3 - border,
        });
      }

      if (sTextBottom) {
        ctx.fillStyle = "rgba(0, 0, 0, 1.0)";

        drawText(ctx, sTextBottom, {
          x: border,
          y: canvas.height - border - canvas.height / 3,
          font,
          fontSize,
          fontWeight: "bold",
          debug,
          align: "center",
          vAlign: "center",
          width: canvas.width - border,
          height: canvas.height / 3 - border,
        });

        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

        drawText(ctx, sTextBottom.value, {
          x: border,
          y: canvas.height - border - canvas.height / 3,
          font,
          fontSize,
          fontWeight: 0,
          debug,
          align: "center",
          vAlign: "center",
          width: canvas.width - border,
          height: canvas.height / 3 - border,
        });
      }
      // Save TMP
      const out = fs.createWriteStream(tmpFile),
        stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => console.log("Done"));
    });

    await sleep(1000);
    const file = new AttachmentBuilder(tmpFile);

    await interaction.editReply({ files: [file] });
  },
};
