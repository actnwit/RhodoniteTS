// import Rn from '../../../dist/esm/index.mjs';
import Rn from '../../../dist/cjs';

declare const window: any;

let framebuffer: Rn.FrameBuffer;
let renderPassMain: Rn.RenderPass;

async function initRn() {
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas,
    webglOption: {antialias: false},
  });
}

(async () => {
  // Init Rhodonite
  await initRn();

  // expressions
  const expressions = [];

  // env
  const envExpression = createEnvCubeExpression(
    './../../../assets/ibl/papermill'
  );
  expressions.push(envExpression);

  // setup the Main RenderPass

  // Main Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(20.0);
  cameraComponent.aspect = 1.0;

  // Loading gltf
  const mainExpression = (
    await Rn.GltfImporter.importFromUri(
      '../../../assets/gltf/glTF-Sample-Models/2.0/AntiqueCamera/glTF/AntiqueCamera.gltf',
      {
        cameraComponent: cameraComponent,
      }
    )
  ).unwrapForce();
  expressions.push(mainExpression);

  Rn.System.startRenderLoop(() => {
    Rn.System.process(expressions);
  });
})();

function createEnvCubeExpression(baseUri: string) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseUri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.HDR_LINEAR;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture
  );
  sphereMaterial.setParameter(
    Rn.EnvConstantMaterialContent.EnvHdriFormat,
    Rn.HdriFormat.HDR_LINEAR.index
  );

  const sphereEntity = Rn.MeshHelper.createSphere({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  sphereEntity.scale = Rn.Vector3.fromCopy3(-1, 1, 1);
  sphereEntity.translate = Rn.Vector3.fromCopy3(0, 20, -20);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}
