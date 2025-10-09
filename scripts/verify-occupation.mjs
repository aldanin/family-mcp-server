import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

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

async function verify() {
  try {
    const client = await pool.connect();
    try {
      const schemaRes = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='members' ORDER BY ordinal_position`);
      console.log('members table columns:');
      console.table(schemaRes.rows);

      const res = await client.query(`SELECT id, name, occupation FROM members WHERE LOWER(name) = 'alon'`);
      console.log('Alon rows:');
      console.log(JSON.stringify(res.rows, null, 2));
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Verify failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

verify();
