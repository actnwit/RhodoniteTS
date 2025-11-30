import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { Config } from '../../core/Config';
import { TextureFormat } from '../../definitions/TextureFormat';
import type { Material } from '../../materials/core/Material';
import { Vector4 } from '../../math/Vector4';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { ISceneGraphEntity } from '../EntityHelper';
import { MaterialHelper } from '../MaterialHelper';
import { RenderableHelper } from '../RenderableHelper';

/**
 * A helper class for managing point light shadow mapping using paraboloid depth moment encoding.
 * This class handles the creation and management of shadow map framebuffers and materials
 * for omnidirectional shadow mapping from point lights.
 */
export class PointShadowMap {
  private __engine: Engine;
  private __shadowMomentFramebuffer: FrameBuffer;
  private __shadowMomentFrontMaterials: Material[] = [];
  private __shadowMomentBackMaterials: Material[] = [];

  /**
   * Creates a new PointShadowMap instance.
   * Initializes the shadow moment framebuffer and creates materials for front and back hemisphere rendering.
   * The framebuffer uses RGBA16F format for storing depth moments and a 32-bit depth buffer.
   */
  constructor(engine: Engine) {
    this.__engine = engine;
    this.__shadowMomentFramebuffer = RenderableHelper.createFrameBuffer({
      width: 1024,
      height: 1024,
      textureNum: 1,
      textureFormats: [TextureFormat.RGBA16F],
      createDepthBuffer: true,
      depthTextureFormat: TextureFormat.Depth32F,
    });
    for (let i = 0; i < Config.maxLightNumber; i++) {
      const shadowMomentFrontMaterial = MaterialHelper.createParaboloidDepthMomentEncodeMaterial(engine);
      shadowMomentFrontMaterial.colorWriteMask = [true, true, false, false];
      this.__shadowMomentFrontMaterials.push(shadowMomentFrontMaterial);
      const shadowMomentBackMaterial = MaterialHelper.createParaboloidDepthMomentEncodeMaterial(engine);
      shadowMomentBackMaterial.colorWriteMask = [false, false, true, true];
      shadowMomentBackMaterial.setParameter('frontHemisphere', false);
      this.__shadowMomentBackMaterials.push(shadowMomentBackMaterial);
    }
  }

  /**
   * Generates render passes for creating shadow maps from a point light source.
   * Creates two render passes: one for the front hemisphere and one for the back hemisphere
   * of the paraboloid shadow mapping technique.
   *
   * @param entities - Array of scene graph entities to be rendered for shadow map generation
   * @param lightEntity - The point light entity that casts shadows
   * @returns An array containing two render passes: [frontRenderPass, backRenderPass]
   */
  public getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods) {
    const lightComponentSid = lightEntity.getLight().componentSID;

    const shadowMomentFrontRenderPass = new RenderPass(lightEntity.engine);
    shadowMomentFrontRenderPass.clearColor = Vector4.fromCopyArray([1, 1, 1, 1]);
    shadowMomentFrontRenderPass.toClearColorBuffer = true;
    shadowMomentFrontRenderPass.toClearDepthBuffer = true;
    shadowMomentFrontRenderPass.addEntities(entities);
    shadowMomentFrontRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentFrontRenderPass.setMaterial(this.__shadowMomentFrontMaterials[lightComponentSid]);
    this.__shadowMomentFrontMaterials[lightComponentSid].setParameter('lightIndex', lightComponentSid);
    const shadowMomentBackRenderPass = new RenderPass(lightEntity.engine);
    shadowMomentBackRenderPass.toClearColorBuffer = false;
    shadowMomentBackRenderPass.toClearDepthBuffer = true;
    shadowMomentBackRenderPass.addEntities(entities);
    shadowMomentBackRenderPass.setFramebuffer(this.__shadowMomentFramebuffer);
    shadowMomentBackRenderPass.setMaterial(this.__shadowMomentBackMaterials[lightComponentSid]);
    this.__shadowMomentBackMaterials[lightComponentSid].setParameter('lightIndex', lightComponentSid);

    return [shadowMomentFrontRenderPass, shadowMomentBackRenderPass];
  }

  /**
   * Gets the framebuffer used for storing shadow moment data.
   * This framebuffer contains the encoded depth moments for variance shadow mapping.
   *
   * @returns The shadow moment framebuffer containing RGBA16F texture for depth moments
   */
  public getShadowMomentFramebuffer() {
    return this.__shadowMomentFramebuffer;
  }
}
