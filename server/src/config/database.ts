import mysql, { RowDataPacket } from "mysql2/promise";
import { env } from "./env";

const dbConfig = {
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000 // 30 segundos de timeout
};

// Log da configuração (sem senha)
console.log("🔌 Configurando conexão MySQL:", {
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  database: env.dbName,
  hasPassword: !!env.dbPassword
});

export const pool = mysql.createPool(dbConfig);

// Testar conexão ao inicializar (após criar o pool)
pool.getConnection()
  .then((connection) => {
    console.log("✅ Conexão MySQL estabelecida com sucesso!");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar ao MySQL:", error.message);
  });

export async function initDb() {
  const connection = await pool.getConnection();
  try {
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
        external_id VARCHAR(255),
        image_url TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar coluna image_url se não existir (para bancos já existentes)
    try {
      const [columns] = await connection.query<any[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'games' 
         AND COLUMN_NAME = 'image_url'`
      );
      
      if (!columns || columns.length === 0) {
        await connection.query(`
          ALTER TABLE games 
          ADD COLUMN image_url TEXT
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna image_url adicionada à tabela games");
      }
    } catch (error: any) {
      // Ignorar erro se a coluna já existir ou se houver outro problema
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna image_url:", error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        image_url VARCHAR(255),
        active BOOLEAN NOT NULL DEFAULT true
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        currency VARCHAR(10) DEFAULT 'BRL',
        balance DECIMAL(10, 2) DEFAULT 0.00,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_is_admin (is_admin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar coluna balance se não existir (migração)
    try {
      const [balanceColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'balance'`
      );
      
      if (!balanceColumns || balanceColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna balance adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna balance:", error.message);
    }

    // Adicionar colunas email e document se não existirem (migração)
    try {
      const [emailColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'email'`
      );
      
      if (!emailColumns || emailColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN email VARCHAR(255) NULL
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna email adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna email:", error.message);
    }

    try {
      const [documentColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'document'`
      );
      
      if (!documentColumns || documentColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN document VARCHAR(20) NULL
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna document adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna document:", error.message);
    }

    // Adicionar colunas para sistema de indicação
    try {
      const [referralCodeColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'referral_code'`
      );
      
      if (!referralCodeColumns || referralCodeColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN referral_code VARCHAR(20) UNIQUE NULL,
          ADD COLUMN bonus_balance DECIMAL(10, 2) DEFAULT 0.00,
          ADD COLUMN referred_by INT NULL,
          ADD COLUMN pix_key VARCHAR(255) NULL,
          ADD INDEX idx_referral_code (referral_code),
          ADD INDEX idx_referred_by (referred_by),
          ADD FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log("✅ Colunas de indicação e pix_key adicionadas à tabela users");
      } else {
        // Verificar se pix_key existe
        const [pixKeyColumns] = await connection.query<RowDataPacket[]>(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'users' 
           AND COLUMN_NAME = 'pix_key'`
        );
        
        if (!pixKeyColumns || pixKeyColumns.length === 0) {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN pix_key VARCHAR(255) NULL
          `);
          console.log("✅ Coluna pix_key adicionada à tabela users");
        }
      }
    } catch (error: any) {
      console.warn("⚠️ Aviso ao verificar/adicionar colunas de indicação:", error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        request_number VARCHAR(255) UNIQUE NOT NULL,
        transaction_id VARCHAR(255),
        payment_method ENUM('PIX', 'CARD', 'BOLETO', 'BONUS', 'GAME_BET', 'WITHDRAW') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        qr_code TEXT,
        qr_code_base64 TEXT,
        barcode VARCHAR(255),
        digitable_line VARCHAR(255),
        due_date DATE,
        callback_url TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_request_number (request_number),
        INDEX idx_status (status),
        INDEX idx_payment_method (payment_method)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        category VARCHAR(50) DEFAULT 'eventos',
        active BOOLEAN NOT NULL DEFAULT true,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (active),
        INDEX idx_position (position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de bônus
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('first_deposit', 'deposit', 'vip_level', 'custom') NOT NULL,
        bonus_percentage DECIMAL(5,2) DEFAULT 0,
        bonus_fixed DECIMAL(10,2) DEFAULT 0,
        min_deposit DECIMAL(10,2) DEFAULT 0,
        max_bonus DECIMAL(10,2) NULL,
        rollover_multiplier DECIMAL(5,2) DEFAULT 1,
        rtp_percentage DECIMAL(5,2) DEFAULT 96,
        vip_level_required INT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela para rastrear apostas dos indicados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS referral_bets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referred_user_id INT NOT NULL,
        referrer_user_id INT NOT NULL,
        bet_amount DECIMAL(10, 2) NOT NULL,
        total_bet_amount DECIMAL(10, 2) DEFAULT 0.00,
        bonus_credited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_referral_bet (referred_user_id, referrer_user_id),
        INDEX idx_referred_user (referred_user_id),
        INDEX idx_referrer_user (referrer_user_id),
        INDEX idx_bonus_credited (bonus_credited)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de recompensas de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reward_id VARCHAR(255) NOT NULL,
        bonus_amount DECIMAL(10, 2) DEFAULT 0,
        redeemed BOOLEAN DEFAULT false,
        redeemed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_reward (user_id, reward_id),
        INDEX idx_user_id (user_id),
        INDEX idx_reward_id (reward_id),
        INDEX idx_redeemed (redeemed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de bônus de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bonus_id INT NOT NULL,
        transaction_id INT NOT NULL,
        bonus_amount DECIMAL(10,2) NOT NULL,
        rollover_required DECIMAL(10,2) NOT NULL,
        rollover_completed DECIMAL(10,2) DEFAULT 0,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bonus_id) REFERENCES bonuses(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de apostas dos usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_bets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_id VARCHAR(255) NOT NULL,
        bet_amount DECIMAL(10,2) NOT NULL,
        win_amount DECIMAL(10,2) DEFAULT 0,
        rtp_used DECIMAL(5,2) DEFAULT 96,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de webhooks de tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        events JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_enabled (enabled)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar colunas VIP e estatísticas aos usuários se não existirem
    try {
      const [vipColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'vip_level'`
      );
      
      if (!vipColumns || vipColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN vip_level INT DEFAULT 0,
          ADD COLUMN total_bet_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN total_deposit_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN total_withdrawal_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN total_bonus_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN last_deposit_at TIMESTAMP NULL,
          ADD COLUMN last_bet_at TIMESTAMP NULL,
          ADD COLUMN last_withdrawal_at TIMESTAMP NULL
        `);
        console.log("✅ Colunas VIP e estatísticas adicionadas à tabela users");
      }
    } catch (error: any) {
      console.warn("⚠️ Aviso ao verificar/adicionar colunas VIP:", error.message);
    }

    // Adicionar coluna user_type se não existir
    try {
      const [userTypeColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'user_type'`
      );
      
      if (!userTypeColumns || userTypeColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN user_type ENUM('user', 'affiliate', 'manager', 'admin') DEFAULT 'user'
        `);
        console.log("✅ Coluna user_type adicionada à tabela users");
      }
    } catch (error: any) {
      console.warn("⚠️ Aviso ao verificar/adicionar coluna user_type:", error.message);
    }

    // Tabela de afiliados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        manager_id INT NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        referral_link VARCHAR(255) NOT NULL,
        commission_rate DECIMAL(5,2) DEFAULT 5.00,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_manager_id (manager_id),
        INDEX idx_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de comissões
    await connection.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        manager_id INT NOT NULL,
        user_id INT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_bet DECIMAL(10,2) DEFAULT 0,
        total_win DECIMAL(10,2) DEFAULT 0,
        net_result DECIMAL(10,2) DEFAULT 0,
        affiliate_commission DECIMAL(10,2) DEFAULT 0,
        manager_commission DECIMAL(10,2) DEFAULT 0,
        status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_affiliate_id (affiliate_id),
        INDEX idx_manager_id (manager_id),
        INDEX idx_user_id (user_id),
        INDEX idx_period (period_start, period_end),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela para rastrear usuários referenciados por afiliados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS affiliate_referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        referred_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
        FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_referral (affiliate_id, referred_user_id),
        INDEX idx_affiliate_id (affiliate_id),
        INDEX idx_referred_user_id (referred_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // eslint-disable-next-line no-console
    console.log("✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao conectar/inicializar banco de dados MySQL:", error);
    throw error;
  } finally {
    connection.release();
  }
}



