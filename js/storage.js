/* Persistencia: cola durable local + confirmación del servidor + ranking compartido. */
(() => {
  'use strict';
  const config = window.INVICTUS_CONFIG || {};
  const keys = { queue: 'invictus_cloud_queue_v1', cache: 'invictus_cloud_ranking_v1', profiles: 'invictus_profile_ids_v1', legacy: 'invictus_qte_ranking' };
  let busy = false;
  let globalRanking = read(keys.cache, []);
  let refreshPromise = null;
  let personalProfile = null;
  let profileVersion = 0;
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function configured() { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.gasUrl || ''); }
  function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
  function emit(message) {
    const pending = read(keys.queue, []).length;
    document.querySelectorAll('[data-save-status]').forEach(el => {
      el.textContent = message || (!configured() ? 'Guardado local · falta conectar Google Sheets' : pending ? `${pending} registro(s) pendientes de envío` : 'Sin envíos pendientes · Google Sheets configurado');
    });
  }
  function profileId(name) {
    const map = read(keys.profiles, {}), key = name.trim().toLocaleLowerCase('es-CO');
    if (!map[key]) { map[key] = uuid(); write(keys.profiles, map); }
    return map[key];
  }
  function enqueue(action, record) {
    const queue = read(keys.queue, []);
    if (!queue.some(item => item.record.id === record.id)) queue.push({ action, record });
    write(keys.queue, queue); // Si el almacenamiento está lleno, nunca fingir guardado.
    emit();
    void flush();
    return record;
  }
  async function request(action, record, params = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs || 25000);
    try {
      const url = new URL(config.gasUrl);
      if (!record) { url.searchParams.set('action', action); url.searchParams.set('_', Date.now()); Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v)); }
      const options = record ? { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ action, record }) } : {};
      const response = await fetch(url.toString(), { ...options, redirect: 'follow', credentials: 'omit', signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'El servidor rechazó el registro');
      return data;
    } finally { clearTimeout(timer); }
  }
  async function flush() {
    if (busy || !configured() || !navigator.onLine) { emit(); return; }
    busy = true;
    try {
      while (true) {
        const item = read(keys.queue, [])[0];
        if (!item) break;
        emit('Guardando en Google Sheets…');
        const result = await request(item.action, item.record);
        if (result.id !== item.record.id) throw new Error('No se recibió confirmación del registro');
        // Releer para conservar partidas añadidas mientras la petición estaba en curso.
        write(keys.queue, read(keys.queue, []).filter(x => x.record.id !== item.record.id));
      }
      emit();
      await refresh();
      if (personalProfile) await profile(personalProfile.cedula);
    } catch (error) {
      console.warn('INVICTUS: envío pendiente', error.message);
      emit('Pendiente de envío · se reintentará automáticamente');
    } finally { busy = false; }
  }
  async function refresh() {
    if (!configured()) { emit(); return ranking(); }
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const result = await request('ranking');
        globalRanking = Array.isArray(result.records) ? result.records : [];
        write(keys.cache, globalRanking);
        window.dispatchEvent(new Event('invictus:ranking'));
        return ranking();
      } catch (error) {
        emit('Sin conexión al ranking · mostrando copia local');
        return ranking();
      } finally { refreshPromise = null; }
    })();
    return refreshPromise;
  }
  function ranking() {
    const pending = read(keys.queue, []).filter(x => x.action === 'saveResult').map(x => x.record);
    const records = configured() ? [...globalRanking, ...pending] : pending;
    const byId = new Map();
    records.forEach((r, i) => byId.set(r.id || 'legacy-' + i, r));
    return [...byId.values()].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 20);
  }
  function validCedula(value) { return /^\d{5,15}$/.test(value); }
  async function profile(cedula) {
    if (!validCedula(cedula)) throw new Error('Ingresa una cédula de 5 a 15 dígitos, sin puntos ni espacios.');
    const version = ++profileVersion;
    const key = 'invictus_person_' + cedula;
    if (configured() && navigator.onLine) {
      // Un fallo del servidor nunca se interpreta como usuario nuevo.
      const data = await request('profile', null, { cedula });
      if (version !== profileVersion) return { ...data, cedula, offline: false };
      personalProfile = { ...data, cedula, offline: false };
      write(key, personalProfile);
    } else {
      const cached = read(key, null);
      personalProfile = cached ? { ...cached, offline: true } : { ok: true, found: false, cedula, records: [], offline: true };
    }
    window.dispatchEvent(new Event('invictus:profile'));
    return personalProfile;
  }
  function register(cedula, name, avatar) {
    if (!validCedula(cedula)) throw new Error('Cédula inválida');
    const key = 'invictus_person_' + cedula;
    profileVersion++;
    const old = read(key, {});
    personalProfile = { ...old, ok: true, found: true, cedula, name, avatar, records: old.records || [], offline: !configured() || !navigator.onLine };
    write(key, personalProfile);
    migrateLegacy(cedula, name);
    return enqueue('registerPlayer', { id: uuid(), playerId: profileId(cedula), cedula, name, avatar, clientDate: new Date().toISOString() });
  }
  function saveResult(data) {
    if (!validCedula(data.cedula)) throw new Error('Falta la cédula del jugador');
    const record = { ...data, id: uuid(), playerId: profileId(data.cedula), clientDate: new Date().toISOString(), date: new Date().toLocaleString('es-CO') };
    return enqueue('saveResult', record);
  }
  function migrateLegacy(cedula, name) {
    const old = read(keys.legacy, []);
    if (!Array.isArray(old) || !old.length) return;
    const assignments = read('invictus_legacy_assignments_v2', {});
    const queue = read(keys.queue, []);
    old.forEach((r, i) => {
      if (!r.name || r.name.trim().toLowerCase() !== name.trim().toLowerCase() || assignments[i] || !Number.isFinite(Number(r.score))) return;
      const id = 'legacy-' + profileId(cedula) + '-' + i;
      if (!queue.some(x => x.record.id === id)) queue.push({ action: 'saveResult', record: { ...r, avatar: r.avatar || 'mateo', id, cedula, playerId: profileId(cedula), outcome: 'IMPORTADO', legacyDate: r.date || '', clientDate: new Date().toISOString(), score: Number(r.score), accuracy: Number(r.accuracy) || 0 } });
      assignments[i] = cedula;
    });
    write(keys.queue, queue);
    write('invictus_legacy_assignments_v2', assignments);
  }
  function personal() {
    if (!personalProfile) return { records: [], stats: null };
    const pending = read(keys.queue, []).filter(x => x.action === 'saveResult' && x.record.cedula === personalProfile.cedula).map(x => x.record);
    const map = new Map();
    [...(personalProfile.records || []), ...pending].forEach(r => map.set(r.id, r));
    return { ...personalProfile, records: [...map.values()].sort((a, b) => Number(b.score) - Number(a.score)) };
  }
  function clearLocalCache() {
    localStorage.removeItem(keys.cache);
    globalRanking = [];
    emit('Copia local del ranking limpiada · los resultados de Sheets se conservan');
    void refresh();
  }
  window.InvictusStorage = { configured, register, saveResult, ranking, personal, profile, refresh, flush, clearLocalCache };
  window.addEventListener('online', () => void flush());
  window.addEventListener('storage', e => { if (e.key === keys.queue) { emit(); void flush(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void flush(); });
  document.addEventListener('DOMContentLoaded', () => {
    emit(); void flush(); void refresh();
    setInterval(() => void flush(), config.retryIntervalMs || 60000);
  });
})();
