const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");

module.exports = {
  name: "setcolor",
  description: "Set the welcome embed color",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("setcolor")
    .setDescription("Set the welcome embed color")
    .addStringOption(option => 
      option.setName("color")
        .setDescription("Hex color code (e.g., #FF0000 for red)")
        .setRequired(true)),
  
  async execute(interaction, client) {
    let color = interaction.options.getString("color");
    
    // Validate hex color
    const hexPattern = /^#?([0-9A-Fa-f]{6})$/;
    if (!hexPattern.test(color)) {
      return interaction.reply({
        content: "Please provide a valid hex color code (e.g., #FF0000 or 6B4EFF).",
        ephemeral: true
      });
    }
    
    // Remove # if present
    color = color.replace('#', '');
    
    try {
      let welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        welcome = new Welcome({
          guildId: interaction.guild.id,
          message: {
            embed: {
              enabled: true,
              color: color
            }
          }
        });
      } else {
        if (!welcome.message.embed) welcome.message.embed = {};
        welcome.message.embed.color = color;
      }
      
      await welcome.save();
      
      const embed = new EmbedBuilder()
        .setColor(parseInt(color, 16))
        .setTitle("✅ Welcome Color Set")
        .setDescription(`Welcome embed color has been set to \`#${color}\``)
        .addFields(
          { name: "Preview", value: "This message shows the new color!", inline: false }
        )
        .setFooter({ text: `Set by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error("Error setting welcome color:", error);
      await interaction.reply({
        content: "There was an error setting the welcome color.",
        ephemeral: true
      });
    }
  }
};