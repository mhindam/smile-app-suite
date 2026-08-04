import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { firebaseDb } from "./firebase";
import type { Category, Product } from "@/data/menu";

/** Firebase nodes can be arrays or keyed objects — normalise both to a list. */
function toList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  if (value && typeof value === "object") return Object.values(value as Record<string, T>);
  return [];
}

export type MenuState = {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
};

/** Live menu from the Android POS: menu/categories + menu/products. */
export function useMenu(): MenuState {
  const [state, setState] = useState<MenuState>({
    categories: [],
    products: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const cleanups: Array<() => void> = [];

    firebaseDb()
      .then((db) => {
        if (!active) return;
        cleanups.push(
          onValue(
            ref(db, "menu/categories"),
            (snap) =>
              setState((s) => ({
                ...s,
                loading: false,
                categories: toList<Category>(snap.val()).filter((c) => !!c?.name),
              })),
            (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
          ),
        );
        cleanups.push(
          onValue(
            ref(db, "menu/products"),
            (snap) =>
              setState((s) => ({
                ...s,
                loading: false,
                products: toList<Product>(snap.val())
                  .filter((p) => !!p?.name)
                  .map((p) => ({ ...p, price: Number(p.price) || 0 })),
              })),
            (err) => setState((s) => ({ ...s, loading: false, error: err.message })),
          ),
        );
      })
      .catch((err: Error) => {
        if (active) setState((s) => ({ ...s, loading: false, error: err.message }));
      });

    return () => {
      active = false;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return state;
}
