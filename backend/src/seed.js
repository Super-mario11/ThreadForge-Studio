import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import Product from './models/Product.js';

dotenv.config();

const products = [
  {
    name: 'Neo Oversized Tee',
    slug: 'neo-oversized-tee',
    category: 'Oversized T-Shirts',
    description: 'Heavyweight oversized tee made for vivid front and back prints.',
    basePrice: 34,
    colors: ['Black', 'Off White', 'Cobalt'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 98,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    customizationAreas: {
      front: { width: 280, height: 360 },
      back: { width: 280, height: 360 }
    }
  },
  {
    name: 'Studio Regular Tee',
    slug: 'studio-regular-tee',
    category: 'Regular Fit',
    description: 'Soft premium cotton with a balanced fit for all-day wear.',
    basePrice: 29,
    colors: ['White', 'Charcoal', 'Crimson'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 89,
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    customizationAreas: {
      front: { width: 260, height: 320 },
      back: { width: 260, height: 320 }
    }
  },
  {
    name: 'Forge Hoodie',
    slug: 'forge-hoodie',
    category: 'Hoodies',
    description: 'Fleece-lined hoodie with premium print placement zones.',
    basePrice: 59,
    colors: ['Black', 'Stone', 'Forest'],
    sizes: ['M', 'L', 'XL'],
    popularity: 76,
    imageUrl: 'https://images.unsplash.com/photo-1618354691213-2ab5bdf8f12b?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 260, height: 280 },
      back: { width: 300, height: 340 }
    }
  }
];

const run = async () => {
  await connectDatabase();
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log('Seeded products');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
