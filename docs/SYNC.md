# Sincronização AT Analyser

## Onde estão os dados hoje

| Sítio | Quem escreve | Automático? |
|---|---|---|
| Browser (localStorage) | A app | Sim, em cada Guardar |
| Google Drive (pasta AT Analyser) | Grok nesta conversa, ou tu à mão | Não, a app não tem login Google |
| SQLite no PC | `npm run server` | Só com o servidor ligado |
| Turso | API na Vercel | Só com URL + token |

## Três níveis

### 1. Manual (já possível)
Exportar JSON na app → pôr na pasta Drive, ou dizer «grava no Drive» neste chat.

### 2. Semi-automático (Grok)
Pedes «sincroniza o Drive». Eu leio a folha / o JSON e actualizo. Não corre sozinho às 2 da manhã sem o ficheiro já estar no Drive.

### 3. Automático real (app ↔ Drive)
A página na Vercel precisa de **login Google na própria app** (OAuth):
1. Projeto no Google Cloud
2. Activar Drive API
3. Client ID Web
4. Botão «Ligar Google Drive» na app
5. Gravar `at-analyser-db.json` na pasta AT Analyser

Sem esse Client ID, a Vercel não pode escrever no teu Drive. O conector Drive do Grok só funciona aqui no chat.

## Conflitos

Se editares no telemóvel e no PC ao mesmo tempo, a cópia mais recente deve ganhar (last-write-wins) até haver um servidor.
