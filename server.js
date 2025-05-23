const express = require('express');
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');
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

// HWID Reset Request
app.post('/send-reset-request', async (req, res) => {
  const {
    username,
    userId,
    avatarUrl,
    keyUsed,
    machine,
    hwid,
    cpu,
    gpu,
    motherboard,
    disk
  } = req.body;

  if (!username || !userId) {
    return res.status(400).send('Missing username or userId');
  }

  try {
    const channel = await client.channels.fetch('1375589829940871349');

    const embed = {
      title: '🔁 HWID Reset Request',
      color: 0x3498db,
      thumbnail: { url: avatarUrl },
      fields: [
        { name: '👤 Username', value: username, inline: true },
        { name: '🆔 User ID', value: userId, inline: true },
        { name: '🔑 Key Used', value: keyUsed || 'N/A', inline: false },
        { name: '💻 Machine', value: machine || 'N/A', inline: true },
        { name: '🧾 HWID', value: hwid || 'N/A', inline: false },
        { name: '🧠 CPU', value: cpu || 'N/A', inline: false },
        { name: '🎮 GPU', value: gpu || 'N/A', inline: false },
        { name: '🪛 Motherboard', value: motherboard || 'N/A', inline: false },
        { name: '💾 Disk', value: disk || 'N/A', inline: false },
        { name: '🕒 Time', value: new Date().toLocaleString(), inline: false }
      ]
    };

    const row = new ActionRowBuilder().addComponents(
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
      embeds: [embed],
      components: [row]
    });

    res.send('Reset request sent successfully.');
  } catch (error) {
    console.error('Error sending reset request:', error);
    res.status(500).send('Failed to send reset request.');
  }
});

// Interaction Handler for Accept / Decline / Done
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, targetUserId] = interaction.customId.split('_');
  const targetUser = await client.users.fetch(targetUserId);

  if (action === 'accept') {
    await interaction.reply({ content: `✅ Accepted HWID reset for <@${targetUserId}>.`, ephemeral: true });

    const doneRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`done_${targetUserId}`)
        .setLabel('✅ Done')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.message.edit({ components: [doneRow] });

    const acceptEmbed = {
      title: '✅ HWID Reset Accepted',
      color: 0x2ecc71,
      description: 'Your HWID reset request has been **approved and processed**.\n\n🛑 **Note:** This was your **1-time reset**. You will not be able to request again.',
      footer: { text: 'Thank you for using our service.' }
    };

    try {
      await targetUser.send({ embeds: [acceptEmbed] });
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }

  } else if (action === 'decline') {
    await interaction.reply({ content: `❌ Declined HWID reset for <@${targetUserId}>.`, ephemeral: true });

    const declineEmbed = {
      title: '❌ HWID Reset Declined',
      color: 0xe74c3c,
      description: 'Sorry, your HWID reset request has been **declined**.\n\n🚫 **Please do not open another request.** Repeated attempts may result in a **ban from the app** for spamming.',
      footer: { text: 'Repeated abuse may lead to access being revoked.' }
    };

    try {
      await targetUser.send({ embeds: [declineEmbed] });
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }

  } else if (action === 'done') {
    await interaction.reply({ content: `✅ Marked HWID reset as completed for <@${targetUserId}>.`, ephemeral: true });

    try {
      await targetUser.send({
        embeds: [{
          title: '✅ HWID Reset Completed',
          color: 0x3498db,
          description: 'Your HWID has now been **reset** successfully.\n\n🔁 **You may now use the app again.**',
          footer: { text: 'You cannot request another reset.' }
        }]
      });
    } catch (err) {
      console.error(`Failed to send DM to user ${targetUserId}:`, err);
    }

    const disabledRow = new ActionRowBuilder().addComponents(
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
