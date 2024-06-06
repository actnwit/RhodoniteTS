import { AbstractTexture } from './AbstractTexture';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { PixelFormatEnum } from '../definitions/PixelFormat';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { IRenderable } from './IRenderable';
import { Size, Index } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { Vector4 } from '../math/Vector4';
export declare class RenderTargetTexture extends AbstractTexture implements IRenderable {
    private __fbo?;
    private __arrayLength;
    constructor();
    create({ width, height, level, internalFormat, format, type, }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    createTextureArray({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: number;
    }): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get arrayLength(): number;
    private __createRenderTargetTexture;
    private __createRenderTargetTextureArray;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    getTexturePixelData(): Promise<Uint8Array>;
    downloadTexturePixelData(): Promise<void>;
    /**
     * Origin is left bottom
     *
     * @param x horizontal pixel position (0 is left)
     * @param y vertical pixel position (0 is bottom)
     * @param argByteArray Pixel Data as Uint8Array
     * @returns Pixel Value in Vector4
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4>;
    generateMipmap(): void;
    blitToTexture2dFromTexture2dArray(targetTexture2D: RenderTargetTexture): void;
    blitToTexture2dFromTexture2dArrayFake(targetTexture2D: RenderTargetTexture): void;
    blitToTexture2dFromTexture2dArray2(targetTexture2D: RenderTargetTexture): void;
}
