import type { Size } from '../../../types';
import { RaymarchingComponent } from '../../components/Raymarching/RaymarchingComponent';
import { RnObject } from '../../core/RnObject';
import { type ToneMappingTypeEnum } from '../../definitions';
import type { Material } from '../../materials/core/Material';
import { Err, Ok } from '../../misc/Result';
import type { Engine } from '../../system/Engine';
import type { CubeTexture } from '../../textures/CubeTexture';
import { Expression } from '../Expression';
import { Frame } from '../Frame';
/**
 * A forward rendering pipeline that provides advanced rendering features including shadows, bloom, tone mapping, and IBL.
 *
 * @remarks
 * ForwardRenderPipeline is a comprehensive rendering solution that handles multi-pass rendering setups
 * with features like MSAA, shadow mapping, bloom effects, and tone mapping. It supports both regular
 * rendering and WebXR multi-view rendering for VR applications.
 *
 * The pipeline automatically manages frame buffers, render targets, and expression chains to provide
 * a complete rendering solution similar to Unity's Universal Render Pipeline (URP).
 *
 * @example
 * ```typescript
 * const expressions = [...];
 * const matrix = [...];
 *
 * // Create and setup the render pipeline
 * const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
 * await forwardRenderPipeline.setup(1024, 1024, {isShadow: true, isBloom: true});
 *
 * // Configure expressions and IBL
 * forwardRenderPipeline.setExpressions(expressions);
 *
 * const diffuseCubeTexture = new Rn.CubeTexture();
 * diffuseCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/diffuse/diffuse';
 * diffuseCubeTexture.isNamePosNeg = true;
 * diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * diffuseCubeTexture.mipmapLevelNumber = 1;
 *
 * const specularCubeTexture = new Rn.CubeTexture();
 * specularCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/specular/specular';
 * specularCubeTexture.isNamePosNeg = true;
 * specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * specularCubeTexture.mipmapLevelNumber = 10;
 *
 * forwardRenderPipeline.setIBLTextures(diffuseCubeTexture, specularCubeTexture);
 *
 * // Start the render loop
 * forwardRenderPipeline.startRenderLoop((frame) => {
 *   Rn.Engine.process(frame);
 * });
 * ```
 */
export declare class ForwardRenderPipeline extends RnObject {
    private __width;
    private __height;
    private __isShadow;
    private __isBloom;
    private __isSimple;
    private __shadowMapSize;
    private __frame?;
    private __frameBufferMultiView?;
    private __frameBufferMultiViewBlit?;
    private __frameBufferMultiViewBlitBackBuffer?;
    private __frameBufferMsaa?;
    private __frameBufferResolve?;
    private __frameBufferResolveForReference?;
    private __initialExpression?;
    /** main expressions */
    private __expressions;
    private __gizmoExpression;
    private __generateMipmapsExpression?;
    private __multiViewBlitBackBufferExpression?;
    private __multiViewBlitExpression?;
    private __bloomExpression?;
    private __toneMappingExpression?;
    private __toneMappingMaterial?;
    private __transparentOnlyExpressions;
    private __webXRSystem?;
    private __drawFunc?;
    private __diffuseCubeTexture?;
    private __specularCubeTexture?;
    private __sheenCubeTexture?;
    private __iblRotation;
    private __diffuseIblContribution;
    private __specularIblContribution;
    private __raymarchingIblStates;
    private __samplerForBackBuffer?;
    /** Per-component raymarching materials and their buffer-less full-screen passes. */
    private __raymarchingComponentMaterials;
    private __raymarchingComponentPasses;
    /** SID of the first per-component pass (it applies the per-frame shared material setup). */
    private __raymarchingFirstComponentPassSID;
    /** Cached world AABBs of the SDFs, used for ray interval clipping and scissors. */
    private __raymarchingAabbCache;
    private __toneMappingType;
    private __bloomHelper;
    private __shadowSystem?;
    private __shadowExpressions;
    private __entitiesForShadow;
    private __raymarchingExpression?;
    private __raymarchingRenderPass?;
    /** The merged SDF graph of the shadow-casting components. */
    private __raymarchingShadowJson?;
    private __raymarchingShadowRegularMaterial?;
    /** Point light paraboloid shadow materials, one front/back pair per shadow slot. */
    private __raymarchingShadowPointSlots;
    /** Whether the SDF shadow casters are split per component (mirrors the visible materials). */
    private __isRaymarchingComponentShadowMode;
    /** Per-component regular (spot / directional) SDF shadow caster materials. */
    private __raymarchingComponentShadowRegularMaterials;
    /** Per shadow slot, per component paraboloid front/back SDF shadow caster materials. */
    private __raymarchingComponentShadowPointSlots;
    private __engine;
    constructor(engine: Engine);
    /**
     * Destroys all allocated 3D API resources including frame buffers and textures.
     *
     * @remarks
     * This method is called internally during resize operations and cleanup.
     * It ensures proper resource management by releasing GPU memory.
     *
     * @internal
     */
    private __destroyResources;
    /**
     * Initializes the rendering pipeline with the specified configuration.
     *
     * @param canvasWidth - The width of the rendering canvas in pixels
     * @param canvasHeight - The height of the rendering canvas in pixels
     * @param options - Configuration options for the pipeline
     * @param options.isShadow - Whether to enable shadow mapping (default: false)
     * @param options.isBloom - Whether to enable bloom post-processing effect (default: false)
     * @param options.shadowMapSize - Size of the shadow map texture in pixels (default: 1024)
     * @param options.isSimple - Whether to use simplified rendering without post-processing (default: false)
     *
     * @returns A Result indicating success or failure of the setup operation
     *
     * @remarks
     * This method must be called before using any other pipeline methods. It creates all necessary
     * frame buffers, render targets, and expressions based on the provided configuration.
     *
     * The method automatically detects WebXR capabilities and configures multi-view rendering
     * when appropriate for VR applications.
     *
     * @example
     * ```typescript
     * const result = await pipeline.setup(1920, 1080, {
     *   isShadow: true,
     *   isBloom: true,
     *   shadowMapSize: 2048
     * });
     *
     * if (result.isErr()) {
     *   console.error('Pipeline setup failed:', result.getErr());
     * }
     * ```
     */
    setup(canvasWidth: number, canvasHeight: number, { isShadow, isBloom, shadowMapSize, isSimple }?: {
        isBloom?: boolean | undefined;
        isShadow?: boolean | undefined;
        isSimple?: boolean | undefined;
        shadowMapSize?: number | undefined;
    }): Promise<Err<unknown, undefined> | Ok<unknown, unknown>>;
    /**
     * Gets the main frame buffer used for back buffer operations.
     *
     * @returns The frame buffer for back buffer operations, or undefined if not available
     *
     * @internal
     */
    private __getMainFrameBufferBackBuffer;
    /**
     * Gets the main frame buffer used for resolve operations.
     *
     * @returns The frame buffer for resolve operations, or undefined if not available
     *
     * @internal
     */
    private __getMainFrameBufferResolve;
    /**
     * Gets the main frame buffer used for rendering operations.
     *
     * @returns The main frame buffer, or undefined if not available
     *
     * @internal
     */
    private __getMainFrameBuffer;
    /**
     * Sets the expressions to be rendered by the pipeline.
     *
     * @param expressions - Array of expressions containing render passes and entities to render
     * @param options - Configuration options for expression setup
     * @param options.isTransmission - Whether to enable transmission rendering for transparent objects (default: true)
     *
     * @remarks
     * This method configures the expressions for both opaque and transparent rendering.
     * When transmission is enabled, transparent objects are rendered in a separate pass
     * to support advanced material effects like glass and water.
     *
     * The method automatically clones expressions for transparent rendering and configures
     * shadow expressions if shadow mapping is enabled.
     *
     * @example
     * ```typescript
     * const expressions = [sceneExpression, uiExpression];
     * pipeline.setExpressions(expressions, { isTransmission: true });
     * ```
     */
    setExpressions(expressions: Expression[], options?: {
        isTransmission: boolean;
    }): void;
    setGizmoExpression(expression: Expression): void;
    /**
     * Starts the main rendering loop with the provided draw function.
     *
     * @param func - Function to be called each frame for rendering operations
     * @returns A Result indicating success or failure of starting the render loop
     *
     * @remarks
     * This method begins the continuous rendering loop using the system's render loop mechanism.
     * The provided function will be called every frame with the current frame object.
     *
     * The method automatically handles shadow system updates, expression management,
     * and frame processing.
     *
     * @example
     * ```typescript
     * const result = pipeline.startRenderLoop((frame) => {
     *   // Update scene
     *   Rn.Engine.process(frame);
     *
     *   // Custom per-frame logic
     *   updateAnimations();
     *   handleInput();
     * });
     *
     * if (result.isErr()) {
     *   console.error('Failed to start render loop:', result.getErr());
     * }
     * ```
     */
    startRenderLoop(func: (frame: Frame) => void): Err<unknown, undefined> | Ok<unknown, unknown>;
    /**
     * Executes a single frame render using the draw function provided to startRenderLoop.
     *
     * @remarks
     * This method allows manual control over frame rendering instead of using the automatic
     * render loop. It calls the draw function that was provided to startRenderLoop.
     *
     * @example
     * ```typescript
     * // Manual frame rendering
     * pipeline.draw();
     * ```
     */
    draw(): void;
    /**
     * Requests a refresh of the shadow map expressions on the next frame.
     * This is useful when materials with shadow support have been changed or added
     * (e.g., applying a shader with ClassicShader node).
     *
     * @remarks
     * When a new material with shadow support is applied, this method should be called
     * to ensure the shadow textures are properly set on the new material.
     *
     * @example
     * ```typescript
     * // After changing a material to one with shadow support
     * pipeline.setNeedsShadowMapRefresh();
     * ```
     */
    setNeedsShadowMapRefresh(): void;
    /**
     * Resizes the rendering pipeline to match new canvas dimensions.
     *
     * @param width - New width of the rendering canvas
     * @param height - New height of the rendering canvas
     * @returns A Result indicating success or failure of the resize operation
     *
     * @remarks
     * This method handles canvas resizing by destroying existing resources and recreating
     * them with the new dimensions. It automatically handles WebXR canvas sizing when
     * in VR mode.
     *
     * The method preserves all current pipeline settings (shadow, bloom, etc.) during resize.
     *
     * @example
     * ```typescript
     * window.addEventListener('resize', () => {
     *   const result = pipeline.resize(window.innerWidth, window.innerHeight);
     *   if (result.isErr()) {
     *     console.error('Resize failed:', result.getErr());
     *   }
     * });
     * ```
     */
    resize(width: Size, height: Size): Err<unknown, undefined> | Ok<unknown, unknown>;
    /**
     * Sets the IBL (Image-Based Lighting) cube textures for realistic lighting.
     *
     * @param diffuse - Diffuse IBL cube texture for ambient lighting
     * @param specular - Specular IBL cube texture for reflections
     * @param sheen - Optional sheen IBL cube texture for fabric-like materials
     *
     * @remarks
     * IBL textures provide realistic lighting by using pre-computed environment maps.
     * The diffuse texture provides ambient lighting, while the specular texture provides
     * reflections and specular highlights.
     *
     * The sheen texture is optional and used for materials with fabric-like properties.
     *
     * @example
     * ```typescript
     * const diffuseCube = new Rn.CubeTexture();
     * diffuseCube.baseUriToLoad = './assets/ibl/diffuse/diffuse';
     * diffuseCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
     *
     * const specularCube = new Rn.CubeTexture();
     * specularCube.baseUriToLoad = './assets/ibl/specular/specular';
     * specularCube.hdriFormat = Rn.HdriFormat.RGBE_PNG;
     * specularCube.mipmapLevelNumber = 10;
     *
     * pipeline.setIBLTextures(diffuseCube, specularCube);
     * ```
     */
    setIBLTextures(diffuse: CubeTexture, specular: CubeTexture, sheen?: CubeTexture): void;
    /**
     * Gets the initial expression used for buffer clearing and setup.
     *
     * @returns The initial expression, or undefined if not available
     *
     * @remarks
     * The initial expression is automatically created during setup and handles
     * clearing of color and depth buffers before main rendering begins.
     */
    getInitialExpression(): Expression | undefined;
    /**
     * Gets the tone mapping expression used for HDR to LDR conversion.
     *
     * @returns The tone mapping expression, or undefined if not available
     *
     * @remarks
     * The tone mapping expression is created during setup when not in simple mode.
     * It handles the conversion from high dynamic range rendering to low dynamic range
     * output suitable for display devices.
     */
    getToneMappingExpression(): Expression | undefined;
    /**
     * Sets the contribution factor for diffuse IBL lighting.
     *
     * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
     *
     * @remarks
     * This method controls how much the diffuse IBL texture contributes to the final lighting.
     * A value of 0.0 disables diffuse IBL, while 1.0 provides full contribution.
     * Values greater than 1.0 can be used for artistic over-exposure effects.
     *
     * @example
     * ```typescript
     * // Reduce ambient lighting
     * pipeline.setDiffuseIBLContribution(0.5);
     *
     * // Disable diffuse IBL
     * pipeline.setDiffuseIBLContribution(0.0);
     *
     * // Over-expose for artistic effect
     * pipeline.setDiffuseIBLContribution(2.0);
     * ```
     */
    setDiffuseIBLContribution(value: number): void;
    /**
     * Sets the contribution factor for specular IBL reflections.
     *
     * @param value - Contribution factor (0.0 to 1.0 or higher for over-exposure effects)
     *
     * @remarks
     * This method controls how much the specular IBL texture contributes to reflections
     * and specular highlights. A value of 0.0 disables specular IBL, while 1.0 provides
     * full contribution. Values greater than 1.0 can create over-exposed reflections.
     *
     * @example
     * ```typescript
     * // Subtle reflections
     * pipeline.setSpecularIBLContribution(0.3);
     *
     * // No reflections
     * pipeline.setSpecularIBLContribution(0.0);
     *
     * // Enhanced reflections
     * pipeline.setSpecularIBLContribution(1.5);
     * ```
     */
    setSpecularIBLContribution(value: number): void;
    /**
     * Sets the rotation of the IBL environment in radians.
     *
     * @param radian - Rotation angle in radians
     *
     * @remarks
     * This method allows rotating the IBL environment to match the desired lighting
     * direction. This is useful when the IBL doesn't align with the scene's lighting
     * requirements or for artistic control over the environment lighting.
     *
     * @example
     * ```typescript
     * // Rotate IBL by 90 degrees
     * pipeline.setIBLRotation(Math.PI / 2);
     *
     * // Rotate IBL by 180 degrees
     * pipeline.setIBLRotation(Math.PI);
     *
     * // Animate IBL rotation
     * let rotation = 0;
     * setInterval(() => {
     *   rotation += 0.01;
     *   pipeline.setIBLRotation(rotation);
     * }, 16);
     * ```
     */
    setIBLRotation(radian: number): void;
    /**
     * Internal method to configure expressions for opaque and blended rendering.
     *
     * @param expressions - Array of expressions to configure
     * @param options - Configuration options
     * @param options.isTransmission - Whether transmission rendering is enabled
     *
     * @internal
     */
    private __setExpressionsInner;
    /**
     * Internal method to configure expressions specifically for transparent object transmission.
     *
     * @param expressions - Array of expressions to configure for transmission
     *
     * @remarks
     * This method sets up expressions for rendering transparent objects with transmission
     * effects like glass and water. It configures back buffer access for refraction effects.
     *
     * @internal
     */
    private __setTransparentExpressionsForTransmission;
    /**
     * Refreshes the back buffer texture on all transparent materials.
     * This is useful when materials are dynamically changed and need to have
     * the back buffer texture re-applied for transmission rendering.
     *
     * Call this method after changing materials on entities that use transmission
     * to ensure the back buffer texture is properly set.
     */
    refreshBackBufferTextureOnTransparentMaterials(): void;
    /**
     * Creates and configures the initial expression for buffer clearing.
     *
     * @returns The configured initial expression
     *
     * @internal
     */
    private __setupInitialExpression;
    /**
     * Creates render targets and frame buffers based on canvas dimensions and WebXR support.
     *
     * @param canvasWidth - Width of the canvas
     * @param canvasHeight - Height of the canvas
     *
     * @remarks
     * This method automatically detects WebXR multi-view support and creates appropriate
     * render targets. For VR, it creates texture arrays for multi-view rendering.
     * For regular rendering, it creates MSAA frame buffers with resolve targets.
     *
     * @internal
     */
    private __createRenderTargets;
    /**
     * Sets up an expression for generating mipmaps on resolve frame buffers.
     *
     * @param resolveFramebuffer2 - The frame buffer to generate mipmaps for
     * @returns The configured mipmap generation expression
     *
     * @internal
     */
    private __setupGenerateMipmapsExpression;
    /**
     * Sets up an expression for blitting multi-view rendering to back buffer.
     *
     * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
     * @returns The configured blit expression
     *
     * @internal
     */
    private __setupMultiViewBlitBackBufferExpression;
    /**
     * Sets up an expression for blitting multi-view rendering results.
     *
     * @param multiViewFrameBuffer - The multi-view frame buffer to blit from
     * @returns The configured blit expression
     *
     * @internal
     */
    private __setupMultiViewBlitExpression;
    /**
     * Sets up the tone mapping expression for HDR to LDR conversion.
     *
     * @param toneMappingTargetRenderTargetTexture - The render target texture to apply tone mapping to
     * @returns The configured tone mapping expression
     *
     * @remarks
     * This method creates both regular and VR-specific tone mapping render passes.
     * The tone mapping converts high dynamic range rendering results to low dynamic range
     * output suitable for display devices.
     *
     * @internal
     */
    private __setupToneMappingExpression;
    /**
     * Creates a frame buffer for depth moment shadow mapping.
     *
     * @param shadowMapSize - Size of the shadow map in pixels
     * @returns The configured depth moment frame buffer
     *
     * @internal
     */
    private __setupDepthMomentFramebuffer;
    /**
     * Internal method to apply IBL textures to all expressions.
     *
     * @internal
     */
    private __setIblInner;
    /**
     * Internal method to apply IBL textures to transparent-only expressions.
     *
     * @internal
     */
    private __setIblInnerForTransparentOnly;
    /**
     * Sets the tone mapping algorithm used for HDR to LDR conversion.
     *
     * @param type - The tone mapping algorithm to use
     *
     * @remarks
     * Tone mapping is essential for converting high dynamic range rendering results
     * to low dynamic range output that can be displayed on standard monitors.
     *
     * Available tone mapping algorithms:
     * - KhronosPbrNeutral: Khronos PBR neutral tone mapping
     * - Reinhard: Classic Reinhard tone mapping
     * - GT_ToneMap: GT tone mapping (default)
     * - ACES_Narkowicz: ACES tone mapping by Narkowicz
     * - ACES_Hill: ACES tone mapping by Hill
     * - ACES_Hill_Exposure_Boost: ACES Hill with exposure boost
     *
     * @example
     * ```typescript
     * // Use ACES tone mapping for cinematic look
     * pipeline.setToneMappingType(Rn.ToneMappingType.ACES_Hill);
     *
     * // Use Reinhard for classic look
     * pipeline.setToneMappingType(Rn.ToneMappingType.Reinhard);
     *
     * // Use Khronos PBR neutral for accurate colors
     * pipeline.setToneMappingType(Rn.ToneMappingType.KhronosPbrNeutral);
     * ```
     */
    setToneMappingType(type: ToneMappingTypeEnum): void;
    private __setupRaymarchingExpression;
    /**
     * Points a buffer-less raymarching pass at the pipeline's render targets, including
     * the MSAA resolve targets the transmission pass and mipmap generation read.
     */
    private __configureRaymarchingPassTargets;
    /**
     * Per-frame setup of the legacy merged raymarching pass.
     *
     * The merged material evaluates every component's graph in one distance function,
     * so the object id and world matrix uniforms are postfixed with the component SID,
     * and the march is clipped to the union of all component AABBs.
     *
     * @param renderPass - The legacy raymarching pass
     */
    private __prepareLegacyRaymarchingPass;
    /**
     * Assigns the raymarching material of a single component.
     *
     * The pipeline renders one buffer-less full-screen pass per materialized component
     * (in component SID order) with depth test and depth write enabled, so the nearest
     * SDF wins per pixel. Each material only contains that component's graph: uniforms
     * and textures are not shared or postfixed, and the texture-slot limit applies per
     * component instead of to the merged graph of every component.
     *
     * When at least one component material is assigned, the legacy merged raymarching
     * material ({@link setRaymarchingMaterial}) is ignored.
     *
     * The pass clips its march to the component's world AABB. Call
     * `component.invalidateAABB()` when the SDF's size changes through material uniform
     * values (the editor does this for its uniform controls) so the cached bounds, the
     * ray interval and the scissor rectangle stay current.
     *
     * @param component - The component the material belongs to
     * @param material - The material, typically from
     * `MaterialHelper.createNodeBasedRaymarchingComponentMaterial`
     */
    setRaymarchingComponentMaterial(component: RaymarchingComponent, material: Material): void;
    /**
     * Gets the raymarching material assigned to a component.
     * @param component - The component whose material is requested
     */
    getRaymarchingComponentMaterial(component: RaymarchingComponent): Material | undefined;
    /**
     * Removes the raymarching material of a component so it stops rendering.
     * @param component - The component whose material is removed
     */
    removeRaymarchingComponentMaterial(component: RaymarchingComponent): void;
    /**
     * Legacy single-material API: renders all components with one merged material.
     *
     * Ignored while per-component materials are assigned ({@link setRaymarchingComponentMaterial}).
     *
     * @param material - The material built from `MaterialHelper.collectRrnJson`
     */
    setRaymarchingMaterial(material: Material): void;
    /**
     * Creates or updates the buffer-less render pass of each component that owns a
     * raymarching material, in component SID order. Components without a material are
     * skipped, and stale passes are dropped.
     */
    private __getRaymarchingComponentPasses;
    /**
     * Per-frame setup of one component's raymarching pass: its world matrix, the world
     * AABB used for ray interval clipping, and the scissor rectangle on the screen.
     *
     * The world matrix and the AABB are sampled together so the clip interval matches
     * the transform the shader uses, including on backends that upload material values
     * one frame later.
     *
     * @param componentSID - The SID of the component rendered by the pass
     */
    private __prepareRaymarchingComponentPass;
    /**
     * Returns the conservative world AABB of a component's SDF, caching it until the
     * component's AABB version or world matrix changes.
     *
     * @param component - The SDF component
     */
    private __getCachedRaymarchingAabb;
    /**
     * Projects a world AABB to a screen-space scissor rectangle.
     *
     * Returns undefined (render the whole target) when the bounds are unbounded or
     * when any corner is behind the camera, where a naive projection is invalid.
     *
     * @param aabb - The world AABB of the SDF
     */
    private __calcRaymarchingScissorRect;
    /** All raymarching materials the pipeline manages (legacy or per component). */
    private __getAllRaymarchingMaterials;
    /**
     * Builds the raymarching expression from the current materials.
     *
     * With per-component materials, the expression contains one buffer-less pass per
     * component (component SID order), composited by the depth test. Otherwise the
     * legacy merged pass is used. The expression is empty while no raymarching material
     * is assigned.
     */
    private __buildRaymarchingExpression;
    /**
     * Rebuilds the shadow caster materials from the current raymarching components
     * (only the ones with `castShadow`) and requests a shadow map refresh, so the SDF
     * objects appear in / disappear from the shadow maps.
     *
     * With per-component visible materials, the shadow casters are split per component
     * as well (their textures and uniforms are then independent in the shadow maps).
     * Otherwise the legacy merged caster materials are rebuilt from `collectRrnJson`.
     *
     * Call this when a raymarching graph or a component's `castShadow` flag changes.
     */
    refreshRaymarchingShadowMaterial(): void;
    /**
     * The raymarching components in a deterministic (component SID) order.
     */
    private __getSortedRaymarchingComponents;
    /** The regular (spot / directional) SDF shadow caster material (for tests/debugging). */
    getRaymarchingShadowMaterial(): Material | undefined;
    /** The regular SDF shadow caster material of one component (for tests/debugging). */
    getRaymarchingComponentShadowMaterial(component: RaymarchingComponent): Material | undefined;
    /**
     * Provider of the SDF shadow caster passes handed to the ShadowSystem.
     */
    private __getRaymarchingShadowPassProvider;
    /**
     * Returns the paraboloid shadow caster material pair for a shadow slot, creating it on
     * first use. A pair per slot is needed because the light index and the far plane are
     * material parameters, which WebGPU uploads once per frame.
     */
    private __getRaymarchingShadowPointMaterials;
    private __setRaymarchingShadowPointFarPlane;
    /**
     * Returns the paraboloid caster material pair of one component for a shadow slot,
     * creating it on first use.
     *
     * @param shadowSlot - The shadow slot of the point light
     * @param lightComponentSID - The light component SID stored as `lightIndex`
     * @param farPlane - The far plane of the point light shadow
     * @param component - The SDF component rendered into the shadow map
     */
    private __getRaymarchingComponentShadowPointMaterials;
    private __updateRaymarchingShadowPointFarPlane;
    private __createRaymarchingShadowPasses;
    /**
     * Creates one buffer-less SDF shadow caster pass with the given material.
     *
     * @param material - The component's (or merged) shadow caster material
     * @param params - The shadow map variant request
     */
    private __createRaymarchingShadowPass;
    /**
     * Copies the graph parameters (uniform values, textures) and the current transforms
     * from the visible raymarching materials to the SDF shadow caster materials.
     *
     * With per-component visible materials, each component's caster materials are its
     * own (same semantic names, no postfixing): their uniforms/textures are copied from
     * that component's visible material and the component's world matrix is set on them.
     * Otherwise the legacy merged casters are fed from the merged visible material.
     *
     * This runs once per frame BEFORE Engine.process: WebGPU uploads material values in the
     * prerender stage, so updating them only in a render pass hook would leave the shadow
     * passes one frame behind. setParameter / setTextureParameter return early for identical
     * values, so the copy is cheap.
     */
    private __syncRaymarchingShadowMaterialParameters;
    /**
     * Per-component variant of the shadow caster parameter sync: copies each component's
     * visible uniforms/textures to its own caster materials (their names match) and sets
     * the component's world matrix and world AABB, which the shadow shader uses for the
     * distance scale and the ray interval.
     */
    private __syncRaymarchingComponentShadowMaterialParameters;
    /** Materials outside mesh primitives that still receive shadows (the raymarching materials). */
    private __getAdditionalShadowMaterials;
    getRaymarchingMaterial(): Material | undefined;
    /**
     * Applies the pipeline's IBL environment to every raymarching PBR material.
     *
     * The raymarching draw is buffer-less and has no mesh renderer component, so
     * the IBL parameters that material contents normally read from the mesh
     * renderer are set on the material here instead.
     */
    private __applyIblToRaymarchingMaterial;
    /**
     * Applies the pipeline's IBL environment to one raymarching material.
     * @param material - The raymarching material
     */
    private __applyIblToMaterial;
    /**
     * Whether a raymarching material shades with transmission, which means it
     * samples the scene color behind the SDF.
     *
     * Only then does the raymarching expression have to run after the opaque
     * expressions. Without transmission it keeps its legacy position before them,
     * so blended meshes that are drawn in the opaque expression (the pipeline may be
     * configured with isTransmission: false) keep blending over the SDF.
     */
    private __isRaymarchingTransmissionEnabled;
    /**
     * Binds the resolved scene color to every raymarching material for transmission.
     *
     * This is the same reference texture the transmission materials of the transparent
     * pass sample. The raymarching expression is rendered after the opaque expressions,
     * so the texture holds the current frame. Materials without the semantic ignore the
     * call, and an identical binding is a no-op, so this is safe to run every frame.
     */
    private __applyBackBufferTextureToRaymarchingMaterial;
    /**
     * Internal method to set up the frame with all configured expressions.
     *
     * @remarks
     * This method is called automatically during the render loop to configure
     * the frame with all necessary expressions in the correct order:
     * 1. Initial expression (buffer clearing)
     * 2. Shadow expressions
     * 3. Main expressions (opaque rendering)
     * 4. Mipmap generation
     * 5. Multi-view blitting
     * 6. Raymarching expression for transmission materials (samples the scene color;
     *    without transmission the raymarching expression is drawn before step 3)
     * 7. Transparent expressions
     * 8. Bloom effect
     * 9. Tone mapping
     *
     * @internal
     */
    private __setUpExpressionsForRendering;
}
