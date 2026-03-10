import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadLocal, saveLocal } from '../lib/storage.js';

const CartContext = createContext(null);
const CART_KEY = 'threadforge-cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadLocal(CART_KEY, []));

  useEffect(() => {
    saveLocal(CART_KEY, items);
  }, [items]);

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      items,
      subtotal,
      addItem(item) {
        setItems((current) => [...current, item]);
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        );
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
