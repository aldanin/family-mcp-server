import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Resolve the migration file path in a cross-platform way for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATION_FILE = path.join(__dirname, '..', 'migrations', '001-add-occupation.sql');

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

const pool = new pg.Pool({
  host: getEnv('PGHOST', 'localhost'),
  port: Number(getEnv('PGPORT', 5432)),
  database: getEnv('PGDATABASE', 'thedaninfamily'),
  user: getEnv('PGUSER', 'postgres'),
  password: getEnv('PGPASSWORD', ''),
});

// If password is not a non-empty string, try to read DB config from src/index.ts as a fallback
async function maybePopulateFromSourceFileIfNeeded() {
  if (pool.options.password && typeof pool.options.password === 'string' && pool.options.password !== '') {
    return;
  }

  try {
    const srcPath = path.join(__dirname, '..', 'src', 'index.ts');
    if (!fs.existsSync(srcPath)) return;
    const content = fs.readFileSync(srcPath, 'utf8');

    const hostMatch = content.match(/host:\s*['"]([^'\"]+)['"]/);
    const portMatch = content.match(/port:\s*(\d+)/);
    const dbMatch = content.match(/database:\s*['"]([^'\"]+)['"]/);
    const userMatch = content.match(/user:\s*['"]([^'\"]+)['"]/);
    const passMatch = content.match(/password:\s*['"]([^'\"]+)['"]/);

    const overrides = {};
    if (hostMatch) overrides.host = hostMatch[1];
    if (portMatch) overrides.port = Number(portMatch[1]);
    if (dbMatch) overrides.database = dbMatch[1];
    if (userMatch) overrides.user = userMatch[1];
    if (passMatch) overrides.password = passMatch[1];

    if (Object.keys(overrides).length > 0) {
      console.log('Using DB config fallback from src/index.ts');
      // close existing pool
      await pool.end();
      // create new pool with overrides
      const newOptions = Object.assign({}, pool.options, overrides);
      // create a new pool instance by replacing pool variable via assignment
      // Note: this file uses the outer `pool` const, so we cannot reassign; instead create a helper that returns a client directly when needed.
      return newOptions;
    }
  } catch (err) {
    // ignore and continue to use env defaults
  }
  return null;

}

async function runMigration() {
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error('Migration file not found at', MIGRATION_FILE);
    process.exit(1);
  }
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log('Running migration:', MIGRATION_FILE);

  // Check for fallback DB options read from src/index.ts
  const fallbackOptions = await maybePopulateFromSourceFileIfNeeded();
  let localPool = pool;
  if (fallbackOptions) {
    localPool = new pg.Pool(fallbackOptions);
  }

  const client = await localPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    if (localPool && localPool !== pool) {
      await localPool.end();
    } else {
      await pool.end();
    }
  }
}

runMigration().catch((err) => {
  console.error('Unexpected error running migration:', err);
  process.exit(1);
});
