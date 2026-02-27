const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");
const CanvasGenerator = require("../../../bot/utils/canvas.js");

module.exports = {
  name: "test",
  description: "Test your welcome settings",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test your welcome settings"),
  
  async execute(interaction, client) {
    await interaction.deferReply();
    
    try {
      const welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome || !welcome.enabled || !welcome.channelId) {
        return await interaction.editReply({
          content: "Welcome system is not fully configured. Please set a channel and message first."
        });
      }
      
      const channel = interaction.guild.channels.cache.get(welcome.channelId);
      
      if (!channel) {
        return await interaction.editReply({
          content: "The configured welcome channel no longer exists."
        });
      }
      
      // Generate test message
      let message = (welcome.message?.content || "Welcome {user} to {server}!")
        .replace(/{user}/g, interaction.user.toString())
        .replace(/{username}/g, interaction.user.username)
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount.toString());
      
      // Send test welcome
      if (welcome.canvas?.enabled) {
        try {
          const canvasBuffer = await CanvasGenerator.generateWelcomeImage(
            interaction.member,
            welcome.canvas.template || "classic"
          );
          
          const embed = new EmbedBuilder()
            .setColor(welcome.message?.embed?.color || client.colors.primary)
            .setDescription(message)
            .setImage("attachment://welcome.png")
            .setTimestamp();
          
          await channel.send({
            embeds: [embed],
            files: [{ attachment: canvasBuffer, name: "welcome.png" }]
          });
        } catch (error) {
          await channel.send(message);
        }
      } else if (welcome.imageUrl) {
        const embed = new EmbedBuilder()
          .setColor(welcome.message?.embed?.color || client.colors.primary)
          .setDescription(message)
          .setImage(welcome.imageUrl)
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(message);
      }
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.success)
        .setTitle("✅ Test Welcome Sent")
        .setDescription(`A test welcome message has been sent to ${channel}`)
        .setFooter({ text: `Tested by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error testing welcome:", error);
      await interaction.editReply({
        content: "There was an error testing your welcome settings."
      });
    }
  }
};