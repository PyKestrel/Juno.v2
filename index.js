// Require the necessary discord.js classes
const { Client, Intents, Integration } = require("discord.js");
const { clientId, token } = require("./config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  getVoiceConnection,
  AudioPlayerStatus,
  AudioPlayerStates,
  AudioResource,
  AudioPlayer,
  createAudioPlayer,
  createAudioResource,
} = require("@discordjs/voice");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { EmbedBuilder } = require("discord.js");
const ytdl = require("ytdl-core");
const yts = require("yt-search");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

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
    .addStringOption((option) =>
          option
            .setName("search")
            .setDescription("Never Gonna Give You Up")
            .setRequired(false)
    )
    .addStringOption((option) =>
          option
            .setName("youtube")
            .setDescription("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
            .setRequired(false)
    )
    .addStringOption((option) =>
          option
            .setName("spotify")
            .setDescription("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=e018a665dc3a428d")
            .setRequired(false)
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
  // Audio Player Object Instantiation
  let player = createAudioPlayer();
  // Get Voice Channel ID & Connect To Voice Channel
  const channel = interaction.member.voice.channel;
  const connection = getVoiceConnection(channel.guild.id);
  // Option Variable Contains Link or Search
  const stream = await audioParser(interaction)
  // Create Audio Resource From Stream
  const resource = createAudioResource(stream);
  // Create Subscription
  connection.subscribe(player);
  // Play YTDL Stream
  player.play(resource)
}

/*

The audioParser function is used to take a search string or link and find an associated youtube audio.

*/
async function audioParser(interaction){
  let option = interaction.options.data[0].name;
  let value = interaction.options.data[0].value;
  let stream
  switch (option) {
    case "search":
      
    break;
    case "youtube":
      const regex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})$/;
      const isValidUrl = regex.test(value);
      if(isValidUrl){
        stream = ytdl(value, { filter: 'audioonly' })
      }else{
        interaction.followUp("Invalid YouTube Link")
      }
    break;
    case "spotify":
      
    break;
    default:
      
    break;
  }
  return stream
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
      let type;
      try {
        type = interaction.options.data[0].name;  
      } catch (error) {
        type = ""
      }
      if (type == "search") {
        interaction.reply(
          `Searching For ${interaction.options.data[0].value}`
        );
        await createChannelConnection(interaction);
        await subscribeChannelConnection(interaction);
      } else if (type == "youtube" || type == "spotify") {
        interaction.reply(`Fetching Your Audio!`);
        await createChannelConnection(interaction);
        await subscribeChannelConnection(interaction);
      }else{
        await interaction.reply("Command Error: Make Sure To Use Proper Options");
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
