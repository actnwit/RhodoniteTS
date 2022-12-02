import { FrameBuffer } from '../renderer/FrameBuffer';
declare function createTexturesForRenderTarget(width: number, height: number, textureNum: number, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, createDepthBuffer, isMSAA, sampleCountMSAA, }: {
    level?: number | undefined;
    internalFormat?: import("..").EnumIO | undefined;
    format?: import("..").EnumIO | undefined;
    type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
    magFilter?: import("..").EnumIO | undefined;
    minFilter?: import("..").EnumIO | undefined;
    wrapS?: import("..").EnumIO | undefined;
    wrapT?: import("..").EnumIO | undefined;
    createDepthBuffer?: boolean | undefined;
    isMSAA?: boolean | undefined;
    sampleCountMSAA?: number | undefined;
}): FrameBuffer;
declare function createDepthBuffer(width: number, height: number, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT, }: {
    level?: number | undefined;
    internalFormat?: import("..").EnumIO | undefined;
    format?: import("..").EnumIO | undefined;
    type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
    magFilter?: import("..").EnumIO | undefined;
    minFilter?: import("..").EnumIO | undefined;
    wrapS?: import("..").EnumIO | undefined;
    wrapT?: import("..").EnumIO | undefined;
}): FrameBuffer;
export declare const RenderableHelper: Readonly<{
    createTexturesForRenderTarget: typeof createTexturesForRenderTarget;
    createDepthBuffer: typeof createDepthBuffer;
}>;
export {};
