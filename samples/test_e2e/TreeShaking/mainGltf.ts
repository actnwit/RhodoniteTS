// Bundled like an application that uses the glTF importer. The page does not load this bundle: the E2E test
// inspects its metafile to check that optional material implementations (node-based materials, MToon, the shader
// graph resolver and its nodes) stay out of the static part of the bundle.
import { Config, Engine, GltfImporter, ProcessApproach } from 'rhodonite';

declare const window: any;

const engine = await Engine.init({
  approach: ProcessApproach.WebGL2,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Config(),
});

const expression = await GltfImporter.importFromUrl(engine, 'model.glb');

window._expression = expression;
