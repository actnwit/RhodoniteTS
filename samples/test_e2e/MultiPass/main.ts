import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
declare const Stats: any;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();

const expression = new Rn.Expression();
const renderPass1 = new Rn.RenderPass(engine);
renderPass1.toClearColorBuffer = true;
renderPass1.cameraComponent = cameraComponent;
const renderPass2 = new Rn.RenderPass(engine);
renderPass2.toClearColorBuffer = true;
renderPass2.cameraComponent = cameraComponent;

const framebuffer = Rn.RenderableHelper.createFrameBuffer(engine, {
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
renderPass1.setFramebuffer(framebuffer);
const framebuffer_fxaatarget = Rn.RenderableHelper.createFrameBuffer(engine, {
  width: 600,
  height: 600,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA8],
  createDepthBuffer: true,
});
renderPass2.setFramebuffer(framebuffer_fxaatarget);

const primitive_fxaa_material = Rn.MaterialHelper.createFXAA3QualityMaterial(engine);
const renderPass_fxaa = Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
  engine,
  primitive_fxaa_material,
  framebuffer_fxaatarget.getColorAttachedRenderTargetTexture(0)
);

// expression.addRenderPasses([renderPass1]);
expression.addRenderPasses([renderPass1, renderPass2, renderPass_fxaa]);

const primitive = new Rn.Plane(engine);
primitive.generate({
  width: 1,
  height: 1,
  uSpan: 1,
  vSpan: 1,
  isUVRepeat: false,
});
primitive.material = Rn.MaterialHelper.createClassicUberMaterial(engine, {});
// const texture = new Rn.Texture();
//texture.generateTextureFromUri('../../../assets/textures/specular_back_1.jpg');
//primitive.material.setTextureParameter(Rn.ShaderSemantics.DiffuseColorTexture, texture);
primitive.material.setParameter('diffuseColorFactor', Rn.Vector4.fromCopyArray([1, 0, 1, 1]));

const entities = [];
const entity = Rn.createMeshEntity(engine);
entities.push(entity);

const entity2 = Rn.createMeshEntity(engine);
entities.push(entity2);

const entity_fxaa = Rn.createMeshEntity(engine);
entities.push(entity_fxaa);

const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(entity);
controller.dolly = 0.8;

const meshComponent = entity.getMesh();
const mesh = new Rn.Mesh(engine);
mesh.addPrimitive(primitive);
meshComponent.setMesh(mesh);
entity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);
const meshComponent2 = entity2.getMesh();

const primitive2 = new Rn.Plane(engine);
primitive2.generate({
  width: 1,
  height: 1,
  uSpan: 1,
  vSpan: 1,
  isUVRepeat: false,
});
primitive2.material = Rn.MaterialHelper.createClassicUberMaterial(engine, {});
const sampler = new Rn.Sampler(engine, {
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.Linear,
  wrapS: Rn.TextureParameter.Repeat,
  wrapT: Rn.TextureParameter.Repeat,
});
primitive2.material.setTextureParameter(
  'diffuseColorTexture',
  framebuffer.getColorAttachedRenderTargetTexture(0),
  sampler
);

const mesh2 = new Rn.Mesh(engine);
mesh2.addPrimitive(primitive2);
meshComponent2.setMesh(mesh2);
entity2.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 3, 0, 0]);
entity2.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 0]);

renderPass1.addEntities([entity]);
renderPass2.addEntities([entity2]);
// renderPass.addEntities([]);

const startTime = Date.now();
let p = null;
const rotationVec3 = Rn.MutableVector3.zero();
let count = 0;

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.domElement);

engine.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  const date = new Date();

  if (window.isAnimating) {
    const rotation = 0.001 * (date.getTime() - startTime);
    entities.forEach(entity => {
      rotationVec3._v[0] = rotation;
      rotationVec3._v[1] = rotation;
      rotationVec3._v[2] = rotation;
      entity.getTransform().localEulerAngles = rotationVec3;
    });
  }
  stats.begin();

  //      console.log(date.getTime());
  engine.process([expression]);

  stats.end();
  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(engine, 'Rhodonite');
};
