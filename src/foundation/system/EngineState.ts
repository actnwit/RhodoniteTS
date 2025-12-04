import { ProcessApproach, type ProcessApproachEnum } from '../definitions/ProcessApproach';

/**
 * Global engine state object that holds various runtime configuration and state information.
 * This object contains engine-wide settings that affect rendering behavior and performance.
 */
export class EngineState {
  /**
   * The current process approach being used for rendering operations.
   * Determines whether to use WebGL2 uniform approach, data texture approach, WebGPU, or none.
   */
  currentProcessApproach: ProcessApproachEnum = ProcessApproach.None;

  /**
   * The aspect ratio of the current viewport (width / height).
   * Used for camera projection calculations and responsive rendering.
   * @default 0
   */
  viewportAspectRatio = 0;

  /**
   * Flag indicating whether WebGPU render bundle mode is enabled.
   * Render bundles can improve performance by pre-recording rendering commands.
   * @default false
   */
  webgpuRenderBundleMode = false;

  /**
   * Total size in bytes of GPU shader data storage, excluding morph target data.
   * Used for memory management and optimization of GPU resource allocation.
   * @default 0
   */
  totalSizeOfGPUShaderDataStorageExceptMorphData = 0;

  xrPoseWebGPU?: XRViewerPose;

  xrGpuBinding?: any;

  xrProjectionLayerWebGPU?: XRLayer;
}
