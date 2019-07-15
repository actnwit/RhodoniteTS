import FrameBuffer from "../renderer/FrameBuffer";
declare function createTexturesForRenderTarget(width: number, height: number, textureNum: number, { level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT }: {
    level?: number | undefined;
    internalFormat?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
    format?: import("../definitions/PixelFormat").PixelFormatEnum | undefined;
    type?: import("../definitions/ComponentType").ComponentTypeEnum | undefined;
    magFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    minFilter?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    wrapS?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
    wrapT?: import("../definitions/TextureParameter").TextureParameterEnum | undefined;
}): FrameBuffer;
declare const _default: Readonly<{
    createTexturesForRenderTarget: typeof createTexturesForRenderTarget;
}>;
export default _default;
