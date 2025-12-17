// Script simples para resetar senha
// Execute: node reset-password-simple.js

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

async function resetPassword() {
  const username = process.argv[2] || "admin@admin.com";
  const newPassword = process.argv[3] || "admin123";
  
  console.log(`🔄 Resetando senha para: ${username}`);
  console.log(`   Nova senha: ${newPassword}`);
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Gerar hash da nova senha
    console.log("   Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha no banco
    const [result] = await connection.query(
      "UPDATE users SET password_hash = ? WHERE username = ?",
      [passwordHash, username]
    );
    
    if (result.affectedRows === 0) {
      console.error(`❌ Usuário "${username}" não encontrado!`);
      console.log("   Criando novo usuário...");
      
      // Criar usuário se não existir
      await connection.query(
        "INSERT INTO users (username, password_hash, currency, is_admin) VALUES (?, ?, 'BRL', true)",
        [username, passwordHash]
      );
      console.log(`✅ Usuário "${username}" criado com sucesso!`);
    } else {
      console.log(`✅ Senha resetada com sucesso!`);
    }
    
    // Tornar admin
    await connection.query(
      "UPDATE users SET is_admin = true WHERE username = ?",
      [username]
    );
    
    console.log(`✅ Usuário "${username}" configurado como admin!`);
    console.log(`\n📝 Agora você pode fazer login com:`);
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${newPassword}\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetPassword();
