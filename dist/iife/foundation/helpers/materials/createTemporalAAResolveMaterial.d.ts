import type { Material } from '../../materials/core/Material';
import type { Engine } from '../../system/Engine';
/**
 * Creates the full screen material that resolves temporal anti-aliasing.
 *
 * @remarks
 * Parameters:
 * - `baseColorTexture`: the current (jittered) frame
 * - `historyTexture`: the result of the previous frame
 * - `velocityTexture`: the output of the motion vector material
 * - `framebufferSize`: the size of the textures in pixels
 * - `currentJitter`: the jitter of the current frame in NDC units (see `getTemporalAAJitter`), for the
 *   reconstruction filter of the current frame
 * - `currentFrameWeight`: the weight of the current frame in the exponential blend for pixels that move by a pixel
 *   per frame or more (default 0.1)
 * - `staticFrameWeight`: the weight of the current frame for pixels that do not move (default 0.04). Slower
 *   pixels interpolate between the two weights
 * - `varianceClipGamma`: the size of the variance clipping box in standard deviations (default 1)
 * - `isHistoryValid`: false outputs the current frame (e.g. on the first frame after a reset)
 * - `historyFrameCount`: the number of frames accumulated in the history since the last reset. The weight of the
 *   current frame is at least `1 / (historyFrameCount + 1)`, so that the first frames are averaged evenly
 *
 * @param engine - The engine instance
 * @param options - Configuration object for the material
 * @param options.additionalName - Additional name suffix for the material
 * @param options.maxInstancesNumber - Maximum number of material instances
 * @returns The temporal anti-aliasing resolve material
 * @internal
 */
export declare function createTemporalAAResolveMaterial(engine: Engine, { additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
