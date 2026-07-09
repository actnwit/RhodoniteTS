import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import type { ISceneGraphEntity } from '../EntityHelper';
/**
 * A helper class for managing point light shadow mapping using paraboloid depth moment encoding.
 * This class handles the creation and management of shadow map framebuffers and materials
 * for omnidirectional shadow mapping from point lights.
 */
export declare class PointShadowMap {
    private __engine;
    private __shadowMomentFramebuffer;
    private __shadowMomentFrontMaterials;
    private __shadowMomentBackMaterials;
    /**
     * Creates a new PointShadowMap instance.
     * Initializes the shadow moment framebuffer and creates materials for front and back hemisphere rendering.
     * The framebuffer uses RGBA16F format for storing depth moments and a 32-bit depth buffer.
     */
    constructor(engine: Engine);
    /**
     * Generates render passes for creating shadow maps from a point light source.
     * Creates two render passes: one for the front hemisphere and one for the back hemisphere
     * of the paraboloid shadow mapping technique.
     *
     * @param entities - Array of scene graph entities to be rendered for shadow map generation
     * @param lightEntity - The point light entity that casts shadows
     * @returns An array containing two render passes: [frontRenderPass, backRenderPass]
     */
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods): RenderPass[];
    /**
     * Gets the framebuffer used for storing shadow moment data.
     * This framebuffer contains the encoded depth moments for variance shadow mapping.
     *
     * @returns The shadow moment framebuffer containing RGBA16F texture for depth moments
     */
    getShadowMomentFramebuffer(): FrameBuffer;
}
