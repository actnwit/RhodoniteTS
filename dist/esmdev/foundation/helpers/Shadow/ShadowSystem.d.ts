import { Expression } from '../../renderer/Expression';
import type { Engine } from '../../system/Engine';
import type { ISceneGraphEntity } from '../EntityHelper';
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
    private __lastAutoFitCenter;
    private __lastAutoFitRadius;
    private __needsRefresh;
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
    getExpressions(entities: ISceneGraphEntity[]): Expression[];
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
     * Sets the depth bias projection-view matrices for shadow mapping on all PBR materials.
     * Calculates and applies bias matrices for directional and spot lights to reduce shadow acne.
     * @param entities - Array of scene graph entities to apply the bias matrices to
     */
    setDepthBiasPV(entities: ISceneGraphEntity[]): void;
    /**
     * Background assets (tagged `type: background-assets`, e.g. the environment cube and the grid
     * in RhodoniteEditor2) do not cast shadows. The shadow volume auto-fit excludes them as well.
     */
    private static __isShadowCaster;
    private __autoFitDirectionalLightShadowVolume;
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
