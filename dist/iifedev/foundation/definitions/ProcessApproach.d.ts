import { EnumClass, type EnumIO } from '../misc/EnumIO';
export declare class ProcessApproachClass extends EnumClass implements EnumIO {
    constructor({ index, str }: {
        index: number;
        str: string;
    });
    get webGLVersion(): 0 | 2;
}
export type ProcessApproachEnum = ProcessApproachClass;
declare function from(index: number): ProcessApproachEnum | undefined;
export declare const ProcessApproach: Readonly<{
    isDataTextureApproach: (processApproach: ProcessApproachEnum) => boolean;
    isUniformApproach: (processApproach: ProcessApproachEnum) => boolean;
    isWebGpuApproach: (processApproach: ProcessApproachEnum) => boolean;
    None: ProcessApproachClass;
    Uniform: ProcessApproachClass;
    DataTexture: ProcessApproachClass;
    WebGPU: ProcessApproachClass;
    from: typeof from;
    isWebGL2Approach: (processApproach: ProcessApproachEnum) => boolean;
}>;
export {};
