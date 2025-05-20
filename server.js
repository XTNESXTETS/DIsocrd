const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
app.use(express.json()); // Add JSON parser middleware

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.BOT_TOKEN);

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 API server listening on port ${PORT}`);
});
