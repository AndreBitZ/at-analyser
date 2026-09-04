# AT Analyser

App local de análise de andebol. Os dados vivem só no PC: `data/at-analyser.db`.
Não usa cache do browser, Turso nem Google Drive.

```bash
npm install
npm run server
npm run dev
```

UI: http://localhost:5173  
API: http://localhost:8787  
Ficheiro: `data/at-analyser.db`

Outro caminho:

```bash
AT_ANALYSER_DB="$HOME/Documents/AT Analyser/at-analyser.db" npm run server
```

Separador **Clube**: clubes, escalões (uma jogadora em dois), épocas, campeonatos, equipas, jogos.
