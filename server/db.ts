import mysql from "mysql2/promise";

// Configuração do MySQL (Hostinger ou Railway)
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chinesa_cassino",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (!process.env.DB_HOST) {
  // eslint-disable-next-line no-console
  console.warn(
    "Variáveis de banco de dados não configuradas. Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env."
  );
}

// Pool de conexões MySQL
export const pool = mysql.createPool(dbConfig);

export async function initDb() {
  try {
    const connection = await pool.getConnection();

    // Cria tabelas básicas se ainda não existirem (sintaxe MySQL)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        external_id VARCHAR(255),
        active BOOLEAN NOT NULL DEFAULT true
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        external_id VARCHAR(255) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
        INDEX idx_provider_id (provider_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        link_url TEXT,
        position INT NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        INDEX idx_position (position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    connection.release();

    // eslint-disable-next-line no-console
    console.log("✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao conectar/inicializar banco de dados MySQL:", error);
    throw error;
  }
}
