import { CameraComponent } from '../../components/Camera/CameraComponent';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Vector2 } from '../../math/Vector2';
import type { Engine } from '../../system/Engine';
import type { RenderTargetTexture } from '../../textures/RenderTargetTexture';
import { Expression } from '../Expression';
import { RenderPass } from '../RenderPass';
/**
 * Returns the element of the Halton low-discrepancy sequence with the given index and base.
 *
 * @param index - The index (1 or greater; index 0 returns 0)
 * @param base - The base (2 and 3 for the usual 2D sequence)
 * @returns A value in [0, 1)
 * @internal
 */
export declare function halton(index: number, base: number): number;
/**
 * Returns the jitter of the given frame in NDC units: a Halton(2, 3) sub-pixel offset in [-0.5, 0.5) pixels.
 *
 * @param frameIndex - The frame counter
 * @param width - The width of the render target in pixels
 * @param height - The height of the render target in pixels
 * @returns The NDC offset (one pixel is 2 / width horizontally)
 * @internal
 */
export declare function getTemporalAAJitter(frameIndex: number, width: number, height: number): Vector2;
/**
 * Temporal anti-aliasing for the ForwardRenderPipeline.
 *
 * @remarks
 * Every frame:
 * 1. `prepareFrame` (before `Engine.process`) moves the projection of the camera by a sub-pixel jitter, and keeps
 *    the world matrices, the bone data of the skeletons and the view projection matrix of the previous frame for
 *    the motion vectors (the strategies keep the blend shape weights of the previous frame).
 * 2. The motion vector pass renders the opaque primitives with the motion vector material into an RGBA16F target
 *    (xy: the motion in texture coordinates, z: the depth).
 * 3. The resolve pass blends the current frame, reconstructed from its 3x3 neighborhood with a filter centered on
 *    each pixel, with the history reprojected by the motion vectors (Catmull-Rom history sampling, variance
 *    clipping in YCoCg, inverse luminance weighting, a smaller weight of the current frame for pixels that do not
 *    move), writes the result into the output target and copies it into the history target.
 *
 * The motion vectors include the motion of skinned and morphed vertices: the motion vector material deforms each
 * vertex a second time with the bone data and the blend shape weights of the previous frame.
 *
 * @internal
 */
export declare class TemporalAASystem {
    private __engine;
    private __width;
    private __height;
    private __motionVectorFramebuffer;
    private __outputFramebuffer;
    private __historyFramebuffer;
    private __motionVectorMaterial;
    private __resolveMaterial;
    private __linearSampler;
    private __nearestSampler;
    private __motionVectorRenderPass;
    private __resolveRenderPass;
    private __expression;
    private __previousFrameDataTracker;
    private __frameIndex;
    private __isHistoryValid;
    private __historyFrameCount;
    private __lastCamera?;
    private __previousViewProjectionMatrix;
    /**
     * Creates the render targets, the materials and the passes of temporal anti-aliasing.
     *
     * @param engine - The engine instance
     * @param width - The width of the render targets in pixels
     * @param height - The height of the render targets in pixels
     * @param currentColorTexture - The texture of the current (jittered) frame to anti-alias
     */
    constructor(engine: Engine, width: number, height: number, currentColorTexture: RenderTargetTexture);
    /**
     * The expression that renders the motion vectors and resolves the anti-aliasing.
     * It has to run after the scene (opaque and transparent) is rendered into the current color texture.
     */
    get expression(): Expression;
    /** The anti-aliased result (RGBA16F). */
    get outputTexture(): RenderTargetTexture;
    /** The motion vector texture (xy: the motion in texture coordinates, z: the depth). */
    get motionVectorTexture(): RenderTargetTexture;
    /**
     * The weight of the current frame in the exponential blend for pixels that move by a pixel per frame or more
     * (0-1, default 0.1).
     */
    set currentFrameWeight(weight: number);
    get currentFrameWeight(): number;
    /**
     * The weight of the current frame in the exponential blend for pixels that do not move (0-1, default 0.04).
     * Slower pixels interpolate between this weight and `currentFrameWeight`; a value above `currentFrameWeight`
     * is clamped to it.
     */
    set staticFrameWeight(weight: number);
    get staticFrameWeight(): number;
    /**
     * The size of the variance clipping box of the history in standard deviations (default 1). A large value
     * effectively disables the clipping, which makes wrong motion vectors visible as trails (for debugging).
     */
    set varianceClipGamma(gamma: number);
    /** The number of frames prepared since the creation or the last reset of the history. */
    get frameIndex(): number;
    /**
     * Sets the entities whose opaque primitives are rendered into the motion vector target.
     *
     * @param entities - The entities rendered by the main expressions of the pipeline
     */
    setEntities(entities: ISceneGraphEntity[]): void;
    /**
     * Discards the history: the next frame outputs the current frame without blending.
     * Call it when the view changes discontinuously (e.g. a camera cut).
     */
    resetHistory(): void;
    /**
     * Prepares the next frame. Call it once per frame before `Engine.process`.
     *
     * @param camera - The camera of the main render passes
     */
    prepareFrame(camera: CameraComponent | undefined): void;
    /** The number of frames accumulated in the history, as passed to the resolve material in the last frame. */
    get historyFrameCount(): number;
    /**
     * Releases the GPU resources and removes the jitter from the camera.
     */
    destroy3DAPIResources(): void;
}
/**
 * Returns the camera used by the given render passes: the camera of the first pass that has one, or the current
 * camera of the engine.
 *
 * @internal
 */
export declare function _getTemporalAACamera(engine: Engine, renderPasses: readonly RenderPass[]): CameraComponent | undefined;
