import Product from '../models/Product.js';

export const listProducts = async (req, res) => {
  const { category, size, color, sort = 'featured' } = req.query;
  const filters = {};

  if (category) filters.category = category;
  if (size) filters.sizes = size;
  if (color) filters.colors = color;

  const products = await Product.find(filters);

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
  const products = await Product.find({ featured: true }).limit(2);
  res.json({ products });
};
