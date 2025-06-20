import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Plane
const texture = new Rn.Texture();
{
  const response = await fetch('../../../assets/images/Rn.basis');
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  texture.generateTextureFromBasis(uint8Array, {});
}
const sampler = new Rn.Sampler({
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.LinearMipmapLinear,
  wrapS: Rn.TextureParameter.Repeat,
  wrapT: Rn.TextureParameter.Repeat,
});
sampler.create();
const modelMaterial = Rn.MaterialHelper.createClassicUberMaterial();
modelMaterial.setTextureParameter('diffuseColorTexture', texture, sampler);

const planeEntity = Rn.createMeshEntity();
const planePrimitive = new Rn.Plane();
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
const planeMesh = new Rn.Mesh();
planeMesh.addPrimitive(planePrimitive);
planeMeshComponent.setMesh(planeMesh);
planeEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

const sphereEntity = Rn.createMeshEntity();
const spherePrimitive = new Rn.Sphere();
const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
spherePrimitive.generate({
  radius: -100,
  widthSegments: 40,
  heightSegments: 40,
  material: sphereMaterial,
});
const environmentCubeTexture = new Rn.CubeTexture();
{
  const response = await fetch('../../../assets/images/cubemap_test.basis');
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  environmentCubeTexture.loadTextureImagesFromBasis(uint8Array);
}
const samplerSphere = new Rn.Sampler({
  magFilter: Rn.TextureParameter.Linear,
  minFilter: Rn.TextureParameter.LinearMipmapLinear,
  wrapS: Rn.TextureParameter.ClampToEdge,
  wrapT: Rn.TextureParameter.ClampToEdge,
});
sphereMaterial.setTextureParameter('colorEnvTexture', environmentCubeTexture, samplerSphere);
const sphereMeshComponent = sphereEntity.getMesh();
const sphereMesh = new Rn.Mesh();
sphereMesh.addPrimitive(spherePrimitive);
sphereMeshComponent.setMesh(sphereMesh);

// Camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(90);
cameraComponent.aspect = 1;

cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(planeEntity);

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.toClearColorBuffer = true;
renderPass.addEntities([planeEntity, sphereEntity]);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.current = 0;
let startTime = Date.now();
let count = 0;

Rn.System.startRenderLoop(() => {
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
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
    //console.log(time);
    //      rootGroup.getTransform().scale = rotationVec3;
    //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
  }

  Rn.System.process([expression]);
  count++;
});
