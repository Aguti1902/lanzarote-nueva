"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  tourId: string;
  slug: string;
  title: string;
  image: string;
  date: string;
  adults: number;
  children: number;
  priceAdult: number;
  priceChild: number;
  totalPrice: number;
  cruiseShip?: string;
  cruiseCompany?: string;
  sailingId?: string;
  portName?: string;
  notes?: string;
  source?: "tour" | "cruise";
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: Omit<CartItem, "id" | "totalPrice">) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "let_cart";

function calcTotal(item: Omit<CartItem, "id" | "totalPrice">) {
  return item.adults * item.priceAdult + item.children * item.priceChild;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "totalPrice">) => {
    setItems((prev) => [
      ...prev,
      {
        ...item,
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        totalPrice: calcTotal(item),
      },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addItem,
      removeItem,
      clear,
    }),
    [items, addItem, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
