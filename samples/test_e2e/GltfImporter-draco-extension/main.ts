
import _Rn from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
let p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  // expressions
  const expressions = [];

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const mainExpression = await gltfImporter.import('../../../assets/gltf/2.0/BarramundiFish/glTF-Draco/BarramundiFish.gltf', {
    cameraComponent: cameraComponent
  });
  expressions.push(mainExpression);

  // post effects
  const expressionPostEffect = new Rn.Expression();
  expressions.push(expressionPostEffect);

  // gamma correction
  const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(600, 600, 1, {});
  const mainRenderPass = mainExpression.renderPasses[0];
  mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
  mainRenderPass.toClearColorBuffer = true;
  mainRenderPass.toClearDepthBuffer = true;

  const rootGroup = mainRenderPass.sceneTopLevelGraphComponents[0].entity;
  const rootTransFormComponent = rootGroup.getTransform();
  rootTransFormComponent.rotate = new Rn.Vector3(0, Math.PI / 2.0, 0.0);
  rootTransFormComponent.translate = new Rn.Vector3(0, -0.13, -1.5);

  const gammaRenderPass = createPostEffectRenderPass('createGammaCorrectionMaterial');
  setTextureParameterForMeshComponents(gammaRenderPass.meshComponents, Rn.ShaderSemantics.BaseColorTexture, gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0));

  expressionPostEffect.addRenderPasses([gammaRenderPass]);

  // lighting
  const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent]);
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = new Rn.Vector3(0.5, 0.5, 0.5);
  lightEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);


  let count = 0;

  const draw = function () {
    if (count > 1) {
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
    }

    system.process(expressions);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

  function createPostEffectRenderPass(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
    const boardPrimitive = new Rn.Plane();
    const material = Rn.MaterialHelper[materialHelperFunctionStr].apply(this, arrayOfHelperFunctionArgument);
    material.alphaMode = Rn.AlphaMode.Translucent;
    boardPrimitive.generate({
      width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
      material: material
    });

    const boardEntity = generateEntity();
    boardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);
    boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);

    const boardMesh = new Rn.Mesh();
    boardMesh.addPrimitive(boardPrimitive);
    const boardMeshComponent = boardEntity.getMesh();
    boardMeshComponent.setMesh(boardMesh);

    const entityRepository = Rn.EntityRepository.getInstance();
    const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
    const cameraComponent = cameraEntity.getCamera();
    cameraComponent.zFarInner = 1.0;

    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = false;
    renderPass.toClearDepthBuffer = false;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([boardEntity]);

    return renderPass;
  }

  function generateEntity() {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
    return entity;
  }

  function setTextureParameterForMeshComponents(meshComponents, shaderSemantic, value) {
    for (let i = 0; i < meshComponents.length; i++) {
      const mesh = meshComponents[i].mesh;
      if (!mesh) continue;

      const primitiveNumber = mesh.getPrimitiveNumber();
      for (let j = 0; j < primitiveNumber; j++) {
        const primitive = mesh.getPrimitiveAt(j);
        primitive.material.setTextureParameter(shaderSemantic, value);
      }
    }
  }
