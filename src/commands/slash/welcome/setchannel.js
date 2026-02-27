const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "setchannel",
  description: "Set the welcome channel",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set the welcome channel")
    .addChannelOption(option => 
      option.setName("channel")
        .setDescription("The channel to send welcome messages")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),
  
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");
    
    try {
      let welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        welcome = new Welcome({
          guildId: interaction.guild.id,
          channelId: channel.id,
          enabled: true
        });
      } else {
        welcome.channelId = channel.id;
        welcome.enabled = true;
      }
      
      await welcome.save();
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.success)
        .setTitle("✅ Welcome Channel Set")
        .setDescription(`Welcome messages will now be sent to ${channel}`)
        .setFooter({ text: `Set by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error setting welcome channel:", error);
      await interaction.reply({
        content: "There was an error setting the welcome channel.",
        ephemeral: true
      });
    }
  }
};