import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { catalogProducts } from './data/catalog.js';
import Product from './models/Product.js';

dotenv.config();

const run = async () => {
  await connectDatabase();
  await Product.deleteMany({});
  await Product.insertMany(catalogProducts);
  console.log('Seeded products');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
