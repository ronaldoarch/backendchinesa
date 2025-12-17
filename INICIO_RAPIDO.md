# 🚀 Guia de Início Rápido - BigBet777

## ⚡ Início em 3 passos

### 1️⃣ Configure o banco de dados

Crie um arquivo `.env` na raiz do projeto com suas credenciais:

```bash
# Copie o exemplo
cp env.example .env
```

Edite o `.env` com suas credenciais do PostgreSQL (Railway):

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_banco
PORT=4000
PLAYFIVERS_BASE_URL=https://api.playfivers.com/api
PLAYFIVERS_API_KEY=sua_chave_aqui
```

### 2️⃣ Execute o projeto

```bash
npm run dev
```

Isso iniciará automaticamente:
- ✅ Backend na porta 4000
- ✅ Frontend na porta 5173

### 3️⃣ Acesse a aplicação

- **Frontend:** http://localhost:5173
- **Painel Admin:** http://localhost:5173/admin
- **API:** http://localhost:4000/api

---

## 🎯 Primeiros passos após executar

### Configure a identidade visual

1. Acesse: http://localhost:5173/admin/branding
2. Faça upload do logo, favicon e banner de carregamento

### Configure a integração PlayFivers

1. Acesse: http://localhost:5173/admin/playfivers
2. Insira suas credenciais PlayFivers:
   - ID do agente
   - Secret do agente
   - Token (API key)
3. Adicione provedores de jogos
4. Adicione jogos e clique em "Enviar para PlayFivers"

### Adicione banners promocionais

1. Acesse: http://localhost:5173/admin/banners
2. Faça upload de imagens promocionais
3. Configure a ordem de exibição

---

## 📱 Testando o frontend

Navegue pelas páginas:
- **Início:** Visualize jogos e promoções
- **Promoções:** VIP, rebate, tarefas
- **Depósito:** Simule depósitos via PIX
- **Perfil:** Visualize perfil e status VIP

---

## 🔍 Solução de problemas

### Erro de conexão com o banco

✅ Verifique se o `DATABASE_URL` está correto no `.env`
✅ Teste a conexão com o PostgreSQL

### Porta em uso

✅ Certifique-se de que as portas 4000 e 5173 estão livres
✅ Ou altere no `package.json` e `vite.config.mts`

### Erro ao fazer upload

✅ Verifique se a pasta `server/uploads/` existe
✅ Ela será criada automaticamente, mas verifique permissões

---

## 📚 Documentação completa

Consulte o `README.md` para documentação detalhada de todas as funcionalidades.

---

## ✅ Checklist de configuração

- [ ] Banco de dados configurado
- [ ] Arquivo `.env` criado
- [ ] Projeto executando (`npm run dev`)
- [ ] Frontend acessível em http://localhost:5173
- [ ] Backend acessível em http://localhost:4000
- [ ] Logo e favicon configurados
- [ ] Credenciais PlayFivers inseridas
- [ ] Primeiro provedor adicionado
- [ ] Primeiro jogo adicionado e sincronizado
- [ ] Primeiro banner criado

---

🎉 **Pronto!** Seu cassino online está funcional!

