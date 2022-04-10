import {IMeshEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
import Rn from '../../../dist/esm/index';

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
  const cameraComponentMain = createEntityMainCamera().getCamera();

  // prepare render passes
  const renderPassesDepth = createRenderPassesDepth(
    cameraComponentDepth,
    cameraComponentPostEffect,
    entitiesRenderTarget,
    false
  );
  const renderPassesSquareDepth = createRenderPassesDepth(
    cameraComponentDepth,
    cameraComponentPostEffect,
    entitiesRenderTarget,
    true
  );

  const renderPassDepthBlurHV = renderPassesDepth[2];
  const renderPassSquareDepthBlurHV = renderPassesSquareDepth[2];
  const renderPassMain = createRenderPassMain(
    cameraComponentMain,
    entitySphere,
    entityBoard,
    cameraComponentDepth,
    renderPassDepthBlurHV,
    renderPassSquareDepthBlurHV
  );

  // prepare expressions
  const expressionDepthBlur = createExpression(renderPassesDepth);
  const expressionSquareDepthBlur = createExpression(renderPassesSquareDepth);
  const expressionMain = createExpression([renderPassMain]);

  const expressions = [
    expressionDepthBlur,
    expressionSquareDepthBlur,
    expressionMain,
  ];

  // draw
  draw(expressions, true);

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

  function createEntityMainCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();
    const transformCamera = entityCamera.getTransform();
    transformCamera.translate = Rn.Vector3.fromCopyArray([-0.1, -0.1, 10.0]);

    return entityCamera;
  }

  function createRenderPassesDepth(
    cameraComponentDepth: Rn.CameraComponent,
    cameraComponentPostEffect: Rn.CameraComponent,
    entitiesRenderTarget: IMeshEntity[],
    isSquareDepth: boolean
  ) {
    const renderPassDepth = createRenderPassDepthEncode(
      cameraComponentDepth,
      entitiesRenderTarget,
      isSquareDepth
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
    createAndSetFramebuffer(renderPassDepthBlurHV, resolutionDepthCamera, 1);

    return [renderPassDepth, renderPassDepthBlurH, renderPassDepthBlurHV];
  }

  function createRenderPassDepthEncode(
    cameraComponent: Rn.CameraComponent,
    entitiesTarget: IMeshEntity[],
    isSquareDepth: boolean
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities(entitiesTarget);

    const material = Rn.MaterialHelper.createDepthEncodeMaterial({
      depthPow: isSquareDepth ? 2.0 : 1.0,
    });
    renderPass.setMaterial(material);
    return renderPass;
  }

  function createRenderPassMain(
    cameraComponent: Rn.CameraComponent,
    entitySphere: IMeshEntity,
    entityBoard: IMeshEntity,
    cameraComponentDepth: Rn.CameraComponent,
    renderPassDepthBlurHV: Rn.RenderPass,
    renderPassSquareDepthBlurHV: Rn.RenderPass
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([entitySphere, entityBoard]);

    // set variance shadow material for sphere primitive in this render pass
    const materialSphere =
      Rn.MaterialHelper.createVarianceShadowMapDecodeClassicSingleMaterial(
        {depthCameraComponent: cameraComponentDepth},
        [renderPassDepthBlurHV, renderPassSquareDepthBlurHV]
      );
    materialSphere.setParameter(
      Rn.ShaderSemantics.DiffuseColorFactor,
      Rn.Vector4.fromCopyArray([0.5, 0.1, 0.4, 1])
    );
    materialSphere.setParameter(
      Rn.VarianceShadowMapDecodeClassicSingleMaterialNode.ShadowColor,
      Rn.Vector4.fromCopyArray([0.25, 0.05, 0.2, 1])
    );
    materialSphere.setParameter(
      Rn.VarianceShadowMapDecodeClassicSingleMaterialNode.MinimumVariance,
      Rn.Scalar.fromCopyNumber(0.01)
    );
    const primitiveSphere = entitySphere.getMesh().mesh.primitives[0];
    renderPass.setMaterialForPrimitive(materialSphere, primitiveSphere);

    // set variance shadow material for board primitive in this render pass
    const materialBoard =
      Rn.MaterialHelper.createVarianceShadowMapDecodeClassicSingleMaterial(
        {depthCameraComponent: cameraComponentDepth},
        [renderPassDepthBlurHV, renderPassSquareDepthBlurHV]
      );
    materialBoard.setParameter(
      Rn.ShaderSemantics.DiffuseColorFactor,
      Rn.Vector4.fromCopyArray([0.1, 0.7, 0.5, 1])
    );
    materialBoard.setParameter(
      Rn.VarianceShadowMapDecodeClassicSingleMaterialNode.ShadowColor,
      Rn.Vector4.fromCopyArray([0.05, 0.35, 0.25, 1])
    );
    materialBoard.setParameter(
      Rn.VarianceShadowMapDecodeClassicSingleMaterialNode.MinimumVariance,
      Rn.Scalar.fromCopyNumber(0.01)
    );
    const primitiveBoard = entityBoard.getMesh().mesh.primitives[0];
    renderPass.setMaterialForPrimitive(materialBoard, primitiveBoard);

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
