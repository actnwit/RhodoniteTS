import _Rn from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const world = document.getElementById('world') as HTMLCanvasElement;
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, world);

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(25.0);
  cameraComponent.aspect = world.width / world.height;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = new Rn.Vector3(0, 2, 8);
  cameraTransform.rotate = new Rn.Vector3(-0.1, 0, 0);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    './../../../assets/gltf/2.0/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  );

  // gamma correction
  // const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(world.width, world.height, 1, {});
  // expression.renderPasses[0].setFramebuffer(gammaTargetFramebuffer);

  // const gammaRenderPass = createGammaCorrectRenderPass(gammaTargetFramebuffer);
  // const gammaExpression = new Rn.Expression();
  // gammaExpression.addRenderPasses([gammaRenderPass]);

  system.process([expression]);
  // system.process([expression, gammaExpression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';

  // function createGammaCorrectRenderPass(targetFramebuffer) {
  //   const boardPrimitive = new Rn.Plane();
  //   boardPrimitive.generate({
  //     width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
  //     material: Rn.MaterialHelper.createGammaCorrectionMaterial()
  //   });
  //   boardPrimitive.material.setTextureParameter(Rn.ShaderSemantics.BaseColorTexture, targetFramebuffer.getColorAttachedRenderTargetTexture(0));

  //   const boardMesh = new Rn.Mesh();
  //   boardMesh.addPrimitive(boardPrimitive);

  //   const boardEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
  //   const boardMeshComponent = boardEntity.getMesh();
  //   boardMeshComponent.setMesh(boardMesh);

  //   boardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);
  //   boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);

  //   const cameraEntityGamma = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
  //   const cameraComponentGamma = cameraEntityGamma.getCamera();
  //   cameraComponentGamma.zFarInner = 1.0;

  //   const renderPass = new Rn.RenderPass();
  //   renderPass.toClearColorBuffer = true;
  //   renderPass.clearColor = new Rn.Vector4(0.0, 0.0, 0.0, 1.0);
  //   renderPass.cameraComponent = cameraComponentGamma;
  //   renderPass.addEntities([boardEntity]);

  //   return renderPass;
  // }
})();
