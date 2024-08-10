import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// Init Rhodonite
Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

const texture = new Rn.Texture();
texture.tryToSetUniqueName('checkerTexture', true);
texture.allocate({
  width: 256,
  height: 256,
  format: Rn.TextureFormat.RGBA8,
});

const pixels = new Uint8Array(256 * 256 * 4);

// Checker pattern image
const checkerSize = 8;
for (let i = 0; i < 256; i++) {
  for (let j = 0; j < 256; j++) {
    const index = (i * 256 + j) * 4;
    const isWhite = Math.floor(i / checkerSize) % 2 === Math.floor(j / checkerSize) % 2 ? 255 : 0;
    pixels[index] = isWhite; // R
    pixels[index + 1] = 0; // G
    pixels[index + 2] = 0; // B
    pixels[index + 3] = 255; // A
  }
}

texture.loadImageToMipLevel({
  mipLevel: 0,
  data: pixels,
  xOffset: 0,
  yOffset: 0,
  width: 100,
  height: 256,
  type: Rn.ComponentType.UnsignedByte,
});

const material = Rn.MaterialHelper.createClassicUberMaterial();
const sampler = new Rn.Sampler({
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
  magFilter: Rn.TextureParameter.Nearest,
  minFilter: Rn.TextureParameter.Nearest,
});
material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, texture, sampler);

// Plane
const planeEntity = Rn.MeshHelper.createPlane({
  material: material,
});
planeEntity.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Rn.Vector3.fromCopy3(1, 1, 1);
planeEntity.localPosition = Rn.Vector3.fromCopy3(0, 0, 0.5);

const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass();
renderPass.addEntities([planeEntity]);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
expression.addRenderPasses([renderPass]);

// Render Loop
let count = 0;

Rn.System.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  Rn.System.process([expression]);
  count++;
});
