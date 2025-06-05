/**
 * A wrapper class for WebGPU device management and canvas context configuration.
 * This class encapsulates the WebGPU adapter, device, and canvas context,
 * providing a convenient interface for WebGPU rendering operations.
 */
export class WebGpuDeviceWrapper {
  private __canvas: HTMLCanvasElement;
  private __gpuAdapter: GPUAdapter;
  private __gpuDevice: GPUDevice;
  private __context: GPUCanvasContext;

  /**
   * Creates a new WebGpuDeviceWrapper instance.
   * Initializes the WebGPU context and configures the canvas with the provided device.
   *
   * @param canvas - The HTML canvas element to be used for WebGPU rendering
   * @param gpuAdapter - The WebGPU adapter for the graphics hardware
   * @param gpuDevice - The WebGPU device for executing GPU operations
   */
  constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice) {
    this.__canvas = canvas;
    this.__context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
    this.__gpuAdapter = gpuAdapter;
    this.__gpuDevice = gpuDevice;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.__context.configure({
      device: this.__gpuDevice,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });
  }

  /**
   * Gets the HTML canvas element associated with this wrapper.
   *
   * @returns The canvas element used for WebGPU rendering
   */
  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }

  /**
   * Gets the WebGPU adapter associated with this wrapper.
   *
   * @returns The WebGPU adapter representing the graphics hardware
   */
  get gpuAdapter(): GPUAdapter {
    return this.__gpuAdapter;
  }

  /**
   * Gets the WebGPU device associated with this wrapper.
   *
   * @returns The WebGPU device for executing GPU operations
   */
  get gpuDevice(): GPUDevice {
    return this.__gpuDevice;
  }

  /**
   * Gets the WebGPU canvas context associated with this wrapper.
   *
   * @returns The configured WebGPU canvas context for rendering
   */
  get context(): GPUCanvasContext {
    return this.__context;
  }
}
