const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3443;

// Twitch credentials
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI = 'https://localhost:3443/auth/twitch/callback';

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
    // Step 3: Exchange code for access token
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

    // Step 4: Fetch user data from Twitch
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data.data[0]; // Twitch returns an array of users
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


// Serve the HTTPS using local-ssl-proxy
const localSslProxy = require('local-ssl-proxy');

// Start your HTTPS server using local-ssl-proxy to handle HTTPS locally
localSslProxy({
  source: 3443,      // Local port to expose
  target: 3000        // Target (your node app server port)
});

// Print information to inform users to use the correct HTTPS URL
console.log('Server running at https://localhost:3443');
