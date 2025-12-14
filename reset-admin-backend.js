#!/usr/bin/env node

/**
 * Script para resetar senha do admin pelo backend
 * 
 * Uso:
 *   node reset-admin-backend.js [username] [senha]
 * 
 * Exemplo:
 *   node reset-admin-backend.js admin admin123
 */

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "shortline.proxy.rlwy.net",
  port: parseInt(process.env.DB_PORT || "23856"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "railway"
};

async function resetAdminPassword() {
  const username = process.argv[2] || "admin";
  const newPassword = process.argv[3] || "admin123";
  
  console.log("🔄 Resetando senha do admin pelo backend...");
  console.log(`   Username: ${username}`);
  console.log(`   Nova senha: ${newPassword}`);
  console.log(`   Banco: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  
  if (!dbConfig.password) {
    console.error("❌ Erro: DB_PASSWORD não configurado!");
    console.log("   Configure a variável DB_PASSWORD no .env ou nas variáveis de ambiente");
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Verificar se o usuário existe
    const [existing] = await connection.query(
      "SELECT id, username, is_admin FROM users WHERE username = ?",
      [username]
    );
    
    if (existing.length === 0) {
      console.log(`⚠️  Usuário "${username}" não encontrado. Criando novo usuário admin...`);
    } else {
      console.log(`✅ Usuário "${username}" encontrado (ID: ${existing[0].id}, Admin: ${existing[0].is_admin})`);
    }
    
    // Gerar hash da nova senha
    console.log("   Gerando hash bcrypt da senha...");
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`   Hash gerado: ${passwordHash.substring(0, 30)}...`);
    
    // Atualizar ou criar usuário
    await connection.query(
      `INSERT INTO users (username, password_hash, currency, is_admin) 
       VALUES (?, ?, 'BRL', true)
       ON DUPLICATE KEY UPDATE 
         password_hash = ?,
         is_admin = true,
         updated_at = CURRENT_TIMESTAMP`,
      [username, passwordHash, passwordHash]
    );
    
    console.log(`✅ Senha resetada com sucesso!`);
    console.log(`✅ Usuário "${username}" configurado como admin!`);
    
    // Verificar resultado
    const [result] = await connection.query(
      "SELECT id, username, is_admin, created_at, updated_at FROM users WHERE username = ?",
      [username]
    );
    
    if (result.length > 0) {
      const user = result[0];
      console.log("\n📋 Dados do usuário:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log(`   Atualizado em: ${user.updated_at}`);
    }
    
    console.log(`\n📝 Agora você pode fazer login com:`);
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${newPassword}\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    if (error.sqlMessage) {
      console.error(`   SQL: ${error.sqlMessage}`);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();

