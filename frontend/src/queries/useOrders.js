import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function useOrders(enabled) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!enabled) {
      setOrders([]);
      return;
    }

    api('/orders/mine')
      .then((data) => setOrders(data.orders))
      .catch(() => setOrders([]));
  }, [enabled]);

  return { orders };
}
