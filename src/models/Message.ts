// src/models/Message.ts
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channel: { type: String, required: true },
  message: { type: String, required: true },
  send_at: { type: Date, required: true },  // UTC time
  team_id: { type: String, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

export const MessageModel = mongoose.model('Message', messageSchema);
