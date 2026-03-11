import mongoose from 'mongoose';
import dns from 'node:dns';

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  const dnsServers = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
};
