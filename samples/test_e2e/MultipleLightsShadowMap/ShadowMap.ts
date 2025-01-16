import Rn from '../../../dist/esmdev/index.js';

export class ShadowMap {
  private __shadowMomentFramebuffer: Rn.FrameBuffer;
  private __shadowMomentMaterial: Rn.Material;

  constructor() {
    this.__shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [Rn.TextureFormat.RG16F],
      createDepthBuffer: true,
      depthTextureFormat: Rn.TextureFormat.Depth32F,
    });

    this.__shadowMomentMaterial = Rn.MaterialHelper.createDepthMomentEncodeMaterial();
  }

  public getRenderPasses(
    entities: Rn.ISceneGraphEntity[],
    lightEntity: Rn.ISceneGraphEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods
  ) {
    const shadowMomentRenderPass = new Rn.RenderPass();
    shadowMomentRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
    shadowMomentRenderPass.toClearColorBuffer = true;
    shadowMomentRenderPass.toClearDepthBuffer = true;
    shadowMomentRenderPass.cameraComponent = lightEntity.getCamera();
    shadowMomentRenderPass.addEntities(entities);
    shadowMomentRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentRenderPass.setMaterial(this.__shadowMomentMaterial);

    return [shadowMomentRenderPass];
  }

  public getShadowMomentFramebuffer() {
    return this.__shadowMomentFramebuffer;
  }
}
