// src/foundation/system/EngineState.ts
import { ProcessApproach } from "../definitions/ProcessApproach.js";
var EngineState = class {
  constructor() {
    /**
     * The current process approach being used for rendering operations.
     * Determines whether to use the WebGL2 data texture approach, WebGPU, or none.
     */
    this.currentProcessApproach = ProcessApproach.None;
    /**
     * The aspect ratio of the current viewport (width / height).
     * Used for camera projection calculations and responsive rendering.
     * @default 0
     */
    this.viewportAspectRatio = 0;
    /**
     * Flag indicating whether WebGPU render bundle mode is enabled.
     * Render bundles can improve performance by pre-recording rendering commands.
     * @default false
     */
    this.webgpuRenderBundleMode = false;
    /**
     * Total size in bytes of GPU shader data storage, excluding morph target data.
     * Used for memory management and optimization of GPU resource allocation.
     * @default 0
     */
    this.totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
  }
};
export {
  EngineState
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZVN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5cbi8qKlxuICogR2xvYmFsIGVuZ2luZSBzdGF0ZSBvYmplY3QgdGhhdCBob2xkcyB2YXJpb3VzIHJ1bnRpbWUgY29uZmlndXJhdGlvbiBhbmQgc3RhdGUgaW5mb3JtYXRpb24uXG4gKiBUaGlzIG9iamVjdCBjb250YWlucyBlbmdpbmUtd2lkZSBzZXR0aW5ncyB0aGF0IGFmZmVjdCByZW5kZXJpbmcgYmVoYXZpb3IgYW5kIHBlcmZvcm1hbmNlLlxuICovXG5leHBvcnQgY2xhc3MgRW5naW5lU3RhdGUge1xuICAvKipcbiAgICogVGhlIGN1cnJlbnQgcHJvY2VzcyBhcHByb2FjaCBiZWluZyB1c2VkIGZvciByZW5kZXJpbmcgb3BlcmF0aW9ucy5cbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIHVzZSB0aGUgV2ViR0wyIGRhdGEgdGV4dHVyZSBhcHByb2FjaCwgV2ViR1BVLCBvciBub25lLlxuICAgKi9cbiAgY3VycmVudFByb2Nlc3NBcHByb2FjaDogUHJvY2Vzc0FwcHJvYWNoRW51bSA9IFByb2Nlc3NBcHByb2FjaC5Ob25lO1xuXG4gIC8qKlxuICAgKiBUaGUgYXNwZWN0IHJhdGlvIG9mIHRoZSBjdXJyZW50IHZpZXdwb3J0ICh3aWR0aCAvIGhlaWdodCkuXG4gICAqIFVzZWQgZm9yIGNhbWVyYSBwcm9qZWN0aW9uIGNhbGN1bGF0aW9ucyBhbmQgcmVzcG9uc2l2ZSByZW5kZXJpbmcuXG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIHZpZXdwb3J0QXNwZWN0UmF0aW8gPSAwO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgd2hldGhlciBXZWJHUFUgcmVuZGVyIGJ1bmRsZSBtb2RlIGlzIGVuYWJsZWQuXG4gICAqIFJlbmRlciBidW5kbGVzIGNhbiBpbXByb3ZlIHBlcmZvcm1hbmNlIGJ5IHByZS1yZWNvcmRpbmcgcmVuZGVyaW5nIGNvbW1hbmRzLlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgd2ViZ3B1UmVuZGVyQnVuZGxlTW9kZSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUb3RhbCBzaXplIGluIGJ5dGVzIG9mIEdQVSBzaGFkZXIgZGF0YSBzdG9yYWdlLCBleGNsdWRpbmcgbW9ycGggdGFyZ2V0IGRhdGEuXG4gICAqIFVzZWQgZm9yIG1lbW9yeSBtYW5hZ2VtZW50IGFuZCBvcHRpbWl6YXRpb24gb2YgR1BVIHJlc291cmNlIGFsbG9jYXRpb24uXG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIHRvdGFsU2l6ZU9mR1BVU2hhZGVyRGF0YVN0b3JhZ2VFeGNlcHRNb3JwaERhdGEgPSAwO1xuXG4gIHhyUG9zZVdlYkdQVT86IFhSVmlld2VyUG9zZTtcblxuICB4ckdwdUJpbmRpbmc/OiBhbnk7XG5cbiAgeHJQcm9qZWN0aW9uTGF5ZXJXZWJHUFU/OiBYUkxheWVyO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsdUJBQWlEO0FBTW5ELElBQU0sY0FBTixNQUFrQjtBQUFBLEVBQWxCO0FBS0w7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQ0FBOEMsZ0JBQWdCO0FBTzlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBc0I7QUFPdEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtDQUF5QjtBQU96QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsMERBQWlEO0FBQUE7QUFPbkQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
