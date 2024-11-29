import { WebGpuDeviceWrapper } from './WebGpuDeviceWrapper';
import { WebGpuResourceRepository } from './WebGpuResourceRepository';
import { WebGpuStrategyBasic } from './WebGpuStrategyBasic';

const WebGpu = Object.freeze({
  WebGpuDeviceWrapper,
  WebGpuResourceRepository,
  WebGpuStrategyBasic,
});
export default WebGpu;

export type RnWebGpu = typeof WebGpu;
const globalObj =
  typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
(globalObj as unknown as { RnWebGpu: RnWebGpu }).RnWebGpu = WebGpu;
