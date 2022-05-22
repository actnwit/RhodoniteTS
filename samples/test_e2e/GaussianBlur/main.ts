import Rn from '../../../dist/esm/index.js';

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const gaussianKernelSize = 15;
  const gaussianVariance = 8.0;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: rnCanvasElement,
  });

  // prepare renderPasses
  const cameraComponentMain = createEntityMainCamera().getCamera();
  const renderPassMain = createRenderPassMain(cameraComponentMain);
  const resolution = rnCanvasElement.width;
  createAndSetFramebuffer(renderPassMain, resolution, 1, {});

  const cameraComponentPostEffect = createEntityPostEffectCamera().getCamera();
  const renderPassGaussianBlurH = createRenderPassGaussianBlur(
    renderPassMain,
    cameraComponentPostEffect,
    true
  );
  createAndSetFramebuffer(renderPassGaussianBlurH, resolution, 1, {});

  const renderPassGaussianBlurHV = createRenderPassGaussianBlur(
    renderPassGaussianBlurH,
    cameraComponentPostEffect,
    false
  );

  // prepare expressions
  const expressionMain = createExpression([renderPassMain]);
  const expressionPostEffect = createExpression([
    renderPassGaussianBlurH,
    renderPassGaussianBlurHV,
  ]);

  const expressions = [expressionMain, expressionPostEffect];

  // draw
  draw(expressions, true);

  // ---functions-----------------------------------------------------------------------------------------

  function loadRnModules(moduleNames: string[]) {
    const promises = [];
    const moduleManagerInstance = Rn.ModuleManager.getInstance();
    for (const moduleName of moduleNames) {
      promises.push(moduleManagerInstance.loadModule(moduleName));
    }
    return Promise.all(promises);
  }

  function createEntityMainCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();

    const transformCamera = entityCamera.getTransform();
    transformCamera.translate = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.setFovyAndChangeFocalLength(120);

    return entityCamera;
  }

  function createRenderPassMain(cameraComponent: Rn.CameraComponent) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;

    const entitySmallBoard = createEntityColoredBoard(
      Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
    );
    const transformSmallBoard = entitySmallBoard.getTransform();
    transformSmallBoard.scale = Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]);
    transformSmallBoard.translate = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.0]);
    transformSmallBoard.rotate = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

    const entityLargeBoard = createEntityColoredBoard(
      Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
    );
    const transformLargeBoard = entityLargeBoard.getTransform();
    transformLargeBoard.translate = Rn.Vector3.fromCopyArray([15, 30, -1.5]);
    transformLargeBoard.rotate = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

    renderPass.addEntities([entitySmallBoard, entityLargeBoard]);
    return renderPass;
  }

  function createEntityColoredBoard(boardColor: Rn.Vector4) {
    const primitive = new Rn.Plane();
    primitive.generate({
      width: 20,
      height: 20,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
    });
    primitive.material.setParameter(
      Rn.ShaderSemantics.DiffuseColorFactor,
      boardColor
    );

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createAndSetFramebuffer(
    renderPass: Rn.RenderPass,
    resolution: number,
    textureNum: number,
    property: {
      level?: number | undefined;
      internalFormat?: Rn.PixelFormatEnum | undefined;
      format?: Rn.PixelFormatEnum | undefined;
      type?: Rn.ComponentTypeEnum | undefined;
      magFilter?: Rn.TextureParameterEnum | undefined;
      minFilter?: Rn.TextureParameterEnum | undefined;
      wrapS?: Rn.TextureParameterEnum | undefined;
      wrapT?: Rn.TextureParameterEnum | undefined;
      createDepthBuffer?: boolean | undefined;
      isMSAA?: boolean | undefined;
    }
  ) {
    const framebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(
      resolution,
      resolution,
      textureNum,
      property
    );
    renderPass.setFramebuffer(framebuffer);
    return framebuffer;
  }

  function createEntityPostEffectCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();
    const cameraComponent = entityCamera.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;

    return entityCamera;
  }

  function createRenderPassGaussianBlur(
    renderPassBlurTarget: Rn.RenderPass,
    cameraComponent: Rn.CameraComponent,
    isHorizontal: boolean
  ) {
    const material = Rn.MaterialHelper.createGaussianBlurMaterial();

    const gaussianDistributionRatio =
      Rn.MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
        kernelSize: gaussianKernelSize,
        variance: gaussianVariance,
      });
    material.setParameter(
      Rn.GaussianBlurMaterialContent.GaussianKernelSize,
      gaussianKernelSize
    );
    material.setParameter(
      Rn.GaussianBlurMaterialContent.GaussianRatio,
      gaussianDistributionRatio
    );

    if (isHorizontal === false) {
      material.setParameter(Rn.GaussianBlurMaterialContent.IsHorizontal, false);
    }

    const framebufferTarget = renderPassBlurTarget.getFramebuffer();
    const TextureTarget = framebufferTarget
      .colorAttachments[0] as Rn.RenderTargetTexture;
    material.setTextureParameter(
      Rn.ShaderSemantics.BaseColorTexture,
      TextureTarget
    );

    const boardPrimitive = new Rn.Plane();
    boardPrimitive.generate({
      width: 1,
      height: 1,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material,
    });

    const boardMesh = new Rn.Mesh();
    boardMesh.addPrimitive(boardPrimitive);

    const boardEntity = Rn.EntityHelper.createMeshEntity();
    boardEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
      Math.PI / 2,
      0.0,
      0.0,
    ]);
    boardEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
      0.0, 0.0, -0.5,
    ]);
    const boardMeshComponent = boardEntity.getMesh();
    boardMeshComponent.setMesh(boardMesh);

    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = false;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([boardEntity]);

    return renderPass;
  }

  function createExpression(renderPasses: Rn.RenderPass[]) {
    const expression = new Rn.Expression();
    expression.addRenderPasses(renderPasses);
    return expression;
  }

  function draw(
    expressions: Rn.Expression[],
    isFirstLoop: Boolean,
    pElem?: HTMLElement
  ) {
    // for e2e-test
    if (pElem === undefined && !isFirstLoop) {
      pElem = document.createElement('p');
      pElem.setAttribute('id', 'rendered');
      pElem.innerText = 'Rendered.';
      document.body.appendChild(pElem);
    }

    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions, false, pElem));
  }
})();
