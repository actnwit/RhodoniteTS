import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Plane
const texture = new Rn.VideoTexture(engine);
texture.generateTextureFromUri('../../../assets/videos/video.mp4');
const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial(engine);
const sampler = new Rn.Sampler(engine, {
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.LinearMipmapLinear,
  wrapS: Rn.TextureParameter.Repeat,
  wrapT: Rn.TextureParameter.Repeat,
});
modelMaterial.setTextureParameter('diffuseColorTexture', texture, sampler);
window.texture = texture;

const planeEntity = Rn.createMeshEntity(engine);
const planePrimitive = new Rn.Plane(engine);
planePrimitive.generate({
  width: 2,
  height: 2,
  uSpan: 1,
  vSpan: 1,
  isUVRepeat: false,
  flipTextureCoordinateY: true,
  material: modelMaterial,
});
const planeMeshComponent = planeEntity.getMesh();
const planeMesh = new Rn.Mesh(engine);
planeMesh.addPrimitive(planePrimitive);
planeMeshComponent.setMesh(planeMesh);
planeEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

// Camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(90);
cameraComponent.aspect = 1;

cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// CameraComponent
const cameraControllerComponent = (cameraEntity as Rn.ICameraControllerEntity).getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(planeEntity);

// renderPass
const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = true;
renderPass.addEntities([planeEntity]);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.setCurrent(engine, 0);
let startTime = Date.now();
let count = 0;
engine.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
    //console.log(time);
    //      rootGroup.getTransform().scale = rotationVec3;
    //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
  }
  texture.updateTexture();
  engine.process([expression]);
  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(engine, 'Rhodonite');
};

window.downloadFrame = () => {
  const [pixels, width, height] = window.texture.getCurrentFramePixelData();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = pixels[i + 0];
    imageData.data[i + 1] = pixels[i + 1];
    imageData.data[i + 2] = pixels[i + 2];
    imageData.data[i + 3] = pixels[i + 3];
  }
  ctx.putImageData(imageData, 0, 0);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.download = 'frame.png';
  a.href = url;
  const e = new MouseEvent('click');
  a.dispatchEvent(e);
};
