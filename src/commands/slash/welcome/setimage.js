const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "setimage",
  description: "Set a welcome image URL",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("setimage")
    .setDescription("Set a welcome image URL")
    .addStringOption(option => 
      option.setName("url")
        .setDescription("The image URL for welcome messages")
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName("remove")
        .setDescription("Remove the image?")
        .setRequired(false)),
  
  async execute(interaction, client) {
    const url = interaction.options.getString("url");
    const remove = interaction.options.getBoolean("remove") || false;
    
    // Validate URL if not removing
    if (!remove) {
      const urlPattern = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
      if (!urlPattern.test(url)) {
        return interaction.reply({
          content: "Please provide a valid image URL (png, jpg, jpeg, gif, webp).",
          ephemeral: true
        });
      }
    }
    
    try {
      let welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        welcome = new Welcome({
          guildId: interaction.guild.id,
          imageUrl: remove ? null : url
        });
      } else {
        welcome.imageUrl = remove ? null : url;
      }
      
      await welcome.save();
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.success)
        .setTitle(remove ? "✅ Welcome Image Removed" : "✅ Welcome Image Set")
        .setDescription(remove 
          ? "Welcome image has been removed." 
          : "Welcome image has been set.")
        .setFooter({ text: `Set by ${interaction.user.tag}` });
      
      if (!remove && url) {
        embed.setImage(url);
      }
      
      embed.setTimestamp();
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error setting welcome image:", error);
      await interaction.reply({
        content: "There was an error setting the welcome image.",
        ephemeral: true
      });
    }
  }
};