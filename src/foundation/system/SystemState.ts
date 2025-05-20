import { ProcessApproachEnum, ProcessApproach } from '../definitions/ProcessApproach';

const currentProcessApproach: ProcessApproachEnum = ProcessApproach.None;

export const SystemState = {
  currentProcessApproach,
  viewportAspectRatio: 0,
  webgpuRenderBundleMode: false,
  totalSizeOfGPUShaderDataStorageExceptMorphData: 0,
};
