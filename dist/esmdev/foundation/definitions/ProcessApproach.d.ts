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
declare const isWebGpuApproach: (processApproach: ProcessApproachEnum) => boolean;
declare const isWebGL2Approach: (processApproach: ProcessApproachEnum) => boolean;
export declare const ProcessApproach: Readonly<{
    isWebGpuApproach: typeof isWebGpuApproach;
    None: ProcessApproachClass;
    WebGL2: ProcessApproachClass;
    WebGPU: ProcessApproachClass;
    from: typeof from;
    isWebGL2Approach: typeof isWebGL2Approach;
}>;
export {};
