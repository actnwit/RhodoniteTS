import { ProcessApproach, type ProcessApproachEnum } from '../definitions/ProcessApproach';

/**
 * The current process approach used by the system for rendering operations.
 * Defaults to ProcessApproach.None when no specific approach is set.
 */
const currentProcessApproach: ProcessApproachEnum = ProcessApproach.None;

/**
 * Global system state object that holds various runtime configuration and state information.
 * This object contains system-wide settings that affect rendering behavior and performance.
 */
export const SystemState = {
  /**
   * The current process approach being used for rendering operations.
   * Determines whether to use WebGL2 uniform approach, data texture approach, WebGPU, or none.
   */
  currentProcessApproach,

  /**
   * The aspect ratio of the current viewport (width / height).
   * Used for camera projection calculations and responsive rendering.
   * @default 0
   */
  viewportAspectRatio: 0,

  /**
   * Flag indicating whether WebGPU render bundle mode is enabled.
   * Render bundles can improve performance by pre-recording rendering commands.
   * @default false
   */
  webgpuRenderBundleMode: false,

  /**
   * Total size in bytes of GPU shader data storage, excluding morph target data.
   * Used for memory management and optimization of GPU resource allocation.
   * @default 0
   */
  totalSizeOfGPUShaderDataStorageExceptMorphData: 0,

  xrPoseWebGPU: undefined as XRViewerPose | undefined,

  xrGpuBinding: undefined as any,

  xrProjectionLayerWebGPU: undefined as XRLayer | undefined,
};
