import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.size && filters.size !== 'All') params.set('size', filters.size);
    if (filters.color && filters.color !== 'All') params.set('color', filters.color);
    if (filters.sort) params.set('sort', filters.sort);

    setLoading(true);
    api(`/products?${params.toString()}`)
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.category, filters.color, filters.size, filters.sort]);

  return { products, loading };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api('/products/featured')
      .then((data) => {
        if (!active) return;
        setProducts(data.products);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { products, loading };
}
