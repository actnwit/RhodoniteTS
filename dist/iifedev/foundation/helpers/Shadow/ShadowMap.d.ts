import type { ICameraEntityMethods } from '../../components/Camera/ICameraEntity';
import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { ISceneGraphEntity } from '../EntityHelper';
/**
 * A shadow mapping utility class that handles the creation and management of shadow maps
 * using moment-based shadow mapping techniques. This class provides functionality to
 * generate shadow moment data by rendering scene entities from a light source perspective
 * and storing the depth information in a specialized framebuffer for later shadow calculations.
 *
 * The shadow map uses RG16F texture format to store depth moments, which allows for
 * better shadow quality and soft shadow effects compared to traditional shadow mapping.
 */
export declare class ShadowMap {
    private __engine;
    private __shadowMomentFramebuffer;
    private __shadowMomentMaterial;
    /**
     * Creates a new ShadowMap instance with initialized framebuffer and material for shadow mapping.
     * Sets up a 1024x1024 framebuffer with RG16F texture format for storing shadow moments
     * and creates a depth moment encode material for rendering shadows.
     */
    constructor(engine: Engine);
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
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods): RenderPass[];
    /**
     * Returns the framebuffer containing the rendered shadow moment data.
     * This framebuffer stores the depth moments in RG16F format and can be used
     * for shadow calculations in subsequent rendering passes.
     *
     * @returns The shadow moment framebuffer containing depth moment texture data
     */
    getShadowMomentFramebuffer(): FrameBuffer;
}
