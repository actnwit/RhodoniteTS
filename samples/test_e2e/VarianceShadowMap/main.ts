import {ICameraEntityMethods, ILightEntity} from '../../../dist/esm/index.js';
// import Rn from '../../../dist/esm/index.mjs';
import Rn from '../../../dist/cjs';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Spot Light
  const spotLight = Rn.EntityHelper.createLightWithCameraEntity();
  spotLight.getLight().type = Rn.LightType.Spot;
  spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
  spotLight.rotate = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
  spotLight.translate = Rn.Vector3.fromCopy3(0.0, 1.0, 0);

  // Main Camera
  const mainCameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  mainCameraEntity.translate = Rn.Vector3.fromCopyArray([0.5, 3, 0.5]);
  mainCameraEntity.rotate = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);

  // Depth RenderPass
  const renderPassDepth = createRenderPassSpecifyingCameraComponent(spotLight);
  createFramebuffer(renderPassDepth, 1024, 1024);

  // Main RenderPass
  const renderPassMain =
    createRenderPassSpecifyingCameraComponent(mainCameraEntity);

  // Expression
  const expression = new Rn.Expression();
  // expression.addRenderPasses([renderPassDepth]);
  expression.addRenderPasses([renderPassDepth, renderPassMain]);

  // Scene Objects
  const entitySmallBoard = createBoardEntityWithMaterial();
  const entityLargeBoard = createBoardEntityWithMaterial();

  // set Transforms
  const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.5, -0.0]);
  const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -0.0]);

  entitySmallBoard.getTransform().scale = Rn.Vector3.fromCopy3(0.2, 0.2, 0.2);
  entitySmallBoard.getTransform().translate = translateSmallBoard;
  // entitySmallBoard.getTransform().rotate = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);
  entityLargeBoard.getTransform().translate = translateBigBoard;
  // entityLargeBoard.getTransform().rotate = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);

  // set entities to render passes
  renderPassDepth.addEntities([entitySmallBoard, entityLargeBoard]);
  renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

  // set depth shader to depth render pass
  renderPassDepth.setMaterial(Rn.MaterialHelper.createFlatMaterial());

  // set parameters
  const meshComponentSmallBoard = entitySmallBoard.getMesh();
  const meshComponentLargeBoard = entityLargeBoard.getMesh();
  setParameterForMeshComponent(
    meshComponentSmallBoard,
    Rn.ShaderSemantics.DiffuseColorFactor,
    Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
  );
  setParameterForMeshComponent(
    meshComponentLargeBoard,
    Rn.ShaderSemantics.DiffuseColorFactor,
    Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
  );
  setTextureParameterForMeshComponent(
    meshComponentSmallBoard,
    Rn.ShaderSemantics.DepthTexture,
    renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()
  );
  setTextureParameterForMeshComponent(
    meshComponentLargeBoard,
    Rn.ShaderSemantics.DepthTexture,
    renderPassDepth.getFramebuffer().getDepthAttachedRenderTargetTexture()
  );

  window.download = function () {
    renderPassDepth
      .getFramebuffer()
      .getDepthAttachedRenderTargetTexture()!
      .downloadTexturePixelData();
  };

  let count = 0;

  const draw = function () {
    if (count > 0) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    }
    Rn.System.process([expression]);

    setParameterForMeshComponent(
      meshComponentSmallBoard,
      Rn.ShaderSemantics.DepthBiasPV,
      spotLight.getCamera().biasViewProjectionMatrix
    );
    setParameterForMeshComponent(
      meshComponentLargeBoard,
      Rn.ShaderSemantics.DepthBiasPV,
      spotLight.getCamera().biasViewProjectionMatrix
    );
    count++;
    requestAnimationFrame(draw);
  };

  draw();

  function createBoardEntityWithMaterial() {
    const entity = Rn.EntityHelper.createMeshEntity();

    const primitive = new Rn.Plane();
    primitive.generate({
      width: 1,
      height: 1,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper.createClassicUberMaterial({
        isShadow: true,
      }),
    });

    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createFramebuffer(renderPass, height, width) {
    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
      height,
      width,
      1,
      {
        level: 0,
        internalFormat: Rn.TextureParameter.RG16F,
        format: Rn.PixelFormat.RG,
        type: Rn.ComponentType.HalfFloat,
        magFilter: Rn.TextureParameter.Linear,
        minFilter: Rn.TextureParameter.Linear,
        wrapS: Rn.TextureParameter.ClampToEdge,
        wrapT: Rn.TextureParameter.ClampToEdge,
        createDepthBuffer: true,
        isMSAA: false,
        sampleCountMSAA: 1,
      }
    );
    renderPass.setFramebuffer(framebuffer);
    return framebuffer;
  }

  function createRenderPassSpecifyingCameraComponent(
    lightWithCameraEntity: ILightEntity & ICameraEntityMethods
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = lightWithCameraEntity.getCamera();
    return renderPass;
  }

  function setParameterForMeshComponent(meshComponent, shaderSemantic, value) {
    const mesh = meshComponent.mesh;
    const primitiveNumber = mesh.getPrimitiveNumber();

    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setParameter(shaderSemantic, value);
    }
  }
  function setTextureParameterForMeshComponent(
    meshComponent,
    shaderSemantic,
    value
  ) {
    const mesh = meshComponent.mesh;
    const primitiveNumber = mesh.getPrimitiveNumber();

    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setTextureParameter(shaderSemantic, value);
    }
  }
})();
