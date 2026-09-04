# AT Analyser

Análise de vídeo e performance de andebol.
Repo: https://github.com/AndreBitZ/at-analyser

## Base de dados no PC (recomendado para trabalho diário)

Os dados ficam no ficheiro local `data/at-analyser.db` (não vai para o Git).

```bash
npm install
npm run server    # API em http://localhost:8787
npm run dev       # UI em http://localhost:5173 (proxy /api → 8787)
```

No separador **Clube** podes:
- criar clube e escalões
- atribuir uma jogadora a **dois escalões**
- criar épocas e campeonatos
- criar equipas e inscrevê-las num campeonato
- criar jogos ligados à época/campeonato

Exportar JSON: `GET http://localhost:8787/api/export`

## Vercel

A Vercel não guarda um ficheiro SQLite no disco. Para a app publicada persistir:

1. Cria uma base gratuita em https://turso.tech
2. No projeto Vercel define:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. Faz deploy a partir deste repo

Sem essas variáveis, `/api` responde 503 e explica o que falta. A UI de análise (amostra) continua a funcionar.

## Modelo

`clubs` → `age_groups` → `teams`  
`players` ↔ `player_age_groups` ↔ `age_groups` (N:N, dois escalões)  
`seasons` → `championships` ↔ `championship_teams` ↔ `teams`  
`matches` ligam época + campeonato + duas equipas
