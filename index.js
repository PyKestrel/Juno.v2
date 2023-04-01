// Require the necessary discord.js classes
const { Client, Intents, Integration } = require("discord.js");
const { clientId, token } = require("./config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  getVoiceConnection,
  AudioPlayerStatus,
  AudioResource,
  AudioPlayer,
  createAudioPlayer,
} = require("@discordjs/voice");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { EmbedBuilder } = require("discord.js");
const ytdl = require("ytdl-core");
const yts = require("yt-search");

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
  new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("Disconnect Juno from Voice Channel"),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

// Voice Channel Functions

/*

The CreateChannelConnection function is passed the interaction object when a user initiates the /play slash command.
Using the interaction object we will retrieve information related to the VoiceChannel that the initiator is in and pass that information to the joinVoiceChannel function.

*/
async function createChannelConnection(interaction) {
  const channel = interaction.member.voice.channel;
  try {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    return 1;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

/*

The DeleteChannelConnection function is passed the interaction object when a user initiates the /disconnect slash command.
Using the interaction object we will retrieve the active voice connection within the guild and then destroy it thus disconnecting the bot.

*/

async function deleteChannelConnection(interaction) {
  const channel = interaction.member.voice.channel;
  const connection = getVoiceConnection(channel.guild.id);
  try {
    connection.destroy();
  } catch (error) {
    console.log(error);
  }
}

/*

The subscribeChannelConnection is the next step in the Voice Channel connection and is in charge of streaming the actual aduio to the voice channel.
The function is in charge of building the audioPLayer object that will hold our audio stream.

*/

async function subscribeChannelConnection(interaction) {
  let audioPlayer = new AudioPlayer();
  const channel = interaction.member.voice.channel;
  const connection = getVoiceConnection(channel.guild.id);
  const subscription = connection.subscribe(audioPlayer);
}

/*

The ytdlSearch function is used to take a search string and find an associated youtube audio.

*/
async function ytdlSearch(){
    
}



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
      // Use Interaction Object To Get Which Sub-Command Was Used And Retrive Its Name & Value
      let type = interaction.options.data[0].name;
      if (type == "search") {
        interaction.reply(
          `Searching For ${interaction.options.data[0].options[0].value}`
        );
        let commandOption = interaction.options.data[0].options[0].value;
        createChannelConnection(interaction);
      } else if (type == "url") {
        interaction.reply(`Fetching Your Audio!`);
        let commandOption = interaction.options.data[0].options[0].value;
        createChannelConnection(interaction);
      }
      break;
    case "disconnect":
      await interaction.reply("Disconnecting...");
      await deleteChannelConnection(interaction);
      await interaction.deleteReply();
      break;
    default:
      break;
  }
});

// Login to Discord with your client's token
client.login(token);
