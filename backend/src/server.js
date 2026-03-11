import 'express-async-errors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './config/database.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '..', '.env') });

const { default: app } = await import('./app.js');

const port = process.env.PORT || 5000;

const exitOnDbFail = process.env.EXIT_ON_DB_FAIL
  ? process.env.EXIT_ON_DB_FAIL === 'true'
  : process.env.NODE_ENV !== 'production';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logMongoHints = (error) => {
  const mongoUri = process.env.MONGODB_URI || '';
  const isSrvUri = mongoUri.startsWith('mongodb+srv://');
  const isSrvLookupFailure =
    (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') &&
    typeof error?.hostname === 'string' &&
    error.hostname.includes('_mongodb._tcp');

  if (isSrvUri && isSrvLookupFailure) {
    console.error(
      '\nMongoDB Atlas SRV lookup failed (DNS/network).\n' +
        'Fix options:\n' +
        '- Use the Atlas "Standard connection string" (mongodb://...) to avoid SRV lookups, OR\n' +
        '- Set DNS_SERVERS=1.1.1.1,8.8.8.8 to force Node DNS resolvers.\n'
    );
  }

  const message = String(error?.message || '');
  if (
    message.includes('MongooseServerSelectionError') ||
    message.includes('Could not connect to any servers') ||
    message.toLowerCase().includes('whitelist')
  ) {
    console.error(
      '\nMongoDB Atlas connection failed.\n' +
        'Most common cause on Render: Atlas Network Access does not allow Render egress IPs.\n' +
        'Atlas fix: Network Access -> Add IP Address -> (temporary) Allow Access From Anywhere (0.0.0.0/0).\n'
    );
  }
};

const connectWithRetry = async () => {
  let attempt = 0;
  // Keep the process alive so platforms like Render can detect the open port,
  // while we retry DB connection in the background.
  while (true) {
    attempt += 1;
    try {
      await connectDatabase();
      console.log('Connected to MongoDB');
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed`, error);
      logMongoHints(error);

      if (exitOnDbFail) {
        throw error;
      }

      const delayMs = Math.min(30_000, 1000 * 2 ** Math.min(attempt - 1, 5));
      console.error(`Retrying MongoDB connection in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
};

app.listen(port, () => {
  console.log(`ThreadForge API listening on port ${port}`);
});

connectWithRetry().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
