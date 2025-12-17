/**
 * Script Node.js para inserir credenciais do SuitPay no banco de dados
 * Execute: node insert-suitpay-credentials.js
 */

require("dotenv/config");
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chinesa_cassino"
};

const credentials = {
  clientId: "ribeirosouzafabricio15gmailcom_1765906561755",
  clientSecret: "a148cd873347d719654c70b33641558e56ff84fbb78d6d36e752ea2c06f1cde2e5de2f4f27494ab89c65f1f9458198a7"
};

async function insertCredentials() {
  let connection;
  
  try {
    console.log("🔌 Conectando ao banco de dados...");
    console.log("📊 Configuração:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password
    });

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Conectado ao banco de dados!");

    // Inserir Client ID
    console.log("\n📝 Inserindo Client ID...");
    await connection.query(
      `INSERT INTO settings (\`key\`, \`value\`)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = ?`,
      ["suitpay.clientId", credentials.clientId, credentials.clientId]
    );
    console.log("✅ Client ID inserido/atualizado!");

    // Inserir Client Secret
    console.log("\n📝 Inserindo Client Secret...");
    await connection.query(
      `INSERT INTO settings (\`key\`, \`value\`)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`value\` = ?`,
      ["suitpay.clientSecret", credentials.clientSecret, credentials.clientSecret]
    );
    console.log("✅ Client Secret inserido/atualizado!");

    // Verificar se foram inseridas corretamente
    console.log("\n🔍 Verificando credenciais inseridas...");
    const [rows] = await connection.query(
      `SELECT \`key\`, 
              CASE 
                WHEN \`key\` = 'suitpay.clientId' THEN CONCAT(LEFT(\`value\`, 20), '...')
                WHEN \`key\` = 'suitpay.clientSecret' THEN '*** (oculto)'
                ELSE \`value\`
              END AS \`value_preview\`
       FROM settings 
       WHERE \`key\` LIKE 'suitpay.%'
       ORDER BY \`key\``
    );

    console.log("\n📋 Credenciais no banco:");
    console.table(rows);

    console.log("\n✅ Credenciais do SuitPay inseridas com sucesso!");
    console.log("🔄 Reinicie o servidor para que as mudanças tenham efeito.");

  } catch (error) {
    console.error("❌ Erro ao inserir credenciais:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("💡 Verifique se o banco de dados está rodando e as credenciais estão corretas.");
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Conexão fechada.");
    }
  }
}

// Executar
insertCredentials().catch(console.error);
