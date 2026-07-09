import type { Size } from '../../../types';
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
    private __oFrame;
    private __oFrameBufferMultiView;
    private __oFrameBufferMultiViewBlit;
    private __oFrameBufferMultiViewBlitBackBuffer;
    private __oFrameBufferMsaa;
    private __oFrameBufferResolve;
    private __oFrameBufferResolveForReference;
    private __oInitialExpression;
    /** main expressions */
    private __expressions;
    private __gizmoExpression;
    private __oGenerateMipmapsExpression;
    private __oMultiViewBlitBackBufferExpression;
    private __oMultiViewBlitExpression;
    private __oBloomExpression;
    private __oToneMappingExpression;
    private __oToneMappingMaterial;
    private __transparentOnlyExpressions;
    private __oWebXRSystem;
    private __oDrawFunc;
    private __oDiffuseCubeTexture;
    private __oSpecularCubeTexture;
    private __oSheenCubeTexture;
    private __oSamplerForBackBuffer;
    private __toneMappingType;
    private __bloomHelper;
    private __oShadowSystem;
    private __shadowExpressions;
    private __entitiesForShadow;
    private __oRaymarchingExpression;
    private __oRaymarchingRenderPass;
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
     * @returns The frame buffer for back buffer operations, or None if not available
     *
     * @internal
     */
    private __getMainFrameBufferBackBuffer;
    /**
     * Gets the main frame buffer used for resolve operations.
     *
     * @returns The frame buffer for resolve operations, or None if not available
     *
     * @internal
     */
    private __getMainFrameBufferResolve;
    /**
     * Gets the main frame buffer used for rendering operations.
     *
     * @returns The main frame buffer, or None if not available
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
    setRaymarchingMaterial(material: Material): void;
    getRaymarchingMaterial(): Material | undefined;
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
     * 6. Transparent expressions
     * 7. Bloom effect
     * 8. Tone mapping
     *
     * @internal
     */
    private __setUpExpressionsForRendering;
}
