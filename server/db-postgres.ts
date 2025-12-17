import { Pool } from "pg";

// Railway PostgreSQL Connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ DATABASE_URL não configurada. Configure a URL do PostgreSQL do Railway no .env."
  );
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export async function initDb() {
  try {
    // Cria tabelas básicas se ainda não existirem (PostgreSQL)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        external_id TEXT,
        active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        external_id TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        link_url TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // eslint-disable-next-line no-console
    console.log("✅ Banco de dados PostgreSQL conectado e tabelas criadas com sucesso!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao conectar/inicializar banco de dados PostgreSQL:", error);
    throw error;
  }
}


