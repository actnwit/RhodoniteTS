import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

// Init Rhodonite
const processApproach = getProcessApproach(Rn);
const engine = await Rn.Engine.init({
  approach: processApproach,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

const textureWidth = 256;
const textureHeight = 256;
const imageDataWidth = 250;
const imageDataHeight = 256;
const componentSize: number = 4;
const imageComponentType = Rn.ComponentType.Float;

const texture = new Rn.Texture(engine);
texture.tryToSetUniqueName('checkerTexture', true);
texture.allocate({
  width: textureWidth,
  height: textureHeight,
  format: Rn.TextureFormat.RGBA32F,
});

const pixels = new Float32Array(imageDataWidth * imageDataHeight * componentSize);

// Checker pattern image
const checkerSize = 8;
for (let i = 0; i < imageDataHeight; i++) {
  for (let j = 0; j < imageDataWidth; j++) {
    const index = (i * imageDataWidth + j) * componentSize;
    const isWhite = Math.floor(i / checkerSize) % 2 === Math.floor(j / checkerSize) % 2 ? 255 : 0;
    pixels[index] = isWhite; // R
    pixels[index + 1] = 0; // G
    pixels[index + 2] = 0; // B
    if (componentSize === 4) {
      pixels[index + 3] = 255; // A
    }
  }
}

texture.loadImageToMipLevel({
  mipLevel: 0,
  data: pixels,
  xOffset: 25,
  yOffset: 50,
  width: 100,
  height: 70,
  rowSizeByPixel: imageDataWidth,
  type: imageComponentType,
});

const material = Rn.MaterialHelper.createClassicUberMaterial(engine);
const sampler = new Rn.Sampler(engine, {
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
  magFilter: Rn.TextureParameter.Nearest,
  minFilter: Rn.TextureParameter.Nearest,
});
material.setTextureParameter('diffuseColorTexture', texture, sampler);

// Plane
const planeEntity = Rn.MeshHelper.createPlane(engine, {
  material: material,
});
planeEntity.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI * 0.5, 0, 0);
planeEntity.localScale = Rn.Vector3.fromCopy3(1, 1, 1);
planeEntity.localPosition = Rn.Vector3.fromCopy3(0, 0, 0.5);

const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
renderPass.addEntities([planeEntity]);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
expression.addRenderPasses([renderPass]);

// Render Loop
let count = 0;

engine.startRenderLoop(() => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
    const p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  engine.process([expression]);
  count++;
});
