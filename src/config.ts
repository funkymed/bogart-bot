import dotenv from "dotenv";

dotenv.config();

const { DISCORD_TOKEN, DISCORD_APPID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_APPID) {
  throw new Error("Missing environment variables");
}

export const config = {
  DISCORD_TOKEN,
  DISCORD_APPID,
};
