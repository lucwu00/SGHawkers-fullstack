// ─── src/hooks/useWebSocket.js ────────────────────────────────────────────────
// Shared hook. Copy into each frontend's src/hooks/ folder.

import { useEffect, useRef, useCallback } from "react";
import { tokenStore } from "../api/client";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000/ws";

/**
 * useWebSocket — connects to SGHawkers WebSocket server.
 *
 * @param {function} onMessage  - called with parsed message object on every event
 * @param {boolean}  enabled    - only connect when true (e.g. when logged in)
 *
 * Returns: { send }
 */
export function useWebSocket(onMessage, enabled = true) {
  const wsRef        = useRef(null);
  const retryTimer   = useRef(null);
  const retryCount   = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled) return;
    const token = tokenStore.get();
    if (!token) return;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      // Keepalive ping every 25 seconds
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type:"ping" }));
        else clearInterval(ping);
      }, 25000);
      ws._pingInterval = ping;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== "pong") onMessageRef.current(msg);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = (event) => {
      if (ws._pingInterval) clearInterval(ws._pingInterval);
      if (event.code === 1008) return; // auth failure — don't retry
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current++;
      retryTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => { ws.close(); };
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimer.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}