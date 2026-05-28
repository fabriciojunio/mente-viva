/**
 * storage.js — Persistência local offline-first.
 * AsyncStorage como fonte de verdade quando offline.
 * Sincroniza com backend quando há conexão.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PLAYER:        'mv:player',
  SESSIONS:      'mv:sessions',
  BRAIN_SCORES:  'mv:brain',
  ACHIEVEMENTS:  'mv:achievements',
  SETTINGS:      'mv:settings',
  OFFLINE_QUEUE: 'mv:offline_queue',
  TIPS:          'mv:tips',
  LAST_PLAYED:   'mv:last_played',
  WORD_PROGRESS: 'mv:word_progress',
};

// Sensitive data never stored in localStorage — only AsyncStorage (device-local)
// Token storage: sessionStorage only (cleared on app close)

async function get(key) {
  try { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

async function set(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { /* Silent fail — offline */ }
}

// ── Player ────────────────────────────────────────────────────────────────────
const getPlayer    = () => get(KEYS.PLAYER);
const savePlayer   = (p) => set(KEYS.PLAYER, p);

// ── Sessions ──────────────────────────────────────────────────────────────────
const getSessions = () => get(KEYS.SESSIONS).then(r => r || []);

async function addSession(session) {
  const sessions = await getSessions();
  const entry    = { ...session, createdAt: new Date().toISOString() };
  const updated  = [entry, ...sessions].slice(0, 500);
  await set(KEYS.SESSIONS, updated);
  return entry;
}

async function getStats() {
  const sessions = await getSessions();
  if (!sessions.length) return { totalGames:0, totalPoints:0, avgScore:0, bestScore:0, streakDays:0 };
  const totalPoints = sessions.reduce((a,s) => a + (s.score||0), 0);
  const bestScore   = Math.max(...sessions.map(s => s.score||0));
  return { totalGames:sessions.length, totalPoints, avgScore:Math.round(totalPoints/sessions.length), bestScore, streakDays:calcStreak(sessions) };
}

// ── Brain scores ──────────────────────────────────────────────────────────────
async function getBrainScores() {
  const r = await get(KEYS.BRAIN_SCORES);
  const d = { memory:0, speed:0, attention:0, reasoning:0, language:0 };
  return r || { scores:d, counts:{...d} };
}
async function updateBrainScore(area, pts) {
  const data = await getBrainScores();
  data.scores[area] = (data.scores[area]||0) + pts;
  data.counts[area] = (data.counts[area]||0) + 1;
  await set(KEYS.BRAIN_SCORES, data);
}

// ── Achievements ──────────────────────────────────────────────────────────────
const getAchievements = () => get(KEYS.ACHIEVEMENTS).then(r => r || []);
async function unlockAchievement(id, label) {
  const achs = await getAchievements();
  if (achs.find(a => a.id === id)) return null;
  const newAch = { id, label, unlockedAt: new Date().toISOString() };
  await set(KEYS.ACHIEVEMENTS, [...achs, newAch]);
  return newAch;
}

// ── Settings ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { sound:true, haptics:true, fontSize:'normal' };
const getSettings  = () => get(KEYS.SETTINGS).then(r => r || DEFAULT_SETTINGS);
const saveSettings = (s) => set(KEYS.SETTINGS, s);

// ── Tips ──────────────────────────────────────────────────────────────────────
const cacheTips = (tips) => set(KEYS.TIPS, tips);
async function getTipOfDay() {
  const tips = await get(KEYS.TIPS) || DEFAULT_TIPS;
  const day  = Math.floor(Date.now() / 86400000);
  return tips[day % tips.length];
}

// ── Last played ───────────────────────────────────────────────────────────────
const updateLastPlayed = () => set(KEYS.LAST_PLAYED, new Date().toISOString());
const getLastPlayed    = () => get(KEYS.LAST_PLAYED);

// ── Offline queue ─────────────────────────────────────────────────────────────
async function enqueue(action) {
  const q = await get(KEYS.OFFLINE_QUEUE) || [];
  q.push({ ...action, queuedAt: new Date().toISOString() });
  await set(KEYS.OFFLINE_QUEUE, q);
}
async function flushQueue(syncFn) {
  const q = await get(KEYS.OFFLINE_QUEUE) || [];
  if (!q.length) return 0;
  const done = [];
  for (const action of q) {
    try { await syncFn(action); done.push(action); } catch { break; }
  }
  await set(KEYS.OFFLINE_QUEUE, q.filter(a => !done.includes(a)));
  return done.length;
}

// ── Clear all (logout / LGPD) ─────────────────────────────────────────────────
const clearAll = () => AsyncStorage.multiRemove(Object.values(KEYS));

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => (s.createdAt||'').slice(0,10)))].sort().reverse();
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i=1; i<days.length; i++) {
    if ((new Date(days[i-1])-new Date(days[i]))/86400000 === 1) streak++; else break;
  }
  return streak;
}

const DEFAULT_TIPS = [
  { id:1, text:'Jogar 20 min/dia pode reduzir o risco de Alzheimer em até 25%! (ACTIVE, 2026)', category:'science' },
  { id:2, text:'Caça-palavras exercita o córtex pré-frontal e mantém a memória léxica ativa!', category:'science' },
  { id:3, text:'Adultos que fazem puzzles de palavras têm cérebro equivalente a pessoas 10 anos mais jovens!', category:'science' },
  { id:4, text:'Consistência importa mais que intensidade — jogue todo dia, mesmo 10 minutos! 💪', category:'motivation' },
  { id:5, text:'10 semanas de treino digital rejuvenesce o cérebro em 10 anos! (McGill, 2024)', category:'science' },
  { id:6, text:'Quase metade dos casos de demência podem ser prevenidos! (Lancet, 2024)', category:'science' },
  { id:7, text:'Jogar reduz o estresse, melhora o humor e aumenta a autoestima! 😊', category:'motivation' },
  { id:8, text:'Variar os jogos cria novas conexões neurais — tente todos!', category:'tip' },
];

export const storage = {
  getPlayer, savePlayer,
  getSessions, addSession, getStats,
  getBrainScores, updateBrainScore,
  getAchievements, unlockAchievement,
  getSettings, saveSettings,
  cacheTips, getTipOfDay,
  updateLastPlayed, getLastPlayed,
  enqueue, flushQueue,
  clearAll,
  calcStreak,
  KEYS,
};
