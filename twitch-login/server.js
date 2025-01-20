const express = require('express');
const axios = require('axios');
require('dotenv').config();
const fs = require('fs');

const app = express();
const PORT = 3443;

// Load SSL certificate and private key from certs folder
const privateKey  = fs.readFileSync('./certs/server.key', 'utf8');
const certificate = fs.readFileSync('./certs/server.crt', 'utf8');

// Basic HTTPS server setup with SSL
const httpsOptions = { key: privateKey, cert: certificate };

// Twitch credentials
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = process.env.TWITCH_REDIRECT_URI;

// Step 1: Redirect users to Twitch OAuth page
app.get('/auth/twitch', (req, res) => {
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=user:read:email`;
  res.redirect(twitchAuthUrl);
});

// Step 2: Handle OAuth callback
app.get('/auth/twitch/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      },
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data.data[0];
    res.json({
      message: 'User successfully authenticated',
      user: userData,
    });
  } catch (error) {
    console.error('Error during Twitch OAuth:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('<a href="/auth/twitch">Log in with Twitch</a>');
});

// Create HTTPS server with SSL certificates
const https = require('https');
const server = https.createServer(httpsOptions, app);

server.listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});
