// Tests run in Node, which has no browser canvas for Konva to draw on, so this
// gives Konva node-canvas instead. Vitest loads it before every test file.
import 'konva/canvas-backend';

// Optional documentation
// - import 'konva/canvas-backend': an import with no names, run only for its effect, which here is telling Konva to create its canvases with the `canvas` package.
