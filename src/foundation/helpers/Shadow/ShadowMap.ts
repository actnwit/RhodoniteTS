import { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { TextureFormat } from '../../definitions/TextureFormat';
import { Material } from '../../materials/core/Material';
import { Vector4 } from '../../math/Vector4';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import { ISceneGraphEntity } from '../EntityHelper';
import { MaterialHelper } from '../MaterialHelper';
import { RenderableHelper } from '../RenderableHelper';

export class ShadowMap {
  private __shadowMomentFramebuffer: FrameBuffer;
  private __shadowMomentMaterial: Material;

  constructor() {
    this.__shadowMomentFramebuffer = RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [TextureFormat.RG16F],
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F,
    });

    this.__shadowMomentMaterial = MaterialHelper.createDepthMomentEncodeMaterial();
  }

  public getRenderPasses(
    entities: ISceneGraphEntity[],
    lightEntity: ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods
  ) {
    const shadowMomentRenderPass = new RenderPass();
    shadowMomentRenderPass.clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
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
