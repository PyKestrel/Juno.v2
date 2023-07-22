const {
	Client,
	Intents,
	Integration,
	Collection,
	Interaction,
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Iterate through each sub-folder as folder
for (const folder of commandFolders) {
	// Joins commands path with the current sub-folder (ex: \juno.v2\commands\misc)
	const commandsPath = path.join(foldersPath, folder);
	// Reads all files ending with '.js' inside the sub-folder (ex: ping.js)
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	// Iterate through each file in current sub-folder
	for (const file of commandFiles) {
		// Joins the file to the command path (ex: \juno.v2\commands\misc\ping.js)
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}
}

const rest = new REST().setToken(token);

rest
	.put(Routes.applicationCommands(clientId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

// (async () => {
// 	try {
// 		console.log(
// 			`Started refreshing ${commands.length} application (/) commands.`
// 		);

//         const foldersPath = path.join(__dirname, 'commands');
//         const commands =

// 		// The put method is used to fully refresh all commands in the guild with the current set
// 		const data = await rest.put(
// 			Routes.applicationGuildCommands(clientId, guildId),
// 			{ body: commands }
// 		);

// 		console.log(
// 			`Successfully reloaded ${data.length} application (/) commands.`
// 		);
// 	} catch (error) {
// 		// And of course, make sure you catch and log any errors!
// 		console.error(error);
// 	}
// })();
