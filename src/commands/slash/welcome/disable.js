const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "disable",
  description: "Disable welcome messages",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("disable")
    .setDescription("Disable welcome messages"),
  
  async execute(interaction, client) {
    try {
      const welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        return interaction.reply({
          content: "Welcome system is not configured.",
          ephemeral: true
        });
      }
      
      welcome.enabled = false;
      await welcome.save();
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.warning)
        .setTitle("✅ Welcome Disabled")
        .setDescription("Welcome messages have been disabled.")
        .setFooter({ text: `Disabled by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error disabling welcome:", error);
      await interaction.reply({
        content: "There was an error disabling welcome messages.",
        ephemeral: true
      });
    }
  }
};