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
const play = require("play-dl");
const yts = require("yt-search");

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

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
        .setDescription(
          "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=e018a665dc3a428d"
        )
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("Disconnect Juno from Voice Channel"),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current playing song!"),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);

// Voice Channel Functions

// Global Music Queue
let globalMusicQueue = [];

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
  // Grab Channel ID
  const channel = interaction.member.voice.channel;
  // Grab Existing Voice Connection
  const connection = getVoiceConnection(channel.guild.id);
  //Destroy The Connection
  try {
    globalMusicQueue = [];
    connection.destroy();
  } catch (error) {
    console.log(error);
  }
}

/*

The subscribeChannelConnection is the next step in the Voice Channel connection and is in charge of streaming the actual aduio to the voice channel.
The function is in charge of building the audioPLayer object that will hold our audio stream.

*/
// Audio Player Object Instantiation
let player;
async function subscribeChannelConnection(interaction) {
  // Get Voice Channel ID & Connect To Voice Channel
  const channel = interaction.member.voice.channel;

  // Check If There Is An Existing Connection
  if (typeof getVoiceConnection(channel.guild.id) === "undefined") {
    // Audio Player Object Instantiation
    player = createAudioPlayer();
    // Create Audio Resource From Stream
    await createChannelConnection(interaction);
    const connection = getVoiceConnection(channel.guild.id);

    // Create Subscription
    connection.subscribe(player);
    // Play YTDL Stream
    player.play(await BuildAudioStream());
    // Sending Pre-Made embed that states we're fecthing the audio
    interaction.channel.send({ embeds: [audioFetchEmbed] });
  } else {
    // Reply That The Song Has Been Added To The Queue
    interaction.followUp("Song Added To Queue!");
  }
  player.on(AudioPlayerStatus.Playing, async () => {});
  player.on(AudioPlayerStatus.Idle, async () => {
    /* 
    
    1. When AudioPlayerStatus is idle, check the length of the globalMusicQueue. If the length is greater than 1, shift the array and call the BuildAudioStream function.
    2. If the length is equal to 1, build the last stream.
    3. Otherwise, call the deleteChannelConnection function.

    */
   
    if (globalMusicQueue.length > 1) {
      globalMusicQueue.shift();
      player.play(await BuildAudioStream());
    } else if (globalMusicQueue.length == 1) {
      player.play(await BuildAudioStream());
      globalMusicQueue.shift();
    } else {
      deleteChannelConnection(interaction);
    }
  });
}

/*

The audioParser function is used to take a search string or link and find an associated youtube audio.

*/
async function audioParser(interaction) {
  // Option variable contains the option selected i.e Search, Youtube or Spotify
  let option = interaction.options.data[0].name;
  // Value variable contains the value passed to the play command, could be a search phrase or youtube link
  let value = interaction.options.data[0].value;
  // Initiating the stream variable that will contain the stream object in the future
  let stream;

  /* 
  
  Switch & Case statement that checks what option was chosen.

  */
  switch (option) {
    case "search":
      // Query the passed search value and then return the first YouTube video that matches it.
      let yt_info = await play.search(value, {
        limit: 1,
      });

      // Push YouTube Link To Global Music Queue Array
      globalMusicQueue.push(yt_info[0].url);
      //interaction.channel.send({ embeds: [createPlayingEmbed(yt_info[0])] });
      break;
    case "youtube":
      // Use regex to verify that the link is a valid YouTube link
      const regex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com/;
      const isValidUrl = regex.test(value);

      // Validate URL
      if (isValidUrl) {
        // Check if the link is a playlist
        if (value.includes("playlist")) {
          // Parse YouTube Playlist
          const playlist = await play.playlist_info(value);
          // Get Info For Each Video
          const videos = await playlist.all_videos();
          // For Each Video Object Get The URL and Push It To The Music Queue
          videos.forEach((element) => {
            console.log(element.url);
            globalMusicQueue.push(element.url);
          });
        } else {
          // PlayDL Version
          // Get video information from YouTube link.
          let yt_info = await play.video_info(value);

          // Push YouTube Link To Global Music Queue Array
          globalMusicQueue.push(yt_info.video_details.url);
        }
      } else {
        // "Catch All For YouTube"
        interaction.followUp("Invalid YouTube Link");
      }
      break;
    case "spotify":
      // NOTE ADD SPOTIFY LINK VALIDATION

      // Check Spotify Link Details
      let result = await play.spotify(value);
      console.log(result.name);
      break;
    default:
      break;
  }
}

/* 

The buildAudioStream Function is designed to grabs the first link in the array, creates a stream object, and builds and returns an AudioResource.
It should be called when a song finishes, so that the next song can be played.

*/

async function BuildAudioStream() {
  // Grab YouTube Link From Global Music Queue Array
  let NextSong = globalMusicQueue[0];

  // Pass URL to the stream function of the play object, assign this object to the stream variable.
  let stream = await play.stream(NextSong);

  // Create AudioResource Object
  let resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  // Return Audio Resource Object
  return resource;
}

/*

The audioSkip function is called when a user uses the /skip switch. This function will remove the current playing song and then play the next song.

It will check the length of the array and determine whether to skip the song or disconnect the bot.

*/

async function audioSkip(interaction) {
  /* 
    
    1. Check the length of the globalMusicQueue. If the length is greater than 1, shift the array and call the BuildAudioStream function.
    2. If the length is equal to 1, call the deleteChannelConnection function.
    3. Catch all, call the deleteChannelConnection function

    */
  if (globalMusicQueue.length > 1) {
    interaction.reply("Skipping Song");
    globalMusicQueue.shift();
    player.play(await BuildAudioStream());
  } else if (globalMusicQueue.length == 1) {
    interaction.reply("No More Songs, Disconnecting.");
    deleteChannelConnection(interaction);
    globalMusicQueue.shift();
  } else {
    deleteChannelConnection(interaction);
  }
}

/*

Embeds Related To Audio Functions

*/

const audioFetchEmbed = {
  title: "Searching for your Audio !",
  description: "Give us a few moments to get that for you!\n",
  color: 4321431,
  timestamp: new Date().toISOString(),
  url: "https://discord.com",
  author: {
    name: "Juno",
    url: "https://discord.com",
    icon_url:
      "https://cdn.discordapp.com/app-icons/1091691524640739420/1bec178a15e9c19dd2db579de06cd399.png?size=256",
  },
  thumbnail: {
    url: "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2F49.media.tumblr.com%2Ff8ed2ebb7347d939ef2678f478c17d6e%2Ftumblr_nyc3qlk8Nq1usv6kvo1_500.gif&f=1&nofb=1&ipt=6012f21e812cd0daf881bba6c3e3225b1a512cd7373f97914243237d8d616db3&ipo=images",
  },
  footer: {
    icon_url:
      "https://cdn.discordapp.com/app-icons/1091691524640739420/1bec178a15e9c19dd2db579de06cd399.png?size=256",
    text: "Coligo Studios",
  },
};

/*

THIS EMBED BREAKS DISCORD JS

function createPlayingEmbed(Info){
  const nowPlayingEmbed = {
    title: "Now Playing | "+Info.title,
    color: 4321431,
    timestamp: "2023-04-02T15:12:32.251Z",
    url: "https://discord.com",
    author: {
      name: "Juno",
      url: "https://discord.com",
      icon_url:
        "https://cdn.discordapp.com/app-icons/1091691524640739420/1bec178a15e9c19dd2db579de06cd399.png?size=256",
    },
    footer: {
      icon_url:
        "https://cdn.discordapp.com/app-icons/1091691524640739420/1bec178a15e9c19dd2db579de06cd399.png?size=256",
      text: "Coligo Studios",
    },
    image: {
      url: Info.thumbnails[Info.thumbnails.length - 1].url,
    },
  };
  return nowPlayingEmbed
}
*/

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
      /*
      
      The Try Catch performs error handling for when the command is used but no option is chosen, the type value is given a default value and will not trigger the conditional statements below.

      Without it the program will throw an undefined value error and exit.
      
      */
      try {
        type = interaction.options.data[0].name;

        // Replying so that the user doesnt get an bot didnt reply error
        interaction.reply("Thinking");
        // Immediately deleting the reply
        interaction.deleteReply();
        // Calling functions to initiate the audio stream.
        await audioParser(interaction);
        await subscribeChannelConnection(interaction);
      } catch (error) {
        console.log(error);
      }
      break;
    case "skip":
      await audioSkip(interaction);
      break;
    case "disconnect":
      // Let user know that the bot is disconnecting from VC
      await interaction.reply("Disconnecting...");
      // Call disconnect function
      await deleteChannelConnection(interaction);
      // Delete previous message.
      await interaction.deleteReply();
      break;
    default:
      break;
  }
});

// Login to Discord with your client's token
client.login(token);
