import Rn from '../../../dist/esmdev/index.js';
import { loadHDR } from '../../../vendor/hdrpngts.js';

declare const window: any;
declare const HDRImage: any;

// Init Rhodonite
Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

const response = await fetch('../../../assets/hdr/near_the_river_02_1k.hdr');
const arrayBuffer = await response.arrayBuffer();
const data = await loadHDR(new Uint8Array(arrayBuffer));

const hdrTexture = new Rn.Texture();
hdrTexture.allocate({
  width: data.width,
  height: data.height,
  format: Rn.TextureFormat.RGBA32F,
});

const dataFloat = data.dataFloat;

const pixels = new Float32Array(data.width * data.height * 4);
for (let i = 0; i < data.width * data.height; i++) {
  pixels[i * 4] = dataFloat[i * 3];
  pixels[i * 4 + 1] = dataFloat[i * 3 + 1];
  pixels[i * 4 + 2] = dataFloat[i * 3 + 2];
  pixels[i * 4 + 3] = 1.0;
}

hdrTexture.loadImageToMipLevel({
  mipLevel: 0,
  xOffset: 0,
  yOffset: 0,
  width: data.width,
  height: data.height,
  rowSizeByPixel: data.width,
  data: pixels,
  type: Rn.ComponentType.Float,
});

const panoramaToCubeMaterial = Rn.MaterialHelper.createPanoramaToCubeMaterial();

panoramaToCubeMaterial.setParameter(Rn.ShaderSemantics.CubeMapFaceId, 0);

const expression = new Rn.Expression();

// const sampler = new Rn.Sampler({
//   magFilter: Rn.TextureParameter.Nearest,
//   minFilter: Rn.TextureParameter.Nearest,
//   wrapS: Rn.TextureParameter.ClampToEdge,
//   wrapT: Rn.TextureParameter.ClampToEdge,
// });
// sampler.create();

// panoramaToCubeMaterial.setTextureParameter(
//   Rn.ShaderSemantics.BaseColorTexture,
//   hdrTexture,
//   sampler
// );

const renderPass = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  panoramaToCubeMaterial,
  hdrTexture
);

renderPass.clearColor = Rn.Vector4.fromCopy4(0, 0, 0, 1);
renderPass.toClearColorBuffer = true;
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
