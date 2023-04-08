# Juno.v2
 Juno Discord bot for Discord.JS v13.  Reworked legacy functions!

## Voice Channel Functions
The CreateChannelConnection function receives the interaction object when a user triggers the /play slash command. We use the interaction object to retrieve information about the VoiceChannel that the user is in and pass that information to the joinVoiceChannel function.

The DeleteChannelConnection function receives the interaction object when a user triggers the /disconnect slash command. We use the interaction object to retrieve the active voice connection within the guild and then destroy it, disconnecting the bot.

The subscribeChannelConnection function is responsible for streaming the actual audio to the voice channel. It creates the audioPlayer object that holds our audio stream.

The audioParser function is used to take a search string or link and find the associated YouTube audio.

The buildAudioStream function grabs the first link in the array, creates a stream object, and builds and returns an AudioResource. This function should be called when a song finishes playing, so that the next song can be played.

The audioSkip function is called when a user uses the /skip switch. It removes the currently playing song and plays the next song. The function checks the length of the array and determines whether to skip the song or disconnect the bot.
