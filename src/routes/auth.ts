// src/routes/auth.ts
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { TokenModel } from '../models/Token.js';

dotenv.config();
const router = express.Router();

const clientId = process.env.SLACK_CLIENT_ID!;
const clientSecret = process.env.SLACK_CLIENT_SECRET!;
const redirectUri = process.env.SLACK_REDIRECT_URI!;

// Step 1: Redirect to Slack for OAuth
router.get('/slack', (_req, res) => {
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write,channels:read,channels:join,users:read&redirect_uri=${redirectUri}`;
  res.redirect(url);
});

// Step 2: Handle callback from Slack
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) return res.status(400).send('Missing code from Slack');

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    console.log('Slack OAuth Response:', data);


    if (!data.ok) return res.status(400).json({ error: data.error });

    // Save tokens in DB
    const token = new TokenModel({
      access_token: data.access_token,
      refresh_token: data.refresh_token || 'none', // Slack doesn’t give refresh tokens
      scope: data.scope,
      team: data.team,
      authed_user: data.authed_user,
    });

    await token.save();

    // return res.send('✅ Slack workspace connected successfully. You can now close this tab.');
    return res.redirect(`http://localhost:5173?connected=true&team_id=${data.team.id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Slack OAuth failed');
  }
});

export default router;
