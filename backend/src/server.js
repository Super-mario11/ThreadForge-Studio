import 'express-async-errors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './config/database.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '..', '.env') });

const { default: app } = await import('./app.js');

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`ThreadForge API listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start API', error);

  const mongoUri = process.env.MONGODB_URI || '';
  const isSrvUri = mongoUri.startsWith('mongodb+srv://');
  const isSrvLookupFailure =
    (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') &&
    typeof error?.hostname === 'string' &&
    error.hostname.includes('_mongodb._tcp');

  if (isSrvUri && isSrvLookupFailure) {
    console.error(
      '\nMongoDB Atlas SRV lookup failed. This is usually DNS/network related.\n' +
        'Quick local dev fix:\n' +
        '1) Start MongoDB: docker compose up -d mongo\n' +
        '2) Set backend/.env -> MONGODB_URI=mongodb://127.0.0.1:27017/threadforge\n'
    );
    console.error(
      'Atlas fix options:\n' +
        '- Use a Standard connection string (mongodb://...) from Atlas to avoid SRV lookups, OR\n' +
        '- Set backend/.env -> DNS_SERVERS=1.1.1.1,8.8.8.8 (forces Node SRV resolver DNS)\n'
    );
  }
  process.exit(1);
});
