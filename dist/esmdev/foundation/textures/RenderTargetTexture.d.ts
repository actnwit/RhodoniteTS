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
    constructor();
    create({ width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, anisotropy, }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        anisotropy: boolean;
    }): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    private __createRenderTargetTexture;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    getTexturePixelData(): Uint8Array;
    downloadTexturePixelData(): void;
    /**
     * Origin is left bottom
     *
     * @param x horizontal pixel position (0 is left)
     * @param y vertical pixel position (0 is bottom)
     * @param argByteArray Pixel Data as Uint8Array
     * @returns Pixel Value in Vector4
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Vector4;
    generateMipmap(): void;
}
