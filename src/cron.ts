import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendScheduledMessages } from './utils/scheduler.js'; // ✅ import from utility

dotenv.config();

const runCron = async () => {
  console.log('📡 Cron job started');

  try {
    console.log('🛠 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB connected');

    await sendScheduledMessages(); // ✅ Run actual logic
  } catch (err) {
    console.error('❌ Cron job error:', (err as Error).message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
};

runCron();
