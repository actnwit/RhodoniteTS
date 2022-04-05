import {ISceneGraphEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
import _Rn, {
  CameraComponent,
  ComponentTypeEnum,
  Expression,
  MeshRendererComponent,
  PixelFormatEnum,
  RenderPass,
  TextureParameterEnum,
} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;

(async () => {
  // ---parameters---------------------------------------------------------------------------------------------

  const uriGltf =
    '../../../assets/gltf/glTF-Sample-Models/2.0/AntiqueCamera/glTF/AntiqueCamera.gltf';
  const basePathIBL = '../../../assets/ibl/shanghai_bund';

  const lightPosition = Rn.Vector3.fromCopyArray([-15.0, 50.0, 30.0]);

  const zFarDepth = 3000;

  const groundPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, 0.0]);
  const groundSize = Rn.Vector3.fromCopyArray([128, 128, 128]);
  const rootGroupScale = Rn.Vector3.fromCopyArray([4, 4, 4]);
  const resolutionDepthCamera = 1024;

  // ---main algorithm-----------------------------------------------------------------------------------------

  // load modules
  await loadRnModules(['webgl', 'pbr']);

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: rnCanvasElement,
  });

  // prepare cameras
  const entityCameraDepth = createEntityDepthCamera();
  const entityCameraMain = createEntityMainCamera();

  // prepare render passes
  const entityRootGroup = await createEntityGltf2(uriGltf);
  const renderPassesDepth = createRenderPassDepth(
    entityCameraDepth.getCamera(),
    entityRootGroup
  );

  const entityEnvironmentCube = createEntityEnvironmentCube(basePathIBL);
  const entityBoardCastedShadow = createEntityBoard(renderPassesDepth);

  const renderPassMain = new Rn.RenderPass();
  renderPassMain.cameraComponent = entityCameraMain.getCamera();
  renderPassMain.addEntities([
    entityEnvironmentCube,
    entityBoardCastedShadow,
    entityRootGroup,
  ]);

  // set target of camera controller
  const cameraControllerComponent = entityCameraMain.getCameraController();
  const controller = cameraControllerComponent.controller;
  controller.setTarget(entityRootGroup);

  // prepare expressions
  const expression = createExpression([renderPassesDepth, renderPassMain]);

  // set ibl textures
  setIBLTexture(basePathIBL);

  // draw
  draw([expression]);

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
    transformCamera.translate = lightPosition;

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.zNear = zFarDepth / 10000;
    cameraComponent.zFar = zFarDepth;

    const lightDirection = Rn.MutableVector3.multiply(
      lightPosition,
      -1.0
    ).normalize();
    cameraComponent.direction = lightDirection;

    return entityCamera;
  }

  function createEntityMainCamera() {
    const entityCamera = Rn.EntityHelper.createCameraControllerEntity();
    return entityCamera;
  }

  async function createEntityGltf2(uriGltf: string) {
    const importer = Rn.Gltf2Importer.getInstance();
    const gltf2JSON = await importer.import(uriGltf);
    const modelConverter = Rn.ModelConverter.getInstance();
    const entityRootGroup = modelConverter.convertToRhodoniteObject(gltf2JSON);

    const transformComponent = entityRootGroup.getTransform();
    transformComponent.scale = rootGroupScale;
    return entityRootGroup;
  }

  function createEntityEnvironmentCube(basePathIBL: string) {
    const cubeTextureEnvironment = new Rn.CubeTexture();
    cubeTextureEnvironment.baseUriToLoad =
      basePathIBL + '/environment/environment';
    cubeTextureEnvironment.isNamePosNeg = true;
    cubeTextureEnvironment.hdriFormat = Rn.HdriFormat.HDR_LINEAR;
    cubeTextureEnvironment.mipmapLevelNumber = 1;
    cubeTextureEnvironment.loadTextureImagesAsync();

    const materialSphere = Rn.MaterialHelper.createEnvConstantMaterial();
    materialSphere.setParameter(
      Rn.EnvConstantSingleMaterialNode.EnvHdriFormat,
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

  function createEntityBoard(renderPassDepth: RenderPass) {
    const material =
      Rn.MaterialHelper.createShadowMapDecodeClassicSingleMaterial(
        {},
        renderPassDepth
      );
    material.setParameter(
      Rn.ShaderSemantics.DiffuseColorFactor,
      Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.0])
    );
    material.setParameter(
      Rn.ShadowMapDecodeClassicSingleMaterialNode.ShadowColorFactor,
      Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.5])
    );
    material.alphaMode = Rn.AlphaMode.Translucent;

    const primitive = new Rn.Plane();
    primitive.generate({
      width: 20,
      height: 20,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material,
    });

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);

    const transform = entity.getTransform();
    transform.scale = groundSize;
    transform.translate = groundPosition;

    return entity;
  }

  function createRenderPassDepth(
    cameraComponentDepth: CameraComponent,
    entityRenderTarget: ISceneGraphEntity
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponentDepth;
    renderPass.addEntities([entityRenderTarget]);

    const material = Rn.MaterialHelper.createDepthEncodeMaterial();
    renderPass.setMaterial(material);

    createAndSetFramebuffer(renderPass, resolutionDepthCamera, 1);

    return renderPass;
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

  function createExpression(renderPasses: RenderPass[]) {
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

    const meshRendererComponents =
      Rn.ComponentRepository.getInstance().getComponentsWithType(
        Rn.MeshRendererComponent
      ) as MeshRendererComponent[];

    for (const meshRendererComponent of meshRendererComponents) {
      meshRendererComponent.specularCubeMap = cubeTextureSpecular;
      meshRendererComponent.diffuseCubeMap = cubeTextureDiffuse;
    }
  }

  function draw(expressions: Expression[]) {
    Rn.System.process(expressions);
    requestAnimationFrame(draw.bind(null, expressions));
  }
})();
