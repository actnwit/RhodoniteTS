import { FrameBuffer } from '../renderer/FrameBuffer';
import { ComponentTypeEnum } from '../definitions/ComponentType';
declare function createTexturesForRenderTarget(width: number, height: number, textureNum: number, { level, internalFormat, format, type, createDepthBuffer, isMSAA, sampleCountMSAA, }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    format?: import("..").EnumIO | undefined;
    type?: ComponentTypeEnum | undefined;
    createDepthBuffer?: boolean | undefined;
    isMSAA?: boolean | undefined;
    sampleCountMSAA?: number | undefined;
}): FrameBuffer;
declare function createTextureArrayForRenderTarget(width: number, height: number, arrayLength: number, { level, internalFormat, format, type, createDepthBuffer, isMSAA, sampleCountMSAA, }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    format?: import("..").EnumIO | undefined;
    type?: ComponentTypeEnum | undefined;
    createDepthBuffer?: boolean | undefined;
    isMSAA?: boolean | undefined;
    sampleCountMSAA?: number | undefined;
}): FrameBuffer;
declare function createDepthBuffer(width: number, height: number, { level, internalFormat, format, type, }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    format?: import("..").EnumIO | undefined;
    type?: {
        readonly __webgpu: string;
        readonly __wgsl: string;
        readonly __sizeInBytes: number;
        readonly __dummyStr: "FLOAT";
        readonly wgsl: string;
        readonly webgpu: string;
        getSizeInBytes(): number;
        isFloatingPoint(): boolean;
        isInteger(): boolean;
        isUnsignedInteger(): boolean;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    } | undefined;
}): FrameBuffer;
export declare const RenderableHelper: Readonly<{
    createTexturesForRenderTarget: typeof createTexturesForRenderTarget;
    createTextureArrayForRenderTarget: typeof createTextureArrayForRenderTarget;
    createDepthBuffer: typeof createDepthBuffer;
}>;
export {};
