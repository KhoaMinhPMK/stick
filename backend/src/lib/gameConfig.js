/**
 * GameConfig — cached reader for the GameConfig table.
 * Same pattern as getConfigValue in apiV1 but dedicated to game-related config.
 */
const { prisma } = require('./db');

const _cache = new Map();
const CACHE_TTL = 60_000; // 60s

/**
 * Get a game config value by key. Falls back to `fallback` if not found.
 * Automatically parses based on the `type` column (number/boolean/json/string).
 */
async function getGameConfig(key, fallback = null) {
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.parsed;

  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT `value`, `type` FROM `GameConfig` WHERE `key` = ? LIMIT 1",
      key
    );
    if (rows.length === 0) {
      _cache.set(key, { parsed: fallback, ts: Date.now() });
      return fallback;
    }
    const { value, type } = rows[0];
    let parsed;
    switch (type) {
      case 'number':  parsed = Number(value); break;
      case 'boolean': parsed = value === 'true' || value === '1'; break;
      case 'json':    parsed = JSON.parse(value); break;
      default:        parsed = value;
    }
    _cache.set(key, { parsed, ts: Date.now() });
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Get multiple game configs at once. Returns an object { key: parsedValue }.
 */
async function getGameConfigs(keys) {
  const result = {};
  // Batch query
  try {
    const placeholders = keys.map(() => '?').join(',');
    const rows = await prisma.$queryRawUnsafe(
      `SELECT \`key\`, \`value\`, \`type\` FROM \`GameConfig\` WHERE \`key\` IN (${placeholders})`,
      ...keys
    );
    const map = new Map();
    for (const row of rows) {
      let parsed;
      switch (row.type) {
        case 'number':  parsed = Number(row.value); break;
        case 'boolean': parsed = row.value === 'true' || row.value === '1'; break;
        case 'json':    parsed = JSON.parse(row.value); break;
        default:        parsed = row.value;
      }
      map.set(row.key, parsed);
      _cache.set(row.key, { parsed, ts: Date.now() });
    }
    for (const k of keys) {
      result[k] = map.has(k) ? map.get(k) : null;
    }
  } catch {
    for (const k of keys) result[k] = null;
  }
  return result;
}

/** Clear cache (e.g. after admin updates) */
function clearGameConfigCache() {
  _cache.clear();
}

module.exports = { getGameConfig, getGameConfigs, clearGameConfigCache };
