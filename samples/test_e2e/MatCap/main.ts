import Rn from '../../../dist/esm/index.js';

(async () => {
  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: rnCanvasElement,
  });

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

  function createEntityMainCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();
    const transformCamera = entityCamera.getTransform();
    transformCamera.translate = Rn.Vector3.fromCopyArray([-0.1, -0.1, 10.0]);

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.setFovyAndChangeFocalLength(90);

    return entityCamera;
  }

  async function createRenderPassMain(cameraComponent: Rn.CameraComponent, uriMatCap: string) {
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
    entitySmallSphere.getTransform().scale = Rn.Vector3.fromCopyArray([0.2, 0.2, 0.2]);

    const entityLargeSphere = createEntityMatCapSphere(textureMatCap);
    entityLargeSphere.getTransform().translate = Rn.Vector3.fromCopyArray([15, 15, -20]);

    const entityBoard = createEntityMatCapBoard(textureMatCap);
    const transformBoard = entityBoard.getTransform();
    transformBoard.scale = Rn.Vector3.fromCopyArray([0.6, 0.6, 0.6]);
    transformBoard.rotate = Rn.Vector3.fromCopyArray([Math.PI / 2 + 0.3, 0.3, 0]);
    transformBoard.translate = Rn.Vector3.fromCopyArray([10, -10, -10]);

    renderPass.addEntities([entitySmallSphere, entityLargeSphere, entityBoard]);
    return renderPass;
  }

  function createEntityMatCapSphere(texture: Rn.Texture) {
    const primitive = new Rn.Sphere();
    primitive.generate({
      radius: 10,
      widthSegments: 20,
      heightSegments: 20,
      material: Rn.MaterialHelper.createMatCapMaterial({ texture }),
    });

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createEntityMatCapBoard(texture: Rn.Texture) {
    const primitive = new Rn.Plane();
    primitive.generate({
      width: 20,
      height: 20,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      material: Rn.MaterialHelper.createMatCapMaterial({ texture }),
    });

    const entity = Rn.EntityHelper.createMeshEntity();
    const meshComponent = entity.getMesh();
    const mesh = new Rn.Mesh();
    mesh.addPrimitive(primitive);
    meshComponent.setMesh(mesh);
    return entity;
  }

  function createExpression(renderPasses: Rn.RenderPass[]) {
    const expression = new Rn.Expression();
    expression.addRenderPasses(renderPasses);
    return expression;
  }

  function draw(expressions: Rn.Expression[], isFirstLoop: Boolean, pElem?: HTMLElement) {
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
