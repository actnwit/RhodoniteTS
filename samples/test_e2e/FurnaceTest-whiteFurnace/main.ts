import Rn from '../../../dist/esm/index.js';

declare global {
  interface Window {
    entityBoard: Rn.IMeshEntity;
    entitySphere: Rn.IMeshEntity;
    material: Rn.Material;
    setRoughness: Function;
    setDebugView: Function;
    setGType: Function;
    setF0: Function;
    setDisableFresnel: Function;
    setClearColor: Function;
    setMode: Function;
  }
}

(async () => {
  // ---main algorithm-----------------------------------------------------------------------------------------

  // prepare memory
  const rnCanvasElement = document.getElementById('world') as HTMLCanvasElement;
  const gl = await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: rnCanvasElement,
  });

  // prepare renderPasses
  const cameraComponentMain = createEntityMainCamera().getCamera();
  const renderPassMain = createRenderPassMain(cameraComponentMain);

  // prepare expressions
  const expressionMain = createExpression([renderPassMain]);
  const expressions = [expressionMain];

  // draw
  draw(expressions, true);

  attachGlobalFunctions(gl, expressions);

  // ---functions-----------------------------------------------------------------------------------------

  function createEntityMainCamera() {
    const entityCamera = Rn.EntityHelper.createCameraEntity();

    const cameraComponent = entityCamera.getCamera();
    cameraComponent.type = Rn.CameraType.Orthographic;

    const transformComponent = entityCamera.getTransform();
    transformComponent.translate = Rn.Vector3.fromCopyArray([0.0, 0, 2.0]);

    return entityCamera;
  }

  function createRenderPassMain(cameraComponent: Rn.CameraComponent) {
    const material = Rn.MaterialHelper.createFurnaceTestMaterial();
    material.setParameter(
      Rn.ShaderSemantics.ScreenInfo,
      Rn.Vector2.fromCopyArray2([512, 512])
    );
    window.material = material;

    const entityBoard = createEntityBoard(material);
    const transformComponentBoard = entityBoard.getTransform();
    transformComponentBoard.rotate = Rn.Vector3.fromCopyArray([
      Math.PI / 2,
      0.0,
      0.0,
    ]);
    window.entityBoard = entityBoard;

    const entitySphere = createEntitySphere(material);
    const sceneGraphComponentSphere = entitySphere.getSceneGraph();
    sceneGraphComponentSphere.isVisible = false;
    window.entitySphere = entitySphere;

    const renderPass = new Rn.RenderPass();
    renderPass.toClearColorBuffer = true;
    renderPass.cameraComponent = cameraComponent;
    renderPass.addEntities([entityBoard, entitySphere]);
    return renderPass;
  }

  function createEntityBoard(material: Rn.Material) {
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
    return entity;
  }

  function createEntitySphere(material: Rn.Material) {
    const primitive = new Rn.Sphere();
    primitive.generate({
      radius: 1,
      widthSegments: 100,
      heightSegments: 100,
      material,
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

  function draw(expressions: Rn.Expression[], createPElem = false) {
    Rn.System.process(expressions);

    // for e2e-test
    if (createPElem) {
      const pElem = document.createElement('p');
      pElem.setAttribute('id', 'rendered');
      pElem.innerText = 'Rendered.';
      document.body.appendChild(pElem);
    }
  }

  function attachGlobalFunctions(
    gl: WebGLRenderingContext,
    expressions: Rn.Expression[]
  ) {
    window.setRoughness = setRoughness;
    window.setDebugView = setDebugView;
    window.setGType = setGType;
    window.setF0 = setF0;
    window.setDisableFresnel = setDisableFresnel;
    window.setClearColor = setClearColor;
    window.setMode = setMode;

    const material = window.material;

    const roughnessValue = Rn.MutableVector2.one();
    function setRoughness(floatValue: number) {
      roughnessValue.y = floatValue;
      material.setParameter(
        Rn.ShaderSemantics.MetallicRoughnessFactor,
        roughnessValue
      );
      draw(expressions);
    }

    function setDebugView(intValue: number) {
      material.setParameter(Rn.FurnaceTestMaterialContent.debugView, intValue);
      draw(expressions);
    }

    function setGType(intValue: number) {
      material.setParameter(Rn.FurnaceTestMaterialContent.g_type, intValue);
      draw(expressions);
    }

    function setF0(floatValue: number) {
      material.setParameter(Rn.FurnaceTestMaterialContent.f0, floatValue);
      draw(expressions);
    }

    function setDisableFresnel(intValue: number) {
      material.setParameter(
        Rn.FurnaceTestMaterialContent.disable_fresnel,
        intValue
      );
      draw(expressions);
    }

    function setClearColor(x, y, z) {
      gl.clearColor(x, y, z, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    function setMode(intValue: number) {
      material.setParameter(Rn.FurnaceTestMaterialContent.mode, intValue);
      if (intValue === 0) {
        window.entityBoard.getSceneGraph().isVisible = true;
        window.entitySphere.getSceneGraph().isVisible = false;
      } else {
        window.entityBoard.getSceneGraph().isVisible = false;
        window.entitySphere.getSceneGraph().isVisible = true;
      }
      draw(expressions);
    }
  }
})();
