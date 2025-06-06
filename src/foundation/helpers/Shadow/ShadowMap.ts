import type { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { TextureFormat } from '../../definitions/TextureFormat';
import type { Material } from '../../materials/core/Material';
import { Vector4 } from '../../math/Vector4';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import type { ISceneGraphEntity } from '../EntityHelper';
import { MaterialHelper } from '../MaterialHelper';
import { RenderableHelper } from '../RenderableHelper';

/**
 * A shadow mapping utility class that handles the creation and management of shadow maps
 * using moment-based shadow mapping techniques. This class provides functionality to
 * generate shadow moment data by rendering scene entities from a light source perspective
 * and storing the depth information in a specialized framebuffer for later shadow calculations.
 *
 * The shadow map uses RG16F texture format to store depth moments, which allows for
 * better shadow quality and soft shadow effects compared to traditional shadow mapping.
 */
export class ShadowMap {
  private __shadowMomentFramebuffer: FrameBuffer;
  private __shadowMomentMaterial: Material;

  /**
   * Creates a new ShadowMap instance with initialized framebuffer and material for shadow mapping.
   * Sets up a 1024x1024 framebuffer with RG16F texture format for storing shadow moments
   * and creates a depth moment encode material for rendering shadows.
   */
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

  /**
   * Creates and returns render passes for shadow mapping from the perspective of a light source.
   * The render pass renders the provided entities using the light entity's camera view
   * to generate shadow moment data stored in the shadow framebuffer.
   *
   * @param entities - Array of scene graph entities to be rendered for shadow generation
   * @param lightEntity - Light entity that implements both light and camera functionality
   *                      used as the shadow map camera viewpoint
   * @returns Array containing a single render pass configured for shadow moment rendering
   */
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

  /**
   * Returns the framebuffer containing the rendered shadow moment data.
   * This framebuffer stores the depth moments in RG16F format and can be used
   * for shadow calculations in subsequent rendering passes.
   *
   * @returns The shadow moment framebuffer containing depth moment texture data
   */
  public getShadowMomentFramebuffer() {
    return this.__shadowMomentFramebuffer;
  }
}
