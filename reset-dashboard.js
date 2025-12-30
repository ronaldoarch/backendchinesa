const mysql = require('mysql2/promise');
require('dotenv').config();

// Função para parsear URL MySQL do Railway (mesma lógica do servidor)
function parseMysqlUrl() {
  const mysqlUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;
  if (!mysqlUrl) return null;

  try {
    // Formato: mysql://user:password@host:port/database
    const url = new URL(mysqlUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace("/", "")
    };
  } catch {
    return null;
  }
}

async function resetDashboard() {
  let connection;
  
  try {
    // Conectar ao banco de dados (usar as mesmas variáveis do servidor)
    const mysqlUrlConfig = parseMysqlUrl();
    
    const dbHost = mysqlUrlConfig?.host || process.env.DB_HOST || 'localhost';
    const dbPort = mysqlUrlConfig?.port || parseInt(process.env.DB_PORT || '3306');
    const dbUser = mysqlUrlConfig?.user || process.env.DB_USER || 'root';
    const dbPassword = mysqlUrlConfig?.password || process.env.DB_PASSWORD || '';
    const dbName = mysqlUrlConfig?.database || process.env.DB_NAME || 'railway';

    console.log('🔌 Conectando ao banco:', { host: dbHost, port: dbPort, user: dbUser, database: dbName });

    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName
    });

    console.log('✅ Conectado ao banco de dados');
    console.log('⚠️  ATENÇÃO: Este script irá deletar dados importantes!');
    console.log('📋 Executando reset do dashboard...\n');

    // 1. Deletar todas as transações
    await connection.query('DELETE FROM transactions');
    console.log('✅ Transações deletadas');

    // 2. Zerar totais dos usuários
    await connection.query(`
      UPDATE users SET 
        total_deposit_amount = 0,
        total_withdrawal_amount = 0,
        total_bet_amount = 0,
        balance = 0,
        bonus_balance = 0,
        last_deposit_at = NULL,
        last_withdrawal_at = NULL,
        last_bet_at = NULL,
        vip_level = 0
    `);
    console.log('✅ Totais dos usuários zerados');

    // 3. Deletar apostas (se a tabela existir)
    try {
      await connection.query('DELETE FROM user_bets');
      console.log('✅ Apostas deletadas');
    } catch (error) {
      console.log('⚠️  Tabela user_bets não existe ou já está vazia');
    }

    // 4. Deletar bônus (se a tabela existir)
    try {
      await connection.query('DELETE FROM user_bonuses');
      console.log('✅ Bônus deletados');
    } catch (error) {
      console.log('⚠️  Tabela user_bonuses não existe ou já está vazia');
    }

    // 5. Deletar recompensas (se a tabela existir)
    try {
      await connection.query('DELETE FROM user_rewards');
      console.log('✅ Recompensas deletadas');
    } catch (error) {
      console.log('⚠️  Tabela user_rewards não existe ou já está vazia');
    }

    // 6. Deletar histórico de indicações (se a tabela existir)
    try {
      await connection.query('DELETE FROM referral_bets');
      console.log('✅ Histórico de indicações deletado');
    } catch (error) {
      console.log('⚠️  Tabela referral_bets não existe ou já está vazia');
    }

    // Verificar resultado
    const [usersResult] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [transactionsResult] = await connection.query('SELECT COUNT(*) as count FROM transactions');
    const [depositsResult] = await connection.query('SELECT COALESCE(SUM(total_deposit_amount), 0) as total FROM users');
    const [withdrawalsResult] = await connection.query('SELECT COALESCE(SUM(total_withdrawal_amount), 0) as total FROM users');
    const [betsResult] = await connection.query('SELECT COALESCE(SUM(total_bet_amount), 0) as total FROM users');

    console.log('\n📊 Resultado do reset:');
    console.log(`   Total de usuários: ${usersResult[0].count}`);
    console.log(`   Total de transações: ${transactionsResult[0].count}`);
    console.log(`   Total de depósitos: R$ ${Number(depositsResult[0].total).toFixed(2)}`);
    console.log(`   Total de saques: R$ ${Number(withdrawalsResult[0].total).toFixed(2)}`);
    console.log(`   Total de apostas: R$ ${Number(betsResult[0].total).toFixed(2)}`);
    
    console.log('\n✅ Dashboard zerado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao zerar dashboard:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar
resetDashboard();

