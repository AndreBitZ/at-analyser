# AT Analyser no Mac

App pensada para macOS. Dados no disco do Mac (pasta à tua escolha ou `~/Library/Application Support/AT-Analyser`).

## Abrir como aplicação

```bash
cd macos
npm install
npm start
```

Abre uma janela nativa. No primeiro ecrã podes:
- usar o diálogo do Finder (Electron)
- ou a pasta padrão do macOS

## Gerar o .app / .dmg

```bash
cd macos
npm run pack
```

## Só terminal (sem Electron)

Na raiz do projecto: `npm start` e no browser `http://localhost:5173`.
No Mac a escolha de pasta usa o diálogo nativo (`osascript`).
