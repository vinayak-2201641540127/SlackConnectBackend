import axios from 'axios';
import { MessageModel } from '../models/Message.js';
import { TokenModel } from '../models/Token.js';

export const sendScheduledMessages = async () => {
  const now = new Date();

  const messages = await MessageModel.find({
    status: 'scheduled',
    send_at: { $lte: now }
  });

  if (messages.length === 0) return;

  for (const msg of messages) {
    const tokenDoc = await TokenModel.findOne({ 'team.id': msg.team_id });

    if (!tokenDoc) {
      console.error(`❌ Slack token not found for team: ${msg.team_id}`);
      continue;
    }

    try {
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
        console.log(`✅ Sent to ${msg.channel}: ${msg.message}`);
      } else {
        console.error(`❌ Slack error: ${res.data.error}`);
      }
    } catch (err) {
      console.error(`❌ Error sending to ${msg.channel}:`, (err as Error).message);
    }
  }
};
