import { EnumClass, EnumIO } from '../misc/EnumIO';
export declare class ProcessApproachClass extends EnumClass implements EnumIO {
    constructor({ index, str }: {
        index: number;
        str: string;
    });
    get webGLVersion(): 0 | 2;
}
export declare type ProcessApproachEnum = ProcessApproachClass;
export declare const ProcessApproach: Readonly<{
    isDataTextureApproach: (processApproach: ProcessApproachEnum) => boolean;
    isUniformApproach: (processApproach: ProcessApproachEnum) => boolean;
    isWebGpuApproach: (processApproach: ProcessApproachEnum) => boolean;
    None: ProcessApproachClass;
    Uniform: ProcessApproachClass;
    DataTexture: ProcessApproachClass;
    WebGPU: ProcessApproachClass;
    isWebGL2Approach: (processApproach: ProcessApproachEnum) => boolean;
}>;
