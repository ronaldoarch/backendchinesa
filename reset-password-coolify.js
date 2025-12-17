#!/usr/bin/env node

/**
 * Script para resetar senha de usuário no Coolify
 * 
 * Uso:
 *   node reset-password-coolify.js <username> <nova_senha>
 * 
 * Exemplo:
 *   node reset-password-coolify.js admin MinhaNovaSenha123
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// Obter argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Uso: node reset-password-coolify.js <username> <nova_senha>");
  console.error("   Exemplo: node reset-password-coolify.js admin MinhaNovaSenha123");
  process.exit(1);
}

const [username, newPassword] = args;

// Configuração do banco de dados a partir das variáveis de ambiente
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "railway",
  waitForConnections: true,
  connectionLimit: 1
};

async function resetPassword() {
  let connection;
  
  try {
    console.log("🔌 Conectando ao banco de dados...");
    console.log("   Host:", dbConfig.host);
    console.log("   Port:", dbConfig.port);
    console.log("   User:", dbConfig.user);
    console.log("   Database:", dbConfig.database);
    
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conectado ao banco de dados!");
    
    // Verificar se o usuário existe
    console.log(`\n🔍 Verificando se o usuário "${username}" existe...`);
    const [users] = await connection.query(
      "SELECT id, username, is_admin FROM users WHERE username = ?",
      [username]
    );
    
    if (!users || users.length === 0) {
      console.error(`❌ Usuário "${username}" não encontrado!`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Admin: ${user.is_admin ? "Sim" : "Não"}`);
    
    // Gerar hash da nova senha
    console.log(`\n🔐 Gerando hash da nova senha...`);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log("✅ Hash gerado com sucesso!");
    
    // Atualizar senha no banco
    console.log(`\n💾 Atualizando senha no banco de dados...`);
    await connection.query(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [passwordHash, user.id]
    );
    
    console.log("✅ Senha atualizada com sucesso!");
    console.log(`\n📋 Resumo:`);
    console.log(`   Usuário: ${username}`);
    console.log(`   Nova senha: ${newPassword}`);
    console.log(`   Hash: ${passwordHash.substring(0, 20)}...`);
    console.log(`\n✅ Pronto! O usuário "${username}" já pode fazer login com a nova senha.`);
    
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error.message);
    console.error("   Stack:", error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Conexão fechada.");
    }
  }
}

// Executar
resetPassword().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
