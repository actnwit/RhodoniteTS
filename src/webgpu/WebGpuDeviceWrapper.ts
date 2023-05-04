export class WebGpuDeviceWrapper {
  private __canvas: HTMLCanvasElement;
  private __gpuAdapter: GPUAdapter;
  private __gpuDevice: GPUDevice;
  private __context: GPUCanvasContext;

  constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice) {
    this.__canvas = canvas;
    this.__context = canvas.getContext('webgpu') as GPUCanvasContext;
    this.__gpuAdapter = gpuAdapter;
    this.__gpuDevice = gpuDevice;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.__context.configure({
      device: this.__gpuDevice,
      format: presentationFormat,
      alphaMode: 'opaque',
    });
  }

  get canvas(): HTMLCanvasElement {
    return this.__canvas;
  }

  get gpuAdapter(): GPUAdapter {
    return this.__gpuAdapter;
  }

  get gpuDevice(): GPUDevice {
    return this.__gpuDevice;
  }

  get context(): GPUCanvasContext {
    return this.__context;
  }
}
