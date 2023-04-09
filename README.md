![JunoBannerGithub2](https://user-images.githubusercontent.com/42158489/230739410-7d1a9c55-a193-4647-8f5d-15a92e6ba4cc.png)
***
![GitHub language count](https://img.shields.io/github/languages/count/pykestrel/juno.v2?color=33E9E0)
![GitHub repo file count](https://img.shields.io/github/directory-file-count/pykestrel/juno.v2?color=33E9E0)
![GitHub commit activity](https://img.shields.io/github/commit-activity/w/pykestrel/juno.v2?color=33E9E0)
![GitHub](https://img.shields.io/github/license/pykestrel/juno.v2?color=33E9E0)

 Allow us to introduce Juno, a refreshed Discord bot template for DiscordJS v13. With updated features and functionality, Juno is ready to take your Discord server to the next level!
 > Originally built in 2020, Juno was in need of a major overhaul to bring it up to date with the latest standards and technologies. We've worked hard to refresh Juno and equip it with the latest features and capabilities for an even better user experience.
 
The refresh includes:

- Reworked legacy functions, bringing improved performance and stability to Juno!
- Introduction of a new music queue system, along with the same great music features that users love!
- Support for Spotify & YouTube links, providing even more options for users to enjoy their favorite tunes! New
- Role Management System (RMS) to help manage and organize your Discord community.
- Twitch Drop Notifier and much more!

> Juno is a community-driven project designed to be customizable and modifiable by anyone. We encourage all users to contribute to the Discord community by creating new features that entertain and help everyone.

![JunoSlashBanner](https://user-images.githubusercontent.com/42158489/230748776-05d0410d-e7ca-4849-a75f-08e06774b532.png)
***
### [Slash Commands: Voice](#VoiceCommands)
> Search For Music, Play Songs/Playlists From YouTube or Spotify!
+ `/play`
  + `search` - Search the title of the song you would like to listen to!
  + `youtube` - Provide a valid YouTube link that you would like to listen to!
  + `spotify` - Provide a valid Spotify link that you would like to listen to!

> Disconnect The Bot & Clear The Music Queue
+ `/disconnect`

> Skip Current Playing Song
+ `/skip`

***
![JunoUnderTheHood](https://user-images.githubusercontent.com/42158489/230749668-f80de1c0-de7f-4522-84e7-5597527cb2ec.png)
> In the following sections, we will dive into Juno in more technical detail, focusing on how the slash commands work under the hood. This will give you insight into how we designed the various features and split the functions to create a cohesive and effective bot.
***
### [](#UnderTheHood)
![JunoVCBanner2](https://user-images.githubusercontent.com/42158489/230749579-f476afc1-3121-4252-8cfe-8e4769a7fec7.png)
***
<sub>*Updated 04/08/2023 - May Not Reflect Current Build*</sub>

The **CreateChannelConnection** function receives the interaction object when a user triggers the `/play` slash command. We use the interaction object to retrieve information about the VoiceChannel that the user is in and pass that information to the joinVoiceChannel function.
```javascript
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
```
The **DeleteChannelConnection** function receives the interaction object when a user triggers the `/disconnect` slash command. We use the interaction object to retrieve the active voice connection within the guild and then destroy it, disconnecting the bot.
```javascript
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
```
The **subscribeChannelConnection** function is responsible for streaming the actual audio to the voice channel. The function is in charge of building the player object that will hold our audio stream.
```javascript
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

    // Send Now Playing Embed
    await nowPlayingEmbed(interaction);
    // Play YTDL Stream
    player.play(await BuildAudioStream());
    globalMusicQueue.shift();
  } else {
    // Reply That The Song Has Been Added To The Queue
    interaction.channel.send("Song Added To Queue!");
  }
  player.on(AudioPlayerStatus.Playing, async () => {});
  player.on(AudioPlayerStatus.Idle, async () => {
    /* 
    
    1. When AudioPlayerStatus is idle, check the length of the globalMusicQueue. If the length is greater than 1, shift the array and call the BuildAudioStream function.
    2. If the length is equal to 1, build the last stream.
    3. Otherwise, call the deleteChannelConnection function.

    */

    if (globalMusicQueue.length >= 1) {
      await nowPlayingEmbed(interaction);
      console.log("Idle Embed Kicked Off");
      player.play(await BuildAudioStream());
      globalMusicQueue.shift();
    } else {
      deleteChannelConnection(interaction);
    }
  });
}
```
The **audioParser** function is used to take a search string or link and find the associated YouTube audio.
```javascript
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
      globalMusicQueue.push(yt_info[0]);
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
            globalMusicQueue.push(element);
          });
        } else {
          // PlayDL Version
          // Get video information from YouTube link.
          let yt_info = await play.video_info(value);

          // Push YouTube Link To Global Music Queue Array
          globalMusicQueue.push(yt_info.video_details);
        }
      } else {
        // "Catch All For YouTube"
        interaction.channel.send("Invalid YouTube Link");
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
```

The **buildAudioStream** function grabs the first link in the array, creates a stream object, and builds and returns an AudioResource. This function should be called when a song finishes playing, so that the next song can be played.
```javascript
async function BuildAudioStream() {
  // Grab YouTube Link From Global Music Queue Array
  let NextSong = globalMusicQueue[0].url;

  // Pass URL to the stream function of the play object, assign this object to the stream variable.
  let stream = await play.stream(NextSong);

  // Create AudioResource Object
  let resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  // Return Audio Resource Object
  return resource;
}
```
The **audioSkip** function is called when a user uses the `/skip` switch. It removes the currently playing song and plays the next song. The function checks the length of the array and determines whether to skip the song or disconnect the bot.

```javascript
async function audioSkip(interaction) {
  /* 
    
    1. Check the length of the globalMusicQueue. If the length is greater than 1, shift the array and call the BuildAudioStream function.
    2. If the length is equal to 1, call the deleteChannelConnection function.
    3. Catch all, call the deleteChannelConnection function

    */
  if (globalMusicQueue.length >= 1) {
    interaction.reply("Skipping Song");
    await nowPlayingEmbed(interaction);
    player.play(await BuildAudioStream());
    globalMusicQueue.shift();
  } else {
    interaction.reply("No More Songs, Disconnecting.");
    deleteChannelConnection(interaction);
  }
}
```
<sub>[Coligo Studio](https://coligo.one)</sub>
