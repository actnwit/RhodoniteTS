
let p = null;

const load = function (time) {
  const promises = [];
  promises.push(Rn.ModuleManager.getInstance().loadModule('webgl'));
  promises.push(Rn.ModuleManager.getInstance().loadModule('pbr'));
  Promise.all(promises).then(function () {
    const importer = Rn.Gltf2Importer.getInstance();
    const system = Rn.System.getInstance();
    const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'), 1);

    const entityRepository = Rn.EntityRepository.getInstance();

    // Camera
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent])
    const cameraComponent = cameraEntity.getComponent(Rn.CameraComponent);
    //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
    cameraComponent.zNear = 0.1;
    cameraComponent.zFar = 1000;
    cameraComponent.setFovyAndChangeFocalLength(25);
    cameraComponent.aspect = 1;
    //cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 0.5);

    // Seting FXAA [start]
    const expression = new Rn.Expression();
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
    renderPass.cameraComponent = cameraComponent;
    const renderPassFxaa = new Rn.RenderPass();
    renderPassFxaa.toClearColorBuffer = true;
    const renderPassGamma = new Rn.RenderPass();

    expression.addRenderPasses([renderPass, renderPassFxaa, renderPassGamma]);

    const framebufferFxaaTarget = Rn.RenderableHelper.createTexturesForRenderTarget(800, 800, 1, {})
    const framebufferGammaTarget = Rn.RenderableHelper.createTexturesForRenderTarget(800, 800, 1, {})
    renderPass.setFramebuffer(framebufferFxaaTarget);

    const entityFxaa = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    const primitiveFxaa = new Rn.Plane();
    primitiveFxaa.generate({ width: 2, height: 2, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveFxaa.material = Rn.MaterialHelper.createFXAA3QualityMaterial();
    primitiveFxaa.material.setTextureParameter(Rn.ShaderSemantics.BaseColorTexture, framebufferFxaaTarget.colorAttachments[0]);
    primitiveFxaa.material.setParameter(Rn.ShaderSemantics.ScreenInfo, new Rn.Vector2(800, 800));
    const meshComponentFxaa = entityFxaa.getComponent(Rn.MeshComponent);
    const meshFxaa = new Rn.Mesh();
    meshFxaa.addPrimitive(primitiveFxaa);
    meshComponentFxaa.setMesh(meshFxaa);
    entityFxaa.getTransform().rotate = new Rn.Vector3(-Math.PI / 2, 0, 0);
    renderPassFxaa.addEntities([entityFxaa]);
    const cameraEntityFxaa = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent])
    const cameraComponentFxaa = cameraEntityFxaa.getComponent(Rn.CameraComponent);
    cameraEntityFxaa.getTransform().translate = new Rn.Vector3(0.0, 0.0, 1.0);
    cameraComponentFxaa.type = Rn.CameraType.Orthographic;
    renderPassFxaa.cameraComponent = cameraComponentFxaa;
    renderPassFxaa.setFramebuffer(framebufferGammaTarget);
    // Setting FXAA [end]

    const entityGamma = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    const primitiveGamma = new Rn.Plane();
    primitiveGamma.generate({ width: 2, height: 2, uSpan: 1, vSpan: 1, isUVRepeat: false });
    primitiveGamma.material = Rn.MaterialHelper.createGammaCorrectionMaterial();
    primitiveGamma.material.setTextureParameter(Rn.ShaderSemantics.BaseColorTexture, framebufferGammaTarget.colorAttachments[0]);
    const meshComponentGamma = entityGamma.getComponent(Rn.MeshComponent);
    const meshGamma = new Rn.Mesh();
    meshGamma.addPrimitive(primitiveGamma);
    meshComponentGamma.setMesh(meshGamma);
    entityGamma.getTransform().rotate = new Rn.Vector3(-Math.PI / 2, 0, 0);
    renderPassGamma.cameraComponent = cameraComponentFxaa;
    renderPassGamma.addEntities([entityGamma]);

    // Lights
    // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
    // lightEntity.getComponent(Rn.LightComponent).type = Rn.LightType.Directional;
    // lightEntity.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
    //  lightEntity.getTransform().translate = new Rn.Vector3(1.0, 100000.0, 1.0);
    //  lightEntity.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(1, 1, 1);
    // const lightEntity2 = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
    // lightEntity2.getTransform().translate = new Rn.Vector3(1000.0, 0.0, 1.0);
    // lightEntity2.getComponent(Rn.LightComponent).intensity = new Rn.Vector3(0.5, 0.5, 0.5);
    //lightEntity2.getTransform().rotate = new Rn.Vector3(Math.PI/2, 0, 0);
    //lightEntity2.getComponent(Rn.LightComponent).type = Rn.LightType.Directional;


    //const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/BoxTextured/glTF/BoxTextured.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/Lantern/glTF/Lantern.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/WaterBottle/glTF/WaterBottle.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/VC/glTF/VC.gltf');
    // const response = await importer.import('../../../assets/gltf/2.0/Buggy/glTF/Buggy.gltf');
    //  const response = await importer.import('../../../assets/gltf/2.0/Triangle/glTF/Triangle.gltf');
    //   const response = await importer.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
    const promise = importer.import('../../../assets/gltf/2.0/BoxAnimated/glTF/BoxAnimated.gltf');
    // const response = await importer.import('../../../assets/gltf/2.0/BrainStem/glTF/BrainStem.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/AnimatedMorphCube/glTF/AnimatedMorphCube.gltf');
    //  const promise = importer.import('../../../assets/gltf/2.0/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf');
    //const response = await importer.import('../../../assets/gltf/2.0/gltf-asset-generator/Animation_Node/Animation_Node_05.gltf');
    // const response = await importer.import('../../../assets/gltf/2.0/polly/project_polly.glb');
    // const promise = importer.import('../../../assets/gltf/2.0/zoman_sf/scene.gltf');
    //  const response = await importer.import('../../../assets/gltf/2.0/env_test/EnvironmentTest.gltf');
    promise.then(function (response) {
      const modelConverter = Rn.ModelConverter.getInstance();
      const rootGroup = modelConverter.convertToRhodoniteObject(response);
      //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
      //  rootGroup.getTransform().rotate = new Rn.Vector3(0, 1.0, 0.0);


      // CameraComponent
      const cameraControllerComponent = cameraEntity.getComponent(Rn.CameraControllerComponent);
      const controller = cameraControllerComponent.controller;
      controller.setTarget(rootGroup);
      controller.zFarAdjustingFactorBasedOnAABB = 1000;

      // Env Cube
      const sphereEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
      const spherePrimitive = new Rn.Sphere();
      window.sphereEntity = sphereEntity;
      const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
      window.sphereMaterial = sphereMaterial;
      const environmentCubeTexture = new Rn.CubeTexture();
      // environmentCubeTexture.baseUriToLoad = '../../../assets/ibl/papermill/environment/environment';
      environmentCubeTexture.baseUriToLoad = '../../../assets/ibl/shanghai_bund/environment/environment';
      environmentCubeTexture.isNamePosNeg = true;
      environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
      environmentCubeTexture.mipmapLevelNumber = 1;
      environmentCubeTexture.loadTextureImagesAsync();
      sphereMaterial.setTextureParameter(Rn.ShaderSemantics.ColorEnvTexture, environmentCubeTexture);
      spherePrimitive.generate({ radius: 100, widthSegments: 40, heightSegments: 40, material: sphereMaterial });
      const sphereMeshComponent = sphereEntity.getComponent(Rn.MeshComponent);
      const sphereMesh = new Rn.Mesh();
      sphereMesh.addPrimitive(spherePrimitive);
      sphereMeshComponent.setMesh(sphereMesh);
      sphereEntity.getTransform().scale = new Rn.Vector3(1, 1, 1);

      renderPass.addEntities([rootGroup, sphereEntity]);

      // Env Map
      const specularCubeTexture = new Rn.CubeTexture();
      // specularCubeTexture.baseUriToLoad = '../../../assets/ibl/papermill/specular/specular';
      specularCubeTexture.baseUriToLoad = '../../../assets/ibl/shanghai_bund/specular/specular';
      specularCubeTexture.isNamePosNeg = true;
      specularCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
      specularCubeTexture.mipmapLevelNumber = 10;
      const diffuseCubeTexture = new Rn.CubeTexture();
      // diffuseCubeTexture.baseUriToLoad = '../../../assets/ibl/papermill/diffuse/diffuse';
      diffuseCubeTexture.baseUriToLoad = '../../../assets/ibl/shanghai_bund/diffuse/diffuse';
      diffuseCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
      diffuseCubeTexture.mipmapLevelNumber = 1;
      diffuseCubeTexture.isNamePosNeg = true;
      const componentRepository = Rn.ComponentRepository.getInstance();
      window.meshRendererComponents = componentRepository.getComponentsWithType(Rn.MeshRendererComponent);
      for (let i = 0; i < window.meshRendererComponents.length; i++) {
        let meshRendererComponent = window.meshRendererComponents[i];
        meshRendererComponent.specularCubeMap = specularCubeTexture;
        meshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
      }

      /*
      const sphere2Entity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
      const sphere2Primitive = new Rn.Sphere();
      const sphere2PbrMaterial = Rn.MaterialHelper.createPbrUberMaterial();
      sphere2PbrMaterial.setParameter(Rn.ShaderSemantics.MetallicRoughnessFactor, new Rn.Vector2(0, 0));
  
      sphere2Primitive.generate({radius: 50, widthSegments: 40, heightSegments: 40, material: sphere2PbrMaterial});
      const sphere2MeshComponent = sphere2Entity.getComponent(Rn.MeshComponent);
      const sphere2Mesh = new Rn.Mesh();
      sphere2Mesh.addPrimitive(sphere2Primitive);
      sphere2MeshComponent.setMesh(sphere2Mesh);
      cameraControllerComponent.controller.setTarget(sphere2Entity);
      const sphere2MeshRendererComponent = sphere2Entity.getComponent(Rn.MeshRendererComponent);
      window.sphere2MeshRendererComponent = sphere2MeshRendererComponent;
      sphere2MeshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
      sphere2MeshRendererComponent.specularCubeMap = specularCubeTexture;
    */
      Rn.CameraComponent.main = 0;
      let startTime = Date.now();
      const rotationVec3 = Rn.MutableVector3.one();
      let count = 0;
      let rot = 0;
      const draw = function (time) {

        if (p == null && count > 0) {
          if (response != null) {

            gl.enable(gl.DEPTH_TEST);
            gl.viewport(0, 0, 800, 800);
            gl.clearColor(0.8, 0.8, 0.8, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          }

          p = document.createElement('p');
          p.setAttribute("id", "rendered");
          p.innerText = 'Rendered.';
          document.body.appendChild(p);

        }

        if (window.isAnimating) {
          const date = new Date();
          const rotation = 0.001 * (date.getTime() - startTime);
          //rotationVec3.v[0] = 0.1;
          //rotationVec3.v[1] = rotation;
          //rotationVec3.v[2] = 0.1;
          const time = (date.getTime() - startTime) / 1000;
          Rn.AnimationComponent.globalTime = time;
          if (time > Rn.AnimationComponent.endInputValue) {
            startTime = date.getTime();
          }
          rotEnv(rot++ * 0.004);
          //console.log(time);
          //      rootGroup.getTransform().scale = rotationVec3;
          //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
        }

        // system.process();
        system.process(expression);
        count++;

        requestAnimationFrame(draw);
      }

      draw();
    });
  });
}
document.body.onload = load;

function exportGltf2() {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
}

function rotEnv(rot) {
  for (let i = 0; i < window.meshRendererComponents.length; i++) {
    const meshRendererComponent = window.meshRendererComponents[i];
    meshRendererComponent.rotationOfCubeMap = rot;
  }
  window.sphereMaterial.setParameter('envRotation', rot);
}

function setDiffuseCubeMapContribution(value) {
  for (let i = 0; i < window.meshRendererComponents.length; i++) {
    const meshRendererComponent = window.meshRendererComponents[i];
    meshRendererComponent.diffuseCubeMapContribution = value;
  }
}

function setSpecularCubeMapContribution(value) {
  for (let i = 0; i < window.meshRendererComponents.length; i++) {
    const meshRendererComponent = window.meshRendererComponents[i];
    meshRendererComponent.specularCubeMapContribution = value;
  }
}

function setAnisotropy(baseAnisotropy, clearcoatAnisotropy) {
  const materials = Rn.Material.getAllMaterials();
  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    material.setParameter(Rn.ShaderSemantics.Anisotropy, new Rn.Vector2(baseAnisotropy, clearcoatAnisotropy));
  }
}

function setClearCoat(factor, roughness) {
  const materials = Rn.Material.getAllMaterials();
  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    material.setParameter(Rn.ShaderSemantics.ClearCoatParameter, new Rn.Vector2(factor, roughness));
  }
}

function setSheen(sheenColor, sheenSubsurfaceColor) {
  const materials = Rn.Material.getAllMaterials();
  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    material.setParameter(Rn.ShaderSemantics.SheenParameter, new Rn.Vector2(sheenColor, sheenSubsurfaceColor));
  }
}
