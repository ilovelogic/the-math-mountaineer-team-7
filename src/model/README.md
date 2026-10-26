# model/

Game state and math in plain TypeScript: problems, rules, medals, `Dialogue`, `PlayerProgress` and `SaveStore`.

Never imports Konva, `view/` or `controller/`, so every model runs in Vitest without a browser. Take seeds and times as parameters instead of calling `Math.random()` or `Date.now()`.
