import { TextureData } from '../WebGLResourceRepository';
import { CompressionTextureTypeEnum } from '../../foundation/definitions/CompressionTextureType';
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
        compressionTextureType: CompressionTextureTypeEnum;
        mipmapData: TextureData[];
        needGammaCorrection: boolean;
    }>;
    private __loadMSCTranscoder;
    private __getDeviceDependentParametersWebGL;
    private __getDeviceDependentParametersWebGPU;
    private __parse;
    private __transcodeData;
    private __hasAlpha;
}
