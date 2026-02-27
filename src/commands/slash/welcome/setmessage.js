const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "setmessage",
  description: "Set the welcome message",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("setmessage")
    .setDescription("Set the welcome message")
    .addStringOption(option => 
      option.setName("message")
        .setDescription("The welcome message (use {user} for mention, {server} for server name)")
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName("embed")
        .setDescription("Send as embed?")
        .setRequired(false)),
  
  async execute(interaction, client) {
    const message = interaction.options.getString("message");
    const useEmbed = interaction.options.getBoolean("embed") || false;
    
    // Validate message length
    if (message.length > 1000) {
      return interaction.reply({
        content: "Welcome message must be less than 1000 characters.",
        ephemeral: true
      });
    }
    
    try {
      let welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        welcome = new Welcome({
          guildId: interaction.guild.id,
          message: {
            content: message,
            embed: {
              enabled: useEmbed,
              title: "Welcome!",
              description: message,
              color: "#6B4EFF"
            }
          }
        });
      } else {
        welcome.message.content = message;
        if (useEmbed) {
          if (!welcome.message.embed) welcome.message.embed = {};
          welcome.message.embed.enabled = true;
          welcome.message.embed.description = message;
        } else {
          if (welcome.message.embed) welcome.message.embed.enabled = false;
        }
      }
      
      await welcome.save();
      
      // Preview the message
      const preview = message
        .replace(/{user}/g, interaction.user.toString())
        .replace(/{username}/g, interaction.user.username)
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, interaction.guild.memberCount.toString());
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.success)
        .setTitle("✅ Welcome Message Set")
        .setDescription("Welcome message has been updated.")
        .addFields(
          { name: "Preview", value: preview, inline: false },
          { name: "Format", value: useEmbed ? "Embed" : "Text", inline: true }
        )
        .setFooter({ text: `Set by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error setting welcome message:", error);
      await interaction.reply({
        content: "There was an error setting the welcome message.",
        ephemeral: true
      });
    }
  }
};