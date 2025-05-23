const express = require('express');
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
require('dotenv').config();

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.login(process.env.BOT_TOKEN);

// Assign role endpoint
app.post('/assign-role', async (req, res) => {
  const { guildId, userId, roleId } = req.body;
  if (!guildId || !userId || !roleId) {
    return res.status(400).send('Missing guildId, userId or roleId');
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    await member.roles.add(roleId);
    console.log(`Assigned role ${roleId} to user ${userId} in guild ${guildId}`);

    res.send('Role assigned successfully.');
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).send('Failed to assign role.');
  }
});

// Check role endpoint
app.post('/check-role', async (req, res) => {
  const { guildId, userId, roleId } = req.body;
  if (!guildId || !userId || !roleId) {
    return res.status(400).send('Missing guildId, userId or roleId');
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    const hasRole = member.roles.cache.has(roleId);
    res.json({ hasRole });
  } catch (error) {
    console.error('Error checking role:', error);
    res.status(500).send('Failed to check role.');
  }
});

// HWID Reset Button Message
app.post('/send-reset-request', async (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) {
    return res.status(400).send('Missing userId or username');
  }

  try {
    const channel = await client.channels.fetch('1375589829940871349');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${userId}`)
          .setLabel('✅ Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`decline_${userId}`)
          .setLabel('❌ Decline')
          .setStyle(ButtonStyle.Danger)
      );

    await channel.send({
      content: `🔁 HWID Reset Request from **${username}** (ID: ${userId})`,
      components: [row]
    });

    res.send('Reset request sent successfully.');
  } catch (error) {
    console.error('Error sending reset request:', error);
    res.status(500).send('Failed to send reset request.');
  }
});

// Handle button interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, targetUserId] = interaction.customId.split('_');
  const targetUser = await client.users.fetch(targetUserId);

  if (action === 'accept') {
    await interaction.reply({ content: `✅ Accepted HWID reset for <@${targetUserId}>.`, ephemeral: true });

    const doneRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`done_${targetUserId}`)
          .setLabel('✅ Done')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.message.edit({ components: [doneRow] });

    try {
      await targetUser.send('✅ Your HWID reset request has been **accepted**. Processing now...');
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }
  } else if (action === 'decline') {
    await interaction.reply({ content: `❌ Declined HWID reset for <@${targetUserId}>.`, ephemeral: true });

    try {
      await targetUser.send('❌ Your HWID reset request has been **declined**.');
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }
  } else if (action === 'done') {
    await interaction.reply({ content: `✅ Marked HWID reset as completed for <@${targetUserId}>.`, ephemeral: true });

    try {
      await targetUser.send('✅ Your HWID has now been **reset** successfully.');
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }

    const disabledRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`done_${targetUserId}`)
          .setLabel('✅ Done')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );

    await interaction.message.edit({ components: [disabledRow] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 API server listening on port ${PORT}`);
});
