import { useApiList } from './useApiList.js';

export function useOrders(enabled) {
  const { items, loading } = useApiList({
    path: '/orders/mine',
    resultKey: 'orders',
    enabled
  });

  return { orders: items, loading };
}
