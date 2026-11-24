// Bundled like an application that creates a PBR material through the package root. The page does not load this
// bundle: the E2E test checks that importing one material factory does not pull in node-based materials, MToon, or
// the shader graph resolver.
import { Config, createPbrUberMaterial, Engine, ProcessApproach } from 'rhodonite';

declare const window: any;

const engine = await Engine.init({
  approach: ProcessApproach.WebGL2,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Config(),
});

const material = createPbrUberMaterial(engine, {});

window._material = material;
