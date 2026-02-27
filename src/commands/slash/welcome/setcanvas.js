const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const Welcome = require("../../../bot/databases/schemas/welcomeSchema.js");
const CanvasGenerator = require("../../../bot/utils/canvas.js");

module.exports = {
  name: "setcanvas",
  description: "Configure welcome canvas images",
  category: "welcome",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("setcanvas")
    .setDescription("Configure welcome canvas images")
    .addBooleanOption(option => 
      option.setName("enabled")
        .setDescription("Enable canvas images?")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("template")
        .setDescription("Choose a canvas template")
        .setRequired(false)
        .addChoices(
          { name: "Classic", value: "classic" },
          { name: "Modern", value: "modern" },
          { name: "Gaming", value: "gaming" },
          { name: "Minimal", value: "minimal" }
        ))
    .addStringOption(option => 
      option.setName("background")
        .setDescription("Background color (hex)")
        .setRequired(false))
    .addStringOption(option => 
      option.setName("text_color")
        .setDescription("Text color (hex)")
        .setRequired(false))
    .addStringOption(option => 
      option.setName("accent_color")
        .setDescription("Accent color (hex)")
        .setRequired(false)),
  
  async execute(interaction, client) {
    const enabled = interaction.options.getBoolean("enabled");
    const template = interaction.options.getString("template") || "classic";
    const background = interaction.options.getString("background");
    const textColor = interaction.options.getString("text_color");
    const accentColor = interaction.options.getString("accent_color");
    
    // Validate hex colors if provided
    const hexPattern = /^#?([0-9A-Fa-f]{6})$/;
    
    if (background && !hexPattern.test(background)) {
      return interaction.reply({
        content: "Please provide a valid hex color for background (e.g., #2C2F33).",
        ephemeral: true
      });
    }
    
    if (textColor && !hexPattern.test(textColor)) {
      return interaction.reply({
        content: "Please provide a valid hex color for text (e.g., #FFFFFF).",
        ephemeral: true
      });
    }
    
    if (accentColor && !hexPattern.test(accentColor)) {
      return interaction.reply({
        content: "Please provide a valid hex color for accent (e.g., #6B4EFF).",
        ephemeral: true
      });
    }
    
    try {
      let welcome = await Welcome.findOne({ guildId: interaction.guild.id });
      
      if (!welcome) {
        welcome = new Welcome({
          guildId: interaction.guild.id,
          canvas: {
            enabled: enabled,
            template: template,
            background: background?.replace('#', '') || "#2C2F33",
            textColor: textColor?.replace('#', '') || "#FFFFFF",
            accentColor: accentColor?.replace('#', '') || "#6B4EFF"
          }
        });
      } else {
        if (!welcome.canvas) welcome.canvas = {};
        welcome.canvas.enabled = enabled;
        welcome.canvas.template = template;
        if (background) welcome.canvas.background = background.replace('#', '');
        if (textColor) welcome.canvas.textColor = textColor.replace('#', '');
        if (accentColor) welcome.canvas.accentColor = accentColor.replace('#', '');
      }
      
      await welcome.save();
      
      // Generate a preview if enabled
      let previewBuffer = null;
      if (enabled) {
        try {
          previewBuffer = await CanvasGenerator.generateWelcomeImage(
            interaction.member,
            template
          );
        } catch (error) {
          console.error("Error generating preview:", error);
        }
      }
      
      const embed = new EmbedBuilder()
        .setColor(client.colors.success)
        .setTitle(enabled ? "✅ Canvas Enabled" : "✅ Canvas Disabled")
        .setDescription(enabled 
          ? "Welcome canvas images have been enabled." 
          : "Welcome canvas images have been disabled.")
        .addFields(
          { name: "Template", value: template, inline: true },
          { name: "Background", value: background || "#2C2F33", inline: true },
          { name: "Text Color", value: textColor || "#FFFFFF", inline: true }
        )
        .setFooter({ text: `Set by ${interaction.user.tag}` })
        .setTimestamp();
      
      if (previewBuffer) {
        embed.setImage("attachment://preview.png");
        await interaction.reply({
          embeds: [embed],
          files: [{ attachment: previewBuffer, name: "preview.png" }]
        });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error("Error setting canvas:", error);
      await interaction.reply({
        content: "There was an error configuring canvas images.",
        ephemeral: true
      });
    }
  }
};