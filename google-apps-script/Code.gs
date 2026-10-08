/* INVICTUS · Backend exclusivo de este juego. No pegar en el script del Pasaporte. */
const RESULT_HEADERS = ['IdPartida', 'IdJugador', 'Nombre', 'Avatar', 'Puntaje', 'PrecisionMostrada', 'Grado', 'Modo', 'Resultado', 'Nivel', 'AciertosTotales', 'IntentosTotales', 'PrecisionTotal', 'TiempoPromedioMs', 'AlcanceTiempoPromedio', 'FechaClienteISO', 'FechaServidor', 'FechaHistorica'];
const PLAYER_HEADERS = ['IdJugador', 'Cedula', 'Nombre', 'Avatar', 'FechaRegistro', 'UltimaActualizacion'];

function instalarInvictus() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty('INVICTUS_SHEET_ID');
    const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('INVICTUS TRAINER · Resultados');
    if (!id) props.setProperty('INVICTUS_SHEET_ID', ss.getId());
    ss.setSpreadsheetTimeZone('America/Bogota');
    prepararHoja_(ss, 'Jugadores', PLAYER_HEADERS);
    prepararHoja_(ss, 'Partidas', RESULT_HEADERS);
    Logger.log('Instalación lista. Tu base de datos: ' + ss.getUrl());
    return ss.getUrl();
  } finally { lock.releaseLock(); }
}
function prepararHoja_(ss, name, headers) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#0b2853').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    sheet.getRange(1, 1, 1, headers.length).createFilter();
  } else if (sheet.getRange(1, 1, 1, headers.length).getValues()[0].join('|') !== headers.join('|')) {
    throw new Error('La estructura de ' + name + ' fue modificada. Restaura sus encabezados.');
  }
  return sheet;
}
function base_() {
  const id = PropertiesService.getScriptProperties().getProperty('INVICTUS_SHEET_ID');
  if (!id) throw new Error('Ejecuta instalarInvictus primero.');
  return SpreadsheetApp.openById(id);
}
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action || 'health';
    if (action === 'health') {
      base_();
      return json_({ ok: true, service: 'INVICTUS TRAINER', version: 2 });
    }
    if (action === 'profile') return json_(perfil_(e.parameter.cedula));
    if (action === 'ranking') return json_({ ok: true, records: ranking_() });
    return json_({ ok: false, error: 'Acción no permitida' });
  } catch (error) { return json_({ ok: false, error: error.message }); }
}
function doPost(e) {
  let lock;
  try {
    const raw = e && e.postData && e.postData.contents || '';
    if (raw.length > 12000) throw new Error('Petición demasiado grande');
    const body = JSON.parse(raw);
    if (!['registerPlayer', 'saveResult'].includes(body.action)) throw new Error('Acción no permitida');
    const r = validarRegistro_(body.record, body.action);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) throw new Error('Servidor ocupado. El navegador reintentará.');
    const ss = base_();
    const results = ss.getSheetByName('Partidas');
    if (body.action === 'saveResult' && buscarId_(results, r.id)) return json_({ ok: true, id: r.id, duplicate: true });
    r.playerId = actualizarJugador_(ss.getSheetByName('Jugadores'), r);
    if (body.action === 'saveResult') {
      const now = new Date();
      results.appendRow([
        r.id, r.playerId, textoCelda_(r.name), r.avatar, r.score, r.accuracy, r.grade,
        r.mode, r.outcome, r.level, r.totalCorrect, r.totalAttempts, r.totalAccuracy,
        r.avgResponseMs, r.avgScope, r.clientDate, now, textoCelda_(r.legacyDate)
      ]);
      results.getRange(results.getLastRow(), 17).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      SpreadsheetApp.flush();
      CacheService.getScriptCache().remove('invictus-ranking-v2');
    }
    return json_({ ok: true, id: r.id });
  } catch (error) { return json_({ ok: false, error: error.message }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function buscarId_(sheet, id) {
  if (sheet.getLastRow() < 2) return null;
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
}
function validarCedula_(value) {
  if (typeof value !== 'string' || !/^\d{5,15}$/.test(value)) throw new Error('Cédula inválida: usa 5 a 15 dígitos sin puntos ni espacios');
  return value;
}
function buscarCedula_(sheet, cedula) {
  if (sheet.getLastRow() < 2) return null;
  return sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(cedula).matchEntireCell(true).findNext();
}
function actualizarJugador_(sheet, r) {
  const cell = buscarCedula_(sheet, r.cedula);
  const now = new Date();
  if (cell) {
    sheet.getRange(cell.getRow(), 3, 1, 2).setValues([[textoCelda_(r.name), r.avatar]]);
    sheet.getRange(cell.getRow(), 6).setValue(now);
    return String(sheet.getRange(cell.getRow(), 1).getValue());
  }
  const id = Utilities.getUuid();
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 2).setNumberFormat('@'); // No perder ceros ni redondear la cédula.
  sheet.getRange(row, 1, 1, PLAYER_HEADERS.length).setValues([[id, r.cedula, textoCelda_(r.name), r.avatar, now, now]]);
  return id;
}
function perfil_(cedula) {
  validarCedula_(cedula);
  const ss = base_(), players = ss.getSheetByName('Jugadores');
  const cell = buscarCedula_(players, cedula);
  if (!cell) return { ok: true, found: false, records: [] };
  const player = players.getRange(cell.getRow(), 1, 1, PLAYER_HEADERS.length).getValues()[0];
  const sheet = ss.getSheetByName('Partidas');
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, RESULT_HEADERS.length).getValues().filter(r => String(r[1]) === String(player[0]));
  const stats = {
    games: rows.length, wins: rows.filter(r => r[8] === 'VICTORIA').length,
    losses: rows.filter(r => r[8] === 'DERROTA').length,
    imported: rows.filter(r => r[8] === 'IMPORTADO').length,
    bestScore: rows.reduce((best, r) => Math.max(best, Number(r[4])), 0)
  };
  const records = rows.map(registroPublico_).sort((a, b) => b.score - a.score);
  return { ok: true, found: true, name: String(player[2]), avatar: player[3], stats, records };
}
function registroPublico_(r) {
  return {
    id: r[0], name: String(r[2]), avatar: r[3], score: Number(r[4]), accuracy: Number(r[5]), grade: r[6], mode: r[7],
    date: r[16] instanceof Date ? Utilities.formatDate(r[16], 'America/Bogota', 'dd/MM/yyyy HH:mm') : String(r[16])
  };
}
function textoCelda_(value) {
  const text = String(value || '');
  return /^[=+@-]/.test(text) ? "'" + text : text;
}
function numero_(value, min, max, optional) {
  if (optional && (value === undefined || value === null)) return '';
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Valor numérico inválido');
  return value;
}
function validarRegistro_(input, action) {
  if (!input || typeof input !== 'object') throw new Error('Registro inválido');
  const r = Object.assign({}, input);
  ['id', 'playerId'].forEach(key => {
    if (typeof r[key] !== 'string' || !/^[a-zA-Z0-9-]{8,120}$/.test(r[key])) throw new Error('Identificador inválido');
  });
  if (typeof r.name !== 'string' || !r.name.trim() || r.name.length > 100 || /[\x00-\x1f]/.test(r.name)) throw new Error('Nombre inválido (máximo 100 caracteres)');
  r.name = r.name.trim();
  r.cedula = validarCedula_(r.cedula);
  if (!['mateo', 'sofia', 'lucas', 'valentina'].includes(r.avatar)) throw new Error('Avatar inválido');
  if (typeof r.clientDate !== 'string' || r.clientDate.length > 40 || !Number.isFinite(Date.parse(r.clientDate))) throw new Error('Fecha inválida');
  if (action === 'registerPlayer') return r;
  r.score = numero_(r.score, 0, 10000000);
  r.accuracy = numero_(r.accuracy, 0, 100);
  if (!['S', 'A', 'B', 'C', 'D'].includes(r.grade)) throw new Error('Grado inválido');
  if (!['Campaña (4 Niv)', 'Examen Libre'].includes(r.mode)) throw new Error('Modo inválido');
  if (!['VICTORIA', 'DERROTA', 'IMPORTADO'].includes(r.outcome)) throw new Error('Resultado inválido');
  r.level = numero_(r.level, 0, 4, r.outcome === 'IMPORTADO');
  r.totalCorrect = numero_(r.totalCorrect, 0, 10000, true);
  r.totalAttempts = numero_(r.totalAttempts, 0, 10000, true);
  if (r.totalCorrect !== '' && r.totalAttempts !== '' && r.totalCorrect > r.totalAttempts) throw new Error('Aciertos mayores a intentos');
  r.totalAccuracy = numero_(r.totalAccuracy, 0, 100, true);
  r.avgResponseMs = numero_(r.avgResponseMs, 0, 60000, true);
  r.avgScope = ['Último nivel', 'Examen completo'].includes(r.avgScope) ? r.avgScope : '';
  r.legacyDate = String(r.legacyDate || '').slice(0, 80);
  return r;
}
function ranking_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('invictus-ranking-v2');
  if (cached) return JSON.parse(cached);
  const sheet = base_().getSheetByName('Partidas');
  if (sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, RESULT_HEADERS.length).getValues();
  const records = rows.map(registroPublico_).sort((a, b) => b.score - a.score).slice(0, 20);
  cache.put('invictus-ranking-v2', JSON.stringify(records), 30);
  return records;
}
