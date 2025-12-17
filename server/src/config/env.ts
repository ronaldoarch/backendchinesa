import "dotenv/config";

type Env = {
  port: number;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  jwtSecret: string;
};

// Função para parsear URL MySQL do Railway (MYSQL_PUBLIC_URL ou MYSQL_URL)
function parseMysqlUrl(): Partial<{ host: string; port: number; user: string; password: string; database: string }> | null {
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

const mysqlUrlConfig = parseMysqlUrl();

export const env: Env = {
  port: Number(process.env.PORT || 4000),
  dbHost: mysqlUrlConfig?.host || process.env.DB_HOST || "127.0.0.1",
  dbPort: mysqlUrlConfig?.port || Number(process.env.DB_PORT || 3306),
  dbUser: mysqlUrlConfig?.user || process.env.DB_USER || "root",
  dbPassword: mysqlUrlConfig?.password || process.env.DB_PASSWORD || "",
  dbName: mysqlUrlConfig?.database || process.env.DB_NAME || "chinesa_cassino",
  jwtSecret: process.env.JWT_SECRET || "sua-chave-secreta-super-segura-mude-em-producao"
};

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  // eslint-disable-next-line no-console
  console.warn(
    "Variáveis de banco de dados não configuradas. Defina DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env."
  );
}



