import Rn from '../../../dist/esmdev/index.js';

export class PointShadowMap {
  private __shadowMomentFramebuffer: Rn.FrameBuffer;
  private __shadowMomentFrontMaterial: Rn.Material;
  private __shadowMomentBackMaterial: Rn.Material;
  private __engine: Rn.Engine;
  constructor(engine: Rn.Engine) {
    this.__engine = engine;
    this.__shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [Rn.TextureFormat.RGBA16F],
      createDepthBuffer: true,
      depthTextureFormat: Rn.TextureFormat.Depth32F,
    });

    this.__shadowMomentFrontMaterial = Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial(engine);
    this.__shadowMomentFrontMaterial.colorWriteMask = [true, true, false, false];

    this.__shadowMomentBackMaterial = Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial(engine);
    this.__shadowMomentBackMaterial.colorWriteMask = [false, false, true, true];
    this.__shadowMomentBackMaterial.setParameter('frontHemisphere', false);
  }

  public getRenderPasses(entities: Rn.ISceneGraphEntity[]) {
    const shadowMomentFrontRenderPass = new Rn.RenderPass(this.__engine);
    shadowMomentFrontRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
    shadowMomentFrontRenderPass.toClearColorBuffer = true;
    shadowMomentFrontRenderPass.toClearDepthBuffer = true;
    shadowMomentFrontRenderPass.addEntities(entities);
    shadowMomentFrontRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentFrontRenderPass.setMaterial(this.__shadowMomentFrontMaterial);

    const shadowMomentBackRenderPass = new Rn.RenderPass(this.__engine);
    shadowMomentBackRenderPass.toClearColorBuffer = false;
    shadowMomentBackRenderPass.toClearDepthBuffer = true;
    shadowMomentBackRenderPass.addEntities(entities);
    shadowMomentBackRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentBackRenderPass.setMaterial(this.__shadowMomentBackMaterial);

    return [shadowMomentFrontRenderPass, shadowMomentBackRenderPass];
  }

  public getShadowMomentFramebuffer() {
    return this.__shadowMomentFramebuffer;
  }
}
