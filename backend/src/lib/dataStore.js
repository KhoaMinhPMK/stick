const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'dev-db.json');

const defaultDb = {
  users: [],
  sessions: [],
  onboardingStates: [],
  journals: [],
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), 'utf8');
  }
}

function loadDb() {
  ensureDb();
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

function saveDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

module.exports = {
  loadDb,
  saveDb,
};

