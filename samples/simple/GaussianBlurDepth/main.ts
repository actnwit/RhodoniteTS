import Rn from '../../../dist/esm/index.js';

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const gaussianKernelSize = 15;
  const gaussianVariance = 8.0;

  const resolutionDepthCamera = 512;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: rnCanvasElement,
  });

  // prepare entities
  const entitySphere = createEntitySphereWithEmptyMaterial();
  const entityBoard = createEntityBoardWithEmptyMaterial();
  const entitiesRenderTarget = [entitySphere, entityBoard];

  // prepare cameras
  const cameraComponentDepth = createEntityDepthCamera().getCamera();
  const cameraComponentPostEffect = createEntityPostEffectCamera().getCamera();

  // prepare render passes
  const renderPassDepth = createRenderPassDepthEncode(
    cameraComponentDepth,
    entitiesRenderTarget
  );
  createAndSetFramebuffer(renderPassDepth, resolutionDepthCamera, 1);

  const renderPassDepthBlurH = createRenderPassGaussianBlurForDepth(
    cameraComponentPostEffect,
    renderPassDepth,
    true
  );
  createAndSetFramebuffer(renderPassDepthBlurH, resolutionDepthCamera, 1);

  const renderPassDepthBlurHV = createRenderPassGaussianBlurForDepth(
    cameraComponentPostEffect,
    renderPassDepthBlurH,
    false
  );

  const renderPassesDepth = [
    renderPassDepth,
    renderPassDepthBlurH,
    renderPassDepthBlurHV,
  ];

  // prepare expressions
  const expressionDepthBlur = createExpression(renderPassesDepth);
  const expressions = [expressionDepthBlur];

  // draw
  draw(expressions);

  // ---functions-----------------------------------------------------------------------------------------

  function createEntityDepthCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();
    const transformCamera = entityCamera.getTransform();
    transformCamera.translate = Rn.Vector3.fromCopyArray([10.0, 15.0, 20.0]);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.setFovyAndChangeFocalLength(120);
    cameraComponent.zFar = 50.0;

    return entityCamera;
  }

  function createEntityPostEffectCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;

    return entityCamera;
  }

  function createRenderPassDepthEncode(
    cameraComponent: Rn.CameraComponent,
    entitiesTarget: Rn.ISceneGraphEntity[]
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities(entitiesTarget);

    const material = Rn.MaterialHelper.createDepthEncodeMaterial();
    renderPass.setMaterial(material);
    return renderPass;
  }

  function createEntitySphereWithEmptyMaterial() {
    const primitive = new Rn.Sphere();
    primitive.generate({
      radius: 10,
      widthSegments: 20,
      heightSegments: 20,
      material: Rn.MaterialHelper.createEmptyMaterial(),
    });

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);

    const transform = entity.getTransform();
    transform.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
    transform.translate = Rn.Vector3.fromCopyArray([0.0, 0.0, 5.0]);
    transform.rotate = Rn.Vector3.fromCopyArray([0.0, 0.0, 0.0]);

    return entity;
  }

  function createEntityBoardWithEmptyMaterial() {
    const primitive = new Rn.Plane();
    primitive.generate({
      width: 20,
      height: 20,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper.createEmptyMaterial(),
    });

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);

    const transform = entity.getTransform();
    transform.scale = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
    transform.translate = Rn.Vector3.fromCopyArray([0.0, 0.0, -1.5]);
    transform.rotate = Rn.Vector3.fromCopyArray([Math.PI / 2, 0, 0]);

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
    } = {}
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

  function createRenderPassGaussianBlurForDepth(
    cameraComponent: Rn.CameraComponent,
    renderPassBlurTarget: Rn.RenderPass,
    isHorizontal: boolean
  ) {
    const material =
      Rn.MaterialHelper.createGaussianBlurForEncodedDepthMaterial();

    const gaussianDistributionRatio =
      Rn.MathUtil.computeGaussianDistributionRatioWhoseSumIsOne({
        kernelSize: gaussianKernelSize,
        variance: gaussianVariance,
      });
    material.setParameter(
      Rn.GaussianBlurForEncodedDepthMaterialContent.GaussianKernelSize,
      gaussianKernelSize
    );
    material.setParameter(
      Rn.GaussianBlurForEncodedDepthMaterialContent.GaussianRatio,
      gaussianDistributionRatio
    );

    if (isHorizontal === false) {
      material.setParameter(
        Rn.GaussianBlurForEncodedDepthMaterialContent.IsHorizontal,
        false
      );
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

  function draw(expressions: Rn.Expression[]) {
    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
