// src/utils/helpers.js
import { DELIVERY_BANDS } from "./constants";

export function parseKm(val) {
  if (typeof val === "number") return val;
  return parseFloat((val || "2").toString().replace(" km","")) || 2;
}

export function getDeliveryFee(km) {
  for (const b of DELIVERY_BANDS) if (km <= b.max) return b.fee;
  return 8.0;
}

export function todayISO() { return new Date().toISOString().slice(0,10); }

export function addDays(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10);
}

export function fmtShort(iso) {
  return new Date(iso).toLocaleDateString("en-SG",{ weekday:"short", day:"numeric", month:"short" });
}