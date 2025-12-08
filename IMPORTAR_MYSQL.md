# 📊 Como Importar o Banco de Dados MySQL

## ✅ Arquivo Criado: `database.sql`

Este arquivo contém:
- ✅ 4 tabelas (providers, games, banners, settings)
- ✅ Índices otimizados
- ✅ Foreign Keys
- ✅ Dados de exemplo
- ✅ Charset UTF8MB4 (suporta emojis)
- ✅ Engine InnoDB (transações)

---

## 📤 IMPORTAR VIA PHPMYADMIN

### Passo 1: Acessar o phpMyAdmin

1. No cPanel da Hostinger
2. Clique em **"phpMyAdmin"**
3. Selecione o banco: **`u127271520_chinesa`** (no menu lateral esquerdo)

### Passo 2: Importar o arquivo

1. Clique na aba **"Importar"** (no topo)
2. Clique em **"Escolher arquivo"** ou **"Browse"**
3. Selecione o arquivo **`database.sql`** da sua pasta do projeto
4. Deixe as opções padrão:
   - Formato: SQL
   - Charset: utf8mb4_unicode_ci
5. Clique em **"Executar"** ou **"Go"** (no final da página)

### Passo 3: Verificar

Após a importação, você deve ver:
- ✅ Mensagem de sucesso
- ✅ 4 tabelas na lista (providers, games, banners, settings)

Clique em cada tabela e depois em **"Visualizar"** para ver os dados de exemplo.

---

## 📊 ESTRUTURA DAS TABELAS

### 1. **providers** (Provedores de Jogos)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único (auto-incremento) |
| name | VARCHAR(255) | Nome do provedor |
| external_id | VARCHAR(255) | ID externo (PlayFivers) |
| active | TINYINT(1) | Ativo (1) ou Inativo (0) |

**Dados de exemplo:**
- PG Soft
- Pragmatic Play
- Evolution Gaming

### 2. **games** (Jogos)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| provider_id | INT | ID do provedor (FK) |
| name | VARCHAR(255) | Nome do jogo |
| external_id | VARCHAR(255) | ID externo |
| active | TINYINT(1) | Ativo/Inativo |

**Dados de exemplo:**
- Fortune Tiger (PG Soft)
- Fortune Ox (PG Soft)
- Fortune Mouse (PG Soft)
- Gates of Olympus (Pragmatic)
- Sweet Bonanza (Pragmatic)

### 3. **banners** (Banners)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INT | ID único |
| title | VARCHAR(255) | Título |
| image_url | TEXT | URL da imagem |
| link_url | TEXT | URL de destino |
| position | INT | Ordem de exibição |
| active | TINYINT(1) | Ativo/Inativo |

**Dados de exemplo:**
- Banner de Boas-Vindas

### 4. **settings** (Configurações)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| key | VARCHAR(255) | Chave (PK) |
| value | TEXT | Valor |

**Dados de exemplo:**
- branding.logoUrl
- branding.faviconUrl
- branding.loadingBannerUrl
- playfivers.agentId
- playfivers.secret
- playfivers.token

---

## 🔧 ALTERNATIVA: IMPORTAR VIA SQL

Se preferir executar direto no SQL:

1. No phpMyAdmin, clique na aba **"SQL"**
2. Abra o arquivo `database.sql` em um editor de texto
3. Copie TODO o conteúdo
4. Cole na área de texto do phpMyAdmin
5. Clique em **"Executar"**

---

## ✅ APÓS IMPORTAR

Verifique se tudo foi criado:

```sql
-- Ver todas as tabelas
SHOW TABLES;

-- Ver provedores
SELECT * FROM providers;

-- Ver jogos
SELECT * FROM games;

-- Ver banners
SELECT * FROM banners;

-- Ver configurações
SELECT * FROM settings;
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Importar `database.sql` no phpMyAdmin
2. ✅ Verificar se as 4 tabelas foram criadas
3. ✅ Configurar variáveis de ambiente no Node.js App:
   ```
   DB_HOST=localhost
   DB_USER=u127271520_chinesa
   DB_PASSWORD=sua_senha
   DB_NAME=u127271520_chinesa
   ```
4. ✅ Iniciar o backend Node.js
5. ✅ Testar a API: `https://seudominio.com/api/health`

---

## 🐛 PROBLEMAS COMUNS

### ❌ "Table already exists"
**Solução:** As tabelas já existem. Você pode:
- Deletar as tabelas existentes antes de importar
- Ou pular este erro (o arquivo usa `CREATE TABLE IF NOT EXISTS`)

### ❌ "Foreign key constraint fails"
**Solução:** 
- Certifique-se de importar na ordem correta (o arquivo já está ordenado)
- Ou delete todas as tabelas e importe novamente

### ❌ "Charset error"
**Solução:**
- O banco deve usar charset `utf8mb4`
- Verifique no cPanel → MySQL Databases

---

## 📁 LOCALIZAÇÃO DO ARQUIVO

```
/Users/ronaldodiasdesousa/Desktop/chinesa/database.sql
```

---

## 🎉 PRONTO!

Após importar, seu banco de dados estará **100% configurado** e pronto para uso!

O backend Node.js criará automaticamente as tabelas se não existirem, mas importando este arquivo você já tem:
- ✅ Estrutura completa
- ✅ Dados de exemplo
- ✅ Otimizações (índices)
- ✅ Relacionamentos (FKs)

**Boa sorte! 🚀**


