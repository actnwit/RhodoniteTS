import {ICameraEntity} from '../../../dist/esm/index.js';
import Rn from '../../../dist/esm/index.mjs';

const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Depth Camera
  const depthCameraEntity = Rn.EntityHelper.createCameraEntity();
  depthCameraEntity.getCamera().zFar = 50.0;
  depthCameraEntity.getCamera().setFovyAndChangeFocalLength(40);
  depthCameraEntity.translate = Rn.Vector3.fromCopyArray([2.0, 2.0, 5.0]);

  // Main Camera
  const mainCameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  mainCameraEntity.translate = Rn.Vector3.fromCopyArray([-0.1, -0.1, -0.2]);

  // Depth RenderPass
  const renderPassDepth =
    createRenderPassSpecifyingCameraComponent(depthCameraEntity);
  createFramebuffer(renderPassDepth, 1024, 1024);

  // Main RenderPass
  const renderPassMain =
    createRenderPassSpecifyingCameraComponent(mainCameraEntity);

  // Expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPassDepth, renderPassMain]);

  // Scene Objects
  const entitySmallBoard = createBoardEntityWithMaterial([{}, renderPassDepth]);
  const entityLargeBoard = createBoardEntityWithMaterial([{}, renderPassDepth]);

  // set Transforms
  const scaleSmallBoard = Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]);
  const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.0]);
  const rotateSmallBoard = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);
  const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -1.5]);
  const rotateBigBoard = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

  entitySmallBoard.getTransform().scale = scaleSmallBoard;
  entitySmallBoard.getTransform().translate = translateSmallBoard;
  entitySmallBoard.getTransform().rotate = rotateSmallBoard;
  entityLargeBoard.getTransform().translate = translateBigBoard;
  entityLargeBoard.getTransform().rotate = rotateBigBoard;

  // set entities to render passes
  renderPassDepth.addEntities([entitySmallBoard, entityLargeBoard]);
  renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

  // set depth shader to depth render pass
  renderPassDepth.setMaterial(Rn.MaterialHelper.createDepthEncodeMaterial());

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
  setParameterForMeshComponent(
    meshComponentLargeBoard,
    Rn.ShadowMapDecodeClassicMaterialContent.ShadowColorFactor,
    Rn.Vector4.fromCopyArray([0.05, 0.35, 0.25, 1])
  );

  let count = 0;

  const draw = function () {
    if (count > 0) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    }
    Rn.System.process([expression]);

    count++;
    requestAnimationFrame(draw);
  };

  draw();

  function createBoardEntityWithMaterial(arrayOfHelperFunctionArgument = []) {
    const entity = Rn.EntityHelper.createMeshEntity();

    const primitive = new Rn.Plane();
    primitive.generate({
      width: 1,
      height: 1,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper.createShadowMapDecodeClassicSingleMaterial(
        ...arrayOfHelperFunctionArgument
      ),
    });

    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createFramebuffer(renderPass, height, width) {
    const framebuffer = Rn.RenderableHelper.createDepthBuffer(height, width);
    renderPass.setFramebuffer(framebuffer);
    return framebuffer;
  }

  function createRenderPassSpecifyingCameraComponent(
    cameraEntity: ICameraEntity
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraEntity.getCamera();
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
})();
