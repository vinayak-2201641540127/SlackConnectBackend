// src/routes/message.ts
import express from 'express';
import axios from 'axios';
import { TokenModel } from '../models/Token.js';
import { MessageModel } from '../models/Message.js';

const router = express.Router();

// POST /api/message/send
router.post('/send', async (req, res) => {
  const { channel, message } = req.body;

  if (!channel || !message) {
    return res.status(400).json({ error: 'Channel and message are required' });
  }

  try {
    // Get the most recent token from DB
    const tokenDoc = await TokenModel.findOne().sort({ createdAt: -1 });

    if (!tokenDoc) {
      return res.status(400).json({ error: 'No Slack token found' });
    }

    const slackResponse = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenDoc.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!slackResponse.data.ok) {
      return res.status(400).json({ error: slackResponse.data.error });
    }

    return res.json({ ok: true, message: 'Message sent to Slack!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});


// router.post('/schedule', async (req, res) => {
//   const { channel, message, sendAt } = req.body;

//   if (!channel || !message || !sendAt) {
//     return res.status(400).json({ error: 'channel, message and sendAt are required' });
//   }

//   try {
//     const scheduledMessage = await MessageModel.create({
//       channel,
//       message,
//       send_at: new Date(sendAt),  // ✅ convert to MongoDB format
//     });

//     return res.json({ ok: true, scheduledMessage });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: 'Failed to schedule message' });
//   }
// });


import dayjs from 'dayjs';

router.post('/schedule', async (req, res) => {
  const { channel, message, sendAt, team_id } = req.body;

  // Basic validation
  if (!channel || !message || !sendAt || !team_id) {
    return res.status(400).json({
      error: 'channel, message, sendAt, and team_id are required',
    });
  }

  // Parse sendAt using dayjs in "DD-MM-YYYY HH:mm" format
  const parsedDate = dayjs(sendAt, 'DD-MM-YYYY HH:mm');

  if (!parsedDate.isValid()) {
    return res.status(400).json({ error: 'Invalid sendAt format' });
  }

  try {
    const scheduledMessage = await MessageModel.create({
      channel,
      message,
      send_at: parsedDate.toDate(), // 🔁 Save as ISO date
      team_id,
    });

    return res.json({ ok: true, scheduledMessage });
  } catch (err) {
    console.error('❌ Schedule Error:', (err as Error).message);
    return res.status(500).json({ error: 'Failed to schedule message' });
  }
});



router.get('/scheduled', async (req, res) => {
  try {
    const messages = await MessageModel.find({ status: 'scheduled' }).sort({ send_at: 1 });

    return res.json({ ok: true, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
});

// router.delete('/:id/cancel', async (req, res) => {
//   const { id } = req.params;

//   try {
//     const message = await MessageModel.findById(id);

//     if (!message || message.status !== 'scheduled') {
//       return res.status(404).json({ error: 'Scheduled message not found or already sent' });
//     }

//     message.status = 'cancelled';
//     await message.save();

//     return res.json({ ok: true, message: 'Message cancelled successfully' });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: 'Failed to cancel message' });
//   }
// });

router.delete('/:id/cancel', async (req, res) => {
  const { id } = req.params;

  try {
    const message = await MessageModel.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.status !== 'scheduled') {
      return res.status(400).json({ error: 'Message is not scheduled or already processed' });
    }

    message.status = 'cancelled';
    await message.save();

    return res.json({ ok: true, message: 'Message cancelled successfully', data: message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to cancel message' });
  }
});




router.get('/ping', (req, res) => {
  res.send('✅ Message route is live');
});

// router.get('/ping', (req, res) => {
//   res.send('✅ Message route is live');
// });


export default router;
