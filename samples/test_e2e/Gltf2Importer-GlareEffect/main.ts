import Rn from '../../../dist/esm/index.mjs';

declare const window: any;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const uriGltf =
    '../../../assets/gltf/glTF-Sample-Models/2.0/BoomBoxWithAxes/glTF/BoomBoxWithAxes.gltf';
  const basePathIBL = '../../../assets/ibl/shanghai_bund';

  const gaussianBlurLevelHighLuminance = 3;
  const gaussianKernelSize = 5;
  const gaussianVariance = 3;
  const rootGroupScale = Rn.Vector3.fromCopyArray([50, 50, 50]);

  //  ratio of the final drawing ([original image, glare level 0, glare level 1, glare level 2])
  //  glare level N means the glare effect in size [2^(N-1) * original image size]
  const synthesizeCoefficient = [1.0, 1.0 / 5.0, 1.0 / 6.0, 1.0 / 10.0];
  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: rnCanvasElement,
  });

  // import gltf2
  const rootGroup = await createEntityGltf2(uriGltf);

  // prepare environment cube
  const entityEnvironmentCube = createEntityEnvironmentCube(basePathIBL);

  // prepare cameras
  const cameraComponentMain = createEntityMainCamera(rootGroup).getCamera();
  const cameraComponentPostEffect = createEntityPostEffectCamera().getCamera();

  // prepare renderPasses

  const renderPassLDR = await createRenderPassLDR(cameraComponentMain, [
    rootGroup,
    entityEnvironmentCube,
  ]);
  createAndSetFramebuffer(renderPassLDR, rnCanvasElement.width, 1, {});
  renderPassLDR.clearColor = Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 1.0]);

  const materialHighLuminance =
    Rn.MaterialHelper.createDetectHighLuminanceMaterial(
      {maxInstancesNumber: 1},
      renderPassLDR
    );
  const renderPassHighLuminance = createRenderPassPostEffect(
    materialHighLuminance,
    cameraComponentPostEffect
  );
  createAndSetFramebuffer(
    renderPassHighLuminance,
    rnCanvasElement.width,
    1,
    {}
  );

  const renderPassesBlurredHighLuminance =
    createRenderPassesBlurredHighLuminance(
      renderPassHighLuminance,
      cameraComponentPostEffect,
      rnCanvasElement.width
    );

  const renderPassesSynthesizeImages = createRenderPassesSynthesizeImages(
    cameraComponentMain,
    cameraComponentPostEffect,
    renderPassLDR,
    renderPassesBlurredHighLuminance
  );

  const renderPassSynthesizeGlare = renderPassesSynthesizeImages[1];
  const materialGamma = Rn.MaterialHelper.createGammaCorrectionMaterial();
  materialGamma.setTextureParameter(
    Rn.ShaderSemantics.BaseColorTexture,
    renderPassSynthesizeGlare.getFramebuffer()
      .colorAttachments[0] as Rn.RenderTargetTexture
  );

  const renderPassGamma = createRenderPassPostEffect(
    materialGamma,
    cameraComponentPostEffect
  );

  // prepare expressions
  const expressionDetectHighLuminance = createExpression([
    renderPassLDR,
    renderPassHighLuminance,
  ]);
  const expressionHighLuminance = createExpression(
    renderPassesBlurredHighLuminance
  );
  const expressionSynthesizeImages = createExpression(
    renderPassesSynthesizeImages
  );
  const expressionGamma = createExpression([renderPassGamma]);

  const expressions = [
    expressionDetectHighLuminance,
    expressionHighLuminance,
    expressionSynthesizeImages,
    expressionGamma,
  ];

  // set ibl textures
  setIBLTexture(basePathIBL);

  // draw
  draw(expressions, 0);

  // ---functions-----------------------------------------------------------------------------------------

  async function createEntityGltf2(uriGltf: string) {
    const gltf2JSON = (await Rn.Gltf2Importer.importFromUri(uriGltf, {
      defaultMaterialHelperArgumentArray: [{makeOutputSrgb: false}],
    })).unwrapForce();

    const rootGroup = Rn.ModelConverter.convertToRhodoniteObject(gltf2JSON);
    rootGroup.getTransform().scale = rootGroupScale;
    return rootGroup;
  }

  function createEntityEnvironmentCube(basePathIBL: string) {
    const cubeTextureEnvironment = new Rn.CubeTexture();
    cubeTextureEnvironment.baseUriToLoad =
      basePathIBL + '/environment/environment';
    cubeTextureEnvironment.isNamePosNeg = true;
    cubeTextureEnvironment.hdriFormat = Rn.HdriFormat.HDR_LINEAR;
    cubeTextureEnvironment.mipmapLevelNumber = 1;
    cubeTextureEnvironment.loadTextureImagesAsync();

    const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial({
      makeOutputSrgb: false,
    });
    materialSphere.setParameter(
      Rn.ShaderSemantics.EnvHdriFormat,
      Rn.HdriFormat.HDR_LINEAR.index
    );
    materialSphere.setTextureParameter(
      Rn.ShaderSemantics.ColorEnvTexture,
      cubeTextureEnvironment
    );

    const primitiveSphere = new Rn.Sphere();
    primitiveSphere.generate({
      radius: 2500,
      widthSegments: 40,
      heightSegments: 40,
      material: materialSphere,
    });
    const meshSphere = new Rn.Mesh();
    meshSphere.addPrimitive(primitiveSphere);

    const entitySphere = Rn.EntityHelper.createMeshEntity();
    const meshComponentSphere = entitySphere.getMesh();
    meshComponentSphere.setMesh(meshSphere);

    entitySphere.getTransform().scale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
    entitySphere.getTransform().translate = Rn.Vector3.fromCopyArray([
      0, 300, 0,
    ]);

    return entitySphere;
  }

  function createEntityMainCamera(entityCameraTarget: Rn.ISceneGraphEntity) {
    const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
    const cameraControllerComponent = entityCamera.getCameraController();
    const controller = cameraControllerComponent.controller;
    controller.setTarget(entityCameraTarget);

    return entityCamera as Rn.ICameraEntity;
  }

  function createEntityPostEffectCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();
    const cameraComponent = entityCamera.getCamera();
    cameraComponent.zNearInner = 0.5;
    cameraComponent.zFarInner = 2.0;

    return entityCamera as Rn.ICameraEntity;
  }

  async function createRenderPassLDR(
    cameraComponent: Rn.CameraComponent,
    entityRenderTargets: Rn.ISceneGraphEntity[]
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities(entityRenderTargets);
    return renderPass;
  }

  function createRenderPassPostEffect(
    material: Rn.Material,
    cameraComponent: Rn.CameraComponent
  ) {
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

  function createRenderPassesBlurredHighLuminance(
    renderPassHighLuminance: Rn.RenderPass,
    cameraComponentPostEffect: Rn.CameraComponent,
    maxResolution: number
  ) {
    const renderPasses: Rn.RenderPass[] = [];

    for (let i = 0; i < gaussianBlurLevelHighLuminance; i++) {
      const resolutionBlur = maxResolution / Math.pow(2.0, i);

      let renderPassBlurH;
      if (i === 0) {
        renderPassBlurH = createRenderPassGaussianBlur(
          renderPassHighLuminance,
          true,
          resolutionBlur
        );
      } else {
        renderPassBlurH = createRenderPassGaussianBlur(
          renderPasses[renderPasses.length - 1],
          true,
          resolutionBlur
        );

        setParameterForAllMaterialsInMeshComponents(
          renderPassBlurH.meshComponents,
          Rn.ShaderSemantics.FramebufferWidth,
          resolutionBlur
        );

        // need to draw the full viewport size
        renderPassBlurH.setViewport(
          Rn.Vector4.fromCopyArray([0, 0, resolutionBlur, resolutionBlur])
        );
      }
      renderPassBlurH.cameraComponent = cameraComponentPostEffect;

      const renderPassBlurHV = createRenderPassGaussianBlur(
        renderPassBlurH,
        false,
        resolutionBlur
      );
      renderPassBlurHV.cameraComponent = cameraComponentPostEffect;

      renderPasses.push(renderPassBlurH, renderPassBlurHV);
    }

    return renderPasses;
  }

  function createRenderPassesSynthesizeImages(
    cameraComponentMain: Rn.CameraComponent,
    cameraComponentPostEffect: Rn.CameraComponent,
    renderPassLDR: Rn.RenderPass,
    renderPassesBlurredHighLuminance: Rn.RenderPass[]
  ) {
    // the target of glare is non-white (color is not vec4(1.0)) region
    // you can choose any material that satisfy the above condition
    const materialGlareTarget = Rn.MaterialHelper.createDepthEncodeMaterial();
    const renderPassGlareTarget = createRenderPassGlareTargetRegion(
      materialGlareTarget,
      cameraComponentMain,
      rootGroup
    );
    createAndSetFramebuffer(
      renderPassGlareTarget,
      rnCanvasElement.width,
      1,
      {}
    );

    const texturesSynthesize = [
      renderPassLDR.getFramebuffer().colorAttachments[0],
    ] as Rn.RenderTargetTexture[];
    for (let i = 1; i < renderPassesBlurredHighLuminance.length; i += 2) {
      texturesSynthesize.push(
        renderPassesBlurredHighLuminance[i].getFramebuffer()
          .colorAttachments[0] as Rn.RenderTargetTexture
      );
    }

    const materialSynthesizeTextures =
      Rn.MaterialHelper.createSynthesizeHDRMaterial(
        {
          targetRegionTexture: renderPassGlareTarget.getFramebuffer()
            .colorAttachments[0] as Rn.RenderTargetTexture,
          maxInstancesNumber: 1,
        },
        texturesSynthesize
      );
    materialSynthesizeTextures.setParameter(
      Rn.SynthesizeHdrMaterialContent.SynthesizeCoefficient,
      synthesizeCoefficient
    );
    const renderPassSynthesizeGlare = createRenderPassPostEffect(
      materialSynthesizeTextures,
      cameraComponentPostEffect
    );
    createAndSetFramebuffer(
      renderPassSynthesizeGlare,
      rnCanvasElement.width,
      1,
      {}
    );

    return [renderPassGlareTarget, renderPassSynthesizeGlare];
  }

  function createRenderPassGaussianBlur(
    renderPassBlurTarget: Rn.RenderPass,
    isHorizontal: boolean,
    resolutionBlur: number
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

    const renderPass = createRenderPassPostEffect(
      material,
      cameraComponentPostEffect
    );
    createAndSetFramebuffer(renderPass, resolutionBlur, 1, {});

    return renderPass;
  }

  function setParameterForAllMaterialsInMeshComponents(
    meshComponents: Rn.MeshComponent[],
    shaderSemantic: Rn.ShaderSemanticsEnum,
    value: any
  ) {
    for (let i = 0; i < meshComponents.length; i++) {
      const mesh = meshComponents[i].mesh;
      const primitiveNumber = mesh.getPrimitiveNumber();

      for (let j = 0; j < primitiveNumber; j++) {
        const primitive = mesh.getPrimitiveAt(j);
        primitive.material.setParameter(shaderSemantic, value);
      }
    }
  }

  function createRenderPassGlareTargetRegion(
    material: Rn.Material,
    cameraComponent: Rn.CameraComponent,
    entityGlareTarget: Rn.ISceneGraphEntity
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.clearColor = Rn.Vector4.fromCopyArray([1.0, 1.0, 1.0, 1.0]);
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([entityGlareTarget]);
    renderPass.setMaterial(material);
    return renderPass;
  }

  function createExpression(renderPasses: Rn.RenderPass[]) {
    const expression = new Rn.Expression();
    expression.addRenderPasses(renderPasses);
    return expression;
  }

  function setIBLTexture(basePathIBL: string) {
    const cubeTextureSpecular = new Rn.CubeTexture();
    cubeTextureSpecular.baseUriToLoad = basePathIBL + '/specular/specular';
    cubeTextureSpecular.isNamePosNeg = true;
    cubeTextureSpecular.hdriFormat = Rn.HdriFormat.RGBE_PNG;
    cubeTextureSpecular.mipmapLevelNumber = 10;

    const cubeTextureDiffuse = new Rn.CubeTexture();
    cubeTextureDiffuse.baseUriToLoad = basePathIBL + '/diffuse/diffuse';
    cubeTextureDiffuse.hdriFormat = Rn.HdriFormat.RGBE_PNG;
    cubeTextureDiffuse.mipmapLevelNumber = 1;
    cubeTextureDiffuse.isNamePosNeg = true;

    const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
      Rn.MeshRendererComponent
    ) as Rn.MeshRendererComponent[];

    for (const meshRendererComponent of meshRendererComponents) {
      meshRendererComponent.specularCubeMap = cubeTextureSpecular;
      meshRendererComponent.diffuseCubeMap = cubeTextureDiffuse;
    }
  }

  function draw(
    expressions: Rn.Expression[],
    loopCount: number,
    pElem?: HTMLElement
  ) {
    // for e2e-test
    if (pElem === undefined && loopCount > 50) {
      pElem = document.createElement('p');
      pElem.setAttribute('id', 'rendered');
      pElem.innerText = 'Rendered.';
      document.body.appendChild(pElem);
    }

    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions, loopCount + 1, pElem));
  }
})();
