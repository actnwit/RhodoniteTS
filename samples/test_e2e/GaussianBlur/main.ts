import _Rn, {
  CameraComponent,
  ComponentTypeEnum,
  Expression,
  PixelFormatEnum,
  RenderPass,
  RenderTargetTexture,
  TextureParameterEnum,
  Vector4,
} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const gaussianKernelSize = 15;
  const gaussianVariance = 8.0;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // load modules
  await loadRnModules(['webgl', 'pbr']);

  // prepare memory
  const system = Rn.System.getInstance();
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.FastestWebGL1,
    rnCanvasElement
  );

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
    const entityCamera = generateEntity([
      Rn.TransformComponent,
      Rn.SceneGraphComponent,
      Rn.CameraComponent,
    ]);

    const transformCamera = entityCamera.getTransform();
    transformCamera.translate = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.setFovyAndChangeFocalLength(120);

    return entityCamera;
  }

  function createRenderPassMain(cameraComponent: CameraComponent) {
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

  function generateEntity(
    componentArray = [
      Rn.TransformComponent,
      Rn.SceneGraphComponent,
      Rn.MeshComponent,
      Rn.MeshRendererComponent,
    ] as Array<typeof Rn.Component>
  ) {
    const repo = Rn.EntityRepository.getInstance();
    const entity = repo.createEntity(componentArray);
    return entity;
  }

  function createEntityColoredBoard(boardColor: Vector4) {
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

    const entity = generateEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createAndSetFramebuffer(
    renderPass: RenderPass,
    resolution: number,
    textureNum: number,
    property: {
      level?: number | undefined;
      internalFormat?: PixelFormatEnum | undefined;
      format?: PixelFormatEnum | undefined;
      type?: ComponentTypeEnum | undefined;
      magFilter?: TextureParameterEnum | undefined;
      minFilter?: TextureParameterEnum | undefined;
      wrapS?: TextureParameterEnum | undefined;
      wrapT?: TextureParameterEnum | undefined;
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
    const entityCamera = generateEntity([
      Rn.TransformComponent,
      Rn.SceneGraphComponent,
      Rn.CameraComponent,
    ]);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;

    return entityCamera;
  }

  function createRenderPassGaussianBlur(
    renderPassBlurTarget: RenderPass,
    cameraComponent: CameraComponent,
    isHorizontal: boolean
  ) {
    const material = Rn.MaterialHelper.createGaussianBlurMaterial();

    const gaussianDistributionRatio = Rn.MathUtil.computeGaussianDistributionRatioWhoseSumIsOne(
      {
        kernelSize: gaussianKernelSize,
        variance: gaussianVariance,
      }
    );
    material.setParameter(
      Rn.GaussianBlurSingleMaterialNode.GaussianKernelSize,
      gaussianKernelSize
    );
    material.setParameter(
      Rn.GaussianBlurSingleMaterialNode.GaussianRatio,
      gaussianDistributionRatio
    );

    if (isHorizontal === false) {
      material.setParameter(
        Rn.GaussianBlurSingleMaterialNode.IsHorizontal,
        false
      );
    }

    const framebufferTarget = renderPassBlurTarget.getFramebuffer();
    const TextureTarget = framebufferTarget
      .colorAttachments[0] as RenderTargetTexture;
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

    const boardEntity = generateEntity();
    boardEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([Math.PI / 2, 0.0, 0.0]);
    boardEntity.getTransform().translate = Rn.Vector3.fromCopyArray([0.0, 0.0, -0.5]);
    const boardMeshComponent = boardEntity.getMesh();
    boardMeshComponent.setMesh(boardMesh);

    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = false;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([boardEntity]);

    return renderPass;
  }

  function createExpression(renderPasses: RenderPass[]) {
    const expression = new Rn.Expression();
    expression.addRenderPasses(renderPasses);
    return expression;
  }

  function draw(
    expressions: Expression[],
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

    system.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions, false, pElem));
  }
})();
