import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
(function () {
  window.Rn = Rn;
  //    import Rn from '../../../dist/rhodonite.mjs';

  const promises: Promise<void>[] = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgpu'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(async () => {
    const gl = await Rn.System.init({
      approach: Rn.ProcessApproach.WebGPU,
      canvas: document.getElementById('world') as HTMLCanvasElement,
    });

    let count = 0;

    const response = await Rn.Gltf2Importer.importFromUri(
      '../../../assets/gltf/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
      {
        // defaultMaterialHelperName: 'createFlatMaterial',
      }
    );
    //---------------------------
    const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(response.unwrapForce());
    //rootGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
    rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

    // CameraComponent
    const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
    const cameraComponent = cameraEntity.getCamera();
    // cameraComponent.type = Rn.CameraTyp]e.Orthographic;
    cameraComponent.zNear = 0.1;
    cameraComponent.zFar = 1000;
    cameraComponent.setFovyAndChangeFocalLength(45);
    cameraComponent.aspect = 1;
    cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);
    const cameraControllerComponent = cameraEntity.getCameraController();
    cameraControllerComponent.controller.setTarget(rootGroup);

    // Light
    const light = Rn.EntityHelper.createLightEntity();
    light.getLight().type = Rn.LightType.Directional;

    // renderPass
    const renderPass = new Rn.RenderPass();
    renderPass.clearColor = Rn.Vector4.fromCopy4(0.5, 0.5, 0.5, 1.0);
    renderPass.toClearColorBuffer = true;
    renderPass.addEntities([rootGroup]);
    renderPass.cameraComponent = cameraComponent;

    // expression
    const expression = new Rn.Expression();
    expression.addRenderPasses([renderPass]);

    // lighting
    await setIBL('./../../../assets/ibl/papermill');

    let startTime = Date.now();
    const draw = function () {
      if (count > 100) {
        window._rendered = true;
      }

      if (window.isAnimating) {
        const date = new Date();
        const rotation = 0.001 * (date.getTime() - startTime);
        //rotationVec3._v[0] = 0.1;
        //rotationVec3._v[1] = rotation;
        //rotationVec3._v[2] = 0.1;
        const time = (date.getTime() - startTime) / 1000;
        Rn.AnimationComponent.globalTime = time;
        if (time > Rn.AnimationComponent.endInputValue) {
          startTime = date.getTime();
        }
      }

      //      console.log(date.getTime());
      Rn.System.process([expression]);

      count++;
      requestAnimationFrame(draw);
    };

    draw();
  });
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};

function createEnvCubeExpression(baseuri) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseuri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  sphereMaterial.setTextureParameter(Rn.ShaderSemantics.ColorEnvTexture, environmentCubeTexture);
  sphereMaterial.setParameter(
    Rn.EnvConstantMaterialContent.EnvHdriFormat,
    Rn.HdriFormat.LDR_SRGB.index
  );

  const spherePrimitive = new Rn.Sphere();
  spherePrimitive.generate({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.EntityHelper.createMeshEntity();
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 20, -20]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

async function setIBL(baseUri) {
  const specularCubeTexture = new Rn.CubeTexture();
  specularCubeTexture.baseUriToLoad = baseUri + '/specular/specular';
  specularCubeTexture.isNamePosNeg = true;
  specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  specularCubeTexture.mipmapLevelNumber = 10;

  const diffuseCubeTexture = new Rn.CubeTexture();
  diffuseCubeTexture.baseUriToLoad = baseUri + '/diffuse/diffuse';
  diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  diffuseCubeTexture.mipmapLevelNumber = 1;
  diffuseCubeTexture.isNamePosNeg = true;

  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(diffuseCubeTexture, specularCubeTexture);
  }
}
