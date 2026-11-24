import type { ILightEntityMethods } from '../../components/Light/ILightEntity';
import { LightComponent } from '../../components/Light/LightComponent';
import type { Material } from '../../materials/core/Material';
import { Expression } from '../../renderer/Expression';
import type { FrameBuffer } from '../../renderer/FrameBuffer';
import type { RenderPass } from '../../renderer/RenderPass';
import type { Engine } from '../../system/Engine';
import { type ISceneGraphEntity } from '../EntityHelper';
/**
 * Provider of the raymarching (SDF) shadow caster passes.
 *
 * The pipeline owns the shadow caster materials (they are built from the merged SDF
 * graph) and supplies a buffer-less full-screen pass for each shadow map variant. The
 * ShadowSystem inserts these passes after the mesh caster passes of the same light, so
 * the moment map ends up with the nearest surface of the two.
 */
/**
 * Parameters of one SDF shadow caster pass request.
 */
export type RaymarchingShadowPassParams = {
    lightComponent: LightComponent;
    lightEntity: ISceneGraphEntity & ILightEntityMethods;
    framebuffer: FrameBuffer;
    kind: 'regular' | 'paraboloidFront' | 'paraboloidBack';
    /** The shadow slot of the light (index into the per-material parameter arrays). */
    shadowSlot: number;
    farPlane?: number;
};
export interface RaymarchingShadowPassProvider {
    /** Whether any raymarching component casts shadows. */
    hasCaster(): boolean;
    /** Creates the SDF caster pass(es) for one shadow map variant. */
    createPasses(params: RaymarchingShadowPassParams): RenderPass[];
    /** Updates the point light far plane of an existing per-slot caster material pair. */
    updatePointLightFarPlane?(shadowSlot: number, farPlane: number): void;
}
/**
 * A system for managing shadow mapping operations in the rendering pipeline.
 * Handles both directional/spot light shadows and point light shadows with Gaussian blur post-processing.
 */
export declare class ShadowSystem {
    private __engine;
    private __shadowMap;
    private __pointShadowMap;
    private __gaussianBlur;
    private __shadowMapArrayFramebuffer;
    private __pointShadowMapArrayFramebuffer;
    private __lightTypes;
    private __lightEnables;
    private __lightCastShadows;
    private __lightSids;
    private __isShadowSlotShortageWarned;
    /** Reused by setDepthBiasPV() on every frame. */
    private __depthBiasPVArray?;
    private __depthBiasPV?;
    /** Scratch buffer used to detect whether the bias matrices changed since the last frame. */
    private __depthBiasPVScratch?;
    /** Incremented whenever the content of the depth bias matrices changes. */
    private __depthBiasPVVersion;
    /** `__depthBiasPVVersion` last written to each material, indexed by material UID. */
    private __depthBiasPVVersionOfMaterials;
    private __lastTransformUpdateCountForAutoFit;
    private __lastEntityCountForAutoFit;
    private __lastRaymarchingComponentCountForAutoFit;
    private __lastRaymarchingAABBVersionForAutoFit;
    private __lastAutoFitBounds;
    private __needsRefresh;
    private __raymarchingShadowPassProvider?;
    private static __tmpLightSpaceBounds;
    /** Last shadow state, so a material assigned later (e.g. the raymarching material) can receive it. */
    private __depthTextureIndexList;
    /** Far plane of the paraboloid shadow map of each shadow slot (indexed by slot). */
    private __pointLightFarPlaneList;
    private __directionalShadowMap?;
    private __paraboloidShadowMap?;
    /**
     * Creates a new ShadowSystem instance with the specified shadow map resolution.
     * Initializes shadow map and point shadow map systems, along with framebuffers for texture arrays.
     * @param shadowMapSize - The resolution (width and height) of shadow maps in pixels
     */
    constructor(engine: Engine, shadowMapSize: number);
    /**
     * Generates rendering expressions for shadow mapping based on the provided entities and active lights.
     * Creates shadow map render passes for each shadow-casting light and applies Gaussian blur post-processing.
     * @param entities - Array of scene graph entities to be rendered for shadow mapping
     * @returns Array of Expression objects containing the shadow mapping render passes
     */
    getExpressions(entities: ISceneGraphEntity[], additionalMaterials?: readonly Material[], raymarchingShadowPassProvider?: RaymarchingShadowPassProvider): Expression[];
    /**
     * Assigns the shadow slots (the indices of the per-material shadow arrays) to the lights.
     *
     * A shadow casting light keeps the slot equal to its component SID when the SID is below
     * `Config.maxLightNumber` (the convention of manual shadow map setups), and the other shadow casting lights
     * use the free slots. Lights that do not cast shadows get no slot.
     *
     * @param lightComponents - The live light components
     * @param hasShadowCasters - Whether any entity is rendered to the shadow maps
     */
    private __assignShadowSlots;
    /**
     * Sets the blurred shadow map texture for directional and spot lights on all entity materials.
     * Creates a linear sampler and assigns the shadow map texture to the 'depthTexture' parameter.
     * @param blurredRenderTarget - The blurred shadow map render target texture
     * @param entities - Array of scene graph entities to apply the shadow map to
     * @private
     */
    private __setBlurredShadowMap;
    /**
     * Sets the blurred paraboloid shadow map texture for point lights on all entity materials.
     * Creates a linear sampler and assigns the shadow map texture to the 'paraboloidDepthTexture' parameter.
     * Also sets the UV scale parameter for point light shadow mapping.
     * @param blurredRenderTarget - The blurred paraboloid shadow map render target texture
     * @param entities - Array of scene graph entities to apply the shadow map to
     * @private
     */
    private __setParaboloidBlurredShadowMap;
    /**
     * Sets the depth texture index list parameter on all entity materials.
     * This parameter maps each light to its corresponding shadow map texture index.
     * @param entities - Array of scene graph entities to apply the index list to
     * @param depthTextureIndexList - Array of indices mapping lights to shadow map textures (-1 for no shadow)
     * @private
     */
    private __setDepthTextureIndexList;
    /**
     * Returns the far plane used to normalize the paraboloid shadow map of a point light.
     *
     * The priority is the explicit `pointLightShadowFarPlane`, the effective range of the
     * light, its automatic range, and finally the farthest shadow receiver in the scene.
     * A finite far plane keeps the cleared background depth close to the casters; with the
     * legacy unlimited far plane of 1000 the Gaussian blur mixes the far background into the
     * moments and the shadows of scenes much smaller than 1000 units disappear.
     *
     * @param lightComponent - The point light component
     * @param entities - The entities in the scene (used for the automatic far plane)
     */
    private __getPointLightFarPlane;
    /**
     * Returns a far plane that covers every shadow receiver of an unlimited point light.
     *
     * The farthest corner of the merged AABBs is used so that receivers at the far side of
     * an object are still inside the shadow map. Background assets and light gizmos are
     * ignored. When the scene has no receiver, the legacy value is kept.
     *
     * @param lightComponent - The point light component
     * @param entities - The entities in the scene
     * @private
     */
    private __getSceneFarPlaneForPointLight;
    /**
     * Updates the per-slot far planes of the point light shadow maps when they change.
     * Calling this every frame keeps the automatic far plane in sync with moving lights,
     * casters and receivers without rebuilding the shadow expressions.
     *
     * @param entities - The entities in the scene
     * @param additionalMaterials - Materials that are not reached through the entities
     *   (for example the raymarching material)
     */
    updatePointLightFarPlanes(entities: ISceneGraphEntity[], additionalMaterials?: readonly Material[]): void;
    /**
     * Sets the per-shadow-slot far planes of the paraboloid shadow maps on all entity materials.
     * @param entities - Array of scene graph entities to apply the far planes to
     * @param pointLightFarPlaneList - Far plane of each shadow slot (1000 for slots without a point light)
     * @private
     */
    private __setPointLightFarPlaneList;
    /**
     * Fits the zNear of the spot light shadow cameras to the scene.
     *
     * A perspective shadow map spends most of its depth range near the far plane, which makes
     * variance shadow maps shallow. Setting zNear below the nearest caster makes the depth
     * distribution more linear. The value is limited to 5% of the light range and to 1.0 so
     * that it stays conservative.
     *
     * @param entities - The entities in the scene
     * @private
     */
    private __updateSpotLightShadowZNear;
    private static __isLightEntity;
    /**
     * Sets the depth bias projection-view matrices for shadow mapping on all PBR materials.
     * Calculates and applies bias matrices for directional and spot lights to reduce shadow acne.
     * @param entities - Array of scene graph entities to apply the bias matrices to
     */
    setDepthBiasPV(entities: ISceneGraphEntity[], additionalMaterials?: readonly Material[]): void;
    /**
     * Applies the last computed shadow state (shadow maps, index list and bias matrices)
     * to materials that are assigned after getExpressions() ran, for example the
     * raymarching material of the buffer-less full-screen pass.
     */
    applyShadowParametersToMaterials(materials: readonly Material[]): void;
    /**
     * Background assets (tagged `type: background-assets`, e.g. the environment cube and the grid
     * in RhodoniteEditor2) do not cast shadows. The shadow volume auto-fit excludes them as well.
     */
    private static __isShadowCaster;
    private __autoFitDirectionalLightShadowVolume;
    /**
     * Resets the directional/spot shadow volume fitting cache, so the next frame recomputes
     * the volume (including the SDF bounds).
     */
    invalidateShadowVolumeFitting(): void;
    private __getRaymarchingComponentCount;
    /**
     * Merges the world AABBs of the visible raymarching components into `merged`.
     * The scene graph AABB of an SDF entity already contains the SDF bounds, so the cached
     * merged AABB is used instead of evaluating the graph again.
     */
    private __mergeRaymarchingShadowBounds;
    /**
     * Fits every directional light's orthographic shadow camera to `bounds`.
     *
     * The bounds are projected into the light's local space, and the ortho extents and the
     * depth range are taken from that AABB (not from the light-to-center distance). This
     * keeps the shadow map's world-per-texel small enough for the VSM blur not to wash out
     * the cast shadows, while still covering every caster and receiver.
     */
    private __applyAutoFitToDirectionalLights;
    /**
     * Checks if the light configuration has changed since the last update.
     * Compares the current light types, enable states, and shadow casting states with cached values.
     * Also returns true if a manual refresh was requested via setNeedsRefresh().
     * @returns True if any light has changed its type, enable state, or shadow casting state; false otherwise
     */
    isLightChanged(): boolean;
    /**
     * Requests a refresh of shadow expressions on the next frame.
     * This is useful when materials with shadow support have been changed or added.
     */
    setNeedsRefresh(): void;
}
