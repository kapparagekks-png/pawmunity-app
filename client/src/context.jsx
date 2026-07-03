import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

let toastId = 0;

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [toasts, setToasts] = useState([]);
  const [cart, setCart] = useState([]); // {productId, name, price, image, qty}
  const [config, setConfig] = useState({ payments: "mock", currency: "USD", sandbox: true });

  useEffect(() => {
    if (!getToken()) return;
    api("/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api("/config").then(setConfig).catch(() => {});
  }, [user]);

  const toast = useCallback((message, type = "default") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setCart([]);
  }, []);

  const addToCart = useCallback((product) => {
    setCart((c) => {
      const found = c.find((i) => i.productId === product.id);
      if (found) {
        return c.map((i) =>
          i.productId === product.id ? { ...i, qty: Math.min(99, i.qty + 1) } : i
        );
      }
      return [
        ...c,
        { productId: product.id, name: product.name, price: product.price, image: product.image, qty: 1 },
      ];
    });
  }, []);

  const setQty = useCallback((productId, qty) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((i) => i.productId !== productId)
        : c.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  }, []);

  const value = {
    user,
    setUser,
    booting,
    toast,
    toasts,
    signOut,
    cart,
    setCart,
    addToCart,
    setQty,
    config,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
