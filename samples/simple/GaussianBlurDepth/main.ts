import {IGroupEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
import _Rn, {
  CameraComponent,
  ComponentTypeEnum,
  Expression,
  PixelFormatEnum,
  RenderPass,
  RenderTargetTexture,
  TextureParameterEnum,
} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const gaussianKernelSize = 15;
  const gaussianVariance = 8.0;

  const resolutionDepthCamera = 512;

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

  function loadRnModules(moduleNames: string[]) {
    const promises = [];
    const moduleManagerInstance = Rn.ModuleManager.getInstance();
    for (const moduleName of moduleNames) {
      promises.push(moduleManagerInstance.loadModule(moduleName));
    }
    return Promise.all(promises);
  }

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
    cameraComponent: CameraComponent,
    entitiesTarget: IGroupEntity[]
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
    cameraComponent: CameraComponent,
    renderPassBlurTarget: RenderPass,
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
      Rn.GaussianBlurForEncodedDepthSingleMaterialNode.GaussianKernelSize,
      gaussianKernelSize
    );
    material.setParameter(
      Rn.GaussianBlurForEncodedDepthSingleMaterialNode.GaussianRatio,
      gaussianDistributionRatio
    );

    if (isHorizontal === false) {
      material.setParameter(
        Rn.GaussianBlurForEncodedDepthSingleMaterialNode.IsHorizontal,
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

  function createExpression(renderPasses: RenderPass[]) {
    const expression = new Rn.Expression();
    expression.addRenderPasses(renderPasses);
    return expression;
  }

  function draw(expressions: Expression[]) {
    system.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
