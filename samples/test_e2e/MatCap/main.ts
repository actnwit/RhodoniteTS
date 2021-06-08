import _Rn, {
  CameraComponent,
  Expression,
  RenderPass,
  Texture,
} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;

(async () => {
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
  const renderPassMain = await createRenderPassMain(
    cameraComponentMain,
    './../../../assets/images/matcap/matcap.png'
  );

  // prepare expressions
  const expressionMain = createExpression([renderPassMain]);
  const expressions = [expressionMain];

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
    transformCamera.translate = new Rn.Vector3(-0.1, -0.1, 10.0);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.setFovyAndChangeFocalLength(90);

    return entityCamera;
  }

  async function createRenderPassMain(
    cameraComponent: CameraComponent,
    uriMatCap: string
  ) {
    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;

    const textureMatCap = new Rn.Texture();
    await textureMatCap.generateTextureFromUri(uriMatCap, {
      minFilter: Rn.TextureParameter.Nearest,
      magFilter: Rn.TextureParameter.Nearest,
      wrapS: Rn.TextureParameter.ClampToEdge,
      wrapT: Rn.TextureParameter.ClampToEdge,
      type: Rn.ComponentType.UnsignedByte,
      anisotropy: false,
    });

    const entitySmallSphere = createEntityMatCapSphere(textureMatCap);
    entitySmallSphere.getTransform().scale = new Rn.Vector3(0.2, 0.2, 0.2);

    const entityLargeSphere = createEntityMatCapSphere(textureMatCap);
    entityLargeSphere.getTransform().translate = new Rn.Vector3(15, 15, -20);

    const entityBoard = createEntityMatCapBoard(textureMatCap);
    const transformBoard = entityBoard.getTransform();
    transformBoard.scale = new Rn.Vector3(0.6, 0.6, 0.6);
    transformBoard.rotate = new Rn.Vector3(Math.PI / 2 + 0.3, 0.3, 0);
    transformBoard.translate = new Rn.Vector3(10, -10, -10);

    renderPass.addEntities([entitySmallSphere, entityLargeSphere, entityBoard]);
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

  function createEntityMatCapSphere(texture: Texture) {
    const primitive = new Rn.Sphere();
    primitive.generate({
      radius: 10,
      widthSegments: 20,
      heightSegments: 20,
      material: Rn.MaterialHelper.createMatCapMaterial({texture}),
    });

    const entity = generateEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createEntityMatCapBoard(texture: Texture) {
    const primitive = new Rn.Plane();
    primitive.generate({
      width: 20,
      height: 20,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper.createMatCapMaterial({texture}),
    });

    const entity = generateEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
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
