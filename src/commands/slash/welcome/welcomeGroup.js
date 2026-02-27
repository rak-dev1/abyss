const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "welcome",
  description: "Welcome system commands",
  category: "welcome",
  
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome system commands")
    .addSubcommand(sub => 
      sub.setName("help")
         .setDescription("Show welcome commands help")),
  
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(client.colors.primary)
      .setTitle("👋 Welcome Commands")
      .setDescription("Configure your welcome system")
      .addFields(
        { name: "`/welcome setchannel`", value: "Set the welcome channel", inline: false },
        { name: "`/welcome setmessage`", value: "Set the welcome message", inline: false },
        { name: "`/welcome setimage`", value: "Set a welcome image", inline: false },
        { name: "`/welcome setcolor`", value: "Set the embed color", inline: false },
        { name: "`/welcome setcanvas`", value: "Configure canvas images", inline: false },
        { name: "`/welcome test`", value: "Test your welcome settings", inline: false },
        { name: "`/welcome disable`", value: "Disable welcome messages", inline: false },
        { name: "`/welcome status`", value: "View welcome system status", inline: false }
      )
      .setFooter({ text: "Use /help for all commands" })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};