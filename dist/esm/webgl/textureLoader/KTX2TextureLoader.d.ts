import { TextureData } from '../WebGLResourceRepository';
export declare class KTX2TextureLoader {
    private static __instance;
    private static __mscTranscoderModule;
    private static __zstdDecoder;
    private __mscTranscoderPromise;
    constructor();
    static getInstance(): KTX2TextureLoader;
    transcode(uint8Array: Uint8Array): Promise<{
        width: number;
        height: number;
        compressionTextureType: import("../..").EnumIO;
        mipmapData: TextureData[];
        needGammaCorrection: boolean;
    }>;
    private __loadMSCTranscoder;
    private __getDeviceDependentParameters;
    private __parse;
    private __transcodeData;
    private __hasAlpha;
}
