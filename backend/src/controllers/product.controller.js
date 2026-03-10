import Product from '../models/Product.js';

const fallbackProducts = [
  {
    _id: 'fallback-1',
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
    _id: 'fallback-2',
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
    _id: 'fallback-3',
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
  },
  {
    _id: 'fallback-4',
    name: 'Signature Polo',
    slug: 'signature-polo',
    category: 'Polo',
    description: 'Sharp smart-casual polo with subtle chest print support.',
    basePrice: 44,
    colors: ['White', 'Navy', 'Graphite'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 67,
    imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 150, height: 180 },
      back: { width: 250, height: 300 }
    }
  }
];

export const listProducts = async (req, res) => {
  const { category, size, color, sort = 'featured' } = req.query;
  const filters = {};

  if (category) filters.category = category;
  if (size) filters.sizes = size;
  if (color) filters.colors = color;

  let products = await Product.find(filters);

  if (!products.length) {
    products = fallbackProducts.filter((product) => {
      return (!category || product.category === category) &&
        (!size || product.sizes.includes(size)) &&
        (!color || product.colors.includes(color));
    });
  }

  const sorters = {
    featured: (a, b) => Number(b.featured) - Number(a.featured),
    popularity: (a, b) => b.popularity - a.popularity,
    'price-low': (a, b) => a.basePrice - b.basePrice,
    'price-high': (a, b) => b.basePrice - a.basePrice
  };

  products.sort(sorters[sort] || sorters.featured);
  res.json({ products });
};

export const getFeaturedProducts = async (_req, res) => {
  const products = await Product.find({ featured: true }).limit(6);
  res.json({ products: products.length ? products : fallbackProducts.filter((product) => product.featured) });
};
