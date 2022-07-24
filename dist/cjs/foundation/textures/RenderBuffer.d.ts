import { RnObject } from '../core/RnObject';
import { IRenderable } from './IRenderable';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { Size, CGAPIResourceHandle } from '../../types/CommonTypes';
import { FrameBuffer } from '../renderer/FrameBuffer';
export declare class RenderBuffer extends RnObject implements IRenderable {
    width: number;
    height: number;
    private __internalFormat;
    cgApiResourceUid: CGAPIResourceHandle;
    private __fbo?;
    private __isMSAA;
    private __sampleCountMSAA;
    constructor();
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    create(width: Size, height: Size, internalFormat: TextureParameterEnum, { isMSAA, sampleCountMSAA }?: {
        isMSAA?: boolean | undefined;
        sampleCountMSAA?: number | undefined;
    }): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
}
