import { Index, Size } from '../../types/CommonTypes';
import { TextureFormatEnum } from '../definitions/TextureFormat';
import { FrameBuffer } from '../renderer/FrameBuffer';
import { AbstractTexture } from './AbstractTexture';
import { IRenderable } from './IRenderable';
export declare class RenderTargetTextureCube extends AbstractTexture implements IRenderable {
    private __fbo?;
    hdriFormat: import("..").EnumIO;
    _textureViewAsRenderTargetResourceUid: number;
    constructor();
    create({ width, height, mipLevelCount, format: internalFormat, }: {
        width: number;
        height: number;
        mipLevelCount?: number;
        format: TextureFormatEnum;
    }): void;
    private __createRenderTargetTexture;
    generateMipmaps(): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get mipmapLevelNumber(): number;
    setIsTextureReady(): void;
}
