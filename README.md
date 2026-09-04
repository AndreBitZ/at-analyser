# AT Analyser

Aplicação de análise de vídeo e performance de andebol.

Repositório: https://github.com/AndreBitZ/at-analyser

## Arranque

```bash
npm install
npm test
npm run dev
```

UI em `http://localhost:5173` com um jogo de amostra (`src/data/sample.ts`). Motor em `src/domain/`.

## Spec coberta

1. Jogo: `match_id`, `home_team_id`, `away_team_id`
2. Blocos de 5 min (`P1_00_05`…`P2_55_60` + extra-time). `floor(t/300)`. Filtros FIRST/SECOND_HALF, LAST_15/10/5/2, CRUNCHTIME (`t>=3000` e `|\u0394|<=2`)
3. Stints, minutos por bloco, utilização, ações/10 e /5 min
4. Zonas Z1–Z9 e grupos
5. Baliza 3×3 B1–B9 (obrigatória em GOAL/SAVED; null em MISSED/BLOCKED)
6. Um SHOT alimenta atacante, rematador, defesa e GR (`related_shot_event_id`)
7. Contexto: marcador antes da ação, casa/fora, numérico, passivo, 2'
8–12. Fórmulas de remate, GR, contexto, passivo (6 passes) e 7x6
13. Saldo da equipa durante presença em campo (nota de não-causalidade)
14. Índice de Impacto de Jogo (IIJ) — não usa HPI
15. Estatísticas de equipa
16. Heat maps e matriz 9×9
17. Scorecards com narrativa baseada em dados e fiabilidade

Golos em baliza vazia não entram na taxa individual do GR fora da baliza. Comparar IIJ só na mesma posição.

## Próximo

Persistência, tagging sobre vídeo, clips por célula, mapa defensivo, export PDF.
