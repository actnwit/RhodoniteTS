import Rn from '../../../dist/esmdev/index.js';

export class PointShadowMap {
  private __shadowMomentFramebuffer: Rn.FrameBuffer;
  private __shadowMomentFrontMaterials: Rn.Material[] = [];
  private __shadowMomentBackMaterials: Rn.Material[] = [];

  constructor() {
    this.__shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [Rn.TextureFormat.RGBA16F],
      createDepthBuffer: true,
      depthTextureFormat: Rn.TextureFormat.Depth32F,
    });
    for (let i = 0; i < Rn.Config.shadowMapTextureArrayLength; i++) {
      const shadowMomentFrontMaterial =
        Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
      shadowMomentFrontMaterial.colorWriteMask = [true, true, false, false];
      this.__shadowMomentFrontMaterials.push(shadowMomentFrontMaterial);
      const shadowMomentBackMaterial =
        Rn.MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
      shadowMomentBackMaterial.colorWriteMask = [false, false, true, true];
      shadowMomentBackMaterial.setParameter('frontHemisphere', false);
      this.__shadowMomentBackMaterials.push(shadowMomentBackMaterial);
    }
  }

  public getRenderPasses(
    entities: Rn.ISceneGraphEntity[],
    lightEntity: Rn.ISceneGraphEntity & Rn.ILightEntityMethods
  ) {
    const lightComponentSid = lightEntity.getLight().componentSID;

    const shadowMomentFrontRenderPass = new Rn.RenderPass();
    shadowMomentFrontRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
    shadowMomentFrontRenderPass.toClearColorBuffer = true;
    shadowMomentFrontRenderPass.toClearDepthBuffer = true;
    shadowMomentFrontRenderPass.addEntities(entities);
    shadowMomentFrontRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentFrontRenderPass.setMaterial(this.__shadowMomentFrontMaterials[lightComponentSid]);
    this.__shadowMomentFrontMaterials[lightComponentSid].setParameter(
      'lightIndex',
      lightComponentSid
    );
    const shadowMomentBackRenderPass = new Rn.RenderPass();
    shadowMomentBackRenderPass.toClearColorBuffer = false;
    shadowMomentBackRenderPass.toClearDepthBuffer = true;
    shadowMomentBackRenderPass.addEntities(entities);
    shadowMomentBackRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentBackRenderPass.setMaterial(this.__shadowMomentBackMaterials[lightComponentSid]);
    this.__shadowMomentBackMaterials[lightComponentSid].setParameter(
      'lightIndex',
      lightComponentSid
    );

    return [shadowMomentFrontRenderPass, shadowMomentBackRenderPass];
  }

  public getShadowMomentFramebuffer() {
    return this.__shadowMomentFramebuffer;
  }
}
