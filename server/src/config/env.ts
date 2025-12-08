import "dotenv/config";

type Env = {
  port: number;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
};

export const env: Env = {
  port: Number(process.env.PORT || 4000),
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "chinesa_cassino"
};

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  // eslint-disable-next-line no-console
  console.warn(
    "Variáveis de banco de dados não configuradas. Defina DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env."
  );
}

