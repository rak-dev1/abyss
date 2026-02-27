const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionsBitField,
  ChannelType 
} = require("discord.js");
const Goodbye = require("../../../bot/databases/schemas/goodbyeSchema.js");
const CanvasGenerator = require("../../../bot/utils/canvas.js");

module.exports = {
  name: "goodbye",
  description: "Goodbye system commands",
  category: "goodbye",
  permissions: [PermissionsBitField.Flags.ManageGuild],
  
  data: new SlashCommandBuilder()
    .setName("goodbye")
    .setDescription("Configure goodbye messages")
    
    // ===== SETCHANNEL SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("setchannel")
         .setDescription("Set the goodbye channel")
         .addChannelOption(opt => 
           opt.setName("channel")
              .setDescription("The channel to send goodbye messages")
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)))
    
    // ===== SETMESSAGE SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("setmessage")
         .setDescription("Set the goodbye message")
         .addStringOption(opt => 
           opt.setName("message")
              .setDescription("The goodbye message (use {user} for username, {server} for server name)")
              .setRequired(true))
         .addBooleanOption(opt => 
           opt.setName("embed")
              .setDescription("Send as embed?")
              .setRequired(false)))
    
    // ===== SETIMAGE SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("setimage")
         .setDescription("Set a goodbye image URL")
         .addStringOption(opt => 
           opt.setName("url")
              .setDescription("The image URL for goodbye messages")
              .setRequired(true))
         .addBooleanOption(opt => 
           opt.setName("remove")
              .setDescription("Remove the image?")
              .setRequired(false)))
    
    // ===== SETCOLOR SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("setcolor")
         .setDescription("Set the goodbye embed color")
         .addStringOption(opt => 
           opt.setName("color")
              .setDescription("Hex color code (e.g., #FF0000 for red)")
              .setRequired(true)))
    
    // ===== SETCANVAS SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("setcanvas")
         .setDescription("Configure goodbye canvas images")
         .addBooleanOption(opt => 
           opt.setName("enabled")
              .setDescription("Enable canvas images?")
              .setRequired(true))
         .addStringOption(opt => 
           opt.setName("template")
              .setDescription("Choose a canvas template")
              .setRequired(false)
              .addChoices(
                { name: "Classic", value: "classic" },
                { name: "Modern", value: "modern" },
                { name: "Gaming", value: "gaming" },
                { name: "Minimal", value: "minimal" }
              ))
         .addStringOption(opt => 
           opt.setName("background")
              .setDescription("Background color (hex)")
              .setRequired(false))
         .addStringOption(opt => 
           opt.setName("text_color")
              .setDescription("Text color (hex)")
              .setRequired(false))
         .addStringOption(opt => 
           opt.setName("accent_color")
              .setDescription("Accent color (hex)")
              .setRequired(false)))
    
    // ===== TEST SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("test")
         .setDescription("Test your goodbye settings"))
    
    // ===== DISABLE SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("disable")
         .setDescription("Disable goodbye messages"))
    
    // ===== STATUS SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("status")
         .setDescription("View goodbye system status"))
    
    // ===== HELP SUBCOMMAND =====
    .addSubcommand(sub => 
      sub.setName("help")
         .setDescription("Show goodbye commands help")),
  
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case "setchannel":
        await handleSetChannel(interaction, client);
        break;
      case "setmessage":
        await handleSetMessage(interaction, client);
        break;
      case "setimage":
        await handleSetImage(interaction, client);
        break;
      case "setcolor":
        await handleSetColor(interaction, client);
        break;
      case "setcanvas":
        await handleSetCanvas(interaction, client);
        break;
      case "test":
        await handleTest(interaction, client);
        break;
      case "disable":
        await handleDisable(interaction, client);
        break;
      case "status":
        await handleStatus(interaction, client);
        break;
      case "help":
        await handleHelp(interaction, client);
        break;
    }
  }
};

// ===== HANDLER FUNCTIONS =====

async function handleSetChannel(interaction, client) {
  const channel = interaction.options.getChannel("channel");
  
  try {
    let goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      goodbye = new Goodbye({
        guildId: interaction.guild.id,
        channelId: channel.id,
        enabled: true
      });
    } else {
      goodbye.channelId = channel.id;
      goodbye.enabled = true;
    }
    
    await goodbye.save();
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.success)
      .setTitle("✅ Goodbye Channel Set")
      .setDescription(`Goodbye messages will now be sent to ${channel}`)
      .setFooter({ text: `Set by ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error setting goodbye channel:", error);
    await interaction.reply({
      content: "There was an error setting the goodbye channel.",
      ephemeral: true
    });
  }
}

async function handleSetMessage(interaction, client) {
  const message = interaction.options.getString("message");
  const useEmbed = interaction.options.getBoolean("embed") || false;
  
  if (message.length > 1000) {
    return interaction.reply({
      content: "Goodbye message must be less than 1000 characters.",
      ephemeral: true
    });
  }
  
  try {
    let goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      goodbye = new Goodbye({
        guildId: interaction.guild.id,
        message: {
          content: message,
          embed: {
            enabled: useEmbed,
            title: "Goodbye!",
            description: message,
            color: "#ED4245"
          }
        }
      });
    } else {
      goodbye.message.content = message;
      if (useEmbed) {
        if (!goodbye.message.embed) goodbye.message.embed = {};
        goodbye.message.embed.enabled = true;
        goodbye.message.embed.description = message;
      } else {
        if (goodbye.message.embed) goodbye.message.embed.enabled = false;
      }
    }
    
    await goodbye.save();
    
    const preview = message
      .replace(/{user}/g, interaction.user.username)
      .replace(/{server}/g, interaction.guild.name)
      .replace(/{memberCount}/g, (interaction.guild.memberCount - 1).toString());
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.success)
      .setTitle("✅ Goodbye Message Set")
      .setDescription("Goodbye message has been updated.")
      .addFields(
        { name: "Preview", value: preview, inline: false },
        { name: "Format", value: useEmbed ? "Embed" : "Text", inline: true }
      )
      .setFooter({ text: `Set by ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error setting goodbye message:", error);
    await interaction.reply({
      content: "There was an error setting the goodbye message.",
      ephemeral: true
    });
  }
}

async function handleSetImage(interaction, client) {
  const url = interaction.options.getString("url");
  const remove = interaction.options.getBoolean("remove") || false;
  
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
    let goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      goodbye = new Goodbye({
        guildId: interaction.guild.id,
        imageUrl: remove ? null : url
      });
    } else {
      goodbye.imageUrl = remove ? null : url;
    }
    
    await goodbye.save();
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.success)
      .setTitle(remove ? "✅ Goodbye Image Removed" : "✅ Goodbye Image Set")
      .setDescription(remove ? "Goodbye image has been removed." : "Goodbye image has been set.")
      .setFooter({ text: `Set by ${interaction.user.tag}` });
    
    if (!remove && url) {
      embed.setImage(url);
    }
    
    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error setting goodbye image:", error);
    await interaction.reply({
      content: "There was an error setting the goodbye image.",
      ephemeral: true
    });
  }
}

async function handleSetColor(interaction, client) {
  let color = interaction.options.getString("color");
  
  const hexPattern = /^#?([0-9A-Fa-f]{6})$/;
  if (!hexPattern.test(color)) {
    return interaction.reply({
      content: "Please provide a valid hex color code (e.g., #FF0000 or 6B4EFF).",
      ephemeral: true
    });
  }
  
  color = color.replace('#', '');
  
  try {
    let goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      goodbye = new Goodbye({
        guildId: interaction.guild.id,
        message: {
          embed: {
            enabled: true,
            color: color
          }
        }
      });
    } else {
      if (!goodbye.message.embed) goodbye.message.embed = {};
      goodbye.message.embed.color = color;
    }
    
    await goodbye.save();
    
    const embed = new EmbedBuilder()
      .setColor(parseInt(color, 16))
      .setTitle("✅ Goodbye Color Set")
      .setDescription(`Goodbye embed color has been set to \`#${color}\``)
      .addFields({ name: "Preview", value: "This message shows the new color!", inline: false })
      .setFooter({ text: `Set by ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error setting goodbye color:", error);
    await interaction.reply({
      content: "There was an error setting the goodbye color.",
      ephemeral: true
    });
  }
}

async function handleSetCanvas(interaction, client) {
  const enabled = interaction.options.getBoolean("enabled");
  const template = interaction.options.getString("template") || "classic";
  const background = interaction.options.getString("background");
  const textColor = interaction.options.getString("text_color");
  const accentColor = interaction.options.getString("accent_color");
  
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
      content: "Please provide a valid hex color for accent (e.g., #ED4245).",
      ephemeral: true
    });
  }
  
  try {
    let goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      goodbye = new Goodbye({
        guildId: interaction.guild.id,
        canvas: {
          enabled: enabled,
          template: template,
          background: background?.replace('#', '') || "#2C2F33",
          textColor: textColor?.replace('#', '') || "#FFFFFF",
          accentColor: accentColor?.replace('#', '') || "#ED4245"
        }
      });
    } else {
      if (!goodbye.canvas) goodbye.canvas = {};
      goodbye.canvas.enabled = enabled;
      goodbye.canvas.template = template;
      if (background) goodbye.canvas.background = background.replace('#', '');
      if (textColor) goodbye.canvas.textColor = textColor.replace('#', '');
      if (accentColor) goodbye.canvas.accentColor = accentColor.replace('#', '');
    }
    
    await goodbye.save();
    
    let previewBuffer = null;
    if (enabled) {
      try {
        previewBuffer = await CanvasGenerator.generateGoodbyeImage(
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
      .setDescription(enabled ? "Goodbye canvas images have been enabled." : "Goodbye canvas images have been disabled.")
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

async function handleTest(interaction, client) {
  await interaction.deferReply();
  
  try {
    const goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye || !goodbye.enabled || !goodbye.channelId) {
      return await interaction.editReply({
        content: "Goodbye system is not fully configured. Please set a channel and message first."
      });
    }
    
    const channel = interaction.guild.channels.cache.get(goodbye.channelId);
    
    if (!channel) {
      return await interaction.editReply({
        content: "The configured goodbye channel no longer exists."
      });
    }
    
    let message = (goodbye.message?.content || "Goodbye {user}, we'll miss you!")
      .replace(/{user}/g, interaction.user.username)
      .replace(/{server}/g, interaction.guild.name)
      .replace(/{memberCount}/g, (interaction.guild.memberCount - 1).toString());
    
    if (goodbye.canvas?.enabled) {
      try {
        const canvasBuffer = await CanvasGenerator.generateGoodbyeImage(
          interaction.member,
          goodbye.canvas.template || "classic"
        );
        
        const embed = new EmbedBuilder()
          .setColor(goodbye.message?.embed?.color || client.colors.warning)
          .setDescription(message)
          .setImage("attachment://goodbye.png")
          .setTimestamp();
        
        await channel.send({
          embeds: [embed],
          files: [{ attachment: canvasBuffer, name: "goodbye.png" }]
        });
      } catch (error) {
        await channel.send(message);
      }
    } else if (goodbye.imageUrl) {
      const embed = new EmbedBuilder()
        .setColor(goodbye.message?.embed?.color || client.colors.warning)
        .setDescription(message)
        .setImage(goodbye.imageUrl)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send(message);
    }
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.success)
      .setTitle("✅ Test Goodbye Sent")
      .setDescription(`A test goodbye message has been sent to ${channel}`)
      .setFooter({ text: `Tested by ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error testing goodbye:", error);
    await interaction.editReply({
      content: "There was an error testing your goodbye settings."
    });
  }
}

async function handleDisable(interaction, client) {
  try {
    const goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    if (!goodbye) {
      return interaction.reply({
        content: "Goodbye system is not configured.",
        ephemeral: true
      });
    }
    
    goodbye.enabled = false;
    await goodbye.save();
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.warning)
      .setTitle("✅ Goodbye Disabled")
      .setDescription("Goodbye messages have been disabled.")
      .setFooter({ text: `Disabled by ${interaction.user.tag}` })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error disabling goodbye:", error);
    await interaction.reply({
      content: "There was an error disabling goodbye messages.",
      ephemeral: true
    });
  }
}

async function handleStatus(interaction, client) {
  try {
    const goodbye = await Goodbye.findOne({ guildId: interaction.guild.id });
    
    const embed = new EmbedBuilder()
      .setColor(client.colors.primary)
      .setTitle("👋 Goodbye System Status")
      .setDescription(goodbye?.enabled ? "✅ **Enabled**" : "❌ **Disabled**")
      .addFields(
        {
          name: "Channel",
          value: goodbye?.channelId ? `<#${goodbye.channelId}>` : "Not set",
          inline: true
        },
        {
          name: "Message",
          value: goodbye?.message?.content ? "✅ Set" : "❌ Not set",
          inline: true
        },
        {
          name: "Canvas",
          value: goodbye?.canvas?.enabled ? "✅ Enabled" : "❌ Disabled",
          inline: true
        },
        {
          name: "Image URL",
          value: goodbye?.imageUrl ? "✅ Set" : "❌ Not set",
          inline: true
        }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();
    
    if (goodbye?.message?.content) {
      const preview = goodbye.message.content
        .replace(/{user}/g, interaction.user.username)
        .replace(/{server}/g, interaction.guild.name)
        .replace(/{memberCount}/g, (interaction.guild.memberCount - 1).toString());
      
      embed.addFields({ name: "Message Preview", value: preview, inline: false });
    }
    
    await interaction.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error("Error getting goodbye status:", error);
    await interaction.reply({
      content: "There was an error fetching goodbye status.",
      ephemeral: true
    });
  }
}

async function handleHelp(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor(client.colors.primary)
    .setTitle("👋 Goodbye Commands")
    .setDescription("Configure your goodbye system")
    .addFields(
      { name: "`/goodbye setchannel`", value: "Set the goodbye channel", inline: false },
      { name: "`/goodbye setmessage`", value: "Set the goodbye message", inline: false },
      { name: "`/goodbye setimage`", value: "Set a goodbye image", inline: false },
      { name: "`/goodbye setcolor`", value: "Set the embed color", inline: false },
      { name: "`/goodbye setcanvas`", value: "Configure canvas images", inline: false },
      { name: "`/goodbye test`", value: "Test your goodbye settings", inline: false },
      { name: "`/goodbye disable`", value: "Disable goodbye messages", inline: false },
      { name: "`/goodbye status`", value: "View goodbye system status", inline: false }
    )
    .setFooter({ text: "Use /help for all commands" })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}