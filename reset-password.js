// Script para resetar senha de um usuário
// Execute: node reset-password.js <username> <nova_senha>

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chinesa_cassino"
};

async function resetPassword(username, newPassword) {
  console.log(`🔄 Resetando senha para usuário: ${username}...`);
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Gerar hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha no banco
    const [result] = await connection.query(
      "UPDATE users SET password_hash = ? WHERE username = ?",
      [passwordHash, username]
    );
    
    if (result.affectedRows === 0) {
      console.error(`❌ Usuário "${username}" não encontrado!`);
      process.exit(1);
    }
    
    console.log(`✅ Senha resetada com sucesso para o usuário "${username}"!`);
    console.log(`   Nova senha: ${newPassword}`);
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error("Uso: node reset-password.js <username> <nova_senha>");
  console.error("Exemplo: node reset-password.js admin@admin.com admin123");
  process.exit(1);
}

resetPassword(username, newPassword);
