import { FrameBuffer } from '../renderer/FrameBuffer';
declare function createTexturesForRenderTarget(width: number, height: number, textureNum: number, { level, internalFormat, format, type, createDepthBuffer, isMSAA, sampleCountMSAA, }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    format?: import("..").EnumIO | undefined;
    type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
    createDepthBuffer?: boolean | undefined;
    isMSAA?: boolean | undefined;
    sampleCountMSAA?: number | undefined;
}): FrameBuffer;
declare function createDepthBuffer(width: number, height: number, { level, internalFormat, format, type, }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    format?: import("..").EnumIO | undefined;
    type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
}): FrameBuffer;
export declare const RenderableHelper: Readonly<{
    createTexturesForRenderTarget: typeof createTexturesForRenderTarget;
    createDepthBuffer: typeof createDepthBuffer;
}>;
export {};
