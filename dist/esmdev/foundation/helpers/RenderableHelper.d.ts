import { FrameBuffer } from '../renderer/FrameBuffer';
import { TextureParameterEnum } from '../definitions/TextureParameter';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { PixelFormatEnum } from '../definitions/PixelFormat';
import { TextureFormatEnum } from '../definitions/TextureFormat';
export interface TextureParameters {
    level: number;
    format: TextureParameterEnum;
}
export interface FrameBufferDescriptor {
    width: number;
    height: number;
    textureNum: number;
    textureFormats: TextureFormatEnum[];
    createDepthBuffer: boolean;
    depthTextureFormat?: TextureFormatEnum;
}
declare function createFrameBuffer(desc: FrameBufferDescriptor): FrameBuffer;
export interface FrameBufferMSAADescriptor {
    width: number;
    height: number;
    colorBufferNum: number;
    colorFormats: TextureFormatEnum[];
    sampleCountMSAA: number;
    depthBufferFormat: TextureFormatEnum;
}
declare function createFrameBufferMSAA(desc: FrameBufferMSAADescriptor): FrameBuffer;
export interface FrameBufferTextureArrayDescriptor {
    width: number;
    height: number;
    arrayLength: number;
    level: number;
    internalFormat: TextureFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
}
declare function createFrameBufferTextureArray(desc: FrameBufferTextureArrayDescriptor): FrameBuffer;
declare function createDepthBuffer(width: number, height: number, { level, internalFormat }: {
    level?: number | undefined;
    internalFormat?: TextureFormatEnum | undefined;
}): FrameBuffer;
export declare const RenderableHelper: Readonly<{
    createFrameBuffer: typeof createFrameBuffer;
    createFrameBufferMSAA: typeof createFrameBufferMSAA;
    createFrameBufferTextureArray: typeof createFrameBufferTextureArray;
    createDepthBuffer: typeof createDepthBuffer;
}>;
export {};
