import Product from '../models/Product.js';

const fallbackProducts = [
  {
    _id: 'fallback-1',
    name: 'Neo Oversized Tee',
    slug: 'neo-oversized-tee',
    category: 'Oversized T-Shirts',
    description: 'Heavyweight oversized tee built for bold prints.',
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
    description: 'Soft premium cotton with an easy everyday fit.',
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
    description: 'Fleece-lined hoodie with big print zones.',
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
    description: 'Smart-casual polo with a clean chest print area.',
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
  },
  {
    _id: 'fallback-5',
    name: 'Air Oversized Tee',
    slug: 'air-oversized-tee',
    category: 'Oversized T-Shirts',
    description: 'Boxy silhouette with breathable heavyweight cotton.',
    basePrice: 36,
    colors: ['Black', 'Off White', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 91,
    imageUrl: 'https://images.unsplash.com/photo-1520975958225-1a58bbfda4b4?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 280, height: 360 },
      back: { width: 280, height: 360 }
    }
  },
  {
    _id: 'fallback-6',
    name: 'Everyday Regular Tee',
    slug: 'everyday-regular-tee',
    category: 'Regular Fit',
    description: 'Minimal regular fit with a smooth print surface.',
    basePrice: 27,
    colors: ['White', 'Black', 'Graphite'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 84,
    imageUrl: 'https://images.unsplash.com/photo-1523380744952-b7e00e6e2ffa?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    customizationAreas: {
      front: { width: 250, height: 310 },
      back: { width: 250, height: 310 }
    }
  },
  {
    _id: 'fallback-7',
    name: 'Zip Hoodie',
    slug: 'zip-hoodie',
    category: 'Hoodies',
    description: 'Zip hoodie with roomy front + back placement.',
    basePrice: 64,
    colors: ['Black', 'Stone', 'Navy'],
    sizes: ['M', 'L', 'XL'],
    popularity: 72,
    imageUrl: 'https://images.unsplash.com/photo-1520974735194-6d49f63cfa9d?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 240, height: 260 },
      back: { width: 300, height: 340 }
    }
  },
  {
    _id: 'fallback-8',
    name: 'Custom Drop Tee',
    slug: 'custom-drop-tee',
    category: 'Custom Collection',
    description: 'Limited-run blank built for bold, oversized graphics.',
    basePrice: 42,
    colors: ['Black', 'Crimson', 'Cobalt'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 88,
    imageUrl: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    customizationAreas: {
      front: { width: 300, height: 380 },
      back: { width: 300, height: 380 }
    }
  },
  {
    _id: 'fallback-9',
    name: 'Minimal Polo',
    slug: 'minimal-polo',
    category: 'Polo',
    description: 'Clean knit polo with sharp embroidered-style prints.',
    basePrice: 46,
    colors: ['White', 'Navy', 'Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 63,
    imageUrl: 'https://images.unsplash.com/photo-1520975689658-8460b31f3152?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 150, height: 180 },
      back: { width: 250, height: 300 }
    }
  },
  {
    _id: 'fallback-10',
    name: 'Custom Studio Tee',
    slug: 'custom-studio-tee',
    category: 'Custom Collection',
    description: 'Soft-touch fabric with vibrant print support.',
    basePrice: 39,
    colors: ['Off White', 'Graphite', 'Crimson'],
    sizes: ['S', 'M', 'L', 'XL'],
    popularity: 79,
    imageUrl: 'https://images.unsplash.com/photo-1503342452485-86d0c0b8c670?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    customizationAreas: {
      front: { width: 260, height: 330 },
      back: { width: 260, height: 330 }
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
