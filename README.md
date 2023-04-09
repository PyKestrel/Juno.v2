![JunoBannerGithub2](https://user-images.githubusercontent.com/42158489/230739410-7d1a9c55-a193-4647-8f5d-15a92e6ba4cc.png)
##
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

## ![JunoVCBanner2](https://user-images.githubusercontent.com/42158489/230748562-3838948f-bb3f-43b7-98eb-fffeb251000d.png)
The **CreateChannelConnection** function receives the interaction object when a user triggers the `/play` slash command. We use the interaction object to retrieve information about the VoiceChannel that the user is in and pass that information to the joinVoiceChannel function.

The **DeleteChannelConnection** function receives the interaction object when a user triggers the `/disconnect` slash command. We use the interaction object to retrieve the active voice connection within the guild and then destroy it, disconnecting the bot.

The **subscribeChannelConnection** function is responsible for streaming the actual audio to the voice channel. It creates the audioPlayer object that holds our audio stream.

The **audioParser** function is used to take a search string or link and find the associated YouTube audio.

The **buildAudioStream** function grabs the first link in the array, creates a stream object, and builds and returns an AudioResource. This function should be called when a song finishes playing, so that the next song can be played.

The **audioSkip** function is called when a user uses the `/skip` switch. It removes the currently playing song and plays the next song. The function checks the length of the array and determines whether to skip the song or disconnect the bot.
