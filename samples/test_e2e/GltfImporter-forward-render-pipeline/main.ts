import Rn from '../../../dist/esm/index.mjs';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

(async () => {
  Rn.Config.isUboEnabled = false;
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas,
  });

  Rn.MeshRendererComponent.isDepthMaskTrueForTransparencies = true;

  // create ForwardRenderPipeline
  const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
  forwardRenderPipeline.setup(canvas.width, canvas.height);

  // camera
  const {cameraComponent, cameraEntity} = createCamera();

  // gltf
  const mainExpression = await Rn.GltfImporter.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          makeOutputSrgb: false,
        },
      ],
    }
  );

  // env
  const envExpression = createEnvCubeExpression(
    './../../../assets/ibl/papermill',
    cameraEntity
  );

  const mainRenderPass = mainExpression.renderPasses[0];
  // cameraController
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    mainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
  controller.dolly = 0.83;

  forwardRenderPipeline.setExpressions([envExpression, mainExpression]);

  // lighting
  forwardRenderPipeline.setIBL({
    diffuse: {
      baseUri: './../../../assets/ibl/papermill/diffuse/diffuse',
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
      isNamePosNeg: true,
      mipmapLevelNumber: 1,
    },
    specular: {
      baseUri: './../../../assets/ibl/papermill/specular/specular',
      hdriFormat: Rn.HdriFormat.RGBE_PNG,
      isNamePosNeg: true,
      mipmapLevelNumber: 10,
    },
  });

  let count = 0;
  let startTime = Date.now();
  const draw = function (frame) {
    if (count > 50) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    } else if (count === 1) {
      p.id = 'started';
      p.innerText = 'Started.';
    }

    if (window.isAnimating) {
      const date = new Date();
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }

    Rn.System.process(frame);

    count++;
  };

  forwardRenderPipeline.startRenderLoop(draw);
})();

function createCamera() {
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;
  return {cameraComponent, cameraEntity};
}

function createEnvCubeExpression(baseuri, cameraEntity) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseuri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture
  );
  sphereMaterial.setParameter(
    Rn.EnvConstantMaterialContent.EnvHdriFormat,
    Rn.HdriFormat.LDR_SRGB.index
  );

  const spherePrimitive = new Rn.Sphere();
  spherePrimitive.generate({
    radius: 20,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.EntityHelper.createMeshEntity();
  sphereEntity.getTransform().scale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().translate = Rn.Vector3.fromCopyArray([0, 0, 0]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);
  sphereRenderPass.cameraComponent = cameraEntity.getCamera();

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}