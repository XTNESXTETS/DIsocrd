const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/assign-role', async (req, res) => {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) {
    return res.status(400).send('Missing userId or roleId');
  }

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(userId);

    await member.roles.add(roleId);
    console.log(`Assigned role ${roleId} to user ${userId}`);

    res.send('Role assigned successfully.');
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).send('Failed to assign role.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 API server listening on port ${PORT}`);
});
