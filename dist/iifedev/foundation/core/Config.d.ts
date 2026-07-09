/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */
import { type BoneDataTypeEnum } from '../definitions/BoneDataType';
import { LogLevel } from '../misc/Logger';
type ConfigInitDescription = {
    scenegraphComponentCountPerBufferView?: number;
    skeletalComponentCountPerBufferView?: number;
    cameraComponentCountPerBufferView?: number;
    lightComponentCountPerBufferView?: number;
    maxLightNumber?: number;
    maxBoneNumberForMemoryBoostMode?: number;
    materialCountPerBufferView?: number;
    boneDataType?: BoneDataTypeEnum;
    maxSkeletalBoneNumberForUniformMode?: number;
    isUboEnabled?: boolean;
    eventTargetDom?: HTMLElement;
    cacheWebGpuRenderBundles?: boolean;
    cgApiDebugConsoleOutput?: boolean;
    multiViewForWebVR?: boolean;
    physicsTimeIntervalScale?: number;
    isMobile?: boolean;
    bufferSizeDivisionRatiosForGPUInstanceDataUsage?: number[];
    logLevel?: LogLevel;
};
/**
 * Config is a configuration class that contains the configuration for the library.
 */
export declare class Config {
    /**　The number of scenegraph components per buffer view */
    scenegraphComponentCountPerBufferView: number;
    /**　The number of skeletal components per buffer view */
    skeletalComponentCountPerBufferView: number;
    /**　The number of camera components per buffer view */
    cameraComponentCountPerBufferView: number;
    /**　The number of light components per buffer view */
    lightComponentCountPerBufferView: number;
    /**　The maximum number of lights that Rhodonite can handle */
    maxLightNumber: number;
    /**　The maximum number of bones that Rhodonite can handle for Memory Boost Mode */
    maxBoneNumberForMemoryBoostMode: number;
    /**
     * Number of instances of each material type to be placed consecutively in memory.
     * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
     * If this limit is exceeded, the material type is internally treated as a separate material type.
     */
    materialCountPerBufferView: number;
    /**　The data type of the bone */
    boneDataType: import("..").EnumIO;
    /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
    maxSkeletalBoneNumberForUniformMode: number;
    /**　Whether the UBO is enabled */
    isUboEnabled: boolean;
    /**　The event target DOM for mouse operation */
    eventTargetDom: HTMLElement | undefined;
    /**　Whether to cache the WebGPU render bundles */
    cacheWebGpuRenderBundles: boolean;
    /**　Whether to output the CG API debug console */
    cgApiDebugConsoleOutput: boolean;
    /**　Whether to enable multi-view extension for WebVR */
    multiViewForWebVR: boolean;
    /**　The scale of the physics time interval */
    physicsTimeIntervalScale: number;
    /**　Whether the device is a mobile device */
    isMobile: boolean;
    /** The buffer size division ratios for GPU instance data usage */
    bufferSizeDivisionRatiosForGPUInstanceDataUsage: number[];
    /** The minimum log level that will be output. Messages below this level are ignored. */
    logLevel: LogLevel;
    constructor(initDescription?: ConfigInitDescription);
    setUpAsMemoryBoostMode(): void;
}
export {};
