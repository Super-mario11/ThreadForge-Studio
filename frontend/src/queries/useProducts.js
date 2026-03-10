import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.size && filters.size !== 'All') params.set('size', filters.size);
    if (filters.color && filters.color !== 'All') params.set('color', filters.color);
    if (filters.sort) params.set('sort', filters.sort);

    api(`/products?${params.toString()}`)
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [filters.category, filters.color, filters.size, filters.sort]);

  return { products };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/products/featured')
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, []);

  return { products };
}
