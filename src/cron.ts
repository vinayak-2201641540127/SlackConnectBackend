import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import { MessageModel } from './models/Message.js';
import { TokenModel } from './models/Token.js';

dotenv.config();

const sendScheduledMessages = async () => {
  console.log('📡 Cron job started');

  try {
    console.log('🛠 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB connected');

    const now = new Date();
    console.log(`🕒 Current UTC time: ${now.toISOString()}`);

    const messages = await MessageModel.find({
      status: 'scheduled',
      send_at: { $lte: now }
    });

    console.log(`📦 Found ${messages.length} scheduled messages`);

    if (messages.length === 0) return;

    for (const msg of messages) {
      const tokenDoc = await TokenModel.findOne({ 'team.id': msg.team_id }); // ✅ Now inside loop

      if (!tokenDoc) {
        console.error(`❌ Slack token not found for team: ${msg.team_id}`);
        continue; // Skip this message
      }

      try {
        console.log(`📤 Sending message to ${msg.channel}: "${msg.message}"`);

        const res = await axios.post('https://slack.com/api/chat.postMessage', {
          channel: msg.channel,
          text: msg.message
        }, {
          headers: {
            Authorization: `Bearer ${tokenDoc.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.data.ok) {
          await MessageModel.findByIdAndUpdate(msg._id, { status: 'sent' });
          console.log(`✅ Sent to ${msg.channel}: "${msg.message}"`);
        } else {
          console.error(`❌ Slack error: ${res.data.error}`);
        }
      } catch (err) {
        console.error(`❌ Error sending to ${msg.channel}:`, (err as Error).message);
      }
    }
  } catch (err) {
    console.error('❌ Cron job error:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

sendScheduledMessages();