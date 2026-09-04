# Ligar o Google Drive (gravação automática)

A app grava no browser e, depois de «Ligar Google Drive», escreve também `at-analyser-db.json` na tua Drive.

## 1. Criar o Client ID (uma vez)

1. Abre https://console.cloud.google.com/
2. Cria um projeto (ex. AT Analyser)
3. APIs e serviços → Biblioteca → activa **Google Drive API**
4. APIs e serviços → Ecrã de consentimento OAuth → Externo → app de teste
5. Adiciona o teu Gmail como utilizador de teste
6. Credenciais → Criar credenciais → ID do cliente OAuth → **Aplicação Web**
7. Origens JavaScript autorizadas:
   - `http://localhost:5173`
   - o URL da Vercel (ex. `https://at-analyser.vercel.app`)
8. Copia o Client ID

## 2. Na app

Cria `.env` na raiz:

```
VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

Na Vercel: Settings → Environment Variables → a mesma chave → Redeploy.

## 3. Usar

Separador Clube → **Ligar Google Drive** → autoriza.
A partir daí cada Guardar envia o JSON para o Drive.
O primeiro login cria o ficheiro `at-analyser-db.json` (criado pela app).

O token dura ~1 hora; se falhar, volta a ligar.
