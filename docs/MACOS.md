# AT Analyser — só Mac com chip M

App nativa **arm64** (M1 / M2 / M3 / M4). Não há versão Intel.

## Abrir em desenvolvimento

No Mac com chip Apple:

```bash
git pull
npm install
npm run mac
```

Confirma a arquitectura:

```bash
uname -m
# deve dizer arm64
```

## Gerar o .dmg Apple Silicon

```bash
cd macos
npm install
npm run pack
```

O ficheiro sai com o nome `AT Analyser-0.3.0-apple-silicon.dmg`.
Instala no Applications. Na primeira abertura: *Sistema > Privacidade* se o Gatekeeper avisar (build sem assinatura Apple Developer).

## Dados

Pasta à tua escolha no Finder, ou:
`~/Library/Application Support/AT-Analyser`
