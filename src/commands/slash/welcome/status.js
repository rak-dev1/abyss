const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "status",
  description: "View welcome system status",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("View welcome system status"),
  
  async execute(interaction, client) {
    try {
      const welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.primary)
        .setTitle("👋 Welcome System Status")
        .setDescription(welcome?.enabled ? "✅ **Enabled**" : "❌ **Disabled**")
        .addFields(
          {
            name: "Channel",
            value: welcome?.channelId ? `<#${welcome.channelId}>` : "Not set",
            inline: true
          },
          {
            name: "Message",
            value: welcome?.message?.content ? "✅ Set" : "❌ Not set",
            inline: true
          },
          {
            name: "Canvas",
            value: welcome?.canvas?.enabled ? "✅ Enabled" : "❌ Disabled",
            inline: true
          },
          {
            name: "Image URL",
            value: welcome?.imageUrl ? "✅ Set" : "❌ Not set",
            inline: true
          },
          {
            name: "DM on Join",
            value: welcome?.dm?.enabled ? "✅ Yes" : "❌ No",
            inline: true
          },
          {
            name: "Auto Role",
            value: welcome?.autoRole?.enabled ? "✅ Yes" : "❌ No",
            inline: true
          }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
      
      if (welcome?.message?.content) {
        const preview = welcome.message.content
          .replace(/{user}/g, interaction.user.toString())
          .replace(/{username}/g, interaction.user.username)
          .replace(/{server}/g, interaction.guild.name)
          .replace(/{memberCount}/g, interaction.guild.memberCount.toString());
        
        embed.addFields({ name: "Message Preview", value: preview, inline: false });
      }
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error getting welcome status:", error);
      await interaction.reply({
        content: "There was an error fetching welcome status.",
        ephemeral: true
      });
    }
  }
};