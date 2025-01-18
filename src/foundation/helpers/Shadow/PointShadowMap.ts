import { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { Config } from '../../core/Config';
import { TextureFormat } from '../../definitions/TextureFormat';
import { Material } from '../../materials/core/Material';
import { Vector4 } from '../../math/Vector4';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import { ISceneGraphEntity } from '../EntityHelper';
import { MaterialHelper } from '../MaterialHelper';
import { RenderableHelper } from '../RenderableHelper';

export class PointShadowMap {
  private __shadowMomentFramebuffer: FrameBuffer;
  private __shadowMomentFrontMaterials: Material[] = [];
  private __shadowMomentBackMaterials: Material[] = [];

  constructor() {
    this.__shadowMomentFramebuffer = RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [TextureFormat.RGBA16F],
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F,
    });
    for (let i = 0; i < Config.shadowMapTextureArrayLength; i++) {
      const shadowMomentFrontMaterial = MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
      shadowMomentFrontMaterial.colorWriteMask = [true, true, false, false];
      this.__shadowMomentFrontMaterials.push(shadowMomentFrontMaterial);
      const shadowMomentBackMaterial = MaterialHelper.createParaboloidDepthMomentEncodeMaterial();
      shadowMomentBackMaterial.colorWriteMask = [false, false, true, true];
      shadowMomentBackMaterial.setParameter('frontHemisphere', false);
      this.__shadowMomentBackMaterials.push(shadowMomentBackMaterial);
    }
  }

  public getRenderPasses(
    entities: ISceneGraphEntity[],
    lightEntity: ISceneGraphEntity & ILightEntityMethods
  ) {
    const lightComponentSid = lightEntity.getLight().componentSID;

    const shadowMomentFrontRenderPass = new RenderPass();
    shadowMomentFrontRenderPass.clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
    shadowMomentFrontRenderPass.toClearColorBuffer = true;
    shadowMomentFrontRenderPass.toClearDepthBuffer = true;
    shadowMomentFrontRenderPass.addEntities(entities);
    shadowMomentFrontRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentFrontRenderPass.setMaterial(this.__shadowMomentFrontMaterials[lightComponentSid]);
    this.__shadowMomentFrontMaterials[lightComponentSid].setParameter(
      'lightIndex',
      lightComponentSid
    );
    const shadowMomentBackRenderPass = new RenderPass();
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
