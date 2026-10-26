# view/

Draws with Konva and reports clicks through callbacks: the stage, theme, shared components, assets, audio, the Hud and one view per screen.

May import Konva, other `view/` files, and `model/` or `content/` to read what to draw (for example the `Chasm` type). Never imports `controller/` or changes game state.
