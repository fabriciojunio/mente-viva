/**
 * api.js — Serviço de API com fallback offline automático.
 * Toda chamada que falha vai para a fila offline.
 */
import { storage } from './storage';

// Em desenvolvimento: 10.0.2.2 é o localhost no emulador Android
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api/v1';
const TIMEOUT = 8000;

function localId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function apiFetch(path, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    });
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Players ───────────────────────────────────────────────────────────────────
export async function createPlayer(name) {
  try {
    const data = await apiFetch('/players', { method:'POST', body: JSON.stringify({ name }) });
    return { ok:true, data: data.data, offline:false };
  } catch {
    // Offline: cria perfil local
    const player = { id: localId(), name, local: true, createdAt: new Date().toISOString() };
    await storage.enqueue({ type:'CREATE_PLAYER', payload:{ name } });
    return { ok:true, data: player, offline:true };
  }
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export async function submitSession(session) {
  try {
    const data = await apiFetch('/sessions', { method:'POST', body: JSON.stringify(session) });
    return { ok:true, data: data.data, offline:false };
  } catch {
    await storage.enqueue({ type:'SUBMIT_SESSION', payload: session });
    return { ok:true, offline:true };
  }
}

// ── Tips ──────────────────────────────────────────────────────────────────────
export async function fetchTips() {
  try {
    const data = await apiFetch('/tips');
    if (data?.data?.all) await storage.cacheTips(data.data.all);
    return { ok:true, data: data.data };
  } catch {
    return { ok:false, offline:true };
  }
}

// ── Achievements ──────────────────────────────────────────────────────────────
export async function checkAchievementsRemote(playerId) {
  try {
    const data = await apiFetch(`/players/${playerId}/achievements`);
    return { ok:true, data: data.data };
  } catch {
    return { ok:false, offline:true };
  }
}

// ── Sync offline queue ────────────────────────────────────────────────────────
export async function syncOffline() {
  return storage.flushQueue(async (action) => {
    if (action.type === 'SUBMIT_SESSION')
      await apiFetch('/sessions', { method:'POST', body: JSON.stringify(action.payload) });
    if (action.type === 'CREATE_PLAYER')
      await apiFetch('/players',  { method:'POST', body: JSON.stringify(action.payload) });
  });
}
