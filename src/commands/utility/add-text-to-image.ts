import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import * as fs from "fs";
import { createCanvas, loadImage, registerFont } from "canvas";
import { drawText } from "canvas-txt";
import { sleep, getStaticPath } from "../../utils";
import { v4 as uuidv4 } from "uuid";

registerFont(`${getStaticPath()}/fonts/Roboto-Regular.ttf`, {
  family: "Roboto",
});
registerFont(`${getStaticPath()}/fonts/Bungee-Regular.ttf`, {
  family: "Bungee",
});

export const data = new SlashCommandBuilder()
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
        { name: "Bungee", value: "Bungee" },
        { name: "Roboto", value: "Roboto" }
      )
  )
  .addAttachmentOption((option) =>
    option.setName("attachment").setDescription("upload an attachment")
  );

export async function execute(interaction: any): Promise<void> {
  const sTextTop = interaction.options.get("text-top")?.value as string;
  const sTextBottom = interaction.options.get("text-bottom")?.value as string;
  const font = (interaction.options.get("font")?.value || "Roboto") as string;
  const attachment = interaction.options.getAttachment("attachment");

  if (!attachment) {
    await interaction.reply("No attachment provided!");
    return;
  }

  var filename = uuidv4();
  const tmpFile = `/tmp/${filename}.png`;
  console.log(tmpFile);

  await interaction.reply("Ok let's go!");

  const img = await loadImage(attachment.url);

  const canvas = createCanvas(img.width, img.height);
  const ctx: any = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const debug = false;
  const fontSize = Math.floor((img.width * 5) / 100);
  ctx.font = `${fontSize}px ${font}`;

  const border = 10;

  if (sTextTop) {
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    drawText(ctx, sTextTop, {
      x: border,
      y: border,
      font,
      fontSize,
      debug,
      fontWeight: "bold",
      align: "center",
      vAlign: "middle",
      width: canvas.width - border,
      height: canvas.height / 3 - border,
    });

    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
    drawText(ctx, sTextTop, {
      x: border,
      y: border,
      font,
      fontSize,
      debug,
      fontWeight: "",
      align: "center",
      vAlign: "middle",
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
      vAlign: "middle",
      width: canvas.width - border,
      height: canvas.height / 3 - border,
    });

    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
    drawText(ctx, sTextBottom, {
      x: border,
      y: canvas.height - border - canvas.height / 3,
      font,
      fontSize,
      fontWeight: "",
      debug,
      align: "center",
      vAlign: "middle",
      width: canvas.width - border,
      height: canvas.height / 3 - border,
    });
  }

  // Save TMP
  const out: any = fs.createWriteStream(tmpFile);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on("finish", () => console.log("Done"));

  await sleep(1000);
  const file = new AttachmentBuilder(tmpFile);

  await interaction.editReply({ files: [file] });
}
