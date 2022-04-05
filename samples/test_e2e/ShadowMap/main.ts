import _Rn from '../../../dist/esm/index';
declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // setting cameras except for post effect
  const depthCameraComponent = createCameraComponent();
  depthCameraComponent.zFar = 50.0;
  depthCameraComponent.setFovyAndChangeFocalLength(40);
  const depthCameraEntity = depthCameraComponent.entity;
  depthCameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    2.0, 2.0, 5.0,
  ]);

  const mainCameraComponent = createCameraComponent();
  const mainCameraEntity = mainCameraComponent.entity;
  mainCameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    -0.1, -0.1, -0.2,
  ]);

  // setting render passes
  const renderPassDepth =
    createRenderPassSpecifyingCameraComponent(depthCameraComponent);
  createFramebuffer(renderPassDepth, 1024, 1024, 1, {});

  const renderPassMain =
    createRenderPassSpecifyingCameraComponent(mainCameraComponent);

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPassDepth, renderPassMain]);

  //main
  const entitySmallBoardForDepth = createBoardEntityWithMaterial(
    'createDepthEncodeMaterial',
    [{}]
  );
  const entityLargeBoardForDepth = createBoardEntityWithMaterial(
    'createDepthEncodeMaterial',
    [{}]
  );
  renderPassDepth.addEntities([
    entitySmallBoardForDepth,
    entityLargeBoardForDepth,
  ]);

  const entitySmallBoard = createBoardEntityWithMaterial(
    'createShadowMapDecodeClassicSingleMaterial',
    [{}, renderPassDepth]
  );
  const entityLargeBoard = createBoardEntityWithMaterial(
    'createShadowMapDecodeClassicSingleMaterial',
    [{}, renderPassDepth]
  );
  renderPassMain.addEntities([entitySmallBoard, entityLargeBoard]);

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
    Rn.ShadowMapDecodeClassicSingleMaterialNode.ShadowColorFactor,
    Rn.Vector4.fromCopyArray([0.05, 0.35, 0.25, 1])
  );

  const scaleSmallBoard = Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]);
  const translateSmallBoard = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.0]);
  const rotateSmallBoard = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);
  const translateBigBoard = Rn.Vector3.fromCopyArray([0, 0, -1.5]);
  const rotateBigBoard = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

  entitySmallBoardForDepth.getTransform().scale = scaleSmallBoard;
  entitySmallBoardForDepth.getTransform().translate = translateSmallBoard;
  entitySmallBoardForDepth.getTransform().rotate = rotateSmallBoard;
  entityLargeBoardForDepth.getTransform().translate = translateBigBoard;
  entityLargeBoardForDepth.getTransform().rotate = rotateBigBoard;

  entitySmallBoard.getTransform().scale = scaleSmallBoard;
  entitySmallBoard.getTransform().translate = translateSmallBoard;
  entitySmallBoard.getTransform().rotate = rotateSmallBoard;
  entityLargeBoard.getTransform().translate = translateBigBoard;
  entityLargeBoard.getTransform().rotate = rotateBigBoard;

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

  function createBoardEntityWithMaterial(
    materialHelperFunctionStr,
    arrayOfHelperFunctionArgument = []
  ) {
    const entity = Rn.EntityHelper.createMeshEntity();

    const primitive = new Rn.Plane();
    primitive.generate({
      width: 1,
      height: 1,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper[materialHelperFunctionStr](
        ...arrayOfHelperFunctionArgument
      ),
    });

    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createCameraComponent() {
    const cameraEntity = Rn.EntityHelper.createCameraEntity();
    const cameraComponent = cameraEntity.getCamera();
    return cameraComponent;
  }

  function createFramebuffer(renderPass, height, width, textureNum, property) {
    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
      height,
      width,
      textureNum,
      property
    );
    renderPass.setFramebuffer(framebuffer);
    return framebuffer;
  }

  function createRenderPassSpecifyingCameraComponent(cameraComponent) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
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
