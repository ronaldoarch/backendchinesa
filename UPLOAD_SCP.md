# 🚀 Upload via SCP para Hostinger

## 📋 O que é SCP?

**SCP (Secure Copy Protocol)** permite transferir arquivos de forma segura via SSH.

---

## 🔑 Credenciais SSH da Hostinger

### Onde encontrar:

1. **cPanel** → **Terminal** ou **SSH Access**
2. Anote:
   - **Host:** (geralmente o IP do servidor ou domínio)
   - **Porta:** 22 (padrão) ou outra
   - **Usuário:** seu nome de usuário do cPanel
   - **Senha:** senha do cPanel

**Formato:**
```
usuario@servidor.hostinger.com
ou
usuario@123.456.789.0
```

---

## 📤 COMANDOS SCP

### 1. Upload do Frontend (dist-client)

```bash
# Do seu Mac para Hostinger
scp -r /Users/ronaldodiasdesousa/Desktop/chinesa/dist-client/* \
  seu_usuario@servidor.hostinger.com:~/public_html/
```

### 2. Upload do Backend (server)

```bash
# Criar pasta no servidor primeiro
ssh seu_usuario@servidor.hostinger.com "mkdir -p ~/cassino-backend/server"

# Upload da pasta server
scp -r /Users/ronaldodiasdesousa/Desktop/chinesa/server \
  seu_usuario@servidor.hostinger.com:~/cassino-backend/
```

### 3. Upload do package.json

```bash
scp /Users/ronaldodiasdesousa/Desktop/chinesa/package.json \
  seu_usuario@servidor.hostinger.com:~/cassino-backend/
```

### 4. Upload do .htaccess

```bash
scp /Users/ronaldodiasdesousa/Desktop/chinesa/.htaccess \
  seu_usuario@servidor.hostinger.com:~/public_html/
```

### 5. Upload do database.sql

```bash
scp /Users/ronaldodiasdesousa/Desktop/chinesa/database.sql \
  seu_usuario@servidor.hostinger.com:~/
```

---

## 🔐 Configurar Porta Específica

Se a porta SSH não for a padrão (22):

```bash
scp -P 2222 -r dist-client/* \
  usuario@servidor:~/public_html/
```

---

## ⚡ Script Automatizado

Criei um script que faz tudo automaticamente! Veja abaixo.

---

## 📝 PASSO A PASSO COMPLETO

### 1. Testar Conexão SSH

```bash
ssh seu_usuario@servidor.hostinger.com
```

Se conectar com sucesso, você está pronto!

### 2. Upload de Tudo

Execute os comandos acima um por um, substituindo:
- `seu_usuario` pelo seu usuário
- `servidor.hostinger.com` pelo seu servidor

### 3. Conectar via SSH e Configurar

```bash
# Conectar
ssh seu_usuario@servidor.hostinger.com

# Ir para a pasta do backend
cd ~/cassino-backend

# Instalar dependências
npm install

# Instalar ts-node
npm install ts-node typescript mysql2

# Criar pasta de uploads
mkdir -p server/uploads

# Verificar se está tudo ok
ls -la
```

### 4. Importar Banco de Dados

```bash
# No servidor, via SSH
mysql -u seu_usuario_mysql -p seu_banco < ~/database.sql

# Ou via phpMyAdmin (método mais fácil)
```

---

## 🔄 Atualizar Apenas Arquivos Modificados

Depois que subir tudo pela primeira vez, para atualizar:

```bash
# Apenas frontend
scp -r dist-client/* usuario@servidor:~/public_html/

# Apenas backend
scp -r server/* usuario@servidor:~/cassino-backend/server/

# Reiniciar Node.js
ssh usuario@servidor "cd ~/cassino-backend && npm restart"
```

---

## 🛠️ Problemas Comuns

### ❌ "Permission denied (publickey)"

**Solução:** Use senha ou configure chave SSH

```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id usuario@servidor
```

### ❌ "Connection refused"

**Solução:** 
- Verifique a porta SSH
- Confirme que SSH está habilitado no cPanel

### ❌ "No such file or directory"

**Solução:** Crie o diretório primeiro

```bash
ssh usuario@servidor "mkdir -p ~/cassino-backend"
```

---

## 📊 Estrutura Final no Servidor

```
/home/seu_usuario/
├── public_html/              # Frontend
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
├── cassino-backend/          # Backend
│   ├── server/
│   │   ├── index.ts
│   │   ├── db.ts
│   │   ├── routes/
│   │   └── services/
│   ├── node_modules/
│   └── package.json
│
└── database.sql              # SQL para importar
```

---

## ✅ CHECKLIST

- [ ] Testar conexão SSH
- [ ] Upload dist-client/ → public_html/
- [ ] Upload server/ → cassino-backend/
- [ ] Upload package.json
- [ ] Upload .htaccess
- [ ] Upload database.sql
- [ ] SSH no servidor
- [ ] npm install no backend
- [ ] Importar database.sql
- [ ] Configurar variáveis de ambiente
- [ ] Iniciar Node.js App
- [ ] Testar frontend
- [ ] Testar API

---

## 🎯 Próximo Passo

Execute o **script automatizado** que vou criar agora!


