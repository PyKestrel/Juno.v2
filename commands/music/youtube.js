const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription(
			'Search For Music, Play Songs/Playlists From YouTube or Spotify!'
		)
		.addStringOption((option) =>
			option
				.setName('search')
				.setDescription('Never Gonna Give You Up')
				.setRequired()
		)
		.addStringOption((option) =>
			option
				.setName('youtube')
				.setDescription('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName('spotify')
				.setDescription(
					'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=e018a665dc3a428d'
				)
				.setRequired(false)
		),
};
