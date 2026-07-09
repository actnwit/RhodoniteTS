import type { Size } from '../../types/CommonTypes';
import { MutableVector3 } from '../math/MutableVector3';
import { TextureDataFloat } from '../textures/TextureDataFloat';
/**
 * Data structure containing all precomputed data needed for seamless texture synthesis.
 */
type SeamlessTextureData = {
    input: TextureDataFloat;
    Tinput: TextureDataFloat;
    Tinv: TextureDataFloat;
    colorSpaceVector1: MutableVector3;
    colorSpaceVector2: MutableVector3;
    colorSpaceVector3: MutableVector3;
    colorSpaceOrigin: MutableVector3;
    lutWidth: Size;
};
/**
 * Performs all necessary precomputations for seamless texture synthesis.
 * This includes color space decorrelation, histogram transformation, and LUT prefiltering.
 *
 * @param input - The input example texture
 * @param LUT_WIDTH - The width of the Look-Up Table (default: 128)
 * @returns SeamlessTextureData containing all precomputed data
 */
declare function precomputations(input: TextureDataFloat, // input: example image
LUT_WIDTH?: Size): SeamlessTextureData;
/**
 * Converts an HTMLImageElement to a Canvas with specified dimensions.
 * The image is scaled to fit the target width and height.
 *
 * @param image - The source HTML image element
 * @param width - The target canvas width
 * @param height - The target canvas height
 * @returns A new Canvas element containing the scaled image
 */
export declare function convertHTMLImageElementToCanvas(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement;
/**
 * Combines multiple single-channel images into a single RGBA image.
 * Each input image contributes to one color channel of the output.
 *
 * @param data - Configuration object containing:
 *   - r_image: Optional canvas for red channel
 *   - g_image: Optional canvas for green channel
 *   - b_image: Optional canvas for blue channel
 *   - a_image: Optional canvas for alpha channel
 *   - width: Output image width
 *   - height: Output image height
 * @returns A new Canvas containing the combined RGBA image
 */
export declare function combineImages(data: {
    r_image?: HTMLCanvasElement;
    g_image?: HTMLCanvasElement;
    b_image?: HTMLCanvasElement;
    a_image?: HTMLCanvasElement;
    width: number;
    height: number;
}): HTMLCanvasElement;
/**
 * Utility class for image processing operations.
 * Provides methods for seamless texture synthesis and image manipulation.
 */
export declare const ImageUtil: Readonly<{
    precomputations: typeof precomputations;
}>;
export {};
