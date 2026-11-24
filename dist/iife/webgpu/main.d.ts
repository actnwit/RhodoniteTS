import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';
import { WebGpuStrategyBasic } from './WebGpuStrategyBasic';
declare const WebGpu: Readonly<{
    wgslCommonChunks: Readonly<{
        alphaProcess: string;
        boneDecode: string;
        fullscreen: string;
        iblDefinition: string;
        mainPrerequisites: string;
        opticalDefinition: string;
        outputSrgb: string;
        pbrDefinition: string;
        prerequisites: string;
        processGeometry: string;
        shadow: string;
        vertexInput: string;
        vertexOutput: string;
        wireframe: string;
    }>;
    WebGpuDeviceWrapper: typeof WebGpuDeviceWrapper;
    WebGpuResourceRepository: typeof WebGpuResourceRepository;
    WebGpuStrategyBasic: typeof WebGpuStrategyBasic;
}>;
export default WebGpu;
export type RnWebGpu = typeof WebGpu;
