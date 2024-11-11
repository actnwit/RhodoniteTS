import Rn from '../../../dist/esmdev/index.js';

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

console.log('using test begin');
{
  using texture = new Rn.Texture();
  texture.generate1x1TextureFrom();
}
console.log('using test end');

console.log('GC destruction test begin');
for (let i = 0; i < 100000; i++) {
  const texture = new Rn.Texture();
  texture.generate1x1TextureFrom();
  // texture.destroy();
  // texture.unregister();
}
