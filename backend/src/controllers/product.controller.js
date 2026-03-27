import Product from '../models/Product.js';
import { catalogProducts } from '../data/catalog.js';

export const listProducts = async (req, res) => {
  const { category, size, color, sort = 'featured' } = req.query;
  const filters = {};

  if (category) filters.category = category;
  if (size) filters.sizes = size;
  if (color) filters.colors = color;

  let products = await Product.find(filters);

  if (!products.length) {
    products = catalogProducts
      .filter((product) => {
        return (!category || product.category === category) &&
          (!size || product.sizes.includes(size)) &&
          (!color || product.colors.includes(color));
      })
      .map((product) => ({
        ...product,
        _id: product.slug
      }));
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
  res.json({
    products: products.length
      ? products
      : catalogProducts
          .filter((product) => product.featured)
          .map((product) => ({ ...product, _id: product.slug }))
  });
};
