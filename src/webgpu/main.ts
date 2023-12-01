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
(0, eval)('this').RnWebGpu = WebGpu;
