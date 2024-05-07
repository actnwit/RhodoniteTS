import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';
import { WebGpuStrategyBasic } from './WebGpuStrategyBasic';
declare const WebGpu: Readonly<{
    WebGpuDeviceWrapper: typeof WebGpuDeviceWrapper;
    WebGpuResourceRepository: typeof WebGpuResourceRepository;
    WebGpuStrategyBasic: typeof WebGpuStrategyBasic;
}>;
export default WebGpu;
export type RnWebGpu = typeof WebGpu;
