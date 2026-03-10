import 'express-async-errors';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = process.env.PORT || 5000;

const start = async () => {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`ThreadForge API listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
