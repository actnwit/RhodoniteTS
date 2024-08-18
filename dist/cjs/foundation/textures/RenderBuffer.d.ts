import { RnObject } from '../core/RnObject';
import { IRenderable } from './IRenderable';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { Size, CGAPIResourceHandle, Index } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
export declare class RenderBuffer extends RnObject implements IRenderable {
    width: number;
    height: number;
    private __internalFormat;
    _textureResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    private __fbo?;
    private __isMSAA;
    private __sampleCountMSAA;
    constructor();
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get sampleCount(): number;
    create(width: Size, height: Size, internalFormat: TextureParameterEnum, { isMSAA, sampleCountMSAA }?: {
        isMSAA?: boolean | undefined;
        sampleCountMSAA?: number | undefined;
    }): void;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
}
