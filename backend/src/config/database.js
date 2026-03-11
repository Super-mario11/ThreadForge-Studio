import mongoose from 'mongoose';
import dns from 'node:dns';

let connectionPromise = null;

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  const dnsServers = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  const serverSelectionTimeoutMS = Number.parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000',
    10
  );
  const connectTimeoutMS = Number.parseInt(
    process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000',
    10
  );
  const familyRaw = (process.env.MONGODB_IP_FAMILY || '').trim();
  const family = familyRaw ? Number.parseInt(familyRaw, 10) : undefined;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }

  mongoose.set('strictQuery', true);

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS,
      connectTimeoutMS,
      ...(Number.isFinite(family) ? { family } : {})
    })
    .finally(() => {
      connectionPromise = null;
    });

  await connectionPromise;
};
