// Bundled with `__RN_WEBGL__: false`, like a WebGPU-only application. The page never loads this bundle: the E2E
// test inspects its metafile to check that the WebGL backend, its shaders, and its shader utility are dropped.
import { Config, createPlane, Engine, ProcessApproach } from 'rhodonite';

declare const window: any;

const engine = await Engine.init({
  approach: ProcessApproach.WebGPU,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Config(),
});

const plane = createPlane(engine);

window._engine = engine;
window._plane = plane;
