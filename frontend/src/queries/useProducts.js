import { useApiList } from './useApiList.js';

function buildProductsPath(filters) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters.size && filters.size !== 'All') params.set('size', filters.size);
  if (filters.color && filters.color !== 'All') params.set('color', filters.color);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

export function useProducts(filters = {}) {
  const path = buildProductsPath(filters);

  const { items, loading } = useApiList({
    path,
    resultKey: 'products'
  });

  return { products: items, loading };
}

export function useFeaturedProducts() {
  const { items, loading } = useApiList({
    path: '/products/featured',
    resultKey: 'products'
  });

  return { products: items, loading };
}
