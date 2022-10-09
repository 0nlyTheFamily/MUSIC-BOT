86% penyimpanan digunakan … Anda dapat mengosongkan ruang penyimpanan atau mendapatkan penyimpanan ekstra untuk Drive, Gmail, dan Google Foto.
const SlashCommand = require("../../lib/SlashCommand");
const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const api = require('lyrics-searcher-musixmatch').default

const command = new SlashCommand()
	.setName("lyrics")
	.setDescription("Get the lyrics of a song")
	// get user input
	.addStringOption((option) =>
		option
			.setName("song")
			.setDescription("The song to get lyrics for")
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription("🔎 **Searching...**"),
			],
		});
		
		let player;
		if (client.manager) {
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("Lavalink node is not connected"),
				],
			});
		}
		
		const args = interaction.options.getString("song");
		if (!args && !player) {
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("There's nothing playing"),
				],
			});
		}
		
		let search = args? args : player.queue.current.title;
        api(search).then((lyrics) => {
		const button = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('tipsbutton')
					.setLabel('Tips')
					.setEmoji(`📌`)
					.setStyle('SECONDARY'),
				new MessageButton()
					.setLabel('Source')
					.setURL(lyrics.info.track.shareUrl)
					.setStyle('LINK'),
			);
			const text = lyrics.lyrics
			return interaction.editReply({ 
				embeds: [
					new MessageEmbed()
					.setColor(client.config.embedColor)
					.setTitle(`${ lyrics.info.track.name }`)
					.setURL(lyrics.info.track.shareUrl)
					.setThumbnail(lyrics.info.track.albumCoverart350x350)
                    .setFooter({ text: 'Lyrics provided by MusixMatch.', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Musixmatch_logo_icon_only.svg/480px-Musixmatch_logo_icon_only.svg.png' })
					.setDescription(text),
				],
				components: [button],
			
			});
		
		}) 
		.catch((err) => {	
			const button = new MessageActionRow()
			.addComponents(
				new MessageButton()
				    .setEmoji(`📌`)
				    .setCustomId('tipsbutton')
					.setLabel('Tips')
					.setStyle('SECONDARY'),
			);			
		return interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(
						`❌ | No lyrics found for ${ search }!.`,
					),
			],
			components: [button],
		});
	
	});

const collector = interaction.channel.createMessageComponentCollector({time: 1000 * 3600 });

collector.on('collect', async i => {
	if (i.customId === 'tipsbutton') {
		await i.deferUpdate();
		await i.followUp({ 			
		embeds: [
			new MessageEmbed()
			    .setTitle(`Lyrics Tips`)
			    .setColor(client.config.embedColor)
				.setDescription(
					`Here is some tips to get your song lyrics correctly \n\n1. Try to add Artist name in front of the song name.\n2. Try to put the song name in the lyrics search box manually using your keyboard.\n3. Avoid using non english language when searching song lyrics, except the song itself doesnt use english language.`,
				),
		], ephemeral: true, components: [] });
	}
});



	});

module.exports = command;
