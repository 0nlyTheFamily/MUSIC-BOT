const SlashCommand = require("../../lib/SlashCommand");
const {
  MessageActionRow,
  MessageSelectMenu,
  MessageButton,
  MessageEmbed
} = require("discord.js");
const lyricsFinder = require('lyrics-finder');

const command = new SlashCommand()
  .setName("lyrics")
  .setDescription("Get the lyrics of a song")
  .addStringOption((option) =>
    option
      .setName("song")
      .setDescription("The song to get lyrics for")
      .setRequired(false),
  )
  .setRun(async (client, interaction, options) => {
    const loadingEmbed = new MessageEmbed()
      .setColor("#7289da")
      .setTitle("🔍 Searching...")
      .setDescription("Please wait while we search for the lyrics...");

    await interaction.reply({
      embeds: [loadingEmbed],
    });

    let player;
    if (client.manager && client.manager.players.has(interaction.guild.id)) {
      player = client.manager.players.get(interaction.guild.id);
    } else {
      const errorEmbed = new MessageEmbed()
        .setColor("#FF0000")
        .setTitle("❌ Error")
        .setDescription("Could not find lyrics because the bot is not playing music.");

      return interaction.editReply({
        embeds: [errorEmbed],
      });
    }

    const args = interaction.options.getString("song");
    if (!args && !player) {
      const errorEmbed = new MessageEmbed()
        .setColor("#FF0000")
        .setTitle("❌ Error")
        .setDescription("Could not find lyrics because there is no song playing.");

      return interaction.editReply({
        embeds: [errorEmbed],
      });
    }

    let currentTitle = ``;
    const phrasesToRemove = [
      "Full Video", "Full Audio", "Official Music Video", "Lyrics", "Lyrical Video",
      "Feat.", "Ft.", "Official", "Audio", "Video", "HD", "4K", "Remix", "Lyric Video", "Lyrics Video", "8K", 
      "High Quality", "Animation Video", "\\(Official Video\\. .*\\)", "\\(Music Video\\. .*\\)", "\\[NCS Release\\]",
      "Extended", "DJ Edit", "with Lyrics", "Lyrics", "Karaoke",
      "Instrumental", "Live", "Acoustic", "Cover", "\\(feat\\. .*\\)"
    ];
    if (!args) {
      currentTitle = player.queue.current.title;
      currentTitle = currentTitle
        .replace(new RegExp(phrasesToRemove.join('|'), 'gi'), '')
        .replace(/\s*([\[\(].*?[\]\)])?\s*(\|.*)?\s*(\*.*)?$/, '');
    }
    let query = args ? args : currentTitle;

    const lyrics = await lyricsFinder(query) || "No lyrics found";

    if (lyrics === "No lyrics found") {
      const errorEmbed = new MessageEmbed()
        .setColor("#FF0000")
        .setTitle("❌ Error")
        .setDescription(`Could not find lyrics for \`${query}\`. Please make sure you typed the song name correctly.`);

      const tipsButton = new MessageButton()
        .setCustomId('tipsbutton')
        .setLabel('Tips')
        .setEmoji(`📌`)
        .setStyle('SECONDARY');

      const errorRow = new MessageActionRow()
        .addComponents(tipsButton);

      return interaction.editReply({
        embeds: [errorEmbed],
        components: [errorRow],
      });
    }

    const lyricsEmbed = new MessageEmbed()
      .setColor("#1DB954")
      .setTitle(`${query} lyrics`)
      .setDescription(lyrics)
      .setFooter(`Lyrics provided by lyrics-finder`);

    if (lyrics.length > 4096) {
      lyricsEmbed.setDescription(`${lyrics.substring(0, 4093)}...`);
    }

    const tipsButton = new MessageButton()
      .setCustomId('tipsbutton')
      .setLabel('Tips')
      .setEmoji(`📌`)
      .setStyle('SECONDARY');

    const tipsRow = new MessageActionRow()
      .addComponents(tipsButton);

    await interaction.editReply({
      embeds: [lyricsEmbed],
      components: [tipsRow],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 1000 * 3600
    });

    collector.on('collect', async interaction => {
      if (interaction.customId === 'tipsbutton') {
        const tipsEmbed = new MessageEmbed()
          .setTitle(`🔍 Lyrics Tips`)
          .setColor("#FFA500")
          .setDescription(
            `Here are some tips to help you find the lyrics for your favoritesongs:\n\n• Try searching for the song title followed by the artist name\n• If the song has a unique phrase or lyric, try searching for that instead\n• Check the artist's official website or social media for lyrics or announcements about upcoming releases\n• Use lyrics databases like Genius or AZLyrics\n• Ask other music fans on forums or social media if they know the lyrics\n• Use a lyrics-finding bot on Discord, such as the \`lyrics-finder\` bot`
          );

        await interaction.update({
          embeds: [tipsEmbed],
          components: [],
        });
      }
    });

    collector.on('end', async () => {
      if (!tipsRow.components[0].disabled) {
        tipsRow.components[0].setDisabled(true);
        await interaction.editReply({
          components: [tipsRow],
        });
      }
    });
  });

module.exports = command;
