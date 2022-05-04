import Rn from '../../../dist/esm/';

describe('Frame Test', () => {
  beforeAll(() => {
    Rn.MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: 1,
      gpuInstanceData: 1,
      gpuVertexData: 1,
    });
  });

  test.skip('Frame', () => {
    const frame = new Rn.Frame();

    const expression0 = new Rn.Expression();
    const renderPass0_0 = new Rn.RenderPass();
    expression0.addRenderPasses([renderPass0_0]);
    const framebuffer_0 = Rn.RenderableHelper.createTexturesForRenderTarget(
      800,
      600,
      1,
      {}
    );
    renderPass0_0.setFramebuffer(framebuffer_0);

    const expression1 = new Rn.Expression();
    const planeEntity = Rn.EntityHelper.createMeshEntity();
    const planeMesh = new Rn.Mesh();
    const planePrimitive = new Rn.Plane();
    planeMesh.addPrimitive(planePrimitive);
    planeEntity.getMesh().setMesh(planeMesh);
    planePrimitive.generate({
      width: 2,
      height: 2,
      uSpan: 1,
      vSpan: 1,
      isUVRepeat: false,
      flipTextureCoordinateY: false,
    });
    planePrimitive.material.setTextureParameterAsPromise(
      Rn.ShaderSemantics.DiffuseColorTexture,
      frame.getColorAttachmentFromInputOf(expression1)
    );
    frame.addExpression(expression0);
    frame.addExpression(expression1, {
      inputRenderPasses: [renderPass0_0],
      outputs: [],
    });
    frame.resolve();
    const renderTargetTexture = planePrimitive.material.getTextureParameter(
      Rn.ShaderSemantics.DiffuseColorTexture
    );
    expect(framebuffer_0.getColorAttachedRenderTargetTexture(0)).toBe(
      renderTargetTexture
    );
  });
});
