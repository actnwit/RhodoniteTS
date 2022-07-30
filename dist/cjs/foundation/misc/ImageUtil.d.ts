import { MutableVector3 } from '../math/MutableVector3';
import { Size } from '../../types/CommonTypes';
import { TextureDataFloat } from '../textures/TextureDataFloat';
declare type SeamlessTextureData = {
    input: TextureDataFloat;
    Tinput: TextureDataFloat;
    Tinv: TextureDataFloat;
    colorSpaceVector1: MutableVector3;
    colorSpaceVector2: MutableVector3;
    colorSpaceVector3: MutableVector3;
    colorSpaceOrigin: MutableVector3;
    lutWidth: Size;
};
declare function precomputations(input: TextureDataFloat, // input: example image
LUT_WIDTH?: Size): SeamlessTextureData;
export declare function convertHTMLImageElementToCanvas(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement;
export declare function combineImages(data: {
    r_image?: HTMLCanvasElement;
    g_image?: HTMLCanvasElement;
    b_image?: HTMLCanvasElement;
    a_image?: HTMLCanvasElement;
    width: number;
    height: number;
}): HTMLCanvasElement;
export declare const ImageUtil: Readonly<{
    precomputations: typeof precomputations;
}>;
export {};
