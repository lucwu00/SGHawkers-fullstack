// ─── src/hooks/useApi.js  (CUSTOMER — with DEMO MODE) ────────────────────────
// VITE_DEMO_MODE=true  → initial data from demoData.customer.js
// VITE_DEMO_MODE=false → all data from real backend
// Writes (orders) always go to real backend regardless of mode.

import { useState, useEffect, useCallback } from "react";
import { api, tokenStore } from "../api/client";
import { DEMO_ORDERS_CUSTOMER, DEMO_NOTIFICATIONS_CUSTOMER } from "../demo/demoData.customer";

const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

// ─── GENERIC FETCH HOOK ───────────────────────────────────────────────────────
function useFetch(path, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError(null);
    try { setData(await api.get(path)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [path, ...deps]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const [customer, setCustomer] = useState(() => {
    const tok = tokenStore.get();
    if (!tok) return null;
    try { return JSON.parse(atob(tok.split(".")[1])); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const handler = () => { tokenStore.clear(); setCustomer(null); };
    window.addEventListener("sgh:auth:expired", handler);
    return () => window.removeEventListener("sgh:auth:expired", handler);
  }, []);

  async function login(email, password) {
    setLoading(true); setError(null);
    try {
      const res = await api.post("/auth/customer/login", { email, password });
      tokenStore.set(res.token); setCustomer(res.customer); return res.customer;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  async function register(email, password, name, phone) {
    setLoading(true); setError(null);
    try {
      const res = await api.post("/auth/customer/register", { email, password, name, phone });
      tokenStore.set(res.token); setCustomer(res.customer); return res.customer;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }

  function logout() { tokenStore.clear(); setCustomer(null); }
  return { customer, login, register, logout, loading, error, isLoggedIn: !!customer };
}

// ─── CENTRES ─────────────────────────────────────────────────────────────────
export function useCentres() {
  return useFetch("/centres");
}

// ─── STALLS ──────────────────────────────────────────────────────────────────
export function useStalls(centreSlug) {
  return useFetch(centreSlug ? `/centres/${centreSlug}/stalls` : null, [centreSlug]);
}

// ─── SINGLE STALL ────────────────────────────────────────────────────────────
export function useStall(stallSlug) {
  return useFetch(stallSlug ? `/centres/stall/${stallSlug}` : null, [stallSlug]);
}

// ─── POPULAR DISHES ──────────────────────────────────────────────────────────
export function usePopularDishes() {
  return useFetch("/menu/popular/all");
}

// ─── MENU (with live WS updates) ─────────────────────────────────────────────
export function useMenu(stallId) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stallId) return;
    api.get(`/menu/${stallId}`)
      .then(setMenu).catch(() => {}).finally(() => setLoading(false));
  }, [stallId]);

  function applyMenuUpdate(item) {
    if (item.deleted) { setMenu(m => m.filter(x => x.id !== item.id)); return; }
    setMenu(m => {
      const idx = m.findIndex(x => x.id === item.id);
      if (idx >= 0) { const n=[...m]; n[idx]=item; return n; }
      return [...m, item];
    });
  }

  return { menu, loading, applyMenuUpdate };
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export function useOrders() {
  const [orders,  setOrders]  = useState(DEMO ? [...DEMO_ORDERS_CUSTOMER] : []);
  const [loading, setLoading] = useState(!DEMO);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!tokenStore.get()) { setOrders(DEMO ? [...DEMO_ORDERS_CUSTOMER] : []); setLoading(false); return; }
    try {
      setLoading(true);
      const data = await api.get("/orders/my");
      if (DEMO) {
        // Merge real orders with demo orders — real orders take priority
        setOrders(prev => {
          const realIds = new Set(data.map(o => o.id));
          const demoOnly = prev.filter(o => o.id.startsWith("demo-") && !realIds.has(o.id));
          return [...data, ...demoOnly].sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
        });
      } else {
        setOrders(data);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function placeOrder(orderData) {
    // Always save to real backend
    const result = await api.post("/orders", orderData);
    setOrders(o => [result, ...o]);
    return result;
  }

  function updateOrderFromWs(updatedOrder) {
    setOrders(o => o.map(x => x.id === updatedOrder.id ? updatedOrder : x));
  }

  return { orders, loading, error, placeOrder, updateOrderFromWs, refetch: load };
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export function useNotifications() {
  const [notifs,  setNotifs]  = useState(DEMO ? [...DEMO_NOTIFICATIONS_CUSTOMER] : []);
  const [loading, setLoading] = useState(!DEMO);

  const load = useCallback(async () => {
    if (!tokenStore.get()) { setNotifs(DEMO ? [...DEMO_NOTIFICATIONS_CUSTOMER] : []); setLoading(false); return; }
    try {
      setLoading(true);
      const data = await api.get("/notifications");
      if (DEMO) {
        setNotifs(prev => {
          const realIds = new Set(data.map(n => n.id));
          const demoOnly = prev.filter(n => n.id.startsWith("demo-") && !realIds.has(n.id));
          return [...data, ...demoOnly].sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
        });
      } else {
        setNotifs(data);
      }
    } catch { /* keep demo data */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function addNotification(notif) {
    setNotifs(n => [{ ...notif, is_read:false, created_at:new Date().toISOString() }, ...n]);
  }

  async function markAllRead() {
    if (tokenStore.get()) await api.patch("/notifications/read-all").catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, is_read:true })));
  }

  const unreadCount = notifs.filter(n => !n.is_read).length;
  return { notifs, loading, unreadCount, addNotification, markAllRead, refetch: load };
}

// ─── FAVOURITES ───────────────────────────────────────────────────────────────
export function useFavourites() {
  const [favStallIds, setFavStallIds] = useState([]);
  const [favItemIds,  setFavItemIds]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) { setLoading(false); return; }
    Promise.all([api.get("/favourites/stalls"), api.get("/favourites/items")])
      .then(([stalls, items]) => {
        setFavStallIds(stalls.map(s => s.id));
        setFavItemIds(items.map(i => i.id));
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function toggleFavStall(stallId) {
    const isFav = favStallIds.includes(stallId);
    setFavStallIds(f => isFav ? f.filter(x=>x!==stallId) : [...f, stallId]);
    try {
      if (isFav) await api.delete(`/favourites/stalls/${stallId}`);
      else        await api.post(`/favourites/stalls/${stallId}`);
    } catch {
      setFavStallIds(f => isFav ? [...f, stallId] : f.filter(x=>x!==stallId));
    }
  }

  async function toggleFavItem(itemId) {
    const isFav = favItemIds.includes(itemId);
    setFavItemIds(f => isFav ? f.filter(x=>x!==itemId) : [...f, itemId]);
    try {
      if (isFav) await api.delete(`/favourites/items/${itemId}`);
      else        await api.post(`/favourites/items/${itemId}`);
    } catch {
      setFavItemIds(f => isFav ? [...f, itemId] : f.filter(x=>x!==itemId));
    }
  }

  return { favStallIds, favItemIds, toggleFavStall, toggleFavItem, loading };
}

// ─── LOYALTY ─────────────────────────────────────────────────────────────────
export function useLoyalty(stallId) {
  const [stamps, setStamps] = useState(DEMO ? { stamps:3, total_earned:3 } : null);
  useEffect(() => {
    if (!stallId || !tokenStore.get()) return;
    api.get(`/hawker/loyalty/${stallId}/me`).then(setStamps).catch(() => {});
  }, [stallId]);
  return stamps;
}