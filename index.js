// Require the necessary discord.js classes
const { Client, Intents, Integration } = require("discord.js");
const { clientId, token } = require("./config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const fs = require("node:fs");
const path = require("node:path");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once("ready", () => {
  console.log("Ready!");
});

// Register Slash Commands
// Use SlashCommandBuilder Constructor To Create Future Commands
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  new SlashCommandBuilder()
    .setName("play")
    .setDescription(
      "Search For Music, Play Songs/Playlists From YouTube or Spotify!"
    )
    .addSubcommand((option) =>
      option
        .setName("search")
        .setDescription("Search For A Song Name")
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("url")
        .setDescription("Pass a YouTube/Spotify URL")
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            .setRequired(true)
        )
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

// Voice Channel Functions

async function createChannelConnection() {}

async function deleteChannelConnection() {}

// These are the interactions with the slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  // Check What Slash Command Was Used
  switch (commandName) {
    case "ping":
      await interaction.reply("Pong!");
      await interaction.followUp("Pong again!");
      break;
    case "play":
      // Use Interaction Object To Get Which Sub-Command Was Used And Retrive Its Value
      let type = interaction.options.data[0].name;
      if (type == "search") {
        interaction.reply(
          `Searching For ${interaction.options.data[0].options[0].value}`
        );
        let commandOption = interaction.options.data[0].options[0].value;
      } else if (type == "url") {
        interaction.reply(`Fetching Your Audio!`);
        let commandOption = interaction.options.data[0].options[0].value;
      }
      break;
    default:
      break;
  }
});

// Login to Discord with your client's token
client.login(token);

/*
    CommENtinG by RichRArd
*/
