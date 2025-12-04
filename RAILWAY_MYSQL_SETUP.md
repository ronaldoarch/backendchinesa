# 🚂 Railway MySQL - Configuração Completa

## ✅ Você criou MySQL no Railway!

**Endpoint público:** `hopper.proxy.rlwy.net:36793`

---

## 🔑 OBTER CREDENCIAIS

### No Railway:

1. Clique no serviço **"MySQL"**
2. Vá na aba **"Connect"**
3. Você verá algo assim:

```
Host: hopper.proxy.rlwy.net
Port: 36793
User: root
Password: aBcD1234XyZ (exemplo)
Database: railway
```

**OU** uma URL completa:
```
mysql://root:senha@hopper.proxy.rlwy.net:36793/railway
```

**Copie essas informações!**

---

## 📋 USAR NA VPS

Quando configurar a VPS, use este `.env`:

```env
# Railway MySQL
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=36793
DB_USER=root
DB_PASSWORD=a_senha_do_railway
DB_NAME=railway

# Servidor
PORT=4000
NODE_ENV=production

# PlayFivers
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_AUTH_METHOD=bearer
PLAYFIVERS_AGENT_ID=agente03
PLAYFIVERS_AGENT_SECRET=fabebd5a-8f8e-414c-82a6-7bc631115811
PLAYFIVERS_AGENT_TOKEN=977bbb3e-98fb-4718-aad6-8d06d4b55f42
```

---

## 🔄 IMPORTAR DADOS NO RAILWAY

### Via Railway Query Editor:

1. No Railway, clique no serviço **MySQL**
2. Vá na aba **"Data"**
3. Clique em **"Query"**
4. Cole este SQL:

```sql
-- Criar tabelas
CREATE TABLE IF NOT EXISTS `providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `games` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `external_id` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image_url` TEXT NOT NULL,
  `link_url` TEXT DEFAULT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir dados de exemplo
INSERT INTO `providers` (`name`, `external_id`, `active`) VALUES
('PG Soft', 'pg_soft', 1),
('Pragmatic Play', 'pragmatic', 1),
('Evolution Gaming', 'evolution', 1);

INSERT INTO `games` (`provider_id`, `name`, `external_id`, `active`) VALUES
(1, 'Fortune Tiger', 'fortune_tiger', 1),
(1, 'Fortune Ox', 'fortune_ox', 1),
(1, 'Fortune Mouse', 'fortune_mouse', 1),
(2, 'Gates of Olympus', 'gates_olympus', 1),
(2, 'Sweet Bonanza', 'sweet_bonanza', 1);
```

5. Clique em **"Run Query"** ou **"Execute"**

✅ **Dados inseridos!**

---

## 🧪 TESTAR CONEXÃO

### Via TablePlus/MySQL Workbench:

```
Host: hopper.proxy.rlwy.net
Port: 36793
User: root
Password: (do Railway)
Database: railway
```

### Via terminal (na VPS depois):

```bash
mysql -h hopper.proxy.rlwy.net -P 36793 -u root -p railway
```

---

## ✅ PRÓXIMO PASSO

1. **Copiar credenciais** da aba "Connect" do Railway
2. **Criar VPS** (Oracle Cloud grátis ou DigitalOcean)
3. **Configurar backend** na VPS com essas credenciais

---

**Vá na aba "Connect" do Railway e me mostre as credenciais! 🔑**

