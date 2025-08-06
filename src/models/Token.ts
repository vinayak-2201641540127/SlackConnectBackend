// src/models/Token.ts
import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  scope: { type: String },
  team: {
    id: String,
    name: String,
  },
  authed_user: {
    id: String,
  },
  expires_at: { type: Date }, // optional, Slack tokens may not expire
}, { timestamps: true });

export const TokenModel = mongoose.model('Token', tokenSchema);
