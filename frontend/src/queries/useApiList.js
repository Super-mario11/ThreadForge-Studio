import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function useApiList({ path, resultKey, enabled = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    api(path)
      .then((data) => {
        if (!active) return;
        const nextItems = Array.isArray(data?.[resultKey]) ? data[resultKey] : [];
        setItems(nextItems);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, path, resultKey]);

  return { items, loading };
}
