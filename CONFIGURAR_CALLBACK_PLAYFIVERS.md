# 🔗 Configurar Callback URL do PlayFivers

## O que é Callback URL?

A Callback URL é o endpoint que a API do PlayFivers usa para enviar notificações (webhooks) sobre eventos importantes, como:
- Status de apostas
- Atualizações de saldo
- Eventos de jogos
- Outras notificações da API

## Como Configurar

### 1. **URL de Callback**

A URL de callback padrão é:
```
https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/playfivers/callback
```

Esta URL já está configurada no backend e está pronta para receber callbacks.

### 2. **Configurar na API PlayFivers**

No painel admin, na página **PlayFivers**:

1. **Verifique a URL de Callback:**
   - A URL será exibida automaticamente na seção "Callback URL"
   - Certifique-se de que está usando HTTPS (não HTTP)

2. **Clique em "Configurar na PlayFivers":**
   - Isso enviará a URL para a API do PlayFivers
   - A API tentará configurar o callback em vários endpoints possíveis

3. **Verifique se funcionou:**
   - Uma mensagem de sucesso aparecerá se a configuração foi bem-sucedida
   - Se houver erro, verifique os logs do backend

### 3. **Configuração Manual (Alternativa)**

Se a configuração automática não funcionar, você pode:

1. **Acessar o painel do PlayFivers:**
   - Faça login no painel administrativo do PlayFivers
   - Vá em "Configurações" ou "Webhooks"

2. **Adicione a URL de Callback:**
   ```
   https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/playfivers/callback
   ```

3. **Salve as configurações**

## Endpoint de Callback

O endpoint `/api/playfivers/callback` está configurado para:

- ✅ Receber requisições POST da PlayFivers
- ✅ Logar os dados recebidos no console do servidor
- ✅ Responder com status 200 (OK)

### Exemplo de Uso

Quando a PlayFivers enviar um callback, você verá nos logs do Coolify:

```
Callback PlayFivers recebido: { ... dados do callback ... }
```

## Verificação

### 1. **Verificar se o endpoint está acessível:**

Teste a URL diretamente:
```bash
curl -X POST https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/playfivers/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Deve retornar: `{"ok": true}`

### 2. **Verificar nos logs:**

Após configurar, monitore os logs do Coolify para ver se os callbacks estão chegando.

## Troubleshooting

### Erro: "Nenhum endpoint aceitou a configuração de callback"

**Possíveis causas:**
1. A API do PlayFivers não suporta configuração via API
2. As credenciais estão incorretas
3. O endpoint de configuração é diferente

**Solução:**
- Configure manualmente no painel do PlayFivers
- Verifique a documentação oficial do PlayFivers
- Entre em contato com o suporte do PlayFivers

### Callbacks não estão chegando

**Verifique:**
1. ✅ A URL está acessível publicamente (não localhost)
2. ✅ A URL usa HTTPS (não HTTP)
3. ✅ O endpoint está respondendo corretamente
4. ✅ A URL está configurada corretamente no painel do PlayFivers

### URL está incorreta

Se você precisar usar uma URL diferente:

1. Atualize a variável de ambiente `VITE_API_URL` no frontend
2. Ou modifique o código em `src/services/api.ts`

## Nota Importante

⚠️ **A URL de callback DEVE ser acessível publicamente via HTTPS.** 

- ❌ `http://localhost:4000/api/playfivers/callback` (não funciona em produção)
- ✅ `https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api/playfivers/callback` (funciona)

A PlayFivers precisa conseguir fazer requisições POST para esta URL de qualquer lugar da internet.
